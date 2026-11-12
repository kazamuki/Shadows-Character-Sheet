# Work order E2 — Where everything lives (first half: the shape)

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), E2.
**Status:** first half, the shape proposal. It's awaiting Ken's answers to EQ17–EQ22, and nothing is built until he answers.
**Branch:** `claude/e2-order`.
**Runs beside:** nothing open.

**Pre-flight:**
- The commit is `64982a5` (main after #324). The five TestCharacters were loaded in the dev preview at 375×812, and each was taken through all eight tabs with `openEntry()`.
- Every height and position below is measured, not estimated (the lesson from E1b).
- The inventory was taken by hand from `sheet.js` and the rendered tabs. `/impeccable shape` was not run, so it can still be run on this proposal if Ken wants a second pass.

**Carried over:**
- From E1c's review: a `<details open>` wrapper kept around a folded list let a tap hide the held picks.
- From E1b: a height target set from an estimate was missed by 33%.
- So any fold E2 proposes keeps no tappable wrapper above it, and every target here comes from a measurement.

**How this order runs:** E2 is the plan's two-halves session.
- **This file holds the first half.** That's the inventory (§1), the tasks (§2), the proposal (§3) and the questions (§4).
- **Ken answers.** Once he has, the conductor drafts the second half as the build order: its decisions, sweep, tests and steps.
- **The build order goes to a builder** in the usual loop.
- **One build, or two.** If Ken takes the whole proposal, the build splits into E2a (the moves) and E2b (the distill), so neither PR is a rewrite of the sheet.

---

## 1. The inventory: where each thing shows today

These are the eight tabs, measured at 375×812. Height is the whole page, in pixels.

| Tab | Dax (Werewolf) | Juno (Pro) | Kade (Pro) | Sigrun (Vampire) | Wren (Arcanist) |
|---|---|---|---|---|---|
| Main | 4,009 | 3,194 | 3,403 | 3,878 | 3,305 |
| Skills | 4,018 | 3,783 | 3,692 | 3,820 | 3,839 |
| Character | 4,120 | 2,397 | 2,799 | 5,429 | 3,594 |
| Trackers | 3,590 | 2,801 | 3,138 | 3,167 | 3,374 |
| Progression | 1,156 | 1,156 | 1,210 | 1,156 | 1,210 |
| Session Log | 2,065 | 1,443 | 2,525 | 1,387 | 2,060 |
| Loadout & Powers | 2,000 | 2,089 | 2,625 | 958 | 2,979 |
| Notes | 812 | 812 | 812 | 812 | 812 |

**What shows in more than one place.** Each row is one piece of information; each column gives the tab it shows on and what you can do with it there.

| Information | Main | Trackers | Other tabs | Notes |
|---|---|---|---|---|
| HP, Pain, Sanity, Luck, SFR, Çredits, CRANK | A card each; tap one for its popover (W3) | A full panel each | The vitals bar on every other tab; the pinned panel at 1280px or wider (Decision 160) | Three homes, but the vitals bar and the cards open the *same* popover, so they're one control in three frames. That part works. |
| Damage controls | Heal 1 · Hurt 1 · Take a hit (Decision 151) | Stepper, HL track, Take a hit, Turn Reset, Rest, Focused Healing, Nanomed Kit | — | Take a hit is on both tabs. Recovery is only on Trackers. |
| Conditions | Full list, with Add and Clear | Full list, with Add and Clear (`conditionsHtml(ch, true)`) | — | The same controls twice. |
| Worn armor | Name and stat line | Name, Integrity, After the fight | Loadout: the editable row and repairs | Three places, each partial. |
| Weapons | The attack table with rounds | — | Loadout: the editable rows | Main reads them and Loadout edits them. That's a fair split. |
| Combat skills | The full combat table, untrained included | — | Skills: the same table | It runs 1,010–1,170px on a phone and pushes Stats to between 2,295px (Juno) and 3,057px (Dax) down. |
| A form switch (Werewolf), The Code (Vampire) | The switch | — | Loadout: the same switch. Character: the reference | Decision 195 put it on both on purpose: shifting is a combat action. |
| The Thirst (feeding) | Its panel, under SFR | Its panel | Character: the reference | Decision 201 put it on both. |
| Disciplines | — | — | Character: the reference. Loadout: the rank table | Wren reads them in two places. |
| Aberrations | — | Aberration tracker | Character: the permanent ones, plus the table | |
| Powers | — | — | Character: the archetype's powers. Loadout: the powers panel, where an archetype has one | |
| Grimoire (spells) | — | — | Loadout | A spell is "what I can do", but it's filed with weapons. |
| Advantages and Disadvantages | — | — | Character | |
| Milestones from an archetype | — | — | Progression | |
| Undo, Activity Log | The toast's Undo, after any action | The toast's Undo, after any action | Session Log: the Activity Log and Undo | Right after an action, Undo is one tap. After that, it's on Session Log. |

**Repetition, as the critique found it:**
- **"−1 pain" on every row.** It shows 36 times on Dax's Skills tab, under a banner that already says the totals include it.
- **Untrained rows weigh the same as trained ones.** All 79 skill rows are drawn at the same weight.
- **Tab intros describe the software.** Trackers says "every maximum on this page is computed and recalculates…", and Progression says "auditable, undoable…".

## 2. The tasks at the table, and the moves each takes today

Measured from Main on a phone, with no popover open. The tasks are in rough order of how often they come up mid-scene.

| Task | Today | Moves |
|---|---|---|
| Take a hit | Main's Take a hit sits at 369–404px, inside the first screen | 1 |
| Roll a combat skill | Main: scroll about 1,300–1,900px to the combat table | 0 taps, but a long scroll |
| Roll any other skill | Skills tab, then scroll and read the row past "−1 pain" | 1 tap and a scroll |
| Check a stat | Main: Stats sits 2,295–3,057px down. Or the vitals popover | A long scroll |
| Spend Luck | Main's Luck card, then its popover | 2 |
| Check a weapon | Main: scroll to Weapons at 885–1,335px | A short scroll |
| Look up a power, Discipline or spell | Character, Loadout or Progression, depending on what it is | 1–2 taps, and **you have to know which tab** |
| Apply a Condition | Main's or Trackers' Conditions section | 1–2 |
| Rest, heal, or use a Nanomed Kit | The Trackers tab, then the action | 2 |
| Undo a mistake | The toast's Undo right after an action (`showUndoToast`); later, the Session Log tab, then Undo | 1 while the toast shows; after that, 2, on a tab named for something else |
| Log a session | Session Log tab | 1 |

**What the table shows:**
- **Take a hit and Luck are already quick.**
- **"Where's my power?" costs the most,** because the answer depends on the archetype.
- **Every stat and combat skill costs a long scroll on a phone,** because a full combat table that Skills also draws sits in front of them.

## 3. The proposal

**The rule:** each piece of information gets **one home**. A piece is mirrored on Main only if a player uses it mid-fight, and the mirror is named in a decision. A mirror shows; its home holds everything else.

### 3.1 The tabs: eight to seven

| Tab | What lives there | What changes |
|---|---|---|
| **Main** | The vitals cards and verbs; Conditions; the form switch; weapons; the worn armor line; **trained** combat skills; Stats | Untrained combat skills fold behind "Show N untrained". Their home is Skills. |
| **Skills** | Every skill | "−1 pain" leaves the rows, because the banner says it once. Untrained rows dim. |
| **Character** | Who you are, **and everything you can do**: the archetype, traits, powers, Disciplines, Grimoire, Focused Skills, specialization entries, Aberrations, Advantages, Disadvantages | Loadout's archetype panels (powers, Disciplines, Grimoire, focused skills, specialization text) move here. "What can I do" becomes one tab. |
| **Trackers** | The full panel for every pool, recovery (Rest, Focused Healing, Nanomed), Armor Integrity and wear, archetype trackers, Çredits and its ledger, CRANK | Its Conditions copy goes; Conditions live on Main. Take a hit stays on both, because it's one modal. |
| **Loadout** | What you carry: weapons, armor, gear | Renamed from "Loadout & Powers". The form switch leaves (it's on Main, with the reference on Character). |
| **Progression** | Log a session; IP; Milestones; session history; the Activity Log and Undo | **Session Log merges in.** Logging a session grants IP and Milestone Points, and Progression spends them. It's one between-sessions page. |
| **Notes** | Unchanged | |

**What stays as it is:**
- **The vitals bar and pinned panel stay as they are** (Decisions 140, 160 and 165). They are the part of the sheet that already works.
- **A file saved on the Session Log tab still opens.** `LEGACY_SECTION` maps `sessions` to `progression`, the way it mapped `traits` and `archetype` to Character in Decision 158.
- **GM mode's read-only view follows.** `RO_SECTIONS` is built from `SHEET_SECTIONS`, so it picks up the new tabs.

**Decisions this moves, and what's new since each:**
- **158** set eight tabs. The critique's five lived-in files are the new evidence (EQ2 already opened the count): "what can I do" sits across three tabs, and Undo is filed under the session log.
- **195 and 201** put the form switch and feeding on both Main and the other tab. The proposal keeps both on Main and drops only the second copy of the form switch (Loadout's). Feeding stays on Trackers too, because it refills a pool and Trackers holds the pools' full panels.
- **151** stays as it is.
- **156** (every skill on Skills, untrained at full strength) changes in part, because untrained rows dim.
- **165** stays as it is: Combat comes before Stats, and the trained-only table brings Stats up.

### 3.2 Expected effect, to be confirmed by the build's measurement

The build measures; these are the targets to beat.

| Measure | Today | Target |
|---|---|---|
| Stats' position on Main, phone | 2,295–3,057px | At least 600px higher for every test character |
| "Where's my power?" | 1–2 taps, and you have to know which tab | 1 tap: Character, for every archetype |
| Undo, after the toast is gone | 2 taps, on Session Log | 2 taps, on Progression, which is named for between sessions (EQ21) |
| No task in §2 | — | Takes more moves than today |

### 3.3 W133: the game's words a tap away (EQ1, which E2 weighs)

**The recommendation:** W133 doesn't join E2. It becomes its own session, E8, after E5 (the words).

**Why:**
- **It helps.** Finding a rule without leaving the line you're reading is this plan's goal, and Night Eyes' "Dim and Dark" is the exact case.
- **But it's a new primitive.** It needs a terms list in the data, a decision on whether the engine returns `{ text, terms }`, and a phone tap-target answer.
- **It isn't about where things live.** In E2 it would double the order's size without moving anything.
- **E5 rewrites the same sentences,** so E8 goes in after them, not before.

## 4. Questions for Ken

Each question has a recommendation; one that's left blank is answered with it.

- **EQ17 — The proposal as a whole.** Take §3.1's seven tabs?
  - *Recommended:* yes, built as E2a (the moves) then E2b (the distill).
  - *Alternatives:* moves only, keeping eight tabs; or distill only, with no moves.
- **EQ18 — Session Log into Progression.** Merge them?
  - *Recommended:* yes. One between-sessions page, and history sits beside what it earned.
  - *Alternative:* keep Session Log, and move only Undo.
- **EQ19 — "What can I do" on Character.** Move powers, Disciplines, the Grimoire, focused skills and specialization entries from Loadout to Character?
  - *Recommended:* yes.
  - *Alternative:* the reverse. Keep them on a renamed "Powers" tab and move the reference there, which leaves Character as only who you are.
- **EQ20 — Conditions' one home.** Main or Trackers?
  - *Recommended:* Main. They change the totals you roll, and Main is the in-fight page.
- **EQ21 — Undo, mid-scene.** The toast already gives one-tap Undo right after an action. Once it's gone, Undo is two taps on a between-sessions tab either way. Should E2 also put Undo in the ⋮ menu, so it's always one tap from every tab?
  - *Recommended:* no. The toast covers the mid-scene case, and the Activity Log is where an older action gets found and undone. Make it a wish if it's ever missed.
- **EQ22 — W133.** Its own session E8 after E5 (recommended), or in E2?
