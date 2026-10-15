# Plan — the player sheet's wishlist, in sessions

**Status:** proposed 2026-10-10 by Claude (Opus), after the first playtest
(W87–W99, #154) and Deighton's rulings (#156,
`reference/rulings-2026-10-10.md`). **Approved by Ken 2026-10-10** (WQ1: the
order as §3; WQ2: release often, by ear). Nothing here is built.
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
From P4 on, each order ends with **Handing it over**: the prompt to paste
into the building session, with the order's own traps called out. It's
`gm-mode/README.md`'s prompt, plus what the pre-flight found easy to get
wrong.

**From P8a on, on trial** (Ken, 2026-10-14, after #177's review found a
miss in the order rather than the build): the order carries an **assumption
sweep** (what's true today that the change makes false, by file and line),
its **worked examples as named tests** the builder writes first and shows
failing on `main`, and a rule that **every claim in the PR names its
evidence**. Ken starts the builder and a fresh reviewer; the reviewer messages
the builder directly, **fixes nits itself**, and **re-reviews narrowly**
(the fix commits against its findings). If it holds up over two orders, it
moves into `gm-mode/README.md`'s cadence.

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

| # | Session | Wishes | Tier | Before its order | Status |
|---|---|---|---|---|---|
| **P1** | Playtest bugs | W92 Pain Sensitive, W93 the Improved roll box, W67 the session date | Rule or shape (one small decision: two data shapes) | Nothing | **Merged** 2026-10-11 (Decision 213, #158), released in 0.39.3 (#161): [`P01-playtest-bugs.md`](sheet-wishlist/P01-playtest-bugs.md) |
| **P2** | CRANK behind a switch | W101 | Rule or shape (small) | Nothing | **Merged** 2026-10-11 (Decision 214, #160), released in 0.39.3 (#161): [`P02-crank-switch.md`](sheet-wishlist/P02-crank-switch.md) |
| **P3** | Vampire and Werewolf powers at creation | W88, W105 | Rule or shape, character schema | W88's three: a saved Vampire's Base Powers given back, a saved Werewolf's unchosen Origin powers, which cap binds | **Merged** 2026-10-11 (Decision 215, #163), released in 0.40.0 (#164): [`P03-supernatural-powers.md`](sheet-wishlist/P03-supernatural-powers.md) |
| **P4** | The wizard, quick wins | W94 Set all to 4, W96 hide what a Supernatural can't buy, W64 Home from the wizard, W59 steppers say what they change | Fix (UI) | Nothing | **Merged** 2026-10-11 (#166), released in 0.41.0 (#167; PQ1–PQ3 on their defaults): [`P04-wizard-quick-wins.md`](sheet-wishlist/P04-wizard-quick-wins.md) |
| **P5** | Powers learned in play | W72 learn an unheld Bloodline or Origin power with IP, W106 a custom power the GM grants (in play and at creation) | Rule or shape, character schema | Nothing | **Built** 2026-10-11 (#170, Decision 216, app 0.42.0, schema 0.21; PQ1, PQ2, PQ5 on their defaults; PQ3, PQ4, PQ6 answered): [`P05-powers-in-play.md`](sheet-wishlist/P05-powers-in-play.md) |
| **P6** | Milestones | W103 (F9, repeats at any time, the rebalanced values) | Rule or shape, data, character schema | Nothing | **Merged** 2026-10-14 (Decision 217, #173, app 0.43.0, game data 0.36, schema 0.22; PQ1–PQ10 answered), unreleased: [`P06-milestones.md`](sheet-wishlist/P06-milestones.md) |
| **P7** | Luck and the Boost cap | W65, W66 | Rule or shape, data | Nothing | **Merged** 2026-10-14 (Decision 218, #177, app 0.43.1, game data 0.37; PQ1–PQ3 on their defaults), unreleased: [`P07-luck-and-the-boost-cap.md`](sheet-wishlist/P07-luck-and-the-boost-cap.md) |
| **P8a** | The hit | W102's hit half (F18, F23, F25, grenades) | Rule or shape, data | Nothing | **Built** 2026-10-15 (Decision 219, app 0.44.0): [`P08a-the-hit.md`](sheet-wishlist/P08a-the-hit.md) |
| P8b | Healing | W102's healing half (F24, F36 and its gritty option) | Rule or shape, character schema | Nothing | **Built** 2026-10-15 (Decision 220, app 0.44.0, schema 0.23; PQ1–PQ6 as answered, PQ5 adds the HP pill): [`P08b-healing.md`](sheet-wishlist/P08b-healing.md) |
| P9 | Gear and reference text | W104 (F26, F30, F31, F34, difficulty names), W53 | Content; F34 is a save shape | Whether F34 splits into its own session | ⏭ |
| P10 | Holding a spell | W87 | Rule or shape, character schema | The WILL check's TN and TH (stubbed and flagged if Deighton hasn't set them) | ⏭ |
| P11 | SFR and movement on Main | W97 Rate of Use, W54 a written-in pool's card, W98 Walk/Run/Sprint/Jump | Rule or shape (W97's tracker field) | W97: warn or block (Claude argues warn), and how sustained drains are charged | 🔎 |
| P12 | Learning in play | W89 Advantages with IP, W39 a new Martial Arts style (W72 moved to P5) | Rule or shape | W39: confirm a style's +1 goes on the check that inflicts the Condition | ⏭ |
| P13 | Expert mode | W95 | Fix (UI) | W95's two: where the boost count goes, whether it reaches the Character tab | 🔎 after P4 |
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
every session, a held spell only for Arcanists). P11 onward is new
capability, and P16 last because it reopens a layout decision and is the one
most likely to need a design pass.

**Dependencies.** P5 after P3 (W72 extends P3's power model). P13 after P4
(the compact steppers sit on W59's labels). P15 after P14 (Powered Armor is
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
