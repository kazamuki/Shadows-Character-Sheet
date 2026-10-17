# Work order P13: Expert mode

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W95** (`WISHLIST.md`); Decisions 158, 164, 218; P4's W59 (built, 0.41.0).

**Scope:**
- **W95:** an **Expert mode** toggle on the wizard's Archetype, Skills and Character Points steps that folds each entry down to its name, cost, controls and effects, with its text a tap away;
- **Held only** on the CP step, and the CP step's **sticky bar** on Skills (Remaining in view, and a filter): Ken, 2026-10-16;
- **the CP Boosts heading names Max Boost** (what's left of Brogan's second ask, compact steppers, which the pre-flight measured and Ken dropped: PQ3);
- **the CP filter, which can't find anything by name** (found in the pre-flight, below);
- **P18's tags where they're still missing** (Ken, 2026-10-17, from P18's review): the archetype step's Natural Advantages panel, the IP buy list for Advantages, the IP buy-off list for Disadvantages, and Talented's pick. Each still shows prose or a bare name;
- **a held card's computed tags speak for its rank** (Ken, 2026-10-17): Hard to Kill ×2 reads "+2 max HP on every Health Level", not "+1 … per rank", and a Long-Lived held at rank 1 lists only the Milestone it has. This moves Decision 231's templates, so **P13 is now *Rule or shape*** (§2).

**Status:** **drafted 2026-10-16 by Claude (Opus)**, P12b's reviewer. Pre-flighted against `main` at `5875bd5` (#204: v0.47.0's release prep, merged; **v0.47.0 released** the same day: tag, Release and the live site's footer). **Ken answered on 2026-10-16 (§3):** PQ2, PQ5 (with a follow-on, W120), PQ6 and PQ7 on their defaults; **PQ1: Max Boost stated once on the page; PQ4: the wizard's header; PQ3: no compact steppers** (at 320px, compact saves 42px of width and no height, and it takes each count away from its buttons). **Then Ken widened it (2026-10-16):** the Archetype step folds too, Held only and the Skills bar join, and **P13 runs after W120's order (P18)**, so a folded Advantage or Disadvantage shows its effects as tags from the first release. **Widened again (2026-10-17, Ken, after P18's review, PR #207, merged):** the tags reach the four places P18's sweep missed, and a held card's computed tags state its total (§1.7, §1.8; PQ8–PQ10 below, not yet answered). P18's order swept the readers of `grants`, not every place a player chooses an Advantage. That is the miss carried over here (§4 lists every such place).

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P13 build** (Sonnet), then a fresh reviewer (Opus) once the PR is open. A *Fix* order gets a page (*How exact to be*): this is one.

**Carried over from P12b's review:**
- **The order's miss:** §8.6 said to drop a training "whose skill is unknown, or whose rank would pass `maxRank`", and didn't ask what else ends the precondition (Admin removing the skill). The training brought the skill back at rank 1.
  **Applied here:** §4 lists every reader of what P13 moves, and every way each one stops holding. For example, the filter's only caller is the CP step, and its selector broke without a word when a heading changed.
- **The reviewer's find:** a stored list longer than its cap made an add invisible, and only a hostile fixture showed it.
  **Applied here:** the filter has been broken for two weeks behind a test whose query ("berserk") matched a description by accident. Every filter test here uses a query that **only the name** contains.

**Probes against `main`** (`5875bd5`; a new Professional on the CP step, dev preview, measured with `javascript_tool`):

```
CP step height           1024px wide: 19,820 → 8,018 with every .pick .desc hidden (−60%)
                         375px wide:  30,811 → 12,546 (−59%); 88 descriptions
Skills step height       375px wide:  5,816 → 3,284 with each row's description hidden (−44%); 36 rows
CP filter "Ambidextrous" "0 of 87", nothing shown. "Animal Ken", "Hard to Kill": 0 of 87.
CP filter "Bullseye"     "1 of 87": Stunt Rider (its text says bullseye), not Bullseye
names absent from text   62 of the 87 Advantages and Disadvantages: the filter can't find them at all
why                      applyPickFilter (shared.js ~745) reads the pick's h4; the picks' names are h2
                         since 097c582 (2026-10-01, W60's heading fix). The test (smoke-sheet-skills ~244)
                         filters "berserk", which is in Berserker's own text, so it passed throughout.
stepper .val readers     one: announceStep (shared.js ~101), which reads `.stepper .val` from the DOM
```

---

## 1. Goal

When P13 is merged:

1. **Expert mode.** The wizard's header has an **Expert mode** toggle (pressed or not) beside Home, on the Archetype, Skills and Character Points steps, the three it changes (PQ4). It's one setting for all three, remembered in this browser like the Character tab's Expand all (Decision 158), and **never** saved in the character. Off by default.
2. **Folded, not hidden.** In Expert mode:
   - **Skills:** each skill's description folds away. Its name, stat line, focused chip, rank stepper, check bonus and (Martial Arts) style picks stay.
   - **Character Points:** the book text folds away for Disadvantages, Advantages, LUCK, Disciplines and Starting spells (PQ5). Each entry keeps its name, cost, chips (natural, Universal; "Creation only" is now a tag, P18), lock and requires lines, flag note, stepper and held picks. **An Advantage or Disadvantage shows its effects as tags** (W120's, from P18): each `grants` row's text, computed or table rule, in data order.
   - **Archetype:** the archetype's summary and lore, and each specialization option's and Baseline Trait's `description`, fold away. What stays is what a choice gives, which the step already writes as labelled lines: Focused Skills, Tweak, Benefit and each feature (`optionFeatures`), plus every choice control and its count ("1/2 chosen"). Rule notes stay (`step-note`s that say what to do, such as `applyFromText`).
   - Each folded entry has a **?** beside its name that opens its own text (as the sheet's Skills tab does). An entry opened stays open across the re-render a stepper causes, and closes when Expert mode is turned off.
3. **Max Boost, named once.** The CP Boosts heading reads "Max Boost +N" (Decision 218's name), so a greyed + explains itself; the row's ⛔ reason (`canBoost`'s `why`) stays. **Every stepper is unchanged** (PQ3): the count stays between − and +.
4. **The filter finds names.** "Ambidextrous" shows Ambidextrous, in either mode, and a word only in an entry's text still finds it while the text is folded.
5. **Held only** (CP step). A toggle in its sticky bar shows only the Advantages and Disadvantages the character holds, so a build can be read back without scrolling 87 entries. It's view state like the filter (`S`, not stored), works with the filter, and the count reads "3 held". Shown in both modes.
6. **The Skills step's bar.** The CP step's sticky jump bar (W22) comes to Skills: Remaining Skill Points always in view, a filter over skill names and text, and the Combat, Utility and General jumps. Shown in both modes.
7. **Tags wherever an Advantage or Disadvantage is chosen** (PQ10). P18's tags (`effectsHtml`) also show in:
   - the **Natural Advantages panel** on the Archetype step: held at the natural rank once allocated, and general before that. In Expert mode its `.desc` folds and the tags stay, as on the CP step;
   - the **IP buy list for Advantages** on the sheet: "Your Advantages" rows held, "Take a new one" rows general;
   - the **IP buy-off list for Disadvantages**, held. Its "What it says" fold stays;
   - **Talented's pick** (the Minor's `advantageRank` modal): "Raise one you hold" held, "Take a new one" general.

   These are separate from Expert mode: they show in both modes, and on the sheet, which Expert mode doesn't reach (PQ2).
8. **A held card's computed tags state its total** (PQ8, PQ9; Decision **N**, §3a). With a held row, a computed tag reads the character's number, not the per-rank rule:
   - Hard to Kill ×2 is "+2 max HP on every Health Level";
   - Educated ×3 is "+30 Skill Points";
   - Thick Skin ×2 is "+2 Natural Armor; …";
   - a Long-Lived held at rank 1 shows only its rank-1 Milestone tag, since the rank-2 and rank-3 rows aren't its own yet.

   An entry not held (the CP step's unpicked entries, IP's "Take a new one") reads exactly as today. LUCK costs and Pain Sensitive don't vary with rank and read as today. **No computed value moves:** only the words on a held card change.

## 2. Tier, versions, numbers

- **Tier: Rule or shape** (raised from Fix on 2026-10-17). Expert mode itself is still view state on Decision 158's pattern, with nothing stored, and its choices are §3's, answered by Ken. **§1.8 is what raises the tier.** It changes how Decision 231's computed tags read, adds a data key (`effectTagsHeld`, §3a) and changes `effectTagsFor`. So this order carries **one numbered decision**, the next free number on `origin/main` when it's built (**N** below), superseding 231 in part, with its INDEX line. Propose-before-build is PQ8–PQ10: Ken answers them before the build starts.
- **App:** **minor** (Expert mode is a new thing a player can do). **P18 already bumped to 0.48.0** (`[Unreleased] — app 0.48.0`, PR #207). If that heading is still unreleased when P13 lands, P13's lines join it and there is no bump. If 0.48.0 has been released, use `npm run bump -- 0.49.0`. Say in the PR which case applied.
- **Game data:** no bump (Decision 68). `effectTagsHeld` changes words, not a computed value or an available choice: P18 4 still holds, and §6's P13 11 checks it. **Character schema:** no bump (§1.1: nothing is saved).
- **CHANGELOG:** §9's lines.

## 3. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Where the boost count goes** when it leaves the stepper. | Into the row's label: "BOD value 7 · 2 boosts", "Handguns rank 5 · 1 boost", nothing at 0. The count stays in the stepper for screen readers only, so `announceStep` is unchanged. *Alternative:* drop it, since "value 7" already includes it. But Max Boost caps boosts per stat (218), so the player needs the count to see how close they are. | **Ken, 2026-10-16: "+N" beside the name, not "N boosts"; Max Boost stated somewhere on the page ("Max +2"), so a "+2" with a greyed + says why.** **Then PQ3 dropped compact steppers, so the count stays between the buttons and "+N" beside the name would repeat it. What's kept: the heading reads "Max Boost +N"** (§1.3). |
| PQ2 | **Does Expert mode reach the Character tab?** | **No: creation only.** The Character tab's Advantages and Disadvantages are already folded cards with Expand all (158), and the sheet's Skills tab already folds its text behind **?**. *Alternative:* one setting across both, which makes Expand all and Expert mode two controls for one thing. | **Ken, 2026-10-16: the default.** |
| PQ3 | **Compact boosts only in Expert mode, or always?** | **Only in Expert mode.** A first-time player keeps the count between the buttons, as every other stepper has it. *Alternative:* always compact. | **Ken, 2026-10-16, after a side-by-side and a measurement: neither. No compact steppers.** At 320px, removing the count makes a stepper 42px narrower (132 → 90) and the boosts section no shorter (424px either way, on a 33,713px step). It also moves the count away from its buttons, shows nothing at 0, and makes the boosts the only steppers of 16 without their value between the buttons. Expert mode's folding is where the room is. |
| PQ4 | **Where the toggle sits.** | On each of the two steps: at the top of Skills, and in the CP step's sticky jump bar beside Remaining CP, so it's in reach from anywhere on the longest page. *Alternative:* the wizard's header, beside Home (P4). | **Ken, 2026-10-16: the wizard's header.** Shown on the steps it changes (Skills and CP, and Archetype since Ken widened it), so it never appears where it changes nothing. That puts `app.js`'s wizard header in scope (§4), and phone-check must hold the header's height at its narrowest width with two buttons. |
| PQ5 | **Which CP text folds.** | Book text: Disadvantages, Advantages, LUCK's line, Disciplines, Starting spells. **Never** a flag note, a lock or requires line, a pick's choices, or a custom power's own written text. *Alternative:* Advantages and Disadvantages only, W95's words. | **Ken, 2026-10-16: the default; and where text carries mechanical weight, Expert mode might show just what taking it provides, without the prose.** That needs a field the data doesn't have: each entry has one `description`, and 69 of the 87 run to several paragraphs that mix the two (Blood Lust opens "Everyone bleeds. Not everyone stops to watch." before its Sanity Check). Writing 87 short mechanics lines is rules text to cross-check against the CRB, a data shape and its own order: **W120**. P13 folds the whole text. |
| PQ6 | **The filter fix: here, or a patch first?** | **Here.** Finding the one you want is W95's whole point. *Alternative:* a 0.47.1 patch now (one selector and its test), with P13 after. | **Ken, 2026-10-16: the default.** |
| PQ7 | **The toggle's words.** | "Expert mode", with `aria-pressed`, and a hint on first sight: "Folds each entry to its name and cost. Tap ? to read one." Marked for a voice pass. | **Ken, 2026-10-16: the default.** |
| PQ8 | **How a held card's computed tag reads.** | **Its total, without "per rank"**, from a held template beside each general one (`effectTagsHeld`, §3a). `{total}` = `perRank` × the held rank, natural and bought rows summed as `heldRow` and the engine already sum them. Hard to Kill ×2 reads "+2 max HP on every Health Level". A type with no held template (LUCK costs, Pain Sensitive) reads its general line. *Alternative:* keep the per-rank line and add the total in brackets ("+1 max HP … per rank (+2)"). It's longer and says the same thing twice. | |
| PQ9 | **A held entry's rows its rank doesn't reach yet** (Long-Lived's rank-2 and rank-3 Milestones on a rank-1 card). | **Left off the held card.** It's the character's card, and those aren't the character's yet. The CP step's unheld entry and IP's "Take a new one" still list all three, so a player choosing it sees what the ranks give. The rows a card does show keep "at rank N". *Alternative:* show them, marked "not yet". | |
| PQ10 | **Which tags show in the IP lists and Talented's pick.** | **The same tags as everywhere else:** held for an entry the character holds, general for a new one. *Alternative:* on a "Raise" row, the tags for the rank it would reach ("+8 damage" on Bullseye 2 → 3). That's more useful when buying, but it's a third reading of the same row, and the `from → to` column already shows the step. A W if wanted. | |

*PQ8–PQ10 were added 2026-10-17 and aren't answered yet. A default Ken leaves blank is his answer.*

## 3a. The decision, drafted

```
N. **A held Advantage's or Disadvantage's computed tags state its total for its rank, and leave out the rows its rank doesn't reach.**
     *2026-10-1x · Ken + Claude · Touches: effectTags, effectTagsHeld, effectTagsFor, heldRow, effectsHtml, Hard to Kill, Educated, Thick Skin, Long-Lived, CP step, Character tab, Natural Advantages, IP buy list, IP buy-off, Talented*
     - **Decided:** With a held row, `effectTagsFor` writes a computed row from `effectTagsHeld[type]` when there is one, filled with the row's fields plus `{total}` (`perRank` × the held rank), else from `effectTags[type]` as before. A `milestone` row whose `atRank` is past the held rank gives no tag on a held card. An entry not held reads as Decision 231 has it. The tags also show in the Natural Advantages panel, the IP buy and buy-off lists and Talented's pick.
     - **Why:** Ken, after P18: every other held tag speaks for its character (231's `heldText`), so a computed chip saying "per rank" on a ×2 card was the one that didn't. And a player chooses Advantages in four places P18 never reached.
     - **Rejected:** the per-rank line with the total in brackets (says it twice); showing Long-Lived's unreached Milestones marked "not yet" (it's the character's card); tags for the next rank on an IP Raise row (a third reading; the from → to column shows the step).
     - **Replaces:** Decision 231 in part (a held computed tag no longer reads its general template; the tags reach four more places).
     - **Revisit if:** a computed type's total isn't `perRank` × rank (a capped or stepped grant), or a player misreads a held total as per-rank.
     - **Built:** app 0.48.0 or 0.49.0 (§2), no data or schema bump, PR #…. Log 2026-10-1x (P13).
```

The data key, on the default (PQ8):

```
"effectTagsHeld": {                      // Decision N: a held card's computed tag, filled with the row's fields and {total}
  "skillPoints":  "+{total} Skill Points",
  "hpPerLevel":   "+{total} max HP on every Health Level",
  "naturalArmor": "+{total} Natural Armor; Armor Piercing doesn't touch it, unless it's a spell"
}
```

`{total}` is a number only `effectTagsFor` computes. A missing or non-finite one (a row with no `perRank`) means the general template, never "+NaN". `effectTagsHeld` is read by `effectTagsFor`, so the data-key guard accepts it.

## 4. What this changes underneath (the sweep)

Answered by grepping readers. **Check each row before you build**, and say in the PR if one is wrong.

| Today | Where | After P13 |
|---|---|---|
| `stepper(val, dataAttr, downOk, upOk, name)` renders − `.val` +; 16 calls, all in `wizard.js` (Admin's Base Powers block on the sheet uses `basePowersHtml` from it) | `wizard.js` ~116 | **Unchanged** (PQ3). |
| `announceStep` reads `.stepper .val` and announces "<data-name> <val>". **It is the only reader of `.val`** in `src/` and `tools/` | `shared.js` ~101 | Unchanged, and no stepper moves its `.val`, so nothing here touches it. |
| `applyPickFilter` matches `h4` + `.desc` text; **its only caller is the CP step** | `shared.js` ~741; `wizard.js` ~985 | Matches the pick's name (`.head h2`) and its text. `textContent` reads folded text, so a folded entry is still found by its text. |
| The filter's test queries "berserk", which Berserker's own text contains | `smoke-sheet-skills.test.mjs` ~244 | Keep it, and add P13 5 with name-only queries. |
| Skills step: a row's description is the `<small>` in `.name`; a `.next-cost` `<small>` exists elsewhere and isn't a description | `renderSkills`, `wizard.js` ~499; CSS ~214 | Only the description folds. |
| CP picks: `.desc` under `.head`; flag notes come from `flagHtml`, constraints from `constraintHtml`, held picks from `picksHtml` | `renderCP`, `wizard.js` ~532 | Only `.desc` folds (PQ5). Custom powers' `.desc` (the player's own text) doesn't. |
| View state remembered per browser: `shadows.ui.traitsOpen`, `shadows.ui.vitalsPinned`, read in try/catch | `sheet.js` ~503, `app.js` ~83 | `shadows.ui.expert`, `"on"` or absent, the same way. Storage that throws means off, with no error. |
| A press that re-renders keeps the keyboard's place (164: `keepPlace`); `S.cpFilter` carries the filter across a stepper's re-render | `shared.js` ~261; `wizard.js` ~981 | The opened-entry set lives in `S` beside `S.cpFilter`, never in `S.ch`. Toggling Expert mode keeps focus on the toggle's twin. |
| `.skill-q` (the sheet's **?**) has a 44px touch area | CSS ~878, ~1124 | The wizard's **?** reuses it. |
| The wizard's header holds Home alone: `act.innerHTML` gets one `.hdr-btn` on every wizard step | `app.js` ~57 (`renderTopChrome`'s wizard branch) | Expert mode joins it on the Archetype, Skills and CP steps, pressed per `shadows.ui.expert`. The header redraws on a step change, so the button comes and goes with the step. |
| The CP Boosts heading reads "…up to N each, LUCK included" | `renderCP`, `wizard.js` ~671 | Reads "Max Boost +N" (PQ1), LUCK included. |
| The Archetype step: `a.summary`, `sel.lore` (`.flavor`), option `.desc`s, Baseline Traits' `.desc`; the labelled lines (Focused Skills, Tweak, Benefit, `optionFeatures`) are `.desc`s too, each starting with a `<b>` label | `renderArchetype`, `wizard.js` ~255–400 | Fold the summary, the lore and the plain `description` `.desc`s; **a `.desc` with a `<b>` label stays**. Mark which is which in the markup rather than inferring it from a `<b>` at render time. |
| `applyPickFilter` walks `[data-filterable] .pick`; the Skills step's rows are `.alloc-row`s inside `.alloc`, with no `data-filterable` | `shared.js` ~741; `renderSkills` | The Skills filter needs its rows marked and the walker to take them, or a small walker of its own. Held only rides on the same pass (`.selected` is already the held mark on a CP pick). |
| `jumpBarHtml(list, { sticky, filter, extra })` is called once, by the CP step | `wizard.js` ~694; `shared.js` ~690 | The Skills step calls it too, with its own filter state (`S.skillFilter`, beside `S.cpFilter`). |
| `phone-check` measures the wizard's Stats step only (P4), including the header's height with Home held to finger size | `tools/phone-check.mjs` ~155 | Also Archetype, Skills and CP, each in Expert mode, at its widths, with the header's height measured with both buttons and the Skills bar's height. **And a Character tab card with three tags at 320px**, which P18 asked for and couldn't add: the fixture holds no Advantage. |

**P18's tags, everywhere an Advantage or Disadvantage is chosen** (§1.7, §1.8). P18 swept the readers of `grants`, and these rows are the readers of an Advantage's *display* it didn't reach (grep `advById\|disById\|D.advantages\|D.disadvantages` over `src/ui`, and check each hit before you build):

| Today | Where | After P13 |
|---|---|---|
| `heldRow(ch, kind, id)` and `effectsHtml(ch, kind, id)`: rank summed over natural and bought rows, picks from `Engine.picksFor` (P18's review fix, 071deb7); called by `renderCP` and the Character tab's `traitCard` | `wizard.js` ~532 | **Moved to `shared.js`**, since the sheet now calls them from three more places. Unchanged otherwise. |
| The Natural Advantages panel: name, "max rank N", stepper, `.desc`, held picks. No tags | `renderArchetype`, `wizard.js` ~373–388 (the `natadv` stepper) | `effectsHtml(ch,"advantage",id)` after the head, before `.desc`, as on the CP step. In Expert mode its `.desc` folds with the rest of the Archetype step's prose (§1.2). |
| IP buy list for Advantages (`ipAdvantagesHtml`): `ipBuyRowHtml` rows with name, "N points a rank · rank R", from → to, cost, picks. **No tags and no prose** | `sheet.js` ~3022 | Tags in the row's name cell: held for "Your Advantages", general for "Take a new one". Its search (`name` + `description`) is unchanged. |
| IP buy-off list for Disadvantages (`ipDisadvantagesHtml`): a row with a "What it says" fold of the `description` | `sheet.js` ~3042 | Tags in the name cell, held. "What it says" stays. |
| Talented's pick: `minorChoiceBodyHtml`'s `advantageRank` branch, rows of name, `sub` and an off reason, from `Engine.minorChoice` | `sheet.js` ~768 | Tags under each option's name: held for the "raise" group, general for "new". The option's `id` is the Advantage's id. Confirm that before relying on it. |
| `effectTagsFor(kind, id, held)` fills a computed row from `effectTags[type]` whether or not `held` is given; Long-Lived's three `milestone` rows always give three tags | `engine.js` ~236 | With `held`: `effectTagsHeld[type]` and `{total}` when there's a template and a finite total, else as today; a `milestone` row past the held rank is skipped. Without `held`: unchanged, byte for byte. Total as before. |
| P18's tests pin general computed text (`rules` P18 2, unheld) and one held card: `smoke-sheet-archetypes` P18 6 expects Hard to Kill **×2**'s card to read "+1 max HP on every Health Level per rank" | `tests/rules.test.mjs`, `tests/smoke-sheet-archetypes.test.mjs` | P18 2 passes unchanged (it's unheld). **P18 6's Hard to Kill line is the one expected break.** It encodes 231's held reading, which N supersedes. Update it to "+2 max HP on every Health Level" in the same change as the decision, and say so in the PR. |

## 5. Where things land

| Press | What changes | Where focus goes |
|---|---|---|
| Expert mode (the header, on either step) | `localStorage["shadows.ui.expert"]`; the step re-renders folded or unfolded; opened entries are cleared | The header's toggle. **The entry at the top of the viewport stays at the top** (measure it: `getBoundingClientRect().top` within a few px before and after). |
| **?** on an entry | That entry's text opens or closes in place, with no re-render; `aria-expanded` flips | Stays on the **?** |
| A stepper, with entries open | The step re-renders as today | As today (164). The open entries stay open. |
| Typing in the filter | As today, and names match | Stays in the field |

**Nothing to do:** with Expert mode off, the steps render exactly as on `main`, byte for byte where the tests can see it. P13 changes nothing for a player who never presses the toggle.

## 6. Tests (write first; run on `main` and keep the output)

| Name | File | Setup → result |
|---|---|---|
| `P13 1: Expert mode folds the CP step's book text and keeps every control` | smoke-wizard | On: every filterable `.pick .desc` is hidden; each pick's name, cost, lock or requires line, flag note, stepper and held picks' selects are present. **?** on Ambidextrous shows its text (`aria-expanded="true"`). A stepper press keeps it open. A custom power's text stays shown. |
| `P13 2: Expert mode folds the Skills step's descriptions and keeps the picks` | smoke-wizard | On: no description `<small>` shown; steppers, check bonuses and Martial Arts' style selects are present; **?** opens one. |
| `P13 3: Expert mode is the browser's, never the character's` | smoke-wizard | Toggling writes `shadows.ui.expert` and leaves `S.ch`'s JSON byte-identical; a boot with the key set starts folded; a `localStorage` that throws boots unfolded with no error. |
| `P13 4: the CP Boosts heading names Max Boost, and every stepper keeps its count` | smoke-wizard | The heading reads "Max Boost +N" from the power level's `maxBoost`; in both modes every stepper has its `.val` between − and +, and a boost press still announces "boosts to Body 1" (W59). |
| `P13 5: the CP filter finds an entry by its name, in both modes` | smoke-wizard | "Ambidextrous" → Ambidextrous shown (plus what's held), "1 of 87" with nothing held; "Animal Ken" the same. With Expert mode on, a word only in Bullseye's text still finds Bullseye. **On `main`: 0 of 87.** |
| `P13 7: Expert mode folds the Archetype step's prose and keeps what each choice gives` | smoke-wizard | A Professional and an Arcanist: summary, lore and option descriptions hidden; Focused Skills, Tweak, Benefit and feature lines shown; choice controls and "n/m chosen" present; **?** opens an option's text. |
| `P13 8: Held only shows the build, and works with the filter` | smoke-wizard | Two Advantages and one Disadvantage held: Held only shows exactly those three, "3 held"; with a filter typed, both apply; a stepper's re-render keeps both; off shows all 87. |
| `P13 9: the Skills step's bar keeps Remaining in view and finds a skill by name` | smoke-wizard | The sticky bar is present with Remaining Skill Points, which follows a rank press; the filter "Handguns" shows Handguns only; a rank press keeps the filter. |
| `P13 6: the header's Expert mode toggle shows on three steps and keeps the keyboard's place` | smoke-wizard | Present on Archetype, Skills and CP, absent on every other step and on the sheet; `aria-pressed` follows the setting; focus is on the toggle after each press (164), never `<body>`. |
| `P13 10: the tags show wherever an Advantage or Disadvantage is chosen` | smoke-wizard, smoke-sheet-play (or wherever the IP and Minor tests live) | **Natural Advantages:** a Professional's Favored Skill shows its rule line before allocating, and with a rank and a pick allocated shows "…on Stealth…". Its tags stay in Expert mode while its `.desc` folds. **IP Advantages:** holding Bullseye 2, its row reads "Called Shots: +6 damage."; Hard to Kill under "Take a new one" shows its general chip. **IP buy-off:** a held Blood Lust's row shows both its tags. **Talented:** the raise row for Bullseye 2 reads "+6 damage", and Ambidextrous (new) its general line. **On `main`: all four fail.** |
| `P13 11: a held card's computed tags state its total` | rules | Held: Hard to Kill 2 → "+2 max HP on every Health Level"; Educated 3 → "+30 Skill Points"; Thick Skin 2 → starts "+2 Natural Armor;"; Hard to Kill as natural 1 + bought 1 → "+2 …". Long-Lived held at 1 gives one Milestone tag (rank 1's) and at 3 gives all three; Lucky held reads its general line. Not held: every computed tag equals P18 2's text. Change `perRank` in a copy of the data and the held total follows. A row with no `perRank` held falls back to the general template, never "NaN". P18 4 still passes unchanged. **On `main`: fails.** |

**Also:**
- **Voice:** the new copy passes `voice.test.mjs`.
- **Phone width:** `npm run phone-check` with §4's new rows.
- **The dev preview** (`shadows-dev-preview`), measured, not eyeballed:
  - the CP step's height at 375px with Expert mode on is under half of off;
  - `scrollWidth` = `clientWidth` on all three steps at 375px, folded and not;
  - the top-of-viewport entry holds its place across a toggle;

## 7. Mutants, each of which must fail a test

1. The filter back to `h4` (P13 5).
2. Expert mode written into the character (P13 3).
3. An opened entry closing on a stepper's re-render (P13 1).
4. A flag note or a requires line folded with the text (P13 1).
5. The header toggle on a step it changes nothing on (P13 6).
6. The heading's Max Boost hard-coded, not read from the power level (P13 4, at two power levels).
7. An Archetype step's labelled line (Focused Skills, Benefit) folded with the prose (P13 7).
8. Held only dropping a held entry the filter doesn't match, or keeping it shown once it's no longer held (P13 8).
9. A held computed tag filled with `perRank`, not `{total}` (P13 11, Hard to Kill at 2).
10. A Long-Lived Milestone past the held rank shown on a held card (P13 11, held at 1).
11. The held template used for an entry not held (P13 11, the "not held" pass; and the CP step's unpicked Hard to Kill in P18 6).
12. Any one of the four new places built without its tags, or passing `null` for a held entry (P13 10).

## 8. Out of scope

- **The Character tab and the sheet's Skills tab** (PQ2): they already fold.
- **Compact steppers** (PQ3: measured and dropped), and the sheet's own +/− controls.
- **Typed stepper values** (W121) and **Make a copy** (W122): their own orders.
- **Writing or changing any entry's effects** (W120, P18). P13 shows what P18 put in the data. The only words it changes are a held card's computed tags (§1.8), through the new templates: no `ruleText`, `heldText`, `byRank` or `description` changes.
- **Tags for the rank an IP Raise would reach** (PQ10's alternative), and **tags on archetype powers and Majors** (P18 §8: same mechanism, later).

## 9. Close-out and review checklist

**Close-out** (the close-the-session skill, ***Rule or shape*** tier since 2026-10-17):
- Decision **N** in `SCHEMA.md` §4 (the number-a-decision skill), with its INDEX §3 line, and Decision 231 and its INDEX line marked **superseded in part by N**; SCHEMA §2 gains `effectTagsHeld` beside `effectTags`; STATE rewritten;
- CHANGELOG, then `npm run changelog`; the version per §2;
- W95 to `log/wishes-granted.md` (heading pointing at the PR and the version); INDEX §2's W95 line; the plan's P13 row; a `shipped.md` row; W120 stays open;
- a `log/2026.md` entry for the filter (learned the hard way: a heading fix silently broke a selector, and a test's query matched by accident).

Suggested CHANGELOG lines (player voice):
- **Expert mode for making a character.** On the Archetype, Skills and Character Points steps, Expert mode folds the reading away and keeps the choosing: names, costs, buttons, and what each Advantage or Disadvantage does, as tags. Tap **?** to read the full text. Your browser remembers it.
- **Held only** on the Character Points step shows just what you've taken.
- **The Skills step keeps your remaining points in view,** with a filter and jumps to each group.
- **The boosts heading names your Max Boost,** so a + that stops says why.
- **The Character Points filter finds Advantages and Disadvantages by name.** It was only searching their descriptions.
- **Your Advantages' tags add up for you.** Hard to Kill at rank 2 reads +2 max HP on every Health Level, and Long-Lived lists only the Milestones your rank has.
- **The tags show wherever you pick an Advantage:** Natural Advantages on the Archetype step, buying with IP, buying off a Disadvantage, and Talented.

**Review checklist:**
- [ ] §6's tests exist with those names, and the PR shows them run on `main`'s code (P13 5 fails there on its count).
- [ ] §4's rows are each confirmed or corrected in the PR.
- [ ] `git diff origin/main --stat -- src` touches only `wizard.js`, `shared.js`, `app.js` (the wizard header's branch), `sheet.js` (the IP lists and Talented's modal), `engine.js` (`effectTagsFor`), `shadows-data.js` (`effectTagsHeld`), `shadows.css`, `tools/phone-check.mjs` and the generated changelog.
- [ ] Decision N passes `docs.test.mjs`, and 231 is marked superseded in part in SCHEMA and INDEX.
- [ ] P18 4 passes unchanged, and the only edited existing assertion is P18 6's Hard to Kill line (§4).
- [ ] §4's second table: each of the four places confirmed in the PR, with a screenshot or measurement from the dev preview.
- [ ] Expert mode off renders as `main` does (every existing wizard test passes unchanged).
- [ ] Mutants 1–8 are listed in the PR and the log, each with the test that killed it.
- [ ] The dev-preview measurements (§6) are in the PR, at 375px and at desktop width.
- [ ] `npm run verify` and `npm run phone-check` are green; the version case is stated.

## 10. Stop and ask

- **A change outside** `wizard.js`, `shared.js` (`stepper`'s helpers, `applyPickFilter`, and `heldRow`/`effectsHtml` moved in), `app.js` (the wizard header's branch only), `sheet.js` (the IP lists and Talented's modal only), `engine.js` (`effectTagsFor` only), `shadows-data.js` (`effectTagsHeld` only), `shadows.css` and `phone-check.mjs`.
- **PQ8–PQ10 unanswered by Ken.** The build doesn't start before then. A blank answer is the default.
- **Any computed value that moves** (P18 4), or a held total that isn't `perRank` × rank for some row in the data (that's PQ8's *Revisit if*: say which and stop).
- **Anything saved in the character.** There must be nothing.
- **An existing test that fails.** Expected breaks: **one**, `smoke-sheet-archetypes` P18 6's Hard to Kill ×2 line (§4), updated with Decision N. With Expert mode off nothing else renders differently, and the "berserk" test still passes once names match (Berserker's name contains it).
- §3's answers reading differently from what you're about to build.

## 11. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P13-expert-mode.md` and `<id>` = **P13**, and these traps under the builder's:

> Seven things in this order are easy to get wrong:
>
> 1. **The filter has matched nothing by name since 2026-10-01**: it reads `h4`, and the names are `h2`. Its test passes by accident. Test with a name the entry's text doesn't contain ("Ambidextrous").
> 2. **Expert mode is view state.** It goes in `localStorage` in try/catch, never in `S.ch`. The opened entries live in `S`, beside `S.cpFilter`, so a stepper's re-render keeps them.
> 3. **Fold only the book text.** Flag notes, lock and requires lines, held picks and a custom power's own text stay visible.
> 4. **The toggle is in the header, which `app.js` draws, not the step.** It shows on the Archetype, Skills and CP steps only, and the header must still fit its height at phone width with two buttons.
> 5. **The Archetype step's labelled lines are mechanics; its plain descriptions are prose.** Fold the second, keep the first, and mark them in the markup so the test can tell them apart.
> 6. **A held computed tag is still generated, never typed.** `effectTagsHeld` is a template filled with `{total}` = `perRank` × the held rank. An entry not held reads exactly as P18 left it, and no computed value moves (P18 4).
> 7. **Four places, not one.** Tags go to the Natural Advantages panel, both IP lists and Talented's pick, each held or general as §1.7 says. Pass the held row for an entry the character holds; `null` is only for one it doesn't.
>
> Tier: **Rule or shape** (since 2026-10-17). One decision (the next free number, superseding 231 in part), no data or schema bump; app per §2. Use the close-the-session skill at the end.
