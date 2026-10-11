# Work order P5 — Powers learned in play

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W72, W106**
(`WISHLIST.md`); Decisions 153, 154, 194, 196, 200, 215.
**Status:** **drafted 2026-10-11 by Claude (Opus)**, pre-flighted against
`main` after #167 (0.41.0's release). Waiting on Ken: PQ1–PQ5.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** It touches `engine.js` and `sheet.js`, maybe a line of
`appCopy` in `shadows-data.js`, plus tests and docs. Nothing in `wizard.js`,
`gm.js` or `private/`.

**What P5 is.** Ken asked for it on 2026-10-11, after P3 gave Vampires and
Werewolves their Innate powers and let CP raise a held power. It was P11's
W72, pulled forward (the plan renumbers P5–P15 to P6–P16). Two doors open
on **Raise a Power**, on Progression:

- **Learn** a power of your own Bloodline or Origin that creation didn't
  place, outright with IP, at `0450`'s new-power price (40).
- **Custom power**, for what the GM grants in the campaign: a name and a
  written description, and nothing else the app needs to know.

Decision 215's own *Revisit if* names this: "W72 lets IP learn an unheld
power".

---

## 1. Goal

When P5 is merged:

1. **A Vampire or Werewolf can learn an unheld power.** Raise a Power lists
   every power of the character's own Bloodline or Origin that it doesn't
   hold, under **Learn a new power**, at 40 IP each. Learning holds it at
   rank 1. From there it raises like any other, current rank × 20.
2. **A power with no ranks can be learned too.** Deathless Resilience (a
   Draugur's) is held once learned, at 40, and then shows "has no ranks".
3. **Any character can be given a custom power.** Raise a Power ends with
   **Custom power**: a name, a description, and an IP cost the GM names (blank
   or 0 is a free grant). It's stored as a written power row, shows on the
   Character tab with the archetype's own powers, prints, and raises like a
   written power (1 + IP).
4. **Raise a Power shows for every character**, since Custom is open to all
   (PQ3). A Professional with no powers sees only Custom.
5. **One commit, one Undo** for each learn and each custom power, with the
   journal entry naming it.
6. **No schema bump.** `progression.powerIpe` and `powers` already exist on
   every character, and `migrate()` already normalizes both.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It changes which powers a character can hold in
  play and opens written powers to every archetype. One numbered decision,
  **N** (the next free number on `origin/main` when you write it).
- **App: minor** (`npm run bump -- 0.42.0`, or the next minor if one lands
  first). A new capability.
- **Game data: no bump**, unless you add content a character can observe. An
  `appCopy` string isn't (Decision 68).
- **Character schema: no bump.** If you find you need a new field, that's a
  *Stop and ask* (§11).
- **CHANGELOG** lines under `[Unreleased] — app 0.42.0`, in player voice.

## 3. The decision, drafted

Write this as Decision **N** in `SCHEMA.md` §4, with its INDEX §3 line under
the powers topic, and mark what it replaces.

```
N. **A Vampire or Werewolf learns an unheld power of its own Bloodline or Origin with IP, at the new-power price; any character can be given a custom written power, at the GM's price or free.**
     *2026-10-1x · Ken + Claude · Touches: archetypePowers, powerRanks, powerIpe, ipCost, spendIP, newPower price, Raise a Power, Learn a new power, Custom power, addPower, hasPowers, ownPowers, written power, powerCost, versionCheck, Character tab powers, Admin, W72, W106*
     - **Decided:** Under `powersBought`, a power of the character's own specialization is held if a Base Power placed a rank in it or IP bought one (`powerIpe` > 0). One never held lists in Raise a Power at rank 0, and its first rank costs `ip.powerIncreaseCost.newPower`. A power with no ranks is held once learned. Written powers (`powers`) are open to every archetype: Raise a Power's **Custom power** adds one with a name and description, at an IP cost the GM names, blank or 0 for a grant. Creation is unchanged.
     - **Why:** Ken (2026-10-11): what creation didn't buy should be learnable in play, as a Discipline is, and a GM needs to grant what no book lists.
     - **Rejected:** <PQ1–PQ5's alternatives, as answered>.
     - **Replaces:** Decision 215 in part (a held power is placed or learned, not only placed). Decision 153 in part (written powers aren't only the write-in archetype's). Extends 194 (rank 0 → 1 at the new-power price, as for a Discipline).
     - **Revisit if:** Cursed Evolution or Splice opens another Bloodline's powers (VQ4), or a custom power needs mechanical fields.
     - **Built:** app 0.42.0, PR #…, log 2026-10-1x.
```

Supersession marks: Decision 215 and Decision 153 each get
`→ **Superseded in part by Decision N**` with the clause above, and their
INDEX lines `→ **superseded in part by N**`.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **Which powers can be learned.** "Any powers the Werewolf or Vampire has not gotten by character creation." | **Its own Bloodline's or Origin's** (`powerPool`), the ones it doesn't hold. Innate powers are all granted already, so nothing changes there. Another Bloodline's powers are Cursed Evolution's and Splice's door (VQ4), which `0413` gates, so they stay out. The alternative is every power the archetype prints, across all Bloodlines or Origins. That lets a Strigoi learn Iron Hide for 40 IP, past the one thing the book uses to say what a Bloodline is. |
| PQ2 | **A saved Werewolf's leftover IP.** P3's PQ2 left IP already spent on an Origin power in `powerIpe` when that power stopped being held. Today it's invisible, and `versionCheck` says so. Under P5, IP in `powerIpe` means held. | **It comes back, at the ranks its IP bought.** A Werewolf that raised Apex Fury 1→2 before 0.40 (20 IP) holds it again at rank 1, and `versionCheck` stops reporting it. It's the power the player paid for, and P3 already said placing a Base Power there "brings the power back with its IP ranks". The alternative is a separate `learned` list, which needs a schema bump and a migration that leaves those powers out. |
| PQ3 | **Who gets Custom power.** | **Every character**, so Raise a Power always shows. A GM handing a Professional something strange is the campaign's business. The alternative is Vampires, Werewolves and the write-in archetype only, and a Professional's GM uses Notes. |
| PQ4 | **What Custom power costs.** "A GM can grant a custom power." | **An IP cost box, blank or 0 for a free grant.** A grant writes no journal entry, but the audit trail logs it ("Custom power: Name (granted)"). The GM names any price. Decision 194 rejected the GM's price for the write-in archetype's **Add power**, because `0450` prices a new power. That doesn't apply here: a custom power is whatever the GM says it is. The write-in archetype's Add power on Loadout & Powers is unchanged, at 40. The alternatives are always free (no box), or always 40. |
| PQ5 | **What a custom power holds.** "Just a text explanation." | **A name and a description**, stored as a written power row, `uses` left blank. It has a rank (1 + IP, Decision 194), so Raise a Power can raise it at 20 × rank. **Improve** (Decision 154) and Admin's edit and Remove work on it wherever it's shown. The alternative is no rank, which adds a "has no ranks" case to written powers for no gain. |

## 5. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- Decisions **153, 154, 194, 215** in `SCHEMA.md` §4 (INDEX §3 says where).
- `src/engine/engine.js`:
  - `archetypePowers`, `isGranted`, `powerPool`, `basePowersOf`,
    `basePowerState` (around 2455–2510). **Who holds what.**
  - `powerRanks` (~2737). **What Raise a Power lists.** It already lists a
    Discipline at rank 0 as learnable. That's the model.
  - `ipCost` and `spendIP`, the `power` branch (~1850–1885). Rank 0 is already
    priced at `newPower`.
  - `hasPowers`, `ownPowers`, `rankedOwnPowers`, `archetypeContent`,
    `addPower`, `powerCost`, `improvePower`, `removePower` (~2770–2875).
  - `versionCheck`'s power branch (~3945).
- `src/ui/sheet.js`:
  - `renderShProgression` (~1220): the Raise row, gated on `powerRanks`.
  - `raiseResultsHtml`, `openRaisePicker`, `raiseIP` (~2500–2600).
  - `powersPanelHtml`, `openImprovePower` (~1540): the write-in archetype's
    written-power UI, to reuse.
  - The Character tab's Powers block (~486–506). It already renders written
    rows (`p.custom`).
- `src/ui/shared.js` `resetArchetypeChoices` (~773): an archetype change
  clears `powers` (Decision 153's XQ3). That stays.

## 6. Out of scope

- **Another Bloodline's or Origin's powers** (PQ1): Cursed Evolution, Splice, VQ4.
- **Learning in the wizard.** Creation is Base Powers and CP, unchanged.
- **W89** (Advantages with IP) and **W39** (Martial Arts styles), which stay
  in P12.
- **Mechanical fields on a custom power** (damage, cost, drain). Text only.
- **The write-in archetype's Add power**, which stays as Decision 194 left it.
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
   These are for Raise a Power only. `archetypeContent` keeps reading
   `archetypePowers`, so the Character tab never shows an unheld power.
3. **`ipCost`, power branch.** Rank 0 is already `newPower`. Change the
   `ranked===false` refusal so it refuses only at rank ≥ 1. An unranked
   power at rank 0 costs `newPower`, `to: 1`.
4. **`spendIP`** needs nothing new. It already writes `powerIpe[id] += 1`.
   Check that the journal entry's `name` is the power's.
5. **Written powers for everyone.** `hasPowers` gates `ownPowers`, `addPower`,
   `improvePower` and `newPower` on the archetype having a `powers` panel. Split
   it: `ownPowers`, `improvePower`, `removePower` and a new
   `addCustomPower(ch, { name, effect, cost })` work on any archetype.
   `newPower` (the wizard's blank row) and `addPower` (the write-in's Add
   power at 40) keep the panel gate. `addCustomPower` takes its cost through
   `powerCost(ch, raw, true)`, so blank or 0 is free and a number must be
   affordable. It writes a `powerRow` with `uses: ""`.
6. **`archetypeContent`** already concatenates `rankedOwnPowers` for a
   non-write-in archetype. With `ownPowers` ungated, custom powers show up
   there and on the print page with no further change. Check it.
7. **`versionCheck`**: with PQ2's default, a held-by-IP power is in
   `powerRanks`, so the "isn't on the sheet any more" message goes for it on
   its own. Its rank count check (`raises !== ipe`) must still hold for a
   learned power: the learn is a spend with `to: 1`, so it counts.

### 7b. UI (`sheet.js`)

1. **Raise a Power always shows** (PQ3). The button's `powerRanks(ch).length`
   gate goes.
2. **The modal has up to three parts**, each with a `.sect` heading, as Raise
   a Skill does: **Your powers** (today's rows); **Learn a new power** (the
   `learn` rows, button "Learn", sub "Bloodline power" or "Origin power" from
   the archetype's own words if the data has them, otherwise "Archetype
   power"); **Custom power** (a small form, see 3). An empty part is left out.
3. **Custom power form:** Name (required), Description (a textarea), IP cost
   (blank for a grant), and an **Add** button. A refusal shows its `why`
   with `notice()` and keeps what was typed (try it on a `clone(ch)` first,
   as `openImprovePower` does). On success: one `commit("power", …)`,
   labelled `Custom power: <name> (<cost> IP)` or `… (granted)`, and the
   modal re-renders with the new power under Your powers.
4. **Learn** goes through `raiseIP`, as Raise does. Its label reads
   `IP: <name> learned (−40)`, not `0→1`.
5. **The Character tab**: a custom power's card gets **Improve** in play and
   the write-in panel's fields and **Remove** on Admin. Reuse
   `powersPanelHtml`'s row markup and handlers; don't write a second copy.
   On the write-in archetype, they stay on Loadout & Powers where they are
   now. Don't show them twice.
6. Copy follows `VOICE-APP.md`. The Custom part's one-line note is tool
   voice: "For a power your GM grants. Write what it does; the sheet doesn't
   roll it." If it goes in `appCopy`, it's `powerCustomNote`.

## 8. Worked examples (pin these)

| Character | Before | Action | After |
|---|---|---|---|
| Street Level Strigoi, locked, Shadow Play placed 1, 100 IP | Learn list: Nightmare Echo, Veil of Night, Bone Spines, Monstrous Maw, Rending Claws; nothing Upyr's or Draugur's | Learn Veil of Night | Veil of Night rank 1; 60 IP; journal `to: 1, amount: 40`; one Undo puts it back to the Learn list at 100 IP |
| same | Veil of Night rank 1 | Raise it | rank 2, cost 20 |
| Draugur, 50 IP, Deathless Resilience not placed | Learn list shows it, 40 | Learn | held; 10 IP; Raise row says "Deathless Resilience has no ranks." |
| Trueborn Werewolf saved at 0.39 with `powerIpe { "apex-fury": 1 }`, nothing placed | today: Apex Fury not held, `versionCheck` reports it | open in 0.42 | Apex Fury held at rank 1 (PQ2); no `versionCheck` issue |
| Professional, 30 IP | no Raise a Power button today | Custom power "Ghost Sight", cost blank | held, rank 1, on the Character tab; 30 IP; no journal entry; audit "Custom power: Ghost Sight (granted)" |
| same | Ghost Sight rank 1 | Raise it | rank 2, 20 IP |
| any, 10 IP | — | Custom power, cost 15 | refused "Not enough IP (need 15)."; the form keeps what was typed |

## 9. Tests

- **Engine** (`engine.test.mjs`): every row of §8 that doesn't need a
  browser, plus:
  - `archetypePowers` never yields `NaN`, for a learned power or anything
    `migrate()` can produce;
  - a granted Innate power is never in the Learn list, nor another
    specialization's;
  - `addCustomPower` refuses a blank name, a negative or fractional cost, and
    a cost over the IP available;
  - `newPower` and `addPower` still refuse an archetype with no `powers`
    panel (constraint 8: no throw on any character).
- **Hostile** (`hostile.test.mjs`): `powerIpe` naming another Bloodline's
  power, or a power that doesn't exist, holds nothing, and `powerRanks`
  doesn't throw.
- **Smoke** (`smoke.test.mjs`): Learn from the modal, then Undo; Custom power
  from the modal on a Professional, then the Character tab shows it, then Admin
  removes it; Raise a Power is present on a Professional with no powers.
- **Mutation-test** each new guard against the pre-fix code: the held-by-IP
  rule (drop the `powerIpeOf` clause), the own-specialization filter (use
  every power), the `start || 0` fix, and the `hasPowers` split (leave
  `ownPowers` gated).

## 10. Steps

1. `npm run verify` on a fresh branch. Note the totals.
2. Engine §7a 1–4, with its tests. `npm run test:fast`.
3. Engine §7a 5–7, with its tests.
4. UI §7b, with the smoke tests.
5. Run it in the dev preview (`shadows-dev-preview`): a Strigoi learns and
   undoes; a Professional gets a custom power; screenshot both modals.
6. Decision N, its INDEX line, the two supersession marks; WISHLIST W72 and
   W106 moved to `log/wishes-granted.md`; CHANGELOG; bump.
7. `npm run verify`, and `npm run phone-check` if you changed layout.

## 11. Stop and ask

- If any part needs a new field on the character (a schema bump).
- If `powerIpe` > 0 on a pool power turns out to be reachable some way other
  than IP or PQ2's saved Werewolves, and holding it would be wrong.
- If the Character tab or print shows a custom power on a write-in archetype
  twice, and the fix isn't obvious.
- If a Learn row would need the archetype's id in code (Decision 135).

## 12. Close-out

Use the **close-the-session** skill. Rule-or-shape tier: Decision N and its
marks, STATE rewritten (P5 built), the log entry, `shipped.md`'s row, INDEX
§2 statuses for W72 and W106, CHANGELOG plus `npm run changelog`, and the
app bump.

Suggested CHANGELOG lines:

- **A Vampire or Werewolf can learn a power its Bloodline or Origin has**,
  on Raise a Power, for 40 IP.
- **Your GM can give you a custom power**, a name and what it does, on Raise
  a Power. It shows with your other powers and raises like them.

## 13. Review checklist

- [ ] §8's rows are pinned, and each passes.
- [ ] No `NaN` rank, anywhere, for any character `migrate()` can produce.
- [ ] A Vampire's Learn list is its own Bloodline's unheld powers, no more.
- [ ] Custom power works on every archetype, and is shown once.
- [ ] Each learn and custom power is one commit, one Undo.
- [ ] Mutation tests noted in the PR.
- [ ] Decision N's shape passes `docs.test.mjs`; 215 and 153 marked.
- [ ] `npm run verify` green; versions: app minor, no data, no schema.

## 14. Handing it over

Paste this as the first message of a fresh Sonnet session, once this order
is on `main`:

> Read `CLAUDE.md`, then `docs/plans/sheet-wishlist/P05-powers-in-play.md`,
> and build it. Ken approved it on 2026-10-1x, with PQ1–PQ5 <as answered>.
> Follow its steps (§10) in order, and its *Stop and ask* list (§11) exactly.
> If something isn't covered by the order, stop and ask me rather than
> choosing. Where the order and the code or the ledger disagree in a way that
> doesn't stop you, build what the order says and list it in the PR under
> *Where the order didn't fit*. Open a PR when §13's checklist holds; don't
> merge it.
>
> Four things in this order are easy to get wrong:
>
> 1. **`start` is `undefined` for a learned power.** `archetypePowers` reads
>    `placed[p.id]`, which a learned power doesn't have. Use `|| 0`, or every
>    rank downstream is `NaN`, and `NaN` fails no `>=` check.
> 2. **An unranked power hides its IP.** `archetypePowers` sets `ipe` to 0
>    when `ranked` is false. Decide held-ness from `powerIpeOf` directly, or
>    a learned Deathless Resilience is paid for and never held.
> 3. **Split `hasPowers`; don't delete it.** The wizard's blank row and the
>    write-in's Add power at 40 keep the panel gate. Only reading, Improve,
>    Remove and the new `addCustomPower` open to every archetype.
> 4. **Show a custom power once.** The write-in archetype already lists them
>    on Loadout & Powers. The Character tab's new controls are for everyone
>    else.
>
> Tier: Rule or shape. One numbered decision (the next free number), a
> **minor** app bump, no data or schema bump. Use the close-the-session skill
> at the end.
