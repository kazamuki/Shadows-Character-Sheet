# Work order E1c — Character Points for a first-timer

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E1c (split from E1b by EQ9).
**Status:** drafted 2026-11-12 by the conductor (Opus), as E1b's was. **Approved by Ken 2026-11-12**, in the conductor's session: he asked for the next order to be built (*"Lets get the next work order built"*) and answered EQ13–EQ16 on the defaults (§4). Ready for its builder.
**Branch:** the builder's own, cut from `main`.
**Runs beside:** E4 (colour). Not E2 or E5.
**Impeccable:** `/impeccable distill the Character Points step and the Natural Advantage panel for a first-time player`. Its analysis is in this order (§1, §9), from measurements at 375×812 on `main`. The builder runs `/impeccable clarify` on §9's new words to check them, not to reopen the shape.
**Pre-flight:** `main` at `edb3ad5` (E1b merged: app 0.66.2, game data 0.54, last decision 277). Findings:
- **The step at 375×812** (a Professional/Enforcer at Street Level, nothing bought): **35,220px**, or **17,150px** in Expert mode. The Disadvantage list is 13,805px (30 entries) and the Advantage list 19,035px (57). With both `<details class="group">` closed, the page is **2,399px**. The lists are nearly all of it, and Expert mode only halves them: a card's head and tags alone are about 150px on a phone.
- **The data has nothing to group by.** Advantages and Disadvantages carry no category or tag key (`id, name, cost, maxRank, description, grants`). Their book text is 26,924 characters (median 216, longest 1,180). So the lever is how much of the list shows, not how it's sorted.
- **The lists are `<details open>` today** (`wizard.js:603, 625`), so they already collapse. Nobody closes them, and closing one hides what's been taken, because a closed `<details>` hides its held picks too.
- **The filter works on the rendered page** (`applyPickFilter`, `shared.js:854`, Decision 114): it hides non-matching picks, and a held pick always shows. **Held only** (Decision 232) shows only held picks. A fold built from `hidden` on rendered picks fits both, and one that skips rendering the picks would break the filter, which can't find what isn't drawn.
- **E1b's fold** (Decision 276, `wizard.js:341`) is the pattern: what wasn't chosen folds to a line, and **Show all N** opens it. That state is `S.specAll`, reset when the step changes (`app.js:183`) and when the archetype changes (`wizard.js:971`).
- **The Natural Advantage panel** on the Archetype step (`wizard.js:424–440`) draws every pool entry in full, each with its description, tags and stepper: about 1,100px for an Enforcer's four (E1b's build measured it). E1b deferred it here.
- **Ledger search** ("Held only", `details.group`, "available</summary>", `cpFilter`, `applyPickFilter`, "Natural Advantages", `naturalAdvantagePool`, `data-filterable`): Decisions **114** (the jump bar and filter), **232** (Expert mode, Held only), **134** (the Natural Advantage pool) and **276** (the fold) govern what this touches. None is replaced; 276 is extended.
**Carried over** from E1b's review (Opus):
- *The order's misses:* a height target set from an estimate (E1b promised half, and built −33%). This order states measured baselines and sets its one target from a measurement (both lists closed: 2,399px). Also a label that renamed what a decision named (Decision 218's "Max Character Point Boost"). This order renames nothing.
- *The build's:* Show all survived an archetype change, so a new pick didn't fold (fixed in review). Here, every new fold flag is reset wherever `S.specAll` is, and a test changes the thing under it.

---

## 1. Goal and Done when

**Goal:** a first-timer on Character Points sees what the step is for (Disadvantages give CP, Advantages cost it, then LUCK, powers and boosts), not 87 cards. They open a list when they want to browse it, and what they've taken stays in view either way. A veteran types in the filter as today.

**Done when:**
- On a new character with nothing bought, Character Points at 375×812 is at most **3,000px** with both lists folded (2,399 measured with them closed, plus the fold rows), with Expert mode off.
- Each list shows its held picks and one row: **Show all 30 Disadvantages** or **Show all 57 Advantages**, opening the rest in place.
- Typing in the filter shows matches from both lists, folded or not. Clearing it restores the fold. **Held only** works as today.
- A pick bought from an opened list stays visible when the list folds again.
- On the Archetype step, once the Natural Advantage ranks are all allocated, the unallocated entries fold to a line each, with **Show all**, as Decision 276 does for subtypes.
- `npm run verify` and `npm run phone-check` pass.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*: where a creation list's entries show is a player-facing behaviour someone could have chosen otherwise.
- **Versions:** app **patch** (EQ16). Game data, character, table and pack schemas unchanged: the fold is browser state, and the new `appCopy` keys are words (Decision 68). No `migrate()` step.
- **Numbers:** two decisions, **N** and **N+1**, the next free numbers on `origin/main` when built (278–279 if nothing lands first; S31 took 278 first, so E1c was built as **279–280**). No flags.

## 3. Decisions, drafted in full

```
N. **Character Points' Disadvantage and Advantage lists show what's taken, and the rest a press away.**
     *2026-11-?? · Ken + Claude · Touches: renderCP, details.group, Disadvantages list, Advantages list, applyPickFilter, data-filterable, Held only, S.cpAll, data-cp-all, showAllOptions, E1c*
     - **Decided:** Each list draws every entry as today, but entries the character doesn't hold are hidden until the player presses **Show all N**, which opens that list (and reads Show fewer once open). A held entry always shows. While the filter has text, it decides what shows in both lists, folded or not, and clearing it restores the fold. Held only is unchanged. The fold is browser state (`S`), reset when the step is left or the character changes, as Decision 276's is. It applies with Expert mode on or off.
     - **Why:** On a phone the step was 35,220px, nearly all of it two lists of book text; with them folded it is about 2,600px. A first-timer sees the step's shape (what gives CP, what costs it, what else it buys) and opens a list to browse it. The `<details>` the lists sat in could close, but closing one hid what had been taken.
     - **Rejected:** closing the `<details>` by default (it hides held picks); clamping each description to two lines (the book text is the help a first-timer needs, and 87 clamped cards are still about 13,000px); grouping by category (the data has none); not rendering folded entries (the filter searches the rendered page, Decision 114); folding only with Expert mode off (a veteran also scrolls past 87 to reach Boosts; the filter is their path anyway).
     - **Replaces:** nothing. (Decision 114's filter, and its rule that a held pick always shows, stand. So do 232's Held only and Expert folds.)
     - **Revisit if:** the data gains categories, which would make a list grouped and folded by category the better shape.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.

N+1. **The Natural Advantage panel folds what wasn't allocated, once every rank is.**
     *2026-11-?? · Ken + Claude · Touches: naturalAdvantagePool, the Natural Advantages panel, renderArchetype, data-natadv, S.natAll, Decision 276, E1c*
     - **Decided:** Once a specialization's Natural Advantage ranks are all allocated, every pool entry with no rank folds to its name and maximum rank, and one press of **Show all** opens them again; an allocated entry stays in full. Until then the panel is as today. The fold is browser state, reset where 276's is.
     - **Why:** The panel was about 1,100px of a phone's Archetype step after the choice was made: the same shape Decision 276 folded for subtypes, met one panel further down.
     - **Rejected:** folding before the ranks are allocated (the descriptions are how a first-timer chooses); folding the Focused Skill picker too (its options are one-line toggles already).
     - **Replaces:** nothing. Extends Decision 276's fold to the Natural Advantage pool (Decision 134).
     - **Revisit if:** an archetype's pool grows past what one fold row should hide.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.
```

## 4. Questions for Ken

- **EQ13:** Fold the lists with Expert mode on too? **Default: yes.** Expert mode is about reading less, and a veteran types in the filter. Otherwise Expert mode would be the longer page here. *Ken, 2026-11-12: Default.*
- **EQ14:** Keep **Held only**, now that a folded list already shows only what's held? **Default: keep.** It folds both lists at once and works mid-filter. Retiring it would be a decision against 232, for a button nobody has complained about. *Ken, 2026-11-12: Default.*
- **EQ15:** Should a list open by itself once the player has taken nothing from it and moves on? (A first-timer may never open Disadvantages and miss the CP they give.) **Default: no.** The fold row says what the list is for (§9), and the CP line at the top counts Disadvantages. A list opening by itself is the page changing under the player. *Ken, 2026-11-12: Default.*
- **EQ16:** App patch or minor? **Default: patch**, as E1a and E1b were. *Ken, 2026-11-12: Default.*

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| The two lists | `<details class="group" open data-filterable>` with "N available" | `renderCP`, `wizard.js:603, 625` | The same entries, every one drawn. Non-held entries carry the fold (a class, or `hidden` set by the filter pass), and a fold row with Show all N sits at the top of each list. Whether the `<details>` wrapper stays is the builder's call, but nothing may hide a held pick |
| The gated list (a Supernatural's) | Opens with what the classification can buy first, then "held that aren't" | `wizard.js:621–625` | The same order. Show all counts what's shown when open (`openCount`, plus held ones that aren't open) |
| The filter | Hides non-matching picks; a held pick always shows | `applyPickFilter`, `shared.js:854`; bound at `wizard.js:1079–1085` | With text: as today, across folded lists. Without text: hides the folded, non-held entries. **It is the one place visibility is decided**, so the fold and the filter can't disagree after a redraw |
| "N of M" | Counts shown picks | `[data-jumpcount]`, `wizard.js:1082` | Counts as today. Check what it reads with both lists folded and no filter (it shouldn't claim a filter is active) |
| Held only | Shows only held | `S.cpHeld`, `wizard.js:775, 1085` | Unchanged (EQ14) |
| Jump bar | Jumps to each section's heading | `jumpBarHtml`, `sectionList`, Decision 114 | Unchanged. A jump to Advantages lands on the heading and fold row |
| Expert mode | Folds each entry's text behind ? | `foldAttr`, `shared.js:723` | Unchanged inside an opened list |
| Fold state | — | — | `S.cpAll = { disadvantages, advantages }`. Reset where `S.specAll` is: on leaving the step (`app.js:183`) and on a new or opened character. Grep every place `S.specAll` is reset and add these beside it |
| A stepper press | Re-renders `#main`; `S.cpFilter` re-applies the filter | `wizard.js:1076` | The fold re-applies the same way, so buying from an open list keeps it open, and the bought entry is held from then on |
| Natural Advantage panel | Every pool entry in full | `renderArchetype`, `wizard.js:424–440` | Once `have >= naturalAdvantageRanks`, unallocated entries fold to name and max rank, with Show all. `S.natAll`, reset where `S.specAll` is |
| `showAllOptions` copy | "Show all {n} {label}s" | `shadows-data.js:4032` | Reused if it reads right ("Show all 30 Disadvantages"). Otherwise a new key, each read by code (Decision 135) |
| Review | Lists Advantages and Disadvantages taken | `renderReview`, `wizard.js:802` | Unchanged |
| The sheet | Never draws the CP lists | — | Unchanged. Grep `renderCP`'s helpers for any sheet reader before assuming it |
| Phone-check's frames | Record the step at its full height | `tools/frame-fixture.json` | Re-recorded. Every changed frame is on Character Points or Archetype |
| Tests that open the lists | Click steppers inside the lists, read `details.group summary` | `smoke-wizard.test.mjs:1125` and others: grep `disadv\|`, `adv\|`, `details.group` | A stepper on a hidden pick is still in the DOM, and jsdom clicks it. Tests that read visibility or the summary text are expected breaks |

## 6. Read first

- `CLAUDE.md`: hard constraint 7 (the fold isn't stored); *Change tiers*; *Decisions*.
- `SCHEMA.md` §4: Decisions **114**, **134**, **152** (the gated list), **232**, **234**, **276**.
- `src/ui/wizard.js`: `renderCP`, the CP binders (`wizard.js:1076–1090`), `renderArchetype`'s Natural Advantage panel and its 276 fold (`:341`).
- `src/ui/shared.js`: `applyPickFilter`, `jumpBarHtml`, `foldAttr`.
- `src/ui/app.js:183` (where step-change resets live).

## 7. Out of scope

- The order of the step's sections, LUCK, Disciplines, Powers, Custom powers, spells and Boosts (each short).
- Categories for Advantages and Disadvantages (a data question for Deighton: *Revisit if*).
- The Skills step (its own filter and bar; not measured long).
- W121 and W131 (set aside by E1b).
- The locked sheet's IP buy list (it isn't creation).

## 8. The shapes

No data, save-file or engine change. Browser state only: `S.cpAll` and `S.natAll`. New `appCopy` keys only as §9 needs, each read by code.

## 9. The UI

**Each list, folded** (the top of the list, under its section heading):
> **None taken.** **[Show all 30 Disadvantages]**

and, once one is taken, the held picks in full, with the button above them (the row sits at the top of the list, so the button stays in one place as the list toggles). Advantages read the same: **None taken.** **[Show all 57 Advantages]**. *(Ken's voice pass, 2026-11-12: no sentence on what each list is for.)* Once open, the button reads **Show fewer** and sits in the same place, so pressing it twice in a row toggles.

**The filter:** unchanged. With text, matches show from both lists whether folded or not, and "N of M" counts them.

**Natural Advantages, once allocated:** the allocated entries in full, the rest one line each (name, max rank, its stepper, disabled as today since the ranks are spent), then **[Show all 4 Natural Advantages]**.

**Where things land:**

| Press | Record | View | Focus |
|---|---|---|---|
| Show all (a list) | nothing (`S.cpAll`) | That list opens; the other is unchanged | Stays on the button, now Show fewer |
| A + on an entry in an open list | `disadvantages`/`advantages` | The list stays open; the entry is held | Stays on the stepper (`keepPlace`) |
| Show fewer | nothing | The list folds; held entries stay | Stays on the button |
| A − that takes an entry to 0 in a folded list | the rank | The entry folds away | **The fold row's button** (the stepper is gone). Check it, the trap E1a met |
| Filter text | `S.cpFilter` | Matches show across both lists | Stays in the filter |
| Clear the filter | — | The fold returns | Stays in the filter |
| The last Natural Advantage rank | `naturalAdvantages` | The unallocated entries fold | Stays on the stepper |

## 10. Worked examples, as named tests

Write these first, and show each failing on `main`.

1. `smoke-wizard.test.mjs`: **"Decision N: Character Points opens with both lists folded, and Show all opens one"**. A new character on the step: no visible `.pick` in either list; each list has one Show all button whose text names its count, read from the data (`D.disadvantages.length`, and the gated count for a classification that gates). Press Disadvantages' Show all: every Disadvantage is visible, and Advantages are still folded.
2. Same file: **"Decision N: a held pick shows in a folded list, and taking it to 0 folds it away"**. Open Disadvantages, raise one, then Show fewer: that one is visible and the rest aren't. Lower it to 0: it's hidden, and focus is on the Show all button.
3. Same file: **"Decision N: the filter reaches into folded lists, and clearing it folds them again"**. Both folded; type a word that matches one Advantage's name: it's visible. Clear the filter: it's hidden again. Held only still shows only held picks.
4. Same file: **"Decision N: the fold resets with the step and the character"**. Show all, leave the step and come back: folded. Show all, open another character: folded.
5. Same file: **"Decision N+1: Natural Advantages fold once every rank is allocated"**. An Enforcer at Street Level: before allocation, every pool entry has its `.desc`. Allocate the ranks: the unallocated entries have no `.desc`, and Show all opens them. Change the subtype: folded state resets.
6. Same file: **"Decision N: with Expert mode on, the lists fold the same way"** (EQ13).

## 11. Tests beyond the examples

- **Phone:** at 375×812, a new character on Character Points is at most 3,000px with Expert mode off. Measure the Archetype step for Professional + Enforcer with the ranks allocated, and record the before and after in the PR (no target: E1b's lesson).
- **No stored state:** the character's JSON is byte-identical across Show all, Show fewer and a filter.
- **Mutation tests**, against the built code: render held picks folded (example 2 fails); make the filter skip folded lists (example 3 fails); drop the reset on the step change (example 4 fails); fold Natural Advantages before they're allocated (example 5 fails).

## 12. Steps

1. Examples 1–6 as failing tests. `npm run test:fast`.
2. N: the fold in `renderCP` and `applyPickFilter`, the fold rows, the resets. `npm run verify`.
3. N+1: the Natural Advantage fold. `npm run verify`.
4. The copy (§9).
5. In the dev preview, at 375×812 and 1280×860, Expert mode off and on: a new character's Character Points; open, buy, fold, filter, clear; a Supernatural's gated list; an Enforcer's Natural Advantages. **Screenshots in the PR**, and the heights before and after. `npm run phone-check`, re-recording the frame fixture if its frames moved only on these two steps.
6. Mutation tests (§11). Close-out (§14).

## 13. Stop and ask

- **Stop** if a held pick can't stay visible in a folded list without changing what the filter or Held only does.
- **Stop** if the step can't get under 3,000px folded at 375×812: report the measurement and what's left, rather than folding more.
- **Not a stop:** tests that read the lists' visibility or summary text (§5's last row), and the re-recorded frame fixture.

## 14. Close-out

- `close-the-session` for *Rule or shape*: N and N+1 from §3, with *Built* filled; app patch; STATE rewritten where E1c stands (the E line, and E1 closed if this is its last order); a log entry; a `shipped.md` row. The plan's §3: E1c's row links this order and is marked built.
- **CHANGELOG** (player voice):
  - "Character Points opens with its Disadvantages and Advantages folded away: what you've taken stays in view, and Show all opens a list. The filter still finds anything."
  - "Once you've allocated your Natural Advantages, the ones you didn't pick fold away too."
- **PR title:** `feat(wizard): Character Points' lists and the Natural Advantages fold to what's taken (E1c, Decisions N–N+1)`.
- **PR body:** the template's sections, every new string as it renders (for the voice pass), the heights before and after, **Where the order didn't fit**, and the screenshots.
- **Review checklist:**
  - Run step 5's path in a browser at both widths, Expert mode on and off.
  - A held pick never hides: buy, fold, filter, Held only, in every order.
  - Focus after a − takes a folded list's last visible pick to 0.
  - Every fold flag resets where `S.specAll` does, and on a change under it (E1b's review nit).
  - Re-run §11's mutations.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **One place decides visibility.** If the fold sets `hidden` in the renderer and the filter sets it in `applyPickFilter`, a redraw or a cleared filter will disagree. Make `applyPickFilter` (or one helper it calls) the only writer of a pick's `hidden`, and pass it the fold state.
- **The filter re-runs after every render** (`wizard.js:1076`). The fold must too, or a stepper press opens the lists by redrawing them.
- **The gated list counts differently** (`openCount`, plus "held that aren't"). Show all's number is what opens, not `D.advantages.length`.
- **A focus target that vanishes** (E1a's trap): a − to 0 on a folded list removes the stepper the player pressed.
- Seed a blank character rather than copying the test characters. Run `git submodule update --init private` in a fresh worktree before the suite.
