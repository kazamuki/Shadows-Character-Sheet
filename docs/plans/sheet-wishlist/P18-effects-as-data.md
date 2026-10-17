# Work order P18: Effects as data

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W120** (`WISHLIST.md`); Decisions 68, 135, 213, 199.

**Scope:** every Advantage's and Disadvantage's effects, written as data and shown as tags (Ken's shape, 2026-10-16):
- a **computed** effect is a `grants` row the engine already applies; its tag text is **filled from the row's own numbers** by a per-type template in the data, so it can't drift from what the sheet does;
- a **table rule** is a new `grants` row type the engine skips, carrying its own `ruleText`;
- the tags show on the CP step's entries (both modes) and on the Character tab's cards (visible while folded). P13's Expert mode then folds the prose and keeps the tags;
- **eleven descriptions move with Deighton's rulings** (2026-10-16): "aimed shots" become the Called Shot stunt (Ambidextrous, Bullseye, Quick Draw, Stunt Rider), Night Vision covers Dim and Dark, Archery Master takes crossbows, Gun Master beam weapons, Melee Master Martial Arts, Riposte is once per round, Scrapper is Melee and Martial Arts with a minimum of 1, Backfooted names Combat Maneuvers. The draft carries each new `description`; the book catches up (`crb-catch-up.md`);
- **a held entry's tags speak to that character** (Ken, 2026-10-16): its rank (Bullseye at rank 2 is +6, Gun Master's attacks are its rank), its picks ("Take 6 on Investigation"), and "Creation only" from the data's `creationOnly`.

**Not in scope:** computing anything new. The review found **19 effects in 7 areas** that the sheet shows a number for and never applies (the SAN cuts, Terminal Disease's Pain, Ghost Step's +3, Age's stat caps, Wealthy's Çredits…). They go to the sign-off page as questions. The answers become **P19** (a Skill's check: Ghost Step, Defect/Flaw, the kickers, with Take X and the die-face marks) and **P20** (the rest). P18 shows them as table rules, which is what they are today.

**Status:** **drafted 2026-10-16 by Claude (Opus).** Pre-flighted against `main` at `b4935ec` (#206 merged; `[Unreleased] — app 0.47.1`). The 87 entries' effects are in [`P18-effects-draft.json`](P18-effects-draft.json), **signed off on 2026-10-16** by Ken, Deighton and Scott ([`rulings-2026-10-16.md`](../../reference/rulings-2026-10-16.md)): every entry `"signed": true`, Deighton's edits the signed text, signed on the [sign-off page](https://claude.ai/artifact/Ah3WbcFhEGc6UNw5RNtsK8). The build uses the **signed-off** text, never the draft. §3's PQ1–PQ4 wait on Ken; the build waits on them. **Rev 2 (2026-10-16, Ken):** rank-aware and pick-aware tags and the creation-only tag joined; 24 entries' drafts changed after Ken's first pass, and the page marks them to sign again.

**Branch:** from `main`; PR to `main`. Nothing ships switched off. **Runs before P13** (Ken): Expert mode ships with the tags.

**Cadence:** the two-session loop (`gm-mode/README.md`, *The cadence*). Ken starts **P18 build** (Sonnet) once the page is signed off and §3 is answered; a fresh reviewer (Opus) after.

**Probes against `main`** (`5875bd5`, rechecked at `b4935ec`; a Professional, every stat 9):

```
grants types on Adv/Dis   skillPoints, hpPerLevel, milestone, luckCost, naturalArmor, painLevel: 7 of the 87 entries
grants() (engine ~164)    an if/else chain on g.type; an unknown type falls through, nothing written. Majors share it (199).
naturalArmor (engine ~937) its own reader, filtered on type === "naturalArmor"
CRB vs data               all 87 paired with 0430/0440 by name: 53 identical; 34 differ only in the book's italic
                          flavor lines and table layout. No rules text differs.
not applied today         SAN max 90 → 90 with Blood Lust, Berserker, Fanatic, Hallucinations, Minor Insanity 2
                          Pain Level 0 → 0 unhurt with Terminal Disease ("always at Pain Level 1")
                          Stealth check 15 → 15 with Ghost Step (+3) or Dwarf
                          BOD 9 with Age (BOD Max 5): no cap, and validate says nothing
                          starting Çredits = rolls.credits × multiplier: no Wealthy
                          painState never reads Pain Tolerance; naturalHealing never reads Rapid Healing
Essence TNs on the sheet  none shown, so a TN shift (Iron Will, Weak Willed, Machindo…) is a table rule
data-key guard            TEXT_KEY = /(Text|Note|Notes|Source)$|^(description|example|lore|meaning)$/ (engine.test ~328):
                          the rule's field is `ruleText`; a key named as text must hold a string
```

---

## 1. Goal

When P18 is merged:

1. **Every Advantage and Disadvantage says what it does, as tags.** Each of the 87 has at least one effect in `grants`: a computed row (the 7 that have one now) or a table rule (`{ "type": "rule", "ruleText": "…" }`), with the signed-off text.
2. **A held entry's tags are its own.** A rule row may carry a `heldText` for a held entry, filled from the character: `{rank}`, `{v}` (that rank's value in `byRank`) and `{choice}` (the entry's pick, by name). The wizard, choosing, shows the general `ruleText`; a held entry shows `heldText`. If any placeholder has no value (no pick made yet), the tag falls back to `ruleText`, never to a half-filled line. An entry with `creationOnly` gets a "Creation only" tag from `effectTags.creationOnly`.
2a. **A computed tag is written by its numbers.** Hard to Kill at rank 2 reads "+1 max HP on every Health Level per rank" from `perRank: 1`; Lucky reads its costs from `resources.luck.spend` shifted by `delta`. Change the number and the tag changes.
3. **Where tags show:**
   - **the CP step**, under each Advantage's and Disadvantage's name, in both modes (P13 folds the prose around them);
   - **the Character tab's cards**, inside the card's summary so they show while it's folded (PQ1).

   A computed tag looks different from a rule tag (PQ2).
4. **Eleven descriptions follow the rulings.** Each entry the draft gives a `description` takes it, word for word. The rest keep theirs.
5. **Nothing computes differently.** No character's numbers move: every existing test of a computed value passes unchanged.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It adds a data shape (a `grants` row type and the tag templates) and a player-facing behaviour. **One numbered decision**, the next free number on `origin/main` when it's built (**N** below; 231 at the pre-flight).
- **No flag.** P18 answers no rules question. The page's seven area questions are P19's and P20's.
- **Game data:** **no bump** (Decision 68). Rule rows and templates change no computed value and no available choice; §1.4 is tested.
- **App:** **minor**, `npm run bump -- 0.48.0` (players see a new thing). `[Unreleased]` reads `app 0.47.1` today (#206, unreleased), so the bump renames that heading and P18's lines join it. P13 later joins 0.48.0.
- **Character schema:** no bump. Nothing is saved.

## 3. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Where tags show beyond the wizard.** | **The Character tab's cards too**, in the summary, so a folded card says what it does. *Alternative:* the wizard only. | |
| PQ2 | **Computed and rule tags, told apart.** | A computed tag is a chip (the sheet applies it); a rule is a plain line under it (the table applies it). The difference is in the shape, not a label. *Alternative:* both as lines, with a small "applied" mark on computed ones. | |
| PQ3 | **Long rule text.** | Signed-off rules run up to about 200 characters (True Faith). Lines wrap; no truncation, because a cut-off rule is a wrong rule. *Alternative:* truncate with **?** to expand. | |
| PQ4 | **Print.** | **Out of scope** (a W-next): the front page is full (Decision 96). | |

## 3a. The decision, drafted

```
N. **An Advantage's or Disadvantage's effects are its `grants`: computed rows the engine applies, and rule rows the table applies; each shows as a tag.**
     *2026-10-1x · Ken + Claude · Touches: grants, rule, ruleText, heldText, byRank, creationOnly, effectTags, effectTagsFor, tag templates, Advantages, Disadvantages, CP step, Character tab, Expert mode, W120*
     - **Decided:** Every Advantage and Disadvantage has at least one effect in `grants`. A row of a type the engine computes keeps its numbers, and its tag text comes from `effectTags[type]`, a template filled from those numbers, so the words follow the rule. A `{ type: "rule", ruleText }` row is applied at the table; every `grants` reader skips it. A held entry's rule tags are its own: `heldText`, filled with its rank, `byRank`'s value for that rank and its picks, else `ruleText`; `creationOnly` adds a tag. Tags show on the CP step and the Character tab's cards.
     - **Why:** Ken's shape for W120: one place per effect, the computed ones unable to drift from what the sheet applies, and Expert mode (P13) able to show what an entry does without its prose. Reviewing all 87 also found 19 numbers the sheet shows and never applies (P19, P20).
     - **Rejected:** a free-text `mechanicsText` per entry (a second copy of every rule, free to drift from the computed numbers); a hand-written tag on computed rows (the same drift); splitting `description` at its first paragraph (the first paragraph is flavor in some entries and rules in others); computing the 19 here (rules questions, P19).
     - **Replaces:** nothing. Extends Decision 199 (Majors' `grants` share the reader, which skips `rule`) and 213 (Pain Sensitive's row gains a tag).
     - **Revisit if:** a table rule becomes computable (P19 or P20 moves it to a computed type); the CRB rewrites an entry (its rule rows are rewritten with it).
     - **Built:** app 0.48.0, no data or schema bump, PR #…. Log 2026-10-1x (P18).
```

## 4. What this changes underneath (the sweep)

Answered by grepping every reader of `grants`, **one level further**: a reader that walks the array without checking `type` would count a rule row. Check each row before you build.

| Today | Where | After P18 |
|---|---|---|
| `grants(ch)` walks Adv, Dis and taken Majors' `grants`; an unknown `type` falls through | `engine.js` ~164 | Unchanged: `rule` falls through. **A test pins it** (§6, P18 4). |
| `naturalArmor(ch, activeIds)` filters `g.type==="naturalArmor"` | `engine.js` ~937 | Unchanged. |
| Archetype powers' and forms' `grants` (`movement`, `rou`, `sfrMax`, `feed`, `withering`, `form`) | archetype readers in `engine.js` | Not touched: P18 adds `rule` rows to Advantages and Disadvantages only. **Grep every `.grants` reader** and list each in the PR, with how it skips a `rule` row. |
| The data-key guard: a key is read by code or named as text | `engine.test.mjs` ~328–378 | `ruleText` is text. `effectTags` (an object of type → template string) is read by `effectTagsFor`. |
| CP step's entries: name, cost, chips, constraint lines, stepper, `.desc`, picks | `renderCP`, `wizard.js` ~545–580 | Tags after the head, before `.desc`. |
| Character tab's `traitCard(name, costHtml, desc, selHtml)`: a `<details>` whose summary is the name and cost | `sheet.js` ~599 | The summary also holds the tags (PQ1), so they show folded. Expand all is unchanged. |
| `voice.test.mjs` reads the data's player copy | `tests/voice.test.mjs` | `ruleText` and the templates' output are player copy: they pass it. |
| `hostile.test.mjs`: data is trusted, but rendered text is still escaped | | The tag renderer escapes `ruleText` like any data text. |

## 5. The shapes

**Data** (each `grants` row, and one new top-level key):

```
"grants": [ { "type": "rule", "ruleText": "First blood in an encounter: a Sanity Check. …" } ]
"grants": [ { "type": "hpPerLevel", "perRank": 1 } ]                      // unchanged; its tag comes from the template
"grants": [ { "type": "rule",                                             // rank- and pick-aware (rev 2)
              "ruleText": "Aimed ranged shots that hit: +4 damage, and +2 more per rank after the first.",
              "heldText": "Aimed ranged shots that hit: +{v} damage.",
              "byRank": [4, 6, 8] } ]                                       // one value per rank, length = maxRank
"grants": [ { "type": "rule", "ruleText": "Take 6 on your chosen Skill…", "heldText": "Take 6 on {choice}." } ]

"effectTags": {                                    // Decision N: one template per computed type, filled from the row
  "skillPoints":  "+{perRank} Skill Points per rank",
  "hpPerLevel":   "+{perRank} max HP on every Health Level per rank",
  "naturalArmor": "+{perRank} Natural Armor per rank; Armor Piercing doesn't touch it, unless it's a spell",   // Decision 219: a spell's AP does
  "luckCost":     "LUCK: {action} costs {cost}",              // {action}, {cost}: the spend in resources.luck.spend, cost + delta, never below 0
  "milestone":    "A {kind} Milestone at rank {atRank}",      // {kind}: "Minor" or "Major"
  "painLevel":    "Pain Level +{amount} once you're hurt",    // only the onlyIfHurt kind is computed (213)
  "creationOnly": "Creation only"                            // not a grants type: read off the entry's own creationOnly
}
```

Placeholders are a row's own fields, plus `{action}`/`{cost}` for `luckCost` and the capitalised `{kind}` for `milestone`. A placeholder with no value is a test failure, never an empty string. Long-Lived's three rows are three tags.

**`heldText`'s placeholders** (rule rows only): `{rank}` is the held rank; `{v}` is `byRank[rank − 1]`; `{choice}` is the entry's first pick's answers by name (a Skill's name, or the text typed), joined with ", "; `{choice:<pickId>}` names the pick. A missing value means the whole tag is `ruleText`. `byRank` holds strings or numbers, one per rank. `heldText` is text (the data-key guard's `…Text`), `byRank` is read by `effectTagsFor`.

**Engine:** `effectTagsFor(kind, id, held)` → `[{ computed: true|false, text }]` in `grants` order, then "Creation only" last. `held` is the character's row for the entry (`{ rank, selections }`) or `null`: with it, rule rows use `heldText`; without, `ruleText`. Callers pass the held row on the Character tab and on a held CP entry, `null` for an entry not taken. A `rule` row gives `ruleText`; a computed type with a template gives the filled template; a type with neither is skipped. **Total:** an unknown id, a def with no `grants`, a non-array `grants`, a row that isn't an object, or a `ruleText` that isn't a string all give `[]` or skip the row. It never throws.

## 6. Tests (write first; run on `main`)

| Name | File | Setup → result |
|---|---|---|
| `P18 1: every Advantage and Disadvantage has an effect` | rules | All 87 have ≥ 1 `grants` row; every `rule` row has a non-empty `ruleText`. **On `main`: 80 fail.** |
| `P18 2: a computed tag is written by its numbers` | rules | Hard to Kill → "+1 max HP…"; Educated → "+10 Skill Points per rank"; Lucky → "LUCK: Boost the roll costs 1", "…Explode the roll costs 2"; Unlucky → 3 and 4; Long-Lived → three tags. **Mutate a row's number in a copy of the data and the tag follows.** |
| `P18 3: a rule line's numbers are in its entry's own text` | rules | Every number written in a `ruleText` or a `heldText` appears in the entry's `description` (a drift guard: a summary can't invent a number). A `byRank` value that is arithmetic on the text is pinned instead, each with its sentence: Bullseye [4, 6, 8] ("+4 … each Rank after the first gains an additional +2"), Wealthy's monthly Ç [2,000 … 8,000] ("2,000 Ç/per month for each rank"), Minor Insanity's SAN [5 … 25] ("Each Rank reduces your Sanity by 5%"). |
| `P18 3b: a held entry's tags are its rank and picks` | rules | Bullseye held at 2 → "+6 damage"; Gun Master at 3 → "Extra attacks a round with firearms: 3."; Common Sense with Investigation chosen → "Take 6 on Investigation.", and with no pick yet → its `ruleText`; Danger Sense at 4 → "Name the main visible threat."; every `byRank` is `maxRank` long; Long-Lived shows "Creation only". Unheld (`held` null) → every rule's `ruleText`. |
| `P18 4: rule rows change nothing the engine computes` | engine | For every character fixture the engine tests use, `grants()`, `naturalArmor()`, `luckState()`, `painState()`, `sanState()`, `health()` and `skillLine()` are deep-equal with every `rule` row stripped from the data and with them in. |
| `P18 5: effectTagsFor is total` | engine | §5's degenerate inputs give `[]` and never throw. |
| `P18 6: the CP step and the Character tab show the tags` | smoke-wizard, smoke-sheet-archetypes | Blood Lust's rule line shows on its CP entry; Hard to Kill's computed chip shows; on the Character tab, a held Blood Lust's folded card shows its tags. |
| `P18 7: the templates and rule text are player copy` | voice | No flag id, no "TBD", passes the voice checks. |

**Also:** the data-key guard (`ruleText`, `effectTags` read); the hostile guard (a `ruleText` with markup renders as text, in a fixture); `npm run phone-check` with a Character tab card holding three tags at 320px.

## 7. Mutants, each of which must fail a test

1. A `grants` reader that counts a `rule` row (drop the type check in `grants()`'s `skillPoints` branch) (P18 4).
2. A computed tag written by hand instead of from the template (P18 2's mutated number).
3. A rule line with a number its description doesn't have (P18 3).
4. An entry left with no effect (P18 1).
5. `effectTagsFor` throwing on a `grants` that isn't an array (P18 5).
6. A held tag reading `byRank[rank]` instead of `[rank − 1]` (P18 3b, Bullseye at 2).
7. A placeholder with no value rendered as an empty string or "undefined" instead of falling back to `ruleText` (P18 3b, Common Sense with no pick).
8. "Creation only" written into Long-Lived's text instead of read from `creationOnly` (P18 3b: set `creationOnly` false in a copy of the data and the tag goes).

## 8. Out of scope

- **Computing any of the 19 candidates** (P19 and P20, from the sign-off page's answers).
- **Archetype powers' and Majors' tags.** Same mechanism, later: their `grants` already exist.
- **Print** (PQ4), and **Expert mode** itself (P13).
- **Rewording any other `description`** than the eleven the rulings move (§1.4), and **Deighton's proposals** (W130): they go to a design talk first.

## 9. Steps

1. `git submodule update --init private`; `npm run test:fast`.
2. **Read the signed-off text** (recorded by Ken's session into `P18-effects-draft.json` as `"signed": true` per entry, after any disagreement on the page is settled). Stop if any entry is unsigned.
3. §6's tests, run on `main`.
4. Data: `effectTags`; each entry's `rule` rows from the signed text, in `grants` after any computed rows; and the eleven `description`s the draft carries.
5. Engine: `effectTagsFor`. UI: the CP step and the Character tab.
6. Docs: Decision N with its INDEX line; SCHEMA §2's Advantage and Disadvantage shape; W120 to `wishes-granted.md`; the plan's P18 row; CHANGELOG; the bump.
7. `npm run verify`, `npm run phone-check`, and the dev preview: a Professional with Blood Lust, Hard to Kill 2 and Lucky, on the CP step and the Character tab, at 375px and desktop.

## 10. Stop and ask

- **An entry not signed off**, or signed text with a number its description doesn't have (P18 3 would fail on it).
- **A `grants` reader that walks rows without checking `type`** and isn't in §4: say which, and stop.
- **Any computed value that moves** (P18 4, or an existing test). Expected breaks: **none.**
- A change outside `shadows-data.js`, `engine.js` (`effectTagsFor` and its export), `wizard.js` (`renderCP`), `sheet.js` (`traitCard`), `shadows.css` and the tests.

## 11. Close-out and review checklist

**CHANGELOG** (player voice):
- **Called Shots get the Advantages' bonuses.** Ambidextrous, Bullseye, Quick Draw and Stunt Rider now work with the Called Shot stunt (the old "aimed shots"). Bullseye adds its damage to a Called Shot, and Quick Draw lets you make one as an Action.
- **Rules updates:** Night Vision ignores Dim and Dark for Awareness and attacks. Archery Master counts crossbows, Gun Master beam weapons, and Melee Master Martial Arts. Riposte works once per round off any parry. Scrapper halves Melee and Martial Arts damage, never below 1. Backfooted answers any Combat Maneuver.
- **Every Advantage and Disadvantage says what it does at a glance.** On the Character Points step and on your Character tab, each one shows its effects as short tags: what the sheet applies for you, and what your table applies.

**Review checklist:**
- [ ] Every `ruleText` and `heldText` matches the signed-off text exactly, and the eleven descriptions match the draft's.
- [ ] §4's `.grants` readers are each listed in the PR, with how each skips `rule`.
- [ ] P18 4 holds with the rule rows stripped and present: no computed value moved.
- [ ] Mutants 1–8 listed in the PR and the log.
- [ ] Decision N passes `docs.test.mjs`.
- [ ] Dev preview measured at 375px: no sideways overflow on the CP step or a Character tab card.

## 12. Handing it over

The README's two prompts, `<plan>/<order>` = `sheet-wishlist/P18-effects-as-data.md`, `<id>` = **P18**, and these traps:

> 1. **Computed tags are generated, never typed.** If you're writing "+1 max HP" into the data, stop: it comes from `effectTags` and the row's `perRank`.
> 2. **Every `grants` reader must skip `rule`.** `grants()` does today by falling through; grep the rest (`naturalArmor`, the archetype readers) and prove each with P18 4.
> 3. **Paste the signed-off text, not the draft.** The draft is Claude's; the signed copy is Ken's and Deighton's.
> 4. **Change no computed value.** The 19 candidates stay table rules until P19 and P20.
> 5. **`byRank` is indexed from 1 in the game and 0 in the array.** Rank 2 reads `byRank[1]`. And a placeholder with nothing to fill falls back to the whole `ruleText`.
>
> Tier: Rule or shape. One decision (the next free number). No data or schema bump; app minor per §2.

---

## The sign-off page

A claude.ai page lists all 87 entries with their drafted effects, beside the full text, so each can be approved, edited or questioned in one sitting. It also asks the seven area questions for P19 and P20. **Each person answers on their own:** one record per person (`answers/<their id>`), which only they can write and everyone with the page can read (the page's access rules). Everyone's answers show by name under each entry and question, and a **Disagreements** filter lists where they differ: a different verdict, or different edited words.

**Reading back.** Ken's session reads every person's record. An entry is signed when everyone who answered it signed the same words. A disagreement goes back to Ken to settle, never resolved by taking the latest answer. Then the session records the signed text into `P18-effects-draft.json` (`"signed": true`, edits applied) and the seven answers, with who gave each, into a `reference/rulings-<date>.md`. To save answers, a person needs Contributor or above; someone outside the organization needs Editor by email invitation, and only while the page isn't also shared by public link.

**Link:** [Effects Sign-off](https://claude.ai/artifact/Ah3WbcFhEGc6UNw5RNtsK8) (private; Ken shares it with Deighton as Editor, so his answers save).
