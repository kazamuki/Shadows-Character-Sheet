# Work order P1 — Playtest bugs: Pain Sensitive, the Improved roll box, the session date

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W92, W93, W67**
(`WISHLIST.md`); Decisions 104, 134, 135, 202.
**Status:** **drafted 2026-10-10 by Claude (Opus)**, pre-flighted against the
code on the rulings branch (#156). **Ken: approve, or answer PQ1–PQ2 (§4).**
**Branch:** from `main` with #156 merged; PR to `main`, not switched off.
**Runs alone.** It touches `shadows-data.js` (two entries), `engine.js`
(`grants`, `painState`, a date helper, a roll helper), `sheet.js`, `gm.js`,
`shared.js`, the tests, and the docs. Nothing in `private/`.

**What P1 is.** Three bugs the first playtest hit or that sit beside them,
each small, each with its exact fix below:

- **W92:** Pain Sensitive ("Your Pain Level is always 1 higher than normal.
  Does not apply if you have no pain levels.") does nothing. The engine never
  reads it.
- **W93:** taking **Improved** asks for "2d10+15 … the result". Brogan typed
  his two dice (14) and expected 29; the box wanted the total and granted 14.
- **W67:** a new session's date is the UTC day, so in the evening in the
  Americas it says tomorrow. GM mode already fixed this for itself
  (`localDay` in `gm.js`); the character sheet never got it.

---

## 1. Goal

When P1 is merged:

1. A Pain Sensitive character at Pain Level 1 or more is one level higher
   (capped at 3), and the sheet says Pain Sensitive is why. At Pain Level 0 it
   changes nothing.
2. Taking Improved shows **Roll 2d10 … enter the dice:** `[box]` **+ 15 IP**,
   and grants the dice plus 15. The 2, the 10 and the 15 come from the data,
   so P5 changes them to 3d10+30 with a data edit and no code.
3. Every date the app defaults to "today" is the player's local day.

## 2. Tier, versions, numbers

- **Tier: Rule or shape**, the small end of it. W92 and W93 each add a data
  shape the engine reads (a `grants` type, a milestone's `ipRoll`), so they
  share one numbered decision, **Decision 214**. 213 is reserved by S16's order
  (`gm-mode/S16-interaction-sentence.md`): check `origin/main` and open
  branches for the next free number before writing it, and take that one if
  214 is gone. W67 is a Fix and gets no decision.
- **App:** patch bump (`npm run bump -- X.Y.Z`; the current number is in
  `docs/STATE.md`). Every part is player-visible.
- **Game data:** `gamedataVersion` bump (Decision 68): a Pain Sensitive
  character's computed Pain changes.
- **Character schema:** **no bump.** Nothing new is stored on a character.
- **CHANGELOG:** three lines under `[Unreleased]`, player voice (§12).

## 3. The decision, drafted

```
214. **A Disadvantage's Pain shift and a Milestone's IP roll are data the engine reads.**
     *2026-10-1x · Ken + Claude · Touches: Pain Sensitive, grants, painLevel grant, painState, fromTraits, painSources, Improved, ipRoll, minorShared, Engine.ipRoll, Take Minor, W92, W93*
     - **Decided:** A `grants` entry `{ type: "painLevel", amount, onlyIfHurt: true }` on an Advantage, Disadvantage or Major adds `amount` to the Pain Level when the level from Health Levels, Conditions and Aberrations is already 1 or more, capped at the table's top; `painState` reports it as `fromTraits` and names its source. A Minor Milestone with `ipRoll: { count, sides, plus }` asks for the dice alone, prints "+ plus IP" beside the box, and grants the dice plus `plus`.
     - **Why:** Pain Sensitive did nothing, and a playtester read "2d10+15, enter the result" as "enter the dice" (W92, W93). Both rules now live as numbers in the data (Decisions 134, 135), so Deighton's rebalanced Improved (3d10+30, W103) is a data edit.
     - **Rejected:** a `painSensitive` id check in the engine (Decision 135: no ids in code); keeping "enter the total" and only relabelling the box (the wizard's rolls already take the dice and add the base, so Improved was the odd one out); applying the shift at Pain Level 0 (Ken's reading, 2026-10-10: "does not apply if you have no pain levels").
     - **Replaces:** nothing.
     - **Revisit if:** another trait shifts Pain unconditionally (`onlyIfHurt: false` is the room left for it), or a Minor's roll needs more than dice plus a flat number.
     - **Built:** app X.Y.Z, data 0.NN, PR #…, log 2026-10-1x.
```

The INDEX §3 line, under its topic (*Resources & vitals* for the Pain half;
put it where Decision 202 sits): `- **214** *(Playtest bugs — sheet-wishlist
P1, W92, W93)* — A `painLevel` grant (Pain Sensitive) adds to a Pain Level
already 1 or more, as `fromTraits`; a Minor's `ipRoll` asks for the dice and
adds `plus` (Improved 2d10 + 15).`

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | Should the Improved box show a live total beside it ("= 29") as the player types? | No: "+ 15 IP" is the fix Brogan asked for, and the IP log shows the total after |
| PQ2 | A box left empty: take Improved with no IP (today's behaviour), or refuse? | Refuse, with "Enter the dice you rolled." A Milestone taken by accident is an Undo away, but one taken with no IP is a silent loss |

## 5. Read first

- `CLAUDE.md`, then `docs/STATE.md`. Decisions **104** (grants), **134**
  (numbers the engine reads), **135** (no ids in code; no unread data keys),
  **202** (Pain Immunity, the other thing `painState` does).
- `src/engine/engine.js`: `grants()` (around line 151), `painImmunity` and
  `painState` (around 727–770), `grantIP` and `takeMilestone` (around 1840),
  `logSession` (around 1975).
- `src/ui/sheet.js`: `painExtra` (line 26) and its two uses (around 330 and
  1118); the Improved prompt (around 1254) and its handlers (`data-takeminor`,
  `data-improvok`, around 2962–2978); the session form's date (around 1309);
  the Cascade note (around 2597).
- `src/ui/gm.js`: `localDay` (around 567). `src/ui/shared.js`: the top, where
  globals shared by the UI scripts are declared.
- `src/data/shadows-data.js`: `pain-sensitive` (around 1783), and
  `milestones.minorShared` `improved` (around 3062), with the comment block
  above `milestones`.
- `tests/rules.test.mjs` lines 88–135 (the Pain tests to extend), and the
  `localDay` tests in `tests/smoke.test.mjs` (around 4137).

## 6. Out of scope

- Deighton's rebalanced Minor values (Improved 3d10+30, Skilled, Redeemed) and
  Minor repeats: **P5 (W103)**. P1 only moves Improved's numbers into the data,
  unchanged (2d10 + 15).
- Any other trait or Condition that touches Pain. Agonized and Phantom Pain
  stay as they are.
- The repair kit's box: it takes one die and adds nothing, so it's already
  right. Read it once to confirm, and change nothing.
- The IP log's own timestamps (`new Date().toISOString()`, full time): those
  are instants, not days, and stay.

## 7. The shapes

### 7a. Pain Sensitive (W92)

**Data.** On `disadvantages` → `pain-sensitive`, add:

```js
"grants": [ { "type": "painLevel", "amount": 1, "onlyIfHurt": true } ]
```

**`grants()`.** Its `out` gains `painLevel: 0`. In `scan`, a `painLevel` grant
with `onlyIfHurt === true` adds `Number(g.amount)||0` to `out.painLevel`, once
per entry (not per rank: Pain Sensitive has `maxRank: 1`, and a ranked trait
that shifts more per rank would say so in a later decision). Record its source
too: `out.painLevelFrom` (an array of `{ id, kind }` or names; match how the
caller can name it), so `painState` can say who added it. A `painLevel` grant
without `onlyIfHurt: true` is **ignored**: unconditional shifts aren't decided
(§3, *Revisit if*).

**`painState()`.** After `band`, `fromConditions` and `fromAberrations` are
known:

```js
const base = Math.max(0, Math.min(top, band.level + fromConditions + fromAberrations));
const shift = base >= 1 ? g.painLevel : 0;        // g = grants(ch)
const target = Math.min(top, base + shift);
const fromTraits = target - base;                 // what was actually added
```

Return `fromTraits` beside `fromConditions` and `fromAberrations`: it's what
the trait **actually added**, so it's 0 at Pain Level 3, where the cap leaves no
room. Add the trait's name(s) to `painSources` only when `fromTraits > 0`.
(The existing `target` clamp already does `Math.max(0, …)`; keep the order of
clamps above so a negative sum can never let the shift through.) Under Pain Immunity
(Decision 202) `band` already counts only Withering's Health Levels, and the
shift applies on top of whatever level that gives; nothing else changes.

**The sheet.** `painExtra` (sheet.js line 26) becomes
`(pain.fromConditions||0) + (pain.fromAberrations||0) + (pain.fromTraits||0)`.
Both of its uses already print `painSources`, so the line reads, for example,
"+1 Lv from Pain Sensitive", and the popover's sentence names it.

**Engine totality (constraint 8).** `grants()` already tolerates missing defs
and odd entries. A hostile file can't add a grant (grants come from the data,
not the file), so nothing new reaches `migrate()`.

### 7b. The Improved roll (W93)

**Data.** On `milestones.minorShared` → `improved`, add:

```js
"ipRoll": { "count": 2, "sides": 10, "plus": 15 }
```

Leave `benefit` as it is (it's the rule's prose). Update the comment block
above `milestones` with one line for `ipRoll`.

**Engine.** One reader, exported:

```js
// A Minor's IP roll (Decision 214): the dice the player rolls and the flat
// amount added. null when the Minor has none.
function ipRoll(id){ … returns { count, sides, plus } with each a positive
  integer (plus may be 0), or null }
function ipRollTotal(spec, dice){ … nonNegInt(dice) + spec.plus }
```

`ipRoll` reads `D().milestones.minorShared`, and returns null for an unknown id
or a malformed spec (constraint 8).

**The sheet.** Generalise the prompt from the `improved` id to **any Minor with
an `ipRoll`**: `data-takeminor` checks `Engine.ipRoll(id)` instead of
`id==="improved"`, and `S.askImproved = true` becomes `S.askRoll = id`. The
prompt reads, from the spec:

> **Improved**
> Roll 2d10 at the table. 10s explode: add up every die you rolled, the extra
> ones too. Enter the dice:
> `[ box ]` **+ 15 IP**  ·  **Take + grant IP**  ·  **Cancel**

The box is `type="number"`, `min` = `count`, `aria-label` "Improved: the dice
you rolled". On **Take**: if the box is empty or below `count`, `notice()`
"Enter the dice you rolled." (PQ2's default) and keep the prompt open;
otherwise grant `Engine.ipRollTotal(spec, dice)` with the note
`Improved milestone (2d10+15): rolled 14`, built from the spec and the milestone's
name. The commit label stays `Take Minor: Improved (+29 IP)`, now with the total.

### 7c. The local day (W67)

**Engine.** Add `localDay(d = new Date())`, exactly `gm.js`'s body (local
`getFullYear`, `getMonth()+1`, `getDate`, zero-padded), and export it. Use it
in `logSession`'s default `date`.

**UI.** In `shared.js`, near the top-level helpers: `const localDay =
Engine.localDay;`, and **delete** `gm.js`'s `function localDay` (a second
global declaration of the same name is a SyntaxError in a classic script, and
the build would break). Every bare `localDay()` in `gm.js` keeps working. Then
in `sheet.js`, the session form's date default and the Cascade note use
`localDay()`.

**The guard.** No `toISOString().slice(0,10)` (or `.slice(0, 10)`) anywhere in
`src/`: the three today are the whole list.

## 8. The UI

Only §7b's prompt changes visibly, plus the Pain line's "+1 Lv from Pain
Sensitive". Keep the prompt in the existing `.trk` row styles; the "+ 15 IP"
is a `.sub` span after the box. At phone width it wraps, never scrolls
sideways: `npm run phone-check` must pass.

## 9. Tests

Each new guard is **mutation-tested** against the pre-fix code (§10, step 6):
it must fail there.

**`tests/rules.test.mjs`** (pin the reading):

1. Pain Sensitive, BOD 10 (5 HP a Level): damage 0 → level 0; damage 5 (1 HL)
   → 0; damage 10 (2 HL) → **2**; damage 25 (5 HL) → **3**; damage 40 (8 HL) →
   **3** (capped). `fromTraits` is 0, 0, 1, 1, 0: at 40 the cap leaves no room,
   so nothing was added and Pain Sensitive isn't named.
2. At full health with Agonized (a Condition worth +1 Pain), Pain Sensitive
   makes it 2, and `painSources` lists both Agonized and Pain Sensitive.
3. Without the Disadvantage, every existing Pain test is unchanged (the
   suite's own tests cover this; don't duplicate them).

**`tests/engine.test.mjs`**:

4. `Engine.ipRoll("improved")` is `{ count:2, sides:10, plus:15 }`;
   `Engine.ipRoll("skilled")` and `Engine.ipRoll("nope")` are null;
   `Engine.ipRollTotal(spec, 14)` is 29.
5. `Engine.localDay(new Date(2026, 9, 5, 23, 30))` is `"2026-10-05"` and
   `Engine.localDay(new Date(2026, 11, 31, 23, 59))` is `"2026-12-31"` (move
   the two smoke assertions here; keep one smoke test that `localDay` is
   still reachable in the page).
6. **Guard:** no file in `src/` matches `/toISOString\(\)\.slice\(0,\s*10\)/`.
7. Decision 135's unread-data-key test must still pass with `ipRoll` and the
   `painLevel` grant read; if it lists known grant types, add `painLevel`.

**`tests/smoke.test.mjs`**:

8. Take Improved on a sheet with a Minor available: the prompt shows "2d10"
   and "+ 15 IP"; typing 14 and Take adds **29** to IP and logs the note with
   "rolled 14".
9. Take with the box empty: no Minor is taken, no IP granted, and the notice
   says "Enter the dice you rolled."
10. A Pain Sensitive character at 2 HL lost: Main's Pain card reads Lv 2 and
    names Pain Sensitive.

## 10. Steps

1. Branch from `main` (with #156 merged). `npm ci`, `npm run verify`: note the
   test count.
2. §7c first (smallest, and it moves a global): engine `localDay`, `shared.js`
   alias, delete `gm.js`'s, the three call sites, tests 5–6. `npm run test:fast`.
3. §7a: data, `grants()`, `painState()`, `painExtra`, tests 1–3 and 10.
4. §7b: data, `ipRoll`/`ipRollTotal`, the prompt and handlers, tests 4, 7–9.
5. `npm run verify` and `npm run phone-check`. Open the sheet with
   `shadows-dev-preview` (`.claude/launch.json`) and take Improved for real,
   and give a Pain Sensitive character 2 HL of damage: screenshot both for the PR.
6. **Mutation-test** each guard against the pre-fix code: revert `painState`'s
   shift (test 1 fails at damage 10), drop the `base >= 1` check (test 1 fails
   at damage 0, which would read 1), put one
   `toISOString().slice(0,10)` back (test 6 fails), grant the dice without
   `plus` (test 8 fails). Record each in the PR.
7. Close out (§12).

## 11. Stop and ask

- If 214 is taken by the time you number it, take the next free one and say
  so in the PR; don't renumber anyone else's.
- If `grants()` turns out to be read somewhere that would double-count a
  `painLevel` grant (it shouldn't: only `painState` reads it), stop and say where.
- If deleting `gm.js`'s `localDay` breaks anything beyond a missing global,
  stop: don't keep two copies.
- If the jsdom smoke can't reach the Progression tab's Minor list without a
  Milestone Point, give the character one through the data the test already
  uses; don't add a test-only path to the app.

## 12. Close-out

Use the **close-the-session** skill. For this session that means:

- **CHANGELOG** under `[Unreleased]`, player voice, then `npm run changelog`:
  - "Pain Sensitive works: once you're hurt, your Pain Level is one higher."
  - "Taking Improved asks for the dice you rolled and adds the 15 itself."
  - "A new session's date is your own today, not tomorrow, in the evening."
- `npm run bump -- X.Y.Z` (patch), and `gamedataVersion` in the data.
- **Decision 214** in `SCHEMA.md` §4 and its INDEX §3 line (§3 above).
- **W92, W93, W67** move whole to `log/wishes-granted.md`, each heading
  pointing at Decision 214 (or "Fix" for W67), and out of `WISHLIST.md`.
- **STATE** rewritten where it's now wrong (§5's *Where to start*), a
  `log/2026.md` entry, and a row on `log/shipped.md`.
- **`sheet-wishlist.md`** §3: P1's status becomes *built, PR #…*.

## 13. Review checklist

For the orchestrator, against the PR:

- [ ] Pain Sensitive at 0 and 1 HL lost reads 0; at 2 HL lost reads 2; capped at 3.
- [ ] The Pain line names Pain Sensitive, on Main and in the popover.
- [ ] No archetype or Disadvantage id in the engine's new code.
- [ ] Improved's prompt reads count, sides and plus from the data: change
      `plus` to 30 locally and the prompt says "+ 30 IP" with no code change.
- [ ] Empty box refuses (PQ2); 14 grants 29; Undo removes both the Minor and the IP.
- [ ] No `toISOString().slice(0,10)` left in `src/`; `localDay` is defined once.
- [ ] Every guard was mutation-tested, and the PR says how.
- [ ] Versions: app patch, `gamedataVersion`; no schema bump.
- [ ] CHANGELOG has the three lines; `npm run changelog` was run.
- [ ] Run it in a browser: both screenshots in the PR match.
