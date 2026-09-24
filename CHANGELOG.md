# Changelog

What a player would notice, one section per release tag, newest first. CI attaches the
single-file build to each `v*` release, so a download traces back to its section here.
The *why* behind each change is in `docs/SCHEMA.md` §4 (numbered decisions), and the
batch-by-batch board is `docs/log/shipped.md`.

**Keeping it current:** a change that bumps `APP_VERSION` adds its lines under
`[Unreleased] — app X.Y.Z` in the same commit, and tagging renames that heading to the
tag. `tests/docs.test.mjs` fails if no heading here names the current `APP_VERSION`.
That's what stopped this file at 0.7.0 for eight releases (W18).

Four versions move independently — app, game data, character schema, ruleset. The rules
for each are in `CLAUDE.md`; current values are in `docs/STATE.md` and the app prints its
own in the footer.

## v0.19.1 — 2026-09-23

Character schema **0.9** · game data **0.14** · ruleset CRB v4 (in progress).

- **Martial Arts no longer scrambles the Skills step.** Training it used to squeeze the
  style picker into a narrow column and push every skill below it out of line. The
  picker now spans the row, and the skills after it stay in place.

## v0.19.0 — 2026-09-23

Character schema **0.9** · game data **0.14** · ruleset CRB v4 (in progress).

- **Choose your starting spells in the wizard.** An Arcanist enters the TOL + 1d4 (up to
  4d4) roll on the Character Points step and picks that many spells from the book. They
  land in the Grimoire, Known, when you lock.
- **Evocation sets how far you can reach at creation.** A spell's TH can't be higher than
  your Evocation rank. Buy a rank on the same step and the next tier opens right there.
  Un-buy it and the step tells you which spell needs it; nothing is dropped behind your back.
- **After creation, learn anything.** A spell whose TH is past your Evocation dice is marked
  **Beyond your pool**: it can still be cast, but only an exploding 10 gets there. Mastery
  counts.
- **The spell picker opens as its own window**, on the sheet and in the wizard. Search and
  filter, see each spell's numbers before you take it, and keep picking without it closing.
  Esc or a click outside closes it. Undo still works while it's open.

## v0.18.0 — 2026-09-23

Character schema **0.9** · game data **0.13** · ruleset CRB v4 (in progress).

- **Record it.** After a Cascade, one button writes it into Notes and puts the Aberration
  on your sheet. One Undo takes back both.
- **Aberrations on the Trackers tab.** Permanent ones are cards with a note and Remove;
  temporary ones are chips you Clear when they wear off. Add one by hand from the
  catalog when the GM rules it. You can't hold the same Aberration twice.
- **Drained** takes 2 off your maximum TOL, down to 0, and leaves your current TOL where
  it was. Clearing it gives the 2 back to the maximum, and you rest the rest back.
- **Phantom Pain** puts you at Pain Level 1 even at full health. The Pain line says what's
  adding to it.
- **Spell Attack** (Evocation + REF + WILL, the scores themselves) sits beside Spell Power
  in the Grimoire.
- **A Magic reference** on the Archetype tab: the Spellcraft roll and its five outcomes,
  spell tiers, the Cascade Table, the Aberration Table and every Aberration. Permanent
  Aberrations also show there.
- **Three Unique Aberrations follow the current rulebook:** Aethereal Link hears animals,
  Thaumaturgical Sight's +2 is for analyzing magic, and Resonant Whispers reads
  talismans and artifacts.

## v0.17.0 — 2026-09-23

Character schema **0.9** · game data **0.12** · ruleset CRB v4 (in progress).

- **The Grimoire reads the book.** Add spells from the Book of Known Spells with a picker
  that shows each spell's TN, TH, range and effect before you add it. Search by name,
  Glyph or effect, and filter by tier or Domain. A book spell shows its full entry:
  flavor, target, defending, Overflow and tags.
- **Spell Power** (Evocation + WILL) sits at the top of the Grimoire.
- **Master a spell** for 30 IP × its TH. It goes in the IP journal, and the spell's TH
  drops by 1. A Mastered TH 1 spell needs no roll.
- **Spells you typed in yourself** are kept exactly as you wrote them. If one's name
  matches a book spell, **Link to the book** swaps in the book's numbers and keeps your
  notes. Improvised and house spells stay free-typed.
- The Arcanist's text no longer points you at a "Magic section" that isn't there.

## v0.16.0 — 2026-09-23

Character schema **0.8** · game data **0.11** · ruleset CRB v4 (in progress).

- **Cascades.** An Arcanist now tracks TOL spent. At TOL it says you're Exhausted. Past
  TOL, a Cascade panel takes your d10 and the Rupture's degree and reads the Cascade
  Table. If you land on an Aberration, it takes the second die too and lists that
  category's Aberrations for your GM to pick from. **Add to notes** writes the result
  into Notes.
- **Undo right where you clicked.** Every change on the sheet shows a short toast
  naming what happened, with an Undo that takes back that action and nothing newer.
- **Conditions are one click.** Adding a Condition is a palette of chips. A Condition
  you already have is greyed out, and a body-part one asks where. On Main, clicking an
  active Condition's chip shows its effect and recovery.
- The damage stepper says **Heal 5 / Heal 1 / Hurt 1 / Hurt 5**. It used to show `+5`,
  which made the HP headline go *down*.
- Light mode: the violet buttons (Take a hit, Continue, Open sheet, Buy…) had
  near-black text on violet, which was hard to read. It's white now, and a build check
  covers every filled control in both themes.

## v0.15.0 — 2026-09-23

Character schema **0.8** · game data **0.10**.

- **TOL is 1 + INT + BOD + COOL** (Deighton's ruling, was INT/COOL/EMP). Every
  character's TOL can move, and the Arcanist's most of all.
- **Natural Armor** (Thick Skin, Shake it Off, Iron Shirt, a Trueborn's waning moon) is
  one number. Take a hit applies it, and the print sheet's Nat column fills.
  Conditional sources ask whether they're on.
- **Nanomed Kit** on Trackers: clears Agonized, Bleeding, Paralyzed and Poisoned,
  stabilizes the Dying, and proposes the HP it regenerates by dose.

## v0.14.1 — 2026-09-22

- The built file (the demo site, and the file players get) rendered blank on screen from
  v0.13.0. It works again. Opening `index.html` from the folder was never affected.

## v0.14.0 — 2026-09-22

Game data **0.9**.

- **Loadout picks from the catalog.** Add or Buy (paid from Çredits) any weapon or armor
  piece. Weapon lines show the attack total and resolve `BOD+X` to a number. Wear one
  body piece, and add upgrades by slot and quality.
- **Recovery on Trackers:** Rest (BOD per day), Focused Healing (the only way back for
  Massive-lost Health Levels and Injured), Field Repair, the after-fight wear roll, and
  **Turn Reset**, which ticks Bleeding and lists each Condition's recovery check.
- The print sheet shows your armor and its Integrity.

## v0.13.0 — 2026-09-22

Character schema **0.8** · game data **0.8**. Also carries 0.11.0 and 0.12.0, which were
never tagged.

- **Take a hit.** Enter the damage, type and your PROT roll. The worn armor answers
  (PROT, RES, AP, Compromised), and the sheet asks for the Shock Check or the check at
  zero when one is due. It adds what follows (Unconscious, Prone, Dying) and undoes as
  one action. Massive damage strips Integrity and removes Health Levels outright.
- **Conditions** (054's table plus Dying): add them on Main or Trackers. Agonized raises
  Pain, the flat penalties reach every Skill Check total, the helpless ones show a
  banner, and Dying counts Death Marks.
- Design-team rulings: a new skill after creation costs 25 IP, stats past 10 follow the
  designers' curve, and Condition penalties stack to −8.
- **The print sheet is redesigned** (0.11.0): a case-file front page, Health Levels in
  Pain Level bands, and Skills in two panels. Printing a blank sheet no longer comes out
  empty, and Notes no longer clip.

## v0.10.1 — 2026-09-21

Character schema **0.7** · game data **0.7**. Also carries 0.10.0.

- **Light theme** (0.10.0): a toggle in the header, remembered per browser.
- **The catalog arrives in the data**: 54 weapons, 9 ammo types, 11 arrowheads, 37 armor
  pieces. **Magic's shared half** arrives too: 96 Known spells across five Domains, and
  the Spellcraft rules.
- The Arcanist's Rupture works as the CRB says: it spends TOL by its degree. Exhausted
  is what you are at 0 TOL, not a second pool. The old Exhaustion tracker is gone.

## v0.9.0 — 2026-09-07

Character schema **0.5** · game data **0.5**. Carries 0.7.0 (below) and 0.8.0.

- **Print your sheet**, filled or blank, from the header menu. A standalone blank sheet
  ships next to the app, and the demo site went live.
- **`grants`** (0.8.0): Educated, Hard to Kill, Lucky/Unlucky and Long-Lived now change
  the numbers they name instead of sitting as text.

### app 0.7.0

Character schema **0.5** · game data **0.4** · ruleset CRB v4 (in progress).

**Player-visible**

- The intake ledger tells the difference between "done" and "passed, but something's
  still open." A step you've walked past with unspent points or an unresolved pick now
  shows a gold `!` instead of a green checkmark, and a callout below the ledger jumps you
  back to the first one.
- Advantages, Disadvantages and Skills can now ask you for something when you take them:
  a Skill from a named list (Common Sense), any Skill and a different one per rank
  (Favored Skill, Refined Skill), up to two Martial Arts styles, or a line of text for the
  ones the rulebook hands to your GM (Cursed, Pact, Immunity and seven more).
- An entry the table has to settle — "work out the curse with your GM" — **warns** rather
  than blocking. You can finish a character before that conversation happens.
- Long-Lived is marked creation-only, as the CRB says.
- One specialization block per archetype. The Arcanist used to render its Aberrations twice
  and demand a pick from each; a Professional's Subtype and a Werewolf's Origin never showed
  up on the sheet at all. Both fixed.
- Resuming an in-progress draft now upgrades it like every other load path, so a draft saved
  under an older version keeps its choices.

**Earlier in this release**

- The sheet now states the CRB's Pain Level floors — "−3 Essence dice (min 1) · −15% Breaker
  (min 10%)" — instead of bare penalties a player could read down to zero dice.
- The app no longer narrates its own build state. No phases, no "TBD", no internal flag ids,
  no "confirm with D". Unsettled rules say what isn't settled and hand the table its authority.
- A character holding a skill the game data no longer defines still opens.
- The footer carries the app version.

**Under the hood**

- Repository restructure: the single `index.html` split into `src/` (data, engine, ui, styles)
  with `index.html` as a shell; build script inlines everything back into one file for release.
- The engine has a totality contract with a guard behind it, and `migrate()` guarantees its
  own completeness — a pre-0.2 character used to be unopenable.
- `tests/rules.test.mjs`: the CRB's worked examples run as tests. A rules change the app
  misses fails the build.
- Test suite: engine units (no DOM), CRB conformance, voice enforcement, jsdom smoke,
  architecture guards, doc consistency.
- One selection & constraint system — `picks` / `excludes` / `requires` — hosted by
  advantages, disadvantages and skills. Archetype specialization runs on it too (**A3**),
  which retired the per-archetype renderer branches and closed **A1** and **A2**.
- Character schema **0.4 → 0.5**: one `archetypeChoices.specialization` array replaces
  `identity.specialization`, `subtype` and `aberrations`, with a `migrate()` step. Game data
  **0.3 → 0.4**: fifteen entries now ask for an input they did not before.
- The suite has **no `todo` for the first time**. An independent adversarial review of the
  Batch 3 PR found five further defects, all fixed before merge (Decision 82).
- Docs guards extended: `package-lock.json` and `README.md`'s version line are now checked
  against `APP_VERSION`, both having drifted a full version unnoticed.

## v0.4.0-phase-3.3

Character schema **0.4** · game data **0.2** · ruleset CRB v4 (WIP).
Audit trail with global undo, admin mode, HL segment strip, TOL/WILL/SAN derivations surfaced.
See `docs/SCHEMA.md` decisions 48–53.
