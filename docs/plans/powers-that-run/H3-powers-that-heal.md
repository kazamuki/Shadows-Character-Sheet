# Work order H3: powers that heal

**Plan:** [`powers-that-run.md`](../powers-that-run.md), session H3. **Wish:** **W132** (Ken, from re-running P21's pre-flight), its "heal" half.
Decisions 105, 135, 189, 195, 199, 220, 225, 236, 257, 266, 267.
**Status:** **drafted 2026-11-05 by Claude (Opus)**, the H2 reviewer acting as orchestrator. Pre-flighted against `main` at `f85b7d5` (PR #299
merged: app 0.62.0 under `[Unreleased]`, game data 0.53 unreleased, character schema 0.34, table 0.19, pack 0.3; the last decision is 267).
**Approved by Ken 2026-11-05** ("All defaults, flag 22 & 23", in the H1 conductor session): HQ19–HQ25, with HQ22 and HQ23 also sent to Deighton as book items (plan §6).
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** It touches `engine.js`'s Turn Reset, form and running code, and `sheet.js`'s Reset panel and power card, which every
powers order shares (`WORK-ORDERS.md`, *Running more than one at once*). It touches `engine.js` (`formGrants`, `formState`, `setToggle`,
a round's heals, `resolveReset`/`applyReset`, Vitality Surge's press, `aberrationState`, `resolveEncounterReset`), `sheet.js` (the Reset
panel and its commit label, the power card, the HP popover, the Form switch's label), `gm.js` (the encounter Reset's seat line), the data,
tests and docs. **No character schema bump** (§2): nothing new is stored.

**Carried over** from H2 (PR #299), the last order and its review:
- *The order's misses.*
  - A probe gave a BOD 8 Draugur 17 SFR. 17 is BOD 6's number; BOD 8's is 23 (SFR's WILL moves with BOD in this build). No worked
    example depended on it, because the tests read the pool from the engine. Here every probe was re-run at `f85b7d5` and pasted from
    the output, and every example that needs a pool reads it from `Engine.sfr`.
  - A test it didn't list broke: smoke-roster B17 asserted every string in a starter row is on screen, and the new row `id` isn't. §13
    here lists every test the pre-flight found pinning what H3 moves, by grep.
  - It didn't say whether a reaction that cuts nothing still pays. Ken ruled it's free, and only a real spend is refused (PR #299,
    issuecomment-6673968620). §8b here says, for every spend, what happens at 0.
  - Its seat-hit sentence named two powers no character holds together. Ken ruled the line names only the copy's power. §9's seat line
    here is built from what the copy has.
  - Its review found two gaps the order itself left: the GM's seat preview, a reader of `resolveHit`'s result the sweep didn't list,
    said the vest stopped an immune hit (S1); and the grants' `magical` key was data no code read (S2, Decision 135). So here every new
    data key has a named reader in §8b, and every reader of `resolveReset`'s result is a sweep row, the GM's twin included.
- *The build's misses.* S1 and S2 above. The seat preview's Wither Ward and Silverscar lines shipped with no test reading them (the
  review's `20e7a80`): a new line on a GM panel needs its own assertion.
- *Still standing from H1* (PR #297, Ken's issuecomment-6667114721):
  - the decision stays under 350 words with its Why and Rejected intact;
  - a refused control is disabled **and** says why on the page (`data-runwhy`'s pattern), never only in a `title`;
  - a spend the pool can't cover is refused with "${name} needs ${n} SFR, ${left} left.";
  - every new sentence after a press goes on the commit label (the Undo toast), never a second toast;
  - `phone-check`'s frame fixture seeds only an arcanist, so no frame opens a power card, the Reset panel or a form.
- *Ken's answers on H2* (PR #299, issuecomment-6673968620): a tick that spends nothing is free; voice drafts taken ("−4 for 2 SFR",
  "The field is spent.", the commit label without "immune", the seat line naming only what the copy holds).
- *What H3 starts from.* H1 built `runningPowers` as the one reader of "running" and Turn Reset's charge (`resolveReset`'s `running`,
  `chargeRunning`). H2 added `each: "start"` and starter rows. Blood of Valhalla already runs (`each: "round"`) and costs SFR, but heals
  nothing. Vitality Surge is held by every Vampire (Innate, rank 1) and is text. Regeneration is a Werewolf baseline trait with text only.
  Quick Clot is an Aberration with text only. Fast Metabolism (c46) is already built (`naturalHealingTimes`, Decision 236) and isn't here.

**The pre-flight found, in short:**

1. **"A round" is Turn Reset.** The sheet has no round counter. The player's Turn Reset (`resolveReset`, `engine.js:2836`) is where a
   round ends: Bleeding ticks there and H1 charges sustained powers there. So "regenerate 1 HL per round" and "rank HL each round" heal
   at Reset. Out of a fight nobody presses Reset; the player heals with Heal, as now (§7).
2. **"Never Withering" is one rule for all three heals.** Regeneration ("never restores Withering"), Blood of Valhalla ("never
   Withering") and Vitality Surge ("Can't restore Withering"), and the data's own definition of Withering (`shadows-data.js:4121`:
   "cannot be regenerated supernaturally"). `heal()` and `healStep()` today *can* lower `witheringDamage` (they trim it to the damage
   left), so a supernatural heal must be capped before it reaches `_healMath`, or it eats Withering. This is a trap (§15).
3. **An HL is `hpPer` HP**, read at the moment of the heal (`hlState`, `engine.js:1338`). A Wildblood with BOD 6 has `hpPer` 5 in both
   forms (6 levels human, 10 in Werewolf form). Healing counts from 0 HP (Decision 220): damage past zero is wiped first.
4. **Regeneration belongs to the form.** `0414:172` lists it among what Werewolf form gives, and Decision 195 says a toggle option
   carries what being in it does. The form also ends when Withering reaches half the HL (`endsAtWithering`), which `formView(ch).ended`
   already computes (`engine.js:703`) without shifting back. A Werewolf whose form has ended by Withering must not regenerate, though
   the toggle still reads Werewolf. Bone and Sinew is a Major, and Majors already change the form through `formGrants`
   (`engine.js:591`, Decision 199).
5. **Bone and Sinew does two things**: Regeneration restores 2 HL (instead of 1), and "shifting into Werewolf form ends Maimed".
   `setToggle` (`engine.js:731`) is the one writer of a shift, and it already stops powers in the shift's commit (H1).
6. **Vitality Surge is a press, not a running power.** "Fast Action: heal up to your rank in HL per round", "2 SFR per HL healed". It
   costs per HL, not per rank, so `run` can't say it. Blood of Valhalla's text says "Vitality Surge can't be used while active".
7. **Quick Clot is an Aberration** (`shadows-data.js:5252`). `aberrationState` (`engine.js:3755`) already reads one Aberration key
   (`naturalHealingTimes`) into a number the rest of the engine uses.
8. **A GM's encounter Reset ticks a claimed row** (`resolveEncounterReset`, `engine.js:9330`; Decision 257), but the row keeps no
   Withering (`_seatStandIn` drops it with the clone). A heal on the row can't honour "never Withering", so the GM's Reset can't heal it.
9. **The data's Regeneration text has drifted from the book.** `0414:72` reads "While shifted, regenerate 1 HL per round"; the data
   (`shadows-data.js:3202`) reads "While transformed". The order restores the book's words.

**Probes on `main` at `f85b7d5`** (each is the "before" of a §10 row; characters are built as `engine.test.mjs`'s helpers do, locked,
stats 6 unless named):

| Character | Today |
|---|---|
| Street Wildblood (BOD 6), Werewolf form | `hlState`: 10 levels, `hpPer` 5, total 50. Damage 20, Withering 5, `applyReset` → damage 20, Withering 5. `resolveReset(ch, {}).hasEffect` false |
| The same, damage 25 and Withering 25 | `formView(ch).ended` true (total 50, half is 25) |
| Street Wildblood with Bone and Sinew, Maimed (left arm), shifts to Werewolf | `setToggle` ok; Conditions still `["maimed:left-arm"]` |
| Street Forge Fang shifts | `cost` `{ hl: 1, hp: 5, withering: true }`; damage 5, Withering 5 |
| Heroic Draugur (BOD 6), Blood of Valhalla rank 2 (`basePowers`) | `hpPer` 5, total 30. `startPower` spends 4. Damage 20, Withering 4, `applyReset` → damage 20, `charged` `[{ id: "blood-of-valhalla", sfr: 4 }]`, spent 8, turn 4 |
| any Vampire | `archetypePowers` holds `vitality-surge` at rank 1; nothing presses it |
| Arcanist with Quick Clot (permanent), Bleeding, damage 3 | `applyReset` → damage 4, Conditions `["bleeding"]` |

---

## 1. Goal and Done when

When this is merged:

1. **A Werewolf in Werewolf form regenerates at Turn Reset**: 1 HL, or 2 with Bone and Sinew, never Withering. Not in human form,
   and not once Withering has ended the form.
2. **Blood of Valhalla heals rank HL at Turn Reset** while it runs, never Withering.
3. **Vitality Surge heals on a press**: the player picks 1 to rank HL, and the sheet spends 2 SFR an HL in the same commit. It's
   refused, with the reason on the page, when the pool can't pay, while Blood of Valhalla runs, or when only Withering is left.
4. **Quick Clot ends Bleeding at Turn Reset.**
5. **Bone and Sinew ends Maimed** when the character shifts into Werewolf form, in the shift's commit.
6. **Turn Reset says what healed** and what ended, on the panel and on the commit label, and one undo takes it all back.
7. **A GM's encounter Reset** writes nothing new to a claimed row, and says in one line what heals on the player's own sheet.
8. **Nothing else moves**, shown by an outputs diff (§11).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** One decision, **N** (the lowest free number on `origin/main` when you write it; 268 at the pre-flight).
- **App:** `[Unreleased]` heads **0.62.0** at the pre-flight, a minor not yet released (H1 and H2). Add to it and don't bump. If 0.62.0
  is released before you build, `npm run bump -- 0.63.0`. Say which in the PR.
- **Game data:** a computed value moves (Reset's damage, a shift's Conditions). At the pre-flight 0.53 is unreleased (H1 set it), so no
  bump (Decision 68's unreleased rule, as H1 and H2 did). If it has shipped, 0.54.
- **Character schema: no bump.** Nothing is stored: every heal is computed from the form, `running`, the Majors, the Aberrations and
  the damage, at the press. Check it: a 0.34 file round-trips through `migrate()` unchanged.
- **Table and pack schemas: no bump.** The GM's Reset gains a line; the table stores nothing new.
- **No flag opens or closes.** HQ22 and HQ23 read the book where it's quiet. If Ken would rather Deighton rule, they become flags
  instead of defaults, and the build stubs them as §13 says.

## 3. The decision, drafted

Paste as **N** in `SCHEMA.md` §4, with an INDEX §3 line under the topic Decisions 266 and 267 are filed under. The draft is
**313 words** by `docs.test.mjs`'s count. If the build's wording grows it past `docs.test.mjs`'s 350, trim *Decided*, never *Rejected* or *Why*.

```
N. **A round's healing happens at Turn Reset: Regeneration while the form holds, Blood of Valhalla while it runs, Quick Clot ends Bleeding; Vitality Surge heals on a press that spends; none of them restores Withering.**
     *2026-11-xx · Ken + Claude · Touches: roundHeals, regenerates, roundHeal, resetEnds, ends, surge, blocks, resolveReset, applyReset, formGrants, formState, setToggle, surgePower, witheringDamage, Turn Reset, resolveEncounterReset, W132*
     - **Decided:** At Turn Reset, after ongoing damage ticks, the character heals what `roundHeals` lists: the form's `regenerates` HL (a form grant may raise it) unless Withering ended the form, and each running power's `roundHeal`; an Aberration's `resetEnds` Conditions end. Vitality Surge's `surge` heals 1 to rank HL on a press, spending `sfr.perHl` an HL through the tracker's writer, unless a running power `blocks` it. A form grant's `ends` removes those Conditions on shifting in. No supernatural heal lowers `witheringDamage`. Nothing new is stored.
     - **Why:** W132; `0413`, `0414` ("While shifted, regenerate 1 HL per round"; "never Withering"); a round ends at Turn Reset (Decisions 189, 225, 266), and healing counts from 0 HP (Decision 220).
     - **Rejected:** a round counter, or a heal-per-round button outside Reset (the sheet knows no round but Reset; W128); Regeneration as a running power (it costs nothing, and the form carries it, Decision 195); a heal through `heal()` uncapped (it trims Withering); storing the HL surged this round (HQ21); healing a GM's claimed row (it keeps no Withering, Decision 257); healing that ends Dying (only a Nanomed Kit does, Decision 105).
     - **Replaces:** nothing; extends 195 (the form carries Regeneration), 220 (who heals at Reset) and 266 (what a running power does at Reset).
     - **Revisit if:** W128 knows a round or a scene; the book says the form ends at Unconscious on the sheet's side; a table asks for Vitality Surge's per-round cap.
     - **Built:** app 0.6x.0, game data 0.5x, PR #…, log 2026-11-xx (H3).
```

**Supersession marks:** none. Search §4's Touches for `resolveReset`, `applyReset`, `formState`, `formGrants`, `setToggle`, `heal`,
`witheringDamage` and `aberrationState`. At the pre-flight that's 189, 195, 199, 202, 220, 224, 225, 236, 237 and 266, and none is
contradicted:

- **189** (the GM's Reset lists ticks): unchanged; a claimed row gains one line.
- **195 and 199** (the form): extended; the option and a Major's form grant gain `regenerates` and `ends`.
- **202** (Pain Immunity reads Withering): unchanged; no heal lowers Withering.
- **220** (healing from 0 HP): every new heal goes through `_healMath`.
- **224** (a held spell's check at Reset): unchanged; `prompts.concentration` reads the ticks, as now.
- **225 and 266** (the round and its SFR): Vitality Surge spends through `adjustPanelTracker`; Reset still clears, then charges.
- **236 and 237** (Rapid Healing; trait rows): unchanged; neither reads a new key.

## 4. Questions for Ken

Each has a default. A question left blank is answered "Default" (`WORK-ORDERS.md`). H2 used HQ11–HQ18; these continue. HQ22 and HQ23
read the book where it's quiet, and Ken may want Deighton's word on them.

| Id | Question | Default | Answer |
|---|---|---|---|
| HQ19 | **When in Turn Reset a round heals** | **After the ongoing damage ticks.** At Zero, Dying and a held spell's check are asked from the ticks, as now. Then the heals apply, and the panel shows both. So Bleeding that drops a Werewolf to 0 still asks At Zero, even if Regeneration brings it back. The alternative nets the two first, so a tick that regeneration covers asks nothing | **Ken, 2026-11-05: the default** ("All defaults, flag 22 & 23", in the H1 conductor session). |
| HQ20 | **Blood of Valhalla at a Reset that stops it** (Stop ticked, or the pool can't pay the next round) | **It heals for the round that ends.** That round was paid, at Start or at the last Reset. The alternative heals only if it keeps running | **Ken, 2026-11-05: the default** ("All defaults, flag 22 & 23", in the H1 conductor session). |
| HQ21 | **Vitality Surge's "up to your rank in HL per round"** | **One press heals 1 to rank HL; the sheet doesn't count presses in a round.** Counting would store what was surged this round and clear it at Reset, a schema bump for a limit the table already polices, as Rate of Use is warned and not blocked (Decision 225). The alternative stores it | **Ken, 2026-11-05: the default** ("All defaults, flag 22 & 23", in the H1 conductor session). |
| HQ22 | **Quick Clot: does Bleeding tick at the Reset it ends?** "Bleeding ends on its own at the next Reset" | **It ticks once, then ends.** "Almost as fast as they open" reads as a wound that costs a little. The alternative is that it ends without ticking, so a Quick Clot character never loses HP to Bleeding | **Ken, 2026-11-05: the default, and to Deighton as a book item** (plan §6; "All defaults, flag 22 & 23", in the H1 conductor session). |
| HQ23 | **Regeneration when the form has ended but the toggle still says Werewolf** | **Withering's end is read** (`formView.ended`, which exists) and stops Regeneration, with the reason on the Reset panel. **Unconscious is not read**: the book ends the form there too ("when you are knocked unconscious"), but the sheet leaves the toggle to the player and doesn't end it on a Condition. The alternative also stops Regeneration while Unconscious is active | **Ken, 2026-11-05: the default, and to Deighton as a book item** (plan §6; "All defaults, flag 22 & 23", in the H1 conductor session). |
| HQ24 | **A GM's encounter Reset on a claimed row whose copy would heal** | **Write nothing new, and say so in one line on that row**: "Regeneration heals on the player's own sheet." (naming only what the copy has, H2's rule). The row keeps no Withering (Decision 257), so it can't honour "never Withering". The alternative heals the row anyway | **Ken, 2026-11-05: the default** ("All defaults, flag 22 & 23", in the H1 conductor session). |
| HQ25 | **Bone and Sinew's "shifting into Werewolf form ends Maimed"** | **Every Maimed ends, on every body part, in the shift's commit**, and the switch's label says which. Shifting back to human ends nothing. The alternative asks which one | **Ken, 2026-11-05: the default** ("All defaults, flag 22 & 23", in the H1 conductor session). |

## 5. The assumption sweep

Grepped at `f85b7d5`. Line numbers are as of the pre-flight.

| What | Today (where) | After | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| The Werewolf option's data | `stats`, `naturalWeapons`, `bars`, `costFrom`, `endsAtWithering`, `summaryText`, `endsText` (`shadows-data.js:3320`) | + `"regenerates": { "hl": 1, "trait": "regeneration" }`; `summaryText` adds "Regenerates 1 HL a round." | `hasForm` (`engine.js:679`) reads only `stats`, `naturalWeapons`, `bars`, so the new key doesn't change which option is a form; the Form card on Main and Loadout renders `summaryText` (grep `summary` in `src/ui`); the outputs diff (§11) |
| `formGrants(ch)` | `{ withering, weaponTags, barsPenalty, by }` from taken Majors' `form` grants (`engine.js:591`) | + `regenerates` (the highest number, or null) and `ends` (Condition ids, each once) | `formState` (its only caller, `engine.js:682`), `toggleCost`'s `withering`; `tests/engine.test.mjs` doesn't pin its shape (grep `formGrants(` in `tests/`: no hit) |
| `formState(ch)` | `{ panelId, name, stats, bars, weaponTags, changedBy, naturalWeapons, endsAtWithering, summary, endsText }` | + `regen: { hl, name, by } \| null` (the option's `regenerates.hl`, raised by `formGrants.regenerates`; `name` is the trait's; `by` the Major's name when it raised it) | `statTable`, `formView`, `health`, `skillLine` read other keys; the outputs tool snapshots `statTable` and `health` only (`tools/outputs.mjs:71`) |
| `setToggle` | stops running powers on leaving their form; returns `{ ok, cost, stopped }` (`engine.js:731`) | entering an option where `hasForm` (from one that isn't) removes each active Condition in `formGrants(ch).ends`; returns `ended: [{ id, name, location }]` too | the Form switch's binder builds its label from a clone's `setToggle` (`sheet.js:4266–4267`): add the ended Conditions to it; `smoke-*` tests that read the Form's toast (grep `Form: Werewolf` in `tests/`) |
| `aberrationState(ch)` | `{ active, permanent, temporary, painLevels, healTimes, adjust }` (`engine.js:3755`) | + `resetEnds: [{ id, by }]` from each active Aberration's `resetEnds` | `painState`, `naturalHealing`, `keepCurrentTOL`, the Aberrations list; none reads a new key |
| `resolveReset(ch, input)` | ticks → `after` → prompts → `turnSpend`, `running`; `hasEffect` (`engine.js:2836`) | + `heals: [{ id, name, hl, hp, why }]` (HP actually healed; `why` when it can't heal), `ends: [{ index, id, name, by }]`, `final` (the `hlState` after the heals); `after` and the prompts are still the ticks' (HQ19); `hasEffect` also true when a heal is > 0 or a Condition ends | `resetPanelHtml` (`sheet.js:1229`), the Reset binder's label (`sheet.js:3796–3805`), `engine.test.mjs` 1587, 8794–8801, 12574, 12691 (`hasEffect` false on idle characters: still false, since none of them heals), `smoke-sheet-play.test.mjs:411` (the label "Turn Reset: 1 damage") |
| `applyReset` | writes `after.damage`, clears the round, charges running powers, adds At Zero's Conditions, marks (`engine.js:2874`) | writes `final.damage`; Withering is untouched; removes `ends`' Conditions (highest index first, after At Zero's are added); charges running powers as now | the Reset binder; the undo diff (one commit) |
| `trackers.witheringDamage` | trimmed to the damage by `heal`, `healStep` | a round's heal and Vitality Surge are capped at `min(damage, capacity) − witheringDamage` before `_healMath`, so they never lower it | `painState` (Pain Immunity, Decision 202), `formView.ended`, the Withering line on Main |
| Blood of Valhalla | `run` only (`shadows-data.js:3062`) | + `"grants": [{ "type": "roundHeal", "perRank": 1 }]`, `"blocks": ["vitality-surge"]` | `runningPowers`' `def.grants`; `naturalArmor` scans archetype power grants but returns at `g.type!=="naturalArmor"`; `traitRows` (wide) reads only Skill row types; `grants()` ignores an unknown type (check its default branch) |
| Vitality Surge | text only (`shadows-data.js:3033`) | + `"surge": { "hl": { "perRank": 1 }, "sfr": { "perHl": 2 } }` | the power card (`sheet.js:600`) and the HP popover (`sheet.js:1455`); the `cost` text "2 SFR per HL healed" (a rules test checks the two agree, §10 row 11) |
| Bone and Sinew | no `grants` (`shadows-data.js:3419`) | + `"grants": [{ "type": "form", "regenerates": 2, "ends": ["maimed"] }]` | `formGrants`; `checkPrereqs` and `majorOffered` don't read grants; the Major's card lists its benefit text, unchanged |
| Quick Clot | text only (`shadows-data.js:5252`) | + `"resetEnds": ["bleeding"]` | `aberrationState`; the Aberrations list renders `description`, unchanged |
| Regeneration's benefit | "While transformed, regenerate…" (`shadows-data.js:3202`) | "While shifted, regenerate…", the book's words (`0414:72`) | `rules.test.mjs`'s CRB pins for `0414` (grep `Regeneration` in `tests/rules.test.mjs`); the Character tab's Baseline Traits |
| `resolveEncounterReset` | ticks, expiring, recovery, Dying, per row (`engine.js:9330`) | a claimed row gains `heals: [names]` from `roundHeals` of its stand-in, and nothing more | the GM's Reset panel (grep `resolveEncounterReset` in `src/ui/gm.js`); `smoke-table-*` Reset tests (unchanged rows: no heal on an arcanist or an NPC) |

**Not touched, checked:** `heal()` and `healStep()` (Rest, Focused Healing, Nanomed and the stepper keep trimming Withering, as the
book's natural healing may restore it); `naturalHealing` (Rapid Healing, Fast Metabolism); `chargeRunning` and `resetRunning` (H1);
`runningPowers` (Blood of Valhalla is already one of its rows); `migrate` (nothing stored); the wizard (nothing heals before lock);
`hitPrompts`; GM mode's NPC rows (no form, no Aberration list); `logSession` (it stops powers; it doesn't heal).

## 6. Read first

- `CLAUDE.md`, `docs/STATE.md`, the plan (§2.5–§2.6 and §3), and H1's and H2's orders (what you extend).
- Decisions **105, 189, 195, 199, 220, 225, 257, 266, 267**.
- `src/engine/engine.js`: `formGrants` (591), `hasForm`/`formState`/`formView` (679–720), `setToggle` (731), `removeCondition` (1320),
  `hlState` (1338), `heal`, `_healMath`, `healStep` (2782–2826), `resolveReset`/`applyReset` (2836–2898), `aberrationState` (3755), the
  running block (`runCost` … `chargeRunning`, ~4160–4290), `resolveEncounterReset` (9330).
- `src/ui/sheet.js`: the power card (600), `runCardHtml` (1010), `resetPanelHtml` (1229), `vitalPopover`'s `hp` (1455), the Reset
  binder (3796), the Form switch's binder (4261). `src/ui/gm.js`: the encounter Reset panel (grep `resolveEncounterReset`).
- `private/crb/0414_Werewolf.md` (Regeneration 72 and 172, Silver 357, Bone and Sinew 515), `0413_Vampire.md` (Vitality Surge 206, Blood
  of Valhalla 391), `0540` (Bleeding, Maimed), Appendix Aberrations (Quick Clot).

## 7. Out of scope

- **A round outside Turn Reset.** No heal-a-round button, and no countdown (plan §2.6). Out of a fight, the player heals with Heal.
- **Between Forms** (Trueborn Major: Regeneration without shifting, for WILL rounds). It's a scene-long piece of the form, and it waits
  on W128 for its scene.
- **Blood of Valhalla's crash** ("−4 … for 1d4 rounds, and it can't restart until then") and its +2 melee damage.
- **Vitality Surge at rank 5** ("severed limbs regenerate"): Maimed stays the player's to remove there.
- **Seta-16 suppressing Regeneration** (`0414:138`): lore, no number.
- **The form ending at Unconscious** (HQ23), and **Withering forcing the shift back**: the engine says the form ended; it never shifts.
- **Healing ends Dying.** It doesn't: only a Nanomed Kit stabilizes (Decision 105). A Werewolf that regenerates out of 0 HP is still
  Dying until the player or GM removes it.
- **Fast Metabolism** (already built, Decision 236), and **Battle Hardened and Elemental Blood** (plan §6, waiting on the book).
- **A GM writing a seat** (Decision 257).

## 8. The shapes

### 8a. Data

1. **The Werewolf option** (`shadows-data.js:3320`) gains `"regenerates": { "hl": 1, "trait": "regeneration" }` (`trait` names the
   baseline trait whose name the sheet shows), and `summaryText` adds "Regenerates 1 HL a round."
2. **Bone and Sinew** gains `"grants": [{ "type": "form", "regenerates": 2, "ends": ["maimed"] }]`.
3. **Blood of Valhalla** gains `"grants": [{ "type": "roundHeal", "perRank": 1 }]` and `"blocks": ["vitality-surge"]`.
4. **Vitality Surge** gains `"surge": { "hl": { "perRank": 1 }, "sfr": { "perHl": 2 } }`. Its `cost` stays "2 SFR per HL healed".
5. **Quick Clot** gains `"resetEnds": ["bleeding"]`.
6. **Regeneration's benefit** reads "While shifted, regenerate 1 HL per round. …" (`0414:72`).
7. **A comment** beside the first new key naming Decision N, the Reset stage, and "never Withering".

Nothing is stored. A 0.34 file round-trips unchanged.

### 8b. Engine

Every reader stays total (constraint 8): a `regenerates`, `roundHeal`, `surge`, `ends` or `resetEnds` with strings for numbers, an
unknown Condition id, or a missing trait counts as nothing, never NaN, never a throw.

1. **`formGrants`** adds `regenerates` (the highest finite number ≥ 0 across form grants, or null) and `ends` (Condition ids that exist,
   each once). **`formState`** adds `regen: { hl, name, by }` when the option has `regenerates`: `hl` is the larger of the option's
   `hl` and `formGrants.regenerates`; `name` is the trait's name (the option's `trait` looked up in the archetype's `baselineTraits`),
   or the option's own `name` when that trait is missing, so no word is typed in code; `by` is the Major's name when its grant raised
   the number, else null.
2. **`roundHeals(ch)`** → `[{ id, name, hl, hp, why }]`, the one reader of what heals at the next Reset:
   - the form's `regen`, when `formState` has one, with `why` "The form has ended." when `formView(ch).ended`;
   - each `runningPowers(ch)` row whose `def.grants` has a `roundHeal`: `hl` = `perRank × rank + plus`.
   `hp` is computed by the one cap (8b.3) against the character as it stands, in order, each heal seeing the last one's result.
3. **The cap**, one helper beside `_healMath`: a supernatural heal of `hl` HL is `min(hl × hpPer, max(0, min(damage, capacity) −
   witheringDamage))` HP, then `_healMath(hs, hp, false, houseRules)` (so damage past zero is wiped first, Decision 220). It never
   writes `witheringDamage` lower. At 0 HP to heal it heals 0 and says why: "Only Withering is left." or "Nothing to heal.".
4. **`resolveReset`**: after the ticks and the prompts (HQ19), `heals` runs `roundHeals` against the ticked state, `ends` lists each
   active Condition named by an Aberration's `resetEnds` (Quick Clot), with `by`. `final` is `hlState` after the heals. `hasEffect` is
   also true when any heal's `hp` > 0 or `ends` isn't empty.
5. **`applyReset`** re-resolves, writes `final.damage`, removes `ends`' Conditions (by id and index, after At Zero's are added, so an
   index never shifts under it), and charges running powers as now. One commit, one undo.
6. **Vitality Surge**: `surgeable(ch)` → `[{ id, name, rank, maxHl, sfrPerHl, can: { ok, why, short } }]` for each held power with a
   valid `surge`; `maxHl` = `min(hl.perRank × rank + hl.plus, ceil(healable HP / hpPer))`. `surgePower(ch, id, hl)`:
   - refuses an unlocked sheet ("Powers run once the character is locked.", short "Locked sheets only");
   - refuses while a running power's `blocks` names it ("Vitality Surge can't be used while Blood of Valhalla runs.", short "Not while
     Blood of Valhalla runs");
   - refuses when nothing but Withering is left ("Only Withering is left, and Vitality Surge can't heal it.", short "Only Withering
     left") or there's no damage ("Nothing to heal.", short "Nothing to heal");
   - refuses `hl` outside 1…`maxHl` ("Pick 1 to N HL.");
   - refuses what the pool can't pay, the H1 pattern: "Vitality Surge needs 4 SFR, 3 left." (short "Not enough SFR");
   - otherwise heals through 8b.3 and spends `hl × perHl` through `adjustPanelTracker` (the one writer that counts a round), and returns
     `{ ok, name, hl, hp, sfr, before, after, overCap }` (`overCap` as `startPower` reports it).
   The spend is for the HL picked, and the picker can't offer an HL that heals nothing, so nothing is ever charged for 0.
7. **`setToggle`**: when the new option has a form and the old one didn't, remove every active Condition in `formGrants(ch).ends`
   (HQ25), highest index first, and return them as `ended`. Shifting back ends nothing.
8. **`resolveEncounterReset`**: a claimed row's stand-in (`_seatStandIn`) gives `heals: roundHeals(copy).filter(h=>!h.why).map(h=>h.name)`.
   Nothing is written (HQ24).
9. **Nothing else changes**: `heal`, `healStep`, `naturalHealing`, `chargeRunning`, `resetRunning`, `runningPowers`, `migrate`,
   `versionCheck`, `migrateTable`.

## 9. The UI

Copy is drafted for a **voice pass** (tool voice for controls and refusals). Every new sentence after a press goes on the commit label
(the Undo toast), never a second toast.

| Where | Today | After |
|---|---|---|
| Turn Reset panel, a heal | — | one line per heal, after the ticks' line: "Regeneration heals 1 HL: 20 → 15." / "Blood of Valhalla heals 2 HL: 20 → 10."; with Bone and Sinew "Regeneration (Bone and Sinew) heals 2 HL: …"; a heal that can't: "Regeneration: only Withering is left." / "Regeneration: the form has ended." |
| Turn Reset panel, Quick Clot | the Bleeding recovery line | + "Bleeding ends (Quick Clot)." |
| Turn Reset panel, HP | "1 damage goes on. HP left: 30 → 29." | the ticks' line as now, then the heals; the last HP shown is `final`'s |
| Reset's commit label | `Turn Reset: 1 damage, …` | adds "Regeneration +5 HP", "Blood of Valhalla +10 HP", "Bleeding ended (Quick Clot)" |
| Vitality Surge's card | text | a row under the text: an HL picker (1…`maxHl`), and "Surge: heal 2 HL for 4 SFR". Disabled with the reason on the page (`short`), as H1's Start |
| HP popover | Heal/Hurt stepper, Take a hit | + the same Vitality Surge row, when the character holds it |
| Vitality Surge's commit label | — | "Vitality Surge: +10 HP, 4 SFR" (+ ", more than your RoU of N." when `overCap`, as Start) |
| The Form switch's label | "Form: Werewolf (1 HL Withering)" | + ". Maimed (Left Arm) ends." when Bone and Sinew ends one |
| The Werewolf form's summary | "+2 REF, +2 MOB and +4 BOD … (Feral Mind)." | + "Regenerates 1 HL a round." |
| GM's encounter Reset, a claimed row | ticks, expiring, recovery | + one line when its copy would heal: "Regeneration heals on the player's own sheet." (only the names the copy has, joined with "and") |

**Where things land** (Decision 164's `keepPlace`):

| Press | The record | Focus |
|---|---|---|
| Change the HL picker | the label redraws with the new SFR | the picker |
| Surge (card or popover) | damage and SFR move in one commit | the Surge button, or the picker if the button is now disabled |
| Apply Reset | the panel closes as today | as today |
| Shift into Werewolf with Bone and Sinew | the Maimed Conditions go from the list | the Form switch, as today |

## 10. Worked examples, as named tests

Write these first, show them failing on `main`, then build. Characters are `engine.test.mjs`'s `vampire()` and `werewolf()`, locked,
stats 6 unless named. Numbers below are from the pre-flight's probes.

| # | Test name (file) | Setup → action | Pins |
|---|---|---|---|
| 1 | "Decision N: a Werewolf in form regenerates 1 HL at Turn Reset, never Withering, and not in human form" (`engine.test.mjs`) | Street Wildblood, Werewolf form, damage 20, Withering 5: `applyReset`; the same with damage 7; the same in human form | 15 and Withering 5; 5 (only 2 healed: Withering is the floor); 20 (human); `resolveReset(...).heals[0]` `{ name: "Regeneration", hl: 1, hp: 5 }` |
| 2 | "Decision N: Bone and Sinew regenerates 2 HL and ends Maimed on shifting in (HQ25)" (`engine.test.mjs`) | Street Wildblood with Bone and Sinew, Maimed on the left and right arms, human form, damage 20: `setToggle` Werewolf, then `applyReset` | `ended` both Maimed, Conditions `[]`; after Reset damage 10; `setToggle` Human ends nothing; without Bone and Sinew both Maimed stay |
| 3 | "Decision N: a form Withering has ended doesn't regenerate (HQ23)" (`engine.test.mjs`) | Street Wildblood in form, damage 25, Withering 25 (total 50) | `heals[0].why` "The form has ended.", `hp` 0, damage 25, `hasEffect` false |
| 4 | "Decision N: Blood of Valhalla heals rank HL at Reset while it runs, never Withering (HQ20)" (`engine.test.mjs`) | Heroic Draugur, Blood of Valhalla rank 2 (`basePowers`), started; damage 20, Withering 4: `applyReset`; then damage 12, Withering 4, Stop ticked: `applyReset` | 10, spent 8, turn 4; then 4 (8 healed, Withering 4 kept), stopped, not running |
| 5 | "Decision N: Vitality Surge heals 1 to rank HL and spends 2 SFR an HL, in one commit (HQ21)" (`engine.test.mjs`) | Heroic Draugur, Vitality Surge rank 2 (`powerCp: { "vitality-surge": 1 }`; SFR 17), damage 20, Withering 4: `surgePower(ch, "vitality-surge", 2)` | `hp` 10, damage 10, spent +4, turn +4; `surgeable` `maxHl` 2 before, and with damage 7 and Withering 4 it's 1 |
| 6 | "Decision N: Vitality Surge refuses a short pool, Blood of Valhalla, only Withering, and a count out of range" (`engine.test.mjs`) | the same Draugur: pool with 3 left; Blood of Valhalla running; damage 4 and Withering 4; `hl` 3 | "Vitality Surge needs 4 SFR, 3 left."; "Vitality Surge can't be used while Blood of Valhalla runs."; "Only Withering is left, and Vitality Surge can't heal it."; "Pick 1 to 2 HL."; nothing written on any refusal |
| 7 | "Decision N: Quick Clot ends Bleeding at Turn Reset after it ticks once (HQ22)" (`engine.test.mjs`) | an arcanist with Quick Clot (permanent), Bleeding, damage 3: `applyReset`; without Quick Clot | 4, Conditions `[]`, `ends[0]` `{ id: "bleeding", by: "Quick Clot" }`; without: 4, `["bleeding"]` |
| 8 | "Decision N: a Reset ticks first, asks from the ticks, then heals (HQ19)" (`engine.test.mjs`) | a Street Wildblood in form at 1 HP left (damage 49 of 50), Bleeding: `resolveReset` | `after.hpLeft` 0 and `prompts.atZero` set; `final.damage` 45 |
| 9 | "Decision N: a round's heal wipes damage past zero first (Decision 220)" (`engine.test.mjs`) | a Street Wildblood in form, damage 54 (4 past zero), Withering 0: `applyReset` | damage 45 (the 4 past zero go, then 5) |
| 10 | "Decision N: a GM's Reset writes nothing to a regenerating seat and says so (HQ24)" (`smoke-table-seat-fight.test.mjs` or its Reset twin) | a seat whose copy is a Wildblood in Werewolf form; the row has 10 damage and Bleeding; run the encounter's Reset | the row's damage 11 (the tick only); the line "Regeneration heals on the player's own sheet."; no line for a seat in human form |
| 11 | "Decision N: every surge and roundHeal agrees with its power's text" (`rules.test.mjs`) | every power with `surge` or a `roundHeal` grant, by script | "2 SFR per HL healed" ↔ `sfr.perHl` 2; "up to your rank in HL" ↔ `hl.perRank` 1; "HL equal to rank" ↔ `perRank` 1; the list computed from the data is exactly Vitality Surge and Blood of Valhalla |
| 12 | "CRB 0413/0414 and Aberrations: the heals say what the data does" (`rules.test.mjs`) | `crb(…)` | "While shifted, regenerate 1 HL per round"; "never restores Withering"; "Regeneration restores 2 HL per round, and shifting into Werewolf form ends Maimed"; "heal up to your rank in HL per round"; "regenerate HL equal to rank each round (never Withering)"; "Vitality Surge can't be used while active"; Quick Clot's "Bleeding ends on its own at the next Reset" |
| 13 | "Decision N: Turn Reset shows the heal and Quick Clot, and one undo takes them back" (`smoke-sheet-play.test.mjs`) | a Wildblood in form with damage 20, Withering 5, Quick Clot and Bleeding: open Reset, Apply, undo | the lines "Regeneration heals 1 HL: 21 → 16." and "Bleeding ends (Quick Clot)."; the label names both; undo restores damage 20 and Bleeding |
| 14 | "Decision N: Vitality Surge on the card and the HP popover, disabled with its reason while Blood of Valhalla runs" (`smoke-sheet-play.test.mjs`) | a Draugur with Vitality Surge rank 2 and damage 20: Surge 2 from the card; then Start Blood of Valhalla and open the HP popover | damage 10, spent +4, the toast "Vitality Surge: +10 HP, 4 SFR"; then the button disabled and "Not while Blood of Valhalla runs" on the page; focus per §9 |
| 15 | "Decision N: shifting in with Bone and Sinew says which Maimed ended" (`smoke-sheet-play.test.mjs`) | the Wildblood with Bone and Sinew and a Maimed left arm: press Werewolf on the Form switch | the toast ends "Maimed (Left Arm) ends."; the Condition is gone; undo brings it back |

## 11. Tests beyond the examples

- **The outputs diff** (`WORK-ORDERS.md`). **Expected moves:** apart from the version stamps, the Werewolf fixtures' form summary gains
  "Regenerates 1 HL a round."; Vampire fixtures gain the Vitality Surge row on the Character tab and in any rendered HP popover;
  Regeneration's benefit reads "While shifted". No number moves on any tab (the fixtures carry no damage). List each output that differs
  beyond the stamps, by name, from the full output.
- **Totality:** `roundHeals`, `resolveReset`, `surgeable` and `surgePower` with junk in the new keys (`withData`): strings for numbers,
  `ends` naming no Condition, `trait` naming no trait, `blocks` not a list, `surge` not an object; `surgePower` with `hl` as a string, a
  float, a negative, `NaN`; a character with no form panel, no SFR pool, no Aberrations. No throw, no NaN.
- **Decision 135:** the key guard sees `regenerates`, `trait`, `roundHeal`, `blocks`, `surge`, `perHl`, `ends`, `resetEnds` read. Each
  has the one reader §8b names. No power, Condition, Aberration or archetype id in the new code.
- **Hostile:** a file whose `trackers.witheringDamage` exceeds its damage, or is junk, heals as `migrate()` leaves it; a Reset with
  an Aberration id that isn't in the data ends nothing.
- **Voice:** every new string through `voice.test.mjs`.
- **Mutation-test**, listing the mutants in the PR and the log:
  - Regeneration lowering Withering (the cap removed);
  - Regeneration in human form;
  - Regeneration after Withering ended the form;
  - Bone and Sinew adding to Regeneration instead of replacing it (3 HL);
  - Blood of Valhalla healing when not running;
  - Vitality Surge without its charge;
  - Vitality Surge allowed while Blood of Valhalla runs;
  - Quick Clot ending Bleeding before it ticks;
  - Maimed ending on shifting back;
  - the GM's Reset healing a claimed row;
  - the GM's seat line with no reader.

  **Check each for a second path**: the disabled button isn't the guard, the engine's refusal is.

## 12. Steps

`npm run verify` after each; `npm run test:fast` inside them.

1. `git submodule update --init private`, `npm run verify` on the fresh branch (note the totals), and `before.json` with
   `tools/outputs.mjs` before any engine change.
2. §10's rows as failing tests.
3. Data (8a.1–8a.7).
4. Engine 8b.1–8b.3 (the form's `regen`, `roundHeals`, the cap), then 8b.4–8b.5 (Reset), then 8b.6 (Vitality Surge), then 8b.7–8b.8
   (the shift, the GM's Reset).
5. The UI (§9): the Reset panel and label, Vitality Surge on the card and the popover, the Form switch's label, the GM's line.
6. **The dev preview** (`shadows-dev-preview`). Run each of these, with screenshots or the metrics if the tool times out:
   - A Street Wildblood shifts, takes damage (some of it Withering from the shift if it's a Forge Fang), presses Turn Reset twice,
     then shifts back and presses it again (no heal).
   - The Wildblood with Bone and Sinew and a Maimed arm shifts in.
   - A Heroic Draugur starts Blood of Valhalla, takes a hit, presses Reset; then tries Vitality Surge (disabled, with its reason),
     stops Blood of Valhalla and surges.
   - An arcanist with Quick Clot and Bleeding presses Reset.
   - A GM's encounter Reset with a seat in Werewolf form (seed a table as the H2 review did, or note why not).
   - The card and the Reset panel at 375px.
7. Docs (§14), Decision N, CHANGELOG and `npm run changelog`, the versions (§2), the outputs diff, `npm run verify`, and `npm run
   phone-check`.

## 13. Stop and ask

**Stop** if:

- a reader of `resolveReset`'s result that §5 doesn't list would show the HP wrong (grep `.after`, `.total`, `hasEffect` in `src/ui`);
- a heal would have to lower `witheringDamage` to make a test pass;
- the outputs diff moves a number for a character with no damage;
- Ken routes HQ22 or HQ23 to Deighton and they're unanswered when you reach them: then build the default, mark the data entry
  `flagged: true` with a `flagNote` naming a new F-number, add its `playerNote`, and open the flag (`close-a-flag` skill);
- a test other than the ones below breaks.

**Expected breaks, not stops** (update them, never weaken the guard):

- none pins Regeneration's data text or the form's summary at the pre-flight (grep `While transformed` and `Feral Mind)` in `tests/`: no hit), so a break there is a stop;
- the version literals your bumps move, if any (§2);
- the Dead Air sample's stamps, if `tools/sample-table.mjs` regenerates it;
- **`phone-check`: no frame should move.** The frame fixture seeds an arcanist only. Run it on `main` and on the branch and compare the
  "Over budget at" line (at `f85b7d5` it reads "phone, phone, touch, table 1300, table 1980, all"). Re-record nothing.

The pre-flight grepped `hasEffect` (engine tests 1587, 8794–8801, 12574, 12691) and "Turn Reset: " (`smoke-sheet-play.test.mjs:411`).
None of those characters regenerates, holds Blood of Valhalla or Quick Clot, so none should move. If one does, that's a stop.

## 14. Close-out

Use the **close-the-session** skill, Rule-or-shape tier:

- Decision N with its INDEX line, and no supersession marks (§3), but say "extends 195, 220 and 266" in both;
- STATE rewritten (versions, the powers row: H1–H3 built; what's left of W132 is Battle Hardened and Elemental Blood, waiting on the book);
- the log entry with the mutants and the outputs diff;
- `log/shipped.md`'s row;
- **W132**: its healing half done; it stays open for the two held out (plan §6), its Plan line saying so;
- the plan's H3 row reads built;
- CHANGELOG plus `npm run changelog`, and the versions (§2);
- this order's status line reads built.

**CHANGELOG** (player voice, drafted):

- **Powers heal.** A Werewolf in Werewolf form regenerates at each Turn Reset (twice as fast with Bone and Sinew), and Blood of
  Valhalla heals while it runs. Neither touches Withering.
- **Vitality Surge heals on a press**, spending its SFR as it goes. **Quick Clot** ends Bleeding at the next Reset, and **Bone and
  Sinew** ends Maimed when you shift.

**PR title:** `feat(powers): powers that heal (H3, W132, Decision N)`.
**PR body:** the template's sections, plus *Where the order didn't fit* (empty is fine), the mutants, the outputs diff's summary (by
name, §11), and **For Ken**: every new string as it renders (§9's rows, the refusals, the commit labels), for the voice pass.

### Review checklist

- [ ] §10's rows pinned, each naming what it pins, each failing on `main` first.
- [ ] `roundHeals` is the one reader of what heals at Reset; `runningPowers` is still the one place running is decided.
- [ ] No supernatural heal lowers `witheringDamage`; every heal goes through `_healMath` (Decision 220).
- [ ] Reset's prompts read the ticks; the heals come after (HQ19); `hasEffect` is true when only a heal or an end would apply.
- [ ] Regeneration reads the form, Bone and Sinew raises it (not adds), and `formView.ended` stops it.
- [ ] Every SFR spent goes through `adjustPanelTracker`. Vitality Surge's refusals are the engine's, and its disabled button shows the
      reason on the page.
- [ ] Bone and Sinew ends Maimed only on shifting in, in the shift's commit, and the label says which.
- [ ] The GM's Reset writes nothing new to a claimed row; its line names only what the copy has, and a test reads it.
- [ ] Every new data key has the one reader §8b names (Decision 135).
- [ ] Decision N passes `docs.test.mjs` with its Rejected and Why whole; INDEX line present.
- [ ] The outputs diff moves only §11's expected; `phone-check` matches `main`'s line.
- [ ] Mutants in the PR and the log; `npm run verify` green; versions per §2.
- [ ] Run in the dev preview: the Wildblood through both forms, Bone and Sinew, the Draugur's two heals, Quick Clot, the GM's Reset, 375px.

## 15. Handing it over

The two prompts are `WORK-ORDERS.md`'s, with this order's path, `docs/plans/powers-that-run/H3-powers-that-heal.md`. Session titles:
**H3 build** (Sonnet) and **H3 review** (Opus, fresh). Add these traps under the builder's prompt:

> Seven things in this order are easy to get wrong:
>
> 1. **`heal()` and `healStep()` eat Withering.** They trim `witheringDamage` to the damage left. A supernatural heal capped after
>    the fact still lowers it. Cap the HP at `min(damage, capacity) − witheringDamage` before `_healMath`.
> 2. **The form can have ended while the toggle says Werewolf.** `formView(ch).ended` is the test; `formState` alone isn't.
> 3. **Bone and Sinew replaces Regeneration's number.** It's 2 HL, not 1 + 2.
> 4. **Reset asks from the ticks, then heals** (HQ19). Don't net the two before At Zero and Dying are read.
> 5. **Removing Conditions shifts indexes.** At Reset and on the shift, remove highest index first, after any Condition the same
>    press adds.
> 6. **The GM's claimed row keeps no Withering** (Decision 257). Never heal it; say so in one line, and test the line.
> 7. **Every new data key needs a reader** (Decision 135, H2's S2): `trait`, `blocks` and `resetEnds` are the easy ones to leave as
>    decoration.
>
> Tier: Rule or shape. One decision, the next free number. No character schema bump. App and game data per §2 (add to an unreleased
> `[Unreleased]`). Use the close-the-session skill at the end.
