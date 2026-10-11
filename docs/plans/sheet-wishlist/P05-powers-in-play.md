# Work order P5 — Powers learned in play, and custom powers

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W72, W106**
(`WISHLIST.md`); Decisions 153, 154, 157, 194, 196, 200, 215.
**Status:** **drafted 2026-10-11 by Claude (Opus)**, pre-flighted against
`main` after #167 (0.41.0's release). **Approved by Ken 2026-10-11:** PQ1,
PQ2 and PQ5 on their defaults; PQ3, PQ4 and PQ6 answered (§4). Ready to build.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** It touches `engine.js`, `sheet.js` and `wizard.js`, maybe a
few `appCopy` lines in `shadows-data.js`, plus tests and docs. Nothing in
`gm.js` or `private/`.

**What P5 is.** Ken asked for it on 2026-10-11, after P3 gave Vampires and
Werewolves their Innate powers and let CP raise a held power. It was P11's
W72, pulled forward (the plan renumbers P5–P15 to P6–P16), plus W106. The
Progression button **Raise a Power** becomes **Buy or Raise a Power**, with
two new parts:

- **Learn a new power**: a power of your own Bloodline or Origin that
  creation didn't place, bought outright with IP at `0450`'s new-power
  price (40).
- **Custom power**: something the GM grants that no book lists, as a name
  and a written description. 40 IP in play; free from Admin.

And the wizard's CP step gets **Custom power** too, for a GM building a
character at the table: 5 CP, or free as a GM grant.

Decision 215's own *Revisit if* names this: "W72 lets IP learn an unheld
power".

---

## 1. Goal

When P5 is merged:

1. **A Vampire or Werewolf can learn an unheld power.** Buy or Raise a Power
   lists every power of the character's own Bloodline or Origin that it
   doesn't hold, under **Learn a new power**, at 40 IP each. Learning holds
   it at rank 1. From there it raises like any other, current rank × 20.
2. **A power with no ranks can be learned too.** Deathless Resilience (a
   Draugur's) is held once learned, at 40, and then shows "has no ranks".
3. **Any character can be given a custom power in play.** Buy or Raise a
   Power ends with **Custom power**: a name and a description. It costs the
   new-power price, 40 IP. **On Admin** the form has an IP cost box instead,
   blank or 0 for free (Decision 154's "Admin adds free"). It's stored as a
   written power row, shows on the Character tab with the archetype's own
   powers, prints, and raises like a written power (1 + IP).
4. **A custom power at creation.** The wizard's CP step has a **Custom
   power** form for every archetype but the write-in one (whose powers are
   already written, and free, at creation: XQ2). It costs one power rank's CP,
   `powerRankCost()` (5, Decision 157), or nothing with **GM grant (free)**
   ticked. It starts at rank 1. CP doesn't raise it; IP does, in play.
5. **The button shows for every character**, since Custom is open to all.
   A Professional with no powers sees only Custom.
6. **One commit, one Undo** for each learn and each custom power in play,
   with the journal entry naming it.
7. **Character schema 0.21:** a written power row gains `boughtWithCp`, so
   `cp()` can count what creation spent on it. `migrate()` gives every
   existing row `false`.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It changes which powers a character can hold,
  opens written powers to every archetype, and adds a field to the save file.
  One numbered decision, **N** (the next free number on `origin/main` when
  you write it).
- **App: minor** (`npm run bump -- 0.42.0`, or the next minor if one lands
  first). A new capability.
- **Game data: no bump**, unless you add content a character can observe. An
  `appCopy` string isn't (Decision 68).
- **Character schema: 0.21**, with its `migrate()` step in the same commit.
  Any *other* new field is a *Stop and ask* (§11).
- **CHANGELOG** lines under `[Unreleased] — app 0.42.0`, in player voice.

## 3. The decision, drafted

Write this as Decision **N** in `SCHEMA.md` §4, with its INDEX §3 line under
the powers topic, and mark what it replaces.

```
N. **A Vampire or Werewolf learns an unheld power of its own Bloodline or Origin with IP; any character can be given a custom written power: 40 IP in play or free on Admin, 5 CP at creation or free as a GM grant.**
     *2026-10-1x · Ken + Claude · Touches: archetypePowers, powerRanks, powerIpe, ipCost, spendIP, newPower price, Buy or Raise a Power, Raise a Power, Learn a new power, Custom power, addCustomPower, addPower, hasPowers, ownPowers, written power, powerRow, boughtWithCp, powerCost, cp, powerRankCost, CP step, versionCheck, Character tab powers, Admin, character schema 0.21, W72, W106*
     - **Decided:** Under `powersBought`, a power of the character's own specialization is held if a Base Power placed a rank in it or IP bought one (`powerIpe` > 0). One never held lists under **Learn a new power** at rank 0; its first rank costs `ip.powerIncreaseCost.newPower`, and a power with no ranks is held once learned. Written powers (`powers`) are open to every archetype: **Custom power** adds one, a name and a description, for the new-power price in play (Admin: any cost, blank for free), or for `powerRankCost()` CP at creation (or free, a GM grant), marked `boughtWithCp`. Progression's button is **Buy or Raise a Power**. Schema 0.21.
     - **Why:** Ken (2026-10-11): what creation didn't buy should be learnable in play, as a Discipline is, and a GM needs to grant what no book lists, at the table or mid-campaign.
     - **Rejected:**
       - Another Bloodline's or Origin's powers (PQ1): Cursed Evolution's and Splice's door (VQ4), and the thing that makes a Bloodline one.
       - A separate `learned` list (PQ2): a schema bump to leave out powers saved Werewolves already paid for.
       - Custom power for the supernatural archetypes only (PQ3): a GM's grant is the campaign's business.
       - A free-grant box in normal play (PQ4): anyone could tick it. Admin is the GM's free path, as Decision 154 has it.
       - A GM-named CP price, or CP ranks past 1 (PQ6): no book price behind either; IP raises it in play.
       - The CP mark in `archetypeChoices.powerCp`: the wizard prunes that map to the specialization's powers, which would make a paid custom power free.
       - No rank on a custom power (PQ5): Decision 194 gives every power one.
     - **Replaces:** Decision 215 in part (a held power is placed or learned, not only placed). Decision 153 in part (written powers aren't only the write-in archetype's). Extends 194 (rank 0 → 1 at the new-power price, as for a Discipline) and 157 (one CP price for a power rank).
     - **Revisit if:** Cursed Evolution or Splice opens another Bloodline's powers (VQ4), or a custom power needs mechanical fields.
     - **Built:** app 0.42.0, schema 0.21, PR #…, log 2026-10-1x.
```

Supersession marks: Decisions 215 and 153 each get
`→ **Superseded in part by Decision N**` with the clause above, and their
INDEX lines `→ **superseded in part by N**`.

## 4. Questions for Ken — answered 2026-10-11

| Id | Question | Answer |
|---|---|---|
| PQ1 | **Which powers can be learned.** | **Default: its own Bloodline's or Origin's** (`powerPool`), the ones it doesn't hold. Innate powers are all granted already. Another Bloodline's are Cursed Evolution's and Splice's door (VQ4). |
| PQ2 | **A saved Werewolf's leftover IP.** P3's PQ2 left IP spent on an Origin power in `powerIpe` when that power stopped being held. Under P5, IP in `powerIpe` means held. | **Default: it comes back, at the ranks its IP bought.** A Werewolf that raised Apex Fury 1→2 before 0.40 (20 IP) holds it again at rank 1, and `versionCheck` stops reporting it. |
| PQ3 | **Who gets Custom power, and is it the same button?** | **Every character, one button, renamed Buy or Raise a Power.** There was never a separate "buy a power" button: Raise a Power was the only power button on Progression, and Raise a Skill already teaches new skills under its own name. A GM adding a custom power wouldn't look under "Raise", so the name says both. |
| PQ4 | **What a custom power costs in play.** | **The new-power price, 40 IP. Free only from Admin**, where the form has a cost box (blank or 0 is free), as Admin's free Add power does (Decision 154). No free tick box in normal play. The write-in archetype's Add power on Loadout & Powers is unchanged, at 40. |
| PQ5 | **What a custom power holds.** | **Default: a name and a description**, stored as a written power row, `uses` left blank. It has a rank (1 + IP, Decision 194), so Buy or Raise a Power raises it at 20 × rank. **Improve** (Decision 154) and Admin's edit and Remove work on it wherever it's shown. |
| PQ6 | **A custom power at creation** (Ken's addition to PQ4: "letting a GM add a custom power for a specific character a table is building"). | **5 CP (`powerRankCost()`, Decision 157), or free with GM grant (free) ticked.** Rank 1; CP doesn't raise it. The CP is marked on the row (`boughtWithCp`, schema 0.21), not in `powerCp`, which the wizard prunes on a specialization change. |

## 5. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- Decisions **153, 154, 157, 194, 215** in `SCHEMA.md` §4 (INDEX §3 says
  where).
- `src/engine/engine.js`:
  - `archetypePowers`, `isGranted`, `powerPool`, `basePowersOf`,
    `basePowerState` (around 2455–2510). **Who holds what.**
  - `powerCpOf`, `powerCpSpent`, `buyPowerRank`, `cp` (~566, ~2536–2577).
    **Where creation's CP is counted.**
  - `powerRanks` (~2737). **What the modal lists.** It already lists a
    Discipline at rank 0 as learnable. That's the model.
  - `ipCost` and `spendIP`, the `power` branch (~1850–1885). Rank 0 is
    already priced at `newPower`.
  - `hasPowers`, `powerRow`, `ownPowers`, `rankedOwnPowers`,
    `archetypeContent`, `addPower`, `powerCost`, `newPowerCost`,
    `improvePower`, `newPower`, `removePower` (~2770–2875).
  - `migrate()`: the `powers` normalization (~3240), and the schema steps.
  - `versionCheck`'s power branch (~3945) and its `powerCp` orphan check
    (~3807).
- `src/ui/sheet.js`:
  - `renderShProgression` (~1220): the button row, gated on `powerRanks`.
  - `RAISE_TITLE`, `raiseResultsHtml`, `openRaisePicker`, `raiseIP`
    (~2500–2600).
  - `powersPanelHtml`, `powerFieldsHtml`, `powerCostHtml`,
    `openImprovePower` (~1520–1575): the write-in archetype's written-power
    UI, to reuse.
  - The Character tab's Powers block (~486–506). It already renders written
    rows (`p.custom`).
- `src/ui/wizard.js` `renderCP` (~532): its Powers section (~605–625) is
  where the creation form goes; and the archetype-step handler (~854–889),
  which prunes `powerCp`.
- `src/ui/shared.js` `resetArchetypeChoices` (~773): an archetype change
  clears `powers` (Decision 153's XQ3), creation's custom ones included.
  That stays.

## 6. Out of scope

- **Another Bloodline's or Origin's powers** (PQ1): Cursed Evolution, Splice, VQ4.
- **Learning a book power in the wizard.** Creation is Base Powers and CP,
  unchanged. Only Custom power is new there.
- **W89** (Advantages with IP) and **W39** (Martial Arts styles), which stay
  in P12.
- **Mechanical fields on a custom power** (damage, cost, drain). Text only.
- **The write-in archetype**: its Add power (40 IP in play), and its free
  powers at creation, stay as Decisions 153 and 194 left them. It sees the
  Custom part in the modal like everyone else, and it does the same thing.
- The one-word "1 Stat Points left" fix from P4's review can ride along as a
  Fix line, if you like: pluralize it.

## 7. The shape

### 7a. Engine

1. **`archetypePowers`: a power is held if placed, granted, or learned.**
   For `powersBought`, hold a pool power when `isGranted`, or
   `placed[p.id] > 0`, or `powerIpeOf(ch, p.id) > 0`. For a ranked one,
   `start` is `placed[p.id] || 0` for a non-granted power (today it's
   `placed[p.id]`, which is `undefined` for a learned one, so `rank` would
   be `NaN`). `rank = start + cp + ipe`. **An unranked power reads `ipe`
   as 0 today** (`ranked ? powerIpeOf : 0`). Held-ness must read the raw
   `powerIpeOf` anyway, so a learned Deathless Resilience is held at rank 1.
2. **`powerRanks`: list the unheld ones at rank 0.** After the archetype's
   held powers, add each `powerPool` power that isn't granted and isn't held,
   `{ id, name, kind:"archetype", rank:0, ipe:0, maxRank, ranked, learn:true }`.
   These are for the modal only. `archetypeContent` keeps reading
   `archetypePowers`, so the Character tab never shows an unheld power.
3. **`ipCost`, power branch.** Rank 0 is already `newPower`. Change the
   `ranked===false` refusal so it refuses only at rank ≥ 1. An unranked
   power at rank 0 costs `newPower`, `to: 1`.
4. **`spendIP`** needs nothing new. It already writes `powerIpe[id] += 1`.
   Check that the journal entry's `name` is the power's.
5. **Written powers for everyone.** `hasPowers` gates `ownPowers`, `addPower`,
   `improvePower` and `newPower` on the archetype having a `powers` panel.
   Split it: `ownPowers`, `improvePower`, `removePower` and the new
   `addCustomPower` work on any archetype. `newPower` (the wizard's blank row)
   and `addPower` (the write-in's Add power) keep the panel gate.
6. **`addCustomPower(ch, { name, effect, cost, free }, { admin, creation })`.**
   One function, three prices:
   - **in play**, not Admin: `newPowerCost(ch)` (40, refused if IP is
     short); a journal spend as `addPower` writes one;
   - **in play, Admin**: `powerCost(ch, cost, true)` (blank or 0 free);
   - **at creation** (`creation: true`; the character isn't locked): no IP.
     `free` false means `boughtWithCp: true`, refused if `cp(ch).left <
     powerRankCost()` ("No Character Points left."); `free` true means
     `boughtWithCp: false`.
   It refuses a blank name ("Give the power a name."). It writes a
   `powerRow` with `uses: ""`. Returns `{ ok, id, cost }` or `{ ok:false, why }`.
   Refusing a creation call on a locked character, and an in-play call on an
   unlocked one, keeps the two doors apart.
7. **`powerRow` gains `boughtWithCp`** (`r.boughtWithCp === true`). Everything
   that builds a row goes through it, so the field is normalized everywhere.
8. **`cp()` counts it.** A new `customPowerCpSpent(ch)` is
   `ownPowers(ch).filter(p=>p.boughtWithCp).length × powerRankCost()`, added
   to `spent`. It reads `ownPowers` (ungated, step 5), so a custom power
   counts on every archetype.
9. **`migrate()`, schema 0.21.** `SCHEMA_VERSION` → `"0.21"`. The `powers`
   normalization already runs every row through a shape; make sure it keeps
   `boughtWithCp` (a strict `true`) and gives an old row `false`. Bump the
   stamped version as the earlier steps do. A field added must survive a round
   trip (constraint 8).
10. **`archetypeContent`** already concatenates `rankedOwnPowers` for a
    non-write-in archetype. With `ownPowers` ungated, custom powers show up
    there and on the print page with no further change. Check it.
11. **`versionCheck`**: with PQ2, a held-by-IP power is in `powerRanks`, so
    the "isn't on the sheet any more" message goes for it on its own. Its rank
    count check (`raises !== ipe`) must still hold for a learned power: the
    learn is a spend with `to: 1`, so it counts.

### 7b. UI, the sheet (`sheet.js`)

1. **The button is Buy or Raise a Power, and always shows.**
   `RAISE_TITLE.power` → `"Buy or Raise a Power"`, the button the same, and
   the `powerRanks(ch).length` gate goes.
2. **The modal has up to three parts**, each with a `.sect` heading, as Raise
   a Skill does: **Your powers** (today's rows); **Learn a new power** (the
   `learn` rows, button "Learn"; sub "Archetype power", or the
   specialization's own label if the data has one; never the archetype's id
   in code, Decision 135); **Custom power** (a small form, 3). An empty part
   is left out.
3. **The Custom power form:** Name (required) and Description (a textarea).
   Not Admin: the price is shown ("40 IP · You have N IP"), no box. **Admin:**
   an IP cost box, blank for free (reuse `powerCostHtml(…, free=true)`). An
   **Add** button. A refusal shows its `why` with `notice()` and keeps what was
   typed (try it on a `clone(ch)` first, as `openImprovePower` does). On
   success: one `commit("power", …)`, labelled `Custom power: <name> (<cost>
   IP)` or `… (free)`, and the modal re-renders with the power under Your
   powers.
4. **Learn** goes through `raiseIP`, as Raise does. Its label reads
   `IP: <name> learned (−40)`, not `0→1`.
5. **The Character tab**: a custom power's card gets **Improve** in play and
   the write-in panel's fields and **Remove** on Admin. Reuse
   `powersPanelHtml`'s row markup and handlers; don't write a second copy.
   On the write-in archetype they stay on Loadout & Powers, where they are
   now. Don't show them twice.

### 7c. UI, the wizard (`wizard.js`)

1. **`renderCP` gets a Custom power section**, after Powers, for every
   archetype that isn't a write-in (the write-in already writes its powers
   on the Archetype step). Heading: "Custom powers — a GM's, 5 CP each, or
   free" (the 5 read from `powerRankCost()`).
2. **Each custom power** is a card: its name, "5 CP" or "GM grant", its
   description, and **Remove** (creation isn't locked; nothing to undo).
3. **The add form:** Name, Description, a **GM grant (free)** checkbox, and
   **Add**. The Add button is disabled with its reason when CP is short and
   the box isn't ticked. Calls `addCustomPower(ch, input, { creation:true })`,
   then `update()`.
4. **`validate()`** needs nothing new: `cp()` counts the spend, so an
   overspend shows where it always has.
5. Copy follows `VOICE-APP.md`; the section's note is tool voice: "For a
   power your GM gives this character. Write what it does; the sheet doesn't
   roll it." If it goes in `appCopy`, `powerCustomNote`.

## 8. Worked examples (pin these)

| Character | Before | Action | After |
|---|---|---|---|
| Street Level Strigoi, locked, Shadow Play placed 1, 100 IP | Learn list: Nightmare Echo, Veil of Night, Bone Spines, Monstrous Maw, Rending Claws; nothing Upyr's or Draugur's | Learn Veil of Night | Veil of Night rank 1; 60 IP; journal `to: 1, amount: 40`; one Undo puts it back on the Learn list at 100 IP |
| same | Veil of Night rank 1 | Raise it | rank 2, cost 20 |
| Draugur, 50 IP, Deathless Resilience not placed | Learn list shows it, 40 | Learn | held; 10 IP; its row says "Deathless Resilience has no ranks." |
| Trueborn Werewolf saved at 0.39 with `powerIpe { "apex-fury": 1 }`, nothing placed | today: Apex Fury not held, `versionCheck` reports it | open in 0.42 | Apex Fury held at rank 1 (PQ2); no `versionCheck` issue |
| Professional, locked, 50 IP | no power button today | Custom power "Ghost Sight" | held, rank 1, on the Character tab; 10 IP; journal names it |
| same, on Admin | 50 IP | Custom power "Ghost Sight", cost blank | held, rank 1; 50 IP; no journal entry; audit "Custom power: Ghost Sight (free)" |
| Professional, locked, 30 IP, not Admin | — | Custom power | refused "Not enough IP (need 40)."; the form keeps what was typed |
| Ghost Sight at rank 1 | — | Raise it | rank 2, 20 IP |
| Werewolf in the wizard, 7 CP left | — | Custom power "Moon-Eye", not ticked | `boughtWithCp: true`; 2 CP left; rank 1 on the sheet after lock |
| same, 2 CP left | — | Custom power, not ticked | Add disabled: "No Character Points left." Ticked: added free, 2 CP left |
| a saved 0.20 file with a write-in power row | — | `migrate()` | schema 0.21; the row has `boughtWithCp: false`; nothing else moves |

## 9. Tests

- **Engine** (`engine.test.mjs`): every row of §8 that doesn't need a
  browser, plus:
  - `archetypePowers` never yields `NaN`, for a learned power or anything
    `migrate()` can produce;
  - a granted Innate power is never on the Learn list, nor another
    specialization's;
  - `addCustomPower` refuses a blank name; in play off Admin refuses short IP;
    on Admin refuses a negative or fractional cost; at creation refuses short
    CP unless free; and refuses the wrong door for the lock state;
  - `cp()` counts a `boughtWithCp` row on a Vampire, a Werewolf, a
    Professional, and not a free one;
  - a specialization change in the wizard doesn't make a custom power free
    (the `powerCp` prune leaves `boughtWithCp` alone);
  - `newPower` and `addPower` still refuse an archetype with no `powers`
    panel (constraint 8: no throw on any character);
  - schema 0.21: a 0.20 file round-trips, `boughtWithCp` normalized.
- **Hostile** (`hostile.test.mjs`): `powerIpe` naming another Bloodline's
  power, or one that doesn't exist, holds nothing, and `powerRanks` doesn't
  throw; `boughtWithCp: "yes"`, `1` or an object comes out `false`.
- **Smoke** (`smoke.test.mjs`): Learn from the modal, then Undo; a Custom
  power on a Professional from the modal, then the Character tab shows it,
  then Admin removes it; the Admin form's blank cost is free; the button reads
  Buy or Raise a Power on a Professional with no powers; the wizard's CP step
  adds one for CP and one free, and the CP left moves by 5 for the first only.
- **Mutation-test** each new guard against the pre-fix code: the held-by-IP
  rule (drop the `powerIpeOf` clause), the own-specialization filter (use
  every power), the `start || 0` fix, the `hasPowers` split (leave
  `ownPowers` gated), `customPowerCpSpent` (drop it from `cp()`), and the
  Admin-only free path (let a blank cost be free off Admin).

## 10. Steps

1. `npm run verify` on a fresh branch. Note the totals.
2. Engine §7a 1–4 (learning), with its tests. `npm run test:fast`.
3. Engine §7a 5–9 (custom powers, `cp()`, schema 0.21), with their tests and
   the hostile ones.
4. Engine §7a 10–11, checked.
5. UI §7b, then §7c, with the smoke tests.
6. Run it in the dev preview (`shadows-dev-preview`): a Strigoi learns and
   undoes; a Professional gets a custom power in play and on Admin; a
   Werewolf gets one in the wizard. Screenshot the modal and the wizard
   section.
7. Decision N, its INDEX line, the two supersession marks; W72 and W106 to
   `log/wishes-granted.md`; CHANGELOG; the bump.
8. `npm run verify`, and `npm run phone-check` (the wizard's CP step and the
   modal both change layout).

## 11. Stop and ask

- If any part needs a field on the character other than `boughtWithCp`.
- If `powerIpe` > 0 on a pool power turns out to be reachable some way other
  than IP or PQ2's saved Werewolves, and holding it would be wrong.
- If the Character tab or print shows a custom power on a write-in archetype
  twice, and the fix isn't obvious.
- If a Learn row would need the archetype's id in code (Decision 135).
- If the write-in archetype's creation powers would start costing CP. They
  don't: they're written on the Archetype step, not with the CP step's form.

## 12. Close-out

Use the **close-the-session** skill. Rule-or-shape tier: Decision N and its
marks, STATE rewritten (P5 built), the log entry, `shipped.md`'s row, the
statuses for W72 and W106, CHANGELOG plus `npm run changelog`, the app bump,
and schema 0.21.

Suggested CHANGELOG lines:

- **Raise a Power is now Buy or Raise a Power.** A Vampire or Werewolf can
  learn a power its Bloodline or Origin has, for 40 IP.
- **Your GM can give you a custom power**, a name and what it does: 40 IP in
  play, or 5 Character Points when you make your character. It shows with
  your other powers and raises like them.

## 13. Review checklist

- [ ] §8's rows are pinned, and each passes.
- [ ] No `NaN` rank, anywhere, for any character `migrate()` can produce.
- [ ] A Vampire's Learn list is its own Bloodline's unheld powers, no more.
- [ ] Custom power works on every archetype, in play and at creation, and
      is shown once.
- [ ] Free only on Admin in play, and only with GM grant ticked at creation.
- [ ] Each learn and custom power in play is one commit, one Undo.
- [ ] Schema 0.21 round-trips; hostile `boughtWithCp` values come out false.
- [ ] Mutation tests noted in the PR.
- [ ] Decision N's shape passes `docs.test.mjs`; 215 and 153 marked.
- [ ] `npm run verify` and `phone-check` green; versions: app minor, schema
      0.21, no data bump.

## 14. Handing it over

Paste this as the first message of a fresh Sonnet session, once this order
is on `main`:

> Read `CLAUDE.md`, then `docs/plans/sheet-wishlist/P05-powers-in-play.md`,
> and build it. Ken approved it on 2026-10-11; its §4 has his answers to
> PQ1–PQ6. Follow its steps (§10) in order, and its *Stop and ask* list (§11)
> exactly. If something isn't covered by the order, stop and ask me rather
> than choosing. Where the order and the code or the ledger disagree in a way
> that doesn't stop you, build what the order says and list it in the PR
> under *Where the order didn't fit*. Open a PR when §13's checklist holds;
> don't merge it.
>
> Five things in this order are easy to get wrong:
>
> 1. **`start` is `undefined` for a learned power.** `archetypePowers` reads
>    `placed[p.id]`, which a learned power doesn't have. Use `|| 0`, or every
>    rank downstream is `NaN`, and `NaN` fails no `>=` check.
> 2. **An unranked power hides its IP.** `archetypePowers` sets `ipe` to 0
>    when `ranked` is false. Decide held-ness from `powerIpeOf` directly, or
>    a learned Deathless Resilience is paid for and never held.
> 3. **Split `hasPowers`; don't delete it.** The wizard's blank row and the
>    write-in's Add power keep the panel gate. Only reading, Improve, Remove
>    and the new `addCustomPower` open to every archetype.
> 4. **Don't put the creation CP in `archetypeChoices.powerCp`.** The wizard
>    prunes that map to the specialization's powers on every change, which
>    would turn a paid custom power free. It's `boughtWithCp` on the row,
>    schema 0.21, with its `migrate()` step in the same commit.
> 5. **Free is Admin's, in play.** Off Admin a custom power is 40 IP, with no
>    cost box. Show a custom power once: the write-in archetype already lists
>    them on Loadout & Powers.
>
> Tier: Rule or shape. One numbered decision (the next free number), a
> **minor** app bump, character schema 0.21, no data bump. Use the
> close-the-session skill at the end.
