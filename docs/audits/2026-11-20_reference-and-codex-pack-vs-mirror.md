# Audit: the Reference's data and the Codex pack against the mirror

**Date:** 2026-11-20 · **Against:** `main` at `208afeb` (app 0.75.0), `private/` at `c99bb58` (the 2026-11-15 mirror; the
private repo has nothing newer, Ken confirmed). **Asked for by:** Ken, with S27's order. **Documentation only.** Nothing in
`src/`, `tests/` or `private/` changed.

**Method.** **[run]** means a script read the mirror and the data and compared them; **[read]** means I read both by hand.
The scripts are independent of `build-codex-pack.mjs` and of the existing tests (they share no parser), and are kept in the
shared notes folder (`refdrift.mjs`, `packaudit.mjs`, `packaudit2.mjs`) for S27's builder to turn into a test.

## Result

**No Content fix is owed. No rule needs a ruling. Two weapon tags say a ruling ahead of the book, which is tracked but
unmarked.** Everything else agrees.

## 1. The Codex pack (53 entries, 29 groups, 114 traits, 7 origins, 9 NPC roles, 8 enemy roles, 4 tiers, 15 sites)

| Check | How | Result |
|---|---|---|
| The committed pack is what the mirror builds | `npm run codex-pack`, then `git -C private status` **[run]** | Byte-identical, `private/` clean. Pinned by `codexpack.test.mjs` |
| All 42 threats are in the mirror and back | every `**ENTRY n**` in 2612 has a pack entry with that `ref`, and no pack threat lacks one **[run]** | 42 of 42 |
| Stats, TOL and WILL | the stat row of each entry against the pack's block **[run]** | 0 differences |
| Tier | each `**Tier:**` against the pack **[run]** | 0 differences |
| Skills and totals | each `**SKILLS**` line, name and number, in order **[run]** | 0 differences |
| Trait names | each numbered trait of each entry, in order **[run]** | 0 differences |
| Every text string | every string in `origins`, `npcRoles`, `enemyRoles`, `tiers`, `traits`, `entries`, `groups`, `sites` found in the mirror after normalising markup **[run]** | 65 not found, **all false positives**: ids and slugs; the roles' text, which the builder composes from the Codex's labelled lines ("In the world: …"); gear lines, which drop the maintainers' ⚠ mark on purpose (a test pins that); and "If pushed" lines whose bold entry names the normaliser split |
| Groups | 29 `**Composition:**` lines against each group's members and counts **[run]** | 29 of 29, 0 differences |
| Origins | the 7 origin rows' stat modifiers against `modifiers` **[run]** | 7 of 7, 0 differences |
| The trait glossary | 117 rows in 2616 less 3 header rows, against 114 traits by name **[run]** | 114 of 114 |

**Not independently re-checked:** the 11 people's stats (the Stat Audit's rows; `codexpack.test.mjs` "every entry's
authored TOL and WILL, and every stat, are its Stat Audit row's" pins them), Health (a test pins it to the book's printed
figure), and the 15 sites' tracks and clocks (the builder stops when a track or clock won't parse, Decision 250). The two
builder warnings (Entries 24 and 28: a comma after a dash in a gear line, kept as one line) are notes, not drift.

## 2. The Reference's data

**The six book panels** (Defense, Checks, Modifiers and range, Actions, Rate of fire, Armor and damage): quoted verbatim
from 0530 and 2130; `rules.test.mjs` "the Reference's book panels are quoted verbatim" passes, and my script agrees
**[run]**. Two Actions items are not the mirror's words: **Activate a Power** under Free Action and **Attack with a Power**
under Standard. They are Deighton's 2026-11-12 ruling (Decision 288), marked `rulingSource`, with an open line in
`plans/crb-catch-up.md` (~182). The mirror is behind the ruling. Checks' cells join the book's `<br />` lines with " · ".

**The data-backed panels** are the app's paraphrase, so a string match is the wrong test; I read each against the book
**[read]**:

| Panel | Against | Result |
|---|---|---|
| Conditions (20) and How Conditions work | 0540's table and its four rules | Every effect and recovery agrees in meaning. The wording is shorter ("Medical (Difficulty 15) or a Nanomed Kit" for "Medical (Difficulty 15) or Nanomed Kit"). Unconscious's recovery is spelled out, where the book says "see Going Down" |
| Pain Levels | 0540's Pain table and the three penalties | Agrees: 0–1, 2+, 5+, 8+ Health Levels lost; −1 Skill Check, −1 Essence die, −5% Breaker; floors at 1 die and 10% |
| When a hit lands hard (Shock, At Zero, Massive, Dying) | 0540's Going Down, 0530's Armor and Damage | Agrees: half your Health Levels in one hit; WILL Essence TN 8 TH 2 at zero and at every Reset; three Death Marks; 9 Lives' free pass |
| Recovery | 0550 (Natural Healing), 0460 (Nanomed Kit, Speed Heal) | Agrees: BOD HP a day, halved if you push on; Speed Heal 2× for 24 hours; a second Nanomed in a day regenerates 1 HP per two rounds, a third per three. **Gap, not drift:** 0540's *With Skill* (Medical: Stop the Bleeding, Treat the Agonized, Stabilize the Dying, Difficulty 15/15/20) and the Battle Chem line are not in the panel |
| Weapon tags (29) | 0460's tag glossary | 27 agree in meaning (condensed). **Siege** adds "to vehicles and structures and to people alike" to the book's "deals Massive damage": the same fact spelled out (the catch-up plan has CQ4 done, ✅ ~148), so it agrees. **Two say more than the mirror: Anti-Materiel** and **Reach** (the mirror's tag list has no entry for either). Both are Deighton's 2026-10-10 rulings (Q9, Q10; F30, F31), the data's own comment says so, and `plans/crb-catch-up.md` (~151) has the open line. **They carry no `rulingSource`**, so Decision 288's marker and its test don't cover them: the Reference shows a ruling the book doesn't have, unmarked |
| CRANK | 2625 | `rules.test.mjs` ~3764 reads 2625 for the tier table, the Job Generator and the off-screen pay; not re-read by hand |

## 3. Sorted

| Item | Kind | Who |
|---|---|---|
| The pack, the six book panels, Conditions, Pain, hits, recovery, 27 of 29 tags | **No drift** | — |
| Actions' two Power items | A ruling ahead of the book, marked and tracked | Ken's book change (Decision 288) |
| Anti-Materiel, Reach | A ruling ahead of the book, tracked, **not marked** | **A Fix, not a ruling:** mark them the way 288 marks items (a `rulingSource` on a data-backed tag, shown as the Reference shows it) and extend the test, or leave them and say so. Ken's call, GQ94 in S27's order |
| Recovery's missing *With Skill* | A gap | **Content**, its own small order (S27's GQ92) |

## 4. What this audit couldn't do

It read the mirror, not the book. If the live book has moved since 2026-11-15 the mirror is stale and so is this. A
paraphrase can drift in a nuance a reader would catch and a script wouldn't: I read for what each panel *does* (numbers,
tests, who rolls, what clears it), not its tone. The paraphrased panels are the part with no guard; the two tags above
show how a ruling gets in unmarked.
