<!--
Title: name the batch and its ids, in the imperative or as a summary of
what's now true, e.g.
  P16: the Character tab's layout, a row per section (W99, W60; Decision 246)
  fix(ui): render aberrations once (A1)

Write the body for Ken. The view from 50,000 feet comes first: what is now
true and why, then the evidence, then anything he has to decide. Rules
belong in CLAUDE.md; this template only points to them. Delete a section
only where it says you may. "None" is a fine answer.
-->

**The 50,000-foot view.** <!-- Two to five sentences: what is true after this merges that wasn't before, and why. Name the plan, the work order, the W, finding (A1) or flag (F8) ids it closes, and the decisions it numbers or supersedes. -->

**Tier:** Docs / Fix / Content / Rule or shape <!-- keep one: the batch's highest tier, from CLAUDE.md, "Change tiers" -->
**Versions:** <!-- what moved and to what, e.g. "app 0.54.1 → 0.54.2; no data or schema bump". Say "none" for a Docs change. Table and pack schemas count. -->

## What changed

<!-- What a player, a GM or the next session will notice, grouped by area. Write behaviour, not a list of files. Say when something ships switched off (FEATURES). -->

## Evidence

<!--
Every claim about how the code behaves names the command or test that shows it.
A claim with no evidence will come back as a review finding.
- `npm run verify`: N tests, 0 fail, N todo (the todo count matches STATE).
  If something couldn't run, say what and why, e.g. "no access to the private
  CRB mirror, so CI is the gate".
- The new tests, by name, and how each failed on `main`.
- Each new guard, mutation-tested: the mutant and the test that killed it.
- For anything a player sees: what you checked in the dev preview
  (`shadows-dev-preview`) or with `npm run phone-check`.
-->

## Where the order didn't fit

<!-- Only for a work order. Where the order, the code and the ledger disagreed, and what you built. "Nothing" is fine. If this PR has no work order, delete this section. -->

## For Ken

<!--
Anything only Ken (or Deighton, through Ken) can settle, each with your recommendation:
a choice the order didn't cover, new player-facing strings for a voice pass
(quote them as they render), a rules question that became a flag (F-number),
an approval this needs. "Nothing" is fine.
-->

## Not done

<!-- Anything left out on purpose, and where it went: a W id in WISHLIST.md, a flag, a follow-up order. "Nothing" is fine. -->

## Close-out

<!-- Tick what the tier requires, and strike through or delete the rest. CLAUDE.md "Change tiers" is the rule, and the close-the-session skill walks it. -->

- [ ] `npm run verify` passes (or the Evidence section says what couldn't run, and why)
- [ ] **Fix, if a player can see it:** a `CHANGELOG.md` line in player voice, `npm run changelog`, and `npm run bump`
- [ ] **Fix:** the finding's status in `docs/INDEX.md` §2
- [ ] **Content:** `gamedataVersion` per Decision 68, a closed flag's three edits, and an entry in `docs/log/2026.md`
- [ ] **Rule or shape:** proposed to Ken first, a numbered decision with its INDEX line and supersession marks, a schema bump and migrate step if a saved file's shape moved, and STATE rewritten
- [ ] A row in `docs/log/shipped.md` for the batch
- [ ] Ideas that came up and weren't done went to `docs/WISHLIST.md`
