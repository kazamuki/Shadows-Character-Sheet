# Work order P9a: Gear text, difficulty names, and the Magical being

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** **W104** without F34, and **W53** (`WISHLIST.md`). Closes **F26, F30, F31**. Opens no flag.

**Split (Ken, 2026-10-15):** P9 became P9a, this order (Content), and **P9b**. P9b is F34, partly spent magazines kept with their count. It is a save shape, ordered after P9a merges.

**Status:** **drafted 2026-10-15 by Claude (Opus)**. Pre-flighted against `main` at `a1198c0` (#183 merged; P8a and P8b in; 0.44.0 unreleased). **Waiting on Ken's PQ1–PQ5** (§4).

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop, as adopted in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P9a build** (Sonnet) and, once the PR is open, a fresh reviewer (Opus).

**Carried over from P8b's review:**
- **The order's miss.** The sweep listed where the HP pill's number shows from memory. It missed two places that show the same number: the popover the pill opens, and the pinned drawer that hides the pill. **Applied here:** every row of §5 was found by grepping the field's readers. The two this turned up that a topic read wouldn't have are Other's "Neither one" (§5) and a test that goes vacuous (§5, §10).
- **The build's slips.** None.

**What P9a is.** Deighton ruled on the gear questions and two naming ones (`reference/rulings-2026-10-10.md` Q8–Q10, Q31, Q33). Each is text or a data row, with no engine rule moving:

- **F26:** a shotgun takes neither the Scope nor the Angel Mod. The stub stands; the flag closes, and the mods say why.
- **F30:** Anti-Materiel does nothing extra to a person. It means vehicle armor doesn't stop the weapon.
- **F31:** the Reach column is how far the weapon reaches. The tag marks an unusual reach and adds nothing.
- **Difficulty names:** the skill-check tiers are **Easy / Average / Challenging** (10 / 15 / 20).
- **W53:** a **Magical being** classification, which buys Universal Advantages only, like a Supernatural.

**Probes against `main`** (`a1198c0`):

```
glossary("Reach").note           "What the tag adds beyond that number isn't written yet. Your GM rules on it."
glossary("Anti-Materiel").text   "…no separate personal-combat effect is defined yet."   ← maintainer-ish
skillCheckRules.difficulties     {"easy":10,"medium":15,"hard":20}   ← "How a check works" chips read "easy 10 medium 15 hard 20"
classifications                  mortal:all, supernatural:universal, other:all
a write-in, each classification  mortal 57 Advantages open · supernatural 15 · other 57
shotgun (SG-88), Scope           ok:false, why "Doesn't fit SG-88 \"Siege Breaker\"."
                                 description "…Compatible with rifles and the ADS TC-1 Strix only."
                                 ← Deighton: "shotguns are a rifle", so the description doesn't say why
```

---

## 1. Goal

When P9a is merged:

1. **Anti-Materiel and Reach read as rules.** Their tips say what the tag does, with no "isn't written yet" note.
2. **A shotgun's Scope and Angel Mod say why not.** Each mod's description says that shotguns don't take it, and why. The refusal is unchanged.
3. **The skill-check tiers read Easy / Average / Challenging.** This covers *How a check works*, and anywhere else the data or copy names a skill-check tier.
4. **A written-in archetype can be a Magical being.** It buys Universal Advantages only, and says what it is in the player's own words.
5. **F26, F30 and F31 are closed** (three edits each). W53 moves to `wishes-granted.md`. W104 stays open with F34 alone for P9b.

## 2. Tier, versions, numbers

**Tier: Content.** Data a character can observe:
- a new classification is a new choice;
- the closed flags' notes go;
- the tier names change.

**No numbered decision**, because nothing here is a choice someone could have made otherwise. Deighton ruled each, and the ledger already holds the rules they fill:
- Decision 152: classifications say `all` or `universal`.
- Decision 120: mods fit per `onlyFor`.
- Decision 136: a map's key is its display text.

Three **Revisit if**s fire, and none reopens. Say so in the log entry:
- **149** ("F34 or F26 is ruled"): F26's ruling keeps the stub, and F34 is P9b.
- **152** ("Deighton rules on Magical being"): his ruling is `universal`, one of 152's two answers, so the rule is unchanged and gains one row.
- **153** (Magical being among its triggers): 153 is about write-in archetypes, and a classification row changes nothing there.

**If PQ1 takes its alternative** (a refusal-text key), the order becomes *Rule or shape*, with one decision for the new data key. Re-draft before building.

**App version:**
- **0.44.0 still unreleased** (`CHANGELOG.md` heads `[Unreleased] — app 0.44.0`): no bump.
- **0.44.0 released:** `npm run bump -- 0.45.0` (minor: Magical being is a new option).

**Game data:**
- **0.37 unreleased:** no bump.
- **0.37 released:** `gamedataVersion` 0.38.

Say in the PR which case applied.

**Character schema:** no bump. A classification id is stored (`archetypeChoices.writeIn.classification`), but the field's shape doesn't move. `magical-being` is a new id, and it is **immutable from merge**.

## 3. Decisions

None (§2). The log entry carries the three *Revisit if* notes.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **Where a shotgun's "why not" goes.** Deighton: "shotguns are a rifle but they don't use scopes", and Angel Rounds "need a box magazine with a power cell". Today a shotgun's mod list says only `Doesn't fit SG-88 "Siege Breaker".`, beside a description that says the Scope fits rifles. | **A sentence added to each mod's `description`**, shown in the mod list on every weapon. **Scope:** "Not on a shotgun: shotguns don't take scopes." **Angel Mod:** "Not on a shotgun: Angel Rounds need a box magazine with a power cell." Content, no shape. *Alternative:* an `onlyForText` key that `weaponModOptions` returns as the refusal's `why`, shown only where it's refused. It's better placed, but it's a data shape and a decision (§2). |
| PQ2 | **Does the armor-wear die rename too?** Its tiers are the GM Workshop's *encounter* difficulty: Easy (1d4), Medium (1d6), Hard (1d8), Legendary (1d10). That is a different scale from the skill-check targets (`crb-catch-up.md` line 24 frames Q33 as the skill checks, in 0300 against 2130). | **No: skill checks only.** The wear die keeps the CRB's names, and the Sheet's and GM mode's Wear selects are unchanged. *Alternative:* Easy / Average / Challenging / Legendary there too. That's four test files and sheet.js's `difficulty:"medium"` default (§5), plus a `crb-catch-up` line for 2000 and 2240's worksheets. |
| PQ3 | **The Razorwhip's reach.** The CRB (`0460`, line 303) gives the Razorwhip **1m** and the **Reach** tag, and the data matches. Deighton's note says the mono-whip reaches "5 or 6 feet", and that the tag marks a reach that's unusual. A 1m Razorwhip with the tag fits neither. (The Filament is 2m.) | **Data stays the CRB's.** A `crb-catch-up` line under the gear item asks the book to give the Razorwhip 2m, or drop its tag. The sheet doesn't depart from the book on a number Deighton didn't give. *Alternative:* 2m now, with the book to follow. |
| PQ4 | **Magical being's shape.** | `{ "id": "magical-being", "name": "Magical being", "description": "Older than the city, or from somewhere beside it: the fae and their kind. Only the Universal Advantages are open to them.", "advantages": "universal", "writeIn": true }`, after Supernatural. **`writeIn: true`**, so the player names what they are ("Fae") as Other does. The description is drafted in NYTE City voice; **mark it for a voice pass.** |
| PQ5 | **Characters already written in as Other** with "Fae" or "Magical being" as their words. A classification is fixed at lock (Admin says so). | **Leave them.** Moving one would close Advantages it holds. A GM who wants it moved rebuilds the character. No migration, no notice. |

## 5. What this changes underneath (the assumption sweep)

Found by grepping the readers of each field (`playerNote`, `flagged`, `difficulties`, `classifications`, `classificationText`, `"Magical being"`), not from memory. **Check each row yourself before you build**, and say in the PR if any is wrong. Two questions are asked of every row:
- **Which guards read a value this changes?**
- **Where does each new or removed note or name render?**

| Today | Where | After P9a |
|---|---|---|
| `Anti-Materiel` and `Reach` carry `flagged`, `flagNote` and `playerNote`. Anti-Materiel's description says "no separate personal-combat effect is defined yet". | data ~3615–3616 (`weaponTagGlossary`) | All three keys go. New descriptions: **Anti-Materiel:** "Vehicle armor doesn't stop it, so it deals full damage to vehicles. Against a person it's the weapon's AP and damage that count, nothing extra." **Reach:** "The weapon reaches as far as its Reach column says. The tag marks a reach that's unusual for its kind; it adds nothing to the number." Both in tool voice. |
| The tags' notes render as a tip's note (`glossary()` returns `note: playerNote`) | `engine.js` ~1412; `shared.js` ~559 (tag tips); the GM Reference's tags panel (`gmReference`) | `note` is `null`, and the tip draws no note line. **Check that the GM Reference's tags panel still draws** both tags (a reader of the same glossary). |
| **The guard goes vacuous:** "a flagged tag reads as something a player can use, not a note to us (F30–F31)" loops over flagged tags. Once these two close there are none, and it passes on nothing. | `engine.test.mjs` ~2467 | Keep it as a guard for the next flagged tag. Run it over a synthetic flagged entry via `withData` (as `engine.test.mjs` ~6095 does), so it still fails when a flagged tag has no `playerNote`. Rename it so it no longer cites F30–F31. Mutation-test it (§10). |
| `Scope` and `Angel Mod` carry `flagged`, `flagNote` and `playerNote` (F26) | data ~3643, ~3646 | All three go. Each description gains PQ1's sentence. `onlyFor` is unchanged: the stub is the ruling. |
| An installed flagged mod draws its note on Loadout | `sheet.js` ~1769 (`flagged.map(flagHtml)`) | Draws nothing for these two. No code change. |
| The data comment on tags says Anti-Materiel and Reach are "carried here with `flagged: true`" | data ~3580–3586 | Rewrite: they're defined by Deighton's rulings of 2026-10-10. |
| Three tests cite "F26's stub" | `engine.test.mjs` ~2174, ~2211, ~2218 | Re-cite the ruling (Q8). Every assertion is unchanged. |
| `skillCheckRules.difficulties` is `{ "easy":10, "medium":15, "hard":20 }`. A key is its display text (Decision 136; the `MAPS` list, `engine.test.mjs` ~320). | data ~309–313 | `{ "Easy":10, "Average":15, "Challenging":20 }`. Its one reader is `checkRulesHtml` (`sheet.js` ~441), which draws `esc(k)`, so the chips read "Easy 10 · Average 15 · Challenging 20". No code reads a key by name (grep: none in `src/` or `tests/`). |
| The check table in the quick reference already reads "10 (Easy) · 15 (Average) · 20 (Challenging)" | data ~4307 | Unchanged. |
| The wear die's tiers: `integrityLossByDifficulty` `{ easy, medium, hard, legendary }`, rendered by `titleCase` | data ~3766; `sheet.js` ~945 (the default `"medium"`), ~1063; `engine.js` ~1628, ~6311; `gm.js` ~2178 | **Unchanged under PQ2's default.** Under its alternative: the keys become `average` and `challenging`. `sheet.js:945`'s `difficulty:"medium"` then names no die, and the Wear panel opens refusing ("Choose how hard the fight was."), so it moves to `"average"`. The expected test breaks then are `rules.test.mjs` 608–636 (`"hard"`, `"medium"`), `engine.test.mjs` 1438, and `smoke-table-play.test.mjs` 505. |
| `classifications` has three rows: Mortal, Supernatural, Other | data (`classifications`) | Four, with `magical-being` after Supernatural (PQ4). Readers:<br>• `Engine.classification` / `canBuyAdvantage`: by `advantages`, so Universal-only follows with no code.<br>• The wizard's gating: `wizard.js` ~536, ~560, by `advantages==="universal"`. It lists the open ones first under `${openCount} open to ${cls.name}s`, which reads "15 open to Magical beings".<br>• `validate`'s write-in warning: ~3971, by `writeIn`.<br>• Admin's "in their words" field: `sheet.js` ~1614, by `writeIn`.<br>• `writeInOptions`: returns the list.<br>• The wizard's cards: `wizard.js` ~461, `.cards.three`, an `auto-fill` grid (`shadows.css` ~139), so four cards wrap. Check that the wizard reads well at phone width.<br>• `engine.test.mjs` ~82–88 loops the rows: passes.<br>**Zero code changes.** If one is needed, that's a bug (CLAUDE.md). |
| **Other's description says "Neither one, or something the city has no word for."** It counts two classifications. | data (`classifications`, `other`) | "None of these, or something the city has no word for. Every Advantage is open to them." |
| **The write-in's classification placeholder is "Magical being"** | `wizard.js` ~465 | It now names a classification of its own, and the field shows for both Other and Magical being. The placeholder becomes "In a word or two". |
| SCHEMA §3's comment gives `"Magical being"` as an example of `classificationText` | `SCHEMA.md` ~761 | `"Fae"`. |
| Changelog history ("Every archetype is Mortal or Supernatural") | `shadows-changelog.js` ~180 | Unchanged: it's a past release's notes. |
| Decisions 149, 152 and 153's *Revisit if* | `SCHEMA.md` §4 | Not marked (§2). The log entry says why each fired and didn't reopen. |
| F26, F30, F31: §5 rows, INDEX §2 lines, `crb-catch-up.md` ~117 and ~200 | docs | Closed (three edits each). On line ~200, strike them in the Deighton list as P8b did for F24 and F36. Line ~117's gear item gets "*The sheet has this built (P9a)*" for the three, plus PQ3's Razorwhip line. Line 24 (difficulty names) gets the same for the skill checks. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `WISHLIST.md` W104 and W53; `reference/rulings-2026-10-10.md` Q8–Q10, Q31, Q33.
- `SCHEMA.md` §4: Decisions **120** (mods, `onlyFor`), **135** (data keys are read or named), **136** (map keys are display text), **149** (rounds; its *Revisit if*), **152** (classifications), **153** (write-in archetypes). §5's F26, F30 and F31 rows.
- `src/data/shadows-data.js`: `weaponTagGlossary` (~3577–3620), `weaponModGlossary` (~3640–3650), `skillCheckRules` (~305), `classifications`.
- `src/engine/engine.js`: `glossary` (~1403), `weaponModOptions` (~1350), `classification` / `canBuyAdvantage` (~111–125), `validate`'s write-in (~3965).
- `src/ui/sheet.js` `checkRulesHtml` (~440); `src/ui/wizard.js` `writeInHtml` (~451).

## 7. Out of scope

- **F34** and the `weaponRules.swap` flag: P9b. Leave `swap` flagged and its note as it is.
- **The wear die's names**, unless PQ2 says otherwise.
- **Moving an existing character** to Magical being (PQ5).
- **W100** (meters or feet), **W69** (worn modifiers), and any change to `onlyFor`.
- **The Razorwhip's numbers** (PQ3's default).

## 8. The shape

Data only, plus one placeholder string in `wizard.js`:

1. `weaponTagGlossary`: Anti-Materiel and Reach, per §5.
2. `weaponModGlossary`: Scope and Angel Mod, per §5 and PQ1.
3. `skillCheckRules.difficulties`: Easy / Average / Challenging.
4. `classifications`: Magical being (PQ4); Other's description.
5. The tag comment (~3580).
6. `wizard.js` ~465: the placeholder.
7. `gamedataVersion` per §2.

## 9. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. A row you can't make pass as written is a *Stop and ask*. Ruling tests in `rules.test.mjs` name the ruling: "Deighton's ruling (2026-10-10, Q…): …".

| Test name | File | Setup → result |
|---|---|---|
| `P9a 1: Anti-Materiel and Reach read as rules, with no note` | engine | `glossary("Anti-Materiel")` and `glossary("Reach")`: `note` null, the entries unflagged, and Anti-Materiel's text matches `/vehicle armor/`. |
| `P9a 2: a shotgun still takes neither the Scope nor the Angel Mod, and says why` | rules (Q8) | SG-88: both options `ok:false`, as on `main`. Each description matches `/shotgun/i`, and both mods are unflagged. (The refusals pass on `main`; the descriptions fail.) |
| `P9a 3: the skill-check tiers are Easy, Average and Challenging` | rules (Q33) | `skillCheckRules.difficulties` deep-equals `{ Easy:10, Average:15, Challenging:20 }`. |
| `P9a 4: a Magical being buys the Universal Advantages only` | rules (Q31) | A write-in with `classification: "magical-being"`: for every Advantage, `canBuyAdvantage` agrees with a write-in classed `supernatural`, and 15 are open. |
| `P9a 5: a Magical being says what it is in its own words` | engine | That character with empty `classificationText`: `validate` warns `Say what Magical being means for you`. With "Fae": no warning. |
| `P9a 6: the write-in offers four classifications, and Magical being hides what it can't buy` | smoke-wizard | The write-in step shows four cards. Picking Magical being shows the "in your words" field with the placeholder "In a word or two", and the Advantage step heads its list "15 open to Magical beings", open ones first (Decision 152's gating, no new code). |
| `P9a 7: How a check works reads Easy, Average and Challenging` | smoke-sheet (skills) | The *How a check works* chips read "Easy 10", "Average 15", "Challenging 20". |
| `P9a 8: the Reach tip has no unsettled note` | smoke-sheet (play) | Open the Razorwhip's Reach tag tip: no `.tip-note`, and no "isn't written yet". |

## 10. Tests beyond §9

- **The vacuous guard** (§5): rewritten over a `withData` flagged entry. **Mutation-test it:** drop the synthetic entry's `playerNote` and the guard must fail.
- **Voice:** the two tag descriptions, the mod sentences, Magical being's and Other's descriptions, and the placeholder all pass `voice.test.mjs`.
- **CRB conformance:** no test pins a mod's description against `0460` (grep `tests/` for `Compatible with rifles` and `weaponModGlossary`: none). If one turns up, it is an **expected break**: let it allow the ruling's sentence after the book's text, and say so in the PR.
- **Mutants, each of which must fail a test** (list them in the PR and the log):
  1. Re-add `playerNote` to Reach (P9a 1, P9a 8).
  2. Magical being with `advantages: "all"` (P9a 4).
  3. `writeIn` dropped from Magical being (P9a 5).
  4. The `difficulties` keys back to lowercase (P9a 3, P9a 7).
  5. Other's description back to "Neither one" (add an assertion to P9a 6).

## 11. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals.
2. Write §9's rows. Run them on `main`'s code and keep the output.
3. Data §8, and the placeholder. `npm run test:fast`.
4. **Run it in the dev preview** (`shadows-dev-preview`):
   - the write-in step with Magical being, at phone width too;
   - a shotgun's mod list;
   - the Reach tip;
   - *How a check works*.

   Screenshots if you can attach them; if not, say what you saw.
5. Docs: close F26, F30 and F31; W53 to `wishes-granted.md`; W104 trimmed to F34; `crb-catch-up.md`; CHANGELOG plus `npm run changelog`; versions per §2.
6. `npm run verify` and `npm run phone-check`.

## 12. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two.
- **Any code change beyond the placeholder.** Adding a classification is meant to need none.
- A test outside these **expected breaks** fails:
  - the three F26-citing tests (re-cite only);
  - the vacuous guard (rewrite);
  - a CRB conformance test on a mod's description (§10);
  - any test asserting Anti-Materiel's or Reach's old text or note.
- A classification id other than `magical-being` seems better. Ids are forever.

## 13. Close-out and review checklist

**Close-out:** the close-the-session skill, Content tier. That covers:
- the three closed flags (three edits each);
- the log entry: the three *Revisit if*s from §2, and the mutants;
- `shipped.md`'s row;
- W53 to `wishes-granted.md`, and W104 left with F34;
- CHANGELOG plus `npm run changelog`;
- versions per §2;
- the plan's P9a row;
- STATE (§3's Gear row; W53 built).

Suggested CHANGELOG lines (player voice):

- **A new classification: Magical being.** The fae and their kind. It buys the Universal Advantages only, like a Supernatural.
- **Anti-Materiel and Reach say what they do.** Anti-Materiel goes through vehicle armor; Reach marks a weapon that reaches unusually far.
- **A shotgun's Scope and Angel Mod say why they don't fit.**
- **Skill checks read Easy, Average and Challenging.**

**Review checklist:**

- [ ] §9's eight tests exist with those names, and the PR shows them run on `main` (row 2's refusals passing, and said).
- [ ] §5's rows are each confirmed or corrected in the PR.
- [ ] No code change but the placeholder (`git diff origin/main -- src/engine src/ui` shows one line).
- [ ] F26, F30 and F31 closed in all three places; no `flagged` left on the four entries; `swap` still flagged.
- [ ] The vacuous guard still guards (its mutant fails).
- [ ] The dev-preview run happened (§11.4).
- [ ] Mutants in the PR **and** the log.
- [ ] `npm run verify` and `phone-check` green; versions per §2, and the PR says which case.

## 14. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P09a-gear-text.md`, `<id>` = **P9a**, and these traps under the builder's:

> Five things in this order are easy to get wrong:
>
> 1. **No code change except the placeholder.** Magical being works because every reader keys on `advantages` and `writeIn`, never on an id. If you find yourself writing `"magical-being"` in `src/`, stop.
> 2. **Two places count the classifications:** Other's "Neither one" and the "Magical being" placeholder. Both change, or the wizard contradicts itself.
> 3. **A guard goes vacuous.** The flagged-tag test loops over flagged tags, and after this there are none. Rewrite it so it still fails on a flagged tag with no `playerNote`, and mutation-test it.
> 4. **The skill-check tiers rename; the wear die doesn't** (PQ2, unless Ken says otherwise). They're different scales from different chapters.
> 5. **`swap` stays flagged.** F34 is P9b. Close three flags, not four.
>
> Tier: Content. No numbered decision; the log carries the three *Revisit if*s (§2). Versions per §2. Use the close-the-session skill at the end.
