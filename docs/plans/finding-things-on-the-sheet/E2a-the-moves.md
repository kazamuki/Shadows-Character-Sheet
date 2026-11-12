# Work order E2a — The moves: seven tabs, one home each

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E2, its first build. The shape is [E2-where-everything-lives](E2-where-everything-lives.md), and Ken answered EQ17–EQ22 on 2026-11-12.
**Status:** drafted 2026-11-12 by an Opus session the conductor started (Ken asked that orders be drafted by Opus, not by the reviewer). Ken answered EQ23–EQ27 on 2026-11-12 (§4). **Approved by Ken 2026-11-12** ("Approve, build it", in the conductor's session).
**Branch:** the builder's own, cut from `main` once this order (#326) has merged. #325 is already in.
**Runs beside:** E4 (colour). Not E2b, E3 or E5, which wait for it.
**Impeccable:** none. The shape was E2's first half; this order builds it. E2b (the distill) is a separate order.

**Pre-flight:**
- **The commit is `64982a5`** (main after #324: app 0.67.1, game data unchanged since E1b, last decision 280).
- **Measured at 375×812** in the dev preview. The five TestCharacters were loaded with `openEntry()` and taken through every tab.
  - This session's figures read a constant 58px taller than E2's table on the same commit, every tab but Notes. So compare a build against this order's figures, measured the same way, never against E2's.
- **Prototyped.** The five moves were made in a scratch copy of `sheet.js` and `shared.js` (about 40 lines), then measured. `npm test` was run against them, so §5's list of expected breaks is the suite's own. The scratch was reverted, and nothing of it is on this branch.
- **Ledger search.** Searched by name: `SHEET_SECTIONS`, `LEGACY_SECTION`, Session Log, Activity Log, Loadout, Loadout & Powers, the toggle panel, `rankedList`, Grimoire, the powers panel, the `focusedSkills` panel, the `specializationText` panel, Conditions, `conditionsHtml`, `data-condnote`, `data-gotab`.
  - Superseded in part: Decisions **50, 96, 107, 154, 158, 195, 238** and **273**. Each is marked in §3.
  - Cited, and they stand: **30** (already superseded by 158), **110** (the reference panels stay on Character), **114** and **165** (jump bars), **151** (Take a hit), **201** (feeding on Main and on Trackers), **228** (the Session Log's hours), **246** (Character's grid).
  - **201 is not superseded**, though the brief listed it. E2's shape keeps feeding on both Main and Trackers ("it refills a pool and Trackers holds the pools' full panels"), and Ken took the shape.
- **What the shape didn't cover** (found by the prototype). §4 asks about each one that is a choice:
  - **Trackers' Conditions copy is the only place a Condition's note is typed** (`data-condnote`), and the only place the stacking rule shows (`conditionRules.rollPenalty` and `.penaltyStacking`, as a notice). Dropping the copy leaves both with nowhere to render. This is P8a's trap. → EQ24.
  - **A Cyborg's Installed Cybernetics** is a `table` panel on Loadout, and the shape names no home for it. → EQ23.
  - **Three things would show twice on Character once they move:**
    - The Disciplines: Character draws its own rank table, and Loadout's `rankedList` panel draws the same ranks with descriptions.
    - A Professional's Tweak: the Subtype card has a hard-coded `o.tweak` line (`sheet.js:616`), and the `specializationText` panel draws the same tweak with its benefits.
    - A write-in's powers: Character draws them as read cards, and Loadout's `powers` panel edits them.
    → Settled in §3 (one copy each), with the Tweak's choice asked as EQ26.
  - **Main draws a toggle only when an option does something** (`does || text`, `sheet.js:457`). Today every toggle in the data qualifies, but a new one that didn't would have no home once Loadout drops its copy. Main draws every toggle (§3, N+1).

**Carried over** from E1c's review (Opus):
- *The order's:* §9's copy put a sentence under a heading that said what the heading already said, and Ken dropped both keys. So this order's new copy says nothing the heading above it says (§9).
- *The order's:* a `<details open>` wrapper kept above a fold let one tap hide the held picks. This order adds no fold. Where a moved panel sits in a `<details>`, it keeps the wrapper it has today.
- *From E1b:* a height target set from an estimate was missed by 33%. Every target here is a measurement of the prototype (§1).

---

## 1. Goal and Done when

**Goal:** a player finds a thing by asking what kind of thing it is.
- What you can do (powers, Disciplines, spells, Focused Skills, a tweak) is on **Character**.
- What you carry is on **Loadout**.
- What happens between sessions (logging one, IP, Milestones, history, Undo) is on **Progression**.
- Conditions are on **Main**.
- Nothing is in two places unless a decision says why.

**Done when:**
- The tab row reads **Main · Skills · Character · Trackers · Progression · Loadout · Notes**.
- A saved section of `sessions` opens Progression, from the roster and from an older file.
- Every TestCharacter's power, Discipline, spell, Focused Skill and Tweak is on Character, and none of them is on Loadout.
- Loadout shows Weapons, Armor and Gear, plus a Cyborg's Installed Cybernetics (EQ23). It has no form switch.
- Trackers has no Conditions section. Main's Conditions can do everything Trackers' could:
  - add one and clear one;
  - mark a Death Mark;
  - read a Condition's effect and recovery;
  - type its note;
  - read the stacking rule while a penalty is in play.
- Progression holds Log a session, IP, the spends, Milestones, History and the Activity Log with Undo, under a jump bar.
- Heights at 375×812, with no popover and no chip open, are each within 60px of the prototype's, or under it:

| Tab | Dax | Juno | Kade | Sigrun | Wren | Before (same session) |
|---|---|---|---|---|---|---|
| Main | 4,066 | 3,252 | 3,460 | 3,936 | 3,363 | Unchanged |
| Character | 4,178 | 2,776 | 3,198 | 5,487 | 4,856 | 4,178 · 2,454 · 2,857 · 5,487 · 3,652 |
| Trackers | 3,344 | 2,672 | 2,892 | 3,038 | 3,108 | 3,648 · 2,859 · 3,196 · 3,225 · 3,431 |
| Progression | 2,876 | 2,254 | 3,389 | 2,198 | 2,924 | Progression 1,214–1,268, plus Session Log 1,445–2,582 |
| Loadout | 1,851 | 1,671 | 2,127 | 924 | 1,671 | 2,058 · 2,147 · 2,683 · 1,016 · 3,037 |

  The prototype had no Progression jump bar (it adds about 50px) and kept both Tweaks (EQ26 takes one out, so Juno's and Kade's Character should come in under). Main must not move by more than 10px.
- No task in E2's §2 takes more moves than it did.
  - "Where's my power?" is one tap, to Character, for all five.
  - Undo, once the toast is gone, is Progression and then its jump bar's Activity Log.
- `npm run verify` and `npm run phone-check` pass. The frame fixture is re-recorded only on the sheet's tabs.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*. It moves where things live on the sheet, which is a player-facing behaviour someone could have chosen otherwise, and it supersedes eight decisions.
- **Versions:**
  - **App: minor** (EQ27). Every player meets a tab that has gone and three that changed.
  - **Game data: unchanged** (Decision 68). The one data edit is the Arcanist's description, which says where the Grimoire is, and no computed value or choice moves.
  - **Character, table and pack schemas: unchanged.** The open tab is stored in the roster entry, not the character, and `LEGACY_SECTION` maps the old one. No `migrate()` step.
- **Numbers:** three decisions, **N, N+1 and N+2**: the next free numbers on `origin/main` when it's built (281–283 if nothing lands first). No flags.

## 3. Decisions, drafted in full

```
N. **The sheet has seven tabs: Session Log is part of Progression, and Loadout & Powers is Loadout.**
     *2026-11-?? · Ken + Claude · Touches: SHEET_SECTIONS, LEGACY_SECTION, normSection, SHEET_RENDER, renderShProgression, renderShSessions, Session Log, Progression tab, Activity Log, Undo, data-undolast, Log a session, History, jump bar, sectionList, Loadout tab, tab row, RO_SECTIONS, phone-check TABS, E2a*
     - **Decided:** The tabs are Main, Skills, Character, Trackers, Progression, Loadout and Notes. Progression holds what happens between sessions, in this order: Log a session; IP, with its spends and journal; Milestones; History; the Activity Log with Undo. A jump bar under its title reaches each, one row as Character's and Loadout's are. Loadout & Powers is renamed Loadout. A saved `sessions` section opens Progression. GM mode's read-only sheet follows `SHEET_SECTIONS`.
     - **Why:** Logging a session grants the IP and Milestone Points that Progression spends, so they're one between-sessions page, and the history sits beside what it earned (E2's shape, EQ18). Undo had been filed under a session log. "& Powers" named what now lives on Character. One fewer tab helps a row that scrolls on a phone.
     - **Rejected:** keeping Session Log and moving only Undo (EQ18's alternative: two between-sessions tabs); Undo in the ⋮ menu (EQ21: the toast covers the mid-scene case); History and the Activity Log first (logging a session and spending what it earned are the page's work; the jump bar reaches the log in one tap).
     - **Replaces:** Decision 158 in part (eight tabs, now seven); Decision 50 (the Activity Log lives on Progression, under History, not on Session Log).
     - **Revisit if:** players look for Undo on Trackers or Main after the toast is gone (EQ21's wish), or the merged page grows past what its jump bar makes easy.
     - **Built:** app X.Y.0 (minor), PR #…, log entry.

N+1. **What you can do lives on Character, and what you carry on Loadout. Main is the only home of a toggle.**
     *2026-11-?? · Ken + Claude · Touches: renderShCharacter, renderShLoadout, archPanels, rankedList panel, grimoire panel, powers panel, powersPanelHtml, powerCardHtml, focusedSkills panel, specializationText panel, Tweak, toggle panel, togglePanelHtml, table panel, Installed Cybernetics, Disciplines, Grimoire, arch-flow, arch-part, Character jump bar, tab-links, focusedOwedLines, Main Form switch, The Code, E2a*
     - **Decided:** An archetype's `rankedList`, `grimoire`, `powers`, `focusedSkills` and `specializationText` panels render on Character, each a section of its own in Decision 246's grid, after the archetype's own sections and before Advantages. Character shows each thing once:
       - Where a `rankedList` panel is declared, its table (ranks with descriptions) is the Disciplines section.
       - Where a `powers` panel is declared, it is the Powers section (the cards, Improve, Add power), in place of the read cards.
       - A tweak shows in the `specializationText` panel, not again on its subtype's card (EQ26).
       Loadout holds Weapons, Armor, Gear and an archetype's `table` panels (EQ23). Main draws every `toggle` panel, whatever its options do, and Loadout draws none. `tracker`, `feed` and `reference` panels are where they were.
     - **Why:** "Where's my power?" was one to two taps, and you had to know your archetype to know which tab (E2's §2). Spells were filed with weapons. Character already held the archetype's powers as reference, so the move makes it the one place to look (EQ19). A form switch on Main and Loadout was two places for one control, and shifting is a combat action (Decision 195).
     - **Rejected:** a Powers tab holding what you can do, with Character as only who you are (EQ19's alternative: an eighth tab back, and the reference split from what it explains); Installed Cybernetics on Character (EQ23); keeping Loadout's form switch (two homes); Main drawing only a toggle that does something (a new toggle in the data would have no home, Decision 135).
     - **Replaces:** Decision 154 in part (a character's own powers are cards on Character, not Loadout & Powers); Decision 195 in part (the switch is on Main alone; Loadout's copy goes); Decision 238 in part, and Decision 273 in part (the Focused Skills panel and its line pointing to the top of the tab are on Character, not Loadout); Decision 158 in part (Character also holds what the archetype lets you do). Decision 110 (reference panels on Character), 201 (feeding on Main and Trackers) and 246 (the grid) stand.
     - **Revisit if:** an archetype gains a panel that is both something you can do and something you carry (a bonded weapon), or Character on a phone grows so long that its jump bar no longer makes Advantages easy to reach (158's own condition).
     - **Built:** app X.Y.0 (minor), PR #…, log entry.

N+2. **Conditions live on Main: Trackers' copy goes, and Main's opened chip holds the note and the rule.**
     *2026-11-?? · Ken + Claude · Touches: conditionsHtml, conditionInfoHtml, conditionAddHtml, data-condinfo, data-condnote, cond-note, S.condInfo, Conditions section, Trackers tab, Main tab, Pain & Conditions popover, conditionRules.rollPenalty, conditionRules.penaltyStacking, conditionRules.noStacking, ruleHtml, E2a*
     - **Decided:** Conditions are on Main and in the Pain & Conditions popover, as chips with Add a Condition, Death Marks and the Helpless banner, as today. Trackers has no Conditions section. Opening a chip shows its effect and recovery, as today, and also its note field and, if it carries a roll penalty, the stacking rule (EQ24). Each note edit is the one undoable action it was. `conditionsHtml`'s full density goes.
     - **Why:** Conditions change the totals a player rolls, and Main is the in-fight page (EQ20). Two tabs held the same controls. The note and the rule were all Trackers' copy had that Main's didn't, and a tap on the chip is where a player already reads a Condition.
     - **Rejected:** keeping Trackers' cards (EQ20); dropping the note field (a note is stored, and the poison's source is what the table asks about later); the stacking rule always under the chips (height on Main for a line read once); the note field on every chip (a row of inputs under each chip on a phone).
     - **Replaces:** Decision 96 in part (its full cards with effect, recovery and a note field on Trackers; the rule's notice "on Trackers only when a Condition it governs is active" now shows in that Condition's opened chip); Decision 107 in part (its "Both tabs show a collapsible palette": Main's only).
     - **Revisit if:** players miss a Condition's text in full without a tap, or a GM's notes outgrow one line.
     - **Built:** app X.Y.0 (minor), PR #…, log entry.
```

**Supersession marks** (CLAUDE.md, *Decisions*):
- **50:** `→ **Superseded by Decision N**: the Activity Log lives on Progression, under History.` This replaces it whole (the rest is Decision 49's Undo, which stands), so it is struck through in INDEX.
- **96:** `→ **Superseded in part by Decision N+2**: Trackers' full cards go, and the note field and the rule's notice are in Main's opened chip.`
- **107:** `→ **Superseded in part by Decision N+2**: the palette is on Main only.`
- **154:** `→ **Superseded in part by Decision N+1**: the power cards are on Character.`
- **158:** `→ **Superseded in part by Decisions N and N+1**: seven tabs, and Character holds what the archetype lets you do.`
- **195:** `→ **Superseded in part by Decision N+1**: Main is the switch's only home; Loadout's copy goes.`
- **238:** `→ **Superseded in part by Decision N+1**: the Focused Skills panel and its line are on Character.`
- **273:** the same mark as 238's.
- Each mark goes on its INDEX §3 line too. N, N+1 and N+2 each get a line under the sheet's topic.

## 4. Questions for Ken

Each question has a default, and one left blank takes it.

- **EQ23 — A Cyborg's Installed Cybernetics.** Loadout or Character?
  - **Default: Loadout.** It's bought with Çredits, installed and removed like gear, and edited as rows. Its Tolerance Load stays on Trackers.
  - *Alternative:* Character, as something the body can do.
- **EQ24 — Where Trackers' note field and stacking rule go.** Trackers is the only place a Condition's note can be typed, and the only place the stacking rule shows.
  - **Default:** in Main's chip, once opened, under its effect and recovery. The note shows for every Condition; the rule only for one with a roll penalty. Nothing grows until a chip is tapped.
  - *Alternative:* keep a slim note list on Trackers (a second home).
  - *Alternative:* drop the note field. Notes already stored would then show nowhere.
- **EQ25 — Progression's order and its jump bar.**
  - **Default:** the shape's order (Log a session, IP, Milestones, History, Activity Log) under a jump bar. On the merged page, Undo sits about 1,900–2,400px down without the bar, and one chip away with it.
  - *Alternative:* the log first (History and the Activity Log above IP), with no jump bar.
- **EQ26 — The Tweak, once.** Juno's and Kade's Tweak would show twice on Character: as a line on the Subtype card, and as the Tweak panel.
  - **Default:** the panel, which carries the tweak's benefits and reads its field from the data. The Subtype card's hard-coded `o.tweak` line goes.
  - *Alternative:* the card's line, dropping the panel. That leaves `specializationText` a panel type nothing renders, which `engine.test.mjs` fails (Decision 135).
- **EQ27 — App minor or patch?**
  - **Default: minor.** A tab goes and three change for every player. E1's patches each changed one screen.

**Ken's answers, 2026-11-12** (in the conductor's session):

- **EQ23:** Loadout. Ken: "Yes, it will be part of the load out - we have a wishlist item to bring the cybernetics gear into the character sheet as well."
- **EQ24:** the note field and the stacking rule go in Main's chip (Default).
- **EQ25:** the shape's order, under a jump bar (Default).
- **EQ26:** the Tweak panel stays, and the Subtype card's line goes (Default).
- **EQ27:** Ken left it blank, so it takes the default: an app minor bump.

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| The tab list | Eight, with `sessions` labelled "Session Log" and `loadout` labelled "Loadout & Powers" | `SHEET_SECTIONS`, `shared.js:63–72` | Seven. `sessions` goes and `loadout` is labelled "Loadout". Icons are unchanged; `tab_sessions` is still GM mode's (`gm.js:267`) |
| An old saved section | `traits` and `archetype` open Character | `LEGACY_SECTION`, `shared.js:75`; `normSection` | Adds `sessions: "progression"`. `openEntry` (`wizard.js:871`) and the roster's "Sheet · …" line (`wizard.js:852`) both go through `normSection` |
| The render map | `sessions: renderShSessions` | `SHEET_RENDER`, `sheet.js:3003` | No `sessions` key. `renderShSessions` is folded into `renderShProgression`, or kept as a helper it calls. Two callers index it: `app.js:195` falls back to Main, and `drawReadOnly` (`gm.js:4402`) is guarded by `RO_SECTIONS` |
| GM's read-only tabs | Built from `SHEET_SECTIONS` without Admin | `RO_SECTIONS`, `gm.js:4395`; `goTab` falls back to `main` (`gm.js:4445`) | Seven tabs. A stale `S.seatSheet` of `sessions` falls back to Main (browser state, not stored). Grep for any `seatSheet` read before `RO_SECTIONS` is checked |
| Progression's page | IP, the spends, the journal, Milestones. Intro: "Improvement Points and Milestones. Every spend is a journal entry — auditable, undoable, …" | `renderShProgression`, `sheet.js:1653` | Log a session (Session Log's block), then IP, the spends, the journal and Milestones as today, then History and the Activity Log. The intro is Session Log's (§9). Jump bar from `sectionList("pr")` |
| Session Log's page | The log form, History, Activity Log, Undo, admin's Clear | `renderShSessions`, `sheet.js:1771` | On Progression. Its binders (`data-seslog`, `data-sesdel`, `data-undolast`, `data-admin-clearlog`, the hours→IP fill at `sheet.js:4036`) are bound on `#main` whatever the section: check that none is gated on `S.section==="sessions"` |
| Two `step-title` h1s | Each tab has one | `sheetHeader` | Progression still has one: Session Log's header doesn't come with it |
| Character's sections | The archetype; traits, powers, vulnerabilities, specialization, permanent Aberrations, Disciplines (name and rank); Advantages, Disadvantages; reference panels; tab-links | `renderShCharacter`, `sheet.js:546–680` | Adds the moved panels as `arch-part` sections in `arch-flow`, after Disciplines. The jump bar picks them up, since they're drawn with `secs.sect` (Decision 114). One Disciplines, one Powers, one Tweak (§3, N+1) |
| Disciplines twice | Character: name and rank. Loadout's `rankedList`: rank, description and `ranksAdvanceInPlay` | `sheet.js:628`; `sheet.js:2489` | Character draws the `rankedList` panel's table where one is declared, and its own table only where none is (a write-in with magic: check `Engine.disciplineRanks` for one) |
| A write-in's powers twice | Character: read cards, for a write-in (`content.writeIn`). Loadout: `powersPanelHtml` edits them | `sheet.js:597`; `sheet.js:2500`, `2030` | Where a `powers` panel is declared, Character's Powers section is `powersPanelHtml`. A custom power on any other archetype stays `powerCardHtml` on Character (Decision 216) |
| A tweak twice | Subtype card: "Tweak — name: description" from `o.tweak`. Loadout's `specializationText` panel: name, description, benefits | `sheet.js:616`; `sheet.js:2514` | The panel's only (EQ26). The card line goes. The wizard's own tweak line (`wizard.js:356`) is creation's and stays |
| The Grimoire | On Loadout. Its binders (spell add, Hold, Let go, Master, Remove, notes, own spell) | `grimoireHtml`, `sheet.js:2426`; binders at `sheet.js:3040`, `3616–3622`, `4068–4089` | On Character. Let go's focus target is found by `closest("details.spell")` and `attrSel("data-hold", …)`, which don't depend on the tab. Check that the spell picker modal (Decisions 108, 111) opens from Character |
| Focused Skills | Loadout's panel lists them and points "at the top of this tab" | `sheet.js:2503–2513`; `focusedOwedLines(fp, true)`, `shared.js:1074` | On Character. "At the top of this tab" stays true: the ask is at the top of every tab (Decision 273) |
| The form switch and The Code | Main draws a toggle whose options do something; Loadout draws every toggle | `sheet.js:457`; `sheet.js:2520` | Main draws every toggle. Loadout draws none. Comments at `sheet.js:455` and `2528` ("as well as on Loadout", "Main draws the same switch") are rewritten |
| Installed Cybernetics | A `table` panel on Loadout | `sheet.js:2498` | On Loadout (EQ23). Its section on Loadout's jump bar stays |
| Loadout's page | Title "Loadout & Powers"; intro about weapons and "whatever your archetype carries"; Weapons, Armor, Gear, every panel but trackers, feeding and reference | `renderShLoadout`, `sheet.js:2473` | Title "Loadout". Intro per §9. Weapons, Armor, Gear and `table` panels |
| Trackers' Conditions | Full cards: effect, recovery, a note field, Clear, the stacking rule's notice, `noStacking` on none, and the palette | `sheet.js:1554–1555`; `conditionsHtml(ch, true)`, `sheet.js:86` | Gone. Trackers' comment at `sheet.js:1515` ("Pain, Conditions") is rewritten. Nothing else on Trackers reads `conditionsHtml` |
| Main's Conditions | Chips; a tapped chip shows effect and recovery; palette; counters; Helpless | `conditionsHtml(ch, false)`, `conditionInfoHtml`, `sheet.js:74`, `433` | The opened chip adds the note field and, for a penalised Condition, the rule's notice (EQ24). The same chips in the Pain & Conditions popover (`sheet.js:1473`) get both too, since they share the renderer |
| The note binder | `[data-condnote]` on change: one commit | `bindVitalControls` (`sheet.js:3611`), at `3681` | Unchanged. It's in `bindVitalControls`, which binds `#main` and the popover's body alike (checked), so a note typed in either is stored |
| `noStacking` | Shown with "No Conditions." on Trackers only (`full`) | `sheet.js:92` | The sheet no longer shows it. The key keeps its reader, GM mode's Reference (`engine.js:8754`), so the unread-key guard holds (Decision 135). The `full` branch of `conditionsHtml` goes; Aberrations' own `noStacking` line (`sheet.js:790`) is a different panel and stays |
| Copy naming the old tabs | "Powers are edited, added and removed on Loadout &amp; Powers."; "…the Activity Log (Session Log tab)…"; the Arcanist's "Your Grimoire, under Loadout & Powers, …"; Character's foot, "Tracker pools and editable manifests (grimoire, augments, forms) are on [Loadout & Powers] [Trackers]" | `sheet.js:1989`; `sheet.js:2603`; `shadows-data.js:2399`; `sheet.js:673–675` | Each names where the thing now is (§9). Comments: `sheet.js:578`, `shared.js:341`, `shadows.css:1722` |
| Copy naming the tab count | "an eight-tab running sheet" | `CLAUDE.md:34`, `docs/STATE.md:18`, `docs/INDEX.md:341` | "seven-tab". STATE is rewritten at close-out anyway |
| Character's and Loadout's intros | "Who you are: your archetype, and the Advantages and Disadvantages you bought for it. …"; "Weapons, armor, gear, and whatever your archetype carries …" | `sheet.js:679`; `sheet.js:2475` | §9. E5 rewrites every intro later, so these say what's there and no more |
| Print | Its own pages (front, Skills, Loadout, Archetype), not the tabs | `sheet.js:2951–3002` | Unchanged. The print's "Loadout" page was never "Loadout & Powers" |
| phone-check | Lists the eight sheet tabs by hand for the read-only width check; records a frame per tab from the DOM | `tools/phone-check.mjs:428`, `181–185` | The hand list drops `sessions`. The fixture is re-recorded: `sheet: sessions` frames go, and Character, Trackers, Progression and Loadout frames move |
| Tests that pin the tabs | The eight ids and labels | `smoke-table-sheet.test.mjs:13, 76`; `smoke-sheet-archetypes.test.mjs:251`; `smoke-sheet-play.test.mjs:719` | Seven. These are expected breaks |
| Tests that open Session Log | `app.click('[data-sec="sessions"]')`, `openSheet(ch, "sessions")` | §13's list | Click Progression. `openSheet(…, "sessions")` keeps working through `LEGACY_SECTION`, and one test should keep it on purpose (§10, example 2) |
| Tests that act on Loadout's panels | A form toggle, the Grimoire, Disciplines or Focused Skills reached through `[data-sec="loadout"]` | §13's list | Reach them on Main (the toggle) or Character |
| Tests that read Trackers' Conditions | `.cond-card`, `[data-condnote]` on Trackers | §13's list | Read them on Main, with the chip opened |

## 6. Read first

- `CLAUDE.md`: hard constraint 3 (no inline styles: the jump bar and moved sections use existing classes); constraint 9 (no build state in copy); *Change tiers*; *Decisions*.
- `SCHEMA.md` §4: Decisions **50, 96, 107, 110, 114, 154, 158, 165, 195, 201, 216, 238, 246, 273**.
- `src/ui/shared.js`: `SHEET_SECTIONS`, `LEGACY_SECTION`, `normSection`, `sectionList`, `jumpBarHtml`, `focusedOwedLines`.
- `src/ui/sheet.js`:
  - the renderers `renderShMain`, `renderShCharacter`, `renderShTrackers`, `renderShProgression`, `renderShSessions` and `renderShLoadout`;
  - the helpers `conditionsHtml`, `conditionInfoHtml`, `togglePanelHtml`, `powersPanelHtml`, `powerCardHtml` and `grimoireHtml`;
  - `vitalPopover`, `bindVitalControls`, and the binders for `data-condnote`, `data-seslog` and `data-undolast`.
- `src/ui/gm.js:4395–4450` (the read-only sheet).
- `tools/phone-check.mjs:159–190, 428`.

## 7. Out of scope

- **E2b, the distill:**
  - untrained combat skills folded on Main;
  - "−1 pain" off the skill rows;
  - untrained rows dimmed;
  - intros trimmed beyond what a move forces (§9).
- **E3:** Main's columns, and the Grimoire's read mode, which keeps its look on Character.
- **E5:** the words.
- **EQ21:** Undo in the ⋮ menu (declined).
- **W133 / E8.**
- **Worn armor's three partial homes** (Main's line, Trackers' Integrity, Loadout's row). The shape left them as they are.
- **Feeding:** still on Main and Trackers (Decision 201).
- **The print sheet.**
- **GM mode's own tabs.** `TABLE_SECTIONS` has its own `sessions`, which is unrelated.
- **A Progression "Log a session" button on Main** or anywhere else.

## 8. The shapes

No data shape, save-file field, engine function or `migrate()` step changes. Browser and UI state only:
- `LEGACY_SECTION` gains `sessions`.
- `SHEET_SECTIONS` loses it.
- `sectionList("pr")` gives Progression a jump bar.

One data string changes: the Arcanist's description (§9).

## 9. The UI

**The tab row:** Main · Skills · Character · Trackers · Progression · Loadout · Notes.

**Character, top to bottom:**
1. The archetype and its core mechanic.
2. Baseline Traits, Powers (the `powers` panel where declared), Vulnerabilities, the specialization, Permanent Aberrations.
3. Disciplines (the panel's table where declared), the Grimoire, Focused Skills, and the Tweak, each its own section in the grid.
4. Advantages beside Disadvantages.
5. The reference panels.
6. The foot's buttons.

The Grimoire's spell list is wider than a card. It spans the row, as a `solo` card does (Decision 246), and that's the builder's CSS call, not a new layout. The jump bar gains Disciplines, Grimoire, Focused Skills and Tweak where drawn. Each is one tap from the tab.

**Progression, top to bottom:** title, intro, then a jump bar of **Log a session · IP · Milestones · History · Activity Log**. Then each section, as today. Admin's Clear activity log stays under the log.

**Main's opened Condition chip:** effect and recovery, as today. Then the Condition's note field (placeholder as today: "note — source, poison, who did it"). Then, for a Condition with a `rollPenalty`, the rule's notice as Trackers drew it (`ruleHtml` of `rollPenalty.text` and `penaltyStacking.text`).

**Copy** (drafted, for Ken's voice pass; nothing here repeats the heading above it):

| Where | Today | Draft |
|---|---|---|
| Character's intro | "Who you are: your archetype, and the Advantages and Disadvantages you bought for it. Tap an Advantage or Disadvantage to read what it does." | "Who you are and what you can do: your archetype, its powers, and the Advantages and Disadvantages you bought. Tap an Advantage or Disadvantage to read what it does." |
| Character's foot | "Tracker pools and editable manifests (grimoire, augments, forms) are on [Loadout & Powers] [Trackers]" | "What you carry is on [Loadout]. The pools you spend are on [Trackers]." |
| Loadout's title | "Loadout & Powers" | "Loadout" |
| Loadout's intro | "Weapons, armor, gear, and whatever your archetype carries that the rest of the city can't." | "Weapons, armor and gear: what you carry into the city." |
| Progression's intro | Two: Progression's "Improvement Points and Milestones. Every spend is a journal entry — auditable, undoable, …", and Session Log's "Logging a session grants 5 IP an hour of play (change it below if your table runs different), 1 Milestone Point, and refreshes LUCK …" | Session Log's, unchanged. Progression's goes: it describes the software (E2's §1) |
| Admin's power line (`sheet.js:1989`) | "Powers are edited, added and removed on Loadout &amp; Powers." | "Powers are edited, added and removed on Character." |
| Admin's intro (`sheet.js:2603`) | "…logged to the Activity Log (Session Log tab) and can be undone." | "…logged to the Activity Log on Progression and can be undone." |
| The Arcanist's description (`shadows-data.js:2399`) | "Your Grimoire, under Loadout & Powers, holds the Known spells …" | "Your Grimoire, on the Character tab, holds the Known spells …" |

**Where things land:**

| Press | Record | View | Focus |
|---|---|---|---|
| A tab | `S.section` | That tab, at the top | As today (Decision 164) |
| A Progression jump chip | — | Scrolls to the section | The heading (Decision 114) |
| Log session | `sessions`, IP, MP | Progression re-renders; History shows it | As today |
| Undo last action (Progression) | the audit | Re-renders | As today |
| Werewolf on Main's Form | `panelData.form` | Main; the form's weapons lead | As today. Loadout has no switch to keep in step |
| A spell's Hold, Let go or Master on Character | as today | Character re-renders | As today (Decision 224's targets) |
| A Condition chip on Main | `S.condInfo` | Effect, recovery, note and the rule if penalised | Stays on the chip |
| Typing a Condition's note, then leaving the field | `trackers.conditions[i].note` | Re-renders; the chip stays open | The next field, as a change event leaves it. Check that `S.condInfo` survives the render |
| Clear on an open chip | the Condition | The chip and its info go | The palette's summary or the next chip: **check it**, since the pressed ✕ is gone (E1a's trap) |

## 10. Worked examples, as named tests

Write these first, and show each failing on `main`.

1. `smoke-sheet-play.test.mjs`: **"Decision N: the sheet has seven tabs, and Loadout is Loadout"**. Open any locked character. The `#topnav [data-sec]` ids are `main, skills, character, trackers, progression, loadout, notes`, and their text reads Main, Skills, Character, Trackers, Progression, Loadout, Notes.
2. `smoke-sheet-progression.test.mjs`: **"Decision N: a sheet saved on Session Log opens on Progression, with the log, IP, Milestones, History and the Activity Log"**. `openSheet(ch, "sessions")`, a character with two sessions and audit entries:
   - `S.section` is `progression`;
   - `[data-seslog]`, `[data-ipgrant]`, `[data-takeminor]` and `[data-undolast]` are all on the page;
   - the jump bar's chips read Log a session, IP, Milestones, History, Activity Log, in that order.
   Log a session there, and then Undo there: one undo takes it back.
3. Same file: **"Decision N: Undo on Progression peels back an action taken on another tab"**. Hurt 1 on Main, open Progression, then Undo last action: the damage is back to what it was. This replaces the `undoLast` helper's Session Log click (`smoke-sheet-progression.test.mjs:280`).
4. `smoke-sheet-archetypes.test.mjs`: **"Decision N+1: what an archetype lets you do is on Character, and Loadout holds what you carry"**. For each of a Werewolf, a Professional (Wheelman), an Arcanist, a Draugur Vampire, a Cyborg and a write-in, read Character's and Loadout's section headings:
   - Disciplines, Grimoire, Focused Skills, Tweak and a write-in's Powers are on Character where the archetype declares the panel, and never on Loadout;
   - Loadout's headings are Weapons, Armor and Gear, plus Installed Cybernetics for the Cyborg;
   - no `[data-ptoggle]` is on Loadout.
5. Same file: **"Decision N+1: Character shows each thing once"**:
   - an Arcanist has one Disciplines heading, with each Discipline's description;
   - a Professional with a tweak has one "Tweak —" text, in the Tweak section and not in the Subtype card (EQ26);
   - a write-in with a power has one card for it, with Improve.
6. `smoke-sheet-play.test.mjs`: **"Decision N+1: Main draws every toggle, even one whose options do nothing the engine models"**. Give the data a toggle panel whose options carry neither `stats` nor `effectText` (a copy of `D`, as other tests do): it's on Main, with the "apply from the text" line, and pressing an option records it.
7. Same file: **"Decision N+1: a spell held from Character is let go from Main"**. An Arcanist holds a Concentration spell from Character's Grimoire; Main's Holding line names it; Let go there releases it.
8. `smoke-sheet-play.test.mjs`: **"Decision N+2: Conditions are on Main, and an opened chip takes its note"**:
   - Trackers has no `.cond-card`, no `[data-condpalette]` and no "Conditions" heading;
   - on Main, add a Condition with no `rollPenalty`, open its chip, type a note and leave the field: the note is stored, one Undo takes it back, and the chip is still open after the render. The stacking rule's text isn't in that chip;
   - add one with a `rollPenalty` and open its chip: the stacking rule's text is there.
   Pick both from `D.conditions` by their fields, not by name.
9. Same file: **"Decision N+2: the Pain & Conditions popover's chip takes a note too"**. From the vitals bar on Skills, open the popover, open a chip, type a note: stored, and one Undo.

## 11. Tests beyond the examples

- **Phone:** record §1's table for the build in the PR, measured as §1's were (the five TestCharacters, `openEntry`, 375×812). Copy the TestCharacters from Ken's main checkout's `tests/TestCharacters`; they're gitignored. Add Undo's position on Progression, with and without a press of the jump chip.
- **No stored state moved:** a character's JSON is byte-identical before and after opening each tab, including `sessions` through `LEGACY_SECTION`.
- **The read-only sheet** (GM mode): Dead Air's seat sheet shows seven tabs, and Character's Grimoire controls are inert there (`inertSheet`).
- **Voice:** `voice.test.mjs` passes on the new copy (no "Session Log tab", no build state).
- **Unread keys:** `engine.test.mjs`'s unread-data-key guard still passes. `conditionRules.noStacking` keeps GM mode's Reference as its reader, and `specializationText`'s `field` keeps the panel.
- **Mutation tests**, each against the built code:
  - Drop `sessions` from `LEGACY_SECTION`: example 2 fails.
  - Leave the `rankedList` branch in Loadout's loop: example 4 fails.
  - Keep Character's own Disciplines table beside the panel's: example 5 fails.
  - Restore Main's `does || text` filter: example 6 fails.
  - Drop the note field from `conditionInfoHtml`: example 8 fails.
  - Draw the note field only when the chip is on Main's page, not in the popover: example 9 fails.
  - Check each for a second path that already covers the line, as the pre-flight asks.

## 12. Steps

1. **The examples as failing tests.** Write examples 1–9 and run `npm run test:fast`.
2. **N: seven tabs, and the merged Progression.**
   - Make the changes to `SHEET_SECTIONS`, `LEGACY_SECTION` and `SHEET_RENDER`.
   - Fold Session Log into Progression, with its jump bar.
   - Update the hand list in `phone-check`.
   - Update the tests that click `sessions`.
   - Run `npm run verify`.
3. **N+1: the panels move to Character, Loadout keeps what you carry, and Main draws every toggle.**
   - Give Character one Disciplines, one Powers and one Tweak.
   - Update the tests that reached panels through Loadout.
   - Run `npm run verify`.
4. **N+2: Trackers' Conditions go, and Main's opened chip gains the note and the rule.**
   - Check the popover's binder.
   - Run `npm run verify`.
5. **The copy (§9)**, and the supersession marks (§3), with their INDEX lines.
6. **In the dev preview, at 375×812 and 1280×860, with all five TestCharacters:**
   - every tab;
   - a form shifted on Main;
   - a spell held and let go;
   - a Condition's note typed on Main and in the popover;
   - a session logged, then undone.
   Put the **screenshots in the PR**, with §1's heights before and after.
7. **`npm run phone-check`.** Re-record the frame fixture if only the sheet's tab frames moved.
8. **Mutation tests (§11), then close-out (§14).**

## 13. Stop and ask

**Stop if:**
- a moved panel's binder only works on Loadout, and the fix would change what the control does;
- Main's height moves by more than 10px with no chip open;
- any tab is more than 60px over §1's figure: report the measurement, rather than trimming;

**Not a stop.** The prototype's `npm test` at `64982a5`, with the five moves made, failed **56 of 1,769**, and every one was one of these. It is the suite's own list:
- **`smoke-sheet-play` (17), `smoke-sheet-skills` (12), `smoke-sheet-progression` (9), `smoke-sheet-archetypes` (9), `smoke-wizard` (5), `smoke-table-sheet` (4).** No engine, rules, docs, build, voice or hostile test failed.
- **Clicks on the tab that's gone** (`click: no element for [data-sec="sessions"]`): the Session Log, IP, Milestone, Undo and training tests, and W45's and W60's walks over every tab. Point them at Progression. W60's check that headings step down one level at a time must still pass on the merged page: Session Log's `h2`s join Progression's.
- **Clicks on Trackers' Conditions** (`no element for [data-condquick=…]`): a Condition added on Trackers, the body-part picker, Take a hit, Turn Reset, a tracker's own Undo, W47's palette focus, Decision 268's heal. Add the Condition on Main.
- **Panels reached through Loadout:** the Grimoire tests (the picker, linking, inscribed spells, Hold and Let go, P10's hostile id, W32, Decision 139's tags), the written-power tests (Add, Improve, Admin's write-in, Decision 194 and 216's Raise), the Forge Fang's shift, W5's jump bar ("archetype panels included"), and the Mercenary and Enforcer pick tests (Decision 273). Reach them on Character, or the form on Main.
- **The eight tabs listed:** "a locked character resumes from storage and every sheet tab renders", Decision 256's three read-only-sheet tests and U4 (`smoke-table-sheet`).
- **The tab row's width** (B19, "keeps the active tab in view"): it measured 410px for eight tabs. Re-derive its number for seven, from the rendered row, not by hand.
- **Decision 246's grid** (P16 1 and 2): they expect every Character section to hold cards, and the Grimoire's section held none (`arcanist/1 aberration: Grimoire has no card`). How the Grimoire sits in the grid is the builder's call (§9), but 246's rules (a heading opens each part; `solo` only on exactly one card) must still hold. Change the test's expectation for the Grimoire only, and say so in the PR.
- **The re-recorded frame fixture.**

## 14. Close-out

- **`close-the-session`, for *Rule or shape*:**
  - N, N+1 and N+2 from §3, with *Built* filled in;
  - the eight supersession marks, and their INDEX lines;
  - the app minor bump (EQ27);
  - STATE rewritten where E2 stands (E2a built, E2b next);
  - a log entry;
  - a `shipped.md` row.
  - In the plan's §3, the E2 row links this order and is marked "E2a built".
  - `CLAUDE.md:34` and `INDEX.md:341` read "seven-tab".
- **CHANGELOG** (player voice):
  - "The sheet has seven tabs. Session Log is now part of Progression: log a session, spend what it earned, and find your history and Undo in one place. A sheet you left on Session Log opens there."
  - "Powers, Disciplines, your Grimoire, Focused Skills and your Tweak are on Character now, with the rest of what your archetype lets you do. Loadout holds what you carry."
  - "A form switch is on Main, where you fight. Conditions live on Main too: tap one to read it, type its note, or see how penalties stack."
- **PR title:** `feat(sheet): seven tabs, one home each: Progression takes Session Log, Character takes what you can do, Main takes Conditions (E2a, Decisions N–N+2)`.
- **PR body:**
  - the template's sections;
  - every new string as it renders, for the voice pass;
  - §1's heights, before and after;
  - Undo's position;
  - **Where the order didn't fit**;
  - the screenshots.
- **Review checklist:**
  - Re-do §5's sweep by grepping for readers: `SHEET_SECTIONS`, `SHEET_RENDER[`, `"sessions"`, `data-sec=`, "Loadout &", "Session Log", `conditionsHtml(`, `archPanels(`.
  - Every TestCharacter, every tab, at both widths. Read each page once for anything shown twice.
  - Main's height is unchanged with no chip open.
  - A note typed in the popover is stored.
  - A sheet saved on `sessions` opens on Progression, from the roster and from an imported file.
  - GM mode's seat sheet: seven tabs, and the Grimoire is inert.
  - Re-run §11's mutations.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **Every reader of a section id, not just the tab row.** `SHEET_RENDER[section]` is indexed in two places: `app.js:195`, which falls back to Main, and `gm.js:4402`, which doesn't (`RO_SECTIONS` guards it). Grep `SHEET_RENDER[` before deleting the key.
- **A moved panel brings its binders.** They're bound on `#main` by attribute, so they should follow. The popover's body is bound by `bindVitalControls`, which already holds the note binder: keep the note field in the shared chip renderer, not in Main's page code, or the popover loses it.
- **Three duplicates appear only after the move** (§3, N+1). Read Character for an Arcanist, a Professional with a tweak, and a write-in with a power before calling the move done.
- **A focus target that vanishes** (E1a's trap). Clear on an open chip removes the button pressed.
- **Measure the way §1 did**, in the same preview session for before and after. This session's figures ran a constant 58px over E2's on the same commit.
- **Mount the private repo** with `git submodule update --init private` in a fresh worktree before the suite.
