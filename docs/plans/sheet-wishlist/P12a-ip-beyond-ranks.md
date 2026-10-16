# Work order P12a: IP beyond ranks

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** what IP buys besides a Stat, a Skill, a power or a Mastery, and how a session's IP is counted:
- **W89**: an Advantage bought with IP (a new one, or a rank up), and a Disadvantage bought off, one rank at a time.
- **`0450`'s restores** (from crb-v4-sync's P5): lost SAN at 5 IP a point, and a Health Level lost to a maiming at 25. Neither goes past the maximum.
- **The Session Log by the hour** (Ken, 2026-10-15): it asks for hours played, at 5 IP each, as GM mode's close-out does. Today it grants a flat 10.

**Status:** **drafted 2026-10-16 by Claude (Opus)**, the P11 reviewer. Pre-flighted against `main` at `0d53e58` (P11, #198, merged; app 0.47.0, game data 0.40 and character schema 0.27, none of them released yet). **Ken answered PQ1–PQ8 on 2026-10-16 (§4): all eight take their defaults.** So F-next opens for Educated (PQ4), and there's no schema bump (PQ6). Ken settled the plan row's two questions on 2026-10-15:
- a restored Health Level undoes a Massive one, as Steadied's does;
- the Session Log asks for hours.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P12a build** (Sonnet), then a fresh reviewer (Opus) once the PR is open.

**Carried over from P11's review:**
- **The order's miss:** it made Turn Reset the round count's only clearer, and never asked where Turn Reset is pressed. It sat a tab away, and before P11 its Apply was disabled whenever nothing ticked. So no player had a habit of pressing it, and the count's warning was false from round two. The sweep asked where a result *renders*, never where its control *lives* or what else ends the state.
  **Applied here:** §5 has a row for every control a new action needs, and for every *other* path that changes the same value (Talented, Redeemed, Steadied, Admin, healing).
- **The build's misses**, both found only in the browser:
  - The SFR card's line wrapped as it grew, so the popover's +1 moved under the finger.
  - The movement line repeated each Condition's penalty.

  **Applied here:** §13.5 measures the buy modal's buttons before and after a purchase, and reads every new line beside its neighbours for a repeat.
- **The build:** its "Where the order didn't fit" list was useful again; keep it.

**What P12a is.**
- **Today:** after lock, an Advantage or Disadvantage changes only through Talented, Redeemed or Admin. Lost SAN and Massive Health Levels come back only through Steadied (10 SAN or one level, a Minor Milestone each). The Session Log grants 10 IP a session, however long the session ran.
- **The book (`0450`, *Spending Improvement Points*)** prices all four:
  - an Advantage at its creation cost × 10 a rank;
  - a Disadvantage off at the same, a rank at a time;
  - SAN at 5 a point;
  - a Health Level at 25.
  - Its *Improvement Points* section says every hour of play earns 5 IP.
- **After P12a:** Progression buys the first four, and the Session Log counts hours.

**Probes against `main`** (`0d53e58`; locked Street Level characters, every stat 5):

```
professional/mercenary   ipCost(ch, "advantage", "favored-skill")   {ok:true, cost:25, from:0, to:1, focused:false}
                         ← no refusal: an unknown targetType falls through to the skill branch and prices a new skill.
                           spendIP would write ch.skills["favored-skill"] = {rank:0, ipe:1}, a junk skill.
versionCheck             reads any log entry not "spell" or "power" as a stat or skill:
                         "IP journal shows 1 increase on <id> but IPE is 0 — totals may have been edited by hand."
                         It is the sticky banner on every page (shared.js loadFindings, ~862).
sanState                 {max:50, loss:0, current:50}; after loss 12 → current 38
massiveLevels 2          Steadied offers "Restore a Health Level" (amount 1), clamped to hlState(ch).massive
Talented (new)           31 options for a Professional, 12 for a Vampire (Universal only, Decision 152).
                         **Long-Lived is offered**: it is creationOnly (data), which no engine code reads
                         (only wizard.js ~577 prints "creation only"), and it grants Minor Milestones.
                         Educated is offered: its grant is creation Skill Points.
logSession(ch, {})       ipEarned 0; the UI fills D.ip.perSession (10) when the field is empty (sheet.js ~3420)
Admin Budgets            cp(ch) on a locked character: "CP 22 left". Talented's row already counts as CP spent there.
GM close-out             writes IP into the table file only; nothing reaches a character (gm.js never calls grantIP or logSession).
```

**The wish and the code disagree once.** W89 says "the held Advantages are read from creation plus the journal, never rewritten". Talented and Redeemed (Decision 217) already rewrite `ch.advantages` and `ch.disadvantages`, and constraint 7 is about derived values; a held row is an input. PQ1 defaults to 217's way, and W89's note is corrected when it moves to `wishes-granted.md`.

**The book's text and the data disagree once.** Minor Insanity's data `description` says "spend IP during play to buy out"; `0440` now says "between sessions". `0450` also says IP is spent between sessions, so the data line is fixed (Content, in this order).

---

## 1. Goal

When P12a is merged:

1. **An Advantage can be bought with IP:** a new one at rank 1, or a held one up a rank, at its `cost` × 10 a rank (`0450`, Deighton Q24: every rank the same). The same rules bind as for Talented's new Advantage:
   - a Supernatural buys only Universal Advantages (Decision 152);
   - a prerequisite binds;
   - a creation-only Advantage is never offered;
   - nothing goes past its `maxRank`.
2. **A Disadvantage can be bought off with IP**, one rank at a time at its `pointsGranted` × 10, removed at rank 1. No CP is refunded (W89).
3. **Lost SAN and Massive Health Levels can be restored with IP:** 5 a point of SAN and 25 a Health Level. Each is clamped to what was lost (`0450`: never past your maximum). Withering's levels are not maimings, and are not restored (as Steadied, Decision 217).
4. **Each is one IP spend:** a journal entry, one commit, one Undo. The IP journal names it, and `versionCheck` never reports it as a hand edit.
5. **The Session Log asks for hours.** IP is `ceil(hours × ip.perHour)` (5), editable before logging, as GM mode's close-out does (Decision 206). The flat 10 is gone, from the data and from the copy.
6. **Talented stops offering a creation-only Advantage** (Long-Lived). It shares the IP buy's eligibility check (PQ3).

## 2. Tier, versions, numbers

**Tier: Rule or shape.** It reopens Decision 13 (10 IP a session) and part of Decision 206 (its rejected "changing `ip.perSession` here: … its own fix"), and adds new IP purchases. **Two numbered decisions**, the next free numbers on `origin/main` when you write them:
- **N**: what IP buys beyond ranks;
- **N+1**: the Session Log by the hour.

**One flag (PQ4, Ken took the default):** **F-next** (Educated bought in play), the next free F-number.

**Character schema: no bump.** A journal entry keeps its fields (`date, kind, amount, targetType, targetId, from, to, note, name?`); P12a adds new `targetType` *values*, and §8 gives each reader a case for them. Rows in `advantages` and `disadvantages` keep their shape. **If PQ6 stores hours on a session, that is a new field:** schema 0.28, with a `migrate()` step that keeps `hours` as a number ≥ 0 or deletes it. Say in the PR which applied.

**App version:**
- **0.47.0 still unreleased** (`git tag | sort -V | tail -1` is `v0.46.0`; today's case): no bump, and the lines join `[Unreleased] — app 0.47.0`.
- **0.47.0 released by then:** `npm run bump -- 0.48.0`. It's minor: new things a player can do.

**Game data:**
- **0.40 still unreleased:** no bump.
- **0.40 released:** 0.41.

The data changes are `ip`'s new prices, `perSession` removed, and Minor Insanity's line. Say in the PR which case applied.

## 3. The decisions, drafted

Write them as Decisions **N** and **N+1** in `SCHEMA.md` §4. N's INDEX §3 line goes under the topic Decision 217 is filed under, and N+1's under Decision 206's. Fill in Ken's answers; trim only if `docs.test.mjs` says one is over its word limit.

```
N. **IP buys an Advantage or a rank of one, buys off a Disadvantage a rank at a time, and restores lost SAN and a maimed Health Level, at 0450's prices; one eligibility rule serves IP and Talented.**
     *2026-10-1x · Ken + Claude (Deighton Q24) · Touches: ipCost, spendIP, ip.advantageCost, ip.disadvantageBuyOff, ip.restore, targetType advantage/disadvantage/restore, advantageOffer, creationOnly, Talented, canBuyAdvantage, requirementState, optionLock, maxRank, picks, selections, trackers.san.loss, trackers.massiveLevels, versionCheck, IP Journal, Progression, Buy an Advantage, Buy off a Disadvantage, Restore, Minor Insanity, Pact, W89*
     - **Decided:** `ipCost`/`spendIP` take three new kinds:
       - `"advantage"`: a new Advantage at rank 1, or a held one up a rank, at `cost × ip.advantageCost.timesPoints` a rank (Q24: flat);
       - `"disadvantage"`: one rank off at `pointsGranted × ip.disadvantageBuyOff.timesPoints`, removed at rank 1, no CP refunded;
       - `"restore"`: `"san"` at `ip.restore.sanPerPoint` a point, or `"massiveLevel"` at `ip.restore.healthLevel` a level, each clamped to what was lost (Withering excluded, as Steadied).

       Bought and bought-off rows are written as Talented's and Redeemed's are (Decision 217), and the journal records the spend. A new Advantage is offered by `advantageOffer`, the one rule Talented now shares. It requires:
       - Decision 152's classification;
       - its prerequisites;
       - no option lock;
       - rank to spare;
       - never `creationOnly` (Long-Lived).

       A new rank that needs a pick asks for it in the same purchase (PQ5). `ipCost`'s skill branch refuses an id that isn't a skill. `versionCheck` reconciles none of the new kinds: the rows and trackers are the record.
     - **Why:** W89 (Brogan); 0450 prices all four; Deighton Q24. Talented offered Long-Lived, a creation-only Advantage that grants Milestones.
     - **Rejected:** <PQ alternatives Ken didn't take>; deriving held Advantages from creation plus the journal (W89's first note: two models of one list, and Talented already writes rows); a new `source` value for an IP-bought row (Decision 142 drops other values; nothing would read it but the CP echo, PQ7); refunding a bought-off Disadvantage's CP (W89, 0450).
     - **Replaces:** Decision 159 in part (Progression's raise buttons: its *Revisit if* "something else is spent with IP often enough" fired). Decision 217 in part (Talented's offer now refuses `creationOnly`). Extends Decision 14 (IP costs) with 0450's four.
     - **Revisit if:** Deighton rules on Educated in play (F-next); IP spent mid-session needs enforcing; a restore past the maximum is ruled.
     - **Built:** app …, game data …, PR #…. Log 2026-10-1x (P12a).

N+1. **The Session Log counts hours: IP is 5 an hour, rounded up, editable before it's logged; the flat 10 a session is gone.**
     *2026-10-1x · Ken + Claude · Touches: Session Log, logSession, ipEarned, ip.perSession, ip.perHour, data-sesip, hours, IP rounding, Decision 13, Decision 206*
     - **Decided:** The Session Log asks for the hours played and fills its IP as `ceil(hours × ip.perHour)`; a typed IP wins over the hours, as GM mode's close-out (Decision 206). Hours are a calculator, not stored: the session keeps `ipEarned` as today (PQ6). Log is off until hours or IP is filled, and 0 is a value (PQ8). `ip.perSession` is removed from the data, and the Session Log's copy says 5 an hour.
     - **Why:** 0450: "Every hour of play earns 5 IP". Ken, 2026-10-15: the flat 10 is out of date, and a player's IP comes only from this log (GM mode's close-out stays in the table file).
     - **Rejected:** <PQ alternatives Ken didn't take>; keeping `perSession` as a fallback (a number nothing should use, Decision 135).
     - **Replaces:** Decision 13 in part (its "10 IP per session"). Decision 206 in part (its rejected "changing `ip.perSession` here", which said this was its own fix).
     - **Revisit if:** S3b's seats carry a GM's close-out IP to the character; the CRB changes 5 an hour.
     - **Built:** app …, game data …, PR #…. Log 2026-10-1x (P12a).
```

**Check *Replaces* against the text, not the title.** Search §4 for `perSession`, `Session Log`, `ipCost`, `spendIP`, `IP journal`, `Raise a`, `advSpent`, `canonicalEntry`, `source`, `Talented`, `Redeemed`, `Steadied`, `san.loss`, `massiveLevels`, `creationOnly` and `Long-Lived`. The pre-flight found:
- **13** (10 IP a session);
- **14** (IP costs);
- **142** (`source`);
- **152** (a Supernatural's Advantages);
- **159** (Raise buttons; its *Revisit if* fired);
- **194** (power prices);
- **206** (the close-out, and its rejected `perSession` change);
- **217** (Talented, Redeemed, Steadied).

13 and 206 are superseded in part by N+1; 159 and 217 by N. Mark each.

## 4. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Where a bought Advantage lives.** | **In `ch.advantages`, as Talented writes it** (Decision 217): a rank up goes on the bought row (`canonicalEntry`), and a new one is a new row. A buy-off lowers or removes the row, as Redeemed does, with `trimSelections`. The journal records the IP. *Alternative:* W89's "creation plus the journal, never rewritten". But Talented already rewrites rows, so that's two models of one list, and every reader of `advantages` (grants, picks, print, Character tab, `checkPrereqs`) would have to learn the second. || **Ken, 2026-10-16: the default.** |
| PQ2 | **Restores: how much at a time.** | **SAN takes an amount** (1 to what was lost, 5 IP each), with a stepper and the total price on the button. **A Health Level is one a press** (25 IP). *Alternative:* SAN one point a press (10 SAN is 10 presses, 10 journal lines). || **Ken, 2026-10-16: the default.** |
| PQ3 | **Talented and Long-Lived** (a bug on `main`). | **Fix it here:** Talented's new-Advantage offer and the IP buy share `advantageOffer`, which refuses `creationOnly`. Talented keeps its own 5-point limit. A player-visible fix, with its own CHANGELOG line. *Alternative:* its own Fix order later. But the IP buy needs the same check anyway, and leaving Talented on the old one keeps the loop open (Long-Lived grants Minor Milestones). || **Ken, 2026-10-16: the default.** |
| PQ4 | **Educated bought in play.** Its grant is 10 creation Skill Points a rank, and after lock there's nothing to spend them on. Talented offers it today. | **A rules question, so it's flagged:** F-next for Deighton ("what does a rank of Educated bought after creation give?"). Until it's ruled, the IP buy doesn't offer Educated, and its row in the modal says why (a `playerNote`). Talented is unchanged (it's Deighton's Q25 ruling); the flag names it. *Alternative:* offered, with nothing happening after lock. That would sell 50 IP for nothing. || **Ken, 2026-10-16: the default.** |
| PQ5 | **An Advantage whose new rank needs a pick** (Favored Skill's and Refined Skill's skill a rank, Common Sense's option, Immunity's or Followers' text). A locked sheet has nowhere to make a pick today: Talented's Favored Skill ends up with no skill chosen. | **The purchase asks for it**, in the modal before Buy: a select for a skill or option pick, a text field for a `gmApproval` text pick (left empty is fine, Decision 78). Pick and spend are one commit, written with `setSelection`. *Alternative:* add the row with no pick, as Talented does. But a Favored Skill with no skill does nothing. Talented's own gap is a wish (W-next), not this order's. || **Ken, 2026-10-16: the default.** |
| PQ6 | **Hours on a session: stored, or a calculator?** | **A calculator:** the form asks Hours, fills IP, and stores `ipEarned` as today. No new field, no schema bump. The history line stays "+15 IP". *Alternative:* store `hours` (schema 0.28), so the history says "3 h · +15 IP". Nothing else would read it. || **Ken, 2026-10-16: the default.** |
| PQ7 | **Admin's CP echo and the Character tab's "N CP" after an IP buy.** Both count an IP-bought rank as CP spent (Talented's already do). | **Leave them** (reference only; Admin says so), and a wish (W-next) to show bought-in-play ranks apart. *Alternative:* subtract the journal's Advantage ranks from `advSpent`. That's a second source for one number, and Talented's free ranks aren't in the journal. || **Ken, 2026-10-16: the default.** |
| PQ8 | **Logging a session with neither hours nor IP.** | **Log is off** until hours or IP is filled (0 is a value), and it says why. A session that earned nothing is logged with 0. *Alternative:* an empty field logs 0 silently. That's today's engine default, which the old 10 hid. || **Ken, 2026-10-16: the default.** |

## 5. What this changes underneath (the assumption sweep)

Found by grepping the readers of each thing it touches, one level further (their readers that render). Writers are read through local aliases (`c.advantages` in migrate, `t = ch.trackers`), and every *other path* that changes the same value is its own row (P11's miss):
`ipCost`, `spendIP`, `ipState`, `progression.ip.log`, `targetType`, `versionCheck`, `ch.advantages`, `ch.disadvantages`, `canonicalEntry`, `heldRow`, `heldRank`, `trimSelections`, `setSelection`, `picksFor`, `canBuyAdvantage`, `requirementState`, `optionLock`, `creationOnly`, `minorChoice`, `planMinorChoice`, `advSpent`, `disGranted`, `cp(`, `sanState`, `trackers.san.loss`, `hlState`, `trackers.massiveLevels`, `logSession`, `ipEarned`, `ip.perSession`, `ip.perHour`, `data-sesip`, `data-raiseopen`, `raiseIP`.

**Check each row yourself before you build**, and say in the PR if one is wrong. Ask three questions of every row:
- **Which guards read a value this changes?**
- **Where does each new note or name render?**
- **Where is each new action pressed, and what else changes the same value?**

| Today | Where | After P12a |
|---|---|---|
| `ipCost`: `stat`, `spell` and `power`, **and everything else is priced as a skill** | `engine.js` ~2062–2097 | New branches before the fallback: `"advantage"`, `"disadvantage"`, `"restore"` (§8). **The fallback refuses an id `skillById` doesn't know** ("That isn't on this sheet."). Mutant 1. |
| `spendIP`: writes `ipe` (stat, skill, power) or a Grimoire stage, then one journal entry | ~2099–2114 | The new kinds write the row or tracker (§8) and one entry: `{ kind:"spend", amount, targetType, targetId, from, to, note, name }`. `from`/`to` are ranks for Advantage and Disadvantage, and loss for a restore. |
| **Writers of `ch.advantages`** | `planMinorChoice` (Talented ~2450); Admin (`sheet.js` ~3731–3745); wizard `applyStep` (~1139–1155); `migrate` (~3881, ~4046); `resetArchetypeChoices` (`shared.js` ~782) | `spendIP("advantage")` joins them, writing as Talented does: rank+1 on `canonicalEntry` (the bought row, never the `natural` one), or a new `{ id, rank:1, notes:"" }`. **Natural rows are never raised** (as Talented). |
| **Writers of `ch.disadvantages`** | `planMinorChoice` (Redeemed ~2446); Admin (~3748–3762); wizard (~1158–1162); `migrate` | `spendIP("disadvantage")` joins them, as Redeemed: rank−1, or the row removed, then `trimSelections`. |
| **Readers of the rows** | `grants()` (~161: Unlucky's `luckCost`, Pain Sensitive's `painLevel`, Hard to Kill's `hpPerLevel`, Lucky); `naturalArmor` (Thick Skin); `checkPrereqs`; `picksFor`; `tagReading`; Character tab cards (`sheet.js` ~587–599, "N CP"); print (~2705); Admin (~2407–2437); `validate` (wizard only) | **Unchanged:** a bought rank or a bought-off row is read like any other. Buying Hard to Kill raises HP at once; buying off Unlucky drops its LUCK costs at once. A test pins one of each (P12a 3). The "N CP" on the card is PQ7. |
| Talented's new-Advantage offer: `canBuyAdvantage`, `requirementState`, `optionLock`, `cost ≤ 5`, **not** `creationOnly` | `minorChoice` ~2392 | Both read **`advantageOffer(ch, def)`** → `{ ok, why }`, which adds `creationOnly`. Talented keeps `cost ≤ 5` itself. **Long-Lived drops out of Talented** (PQ3). |
| `creationOnly` is read only by the wizard's label | `wizard.js` ~577; `rules.test.mjs` ~270 | Also read by `advantageOffer`. |
| `trackers.san.loss` writers: Steadied (~2457), the SAN steppers and typed set (`sheet.js` ~3112–3116) | | `spendIP("restore", "san", n)` joins them: `loss − n`, with n clamped to `loss`. **`sanState().max` already caps at 95%** (data `derived` SAN `cap`); restoring never reads the max, only the loss. |
| `trackers.massiveLevels` writers: `applyHit` (~1205), `heal` (~1874), Steadied (~2458) | | `spendIP("restore", "massiveLevel")` joins them: `massive − 1`, refused at 0. `witheringDamage` is not touched. **Readers** (`hlState`, `painState`, the HL track, Rest, Focused, Nanomed panels) recompute. |
| `versionCheck`'s journal check: `spell` and `power` have cases, and **everything else is compared with a stat's or skill's `ipe`** | ~4618–4651 | `advantage`, `disadvantage` and `restore` entries are **skipped**: no IPE to match, and the rows are the record (as Talented's). **Renders:** the sticky banner (`shared.js` ~862). Mutant 2. |
| IP Journal: grant, spell, power, else `stat`/skill by `targetId` | `sheet.js` ~1507–1512 | New cases: "Advantage: Favored Skill 1 → 2", "Bought off: Pact", "Restored 10 SAN", "Restored a Health Level". Never a raw id. |
| `ipState`: spent is every non-grant entry's `amount` | ~2054 | **Unchanged:** the new entries are `kind:"spend"`, so they count. |
| Progression's raise row: Raise a Stat, Raise a Skill, Buy or Raise a Power | `sheet.js` ~1498–1502; `openRaisePicker`, `raiseIP` (~2811) | Three more buttons open modals (§9): **Buy an Advantage**, **Buy off a Disadvantage**, **Restore**. Disadvantage only when one is held; Restore only when something's lost. Each modal stays open after a buy, as Decision 159's do. |
| `logSession(ch, s)`: stores `ipEarned` as given (empty → 0) | ~2477 | Unchanged unless PQ6 stores `hours`. |
| Session Log: "grants **10 IP** (override below)", and IP prefilled with `D.ip.perSession` | `sheet.js` ~1597, ~1602; Log's fallback ~3420 | Asks **Hours**; IP fills with `ceil(hours × D.ip.perHour)` as you type, editable, and a typed IP wins. **The copy says 5 an hour.** Log is off with neither (PQ8). No `perSession` read anywhere. |
| `ip.perSession: 10` | data ~3589 | **Removed.** The data-key guard then fails on nothing; grep it gone from `src/`. |
| `ip.perHour: 5` | data ~3591; `closeOutDraft` (~5692); `gm.js` ~1359 | Also read by the Session Log. |
| Minor Insanity's `description`: "during play" | data | "between sessions" (`0440`, `0450`). **Not** a computed SAN change: its −5% a rank is text only, today and after (out of scope). |
| Pact: "Once the conditions for release are met, you may spend IP to remove" | data | **Offered like any Disadvantage**, and the modal shows its description, so the condition is read before Buy off. Releasing it is the GM's call; IP is spent between sessions, and the sheet doesn't police either. |
| Admin's CP echo; the Character tab's "N CP" | `sheet.js` ~2339, ~589 | PQ7. |
| GM mode | `gm.js` | **Not a reader** of a character's Advantages, IP log or SAN (`grep -n "advantages\|ip.log\|san" src/ui/gm.js`). Confirm. |
| Archetype and Advantage ids in code | the A8 guard | **No id in code:** `creationOnly`, `universal` and `pointsGranted` decide; no `long-lived`, `educated` or `pact` in `src/`. Educated's PQ4 gate is a data field (`flagged`/`flagNote`/`playerNote` on the entry, read by `advantageOffer` when the IP buy asks), not its id. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `docs/WISHLIST.md` W89; `docs/reference/rulings-2026-10-10.md` Q24, Q25.
- `private/crb/0450_Advancement.md`: *Improvement Points* (5 an hour), *Spending Improvement Points* (the table and the paragraphs under it). `0440_Disadvantages.md`: Minor Insanity, Pact.
- `SCHEMA.md` §4: **13**, **14**, **142**, **152**, **159**, **194**, **206**, **217**; §3's `progression.ip.log` and `sessions`.
- `src/engine/engine.js`:
  - `ipState`, `ipCost`, `spendIP`, `grantIP` (~2054–2121);
  - `minorChoice`, `planMinorChoice`, `takeMinorChoice` (~2356–2470): Talented, Redeemed and Steadied are your models;
  - `canBuyAdvantage` (~120), `requirementState` (~4140), `optionLock` (~4124), `canonicalEntry` (~4108), `heldRank` (~4112), `picksFor` (~4170), `setSelection` (~4201), `trimSelections` (~4231);
  - `sanState` (~1977), `hlState` (~793);
  - `logSession` (~2477), `closeOutDraft` (~5692, the hours rule);
  - `versionCheck` (~4572–4652).
- `src/ui/sheet.js`: `renderShProgression` (~1487), the raise modals (`openRaisePicker`, `raiseIP`, ~2811), `renderShSessions` (~1595) and Log's handler (~3415), the Character tab's trait cards (~577–599).

## 7. Out of scope

- **Computing Minor Insanity's −5% SAN a rank.** It's text today; fix only its "during play".
- **Talented's missing pick** (PQ5's wish), and **any change to Talented** but PQ3's `creationOnly`.
- **Enforcing "between sessions"**, or Pact's release condition.
- **GM mode's close-out reaching a character** (S3b's seats).
- **Selling an Advantage back for IP**, or buying a Disadvantage *on* in play.
- **P12b** (Training, a new Martial Arts style).

## 8. The shapes

**Data:**

```
"ip": {
  "perHour": 5,                                        // perSession removed
  "advantageCost":      { "timesPoints": 10 },         // 0450: cost × 10 a rank (Q24: flat)
  "disadvantageBuyOff": { "timesPoints": 10 },         // 0450: pointsGranted × 10 a rank
  "restore": { "sanPerPoint": 5, "healthLevel": 25 },  // 0450
  ... (statIncreaseCost, skillIncreaseCost, powerIncreaseCost, rankCap, cannotRaiseDirectly, notes: unchanged)
}
// Educated (PQ4 default): "flagged": true, "flagNote": "F-next: ...", and a playerNote for the IP buy's row.
// Minor Insanity: "during play" → "between sessions".
```

**Engine** (each returns `{ ok:false, why }` and writes nothing on a refusal):

1. **`advantageOffer(ch, def)`** → `{ ok, why }`. It refuses:
   - not `canBuyAdvantage` (Decision 152);
   - `requirementState(…).ok` false;
   - `optionLock(…).locked`;
   - `creationOnly`;
   - and, for the IP buy only, a flagged entry (PQ4).

   Talented calls it with its own `cost ≤ 5` on top.
2. **`ipCost(ch, "advantage", id)`** → `{ ok, cost, from, to, name, isNew, picks }`, where `picks` is what the new rank asks (`picksFor`'s, PQ5).
   - **Held:** `from` is `heldRank(ch, "advantage", id)`, and it's refused at `maxRank`.
   - **New:** `from` 0, and it must pass `advantageOffer`.
   - `cost` is `def.cost × timesPoints`.
3. **`ipCost(ch, "disadvantage", id)`** → `{ ok, cost: pointsGranted × timesPoints, from: rank, to: rank−1, name }`. It's refused when the Disadvantage isn't held.
4. **`ipCost(ch, "restore", "san", n=1)`** → `{ ok, cost: n × sanPerPoint, from: loss, to: loss−n, count:n }`. Here n is a whole number from 1 to the loss; nothing lost, or n out of range, is refused.
5. **`ipCost(ch, "restore", "massiveLevel")`** → `{ ok, cost: healthLevel, from: massive, to: massive−1 }`, refused at 0 Massive levels.
6. **`spendIP(ch, targetType, targetId, note, extra)`**: `extra` is `{ count }` for a SAN restore, or `{ picks: { <pickId>: value } }` for an Advantage. One journal entry. Picks are written with `setSelection` on the row the rank landed on, in the same call.
7. **The skill fallback** refuses an id that isn't a skill.
8. **`versionCheck`** skips `advantage`, `disadvantage` and `restore` entries.
9. **Total:**
   - junk ids, `n` as text, NaN, negative, fractional or past the loss are each refused, and nothing is written;
   - a hostile journal entry (`targetType:"advantage"`, `targetId:{}`) renders as text, and `versionCheck` doesn't throw.

**The saved file:** unchanged in shape (§2), unless PQ6 stores `hours`.

## 9. The UI (behaviour, not markup)

- **Progression's raise row** gains **Buy an Advantage**, **Buy off a Disadvantage** (only with one held) and **Restore** (only with SAN or a Massive level lost). Each opens a modal like Raise a Skill's: rows with the move, the price, and a button that's off with its reason. A buy keeps the modal open with new prices (Decision 159).
- **Buy an Advantage:**
  - the held ones first ("Favored Skill · rank 1 → 2 · 50 IP"), then the ones you could take, with a search;
  - a row that needs a pick shows its select or text field, and Buy is off until a select is chosen (text may stay empty, Decision 78);
  - a flagged one (PQ4) shows its `playerNote`, with no Buy.
- **Buy off a Disadvantage:**
  - each held one shows its move ("rank 2 → 1" or "removed") and price, with its description in a disclosure, so Pact's condition is read first;
  - a one-line note says no Character Points come back.
- **Restore:**
  - SAN: a stepper from 1 to what was lost, "Restore 10 SAN · 50 IP";
  - a Health Level: "Restore a Health Level · 25 IP", shown with the Massive count. Withering isn't offered.
- **IP Journal:** the new entries read in words, never an id.
- **Session Log:**
  - Hours (a number, min 0, step 0.5) beside IP. IP fills as Hours changes until IP is typed, as the close-out does.
  - The header copy says "5 IP an hour of play, 1 Milestone Point, and LUCK refreshes".
  - Log is off with neither (PQ8).
- **Mark for a voice pass:** every new line.

| Press | Where the record lands | Where focus goes |
|---|---|---|
| Buy an Advantage → Buy (held) | row rank +1 on the bought row; journal entry; one commit | stays on that row's Buy, the price re-read |
| Buy an Advantage → Buy (new, with a pick) | new row with `selections`; journal; one commit | the row's Buy (now "rank 1 → 2" or off at max) |
| Buy off → Buy off (rank 1) | row removed, selections trimmed; journal | the next row's button, or Done if none is left |
| Restore → SAN ×n | `san.loss − n`; journal | stays on Restore, stepper reset to what's left |
| Restore → Health Level | `massiveLevels − 1`; journal | stays, or Done at 0 |
| Session Log → Log | `sessions` +1 with `ipEarned`; LUCK refreshed | as today |
| Undo (toast) | everything above in one step | as today |

**Nothing to do:**
- no Disadvantage held: no Buy off button;
- nothing lost: no Restore button;
- every Advantage at its max or barred: each row says why, never an empty modal.

## 10. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. Ruling tests in `rules.test.mjs` cite `0450` or `rulings-2026-10-10.md`.

| Test name | File | Setup → result |
|---|---|---|
| `P12a 1: an Advantage costs its points × 10 a rank, every rank the same` | rules | Favored Skill (5): new → 50, rank 1 → 2 → 50, rank 4 → 5 → 50; at rank 5 refused. Per `0450` and Q24. |
| `P12a 2: a Disadvantage comes off at its points × 10, a rank at a time, and gives no CP back` | rules | Minor Insanity rank 2 (1 point): −1 → rank 1, 10 IP; −1 → removed, 10 IP; `cp(ch).granted` falls by 2 and nothing is refunded. Pact (15): 150. |
| `P12a 3: a bought rank and a bought-off row act at once` | engine | Hard to Kill bought: `health(ch).hpPer` +1. Unlucky bought off: `grants(ch).luckCost` loses its deltas. **Asserted on the computed values.** |
| `P12a 4: lost SAN and a maimed Health Level come back at 5 and 25, never past the loss` | rules | loss 12: restore 10 → 50 IP, loss 2; restore 3 refused; restore 2 → 0. Massive 2: restore → 25 IP, 1. Massive 0 refused. Withering untouched. |
| `P12a 5: who may buy what` | engine | A Vampire: a non-Universal Advantage refused (Decision 152). A prerequisite unmet: refused. Long-Lived refused for IP **and gone from Talented's offer**. Educated: refused with the flag's note (PQ4). |
| `P12a 6: a pick is asked and saved with the rank` | engine | Favored Skill new with `{ picks:{ skill:"handgun" } }` → the row has its selection; with no pick → refused, and nothing written. Immunity with empty text → bought. |
| `P12a 7: the journal names it and versionCheck doesn't call it a hand edit` | engine | One of each new kind spent → `versionCheck(ch)` is `[]`. **On `main` it reports each as an IPE mismatch.** |
| `P12a 8: an unknown kind or id is refused, never priced as a skill` | engine | `ipCost(ch, "advantage", "nope")`, `ipCost(ch, "wat", "x")`, `spendIP(ch, "skill", "favored-skill")` → refused; `ch.skills` unchanged. **On `main` the first prices 25.** |
| `P12a 9: a session's IP is 5 an hour, rounded up` | rules | 3 h → 15; 2.5 h → 13; 0 → 0. Per `0450`. |
| `P12a 10: Buy an Advantage from Progression` | smoke-sheet-progression | Favored Skill rank 1: open, Buy → rank 2 with its pick chosen, IP −50, the journal reads "Advantage: Favored Skill 1 → 2", the modal stays open, one Undo restores it all. |
| `P12a 11: Buy off and Restore from Progression` | smoke-sheet-progression | Buy off Minor Insanity to removed; Restore 10 SAN; Restore a Health Level. Each is one commit, its journal line, and no banner after a reload (`loadFindings`). |
| `P12a 12: the Session Log counts hours` | smoke-sheet-progression (or the sessions smoke file) | Type 3 → IP shows 15; Log → `ipEarned` 15. Type IP 20, then hours 4 → IP stays 20. Neither → Log off with its reason. No "10 IP" anywhere in the copy. |

## 11. Tests beyond §10

- **Totality:** add a character with a junk journal (`targetType:"advantage"`, `targetId:{}`, `from:"x"`) to `degenerates()`. `ipCost` and `spendIP` with every junk argument; `versionCheck` doesn't throw.
- **Hostile:** a file whose journal entry names `"<img onerror>"` as an Advantage renders as text in the IP Journal.
- **Data-key guard:** `timesPoints`, `sanPerPoint` and `healthLevel` are read; `perSession` is gone from data and code.
- **Voice:** the new copy passes `voice.test.mjs`, and no flag id renders (constraint 9: F-next lives in `flagNote`).
- **The A8 guard:** no Advantage or Disadvantage id in `src/engine` or `src/ui`.
- **Phone width:** `npm run phone-check`, and the three modals at 375px.

## 12. Mutants, each of which must fail a test

List them in the PR and the log. Each line says what else could cover it.

1. The skill fallback accepting any id (P12a 8). **Second path:** `spendIP`'s own check could also refuse, so assert on `ch.skills` unchanged.
2. `versionCheck` not skipping the new kinds (P12a 7). **Second path:** none; this is the banner.
3. A rank priced by rank (`cost × 10 × rank`), not flat (P12a 1: rank 4 → 5 is 50, not 200).
4. A buy-off refunding CP or leaving the row at rank 0 (P12a 2, asserted on the saved row).
5. A restore past the loss (P12a 4: restore 3 with loss 2 refused, **asserted on `san.loss`**, not on the view).
6. `advantageOffer` without `creationOnly` (P12a 5: Long-Lived in Talented's offer).
7. A pick-needing rank bought without its pick (P12a 6).
8. Session IP rounded down (P12a 9: 2.5 h → 13, not 12).
9. A natural row raised instead of the bought one (P12a 10's Professional case, asserted on `source`).

## 13. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals. Ken's answers to PQ1–PQ8 are in §4.
2. Write §10's rows. Run them on `main`'s code and keep the output.
3. Data (§8), then the engine (§8.1–9). `npm run test:fast`.
4. The UI (§9). `npm run verify`.
5. **Run it in the dev preview** (`shadows-dev-preview`):
   - a locked Professional:
     - buy Favored Skill up a rank with its pick;
     - buy a new Advantage;
     - read the journal and reload: no banner;
     - Undo each;
   - a Vampire: a non-Universal Advantage is off with its reason;
   - buy off Minor Insanity to removed; open Pact and read its condition;
   - lose 12 SAN and 2 Massive levels: restore 10, then a level;
   - Session Log: 3 hours → 15; type 20; log.
   - **Measure, don't eyeball** (P11's carry-over): each modal's Buy stays put after a buy (`getBoundingClientRect().y` before and after); read each new line beside its neighbours for a repeat; at 375px, `scrollWidth` = `clientWidth`.
6. Docs:
   - Decisions N and N+1 with their INDEX lines, and the supersession marks;
   - SCHEMA §2's `ip` and §3's journal kinds;
   - F-next (if PQ4's default) in §5 and INDEX §2;
   - W89 to `wishes-granted.md` (its "never rewritten" note corrected); W-next for PQ5's Talented gap and PQ7's CP echo;
   - the plan's P12a row;
   - CHANGELOG, then `npm run changelog`; versions per §2.
7. `npm run verify` and `npm run phone-check`.

## 14. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two. The likeliest: `setSelection` can't take a pick for a rank that doesn't exist yet, or `canonicalEntry` lands a rank on a natural row.
- **A code change outside:**
  - the engine functions named in §5 and §8;
  - the Progression tab, its modals and handlers, the Session Log and its handler, and the IP Journal renderer.
- An answer in §4 that reads differently from what you're about to build: they're Ken's, not yours.
- A test outside these **expected breaks** fails:
  - tests asserting the Session Log's "10 IP" or `D.ip.perSession` (`grep -rn "perSession\|10 IP" tests/`);
  - the data-key guard, until the new `ip` keys are read;
  - a Talented test that lists Long-Lived among its options;
  - `rules.test.mjs` ~270's `creationOnly` test, if it asserts who reads the field.

## 15. Close-out and review checklist

**Close-out:** the close-the-session skill, *Rule or shape* tier. That covers:
- Decisions N and N+1 and their INDEX lines;
- the flag, if PQ4's default;
- the log entry, with the mutants;
- `shipped.md`'s row;
- the plan's P12a row; W89 granted;
- CHANGELOG plus `npm run changelog`;
- versions per §2;
- STATE rewritten (wherever IP and Advancement live in §3).

Suggested CHANGELOG lines (player voice):

- **IP buys Advantages.** On Progression, Buy an Advantage takes a new one or a rank of one you hold, at its points × 10 a rank. Buy off a Disadvantage takes one off a rank at a time, the same way.
- **IP brings back what the city took.** Restore lost SAN at 5 IP a point, or a Health Level lost to a maiming at 25, never past your maximum.
- **A session's IP counts the hours.** The Session Log asks how long you played, at 5 IP an hour, the book's rate. It no longer grants a flat 10.
- **Talented no longer offers Long-Lived**, which can only be taken when a character is made.

**Review checklist:**

- [ ] §10's twelve tests exist with those names, and the PR shows them run on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR, **including every other writer of the rows, SAN and Massive levels**, and `versionCheck`'s banner.
- [ ] `git diff origin/main --stat -- src/engine src/ui` touches only what §14 allows.
- [ ] No Advantage, Disadvantage or archetype id in `src/` (the A8 guard passes).
- [ ] Decisions N and N+1 pass `docs.test.mjs`; *Replaces* checked against the ledger's text (13, 159, 206 and 217 marked).
- [ ] `perSession` is gone from data and code; nothing says "10 IP".
- [ ] The dev-preview run happened (§13.5), with the measurements, Undo, a reload and phone width.
- [ ] Mutants are listed in the PR **and** the log, with 2 and 5 asserted on the saved object or the banner.
- [ ] `npm run verify` and `phone-check` are green; versions are per §2, and the PR says which case.

## 16. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P12a-ip-beyond-ranks.md` and `<id>` = **P12a**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **`ipCost` prices anything it doesn't know as a skill.** Put the new kinds before the fallback, and make the fallback refuse a non-skill id, or a typo writes a junk skill.
> 2. **`versionCheck` reads every non-spell, non-power journal entry as an IPE.** Skip the new kinds, or every buyer gets a "edited by hand" banner on every page, from the next load on.
> 3. **Flat, not by rank** (Deighton Q24): rank 4 → 5 costs what rank 0 → 1 does.
> 4. **A buy-off refunds nothing**, and a restore never passes what was lost. Withering isn't a maiming.
> 5. **One eligibility rule** (`advantageOffer`) for IP and Talented, with `creationOnly` in it. Talented keeps its own 5-point limit.
> 6. **No id in code:** `creationOnly`, `universal`, `pointsGranted` and the flag decide, never `long-lived`, `educated` or `pact`. Write a regex into a file with the editor, never through a shell heredoc.
>
> Tier: Rule or shape. Two numbered decisions, the next free; one flag, F-next (Educated, PQ4). No schema bump (PQ6: hours aren't stored). Versions per §2. Use the close-the-session skill at the end.
