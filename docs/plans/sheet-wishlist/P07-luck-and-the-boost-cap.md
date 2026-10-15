# Work order P7: Luck and the Max Character Point Boost

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W65, W66**
(`WISHLIST.md`). Decisions 2, 3, 5, 68, 157 and 215.
**Status:** **drafted 2026-10-14 by Claude (Opus)**, pre-flighted against
`main` after #173 (P6 merged, 0.43.0 unreleased). **Approved by Ken
2026-10-14, PQ1–PQ3 on their defaults** (§4); ready to build.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone, and is small.** It touches `engine.js` (`canBoost`,
`spendable`, `validate`), `wizard.js` (the Campaign Power Level chips, the Luck
row, the Boosts heading, the Luck stepper), one `sheet.js` line, one data note,
the tests, and the docs. Nothing in `gm.js` or `private/`. No schema bump.

**What P7 is.** Two wishes about the same row of the CP step:

- **W65: Luck bought with CP counts against the cap.** Today a player can put
  any number of CP into Luck at creation. Decision 5 made it "exempt from Max
  Boost", and the wizard's Luck row says so. **Ken's ruling, confirmed by
  Deighton on 2026-10-04:** Luck is capped like every other target, so a Street
  Level character buys at most 2 Luck with CP (2 / 3 / 4 / 5 by level, the same
  `powerLevels[].maxBoost`). Only bought Luck counts. The 4 everyone starts with
  sits outside the cap.
- **W66: "Max Boost" becomes "Max Character Point Boost"**, Ken's name for it,
  in every place a player reads it. **Ids and keys stay** (`maxBoost`,
  `creation.boosts`, `luck|x`, constraint 6).

**What the book says, so nobody goes looking.** CRB v4 doesn't print a Max
Boost column at all. `0300` says only "Everyone walks into NYTE City with 4
Luck. More costs 1 Character Point during character creation." The cap is
the app's (Decision 3, from REF_CRB v3.5's "Max Freebie Boost"), and getting
it into the book is on Ken's list in `plans/crb-catch-up.md`. Two of that
list's lines still say Luck is exempt, and this session fixes them (§7d).
Pin the rule as Ken's and Deighton's ruling, never as the CRB's words.

---

## 1. Goal

When P7 is merged:

1. **The Luck stepper stops at the cap.** On a Street Level character, + is
   off after 2 Luck bought (LUCK 6), and its reason says why. At World Coming
   Down it stops after 5 (LUCK 9). − always works.
2. **One rule, one place.** `canBoost(ch, "luck")` answers for Luck, as it
   does for a stat or a skill. The wizard's stepper and `spendable("cp")` ask
   it. Nothing else re-derives the cap.
3. **An unlocked character over the cap can't lock** (PQ1). This happens with
   an old draft, or after the player lowers the Campaign Power Level on step 1.
   `validate` names it on the CP step, and − fixes it in one tap. Per PQ2, a stat
   or skill boosted past the cap the same way is named too.
4. **A locked character is never touched.** A saved file with more bought Luck
   than its level allows loads exactly as it is. Its LUCK stays the same, and
   neither `migrate()` nor `versionCheck` mentions it. Decision 157's
   "a character keeps the points it paid for" stands for locked files.
5. **Admin's LUCK bonus is unchanged.** It writes the same field
   (`trackers.luck.bonus`), but Admin bypasses caps by design. The cap is a
   creation rule, and the sheet never runs `validate`.
6. **Every "Max Boost" a player reads says "Max Character Point Boost"**, or
   PQ3's short form where space is tight. **"Boost the roll", the Luck spend,
   is a different Boost and doesn't change.**
7. **"Exempt" is gone**: from the Luck row, from `creationFlow` step 7's note,
   from SCHEMA §2's comment, and from `crb-catch-up.md`.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It reverses a numbered rule (Decision 5's
  exemption) and changes what a character can choose at creation. One numbered
  decision, **N** (the next free number on `origin/main` when you write it).
- **App and game data depend on whether 0.43.0 has shipped when you build.**
  - **0.43.0 still unreleased** (`CHANGELOG.md` still heads `[Unreleased] —
    app 0.43.0`): P7's lines go under that heading. **No app bump and no
    game-data bump.** P6 already moved both for this release, and no player
    has seen 0.36.
  - **0.43.0 released:** `npm run bump -- 0.43.1` (patch: a visible fix and a
    rename, no new capability), and `gamedataVersion` up one per Decision 68,
    since what a character can choose at creation moves.
  - Say which case applied in the PR.
- **Character schema: no bump.** No field is added, renamed or reshaped.
  `trackers.luck.bonus` keeps its meaning.
- **No flag** opens or closes. Deighton confirmed the ruling.

## 3. The decision, drafted

Write this as Decision **N** in `SCHEMA.md` §4, with its INDEX §3 line under
the topic Decision 5 is filed under, and mark what it replaces.

```
N. **Luck bought with CP counts against the Max Character Point Boost, and "Max Boost" is called that.**
     *2026-10-1x · Ken + Deighton + Claude · Touches: LUCK, trackers.luck.bonus, resources.luck.cpCostPerPoint, canBoost, spendable, validate, maxBoost, Max Boost, Max Character Point Boost, Boosts, creationFlow step 7, W65, W66*
     - **Decided:** At creation, each point of Luck bought with CP is one Boost of Luck, held to the Campaign Power Level's `maxBoost` like any stat or skill; the 4 everyone starts with is outside it. `canBoost(ch, "luck")` is the one place it's checked. An unlocked character over the cap can't lock until it's lowered; a locked file is never changed or reported. The cap's name, everywhere a player reads it, is Max Character Point Boost; keys stay `maxBoost` and `boosts`.
     - **Why:** Ken (2026-10-04), confirmed by Deighton: consistency is the right place to start, so Luck is capped like everything else.
     - **Rejected:** keeping Luck exempt (Decision 5: the one target with no throttle); counting the starting 4 against the cap (Ken: only CP spent counts); trimming a locked file's Luck to the cap (a file's paid-for points are never discarded, Decision 157); warning instead of blocking (PQ1); capping Admin's LUCK bonus (Admin bypasses caps); renaming `maxBoost` (constraint 6).
     - **Replaces:** Decision 2 in part (the name Max Boost). Decision 3 in part (Luck is a boosted target). Decision 5 in part (no longer exempt). Decision 157 in part (its "bought up to 5 becomes 7" holds only for a locked file or a level whose cap allows it).
     - **Revisit if:** playtests or player feedback say Luck should run free, or CRB v4 prints the table with different numbers.
     - **Built:** app …, game data …, no schema bump, PR #…, log 2026-10-1x.
```

Supersession marks: Decisions 2, 3, 5 and 157 each get
`→ **Superseded in part by Decision N**` with the clause, and their INDEX
lines `→ **superseded in part by N**`. **Decision 5 already carries a mark
(157):** `docs.test.mjs` reads only the first mark on an entry, so extend it
as P5 did with 153 ("Superseded in part by Decisions 157 and N"), in SCHEMA
and on its INDEX line. Decisions 2, 3 and 157 have none yet.

## 4. Questions for Ken

| Id | Question | Answer |
|---|---|---|
| PQ1 | **Over the cap on an unlocked character: block the lock, or warn?** W65 says warn. The only ways over are an old draft or lowering the Power Level after buying, and − fixes it in one tap. A warning lets a character lock with more Luck than the rule allows. A skill boosted past its starting cap already blocks ("It can start at N at most"). | **Ken, 2026-10-14: the default.** **Block** (an error on the CP step), like the skill cap. A locked file is never checked, so nothing loaded changes either way. |
| PQ2 | **Stats and skills over the cap.** `validate` never checks `creation.boosts` against `maxBoost` today: buy 4 Boosts of BOD at Shadows, drop to Street, and nothing says so. Same check, same session? | **Ken, 2026-10-14: the default.** **Yes.** It's the same rule and the same few lines; leaving it out means Luck is the only target the cap is enforced on after a level change. |
| PQ3 | **The short form.** The Campaign Power Level card's chips are short ("Skill cap 4", "Power cap 2", "CP 5", "Max Boost 2"). "Max Character Point Boost 2" is the longest chip by far on a phone, and the CP step's jump bar has a "Boosts" button. | **Ken, 2026-10-14: the default.** The **full name** in the Boosts heading, the Luck row, refusals, step 7's note and the sheet's Power Level note. **"Max CP Boost"** on the chip, beside the "CP" chip, and **"CP Boosts"** on the jump bar. `phone-check` decides if even that wraps. |

Not a question: **Admin's LUCK bonus** writes the same field as the wizard's
Luck buy. It stays uncapped (Admin bypasses caps and pools, `SCHEMA.md`'s
Admin entry), and since the cap is checked only by the wizard and `validate`,
a GM adding Luck in play is never refused or warned.

## 5. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `WISHLIST.md` W65 and W66.
- Decisions **2**, **3**, **5**, **157** (its *Rejected*: "Holding a bought
  total where it was"), **215** (the `spendable("cp")` power-term test), and
  **68** in `SCHEMA.md` §4. INDEX tells you where each one is.
- `src/engine/engine.js`:
  - `luckSpent`, `boostSpent`, `cp()` (~567–595);
  - `canBoost`, `addBoost` (~598–622): the model, and where Luck joins;
  - `luckState` (~1760): **not touched**;
  - `spendable`'s `cp` branch (~3851): its first term is
    `bal.left >= luck.cpCostPerPoint`, which has to learn the cap;
  - `validate("character-points")`: the `overCap` block (~3868) is where a
    boosted-past-the-cap line belongs.
- `src/ui/wizard.js`: the Power Level chips (~202), the Luck row and stepper
  (~585–592), the Boosts heading (~670), and the `luck` stepper handler
  (~1164).
- `src/ui/sheet.js` ~2148 (Admin's Power Level change note) and ~2228 (Admin's
  LUCK bonus: **leave it alone**).
- `src/data/shadows-data.js`: `creationFlow.steps` step 7's `note`, the
  `powerLevels` comment (~322) and `creationFlow`'s comment (~4728).
- `docs/SCHEMA.md` §2's `cpCostPerPoint` comment (~118: "so Max Boost never
  applies").
- `docs/plans/crb-catch-up.md` lines ~38–40 and ~95.
- Tests that set `trackers.luck.bonus` straight to drain CP:
  `engine.test.mjs` (Decision 215's "a buy CP can't cover"), `smoke.test.mjs`
  (the custom power's "Out of CP", the vitals pills probe). `rules.test.mjs`'s
  Decision 157 test and Deighton's table test (`maxBoost` 2/3/4/5).

## 6. Out of scope

- **Luck in play**: spending it, refreshing it, Honed on Luck (P6's
  Adjustment), Admin's bonus. None of it moves.
- **Power ranks bought with CP.** Max Power Rank caps them (Decision 157), not
  Max Boost. Don't add them to the cap.
- **The book.** `crb-catch-up.md` gets its lines corrected. The CRB itself is
  Ken's to write.
- **Expert mode's boost count** (W95, P13).

## 7. The shape

### 7a. Engine

1. **`canBoost(ch, "luck", id)`**: when `type === "luck"`, `times` is
   `nonNegInt(ch.trackers.luck.bonus)` rather than `boostsFor`. The cap check is
   the existing one. The stat and skill branches don't run. The CP check
   compares `bal.left` with `D().resources.luck.cpCostPerPoint`, which is Luck's
   own price, not `boostRules.cpCostPerPoint`. Today both are 1; read the right key.
   The `id` is ignored for Luck. Pass `"LUCK"` for readability.
2. **The refusal's words** (PQ3, VOICE-APP tool voice):
   `Max Character Point Boost reached: ${n} each at ${levelName}.`
   Every target shares it, so a stat at the cap reads the same.
3. **`spendable("cp")`**: replace `bal.left >= luck.cpCostPerPoint` with
   `canBoost(ch, "luck", "LUCK").ok`. Without this, a Street character with 1
   CP left and Luck at its cap is told "CP left to spend" forever.
4. **`validate("character-points")`** (PQ1, PQ2): for Luck, and for each
   `creation.boosts` row, when the count is over `pl.maxBoost`, add one line:
   `LUCK is bought up ${b}. Max Character Point Boost at ${levelName} is ${n}.`
   For a stat or skill: `${name} is boosted ${b} times. …`. It's an error, as
   PQ1 settled. Only an unlocked character is ever
   validated, so a locked file is untouched by construction. **Pin that**: a
   locked character over the cap gets nothing from `versionCheck`, and
   `migrate()` returns its `luck.bonus` unchanged.
5. Nothing in `luckState`, `luckSpent`, `cp()`, `migrate()` or `addBoost`
   changes.

### 7b. Data

1. Step 7's `note`: "…Leftover CP may boost powers, skills, or stats, up to a
   cap on each. LUCK buy-ups are exempt from that cap." becomes "…Leftover CP
   may buy LUCK or boost skills and stats, up to the Max Character Point Boost
   on each." Keep "Formerly 'Freebie Points'" if it's still there.
2. The `powerLevels` comment and `creationFlow`'s comment: say Luck is a
   boosted target (Decision N). Comments, so no bump of their own.
3. `gamedataVersion` only per §2.

### 7c. UI

1. **The Luck row** (`wizard.js` ~590): `1 CP/point · exempt from Max Boost`
   becomes `1 CP a point · up to ${n} (Max Character Point Boost)`. The
   stepper's + is enabled by `Engine.canBoost(ch, "luck", "LUCK").ok`, and its
   `title` is the refusal when off, as the stat steppers do.
2. **The chip** (~202): `Max Boost` becomes the PQ3 form.
3. **The Boosts heading** (~670): `Boosts — leftover CP on Stats & Skills · max
   ${n}× per target` becomes `Character Point Boosts — leftover CP on Stats &amp;
   Skills · up to ${n} each, LUCK included`. The first argument to
   `secs.sect`, `"Boosts"`, is **the jump bar's label** for the section, which
   a player reads too: it becomes the PQ3 short form's sibling, **"CP
   Boosts"**. `smoke.test.mjs`'s "no jump to Boosts" check (~1249) moves with
   it. That's the test following the rename, not a weakened guard.
4. **The sheet's Power Level note** (`sheet.js` ~2148): `(Max Skill/Power
   Rank, Max Boost)` becomes `(Max Skill Rank, Max Power Rank, Max Character
   Point Boost)`.
5. **The stepper handler** (`wizard.js` ~1164) stays as it is. The stepper's
   disabled state is the gate, as for stats (`addBoost` doesn't check either).
   Don't add a second copy of the cap there.
6. Grep `src/` for any other player-facing `Max Boost` or `Boosts` and list
   what you changed in the PR. **Leave the Luck spend alone**:
   `resources.luck.spend`'s "Boost the roll", Lucky's and Unlucky's "Boost now
   costs…", Lucky Charm and the vehicle line in the data are the dice Boost.

### 7d. Docs

1. Decision N and its four marks (§3).
2. `SCHEMA.md` §2's `cpCostPerPoint` comment: "bought on its own line, so Max
   Boost never applies" becomes "one Boost of LUCK a point, under the Max
   Character Point Boost (Decision N)".
3. `plans/crb-catch-up.md`: the Max Boost line (~38) uses the new name, the
   LUCK line (~39) says it counts against the cap, and the LUCK buy-up line
   (~95) drops "exempt from Max Boost". These are Ken's notes for the book,
   so word them as instructions, not as the app's behaviour.
4. W65 and W66 to `log/wishes-granted.md`; their WISHLIST entries go.

## 8. Worked examples (pin these)

| Character | Action | After |
|---|---|---|
| Street Level, unlocked, CP to spare | + LUCK three times | LUCK 6 after two; the third is refused, "Max Character Point Boost reached: 2 each at Street Level."; CP spent 2 |
| World Coming Down | + LUCK until refused | LUCK 9 (5 bought) |
| Heroic, LUCK bought 3 | change to Street on step 1, go to step 7 | LUCK still 7 (nothing trimmed); the CP step names it (PQ1: can't lock); − to 2 clears it |
| Shadows, BOD boosted 4 | change to Street | the CP step names BOD (PQ2) |
| Street, 1 CP left, Luck at its cap, every stat and skill at its cap or unaffordable | `spendable("cp")` | false |
| a locked Street character saved with `luck.bonus: 3` | load | LUCK 7; `migrate()` keeps 3; `versionCheck` silent |
| locked, any level | Admin LUCK bonus +1, past the cap | accepted, as today |
| any | read Lucky's description, the Luck spend buttons | still "Boost" (the dice Boost) |

## 9. Tests

- **Engine** (`engine.test.mjs`): §8's rows that need no browser, plus
  - for every level in `D.powerLevels` (no level id in code, Decision 135):
    Luck takes exactly `maxBoost` points, then `canBoost(ch, "luck")` refuses;
  - `canBoost` Luck reads `resources.luck.cpCostPerPoint`: set it to 3 in a
    cloned data copy, if the harness allows, or assert the key is the one read;
  - `spendable("cp")` with Luck capped and nothing else affordable is false;
  - `validate("character-points")` names Luck over the cap, and a stat boost
    over it (PQ2), as errors (PQ1);
  - a locked over-cap file: `migrate()` and `versionCheck` change nothing;
  - **Decision 215's test** drains CP by setting `luck.bonus` past any cap.
    It's about power ranks, not Luck. If the new check trips it, change how it
    drains CP (a disadvantage-free advantage spend, or `luck.bonus` within the
    cap plus advantages), never the guard. Same for the smoke tests that set
    `luck.bonus = 99`.
- **Rules** (`rules.test.mjs`): a test named for the ruling, not the book:
  "Ken's ruling, Deighton confirmed (2026-10-04): Luck bought with CP is held
  to Max Character Point Boost; the starting 4 is outside it". Decision 157's
  test stays as is: it sets the field directly, as a locked file would.
- **Voice** (`voice.test.mjs`): no `Max Boost` and no `exempt` in a string a
  player reads, if the voice tests have a place for banned phrases. If not,
  a smoke assertion on the CP step's text.
- **Smoke**: on the CP step, a Street character's Luck + goes off after 2 with
  its reason in `title`; the chip and the Boosts heading read the new name;
  `phone-check` covers the chip at 375px.
- **Mutation-test**: drop the Luck branch from `canBoost`; put
  `bal.left >= luck.cpCostPerPoint` back in `spendable`; drop the `validate`
  line. Each must fail a test. Put the mutants in the log and the PR.

## 10. Steps

1. `npm run verify` on a fresh branch (with `private/` mounted). Note the
   totals.
2. Engine §7a, with its tests. `npm run test:fast`.
3. Data §7b and UI §7c, with the smoke tests.
4. Run it in the dev preview (`shadows-dev-preview`): a Street character
   buys Luck to the cap; switch to Heroic and back; look at the chip at 375px.
   Save two screenshots and attach them to the PR. If you can't attach, say
   so and describe what you checked.
5. Docs §7d, Decision N and its marks, CHANGELOG, `npm run changelog`, the
   versions per §2.
6. `npm run verify` and `npm run phone-check`.

## 11. Stop and ask

- If anything other than the jump bar and its smoke test reads
  `secs.sect`'s `"Boosts"` label (a saved scroll position, a link).
- If a test other than the ones §9 names breaks because it bought Luck past
  the cap. It might be pinning something real.
- If `validate` turns out to run on a locked character anywhere (it
  shouldn't: only `wizard.js` calls it).
- If any player-facing "Boost" is ambiguous between the dice Boost and the
  CP Boost and §7c doesn't say which.
- Any new field on the character, or any change to `migrate()`.

## 12. Close-out

Use the **close-the-session** skill. Rule-or-shape tier: Decision N and its
four marks, STATE rewritten (P7 built; **P8 next**), the log entry with the
mutants, `shipped.md`'s row, W65 and W66 to `wishes-granted.md`, CHANGELOG
plus `npm run changelog`, the versions per §2, and the plan's P7 row.

Suggested CHANGELOG lines:

- **LUCK bought with Character Points now has a cap**, the same as Stats and
  Skills: 2 at Street Level, up to 5 at World Coming Down. The 4 everyone
  starts with doesn't count. Characters already made keep what they bought.
- **"Max Boost" is now called the Max Character Point Boost.**

## 13. Review checklist

- [ ] §8's rows are pinned, and each passes.
- [ ] `canBoost` is the only place the Luck cap is computed.
- [ ] A locked file over the cap loads unchanged, with nothing reported.
- [ ] Admin's LUCK bonus and every dice "Boost" are untouched.
- [ ] No `maxBoost`, `boosts` or `luck|x` key renamed.
- [ ] Decisions 2, 3, 5 and 157 marked; Decision N's shape passes `docs.test.mjs`.
- [ ] `crb-catch-up.md` no longer says Luck is exempt.
- [ ] Mutation tests noted in the PR **and** the log.
- [ ] `npm run verify` and `phone-check` green; versions per §2, and the PR
      says which case.

## 14. Handing it over

Paste this as the first message of a fresh Sonnet session, once this order
is on `main`:

> Read `CLAUDE.md`, then `docs/plans/sheet-wishlist/P07-luck-and-the-boost-cap.md`,
> and build it. Ken's answers to PQ1–PQ3 are in its §4 (all three
> on their defaults). Follow its steps (§10) in order, and its *Stop and ask* list
> (§11) exactly. If something isn't covered by the order, stop and ask me
> rather than choosing. Where the order and the code or the ledger disagree
> in a way that doesn't stop you, build what the order says and list it in
> the PR under *Where the order didn't fit*. Open a PR when §13's checklist
> holds; don't merge it.
>
> Seven things in this order are easy to get wrong:
>
> 1. **One field, two writers.** `trackers.luck.bonus` is both the Luck bought
>    with CP and Admin's LUCK bonus in play. The cap is a creation rule,
>    checked by `canBoost` and `validate`, which only the wizard calls. Don't
>    cap Admin, `luckState`, `addBoost` or `migrate()`.
> 2. **There are two Boosts.** The Max Character Point Boost is the CP cap.
>    "Boost the roll" is a Luck spend, and so are Lucky's and Unlucky's "Boost
>    now costs…". Rename only the first.
> 3. **`spendable("cp")` has its own Luck test** (`bal.left >=
>    luck.cpCostPerPoint`). Point it at `canBoost`, or the wizard says there's
>    CP to spend when only capped Luck could take it.
> 4. **Read Luck's price from `resources.luck.cpCostPerPoint`**, not
>    `boostRules.cpCostPerPoint`. Both are 1 today, so a mistake passes every
>    test unless one checks the key.
> 5. **A locked file over the cap is left alone.** No trim, no migrate step,
>    no `versionCheck` line. Decision 157's "keeps the points it paid for"
>    still holds for it.
> 6. **CRB v4 doesn't print Max Boost.** Pin the cap as Ken's ruling,
>    confirmed by Deighton, never as a quote from the book.
> 7. **Tests that drain CP by setting `luck.bonus` past the cap** (Decision
>    215's engine test, two smoke tests) aren't about Luck. If they trip the
>    new check, change how they drain CP, not the check.
>
> Tier: Rule or shape. One numbered decision (the next free number). Versions
> depend on whether 0.43.0 has shipped (§2). No schema bump. Use the
> close-the-session skill at the end.
