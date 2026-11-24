# Work order K5: Help's voice pass

**Plan:** [`../help-on-the-sheet.md`](../help-on-the-sheet.md) §3, the **Voice** row. **Built on:** K1 (Decision 289), K3 (Decision 298), K4 (Decisions 306–307). Decisions 68, 135, 287, 296, 302.

**Status: drafted 2026-11-24** by Claude (Opus), the K3 conductor, from the **Sheet Help Read** page (https://claude.ai/artifact/DdAkpXKn1WaN6KMaFyXHo5). Ken and Scott each answered all 29 lines. Deighton hadn't answered, and Ken judged two reads enough (2026-11-24). **Ken settled every split on 2026-11-24**, in the conductor's session (§4). KQ30 is open, with a default.

**Tier: Fix.** It changes copy and one display name. No rule moves, no id changes, and no decision is needed. **App:** a patch bump, plus a CHANGELOG line, since a player sees it. **Game data: no bump** (Decision 68): renaming an outcome's display name changes no computed value and no available choice, and its id `walked` stays. **Schemas:** none.

**Branch:** cut from `origin/main`. PR to `main`. Ken merges.

**Cadence:** small enough for one builder session (Sonnet). CLAUDE.md keeps the three-session loop for *Rule or shape* and larger *Content*, so a reviewer is the conductor's call, not required. §8 is what the PR must show either way.

## 1. Goal and Done when

The sheet's Help and guide lines say what Ken and Scott asked for. CRANK's −2 outcome is called **Abandoned** wherever the app names it, as the rulebook does (`2625`: "Abandoning a contract mid-job costs -2 rep").

Done when every row in §3 reads as written, every reader in §5 agrees, `npm run verify` passes, and the walk in §7 is clean.

## 2. What the read found

| Line | Ken | Scott | Settled (Ken, 2026-11-24) |
|---|---|---|---|
| Skills rule line (`introSkills`) | reword: "Synergy Bonus" | reword: "Synergy bonus", "just to be clear it's the +4 not the 10" | **Synergy Bonus** (`0300`'s capitalisation) |
| Skills tab, *What it's for* | reads | reword: passive, and the reverse of the book's `1d10+x` | **Reword** (§3, row 2) |
| CRANK jobs line (`crankJobsWhere`) | reads | reword: "abandoned" instead of "walked out" | **Abandoned everywhere**, the outcome's name included |
| Armor, none worn (`armorPutOn`) | reword: "Buy or equip under Loadout" | reads | **Ken's**, in Loadout's own verb (KQ30) |
| Main tab | reads | reads, with a note that "guide line" as two words feels odd | **Keep "Guide lines"** |
| Burned paid off (`burnedRemove`) | reword: Burned should come off without Admin mode | reads | **Its own order.** This is a behaviour change (§6). The line stays as it is |
| The other 23 | reads | reads | unchanged |

## 3. The copy

| # | Where | Now | New |
|---|---|---|---|
| 1 | `appCopy.introSkills` | "A trained Skill rolls 1d10 + its Rank, its Primary Stat and its Synergy. An untrained one rolls 1d10 + its Primary Stat, and nothing else." | "A trained Skill rolls 1d10 + its Rank, its Primary Stat and its **Synergy Bonus**. An untrained one rolls 1d10 + its Primary Stat, and nothing else." |
| 2 | `sheetGuide` Skills context, *What it's for* | "Every Skill, trained or not, with the total you add to a d10. A Skill's **?** says…" | "Every Skill, trained or not, and its total: you roll 1d10 + that. A Skill's **?** says what it covers and what's particular to it." |
| 3 | `resources.crank.outcomes`, id `walked`, `name` | "Walked out" | "Abandoned" |
| 4 | `sheetGuide.lines.crankJobsWhere` | "Jobs done and walked out are on {tab:main} and {tab:trackers}." | "Jobs done and abandoned are on {tab:main} and {tab:trackers}." |
| 5 | `resources.crank.description`, its last two sentences | "Walking out on a client is the one thing that follows you. Walking away from a client who broke the contract first isn't walking out, and costs nothing." | "Abandoning a contract is the one thing that follows you. Walking away from a client who broke it first isn't abandoning it, and costs nothing." |
| 6 | `sheetGuide.lines.armorPutOn` | "Pick it up or put it on under {tab:loadout}." | KQ30's answer. Default: "Buy it or wear it under {tab:loadout}." |
| 7 | the sheet's CRANK button (`crankControlsHtml`, sheet.js ~1616) | the literal `Walked out` | the `walked` outcome's `name` from the data, so the button and the GM's log can't drift apart again |
| 8 | GM mode's job hint (gm.js ~3133) | "A job the crew finished, failed or walked out of tonight." | "A job the crew finished, failed or abandoned tonight." |

Row 5 is checked against `2625`, which reads "bailing on a client is the one thing that follows you", and says walking away from a client who broke the contract first "isn't abandonment". Row 1 is checked against `0300` ("Skill rank + Primary Stat + Synergy Bonus modifiers") and `0200`.

## 4. Questions for Ken

- **KQ30: the armor line's verb.**
  - **Default:** "Buy it or wear it under {tab:loadout}." Loadout's armor row has a **Worn** box and a **Buy** button, and its log says "Put on". "Wear" matches what the player taps.
  - *Alternative:* "Buy or equip it under {tab:loadout}.", Ken's own words on the page. Loadout doesn't use "equip" anywhere, so the player looks for a button that isn't there.

## 5. Every reader

Found by grep on `origin/main` at `c0c6f30` (app 0.76.0, released; game data 0.60). Re-run the grep at build.

- **"Walked out" / "walked"**:
  - `shadows-data.js`: the outcome's `name` (row 3), `crankJobsWhere` (row 4) and `crank.description` (row 5).
  - `sheet.js` ~1616: the button (row 7).
  - `gm.js` ~3133: the hint (row 8). gm.js ~3036 writes the log from `o.name.toLowerCase()`, so it reads "Dock job, abandoned" with no edit.
  - `tests/smoke-table-play.test.mjs` ~3000 and ~3004 pin "walked out" in the log. Update them to "abandoned".
  - **Stays:**
    - **Burned's `description`** ("You walked out on a contract…"). It quotes `0431` word for word.
    - **`jobWalkedOut`, the id `walked`, and test names.** These are keys, not copy (constraint 6).
    - **The released CHANGELOG sections and `shadows-changelog.js`'s old entries.** They're history.
    - **The sample table's prose** ("talked, then walked"). It's flavour, not the outcome.
- **"Synergy"** (row 1): `introSkills` is drawn through `termsHtml`, and the `skill-check` term's `forms` list "Synergy". So "Synergy Bonus" would light up only "Synergy" as the tip trigger. Add "Synergy Bonus" to that term's `forms`. Check `Engine.termSpans` takes the longest form at a position, so the whole phrase becomes one trigger. If it doesn't, stop and ask: don't change the matcher here. **Other uses of "Synergy" stay:**
  - The tooltip in `shared.js:61` names the Synergy Stat, not the bonus.
  - The data's prose at ~4165.
- **`armorPutOn`** is read in one place (sheet.js ~1808, `sheetLine`), and `crankJobsWhere` in one (~3023).
- **The Skills context** is read by Help's *This page* view. `tests/smoke-sheet-help.test.mjs` reads the context from the data, not a literal. Grep for the old sentence in the tests anyway.

## 6. Out of scope

- **Removing Burned without Admin mode** (Ken). Today a held Disadvantage comes off only on the Admin tab. Decision 296 rejected the engine removing Burned by itself, but never ruled on a player's own Remove button. That's a player-facing behaviour someone could have chosen otherwise, so it's *Rule or shape*: its own order, with Scott, who rules CRANK. `burnedRemove` ("Remove it on Admin.") stays until it ships.
- **Renaming the Guide lines switch** (Scott's note). Kept (Ken, 2026-11-24).
- **Deighton's read.** If his answers arrive before this merges, the conductor brings any new split to Ken. After merge, they're a new order.

## 7. Steps

1. `git submodule update --init private`, then `npm run test:fast` on the fresh branch.
2. Make §3's edits in the data, sheet.js and gm.js. Add the "Synergy Bonus" form (§5).
3. Tests:
   - **Update** the two log assertions.
   - **Add** one smoke test: Main's CRANK button reads the `walked` outcome's name, and the GM log line says "abandoned".
   - **Add** one check: Skills' rule line has "Synergy Bonus" as a single tip trigger.
   - **Mutation-test both:** each must fail with the old literal or the old forms list.
4. CHANGELOG under a new `[Unreleased]` patch heading (`npm run bump` to the next patch), in player voice. Something like: "CRANK's −2 job is called **Abandoned** now, as the rulebook calls it. Skills says **Synergy Bonus**, and its Help reads the way you roll: 1d10 + the total." Then `npm run changelog`.
5. Mark the plan's Voice row built. Add STATE's line, the log entry, and `shipped.md`'s row, as Fix requires.
6. `npm run verify`.
7. **Walk:** with the dev server, open:
   - Skills and its Help;
   - Main's CRANK popover (the button);
   - Trackers' armor with none worn;
   - Admin's CRANK line;
   - GM mode's job form, writing an Abandoned job to the log.

   Do it at 375px and 1280px.

## 8. The PR

The title names K5. The body has §3's table as built, the reader list re-run with anything new, the mutation results, and the walk.
