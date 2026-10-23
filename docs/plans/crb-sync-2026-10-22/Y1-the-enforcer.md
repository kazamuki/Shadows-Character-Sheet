# Work order Y1 — The Enforcer to `0412`

**Plan:** [`../crb-sync-2026-10-22.md`](../crb-sync-2026-10-22.md) §2, row Y1.
**Status:** **drafted 2026-10-23 by Claude (Opus)**, the Y0 reviewer, after #225 and Shadows-Private #2
merged. **Approved by Ken 2026-10-23, as written; YQ5–YQ7 on their defaults** (§4).
**Pre-flight:** against Shadows-Character-Sheet `main` at `e7320f2` (#225 merged), with `private/` at `e6acadc`
(Shadows-Private `main` is the merge `82ea734`, which contains it). Read and probed 2026-10-23.
**Tier: Rule or shape.** One decision (**N**), the next free number on `origin/main` when it's built (237 is
the last today). No flag. No schema bump: the save file's shape doesn't move.
**Branch:** one, cut from `main`. **Runs beside:** nothing. Y4 is drafted after this merges (the README's step 7).
**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md). Ken starts **Y1 build**
(Sonnet), then a fresh reviewer (Opus) once the PR is open.

**Carried over from Y0's review.** Three things, one of them the order's:
- **The order's:** §10 named the CRLF trap, but §3a's table specified a new text step without it, and the
  builder built the table. *A trap belongs in the row it applies to*, not only in the hand-over. This order
  writes each one into its step.
- **The build's:** the PR skipped the dev-preview steps (buying the armor, counting a tracker) and checked
  the data in the page with JavaScript instead. **The preview steps here are interactions, done by clicking,
  with a screenshot each** (§12 says how to get a locked Enforcer into the preview).
- **The build's:** the last fix commit went up without a full `npm run verify`. **The PR's final verify runs
  on its final commit.**
- Also: Y0's close-out missed `README.md`'s status line, which `docs.test.mjs` caught. It's in §14 here.

---

## Pre-flight

```
0412 (mirror e6acadc), ##### Enforcer        matches APPROVED_Enforcer_revamp word for word
  REQUIRED STATS     BOD 8 | COOL 7
  FOCUSED SKILLS     Athletics, Combat Sense, Cybernetics, Intimidation, Investigation, and 1 Combat Skill
  TWEAK              Duty Grade: Interpreter, Hardwired, Hardened, Issued Hardware ("[Starting chrome, pending
                     the loadout decision.]")
Data today (shadows-data.js ~2625)
  requires.stats     REF 5, MOB 7, BOD 8
  focusedSkills      { ids: athletics, combat-sense, intimidation, investigation, survival }   (no choose)
  tweak              Hard Knock Life, 2 benefits; no grants
Every other Professional subtype, 0412 against the data (a scratch parser)
  Cleaner, Fence, Jack of All Trades, Mercenary, Slayer, True Warrior, Wheelman: Required Stats and Focused
  Skills all match. The Enforcer is the only drift.
Probes on main (tests/harness.mjs loadEngine, a Heroic Enforcer, Survival 3, Cybernetics 2)
  a draft at REF 5, MOB 7, BOD 8, COOL 5     validate: no requirement error
  a draft at BOD 8, COOL 7, REF 4, MOB 4      validate: "Enforcer requires REF 5 (you have 4).", "…MOB 7 (you have 4)."
  focusedSkillIds                              athletics, combat-sense, intimidation, investigation, survival
  focusedPicks                                 null
  locked: ipCost survival (3 → 4)              9  (focused, 3 × 3)
          ipCost cybernetics (2 → 3)           10 (standard, 5 × 2)
  skillRankCap survival / cybernetics          7 / 5
Readers of a missing pick on a locked sheet
  Decision 134: the Focused Skills panel (Loadout & Powers, sheet.js ~2321) says "Choose 1 more Combat Skill to
  Focus." and shows the wizard's picker (focusedPickHtml, shared.js ~1032). Nothing else on the sheet says it.
  The sheet reopens on the tab it was left on (openEntry, wizard.js ~789), so most players never see it.
"The sheet names the TECH Essence check against EMP" (the plan's row for Hardened)
  Only one place does: the Forge Fang's EMP vulnerability (shadows-data.js ~3365), a Werewolf's. An Enforcer
  can never hold it, and the sheet has no Essence-check roller. There is nothing for Hardened to compute
  against: see YQ5.
```

---

## 1. Goal and Done when

A player making an Enforcer meets the book's Enforcer, and a player opening one saved before this update
is asked for the Combat Skill it's now owed.

**Done when:**
1. The wizard's Specialization step shows the Enforcer requiring **BOD 8, COOL 7**, and validate holds a
   draft to those stats (REF and MOB no longer gate it).
2. An Enforcer's Focused Skills are Athletics, Combat Sense, Cybernetics, Intimidation, Investigation and
   **one Combat Skill the player picks**, through the picker the Cleaner and the Mercenary already use.
3. Its tweak is **Duty Grade**, in the book's words: Interpreter, Hardwired, Hardened. No Issued Hardware
   (YQ3), and nothing anywhere that says it's missing.
4. **A locked character short of a Focused Skill pick is asked for it at the top of every sheet tab**, with
   the picker, until the pick is made (Decision **N**). An old Enforcer is the case that prompts it; any
   locked character with a short or invalid pick gets the same.
5. A saved Enforcer keeps everything it stored: its Survival ranks stay, Survival now advances at the
   standard price and Cybernetics at the Focused one. `migrate()` changes nothing.
6. A guard reads every Professional subtype's Required Stats from `0412`, so the next drift fails a test.

## 2. Tier, versions, numbers

- **Rule or shape**: one decision, **N** (§3). No flag.
- **App:** a **minor** bump, the next minor after the version `[Unreleased]` names (0.53.0 while 0.52.1 is
  unreleased). The ask is a capability a player didn't have.
- **`gamedataVersion`:** 0.45 → **0.46** (Decision 68: the Enforcer's requirements, Focused Skills and
  choices change).
- **Character schema:** **no bump.** `archetypeChoices.focusedSkillPicks` already exists, and `migrate()`
  already filters it to strings (engine ~4788). An old Enforcer's empty list is simply short.
- **Table, pack, ruleset:** untouched.

## 3. Decisions, drafted in full

Paste into `SCHEMA.md` §4 with the number taken, and fill *Built*.

```
N. **A locked character short of a Focused Skill pick is asked for it at the top of every sheet tab, with the wizard's picker, until it's chosen.**
     *2026-10-23 · Ken + Claude · Touches: focusedPicks, focusedPickHtml, data-fpick, sheetHeader, importIssuesHtml, focusedSkills panel, toggleFocusedPick, Enforcer, Duty Grade, YQ2, YQ6*
     - **Decided:** While `Engine.focusedPicks(ch)` is incomplete on a locked character (a pick short, or one the data no longer allows), every sheet tab opens with a block below any load findings that says so in the panel's words and holds the wizard's picker. Choosing there is the one undoable action it already was. It has no Dismiss and goes when the picks are complete. The Focused Skills panel on Loadout & Powers keeps its line and no longer repeats the picker. Nothing prints.
     - **Why:** The Enforcer's revamp (`0412`, 2026-10-16) owes every saved Enforcer a Combat Skill, and Ken's YQ2 answer is to ask on open. The sheet reopens on the tab it was left on, so a picker in one panel on one tab is one most players never see.
     - **Rejected:** a modal on open (it blocks the sheet for a choice that can wait a tap); Loadout only, as Decision 134 left it (YQ2 asked for more); a Dismiss (a short pick is an unfinished character, not news, unlike Decision 125's findings); picking one automatically (the player's choice); two pickers on Loadout; naming the Enforcer in code (Decision 135).
     - **Replaces:** Decision 134 in part: a locked character short of a pick chose it in the Loadout panel; it now chooses it at the top of whichever tab is open, and the panel keeps only its line.
     - **Revisit if:** another creation choice can go missing on a locked character (a Base Power, a Natural Advantage) and wants the same ask; then the block becomes a list of what's owed.
     - **Built:** app 0.53.0, game data 0.46, no schema bump, PR #…. Log 2026-10-2x (Y1).
```

Supersession marks (CLAUDE.md, *Decisions*):
- Decision 134's entry: `→ **Superseded in part by Decision N**: a locked character short of a pick is asked at the top of every sheet tab; the panel keeps its line, not the picker.`
- `INDEX.md` §3, *Archetypes & specialization*, 134's line: `→ **superseded in part by N**`.
- `INDEX.md` §3, the same topic, a new line after 134:
  `- **N** *(The Enforcer to 0412 — crb-sync Y1, YQ2, YQ6)* — a locked character short of a Focused Skill pick is asked at the top of every sheet tab, with the wizard's picker, until it's chosen; the Loadout panel keeps its line.`

The Enforcer's new data is content following the book, not a choice: no decision for it.

## 4. Questions for Ken

YQ2 and YQ3 were answered with the plan (ask on open; ship without Issued Hardware). These three are new,
and **Ken answered all three on their defaults, 2026-10-23**.

| Id | Question | Default |
|---|---|---|
| **YQ5** ✅ | The plan's row says Hardened becomes "a computed choice where the sheet names the TECH Essence check against EMP". The pre-flight found **no such place an Enforcer can reach**: the only one is the Forge Fang's EMP vulnerability, and the sheet has no Essence-check roller. Build Hardened as text, or hold it? | **Text, as the book prints it**, like Interpreter and Hardwired. W90 gives it something to compute against when cybernetics bring EMP to an Enforcer; the order adds that sentence to W90 |
| **YQ6** ✅ | Where does the ask sit? (a) **The top of every sheet tab**, the picker in it, the Loadout panel keeping only its line; (b) Main only, with a link from the panel; (c) a modal on open | **(a).** The sheet reopens on any tab. A modal blocks the sheet for a choice that can wait. Ten pick rows push the tab down on a phone until the choice is made, and that's the point |
| **YQ7** ✅ | The Enforcer's one-line `description` (the Specialization step and the Character tab). The book's two paragraphs are long. Ship the draft in §8, or the book's first paragraph whole? | **The draft**, marked for Ken's voice pass in the PR. It keeps the book's sentences, cut to the sheet's length, and names the NCI the tweak then relies on |

## 5. The assumption sweep

Each row grepped on `e7320f2`. "After" is what's true once Y1 is built.

| Changed | Today, where | Readers (grepped) | After |
|---|---|---|---|
| `enforcer.requires.stats` | REF 5, MOB 7, BOD 8 (data ~2629) | `validate` via `checkPrereqs` (engine ~5285): wizard errors; the wizard's requirement chip (wizard.js ~306). **No reader on a locked sheet** | BOD 8, COOL 7. A draft at the old stats with COOL < 7 now errors "Enforcer requires COOL 7 (you have N)." and can't lock: expected, not a stop. A locked Enforcer is past creation and nothing re-checks it |
| `enforcer.focusedSkills` | 5 ids, survival among them, no `choose` | `focusedSkillSpec` → `focusedPicks`, `focusedSkillIds` (engine ~2523–2565); then `skillRankCap` (creation cap, ~2581), `focusedPrice` → `ipCost` (~2721), `canBoost` (~982), `validate` (~5153, 5189, 5289), `traitRows`' `skillsFrom: "focused"` (only True Warrior's Unwavering Focus uses it), the Skills tab's Focused mark (sheet.js ~357), Progression's raise list (~2983), the wizard's skills step (wizard.js ~514) and pick (~378), the Loadout panel (~2321) | ids: athletics, combat-sense, cybernetics, intimidation, investigation; `choose: { count: 1, category: "combat" }`. Options: the ten Combat skills less Combat Sense. Survival's cap and price go standard, Cybernetics' go Focused (probes: survival 9 → 15 IP, cybernetics 10 → 6 IP; caps 7/5 → 5/7 at Heroic). A **draft** holding Survival above the standard cap now errors on the Skills step: expected, not a stop |
| `enforcer.tweak` | Hard Knock Life, 2 benefits | the wizard's Specialization card (wizard.js ~315: name, description, benefits joined by spaces), the Character tab (sheet.js ~609: name and description only), Loadout's `specializationText` panel (~2339: name, description, a bullet per benefit). **Not printed** (`renderPrintView` reads no tweak). No `grants`, so no Skill row reads it | Duty Grade, the book's paragraph, 3 benefits. Nothing computes from them (YQ5) |
| `enforcer.description` | the old paraphrase | the Specialization select (wizard.js ~146), the card (~313), the Character tab (~609) | the YQ7 draft |
| A locked character's short pick | shown in the Loadout panel only (Decision 134) | `focusedPicks(ch).complete` | asked at the top of every tab (§9). **Twins:** the panel's line (kept), the panel's picker (removed), the wizard's picker (unchanged; the wizard is a draft) |
| `data-fpick` | bound on the sheet's `main` (sheet.js ~3988) | the binder sits in `bindSheet` and queries all of `main`, so a picker in the header is bound with no new binder | one picker on screen at a time |
| `sheetHeader` | load findings, then the title (sheet.js ~38) | every sheet tab's renderer | the ask goes after the load findings, before the title |
| The Activity Log line | "Focused Skill: Rifles" (kind `loadout`) | the Session Log, Undo | unchanged |
| Existing tests | `smoke-wizard.test.mjs` ~428: *"a locked Mercenary short its pick chooses it on Loadout"* clicks `[data-fpick="rifles"]` on Loadout and matches "Choose 1 more Combat Skill to Focus" | the click finds the header's picker now, and the panel still has the line | **passes unchanged**, and its name is still true. If it fails, that's a stop |
| `rules.test.mjs` 932–970 (Mercenary, Cleaner) | `professional(subtype)` helper | — | unchanged; the Enforcer's test sits beside them and reuses the helper |

Nothing in `src/` names the Enforcer, Survival or Hard Knock Life (`grep -rni "enforcer\|hard knock" src/engine src/ui`:
empty), and no test does (`grep -rni enforcer tests/`: empty).

## 6. Read first

- `CLAUDE.md`: constraints 6 (ids never change: `enforcer` stays), 7 (store inputs: no stored focus list),
  8 (the engine is total), 9 (no build-state copy: Issued Hardware never renders); *Change tiers*;
  *Decisions*.
- `SCHEMA.md` §4: Decisions **134** (Focused Skills as data), **125** (load findings), **135** (no archetype
  in code), **68** (when game data bumps). INDEX §3 finds them.
- `src/engine/engine.js` ~2519–2590 (`focusedSkillSpec`, `focusedPicks`, `toggleFocusedPick`,
  `focusedSkillIds`, `focusedPrice`, `skillRankCap`).
- `src/ui/shared.js` ~958–975 (`loadFindings`, `importIssuesHtml`), ~1032 (`focusedPickHtml`).
- `src/ui/sheet.js` ~38 (`sheetHeader`), ~2321–2335 (the Focused Skills panel), ~3985 (the `data-fpick` binder).
- `tests/rules.test.mjs` 932–970, `tests/smoke-wizard.test.mjs` ~428.

## 7. Out of scope

- **Cybernetics, the NCI, Energy, a free NCI on the loadout, Hardwired's kicker as a computed effect**: W90.
- **Issued Hardware**: YQ3. Not in the data, not in a note, not in a comment the app renders.
- **Hard Knock Life anywhere else**: it's gone from the book. Don't keep it as a retired benefit.
- **Re-checking a locked character's requirements or caps**: creation rules bind creation only.
- **Any other subtype's text**, even where it differs in wording from `0412` (the pre-flight compared stats
  and Focused Skills only).
- **Y4** (powers at creation) and the Vampire's or Werewolf's data.

## 8. The shapes

**The data** (`archetypes` → professional → `specialization.options` → `enforcer`). The id and its place
in the list stay. Replace `description`, `requires`, `focusedSkills` and `tweak`:

```json
"description": "Police officer, bodyguard, corporate security, syndicate muscle, or the occasional vigilante. The patch on your shirt changes; the job doesn't. Every Enforcer carries a Neurocybernetic Interpreter, and almost none of them paid for it.",
"requires": { "stats": { "BOD": 8, "COOL": 7 } },
"focusedSkills": { "ids": ["athletics", "combat-sense", "cybernetics", "intimidation", "investigation"], "choose": { "count": 1, "category": "combat" } },
"tweak": {
  "name": "Duty Grade",
  "description": "Plenty of people in NYTE City carry chrome. You run it. Years of living with the NCI have taught your body to carry hardware the way other people carry an old injury: constantly, and without complaint.",
  "benefits": [
    "Interpreter. You have an NCI installed at no cost. Your Energy is your TOL plus the NCI bonus, and your systems run at their listed Energy cost.",
    "Hardwired. Once on each of your turns, when an installed cybernetic system is doing active work in a check, you may choose to add a 1d4 kicker die to that check before you roll: an arm blade in a strike, an optical implant on an Awareness check, a SMARTlink guiding a shot.",
    "Hardened. When making a TECH Essence check to resist EMP and hardware failure, you may make a BOD Essence Check instead."
  ]
}
```

The tweak's description and its three benefits are **`0412`'s words exactly** with the bold markers
dropped (the pre-flight checked each is a substring of the book with `**` removed). The `description` is
YQ7's draft. Keep the data file's own formatting: `requires.stats` is written one stat per line elsewhere
in this block, so match that.

No `flagged`, no `flagNote`, no `playerNote`: nothing is computed, so nothing guesses (YQ5). The NCI's
numbers are W90's questions for Deighton, not a flag the sheet needs.

**The engine:** no change. `focusedPicks` and `toggleFocusedPick` already do everything the ask needs, for
any archetype, and stay total. No new export.

**`migrate()`:** no change, and no step. A saved Enforcer's `focusedSkillPicks` is `[]` and stays `[]`;
its `skills.survival` stays as stored.

## 9. The UI

**The ask.** One generic renderer in `shared.js` beside `focusedPickHtml`, say `focusedOwedHtml(ch)`. It returns `""` unless the
character is locked and `Engine.focusedPicks(ch)` is non-null and not `complete`. Otherwise it returns a block with:
- a short label, **"Focused Skills"**;
- the panel's own sentences, from one helper both use (move them out of sheet.js ~2329–2331 so the words
  can't drift): "Choose 1 more Combat Skill to Focus." and, when a pick is invalid, "A pick below can't be a
  Focused Skill any more. Remove it.";
- `focusedPickHtml(ch, "data-fpick")`.

`sheetHeader` puts it after `importIssuesHtml()` and before the title, so every tab has it. Suggested
markup is the `.import-issues` box's look without its Dismiss; the builder may style it as a notice. It
must not print (print renders its own view, so it won't unless someone adds it there).

**The panel** (Loadout & Powers, sheet.js ~2321): keeps the names line, the "Choose…" and "Remove it"
lines, and **drops** its `focusedPickHtml` call. One picker on screen, on every tab.

**Where things land:**

| Press | What changes | Where the record lands | Focus |
|---|---|---|---|
| Choose (header) | `focusedSkillPicks` gains the skill; one audit entry "Focused Skill: <name>" | the block re-renders. If that completed the picks, it's gone from every tab; if not (a count above 1), it shows the next | stays on the tab; the page re-renders as any commit does today. No `keepPlace` work is expected; if Enter on the button drops focus to `<body>`, list it under *Where the order didn't fit* |
| Remove (an invalid pick) | the pick is taken off; one audit entry "Focused Skill removed: <name>" | the block stays while a pick is still short | as above |
| Undo | the pick comes back off | the block is back on every tab | as Undo does today |
| Opening the character | nothing | the block is on whichever tab it opens on | — |

**Copy:** the label and the two sentences are tool voice (the player is stuck, `VOICE-APP.md`), and the
sentences already exist. The YQ7 description is narrative: mark it for Ken's voice pass in the PR.

## 10. Worked examples, as named tests

Write these first and show each failing on `main` (or say why it already passes).

**`tests/rules.test.mjs`**, in the Professional block after the Cleaner's test:

1. **`CRB 0412: every Professional subtype requires the stats the book prints`**. Split `0412` on
   `^##### ` and take each subtype's name. Take the first non-blank line after the one with `REQUIRED STATS`,
   drop `\`, split on `|`, and compare the set of `"STAT N"` with the option's `requires.stats`, order free.
   Every option the book prints must be in the data, and every data option with `requires` in the book.
   **Fails on `main`:** the Enforcer's REF 5 / MOB 7 / BOD 8 against BOD 8 / COOL 7.
2. **`CRB 0412, Enforcer: "Athletics, Combat Sense, Cybernetics, Intimidation, Investigation, and 1 Combat Skill"`**,
   modelled on the Mercenary's: assert the book's line (`/Athletics, Combat Sense, Cybernetics, Intimidation,
   Investigation, and 1 Combat Skill/`). Five ids sorted. `need` 1, and `validate` asks for the pick. The
   options are all Combat and exclude Combat Sense. `toggleFocusedPick(ch, "rifles")` is ok, giving 6 ids
   and no Focused errors. A second pick is refused. **Fails on `main`:** `focusedPicks` is null.
3. **`CRB 0412, Enforcer: Duty Grade is the book's words, without Issued Hardware`**: `tweak.name` is
   "Duty Grade". With `**` stripped from `0412`, the description and each of the 3 benefits are substrings
   of it. No benefit and not the description contains "Issued Hardware" or a `[`. **Tripwire:** assert
   `0412` still prints Issued Hardware's placeholder
   (`/Issued Hardware\.\*\* \\\[Starting chrome, pending the loadout decision\.\\\]/`), with the message
   *"0412 wrote Issued Hardware: add it to Duty Grade (YQ3)"*. **Fails on `main`:** Hard Knock Life.
4. **`Y1: a saved Enforcer keeps its skills; Survival advances at the standard price and Cybernetics at the Focused one`**.
   A locked Heroic Enforcer with `survival {rank 3, ipe 0}` and `cybernetics {rank 2, ipe 0}`, put through
   `Engine.migrate`: `focusedSkillPicks` is `[]`, `skills.survival.rank` is 3, `ipCost(…, "survival").cost`
   is **15** and `ipCost(…, "cybernetics").cost` is **6**. **Fails on `main`:** 9 and 10.
5. **`Y1: a draft Enforcer is gated by BOD 8 and COOL 7, not REF and MOB`**. At REF 4, MOB 4, BOD 8, COOL 7
   validate has no "Enforcer requires" error; at COOL 5 it has exactly "Enforcer requires COOL 7 (you have 5).".
   **Fails on `main`:** REF and MOB errors.

**`tests/smoke-wizard.test.mjs`**, after the Mercenary's sheet test:

6. **`Decision N: a locked Enforcer short its Combat Skill is asked on whichever tab it opens on, and choosing it there is one undoable action`**.
   Build it from `lockedCharacter()` as a Professional with `specialization = ["enforcer"]`, and `openSheet(ch, "skills")`.
   - `#main` has "Choose 1 more Combat Skill to Focus." above the title, and `[data-fpick="rifles"]`.
   - Click every `[data-sec]` tab in turn: each has the block, and **exactly one** `[data-fpick="rifles"]`
     (Loadout too).
   - Click Rifles: `focusedSkillPicks` is `["rifles"]`, and no tab has the block any more.
   - The Session Log has "Focused Skill: Rifles"; Undo empties the picks and the block is back.
   - `app.errors` is empty.
7. **`Decision N: a complete pick asks nothing, and an invalid one asks to be removed`**. A locked Mercenary
   with `["rifles"]` has no block on Main. A locked Enforcer holding `["survival"]` (not a Combat skill) has
   the block with "can't be a Focused Skill any more" and a **Remove** on Survival, and removing it leaves
   the "Choose 1 more" line.

## 11. Tests beyond the examples

- **Totality:** `focusedOwedHtml` with a draft, with no specialization, with a `focusedSkillPicks` that
  `migrate()` cleaned of junk: no throw, `""` where nothing is owed. Fold it into example 7.
- **Hostile:** nothing new reaches the engine. `focusedSkillPicks` junk is already covered:
  `hostile.test.mjs` ~54 poisons it, and `engine.test.mjs` ~625 ("junk focused picks") runs it through
  `migrate()`.
- **Voice:** `voice.test.mjs` scans the data, so the Enforcer's strings are covered. Confirm it passes with no
  edit.
- **Mutation-test** each new guard and record it in the PR:
  - example 1: put REF 5 / MOB 7 back (fails); set the Fence's INT to 6 (fails, proving it reads every subtype);
  - example 3: drop one word from Hardwired (fails); add an Issued Hardware benefit (fails);
  - example 6: remove the header call (fails); restore the panel's picker (the "exactly one" check fails);
  - example 4: leave Survival in `ids` (fails).
  Check each for a second path that would keep it green. Example 6's "exactly one" check is the only one
  that sees the duplicate picker.

## 12. Steps

1. Branch from `main`. `git submodule update --init private`. `npm run test:fast` for the baseline (a
   fresh branch from a green `main`).
2. Write examples 1–7, run them on `main`'s code, and record which fail and how. Then `npm run test:fast`.
3. The data (§8). `npm run test:fast`. Examples 1–5 should pass and 6–7 still fail.
4. The UI (§9). `npm run verify`. All seven pass.
5. Mutation tests (§11), each recorded.
6. **Dev preview** (`shadows-dev-preview`). Every step is a click, and each gets a screenshot for the PR:
   - **The wizard:** a new Professional, then the Enforcer card. It reads "requires BOD 8, COOL 7", Duty
     Grade's three benefits, and the Combat Skill picker on the Specialization step.
   - **A saved Enforcer:** to get one into the preview, run this in the page's console, then reload:
     `localStorage.setItem("shadows.active.v1", JSON.stringify({ch, section:"skills"}))`, where `ch` is an
     `Engine.newCharacter()` with archetype `professional`, `archetypeChoices.specialization = ["enforcer"]`,
     a power level, stats at 5, and `creation.locked = true`. Then click **Open sheet**. Done this way on
     Y0's review, it works. The block shows on Skills. Visit two other tabs. Choose Rifles, and the block
     is gone. Undo, and it's back.
   - **At phone width** (`resize_window` mobile): the block and its picker fit, and nothing scrolls
     sideways (`document.documentElement.scrollWidth <= clientWidth`).
   - The screenshot frame can be smaller than the page. Click by `ref` from `find`, not by coordinates
     read off a scaled screenshot.
7. `npm run phone-check`. It's over budget on `main` too ("phone, phone, touch"), as Y0's review found:
   compare the table with `main`'s, and report only a row that got worse.
8. Close out (§14), then **`npm run verify` on the final commit**, and open the PR.

## 13. Stop and ask

- Any test you didn't write fails after step 3 or 4, other than those listed below as expected.
- The Mercenary's sheet test (`smoke-wizard.test.mjs` ~428) fails.
- `0412`'s Enforcer section isn't word for word what §8 quotes (the mirror moved).
- A way to show the ask that needs the engine to know which archetype is open.
- **Not a stop:** a draft fixture somewhere that builds an Enforcer at the old stats or with Survival over
  the standard cap (none was found; if one turns up, update it and list it); the version literals your bump
  moves; the panel's picker going (§9 removes it).

## 14. Close-out

The **close-the-session** skill, at the Rule or shape tier:
- **CHANGELOG**, under `[Unreleased]`, player voice, then `npm run changelog`:
  - "**The Enforcer follows the new book:** it requires BOD 8 and COOL 7, Focuses Cybernetics and one Combat
    Skill you choose in place of Survival, and carries the Duty Grade tweak (Interpreter, Hardwired,
    Hardened) in place of Hard Knock Life."
  - "**A character still owed a Focused Skill is asked for it at the top of the sheet,** whatever tab it
    opens on. An Enforcer saved before this update picks its Combat Skill there."
- `npm run bump -- 0.53.0` (or the next minor after what `[Unreleased]` names then). `gamedataVersion` 0.46.
  **`README.md`'s status line** moves with them (docs.test checks it).
- **Decision N** in SCHEMA §4 with the 134 marks and the INDEX lines (§3).
- **The plan:** Y1's row says *built, PR #…*. **W90** gets a sentence:
  "Hardened (the Enforcer's Duty Grade) is text until an Enforcer can be made to resist EMP; then it's a
  choice on that check."
- **STATE:** the versions line; §3's Professional status if it names the Enforcer; §5's *Where to start*
  (Y1 built, Y4 next).
- A `docs/log/2026.md` entry and a `docs/log/shipped.md` row, both naming the PR number.
- **PR title:** `Y1: the Enforcer to 0412, and a locked character asked for a missing Focused Skill (app 0.53.0, data 0.46)`.
- **PR body:** *Big picture*, *What changed*, *Evidence* (every claim names its command or test; the
  examples failing on `main`; each mutation), *Dev preview* (the screenshots), *Voice pass* (YQ7's
  description), *Where the order didn't fit*.

### Review checklist

For the reviewer, beyond the suite passing:
- [ ] The tweak's text against `0412` with `**` stripped: re-run the substring check yourself.
- [ ] Example 1 reads every subtype: break another subtype's stat and see it fail.
- [ ] No archetype or subtype id in the new UI code. `engine.test.mjs` ~483's guard checks archetype and
      discipline ids but **not subtype ids**, so grep the diff for `"enforcer"` yourself.
- [ ] One picker on every tab, Loadout included, in the preview, not only in jsdom.
- [ ] The ask on a phone-width preview: it fits, and nothing scrolls sideways.
- [ ] Issued Hardware appears nowhere a player can see, and the tripwire's message names YQ3.
- [ ] `migrate()` untouched, no schema bump. An old Enforcer file round-trips with `focusedSkillPicks: []`.
- [ ] Decision N's 134 marks in SCHEMA and INDEX. W90's Hardened sentence.
- [ ] Versions: app minor, data 0.46, README's line. CHANGELOG lines, `npm run changelog` run.
- [ ] The final `npm run verify` is on the PR's final commit.

## 15. Handing it over

The building session's prompt is the README's, titled **Y1 build**. Its traps, under the prompt:
- **The book's words are exact.** Copy the tweak from §8, not from memory of `0412`. The book has curly
  apostrophes elsewhere in the section; these four strings have none.
- **One picker.** Moving the picker into the header and forgetting to take it out of the panel gives two on
  Loadout. Both work, and only example 6's count check catches it.
- **Don't gate the ask on the Enforcer.** It reads `focusedPicks`, for anyone (Decision 135).
- **Don't write `focusedSkillPicks` on load.** Asking is the UI's. `migrate()` is untouched (constraint 7).
- **Preview by clicking.** Checking `SHADOWS_DATA` from the console isn't the preview step (Y0's review).
- **Verify last.** The final `npm run verify` runs on the commit the PR ends on.

The reviewer's prompt is the README's, with PR #… and this order's path.
