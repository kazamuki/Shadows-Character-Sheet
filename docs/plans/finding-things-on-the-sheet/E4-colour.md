# Work order E4 — Colour that keeps its one meaning

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E4. The plan gave E4 three things, against DESIGN.md's One Meaning Rule:
- werewolf form boosts framed in Signal Gold, which should be violet;
- scrapped armor (Dax's jacket, 0/10) keeping the cyan active frame "and glow", which should read as damaged;
- Progression's five equal violet buttons, where only one should be primary.

The conductor asked for a sweep of every other state colour that breaks the rule, and for this order to say which of those E4 takes and which it leaves to E7 or the wishlist (§5, *The rest of the sweep*).

**Status:** drafted 2026-11-14 by the Opus session that reviewed E8, at the conductor's request. EQ46–EQ51 are in §4 (EQ51 is Ken's addition).
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** anything but E6 (the phone), which also edits `shadows.css`. If E6 is open when E4 builds, the conductor checks that the two don't touch the same rules. E5 and E8 are merged.
**Impeccable:** `/impeccable colorize the sheet's state colours against DESIGN.md's One Meaning Rule`. The pre-flight below is that pass's analysis. It was run on `main` in the dev preview with Dax (the werewolf with the scrapped jacket), in both themes. The builder doesn't run it again.

**Pre-flight:**
- **The commit is `372c148`**: main after #338 (E8). App 0.69.0 is under `[Unreleased]`, game data 0.54, last decision 287, last EQ 45, next free W156.
- **Probes on `main`** (the worked examples' "before"). Dax Harlan is a Werewolf, stored in Werewolf form, wearing the Road Warrior's Jacket at Integrity 0/10, scrapped (`Engine.armorState(ch).worn`: `scrapped: true`, `integrity: 0`).
  - **Form boosts, dark theme:** on Main, three `.statcell.shifted` cells. Each has a border of `rgb(242,201,76)` (Signal Gold) and a "+4 form" line (`.sform`) in the same gold (`shadows.css:574`).
  - **Form boosts, light theme:** both are already Aether Pulse `rgb(113,43,140)`, because the Fold Rule maps `--gold` onto `--violet` (`shadows.css:45`). **The gold problem is dark-theme only.**
  - **The jacket, dark theme:**
    - On Main and on Loadout, `.lo-armor.worn` has a border of `rgb(27,187,196)` (Static Cyan, `:491`).
    - Its stat line "PROT 1d4 · RES +6 (Kinetic) · Medium coverage (torso, arms)" is cyan (`.hitarmor`, `:449`).
    - On Trackers, the armour line is cyan inside a Deep Circuit `.trk`.
    - The Integrity bar is `bar bad` (magenta), and a magenta "scrap" chip follows it.
  - **The jacket, light theme:** frame and line are Deep Circuit, the cyan fold.
  - **There is no glow.** `box-shadow` is `none` on the armour card. The only cyan glow in the stylesheet is the wizard's `.card.selected` (`:151`); the critique's detector called it a "cyan zero-offset glow". The plan's "and glow" isn't true of the sheet, so nothing here removes one.
  - **The armour line claims a number that doesn't count.** At Integrity 0 the book's armour still rolls PROT, but "RES no longer applies until the armor is repaired" (CRB `0460` §Integrity, and `0530`: "RES is gone… PROT remains… Armor taken to 0 by Massive is scrap"). The engine already skips RES for a compromised or scrapped piece (`engine.js:1654`, `resSkipped = "compromised"`). The sheet still prints "RES +6" in the value colour, on four places. That is what "reads as damaged" has to fix, not just the frame.
  - **Progression** (Dax, dark): "Log session" is the one `btn go`, in cyan. Under it are five `btn primary` in Aether Pulse `rgb(113,43,140)`: Raise a Stat, Raise a Skill, Buy or Raise a Power, Buy an Advantage, Restore (`sheet.js:1720–1726`). Two more appear when they apply: Train a Skill (house rule) and Buy off a Disadvantage. So it's up to seven equal violet buttons, and they're the same in light.
- **What the pre-flight found that the plan didn't say:**
  - **`.hitarmor` isn't the armour's class.** It's the mono value-line class for the five armour lines and eight others: held spells (`sheet.js:34`, `:1152`), Natural Armor (`:492`, `:1195`, `:1598`, `:2391`), a summoned thing's HP (`:1296`), a sustained power's SFR line (`:1313`), and the armour lines. **Recolouring `.hitarmor` would recolour all of them.** The damaged state is a modifier class, on the armour lines only.
  - **The data already says why RES is gone.** `armorRules.compromisedNote` reads "At 0 INT the armor is Compromised: PROT still rolls, but RES no longer applies until repaired." `armorRules.scrapNote` reads "Armor driven to 0 Integrity by Massive damage is scrap. It can't be repaired." No new copy is needed.
  - **GM mode already says it, half-way.** Its seat line says "· Compromised: RES is gone" for a compromised piece, but for scrap it still prints "RES +6 · Scrap" (`gm.js:3470`). `smoke-table-seat-fight.test.mjs:143` pins "· Scrap". That's EQ50.
  - **A second green meaning.** `.effects .etag.computed` (`shadows.css:1021`) is Ghostly Green: the tag the engine computes from an Advantage's or Disadvantage's numbers. Nine Disadvantage tags carry a penalty in that green ("Max SAN −15" on Berserker, Fanatic and Hallucinations' −25; "−2 on checks with the Skill you choose" on Defect/Flaw; Giant's "Melee and Martial Arts damage to you −4"). The rule says "green never marks something spent". It shows wherever an entry's effects do: the wizard's CP step and the Character tab's cards. That's EQ49.
  - **The theme toggle lights gold on hover** (`shadows.css:982`). DESIGN.md says a hover turns the line Aether Pulse, lit. E4 takes it with no question (§9).
  - **The Read Rule guards words.** `build.test.mjs`'s W43 test fails any `color: var(--token)` under 4.5:1 on the three grounds. `--violet` and `--violet-hi` fail it as words, so the "+4 form" text must take `--violet-text`. Lines and borders take `--violet-hi`, as DESIGN.md's Aether Pulse, lit says.
  - **In the light theme, gold, magenta and violet are one colour** (the Fold Rule). There, a form boost, a primary button, a spend and harm all read violet, and E4 can't separate them without changing the palette. That's out of scope (§7). It's also why EQ47's default marks scrap with a dashed line: a shape survives the fold.
- **Ledger search.** I searched §4's Touches lines and text by name for: colour, color, gold, violet, cyan, green, magenta, `statcell`, `shifted`, `sform`, form toggle, `lo-armor`, `hitarmor`, scrap, compromised, `compromisedNote`, `scrapNote`, RES, `btn.primary`, primary, raise-row, Progression's buttons, `etag`, computed tag, theme toggle, DESIGN.md.
  - **Cited, and they stand:**
    - **159** made Progression's actions buttons that open a modal. It doesn't choose their colour.
    - **195 and 268:** the Form toggle and what a form restores. E4 recolours what a form shows, not what it does.
    - **231 and 232:** effects as computed and rule tags. They decide the tags' text and where they show, not their colour.
    - **257:** GM mode's seat reads the sheet's pipeline. Its armour wording is GM mode's (EQ50).
    - **191:** GM mode's encounter armour line. Unchanged.
    - **100:** the worn body piece's line. Its words are unchanged; E4 marks RES as not applying.
  - **Superseded: none.** No decision fixed any of these colours. They're DESIGN.md's, and E4 brings the CSS back to it and writes the two new meanings into DESIGN.md (§9).
  - **No decision.** This is *Fix*: it applies a rule DESIGN.md already states, reading state the engine already returns (`p.compromised`, `p.scrapped`, `formState`). If Ken picks an alternative that changes what a colour means beyond §9's DESIGN.md lines, the conductor says so, and it may need one.

**Carried over** (E3's, E5's and E8's reviews):
- **No test reads computed CSS**, and E3's reviewer broke two rules with a CSS fold. CSS changes are whole lines, never a substring replace. Every rule E4 touches is pinned by a `build.test.mjs` test that parses the stylesheet (§10). The preview check reads `getComputedStyle` in both themes, at 375 and 1280, for each changed rule *and* its neighbours (§12 step 5).
- **Examples are written first, run red on `main`, and each failure is quoted in the PR** (E5's weren't).
- **Fixtures assert their state before the test uses them** (E5's first hurt fixture was DOWN): compromised and not scrapped, scrapped, healthy, shifted.
- **The seat sheet is checked in the browser**, not only in jsdom.
- **Screenshots can't be attached.** The preview check goes in the PR body as text: what was loaded, at what size and theme, and what was read.
- **Colour and voice picks go to Ken through the conductor**, as a table in the PR body.
- **In a worktree, check `git status` after every pull.** In E8's review, `git pull` twice moved HEAD and left the changed files on disk at the old version (shown as staged). Restore from HEAD before testing.

---

## 1. Goal and Done when

**Goal:** on the sheet, a colour means what DESIGN.md says it means, everywhere it appears. A player can tell at a glance what a form gives them, that their armour is broken and what it no longer does, and which button on Progression is the page's one commitment.

**Done when:**
- **Form boosts** (EQ46): a shifted stat cell's frame is Aether Pulse, lit (`--violet-hi`) and its "+4 form" line is `--violet-text`, in both themes. No rule for `.shifted` or `.sform` names `--gold`.
- **A worn piece at Integrity 0** (EQ47), compromised or scrapped, reads damaged everywhere the sheet draws it: Main's armour card, Loadout's card, Trackers' Armor line, the Take-a-hit panel's line and the After-the-fight panel's line.
  - Its frame (on a card) is the danger line (`--magenta`), dashed when it's scrap.
  - PROT still reads as a value. RES reads as not applying (`--dim`, struck through).
  - The data's `compromisedNote` or `scrapNote` says why, once per card or panel.
  - A healthy worn piece is unchanged.
- **Progression** (EQ48): no spend button is primary. "Log session" stays the one Go.
- **Computed effect tags** (EQ49) are cyan, a value the sheet computes, wherever they show.
- **The theme toggle** lights Aether Pulse on hover, not gold.
- **DESIGN.md** says what E4 made true (§9). Its colour descriptions list the two new meanings.
- **The neighbours are unchanged,** read by `getComputedStyle` in both themes:
  - an unshifted `.statcell`;
  - a healthy `.lo-armor.worn`;
  - every other `.hitarmor` line (a held spell, Natural Armor);
  - `.btn.primary` where it remains (a modal's foot);
  - `.etag.rule`;
  - the Form toggle's `.on` segment.
- **The seat sheet** (GM mode) shows the same in the browser.
- `npm run verify` and `npm run phone-check` pass. The frame fixture moves only as §13 allows.

## 2. Tier, versions, numbers

- **Tier: *Fix*.** CSS, class hooks in the renderers, and DESIGN.md. No rule, data shape or engine reader moves: `armorState` already returns `compromised` and `scrapped`, and `statTable` already returns `form`.
- **Versions:**
  - **App: patch.** A player can see it. `npm run bump` moves `[Unreleased]` from whatever it reads at build (0.69.0 now) to the next patch.
  - **Game data: unchanged.** No value or choice moves (Decision 68). The note strings already exist.
  - **Schemas: unchanged.**
- **Numbers:** no decision, no flag. EQ46–EQ51 are this order's questions. If Ken takes EQ50's default, the wish is the next free W number when it's built (W156 today).

## 3. Decisions

None (§2). If Ken's answers change that, the conductor says so before the build.

## 4. Questions for Ken

Each has a default. A question Ken leaves blank is answered "Default".

- **EQ46 — What colour a form boost is.**
  - **Default: violet.** The frame line is `--violet-hi` and the "+4 form" words are `--violet-text`. The Form toggle's on-state is already a violet fill (`.form-toggle button.on`), so the cause and the stats it changes share one colour. DESIGN.md's Aether Pulse, lit and read lines gain "a stat your form changes" (§9).
  - *Alternative:* no neon. The frame stays Deep Circuit and "+4 form" is Overcast Steel, by the Signal-Not-Decor Rule: the number already says it's from the form. Quieter, but a shifted Werewolf's three changed stats no longer stand out from the other five.
- **EQ47 — How a worn piece at Integrity 0 reads.**
  - **Default: the danger line, with RES marked off.**
    - The card's frame is `--magenta`, as the One-Line Frame Rule says ("magenta danger"), and dashed when the piece is scrap. Dashed echoes how Massive damage marks a Health Level, and a shape survives the light theme's fold.
    - In the stat line, PROT stays a value. "RES +6 (Kinetic)" goes `--dim` and struck through.
    - Under the line, the data's `compromisedNote` (compromised) or `scrapNote` (scrap) says why, once. It isn't repeated where the card already shows it (Loadout's repair row already shows `scrapNote` for scrap).
  - *Alternative A:* the frame only. RES keeps reading "+6" in the value colour, which the engine doesn't apply.
  - *Alternative B:* the whole card dims, like an unworn piece's `.off` line. It reads as "not counting", but PROT still counts.
- **EQ48 — Progression's buttons.**
  - **Default: none is primary.** Raise a Stat, Raise a Skill, Train a Skill, Buy or Raise a Power, Buy an Advantage, Buy off a Disadvantage and Restore become default buttons (Raised Panel, Deep Circuit line). "Log session" is the page's one commitment, and it's already the Go button. The spend buttons are peers; none is the thing to do.
  - *Alternative:* one stays primary. Raise a Skill is the most common spend. It gives the row a lead, but tells a player who came to buy an Advantage that it's the lesser path.
- **EQ49 — Computed effect tags in green.**
  - **Default: cyan, a value the sheet computes.** Line and words become `--cyan`. Nine Disadvantage penalties ("Max SAN −15") stop reading as health or good. DESIGN.md's Static Cyan line gains "a computed effect tag".
  - *Alternative A:* leave them green and write "computed" into DESIGN.md as green's second meaning. That breaks the rule's "one job".
  - *Alternative B:* leave them for E7.
- **EQ50 — RES that doesn't count, outside the sheet's colours.** Two places print RES for a scrapped piece in words, not colour:
  - GM mode's seat line ("RES +6 · INT 0/10 · Scrap", `gm.js:3470`; the compromised case already says "RES is gone"; the test pins "· Scrap");
  - the printed sheet's RES column (`sheet.js:2941`'s row prints the piece's RES beside "0 / 10 scrap").
  - **Default:** out of E4. One wish, the next free W number (W156 today), *Fix*: "RES reads gone for a scrapped piece in GM mode's seat line and on paper".
  - *Alternative:* E4 also fixes GM mode's seat line for scrap ("· Scrap: RES is gone"), updating `smoke-table-seat-fight.test.mjs:143`. Print stays a wish.
- **EQ51 — A contrast and perception check** (Ken's addition, from `/impeccable colorize`'s *Contrast and perception*).
  - **Measured, not assumed.** For every colour pair E4 changes, the builder measures the computed foreground against its computed background with `getComputedStyle`, in both themes. The ratios go in the PR body (§12 step 6, §14). The pairs:
    - the form boost's violet frame against its cell, and "+4 form" against the cell;
    - the damaged armour's magenta frame (solid, and dashed for scrap) against the card and the ground;
    - the struck, dim RES against the card;
    - the cyan computed effect tag's words and line against its card;
    - the theme toggle's hover line and glyph against the header.
  - **The bars:** text 4.5:1; large text 3:1; frames and controls 3:1 (WCAG 1.4.3 and 1.4.11).
  - **Struck RES** may sit below 4.5:1 only because the data's note beside it carries the meaning in words. If the note isn't on that line's card or panel, RES must meet 4.5:1.
  - **A cue that isn't colour.** Each state E4 changes must keep one, so it survives the light theme's fold and colour blindness:
    - a form boost has the words "+4 form";
    - a damaged piece has the strike through RES, the note and, for scrap, the dashed line;
    - a computed tag has its words;
    - Progression's row is one Go beside default buttons, which is a fill against none.
  - **A pair that fails is a stop** (§13). Bring the pair and its ratio.

## 5. The assumption sweep

Each row was found by grepping the selector, the token or the field, not by reading a tab. Line numbers are at `372c148`.

| What | True today | Where | True after |
|---|---|---|---|
| Form boost frame | `.statcell.shifted{border-color:var(--gold)}` | `shadows.css:574` | `--violet-hi` (EQ46) |
| Form boost words | `.statcell .sform{…color:var(--gold)}`, on the same line | `shadows.css:574` | `--violet-text` |
| Who writes `.shifted` and `.sform` | `statCellHtml` (`t[id].form`), called once by the stat grid | `sheet.js:187–193`, `:203` | Unchanged markup. Main draws it, and so does the seat sheet (same renderer) |
| The Form toggle | `.form-toggle button.on{background:var(--violet)}` | `shadows.css:577` | Unchanged: the colour EQ46's default matches |
| Worn card frame | `.lo-armor.worn{border-color:var(--cyan)}` | `shadows.css:491` | Unchanged for a healthy piece; `.lo-armor.worn.down` is `--magenta`; `.down.scrap` is dashed (EQ47) |
| Main's armour card | `<div class="lo-armor worn">` + `armorStatLine(worn)` + `intBar` | `sheet.js:489–491` | `down` (and `scrap`) on the card when `worn.compromised \|\| worn.scrapped`; the note line under it |
| Loadout's card | `armorRowHtml`: `lo-armor${p.worn?" worn":""}` | `sheet.js:2340`, stat line `:2349` | `down`/`scrap` likewise when worn. The repair row already shows `scrapNote` for scrap (`:2375`), so the note isn't repeated there |
| The stat line | `armorStatLine(p)`: "PROT … · RES +n (…) · coverage" | `sheet.js:2329–2333` | RES part wrapped in `<span class="res-off">` when `p.compromised \|\| p.scrapped`; text unchanged |
| Trackers' Armor line | `.hitarmor` with `armorStatLine(worn)` | `sheet.js:1591–1597` | `hitarmor down` and the note |
| Take-a-hit panel line | Its own line: "… · PROT · RES +n · Integrity n/m · scrap / · Compromised" | `sheet.js:1185` | `hitarmor down`; RES in `.res-off`. It already says scrap or Compromised, so no note |
| After-the-fight line | "name · Integrity n/m" (no RES) | `sheet.js:1405` | `hitarmor down`. No RES to mark; `compromisedNote` already shows on the result (`:1417`) |
| Other `.hitarmor` lines | held spells, Natural Armor, a summon's HP, a power's SFR | `sheet.js:34, 492, 1152, 1195, 1296, 1313, 1598, 2391` | **Unchanged.** The `.hitarmor` rule (`shadows.css:449`) isn't edited |
| The Integrity bar and chip | `.bar.bad` magenta, `.chip.pain` "scrap"/"Compromised" | `sheet.js:2322–2327`, `shadows.css:567, 351` | Unchanged |
| The notes | `armorRules.compromisedNote`, `scrapNote` | `shadows-data.js:4346`, `:4371` | Read on Main and Trackers too. Text unchanged |
| GM mode's seat and encounter armour lines | `seatArmorText`, `encArmorHtml`, `.enc-armor` (dim) | `gm.js:3470–3479`, `:3616`; `shadows.css:1557` | Unchanged (EQ50) |
| Print | Text only: `integrity` "0 / 10 scrap"; RES column | `sheet.js:2936–2941` | Unchanged (EQ50). print.css colours none of these |
| Progression's spend row | `btn primary` × up to 7 in `.raise-row` | `sheet.js:1719–1726` | `btn` (EQ48). `data-raiseopen` / `data-ipopen` / `data-trainopen` unchanged |
| Tests that press them | By `data-` attribute, never by class | `smoke-sheet-archetypes:76–132`, `smoke-sheet-progression:174–436`, `smoke-sheet-play:646` | Unchanged |
| `.btn.primary` | Aether Pulse fill | `shadows.css:296–297`; 29 uses in `sheet.js`, 31 in `gm.js` | Rule unchanged; only the `.raise-row` uses change |
| Computed effect tags | `.effects .etag.computed{…color:var(--green); border:1px solid var(--green)…}` | `shadows.css:1021`; written by `effectsHtml` | `--cyan` (EQ49) |
| Where effect tags render | `effectsHtml` chips | `shared.js:791`, read by the wizard's CP step and the Character tab | Same markup |
| Tests on the tags | By text: `.etag.computed` textContent | `smoke-sheet-archetypes:878–880`, `smoke-wizard:1142` | Unchanged (text) |
| Theme toggle hover | `.theme-toggle:hover{color:var(--gold); border-color:var(--gold)}` | `shadows.css:982` | Line `--violet-hi`, glyph `--violet-text` |
| The Read Rule guard | Every `color: var(--x)` ≥ 4.5:1 on three grounds, both themes | `build.test.mjs:257–290` | Unchanged; it checks `.sform`, `.res-off` and the toggle's new colours |
| DESIGN.md | Aether Pulse lit and read, Static Cyan, the One-Line Frame Rule, Cards | `DESIGN.md:211–215`, `:313`, `:331–336` | §9's lines |
| The frame fixture | Box counts per frame | `tools/frame-fixture.json` | Moves only where a `res-off` span or a note line is added on a frame that shows a damaged worn piece (§13) |

**What text points at what this changes.**
- DESIGN.md's colour descriptions (§9 rewrites them).
- `.impeccable/critique/2026-11-12T01-36-16Z__src-ui-sheet-js.md` names the three findings. It's a record, so leave it.
- No player copy names a colour.

**The rest of the sweep.** I listed every `var(--gold)`, `var(--green)`, `var(--cyan)` and `var(--magenta…)` rule in `shadows.css` (35, 23, 61 and 73 of them) and read each against DESIGN.md:
- **E4 takes:** the three plan items, the computed tags (EQ49) and the theme toggle's hover.
- **Checked, and they keep the rule:**
  - gold on costs, CP, Luck and Çredits, flags, warnings, the admin banner and the Integrity bar's warn;
  - green on HP, done steps, picks, granted costs and positive modifiers;
  - cyan on values, focus, active, selected and the Go button;
  - magenta on a ledger's negative amounts: DESIGN.md's Neon Veil, read covers "negative numbers".
- **Left, and where:**
  - **`.ref td.bd .trait-part` is green whatever its sign** (`shadows.css:1696`, `sheet.js:362`). No negative trait part is reachable from today's data: every Advantage, Disadvantage and Aberration was held alone and every Skill read. It's latent, so it goes to **E7** as a sign class (`pos`/`neg` like `.mod`).
  - **Row actions as `btn sm primary`** in the pickers (a primary per row: Add, Pick, Train). That's a list of peers again, but inside a modal. **E7.**
  - **GM mode's `.clock.full`** thickens its line to 2px in gold. The One-Line Frame Rule allows weight only on the Pain bands. That's GM mode's, so it isn't E4's: **wishlist, only if Ken asks.**
  - **The light theme's fold** makes gold, magenta and violet one colour. That's a palette question for Ken and Deighton, **not E4.** EQ47's dashed scrap line is the one place E4 works around it.

## 6. Read first

- `CLAUDE.md`: constraints 3, 7 and 9; *Change tiers* (*Fix*).
- `DESIGN.md`, whole: the Colors section and its Named Rules, Shapes (the One-Line Frame Rule), Components (Buttons, Chips, Cards).
- `src/styles/shadows.css`: `:root` and the light theme's tokens (`:1–50`); the lines §5 names.
- `src/ui/sheet.js`: `statCellHtml` (`:187`), Main's armour (`:488–492`), the hit panel (`:1180–1190`), After the fight (`:1400–1418`), Trackers' Armor (`:1589–1598`), `intBar`/`armorStatLine`/`armorRowHtml` (`:2322–2380`), Progression's spend row (`:1716–1726`).
- `src/engine/engine.js`: `armorState`'s piece (`:1480–1495`, `compromised` and `scrapped`), and `resolveHit`'s RES skip (`:1650–1655`).
- `tests/build.test.mjs`: the W43 Read Rule test (`:251–290`) as the model for E4's CSS tests.
- CRB: `0460_Gear.md` §Integrity (`:711`, `:723`); `0530_Combat_Encounters.md` (`:646`, `:863`).

## 7. Out of scope

- **The palette.** No token's value changes, and the light theme's fold stays (§5).
- **Any word.** The armour notes are the data's. No string is added or reworded, except DESIGN.md's descriptions (§9).
- **GM mode's own views** (EQ50's default), and print.
- **The `.trait-part` sign and the picker rows' primaries** (E7).
- **What a scrapped piece does.** The engine's RES skip, wear and repair are untouched.
- **The phone's layout** (E6).

## 8. The shapes

No data key, save-file field, engine function or schema changes. The class hooks the renderers add (the tests rely on these):

| Hook | On | When |
|---|---|---|
| `down` | `.lo-armor.worn` (Main, Loadout) and the armour `.hitarmor` lines (Trackers, Take-a-hit, After the fight) | the worn piece's `compromised \|\| scrapped` |
| `scrap` | the same elements, beside `down` | `scrapped` |
| `<span class="res-off">` | around the "RES +n (…)" part of `armorStatLine` and the hit panel's line | `compromised \|\| scrapped` |
| `data-armordown` | the note line under the stat line (Main, Trackers) | `compromised \|\| scrapped`; its text is `compromisedNote`, or `scrapNote` when scrapped |

`armorStatLine` keeps returning the same text; only the RES part gains a wrapper. Every caller still escapes what it took from data.

## 9. The UI

**What a player sees** (dark theme; light folds as DESIGN.md says):

| Where | Before | After |
|---|---|---|
| A shifted stat cell | Gold frame, gold "+4 form" | Violet frame (`--violet-hi`), violet "+4 form" (`--violet-text`) |
| A worn piece at INT 0 (card) | Cyan frame; "PROT 1d4 · RES +6 (Kinetic) · …" all cyan | Magenta frame (dashed if scrap); PROT cyan; "RES +6 (Kinetic)" dim and struck; the note under it |
| Same, as a line (Trackers, Hit, After the fight) | Cyan line | Cyan PROT; RES dim and struck (where shown); the note on Trackers |
| Progression's spend row | Up to seven violet primaries | Default buttons; Log session the one Go |
| A computed effect tag | Green line and words | Cyan line and words |
| Theme toggle, hover | Gold | Aether Pulse, lit (line), read (glyph) |

**Interaction:** none changes. No press, focus or record moves. A damaged card is not a button, and nothing new is focusable.

**CSS, by whole lines** (the builder writes them; this is what each must say):
- `.statcell.shifted` frame `--violet-hi`; `.statcell .sform` words `--violet-text`. Keep both on their existing line, edited whole.
- `.lo-armor.worn.down` frame `--magenta`; `.lo-armor.worn.down.scrap` adds `border-style:dashed`. One 1px line, never thicker.
- `.res-off` words `--dim` with `text-decoration:line-through`. It must win over `.hitarmor`'s cyan by specificity (`.hitarmor .res-off`), not by `!important`.
- The note line: `.hitnote`'s look (it's a note), in `--dim`. Reuse an existing class if one fits.
- `.raise-row`: no new rule, since its buttons just lose `primary`.
- `.effects .etag.computed` line and words `--cyan`.
- `.theme-toggle:hover` line `--violet-hi`, glyph `--violet-text`.
- **The `.hitarmor` rule itself is not edited.**

**DESIGN.md** (Docs, in the same PR; the builder pastes these and adjusts only what the build proved wrong):
- **Aether Pulse, lit:** add "the frame of a stat your form changes".
- **Aether Pulse, read:** add "a stat's form boost (+4 form)".
- **Static Cyan:** add "a computed effect tag".
- **The One-Line Frame Rule:** after "magenta danger", add "(a worn armour piece at Integrity 0; dashed when it's scrap)".
- **Buttons, Primary:** add "A page's peers aren't primary: Progression's spend buttons are default buttons beside one Go".

**For the voice pass:** no new player-facing string. The DESIGN.md lines go to Ken with the colour picks.

## 10. Worked examples, as named tests

Write these first, run them on `main`, and **paste each failure into the PR** (§12 step 1). An example that passes on `main` is a stop unless the PR says why. The CSS examples parse `shadows.css` the way the W43 test does (strip comments; split rules; match the selector exactly).

1. `build.test.mjs`: **"E4 1: a form's boost is violet, never gold"**.
   - `.statcell.shifted` sets `border-color: var(--violet-hi)`.
   - `.statcell .sform` sets `color: var(--violet-text)`.
   - No rule whose selector names `.shifted` or `.sform` contains `--gold`.
   - Fails on `main`: gold.
2. `smoke-sheet-play.test.mjs`: **"E4 2: a worn piece at Integrity 0 reads damaged on Main, Loadout, Trackers and the Hit panel"**. Three fixtures, each a `lockedCharacter()` wearing one catalog body piece. Each asserts its state first from `Engine.armorState(ch).worn`, by reading values, not typing them:
   - (a) compromised and not scrapped: `integrityLoss` = its `integrityMax`, `scrapped:false`; asserts `integrity === 0 && compromised && !scrapped`;
   - (b) scrapped: asserts `scrapped`;
   - (c) healthy: asserts `integrity > 0 && !compromised`.

   For (a) and (b):
   - Main and Loadout: `.lo-armor.worn.down` (and `.scrap` on (b) only).
   - Trackers' Armor `.hitarmor.down`.
   - The Take-a-hit panel's armour line is `.hitarmor.down`.
   - In each stat line, `.res-off` holds "RES" and the piece's `res` (read from `armorState`), and PROT is outside it.
   - `[data-armordown]` on Main and Trackers reads `D.armorRules.compromisedNote` for (a) and `scrapNote` for (b), once per card.

   For (c): none of the hooks. Each line's `textContent` is unchanged from `armorStatLine`'s text.

   Fails on `main`: no `.down`.
3. `build.test.mjs`: **"E4 3: a damaged piece wears the danger line, its RES reads off, and .hitarmor is untouched"**.
   - `.lo-armor.worn.down` sets `border-color: var(--magenta)`.
   - `.lo-armor.worn.down.scrap` sets `border-style: dashed`.
   - `.hitarmor .res-off` sets `color: var(--dim)` and `text-decoration: line-through`.
   - The `.hitarmor` rule still sets `color: var(--cyan)`, and no `.hitarmor` rule without `.down` or `.res-off` in its selector changed colour.
   - Fails on `main`.
4. `smoke-sheet-progression.test.mjs`: **"E4 4: Progression's spend buttons are peers, and Log session is the one commitment"**.
   - A fixture that shows at least five spend buttons. Raise a Stat, Raise a Skill, Buy or Raise a Power and Buy an Advantage always draw (`sheet.js:1720–1724`), and holding a Disadvantage adds the fifth. Assert the Disadvantage is held first.
   - `#main .raise-row .btn` count ≥ 5; `#main .raise-row .btn.primary` count 0; `[data-seslog].btn.go` count 1.
   - Fails on `main`: five primaries.
5. `build.test.mjs`: **"E4 5: a computed effect tag is a value, not health"**.
   - `.effects .etag.computed` sets `color: var(--cyan)` and its border uses `--cyan`; no `--green` in it.
   - Fails on `main`.
6. `build.test.mjs`: **"E4 6: the theme toggle lights violet on hover"**.
   - `.theme-toggle:hover` sets `border-color: var(--violet-hi)` and `color: var(--violet-text)`; no `--gold`.
   - Fails on `main`.
7. `smoke-table-sheet.test.mjs`: **"E4 7: the seat sheet shows a form and a broken piece the same way"**.
   - A seat copy that is a Werewolf, shifted with `Engine.setToggle(copy, "form", <the toggle's non-Human option, read from the data>)`, wearing a scrapped piece.
   - Assert both from the engine first (`formState` non-null; `worn.scrapped`).
   - On the read-only seat sheet's Main: `.statcell.shifted` present, `.lo-armor.worn.down.scrap` present, `.res-off` present.
   - Fails on `main`.

## 11. Tests beyond the examples

- **The Read Rule** (`build.test.mjs` W43) must pass with the new colours and with **no new exemption**. If it fails on a colour this order picks, that's a stop (§13), not an exemption.
- **Mutation tests**, each against the built code:
  - `.sform` back to `--gold`: example 1 fails.
  - `down` always added (drop the condition): example 2's healthy fixture fails.
  - `down` dropped on Trackers only: example 2 fails on Trackers. Check there's no second path: the Trackers assertion must read Trackers' own line, not Main's card.
  - `res-off` wrapping the whole line: example 2's "PROT is outside" fails.
  - `scrap` added for compromised too: example 2 (a) fails.
  - `.hitarmor`'s own colour changed: example 3 fails.
  - One spend button back to `primary`: example 4 fails.
  - The seat sheet drawing without the class (if the builder's markup needs a branch for read-only): example 7 fails.
- **Check each for a second path:** example 2's text assertion and E8's tests both read the armour lines' `textContent`. Make sure example 2 fails on the *class*, not the text.
- **Every fixture asserts its state first** (§10).

## 12. Steps

1. **The examples as failing tests on `main`.** Write 1–7. Run `npm run test:fast` and the three smoke files on `main`'s code, and **paste each failure's name and assertion line into the PR's Evidence**.
2. **The renderers' hooks:** `armorStatLine`'s `.res-off`, `down`/`scrap` on the five sites, the note line on Main and Trackers, Progression's `btn` (EQ48). Run `npm run verify`.
3. **The CSS,** whole lines, one rule at a time, with `npm run verify` after the group.
4. **DESIGN.md's lines** (§9).
5. **In the dev preview, recorded in the PR as text** (what was loaded, size, theme, and what `getComputedStyle` returned):
   - **Dax** (`tests/TestCharacters/dax-harlan.shadows.json`, copied in from Ken's main checkout; it's gitignored), at 1280×860 and at 375×812 with touch emulated, **dark and light**:
     - Main's three shifted cells: frame and "+4 form" colours;
     - Main's and Loadout's jacket card: frame colour and style, PROT's colour, `.res-off`'s colour and decoration, the note;
     - Trackers' Armor line, and the Take-a-hit panel's line, opened;
     - Progression's spend row: each button's background.
   - **The neighbours, the same way:**
     - Kade's healthy worn armour (still cyan);
     - a held spell's `.hitarmor` line (Wren: still cyan);
     - an unshifted stat cell;
     - the Form toggle's `.on` segment;
     - a modal's `.btn.primary` (still violet);
     - an `.etag.rule` beside an `.etag.computed` (the Character tab, or the wizard's CP step).
   - **The theme toggle** on hover, by moving the mouse over it in the pane.
   - **GM mode's seat sheet** (Dead Air): its werewolf seat, Dex Villanueva, is in human form with healthy armour. Before seeding, shift the copy (`Engine.setToggle`) and scrap its vest, then read the seat's Main in the browser.
6. **The contrast and perception check (EQ51)**, in the preview, both themes. For each pair EQ51 lists, read the foreground and the background it actually sits on (walk up to the first ancestor with a non-transparent `background-color`) by `getComputedStyle`, and compute the WCAG ratio. Record every pair, its two colours, its ratio and its bar in the PR body, as a table. Then name each state's non-colour cue, and confirm it shows in the light theme.
7. **`npm run phone-check`.**
8. **The mutation tests** (§11).
9. **After the last change of any kind, the full `npm run verify` again**, and say so in the PR.
10. **Close-out** (§14).

## 13. Stop and ask

**Stop if:**
- The Read Rule test fails on a colour this order picks.
- A pair in EQ51's check misses its bar: text under 4.5:1 (struck RES excepted only beside its note), large text under 3:1, or a frame or control under 3:1. Bring the pair, both colours and the ratio.
- A state E4 changes has no cue but colour in the light theme.
- A colour can only be reached by editing a token's value, or by `!important`.
- A site in §5 draws the armour line inside a `button`, a `<label>` or a `<summary>`, so a struck span would sit in a control's name.
- A test you didn't expect reads one of these classes or colours and fails.
- A `phone-check` frame moves by height, or a frame not named below moves at all.
- An example passes on `main` with no reason you can write down.
- A healthy worn piece, an unshifted cell, or any `.hitarmor` line that isn't armour changes colour in the preview.

**Not a stop:**
- The app version literals the patch bump moves.
- Box counts on `sheet:` frames that show a worn piece at Integrity 0 (a `.res-off` span and a note line are boxes), with no height moving by more than 1px. Re-record those, and list each in the PR with its count. (Whether the fixture characters have one is for the builder to read. If none does, nothing moves.)

## 14. Close-out

- **`close-the-session`, for *Fix*:**
  - a CHANGELOG line and `npm run changelog`;
  - the app patch bump;
  - the plan's §3 row: E4 links this order and reads "E4 built";
  - STATE only if its §3 line for the plan is now wrong (it will be: E4 built).
  - A log line only if something was learned the hard way.
  - EQ50's wish, if Ken takes its default, with this PR named in its header.
- **CHANGELOG** (player voice, for the voice pass): "**Colours say one thing each.** A werewolf's form boosts are violet, not the gold of things you spend; armour at 0 Integrity looks broken and shows its RES is gone; and Progression's buttons no longer all shout at once."
- **PR title:** `fix(sheet): colour that keeps its one meaning (E4)`.
- **PR body:**
  - the template's sections;
  - **the colour picks as a table** (before → after, both themes, with the `getComputedStyle` values), plus DESIGN.md's lines and the changelog line, for Ken;
  - **Evidence:** each example's failure on `main`, quoted; the mutation list; the preview reads (§12 step 5); **the contrast table and each state's non-colour cue (§12 step 6, EQ51)**; `phone-check`; the frames re-recorded, if any;
  - **Where the order didn't fit**;
  - a line saying the full suite ran after the last change.
- **Review checklist:**
  - **Redo §5's sweep:**
    - grep `class="lo-armor`, `hitarmor` and `armorStatLine(`, and check that every armour site has `down` and no other `.hitarmor` gained it;
    - grep `btn primary` inside `.raise-row`, which should find none;
    - grep `var(--gold)` in rules naming `.shifted`, `.sform` or `.theme-toggle`, which should find none.
  - **The CSS by whole lines:** diff `shadows.css` and check that every changed line is one §9 names, and no neighbouring rule on a shared line was dropped (E3's fold).
  - **The neighbours by `getComputedStyle`,** both themes, 375 and 1280, as §12 step 5 lists. Don't take the PR's word for it.
  - **The seat sheet in the browser.**
  - **Contrast and perception (EQ51):** re-measure every pair EQ51 lists in both themes yourself, against the PR's table, and check each meets its bar. Struck RES may be under 4.5:1 only where its note is on the same card or panel. Check each state's non-colour cue shows in the light theme.
  - **The fixtures' state:** compromised-not-scrap really is `integrity 0, scrapped false`; the Progression fixture really shows five buttons.
  - **Mutations:** re-run §11's yourself.
  - **The examples on `main`:** check examples 2, 4 and 7 fail there (scratch worktree, its own `npm ci`).
  - **The book:** "RES no longer applies, PROT still rolls" against `0460` §Integrity, so the struck RES is the book's rule and not a guess.
  - **DESIGN.md:** the lines say what the CSS does.
  - **The suite:** `npm run verify` on the PR's head.
  - **Colour and copy:** the picks table for Ken, through the conductor.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **`.hitarmor` is thirteen lines, five of them armour.** Mark the armour with a modifier class, and don't touch `.hitarmor`'s rule.
- **The plan's "glow" isn't there.** Nothing removes a glow. Don't add a `box-shadow: none` to prove a point.
- **Damaged is about RES, not just a frame.** The engine already stops applying RES at Integrity 0; the sheet should stop claiming it.
- **Words take the *read* tokens.** `--violet-text` for "+4 form", `--violet-hi` for lines. The W43 test is the judge, and gets no exemption.
- **Light theme:** gold and magenta fold onto violet. Check both themes, and expect a damaged frame and a form frame to share a colour there. The dashed scrap line is the difference.
- **CSS by whole lines,** and check the neighbours (§9's list) in both themes.
- **Examples first, red on `main`, quoted in the PR. Fixtures checked for their state.**
- **The seat sheet in the browser,** with a copy shifted and scrapped before seeding.
- **Mount the private repo** (`git submodule update --init private`) in a fresh worktree before the suite.
- **After a `git pull`, check `git status`** (E8's review).
