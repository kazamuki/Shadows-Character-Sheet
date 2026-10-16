# Work order P13: Expert mode

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W95** (`WISHLIST.md`); Decisions 158, 164, 218; P4's W59 (built, 0.41.0).

**Scope:**
- **W95:** an **Expert mode** toggle on the wizard's Skills and Character Points steps that folds each entry down to its name, cost and controls, with its text a tap away;
- **the CP Boosts heading names Max Boost** (what's left of Brogan's second ask, compact steppers, which the pre-flight measured and Ken dropped: PQ3);
- **the CP filter, which can't find anything by name** (found in the pre-flight, below).

**Status:** **drafted 2026-10-16 by Claude (Opus)**, P12b's reviewer. Pre-flighted against `main` at `5875bd5` (#204: v0.47.0's release prep, merged; **v0.47.0 released** the same day: tag, Release and the live site's footer). **Ken answered on 2026-10-16 (§3):** PQ2, PQ5 (with a follow-on, W120), PQ6 and PQ7 on their defaults; **PQ1: the count reads "+N", and Max Boost is stated once on the page; PQ4: the wizard's header.** **PQ3: no compact steppers.** At 320px, compact saves 42px of width and no height, and it takes each count away from its buttons.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P13 build** (Sonnet), then a fresh reviewer (Opus) once the PR is open. A *Fix* order gets a page (*How exact to be*): this is one.

**Carried over from P12b's review:**
- **The order's miss:** §8.6 said to drop a training "whose skill is unknown, or whose rank would pass `maxRank`", and didn't ask what else ends the precondition (Admin removing the skill). The training brought the skill back at rank 1.
  **Applied here:** §4 lists every reader of what P13 moves, and every way each one stops holding. For example, the stepper's count has exactly one reader, `announceStep`, and it reads the DOM.
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

1. **Expert mode.** The wizard's header has an **Expert mode** toggle (pressed or not) beside Home, on the Skills and Character Points steps, the two it changes (PQ4). It's one setting for both steps, remembered in this browser like the Character tab's Expand all (Decision 158), and **never** saved in the character. Off by default.
2. **Folded, not hidden.** In Expert mode:
   - **Skills:** each skill's description folds away. Its name, stat line, focused chip, rank stepper, check bonus and (Martial Arts) style picks stay.
   - **Character Points:** the book text folds away for Disadvantages, Advantages, LUCK, Disciplines and Starting spells (PQ5). Each entry keeps its name, cost, chips (natural, creation only, Universal), lock and requires lines, flag note, stepper and held picks.
   - Each folded entry has a **?** beside its name that opens its own text (as the sheet's Skills tab does). An entry opened stays open across the re-render a stepper causes, and closes when Expert mode is turned off.
3. **Max Boost, named once.** The CP Boosts heading reads "Max Boost +N" (Decision 218's name), so a greyed + explains itself; the row's ⛔ reason (`canBoost`'s `why`) stays. **Every stepper is unchanged** (PQ3): the count stays between − and +.
4. **The filter finds names.** "Ambidextrous" shows Ambidextrous, in either mode, and a word only in an entry's text still finds it while the text is folded.

## 2. Tier, versions, numbers

- **Tier: Fix (UI)**, as the plan has it. Nothing is stored, no rule moves, and no decision is numbered. Expert mode is view state on Decision 158's pattern, and its choices are §3's, answered by Ken.
- **App:** **minor**, `npm run bump -- 0.48.0` (Expert mode is a new thing a player can do). 0.47.0 is released. If `[Unreleased]` still reads `app 0.47.1` (PR #206, the Progression overflow patch, if it merged first and is unreleased), the bump to 0.48.0 renames that heading and P13's lines join it. If another order has already bumped to 0.48.0, join its heading. Say in the PR which case applied.
- **Game data:** no bump. **Character schema:** no bump (§1.1: nothing is saved).
- **CHANGELOG:** §9's three lines.

## 3. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Where the boost count goes** when it leaves the stepper. | Into the row's label: "BOD value 7 · 2 boosts", "Handguns rank 5 · 1 boost", nothing at 0. The count stays in the stepper for screen readers only, so `announceStep` is unchanged. *Alternative:* drop it, since "value 7" already includes it. But Max Boost caps boosts per stat (218), so the player needs the count to see how close they are. | **Ken, 2026-10-16: "+N" beside the name, not "N boosts"; Max Boost stated somewhere on the page ("Max +2"), so a "+2" with a greyed + says why.** **Then PQ3 dropped compact steppers, so the count stays between the buttons and "+N" beside the name would repeat it. What's kept: the heading reads "Max Boost +N"** (§1.3). |
| PQ2 | **Does Expert mode reach the Character tab?** | **No: creation only.** The Character tab's Advantages and Disadvantages are already folded cards with Expand all (158), and the sheet's Skills tab already folds its text behind **?**. *Alternative:* one setting across both, which makes Expand all and Expert mode two controls for one thing. | **Ken, 2026-10-16: the default.** |
| PQ3 | **Compact boosts only in Expert mode, or always?** | **Only in Expert mode.** A first-time player keeps the count between the buttons, as every other stepper has it. *Alternative:* always compact. | **Ken, 2026-10-16, after a side-by-side and a measurement: neither. No compact steppers.** At 320px, removing the count makes a stepper 42px narrower (132 → 90) and the boosts section no shorter (424px either way, on a 33,713px step). It also moves the count away from its buttons, shows nothing at 0, and makes the boosts the only steppers of 16 without their value between the buttons. Expert mode's folding is where the room is. |
| PQ4 | **Where the toggle sits.** | On each of the two steps: at the top of Skills, and in the CP step's sticky jump bar beside Remaining CP, so it's in reach from anywhere on the longest page. *Alternative:* the wizard's header, beside Home (P4). | **Ken, 2026-10-16: the wizard's header.** Shown on the Skills and CP steps only, so it never appears where it changes nothing. That puts `app.js`'s wizard header in scope (§4), and phone-check must hold the header's height at its narrowest width with two buttons. |
| PQ5 | **Which CP text folds.** | Book text: Disadvantages, Advantages, LUCK's line, Disciplines, Starting spells. **Never** a flag note, a lock or requires line, a pick's choices, or a custom power's own written text. *Alternative:* Advantages and Disadvantages only, W95's words. | **Ken, 2026-10-16: the default; and where text carries mechanical weight, Expert mode might show just what taking it provides, without the prose.** That needs a field the data doesn't have: each entry has one `description`, and 69 of the 87 run to several paragraphs that mix the two (Blood Lust opens "Everyone bleeds. Not everyone stops to watch." before its Sanity Check). Writing 87 short mechanics lines is rules text to cross-check against the CRB, a data shape and its own order: **W120**. P13 folds the whole text. |
| PQ6 | **The filter fix: here, or a patch first?** | **Here.** Finding the one you want is W95's whole point. *Alternative:* a 0.47.1 patch now (one selector and its test), with P13 after. | **Ken, 2026-10-16: the default.** |
| PQ7 | **The toggle's words.** | "Expert mode", with `aria-pressed`, and a hint on first sight: "Folds each entry to its name and cost. Tap ? to read one." Marked for a voice pass. | **Ken, 2026-10-16: the default.** |

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
| The wizard's header holds Home alone: `act.innerHTML` gets one `.hdr-btn` on every wizard step | `app.js` ~57 (`renderTopChrome`'s wizard branch) | Expert mode joins it on the Skills and CP steps, pressed per `shadows.ui.expert`. The header redraws on a step change, so the button comes and goes with the step. |
| The CP Boosts heading reads "…up to N each, LUCK included" | `renderCP`, `wizard.js` ~671 | Reads "Max Boost +N" (PQ1), LUCK included. |
| `phone-check` measures the wizard's Stats step only (P4), including the header's height with Home held to finger size | `tools/phone-check.mjs` ~155 | Also Skills and CP, each in Expert mode, at its widths, with the header's height measured with both buttons. |

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
| `P13 6: the header's Expert mode toggle shows on two steps and keeps the keyboard's place` | smoke-wizard | Present on Skills and CP, absent on every other step and on the sheet; `aria-pressed` follows the setting; focus is on the toggle after each press (164), never `<body>`. |

**Also:**
- **Voice:** the new copy passes `voice.test.mjs`.
- **Phone width:** `npm run phone-check` with §4's new rows.
- **The dev preview** (`shadows-dev-preview`), measured, not eyeballed:
  - the CP step's height at 375px with Expert mode on is under half of off;
  - `scrollWidth` = `clientWidth` on both steps at 375px;
  - the top-of-viewport entry holds its place across a toggle;

## 7. Mutants, each of which must fail a test

1. The filter back to `h4` (P13 5).
2. Expert mode written into the character (P13 3).
3. An opened entry closing on a stepper's re-render (P13 1).
4. A flag note or a requires line folded with the text (P13 1).
5. The header toggle on a step it changes nothing on (P13 6).
6. The heading's Max Boost hard-coded, not read from the power level (P13 4, at two power levels).

## 8. Out of scope

- **The Character tab and the sheet's Skills tab** (PQ2): they already fold.
- **The Archetype step's long text** (archetype descriptions, powers). Not W95's ask; a W-next if a playtester raises it.
- **Compact steppers** (PQ3: measured and dropped), and the sheet's own +/− controls.
- **A search on the Skills step.** It has no filter today; adding one is a W-next.
- **A mechanics-only line per entry** (PQ5's follow-on, **W120**): P13 folds the whole description.

## 9. Close-out and review checklist

**Close-out** (the close-the-session skill, *Fix* tier):
- CHANGELOG, then `npm run changelog`; the bump per §2;
- W95 to `log/wishes-granted.md` (heading pointing at the PR and the version); INDEX §2's W95 line; the plan's P13 row; a `shipped.md` row; W120 stays open;
- a `log/2026.md` entry for the filter (learned the hard way: a heading fix silently broke a selector, and a test's query matched by accident).

Suggested CHANGELOG lines (player voice):
- **Expert mode for making a character.** On the Skills and Character Points steps, Expert mode folds each Skill, Advantage and Disadvantage to its name, cost and buttons; tap **?** to read one. Your browser remembers it.
- **The boosts heading names your Max Boost,** so a + that stops says why.
- **The Character Points filter finds Advantages and Disadvantages by name.** It was only searching their descriptions.

**Review checklist:**
- [ ] §6's tests exist with those names, and the PR shows them run on `main`'s code (P13 5 fails there on its count).
- [ ] §4's rows are each confirmed or corrected in the PR.
- [ ] `git diff origin/main --stat -- src` touches only `wizard.js`, `shared.js`, `app.js` (the wizard header's branch), `shadows.css`, `tools/phone-check.mjs` and the generated changelog.
- [ ] Expert mode off renders as `main` does (every existing wizard test passes unchanged).
- [ ] Mutants 1–6 are listed in the PR and the log, each with the test that killed it.
- [ ] The dev-preview measurements (§6) are in the PR, at 375px and at desktop width.
- [ ] `npm run verify` and `npm run phone-check` are green; the version case is stated.

## 10. Stop and ask

- **A change outside** `wizard.js`, `shared.js` (`stepper`'s helpers, `applyPickFilter`), `app.js` (the wizard header's branch only), `shadows.css` and `phone-check.mjs`.
- **Anything saved in the character.** There must be nothing.
- **An existing test that fails.** Expected breaks: **none.** With Expert mode off nothing renders differently, and the "berserk" test still passes once names match (Berserker's name contains it).
- §3's answers reading differently from what you're about to build.

## 11. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P13-expert-mode.md` and `<id>` = **P13**, and these traps under the builder's:

> Four things in this order are easy to get wrong:
>
> 1. **The filter has matched nothing by name since 2026-10-01**: it reads `h4`, and the names are `h2`. Its test passes by accident. Test with a name the entry's text doesn't contain ("Ambidextrous").
> 2. **Expert mode is view state.** It goes in `localStorage` in try/catch, never in `S.ch`. The opened entries live in `S`, beside `S.cpFilter`, so a stepper's re-render keeps them.
> 3. **Fold only the book text.** Flag notes, lock and requires lines, held picks and a custom power's own text stay visible.
> 4. **The toggle is in the header, which `app.js` draws, not the step.** It shows on the Skills and CP steps only, and the header must still fit its height at phone width with two buttons.
>
> Tier: Fix (UI). No decision, no data or schema bump; app minor per §2. Use the close-the-session skill at the end.
