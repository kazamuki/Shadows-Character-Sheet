# Plan — the player sheet's wishlist, in sessions

**Status:** proposed 2026-10-10 by Claude (Opus), after the first playtest
(W87–W99, #154) and Deighton's rulings (#156,
`reference/rulings-2026-10-10.md`). **Approved by Ken 2026-10-10** (WQ1: the
order as §3; WQ2: release often, by ear). Each session's status is its row in §3.
**Tier of this document:** *Docs*. Each session names its own tier.

This plan turns the player sheet's open wishlist into sessions an Opus
session can write work orders for and a Sonnet session can build, the
cadence GM mode runs on. It covers the character sheet only: GM mode's
wishes (W73–W86) are sequenced by `gm-mode.md` and its work orders, and
stay there.

---

## 1. How it runs

The same cadence as GM mode, written once in
[`gm-mode/README.md`](gm-mode/README.md) (*The cadence*):
- An orchestrating session (Opus) writes one work order, with its assumption
  sweep and its worked examples as named tests, and pre-flights it against
  the code.
- Ken approves it: the order **is** the proposal *Rule or shape* asks for.
- Ken starts a building session (Sonnet, titled `P<n> build`), which builds
  it on a branch and opens a PR without merging, with evidence for every
  claim.
- Ken starts a fresh reviewing session (Opus), which reviews the PR against
  the order, fixes nits itself, and messages the builder the rest. It
  re-reviews the fixes narrowly and tells Ken when the PR is ready.
- **The next order is written only after the last PR merges.**

Work orders live in [`sheet-wishlist/`](sheet-wishlist/), one per session,
`P01-…` onward. Each ends with **Handing it over**: the README's two
prompts, plus the order's own traps. The two-session loop ran on trial for
P8a and P8b and was adopted on 2026-10-15 (Ken), with two refinements from
their reviews: the sweep is answered by grepping a field's readers, and
*Stop and ask* names the breaks it expects.

Two differences from GM mode:

- **Nothing here ships switched off** unless an order says so. These are
  changes to the released sheet, so each one is player-visible and carries
  its CHANGELOG line and version bumps per `CLAUDE.md`'s tiers.
- **GM mode runs beside it.** GM sessions live mostly in `gm.js`; these live
  in `wizard.js`, `sheet.js`, the engine and the data. Expect collisions only
  in the version numbers, CHANGELOG's `[Unreleased]` heading, and decision
  numbers. An order never reserves a number: it says "the next free number"
  and the build takes it (`CLAUDE.md`, *Decisions*). Rebase on whichever
  lands second.

## 2. How the sessions are grouped

1. **By code area.** Wishes that touch the same file and screen go together,
   so a building session reads one part of the code once.
2. **Tiers kept apart.** A session that numbers a decision and bumps the
   schema doesn't also carry unrelated quick fixes, which would wait on its
   review.
3. **Shape settled before the order.** A Sonnet session builds what the order
   says. Every 🔎 question is answered when the order is written (listed in
   §3 as *Before its order*), never during the build.
4. **Player-facing first.** Playtesters are making characters now, so what
   they hit in creation and on the sheet comes before polish.

## 3. The order

**Renumbered 2026-10-11:** Ken's P5 was inserted, so the sessions that were
P5–P15 are now P6–P16. The orders for P1–P4 were written before, and cite
the old numbers (P01's "P5 (W103)" is now P6; P03's "P11" for W72 is P5;
P04's "P12" is P13 and its "P5" is P6).

**Split 2026-10-14:** P8 became P8a (the hit) and P8b (healing), each with
its own save-shape or rules change; the later sessions keep their numbers (Ken).

**Split 2026-10-15:** P9 became P9a (the text, Content) and P9b (F34, a save
shape), so the quick text reaches players without waiting on F34's design (Ken).

**Taken in 2026-10-15:** the two passes [`crb-v4-sync.md`](crb-v4-sync.md)
still had open, so that every session left for the player sheet is in one
list (Ken; the plans audit found that no order covered them).
- **Its P4b** (the Vampire's Major Milestones) is **P17**, run right after
  P9b. Today a Vampire is offered no Major at all, only one written in:
  since Decision 217 the General list is the Professional's.
- **Its P5** (Advancement to `0450`) is mostly built already:
  - the new Minors and their repeats are P6 (Decision 217);
  - 5 IP an hour is GM mode's close-out (Decision 206);
  - `0450`'s pricing questions were Deighton's rulings of 2026-10-10.

  What's left joins **P12**, split in two: **P12a** buys with IP, **P12b**
  learns without it.

The new session takes the next free number, P17, rather than renumbering
P10–P16, because five built orders already cite those numbers. Read §3 by
row order, not by number.

| # | Session | Wishes | Tier | Before its order | Status |
|---|---|---|---|---|---|
| **P1** | Playtest bugs | W92 Pain Sensitive, W93 the Improved roll box, W67 the session date | Rule or shape (one small decision: two data shapes) | Nothing | **Merged** 2026-10-11 (Decision 213, #158), released in 0.39.3 (#161): [`P01-playtest-bugs.md`](sheet-wishlist/P01-playtest-bugs.md) |
| **P2** | CRANK behind a switch | W101 | Rule or shape (small) | Nothing | **Merged** 2026-10-11 (Decision 214, #160), released in 0.39.3 (#161): [`P02-crank-switch.md`](sheet-wishlist/P02-crank-switch.md) |
| **P3** | Vampire and Werewolf powers at creation | W88, W105 | Rule or shape, character schema | W88's three: a saved Vampire's Base Powers given back, a saved Werewolf's unchosen Origin powers, which cap binds | **Merged** 2026-10-11 (Decision 215, #163), released in 0.40.0 (#164): [`P03-supernatural-powers.md`](sheet-wishlist/P03-supernatural-powers.md) |
| **P4** | The wizard, quick wins | W94 Set all to 4, W96 hide what a Supernatural can't buy, W64 Home from the wizard, W59 steppers say what they change | Fix (UI) | Nothing | **Merged** 2026-10-11 (#166), released in 0.41.0 (#167; PQ1–PQ3 on their defaults): [`P04-wizard-quick-wins.md`](sheet-wishlist/P04-wizard-quick-wins.md) |
| **P5** | Powers learned in play | W72 learn an unheld Bloodline or Origin power with IP, W106 a custom power the GM grants (in play and at creation) | Rule or shape, character schema | Nothing | **Merged** 2026-10-11 (Decision 216, #170, app 0.42.0, schema 0.21; PQ1, PQ2, PQ5 on their defaults; PQ3, PQ4, PQ6 answered), released in 0.42.0: [`P05-powers-in-play.md`](sheet-wishlist/P05-powers-in-play.md) |
| **P6** | Milestones | W103 (F9, repeats at any time, the rebalanced values) | Rule or shape, data, character schema | Nothing | **Merged** 2026-10-14 (Decision 217, #173, app 0.43.0, game data 0.36, schema 0.22; PQ1–PQ10 answered), released in 0.43.0: [`P06-milestones.md`](sheet-wishlist/P06-milestones.md) |
| **P7** | Luck and the Boost cap | W65, W66 | Rule or shape, data | Nothing | **Merged** 2026-10-14 (Decision 218, #177, game data 0.37; PQ1–PQ3 on their defaults), released in 0.44.0: [`P07-luck-and-the-boost-cap.md`](sheet-wishlist/P07-luck-and-the-boost-cap.md) |
| **P8a** | The hit | W102's hit half (F18, F23, F25, grenades) | Rule or shape, data | Nothing | **Merged** 2026-10-15 (Decision 219, #180), released in 0.44.0: [`P08a-the-hit.md`](sheet-wishlist/P08a-the-hit.md) |
| **P8b** | Healing | W102's healing half (F24, F36 and its gritty option) | Rule or shape, character schema | Nothing | **Merged** 2026-10-15 (Decision 220, #183, schema 0.23; PQ1–PQ6 as answered, PQ5 adds the HP pill), released in 0.44.0: [`P08b-healing.md`](sheet-wishlist/P08b-healing.md) |
| **P9a** | Gear text, difficulty names, the Magical being | W104 without F34 (F26, F30, F31, the skill checks' names), W53 | Rule or shape (small: a mod's `refusalText`) | Nothing | **Merged** 2026-10-15 (Decision 221, #186, game data 0.38), released in 0.45.0: [`P09a-gear-text.md`](sheet-wishlist/P09a-gear-text.md) |
| **P9b** | Partly spent magazines | W104's F34 | Rule or shape, character schema | Nothing: the order's PQ1 (where the count lives) and PQ2 (how Reload chooses), answered | **Merged** 2026-10-15 (Decision 222, #190, schema 0.24), released in 0.45.0: [`P09b-magazines.md`](sheet-wishlist/P09b-magazines.md) |
| P17 | The Vampire's Major Milestones | crb-v4-sync's P4b (VQ27): `0413`'s 22 Majors (the pass said 24; the table lists 22) | Rule or shape, data | Nothing new: VQ27 put them on P3b's engine (Decision 199), and VQ4 prices the second Bloodline that Cursed Evolution (an Innate power) opens as a New Power. Splice takes one power from another Bloodline, and Pure Blooded excludes both. So the order settles how they meet Decision 216's "its own Bloodline" and a Major that bars another | **Merged** 2026-10-15 (Decision 223, #192, schema 0.25), released in 0.45.0: [`P17-vampire-majors.md`](sheet-wishlist/P17-vampire-majors.md) |
| P10 | Holding a spell | W87 | Rule or shape, character schema | The WILL check's TN and TH (stubbed and flagged if Deighton hasn't set them) | **Merged** 2026-10-15 (Decision 224, #195, game data 0.39, schema 0.26), released in 0.46.0: [`P10-holding-a-spell.md`](sheet-wishlist/P10-holding-a-spell.md); F43 open (the check's TN and TH, one check or one per spell, and a floor at the cap) |
| P11 | SFR and movement on Main | W97 Rate of Use, W54 a written-in pool's card, W98 Walk/Run/Sprint/Jump | Rule or shape (W97's tracker field) | W97: warn or block (Claude argues warn), and how sustained drains are charged. Asked as the order's PQ1–PQ8 | **Merged** 2026-10-16 (Decisions 225 and 226, #198, app 0.47.0, game data 0.40, schema 0.27; PQ1–PQ8 on their defaults, PQ6 as meters; the review added Turn Reset to Main's SFR popover), released in 0.47.0: [`P11-sfr-and-movement.md`](sheet-wishlist/P11-sfr-and-movement.md); W110 (sustained powers) is its follow-on |
| P12a | IP beyond ranks | W89 an Advantage bought or a Disadvantage bought off with IP, and from crb-v4-sync's P5, `0450`'s restores: SAN at 5 a point and a Health Level at 25, never past the maximum (W72 moved to P5) | Rule or shape (reopens Decision 13, and Decision 206 in part) | Nothing: **Ken answered both on 2026-10-15.** A restored Health Level undoes a Massive one lost, as Steadied's does (Decision 217). The Session Log's flat 10 IP a session is out of date: it asks for hours, at 5 IP each (`0450`, as GM mode's close-out does). That supersedes Decision 13 in part, and Decision 206's "the sheet's own default stays perSession" | **Merged** 2026-10-16 (Decisions 227 and 228, F44 opened; app 0.47.0, data 0.40, no schema bump), PQ1–PQ8 on their defaults, released in 0.47.0: [`P12a-ip-beyond-ranks.md`](sheet-wishlist/P12a-ip-beyond-ranks.md) |
| P12b | Learning without IP | W39 a new Martial Arts style, by the GM's word. From crb-v4-sync's P5, `0450`'s optional Training: a REF, INT or TECH Skill raised once per Milestone period for Çredits (10 × the rank's IP cost), never past 9 | Rule or shape | W39: confirm a style's +1 goes on the check that inflicts the Condition. Training: a house rule (P8b's `houseRules`) or always offered | **Merged** 2026-10-16 (Decisions 229 and 230, #203; app 0.47.0, game data 0.40, character schema 0.28), released in 0.47.0: a style learned in play with its bonus on the maneuver, and Training with the rank landing at the next Milestone. W39 granted; W119 (print) is its follow-on: [`P12b-learning-without-ip.md`](sheet-wishlist/P12b-learning-without-ip.md) |
| P18 | Effects as data | W120: every Advantage's and Disadvantage's effects as `grants` rows, each with a name and text; computed ones from a per-type template, table rules as text the engine skips. The review of all 87 finds effects the app should compute and doesn't (Blood Lust's SAN, probed) | Rule or shape, data (a decision, `gamedataVersion` if an effect becomes computed) | Every effect sorted, computed or table rule, on a sign-off page for Ken and Deighton; each newly computed one's numbers (Blood Lust: 5 points, or 5% of the max?) flagged for Deighton, never guessed | ✅ **Built** (Decision 231; app 0.48.0, no data or schema bump, PR #207): 87 entries' effects in `grants`, shown as tags; eleven descriptions follow Deighton's rulings. P19 and P20 compute the 19 that stay table rules. [`P18-effects-as-data.md`](sheet-wishlist/P18-effects-as-data.md) |
| P19 | Skills learn from traits | From P18's review and the sign-off: a trait's Take X on its Skill row as an exact total ("Take 6: 13"), **chosen before the roll** (Deighton: "they need to choose FIRST"); fail-on-2-or-3 and explode-on-9-or-10 marked on the Skills they touch, conditional ones with their "when"; the *check* answer (Ghost Step +3, Defect/Flaw −2, the 1d4 kickers; unanimous); and **Night Vision's light levels** (Dim −1, Dark −3, Deighton). P18-shaped: computed types with templates | Rule or shape | Nothing blocking: the answers are in (2026-10-16). Kicker stacking is unanswered, and no Skill holds two kickers today, so each shows on its own | ✅ **Built** (Decisions 233 and 234; app 0.49.0, game data 0.41, no schema bump, PR #213): 16 entries' effects are computed on the Skill's row (a number in the check, kickers beside it, Take X as its total, die-face marks, Night Vision's light levels); Expert mode folds the Stats step and its toggle is in the header on every creation step. [`P19-skills-from-traits.md`](sheet-wishlist/P19-skills-from-traits.md) |
| P20a | Numbers at creation | P20, split (2026-10-17). From the sign-off, all unanimous: SAN cuts as points off the max (Blood Lust, Berserker, Fanatic, Hallucinations, Minor Insanity); Stat maximums capped (Age, Dwarf, Giant; Giant's BOD 11 lifts the cap) and **Dwarf and Giant excluding each other** (Deighton); Wealthy's Ç10,000 once. Plus **Arcane Fortitude's +2 TOL**, never applied (found by the P21 inventory) | Rule or shape, data (`gamedataVersion`) | Nothing: **Ken answered PQ1–PQ9 on 2026-10-17**, the defaults except PQ2 (a cap binds only at creation). Age's MOB cap is built as the book's (W130 can drop it) | ⏭ Order ready 2026-10-17: [`P20a-numbers-at-creation.md`](sheet-wishlist/P20a-numbers-at-creation.md) |
| P20b | Numbers in play | P20, split (2026-10-17). From the sign-off, all unanimous: Pain (Terminal Disease adds, then Pain Tolerance takes off); Rapid Healing multiplying natural healing, stacking with Speed Heal (and Fast Metabolism, from the P21 inventory); Take a hit applying Scrapper, Giant and Thick Skull, **keyed to Melee and Martial Arts attacks** (Deighton), which adds that input to Take a hit | Rule or shape, data (`gamedataVersion`) | Nothing: **Ken answered PQ1–PQ10 on 2026-10-17**, the defaults (a head hit doubles, as `0530` says, and Thick Skull skips it) | ⏭ Order ready 2026-10-17: [`P20b-numbers-in-play.md`](sheet-wishlist/P20b-numbers-in-play.md). Builds after P20a or beside it |
| P13 | Expert mode | W95 on the Archetype, Skills and CP steps; Held only on CP; the Skills step's sticky bar; the CP filter's name bug; P18's tags in the four places it missed, and a held card's computed tags stating its total | Rule or shape (from Fix, 2026-10-17: one decision, superseding 231 in part) | Nothing: PQ8–PQ10 (added 2026-10-17, after P18's review) answered the same day, the defaults. PQ1–PQ7 answered (PQ3: no compact steppers, after a side-by-side and a measurement), and Ken widened it on 2026-10-16 | ✅ **Built** 2026-10-17 (Decision 232, app 0.48.0, unreleased). Order drafted 2026-10-16, **after P18**: a folded entry shows P18's effect tags. W121 (typed stepper values) and W122 (Make a copy) are its spin-offs: [`P13-expert-mode.md`](sheet-wishlist/P13-expert-mode.md) |
| P14 | Loadout rows | W70 a custom item folds, W91 vehicles (first cut, Powered Armor included) | Fix + Content, a save shape | W91's first-cut columns | ⏭ |
| P15 | Worn gear modifiers | W69 | Rule or shape | `damageType` for the 25 weapons without one (data work, first) | ⏭ after P14 |
| P16 | The Character tab's layout | W99, W60's last item | Rule or shape (supersedes 168 in part) + Fix | W99's question, and the layout pinned exactly in the order | 🔎 |

**Why this order.** P1 and P2 are small and want to reach players first: the
bugs playtesters hit, and CRANK hidden before the next release while the team
talks it through. P3 comes next because testers are making Vampires and
Werewolves now, and each one made under the stand-in needs a migration later.
P4 is the rest of what creation feels like. P5 is Ken's, pulled forward on
2026-10-11 while P3's powers were fresh: what creation didn't buy, learned
in play, and what a GM grants. P6–P10 are Deighton's rulings,
roughly in order of how often a table meets them (Milestones and the hit
every session, a held spell only for Arcanists). P17 runs right after P9b
for P3's reason: testers play Vampires now, and one who reaches a Major
Milestone has nothing to pick. P11 onward is new
capability, and P16 last because it reopens a layout decision and is the one
most likely to need a design pass.

**Dependencies.** P5 after P3 (W72 extends P3's power model). P17 after P6
(it fills Decision 217's offer; 217's *Revisit if* "another archetype's Majors
are written" fires) and P5 (Splice meets W72's learn-a-power). P12b after P12a
(Training prices a rank as P12a's journal does). P13 after P4
(the steppers sit on W59's labels) and P18 (its folded entries show P18's effect tags). P15 after P14 (Powered Armor is
W91's, and W69 reads weapons' `damageType`). P6 after P1 (P1 moves the
Improved roll's numbers into the data). Everything else can move.

## 4. Not scheduled

| Wish | Why not yet |
|---|---|
| W90 cybernetics, W61 a retired Cyborg | Waiting on the cybernetics design (F6, F19) |
| W38 two tabs on one character | Its own plan, waiting on Ken's TQ1–TQ3 |
| W63 the hosted sheet as a demo | Waiting on Ken: which slice is free |
| W100 meters or feet | 💡: distances are text today, so it starts as data work |
| W49–W52, W55, W62 | 💡 ideas, not shaped |
| W56 the tuning bench | Tooling, best as its own plan |
| W29 and W73–W86 | GM mode's own plan |

## 5. Questions for Ken (WQ)

| Id | Question | Default |
|---|---|---|
| WQ1 | Is this the order? | As §3. **Ken, 2026-10-10: yes** |
| WQ2 | Release after every session, or in batches? P1 and P2 are worth a release of their own, so playtesters get the fixes | A release after P2, then after P5 and every few sessions after. **Ken, 2026-10-10:** a good starting point; play it by ear and release often, to get features to the playtesters. So when a session's PR merges, the orchestrator asks whether to cut a release rather than waiting for a batch |
