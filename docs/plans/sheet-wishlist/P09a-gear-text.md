# Work order P9a: Gear text, difficulty names, and the Magical being

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** **W104** without F34, and **W53** (`WISHLIST.md`). Closes **F26, F30, F31**. Opens no flag.

**Split (Ken, 2026-10-15):** P9 became P9a, this order, and **P9b**. P9b is F34, partly spent magazines kept with their count. It is a save shape, ordered after P9a merges.

**Status:** **drafted 2026-10-15 by Claude (Opus)**. Pre-flighted against `main` at `a1198c0` (#183 merged; P8a and P8b in; 0.44.0 unreleased). **Ken answered PQ1–PQ5 on 2026-10-15** (§4):
- PQ2, PQ4 and PQ5 take their defaults.
- PQ1 takes the alternative: a data shape, "if it means a better app overall".
- PQ3 takes the alternative: the Razorwhip reaches 2m, and the CRB follows.

**Built 2026-10-15** (Decision 221; app 0.45.0 and game data 0.38, since 0.44.0 and data 0.37 had been released first).

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P9a build** (Sonnet) and, once the PR is open, a fresh reviewer (Opus).

**Carried over from P8b's review:**
- **The order's miss.** The sweep listed where the HP pill's number shows from memory. It missed two places that show the same number: the popover the pill opens, and the pinned drawer that hides the pill. **Applied here:** every row of §5 was found by grepping the field's readers. Three turned up that a topic read wouldn't have found:
  - Other's "Neither one".
  - A guard that goes vacuous.
  - A smoke test that uses Reach as its example of a flagged tag.
- **The build's slips.** None.

**What P9a is.** Deighton ruled on the gear questions and two naming ones (`reference/rulings-2026-10-10.md` Q8–Q10, Q31, Q33):

- **F26:** a shotgun takes neither the Scope nor the Angel Mod. The stub stands and the flag closes. **The refusal now says why**, from the data (PQ1). This is the order's one shape change and its one decision.
- **F30:** Anti-Materiel does nothing extra to a person. It means vehicle armor doesn't stop the weapon.
- **F31:** the Reach column is how far the weapon reaches. The tag marks an unusual reach and adds nothing. **The Razorwhip's reach goes from 1m to 2m** (PQ3: Deighton's "5 or 6 feet" for the mono-whip), ahead of the CRB.
- **Difficulty names:** the skill-check tiers are **Easy / Average / Challenging** (10 / 15 / 20). The wear die keeps the GM Workshop's names (PQ2).
- **W53:** a **Magical being** classification, which buys Universal Advantages only, like a Supernatural.

**Probes against `main`** (`a1198c0`):

```
glossary("Reach").note           "What the tag adds beyond that number isn't written yet. Your GM rules on it."
glossary("Anti-Materiel").text   "…no separate personal-combat effect is defined yet."   ← maintainer-ish
razorwhip reach                  "1m" (as CRB 0460 line 303 prints it), with the Reach tag
skillCheckRules.difficulties     {"easy":10,"medium":15,"hard":20}   ← "How a check works" reads "easy 10 medium 15 hard 20"
classifications                  mortal:all, supernatural:universal, other:all
a write-in, each classification  mortal 57 Advantages open · supernatural 15 · other 57
shotgun (SG-88, 2 slots), Scope  ok:false, why "Doesn't fit SG-88 \"Siege Breaker\"."
                                 ← Deighton: "shotguns are a rifle", and the Scope's description says it fits rifles: nothing says why not
```

---

## 1. Goal

When P9a is merged:

1. **A shotgun's mod list says why.** On the SG-88, the Scope reads "Scope (1 slot) — Shotguns don't take scopes.", and the Angel Mod gives its own reason. Any mod the data gives a reason for, `onlyFor` or `notFor`, says it the same way. The rest read as today.
2. **Anti-Materiel and Reach read as rules.** Their tips say what the tag does, with no "isn't written yet" note. The Razorwhip reaches 2m.
3. **The skill-check tiers read Easy / Average / Challenging.**
4. **A written-in archetype can be a Magical being.** It buys Universal Advantages only, and says what it is in the player's own words.
5. **F26, F30 and F31 are closed** (three edits each). W53 moves to `wishes-granted.md`. W104 stays open with F34 alone for P9b.

## 2. Tier, versions, numbers

**Tier: Rule or shape** (small). One new data key, `refusalText` on a weapon mod, is a data shape. That makes one numbered decision, **N** (the next free number on `origin/main` when you write it). Everything else is Content riding along: the closed flags, the Razorwhip's reach, the tier names and Magical being.

**No other decision.** Each ruling fills a rule the ledger already holds:
- Decision 152: classifications say `all` or `universal`.
- Decision 120: mods fit per `onlyFor` / `notFor`.
- Decision 136: a map's key is its display text.

Three **Revisit if**s fire, and none reopens. Say so in the log entry:
- **149** ("F34 or F26 is ruled"): F26's ruling keeps the stub, and F34 is P9b.
- **152** ("Deighton rules on Magical being"): `universal`, one of 152's two answers, so it gains one row.
- **153** (Magical being among its triggers): a classification row changes nothing about write-in archetypes.

**App version:**
- **0.44.0 still unreleased** (`CHANGELOG.md` heads `[Unreleased] — app 0.44.0`): no bump.
- **0.44.0 released:** `npm run bump -- 0.45.0` (minor: Magical being is a new option).

**Game data:**
- **0.37 unreleased:** no bump.
- **0.37 released:** `gamedataVersion` 0.38.

Say in the PR which case applied.

**Character schema:** no bump. `magical-being` is a new stored classification id, and it is **immutable from merge**. The field's shape doesn't move. **Table schema:** no bump.

## 3. The decision, drafted

Write this as Decision **N** in `SCHEMA.md` §4, with its INDEX §3 line under the topic Decision 120 is filed under.

```
N. **A weapon mod that doesn't fit a weapon's category can say why, from the data.**
     *2026-10-1x · Ken + Deighton + Claude · Touches: weaponModGlossary, refusalText, weaponModOptions, onlyFor, notFor, Scope, Angel Mod, Silencer, shotguns, mod list, F26*
     - **Decided:** A mod may carry `refusalText`, a map from a weapon category id to a short reason. When the mod is refused for not fitting (its `onlyFor` leaves the weapon out, or its `notFor` names its category), `weaponModOptions` returns the reason for the weapon's category as `why`, in place of "Doesn't fit …" or "Doesn't go on …". With no entry for that category, the refusal reads as before. The Scope's and the Angel Mod's carry Deighton's reasons for shotguns (F26 closed).
     - **Why:** Deighton's ruling (2026-10-10, Q8) keeps shotguns out "because" of something. The Scope's text says it fits rifles, and Deighton calls a shotgun a rifle, so a bare refusal reads as a bug. The reason belongs where the player is refused, not in a description every weapon shows (Ken).
     - **Rejected:** a sentence added to each mod's description (shown on every weapon, and it edits the book's text); one string per mod (it would tell a handgun that shotguns don't take scopes); a reason per weapon id (Gear's rules are by kind of weapon).
     - **Replaces:** nothing. It adds to Decision 120's fit data.
     - **Revisit if:** a refusal needs a reason by weapon rather than by category, or another kind of refusal (slots, already installed) wants data text.
     - **Built:** app …, game data …, no schema change, PR #…. Log 2026-10-1x (P9a).
```

## 4. Questions for Ken (answered)

| Id | Question | Answer |
|---|---|---|
| PQ1 | **Where a shotgun's "why not" goes.** | **Ken, 2026-10-15: the alternative** ("okay with a data shape update if it means a better app"). The refusal says why, from data. **Refined at pre-flight:** a map keyed by weapon category, not one string, because the Scope's `onlyFor` also refuses handguns, and they shouldn't be told about shotguns. `notFor` refusals (the Silencer on a shotgun) use the same map. The descriptions stay the book's text. |
| PQ2 | **Does the armor-wear die rename too?** | **Ken: the default.** Skill checks only. The wear die keeps the GM Workshop's Easy / Medium / Hard / Legendary. |
| PQ3 | **The Razorwhip's reach.** | **Ken: the alternative.** 2m, following Deighton's "5 or 6 feet" for the mono-whip, rounded to the sheet's meters. **The CRB follows:** a `crb-catch-up.md` line for `0460`'s table. `private/crb/` is never edited here. |
| PQ4 | **Magical being's shape.** | **Ken: the default.** `{ "id": "magical-being", "name": "Magical being", "description": "Older than the city, or from somewhere beside it: the fae and their kind. Only the Universal Advantages are open to them.", "advantages": "universal", "writeIn": true }`, after Supernatural. **Mark the description for a voice pass.** |
| PQ5 | **Characters already written in as Other** with "Fae" or "Magical being". | **Ken: leave them.** A classification is fixed at lock. No migration, no notice. |

## 5. What this changes underneath (the assumption sweep)

Found by grepping the readers of each field (`playerNote`, `flagged`, `onlyFor`, `notFor`, `why`, `difficulties`, `classifications`, `classificationText`, `"Magical being"`, `razorwhip`, `data-term="Reach"`), not from memory. **Check each row yourself before you build**, and say in the PR if any is wrong. Two questions are asked of every row:
- **Which guards read a value this changes?**
- **Where does each new or removed note or name render?**

| Today | Where | After P9a |
|---|---|---|
| `weaponModOptions` refuses a misfit as `Doesn't go on ${category}.` (`notFor`) or `Doesn't fit ${name}.` (`onlyFor`) | `engine.js` ~1360–1361 | Both read `g.refusalText?.[def.category]` first, as a plain-object lookup that refuses junk (a non-object map, a non-string value: fall back). Slots and "Already installed" are unchanged. |
| The refusal renders in the mod select's disabled option (`… — ${why}`) and its `title` | `sheet.js` ~1768 | Unchanged code. It now shows the reason, so keep each reason short enough for an option. |
| **The data-key guard:** a data key nobody reads fails (Decision 135). A map keyed by ids must be listed in `MAPS`. | `engine.test.mjs` ~319 (`MAPS`), ~339 | Add `/^weaponModGlossary\[\]\.refusalText$/` to `MAPS`, with a comment: keyed by a weapon category id, read by `weaponModOptions`. |
| **The reference guard:** mod `onlyFor` and `notFor` categories are checked to exist | `engine.test.mjs` ~258–261 | Also check every `refusalText` key is a weapon category (`ref("weaponCategory", …)`). Mutation-test it with a misspelt key. |
| `Scope` and `Angel Mod` carry `flagged`, `flagNote` and `playerNote` (F26) | data ~3643, ~3646 | All three go. Each gains `refusalText`:<br>• Scope: `{ "shotguns": "Shotguns don't take scopes." }`<br>• Angel Mod: `{ "shotguns": "Angel Rounds need a box magazine with a power cell." }`<br>Descriptions unchanged; `onlyFor` unchanged. |
| An installed flagged mod draws its note on Loadout | `sheet.js` ~1769 | Draws nothing for these two. No code change. |
| The Silencer's `notFor` (shotguns, heavy weapons) refuses generically | data, the Silencer | **Unchanged.** Gear gives no reason and Deighton wasn't asked. The map is there if one comes. |
| `Anti-Materiel` and `Reach` carry `flagged`, `flagNote` and `playerNote`. Anti-Materiel's description says "no separate personal-combat effect is defined yet". | data ~3615–3616 | All three keys go. New descriptions, in tool voice:<br>• **Anti-Materiel:** "Vehicle armor doesn't stop it, so it deals full damage to vehicles. Against a person it's the weapon's AP and damage that count, nothing extra."<br>• **Reach:** "The weapon reaches as far as its Reach column says. The tag marks a reach that's unusual for its kind; it adds nothing to the number." |
| The tags' notes render as a tip's note | `engine.js` ~1412 (`glossary` → `note`); `shared.js` ~559; the GM Reference's tags panel | `note` is `null`, and the tip draws no note line. **Check that the GM Reference's tags panel still draws both.** |
| **Guard 1 goes vacuous:** "a flagged tag reads as something a player can use, not a note to us (F30–F31)" loops over flagged tags, and none are left | `engine.test.mjs` ~2467 | Run it over a synthetic flagged entry via `withData` (as ~6095 does), so it still fails on a flagged tag with no `playerNote`. Rename it so it no longer cites F30–F31. Mutation-test it. |
| **Guard 2 loses its example:** "a tag on Main reads out on a tap, with a flagged tag's player note, …" taps the Razorwhip's **Reach** and expects "GM rules on it" | `smoke-sheet-skills.test.mjs` ~603–616 | The tap-and-Esc behaviour stays tested on AP. Split out the flagged-note half: flag a tag in the booted app's data before rendering (`app.window.eval` on `SHADOWS_DATA`, or the smokekit's equivalent), so it still proves a flagged tag shows its note. Mutation-test it. If the smokekit can't seed data before render, that's a *Stop and ask*. |
| The data comment on tags says Anti-Materiel and Reach are "carried here with `flagged: true`" | data ~3580–3586 | Rewrite: they're defined by Deighton's rulings of 2026-10-10. |
| Three tests cite "F26's stub" | `engine.test.mjs` ~2174, ~2211, ~2218 | Re-cite the ruling (Q8). Assertions unchanged. |
| Razorwhip `"reach": "1m"` | data ~3689 | `"2m"`. Readers: `weaponLine` (~1392) and the catalog line (~2867), both display only. No test pins it (grep: `rules.test.mjs` ~1425 is the Ancient Weapon template). Its `flavorLine` and `description` say nothing about length; check. |
| `skillCheckRules.difficulties` is `{ "easy":10, "medium":15, "hard":20 }`. A key is its display text (Decision 136; `MAPS`). | data ~309–313 | `{ "Easy":10, "Average":15, "Challenging":20 }`. Its one reader is `checkRulesHtml` (`sheet.js` ~441, `esc(k)`). No code or test reads a key by name. |
| The quick reference's check table already reads "10 (Easy) · 15 (Average) · 20 (Challenging)" | data ~4307 | Unchanged. |
| The wear die (`integrityLossByDifficulty`) | data ~3766, and its readers | **Unchanged** (PQ2). |
| `classifications` has three rows | data (`classifications`) | Four, with `magical-being` after Supernatural. Readers, all by `advantages` or `writeIn`, never by id:<br>• `classification` / `canBuyAdvantage` (`engine.js` ~111–125);<br>• the wizard's gating, `wizard.js` ~536, ~560, whose summary is `${openCount} open to ${cls.name}s` → "15 open to Magical beings";<br>• `validate`'s write-in warning, ~3971;<br>• Admin's "in their words" field, `sheet.js` ~1614;<br>• `writeInOptions`;<br>• the wizard's cards, `wizard.js` ~461, an `auto-fill` grid (`shadows.css` ~139), so four wrap. Check phone width;<br>• `engine.test.mjs` ~82–88 loops the rows: passes.<br>**Zero code changes.** |
| **Other's description says "Neither one, or something the city has no word for."** It counts two. | data (`classifications`, `other`) | "None of these, or something the city has no word for. Every Advantage is open to them." |
| **The write-in's classification placeholder is "Magical being"** | `wizard.js` ~465 | Now a classification of its own; the field shows for both. The placeholder becomes "In a word or two". |
| SCHEMA §3's comment gives `"Magical being"` as a `classificationText` example | `SCHEMA.md` ~761 | `"Fae"`. |
| Changelog history ("Every archetype is Mortal or Supernatural") | `shadows-changelog.js` ~180 | Unchanged: a past release's notes. |
| F26, F30, F31: §5 rows, INDEX §2 lines; `crb-catch-up.md` ~24, ~117, ~200 | docs | Closed (three edits each). Line ~200: strike them as P8b did F24 and F36. Line ~117: "*The sheet has this built (P9a)*", plus **a new line for the book: the Razorwhip's Reach in 0460's table goes 1m → 2m** (Ken updates the CRB; the mirror follows). Line ~24: the same for the skill checks. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `WISHLIST.md` W104 and W53; `reference/rulings-2026-10-10.md` Q8–Q10, Q31, Q33.
- `SCHEMA.md` §4: Decisions **120** (mods; `onlyFor`, `notFor`), **135** (data keys are read or named), **136** (map keys are display text), **149** (its *Revisit if*), **152** (classifications), **153** (write-in archetypes). §5's F26, F30 and F31 rows.
- `src/data/shadows-data.js`: `weaponTagGlossary` (~3577–3620), `weaponModGlossary` (~3640–3650), the Razorwhip (~3689), `skillCheckRules` (~305), `classifications`.
- `src/engine/engine.js`: `weaponModOptions` (~1350), `glossary` (~1403), `classification` / `canBuyAdvantage` (~111–125), `validate`'s write-in (~3965).
- `src/ui/sheet.js`: `weaponModsHtml` (~1760), `checkRulesHtml` (~440). `src/ui/wizard.js` `writeInHtml` (~451).
- `tests/engine.test.mjs` `MAPS` (~319) and the reference check (~258); `tests/smoke-sheet-skills.test.mjs` ~603.

## 7. Out of scope

- **F34** and the `weaponRules.swap` flag: P9b. Leave `swap` flagged.
- **The wear die's names** (PQ2).
- **A reason for the Silencer**, or for any refusal other than fit.
- **Moving an existing character** to Magical being (PQ5).
- **Any other weapon's reach**, **W100** (meters or feet), and **W69**.

## 8. The shape

**Data:**
1. `weaponModGlossary`: Scope and Angel Mod unflagged, each with `refusalText` (§5).
2. `weaponTagGlossary`: Anti-Materiel and Reach (§5), and the tag comment (~3580).
3. The Razorwhip's `reach`: `"2m"`.
4. `skillCheckRules.difficulties`: Easy / Average / Challenging.
5. `classifications`: Magical being (PQ4); Other's description.
6. `gamedataVersion` per §2.

**Engine:**
1. `weaponModOptions`: the two fit refusals read `refusalText[def.category]` when it's a non-empty string, and fall back otherwise. Total: a junk `refusalText` (a string, an array, null) falls back, never throws.

**UI:**
1. `wizard.js` ~465: the placeholder.

Nothing else in `src/ui/`.

## 9. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. A row you can't make pass as written is a *Stop and ask*. Ruling tests in `rules.test.mjs` name the ruling: "Deighton's ruling (2026-10-10, Q…): …".

| Test name | File | Setup → result |
|---|---|---|
| `P9a 1: a shotgun refuses the Scope and the Angel Mod, and says why` | rules (Q8) | SG-88: the Scope's option is `ok:false`, `why` "Shotguns don't take scopes."; the Angel Mod's `why` is its reason. Both unflagged. |
| `P9a 2: a refusal with no reason for that kind of weapon reads as before` | engine | A handgun's Scope: `why` "Doesn't fit …" (the handgun's name). The Silencer on the SG-88: "Doesn't go on Shotguns." (or the category's name). With `withData`, a `notFor` mod given `refusalText` for that category returns it. A junk `refusalText` (`"x"`, `[]`, `null`) falls back. |
| `P9a 3: Anti-Materiel and Reach read as rules, with no note` | engine | `glossary("Anti-Materiel")` and `glossary("Reach")`: `note` null, unflagged, and Anti-Materiel's text matches `/vehicle armor/`. |
| `P9a 4: the Razorwhip reaches 2m` | rules (Q10) | `weaponLine` for a held Razorwhip reads `reach` "2m"; it keeps the Reach tag. |
| `P9a 5: the skill-check tiers are Easy, Average and Challenging` | rules (Q33) | `skillCheckRules.difficulties` deep-equals `{ Easy:10, Average:15, Challenging:20 }`. |
| `P9a 6: a Magical being buys the Universal Advantages only` | rules (Q31) | A write-in classed `magical-being`: for every Advantage, `canBuyAdvantage` agrees with one classed `supernatural`, and 15 are open. |
| `P9a 7: a Magical being says what it is in its own words` | engine | Empty `classificationText`: `validate` warns `Say what Magical being means for you`. With "Fae": no warning. |
| `P9a 8: the write-in offers four classifications, and Magical being opens the Universal ones first` | smoke-wizard | Four cards. Picking Magical being shows the "in your words" field with placeholder "In a word or two", and the Advantage list's summary reads "15 open to Magical beings". Other's card doesn't say "Neither one". |
| `P9a 9: the SG-88's mod list says why the Scope won't go on` | smoke-sheet (play) | Loadout with an SG-88: the mod select's disabled Scope option reads "Shotguns don't take scopes." |
| `P9a 10: How a check works reads Easy, Average and Challenging` | smoke-sheet (skills) | The chips read "Easy 10", "Average 15", "Challenging 20". |
| `P9a 11: the Reach tip has no unsettled note` | smoke-sheet (skills) | The Razorwhip's Reach tip: no `.tip-note`, no "isn't written yet". |

## 10. Tests beyond §9

- **Guards 1 and 2** (§5): rewritten so each still fails when a flagged entry has no note, or when its note doesn't show. Mutation-test both.
- **`MAPS` and the reference check** for `refusalText` (§5). Mutation-test the reference check with a misspelt category key.
- **Totality:** the degenerate-character loop (`engine.test.mjs` ~1428) runs `weaponModOptions` on a weapon whose mod has a junk `refusalText` (via `withData`).
- **Voice:** both reasons, both tag descriptions, Magical being's and Other's descriptions, and the placeholder pass `voice.test.mjs`.
- **Mutants, each of which must fail a test** (list them in the PR and the log):
  1. `refusalText` ignored (P9a 1, P9a 9).
  2. `refusalText` read without the category (one string for every weapon) (P9a 2).
  3. Re-add `playerNote` to Reach (P9a 3, P9a 11).
  4. The Razorwhip back to 1m (P9a 4).
  5. The `difficulties` keys back to lowercase (P9a 5, P9a 10).
  6. Magical being with `advantages: "all"` (P9a 6).
  7. `writeIn` dropped from Magical being (P9a 7).
  8. Other's description back to "Neither one" (P9a 8).

## 11. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals.
2. Write §9's rows. Run them on `main`'s code and keep the output.
3. Data §8, engine §8, and the placeholder. `npm run test:fast`.
4. **Run it in the dev preview** (`shadows-dev-preview`):
   - an SG-88's mod list;
   - the Razorwhip's line and its Reach tip;
   - *How a check works*;
   - the write-in step with Magical being, at phone width too.

   Screenshots if you can attach them; if not, say what you saw.
5. Docs:
   - Decision N, with its INDEX line.
   - Close F26, F30 and F31.
   - W53 to `wishes-granted.md`; W104 trimmed to F34.
   - `crb-catch-up.md`, including the Razorwhip line.
   - SCHEMA §2 if it documents a mod's keys (add `refusalText`).
   - CHANGELOG plus `npm run changelog`; versions per §2.
6. `npm run verify` and `npm run phone-check`.

## 12. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two.
- **Any code change beyond `weaponModOptions` and the placeholder.** Magical being and the rest are meant to need none.
- The smokekit can't seed data before render (guard 2, §5).
- A test outside these **expected breaks** fails:
  - the three F26-citing tests (re-cite only);
  - guards 1 and 2 (rewrite, §5);
  - the data-key guard until `refusalText` is in `MAPS`;
  - any test asserting Anti-Materiel's, Reach's or a mod's old flag, note or text;
  - an SG-88 refusal asserting "Doesn't fit".
- A classification id other than `magical-being` seems better. Ids are forever.

## 13. Close-out and review checklist

**Close-out:** the close-the-session skill, *Rule or shape* tier. That covers:
- Decision N and its INDEX line;
- the three closed flags;
- the log entry: the three *Revisit if*s from §2, the mutants, and the CRB departure for the Razorwhip;
- `shipped.md`'s row;
- W53 to `wishes-granted.md`, and W104 left with F34;
- CHANGELOG plus `npm run changelog`;
- versions per §2;
- the plan's P9a row;
- STATE rewritten (§3's Gear row; W53 built).

Suggested CHANGELOG lines (player voice):

- **A new classification: Magical being.** The fae and their kind. It buys the Universal Advantages only, like a Supernatural.
- **A mod that won't go on a weapon says why.** A shotgun doesn't take a Scope or an Angel Mod, and now it tells you the reason.
- **Anti-Materiel and Reach say what they do.** Anti-Materiel goes through vehicle armor; Reach marks a weapon that reaches unusually far. The Razorwhip reaches 2m.
- **Skill checks read Easy, Average and Challenging.**

**Review checklist:**

- [ ] §9's eleven tests exist with those names, and the PR shows them run on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR.
- [ ] Code changes only in `weaponModOptions` and the placeholder (`git diff origin/main -- src/engine src/ui`).
- [ ] Decision N's shape passes `docs.test.mjs`; *Replaces: nothing* checked against 120's text.
- [ ] F26, F30 and F31 closed in all three places; `swap` still flagged.
- [ ] Guards 1 and 2 still guard (their mutants fail); `refusalText` is in `MAPS` and the reference check.
- [ ] The Razorwhip's CRB line is in `crb-catch-up.md`.
- [ ] The dev-preview run happened (§11.4).
- [ ] Mutants in the PR **and** the log.
- [ ] `npm run verify` and `phone-check` green; versions per §2, and the PR says which case.

## 14. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P09a-gear-text.md`, `<id>` = **P9a**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **`refusalText` is a map by weapon category, not a string.** The Scope's `onlyFor` refuses handguns too, and a handgun must not be told about shotguns. It serves `notFor` refusals as well, and falls back to today's wording when there's no entry.
> 2. **No other code change.** Magical being works because every reader keys on `advantages` and `writeIn`. If you write `"magical-being"` in `src/`, stop.
> 3. **Two places count the classifications:** Other's "Neither one" and the "Magical being" placeholder. Both change.
> 4. **Two guards lose their subject.** The flagged-tag engine test and the Reach smoke test each lean on a flag this order closes. Keep both guarding a synthetic flag, and mutation-test them.
> 5. **The skill-check tiers rename; the wear die doesn't** (PQ2).
> 6. **`swap` stays flagged.** F34 is P9b. Close three flags, not four. **The Razorwhip goes to 2m ahead of the book**, and `crb-catch-up.md` says so.
>
> Tier: Rule or shape (small). One numbered decision, the next free. No schema bump. Versions per §2. Use the close-the-session skill at the end.
