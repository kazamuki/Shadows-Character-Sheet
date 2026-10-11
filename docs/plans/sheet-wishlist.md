# Plan — the player sheet's wishlist, in sessions

**Status:** proposed 2026-10-10 by Claude (Opus), after the first playtest
(W87–W99, #154) and Deighton's rulings (#156,
`reference/rulings-2026-10-10.md`). **Ken: approve the order (§3), then P1's
work order.** Nothing here is built.
**Tier of this document:** *Docs*. Each session names its own tier.

This plan turns the player sheet's open wishlist into sessions an Opus
session can write work orders for and a Sonnet session can build, the
cadence GM mode runs on. It covers the character sheet only: GM mode's
wishes (W73–W86) are sequenced by `gm-mode.md` and its work orders, and
stay there.

---

## 1. How it runs

The same cadence as GM mode, written once in
[`gm-mode/README.md`](gm-mode/README.md) (*The cadence*): an orchestrating
session (Opus) writes one work order, pre-flights it against the code, Ken
approves it (the order **is** the proposal *Rule or shape* asks for), a
building session (Sonnet) builds it on a branch and opens a PR without
merging, the orchestrator reviews it against the order and runs it in a
browser, and fixes go back to the session that built it. **The next order is
written only after the last PR merges.** Work orders live in
[`sheet-wishlist/`](sheet-wishlist/), one per session, `P01-…` onward.

Two differences from GM mode:

- **Nothing here ships switched off** unless an order says so. These are
  changes to the released sheet, so each one is player-visible and carries
  its CHANGELOG line and version bumps per `CLAUDE.md`'s tiers.
- **GM mode runs beside it.** GM sessions live mostly in `gm.js`; these live
  in `wizard.js`, `sheet.js`, the engine and the data. Expect collisions only
  in the version numbers, CHANGELOG's `[Unreleased]` heading, and decision
  numbers: check `origin/main` and open branches for the next free decision
  before numbering (the `ids-collide` lesson), and rebase on whichever lands
  second.

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

| # | Session | Wishes | Tier | Before its order | Status |
|---|---|---|---|---|---|
| **P1** | Playtest bugs | W92 Pain Sensitive, W93 the Improved roll box, W67 the session date | Rule or shape (one small decision: two data shapes) | Nothing | **Order drafted:** [`P01-playtest-bugs.md`](sheet-wishlist/P01-playtest-bugs.md) |
| P2 | CRANK behind a flag | W101 | Rule or shape (small) | Nothing | ⏭ |
| P3 | Vampire and Werewolf powers at creation | W88, W105 | Rule or shape, character schema | W88's three: a saved Vampire's Base Powers given back, a saved Werewolf's unchosen Origin powers, which cap binds | ⏭ |
| P4 | The wizard, quick wins | W94 Set all to 4, W96 hide what a Supernatural can't buy, W64 Home from the wizard, W59 steppers say what they change | Fix (UI) | Nothing | ⏭ |
| P5 | Milestones | W103 (F9, repeats at any time, the rebalanced values) | Rule or shape, data | Nothing (P1 makes the Improved roll data, so +30 is a data edit) | ⏭ |
| P6 | Luck and the Boost cap | W65, W66 | Rule or shape, data | Nothing | ⏭ |
| P7 | The hit and healing | W102 (F18, F23, F24, F25, F36, grenades) | Rule or shape | Where F36's gritty option lives: the character or the GM's table | ⏭ |
| P8 | Gear and reference text | W104 (F26, F30, F31, F34, difficulty names), W53 | Content; F34 is a save shape | Whether F34 splits into its own session | ⏭ |
| P9 | Holding a spell | W87 | Rule or shape, character schema | The WILL check's TN and TH (stubbed and flagged if Deighton hasn't set them) | ⏭ |
| P10 | SFR and movement on Main | W97 Rate of Use, W54 a written-in pool's card, W98 Walk/Run/Sprint/Jump | Rule or shape (W97's tracker field) | W97: warn or block (Claude argues warn), and how sustained drains are charged | 🔎 |
| P11 | Learning in play | W72 a new power with IP, W89 Advantages with IP, W39 a new Martial Arts style | Rule or shape | W39: confirm a style's +1 goes on the check that inflicts the Condition | ⏭ after P3 |
| P12 | Expert mode | W95 | Fix (UI) | W95's two: where the boost count goes, whether it reaches the Character tab | 🔎 after P4 |
| P13 | Loadout rows | W70 a custom item folds, W91 vehicles (first cut, Powered Armor included) | Fix + Content, a save shape | W91's first-cut columns | ⏭ |
| P14 | Worn gear modifiers | W69 | Rule or shape | `damageType` for the 25 weapons without one (data work, first) | ⏭ after P13 |
| P15 | The Character tab's layout | W99, W60's last item | Rule or shape (supersedes 168 in part) + Fix | W99's question, and the layout pinned exactly in the order | 🔎 |

**Why this order.** P1 and P2 are small and want to reach players first: the
bugs playtesters hit, and CRANK hidden before the next release while the team
talks it through. P3 comes next because testers are making Vampires and
Werewolves now, and each one made under the stand-in needs a migration later.
P4 is the rest of what creation feels like. P5–P9 are Deighton's rulings,
roughly in order of how often a table meets them (Milestones and the hit
every session, a held spell only for Arcanists). P10 onward is new
capability, and P15 last because it reopens a layout decision and is the one
most likely to need a design pass.

**Dependencies.** P11 after P3 (W72 extends P3's power model). P12 after P4
(the compact steppers sit on W59's labels). P14 after P13 (Powered Armor is
W91's, and W69 reads weapons' `damageType`). P5 after P1 (P1 moves the
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
| WQ1 | Is this the order? | As §3 |
| WQ2 | Release after every session, or in batches? P1 and P2 are worth a release of their own, so playtesters get the fixes | A release after P2, then after P5 and every few sessions after |
