# Work order P16: The Character tab's layout

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W99** and **W60's last item** (`WISHLIST.md`); Decisions 158, 168, 214 (W45's lone card), 231.

**Scope:**
- **W99:** on the Character tab, **every section heading starts a row of its own, at the left edge**, and its cards sit beneath it in a grid that every section shares, so cards line up from one section to the next. Today the archetype's sections pour into one newspaper-style column flow (Decision 168), so a heading lands wherever the cards before it run out.
- **A section with exactly one card spans two columns** when there are two or more (Ken, 2026-10-24).
- **Advantages stay beside Disadvantages** (Ken, 2026-10-24), on the same column lines as the sections above them.
- **W60's last item:** `.76rem` is off the sizes the stylesheet uses. The inline style at `sheet.js` ~2339 becomes a class, and the nine `.76rem` rules move to `.78rem` (PQ4).

**Status:** **drafted 2026-10-24 by Claude (Opus)**, from Ken's ask in a design session, without a prior P-order reviewer. **Ken answered before drafting (2026-10-24):** W99's question is "no filling" (a short section never has another section's cards fill the space beside it); Advantages stay beside Disadvantages; a lone card spans two tracks. PQ1–PQ5 below are this order's own. **Approved by Ken on 2026-10-24, with PQ1–PQ5 on their defaults.**

**Pre-flight:** against `main` at `41c4615` (#239, v0.54.1's changelog heading; **v0.54.1 released** 2026-10-23). The layout was prototyped by injecting this order's CSS into the dev preview and measured with `javascript_tool` against ten characters (below). Findings:
- **No reader outside the Character tab.** `arch-top`, `arch-flow`, `arch-part`, `trait-cols`, `trait-col` and `trait-grid` are written only by `renderShCharacter` (`sheet.js` 543–675) and styled only in `shadows.css` 953–969. `print.css` and the print renderer don't use them (grep).
- **Two smoke tests read the markup** (`smoke-sheet-archetypes.test.mjs` ~37–49 and ~311): `.trait-cols > .trait-col` (two), `.arch-top > .arch-top-part` (two), `.arch-flow > .arch-part` with `.sect` first, and `.trait-col > .trait-grid details.pick.trait`. **This order keeps every one of those class names and that nesting**, so both pass unchanged. Only the comment above the first, "its parts in one flow of columns", is now wrong (§4).
- **Container queries are already in use:** `.cond-grid{container-type:inline-size}` with `@container (max-width:415px)` for W45's lone card (Decision 214, `shadows.css` ~1195). The span here follows that precedent, never a screen-width media query (168 rejected those: pinning the vitals panel takes ~300px the screen width can't see).
- **jsdom can't see layout.** A heading's x position, a span, or a sideways scroll is measurable only in Chromium. So the layout guard goes in `tools/phone-check.mjs` (real Chromium, outside `npm test`, as every layout guard here is), and the jsdom tests pin the markup that drives it (the `solo` mark).
- **Decision 168's *Revisit if* has happened:** "a column that opens on a card instead of its heading reads as a separate section at the table". That is Brogan's report (W99, 2026-10-10). So reopening it needs nothing new (Decision 130).
- **`.76rem`:** nine rules in `shadows.css` (252, 431, 437, 451, 496, 640, 641, 821, 1113) and one inline style (`sheet.js` ~2339, a Discipline's description on Loadout & Powers). There's no type ramp as such: the stylesheet uses about twenty sizes, `.78rem` 17 times and `.74rem` 11. So W60's item reduces to: no inline style, and no size used only by these nine.

**Probes against `main`** (`41c4615`, dev preview, each character locked at power level 2 with six Advantages and three Disadvantages; x is a heading's left edge from the content's left, in px):

```
1600px wide, today (Decision 168's flow; four ~370px columns)
werewolf/trueborn    Baseline Traits 30 · Powers 418 · Vulnerabilities 807 · Origin 1195
werewolf/wildblood   Baseline Traits 30 · Powers 30  · Vulnerabilities 418 · Origin 807
werewolf/forge-fang  Baseline Traits 30 · Powers 30  · Vulnerabilities 418 · Origin 1195
vampire/strigoi      Baseline Traits 30 · Powers 418 · Vulnerabilities 807 · Bloodline 1195
vampire/draugur      Baseline Traits 30 · Powers 418 · Vulnerabilities 418 · Bloodline 1195
arcanist             Baseline Traits 30 · Aberration 807 · Disciplines 1195
professional/cleaner Baseline Traits 30 · Subtype 807
(each heading also starts partway down its column)

The prototype (this order's CSS): every section heading at 30, for all ten, at 1600, 1100 and 375px.
At 1600: tracks at 0 / 386 / 773 / 1159; Core Mechanic, Disadvantages and the Disadvantage cards
start at 773, the third track's line. A lone card is 752px (two tracks and a gap).
At 700px: two tracks, a lone card spans both (668 = the row). At 375px: one track, a lone card 343px,
no sideways scroll.

Height from the top band to the foot buttons, 1600px:
                     today   strict (Adv and Dis each a row)   this order
werewolf/trueborn    1398    2231                               1919
werewolf/wildblood   1712    2660                               2165
vampire/draugur      1642    2628                               2277
arcanist             1454    1951                               1818
custom (no parts)     497     631                                497
```

The page gets longer, by roughly a third. That is the cost Ken chose for headings in one place (W99's *To respect*); the strict variant was measured and dropped (§3).

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **P16 build** (Sonnet), then a fresh **P16 review** (Opus) once the PR is open.

**Carried over:** no P-order reviewer since P13's precedes this one (W70 was built on its own, P14 is shelved). From P13's review, still true: **a layout claim is measured in the preview, not eyeballed**, and **every reader of a class is grepped** before it changes. Applied here: §4's rows come from grep, and §6's layout checks are numbers from Chromium.

---

## 1. Goal

When P16 is merged:

1. **Every section starts its own row.** On the Character tab, each of the archetype's sections (Baseline Traits, Powers, Vulnerabilities, the Specialization by its own label (Origin, Bloodline, Subtype, Aberration), Permanent Aberrations, Disciplines) begins on a new row with its heading at the content's left edge. Its cards sit beneath it in a grid, and **no other section's cards ever sit beside a short section** (Ken: no filling).
2. **One grid for the whole tab.** Every section's cards use the same column width and the same gap, so a card in Powers sits exactly under a card in Baseline Traits. The number of columns follows the page's width (four at 1600px, three at 1100px, two at 700px, one on a phone), and pinning the vitals panel takes columns back, as 168 has it.
3. **A lone card spans two columns.** A section with exactly one card (a Bloodline, an Origin, a Subtype, one Aberration, a written-in archetype's one trait) spans two columns when the grid has two or more, and takes the whole row when it has one. It never pushes the page sideways.
4. **Notes run under the cards, readable.** A section's notes (the Powers allowance, "Base Powers to place", the Werewolf's "Each Origin can also summon…", "Opened: …") span the row beneath the heading or the cards where they are today, capped at a readable line length (PQ3).
5. **The top band and Advantages beside Disadvantages stay**, on the same lines. The archetype sits beside its core mechanic, and Advantages beside Disadvantages, as 168 and 158 have them. Their gap is the grid's gap, so at four columns the core mechanic's heading, the Disadvantages heading and the third column all start on one line.
6. **A phone reads as before:** one column, every heading at the left, no sideways scroll.
7. **W60:** no inline `font-size` in `sheet.js`, and no `.76rem` left in `shadows.css`.

Nothing a character stores changes, and nothing the engine computes.

## 2. Tier, versions, numbers

- **Tier: Rule or shape** (a player-facing layout someone could have chosen otherwise, superseding Decision 168 in part) **+ Fix** (W60's item). One numbered decision, the next free number on `origin/main` when it's built (**N** below), with its INDEX §3 line.
- **App: patch** (a visible fix, no new capability). If `CHANGELOG.md` has no `[Unreleased]` heading when P16 lands, `npm run bump -- 0.54.2`. If one exists, P16's lines join it and there's no bump. Say in the PR which case applied.
- **Game data, character schema, table schema, pack schema:** no bump. Nothing in the data or any save file moves.
- **CHANGELOG:** §9's lines.

## 3. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| — | **W99's question:** may a short section sit beside the next when there's room? | — | **Ken, 2026-10-24: no.** Every section gets its own row. |
| — | **Advantages and Disadvantages:** each its own row too, or side by side? | — | **Ken, 2026-10-24: side by side.** Measured: the strict version is 130–500px longer than this order, for a pair whose headings already share a line. |
| — | **A section with one card** | — | **Ken, 2026-10-24: it spans two tracks.** At one track wide, a Draugur's Bloodline card is a strip well over 600px tall with three empty tracks beside it. |
| PQ1 | **The column width and the gap.** | **At least 300px a column, 20px gaps,** everywhere on the tab (the archetype's sections, the trait grids, the top band, Advantages beside Disadvantages). That's four columns at 1600px, three at 1100px, two at 700px. *Alternative:* 168's 340px, which gives two columns, not three, at 1300px with the vitals pinned. | **Ken, 2026-10-24: the default.** |
| PQ2 | **The Disciplines table** (an Arcanist's names and ranks). | **One column wide, like a card.** At the full row, its two columns sit 1,500px apart. *Alternative:* the full row. | **Ken, 2026-10-24: the default.** |
| PQ3 | **A note's line length** when it spans the row. | **Capped at about 70 characters** (`max-width: 70ch`), left-aligned. At 1600px, uncapped, "Each Origin can also summon…" runs to about 230 characters a line. *Alternative:* uncapped, which matches the cards' edges. | **Ken, 2026-10-24: the default.** |
| PQ4 | **Where `.76rem` goes** (W60). | **`.78rem`,** used 17 times already and the size of the effect tags, so nothing gets smaller (`phone-check`'s 11px floor is safe either way). *Alternative:* `.74rem` (used 11 times). | **Ken, 2026-10-24: the default.** |
| PQ5 | **Advantages beside Disadvantages switches at the screen's 1000px** (`@media`), which 168's own rule ("every count follows the page's width") contradicts. Fix it here? | **No: out of scope.** At a 1000px screen, unpinned, each half is 467px (measured), room for one 300px card. Pinned, P16 3 measures it at 1300px; if a half falls under 300px there, the card shrinks to fit (`min(300px,100%)`) rather than overflowing. A W if it ever bites. *Alternative:* a container query, as §1.3's span uses. | **Ken, 2026-10-24: the default.** |

*Ken approved the order and answered PQ1–PQ5 on 2026-10-24: the defaults.*

## 3a. The decision, drafted

```
N. **Every section on the Character tab starts its own row, its cards in one shared grid; a lone card spans two columns.**
     *2026-10-2x · Ken + Claude · Touches: Character tab, renderShCharacter, arch-top, arch-flow, arch-part, solo, trait-cols, trait-grid, Baseline Traits, Powers, Vulnerabilities, Specialization, Origin, Bloodline, Subtype, Aberration, Permanent Aberrations, Disciplines, Advantages, Disadvantages, vitals pinned, phone-check, W99*
     - **Decided:** Each of the archetype's sections begins a row with its heading at the left, and its cards sit beneath it in a grid of columns at least 300px wide with 20px gaps, the same grid in every section, so cards line up across sections. A section with exactly one card spans two columns when there are two or more. The top band and Advantages beside Disadvantages stay, with the grid's gap. Every count still follows the page's width.
     - **Why:** Brogan, via Ken (W99): headings landed wherever the column flow put them (Powers in column 1 or 2, a Werewolf's Origin in column 3 or 4, by the character), so the page was hard to scan. Decision 168's *Revisit if* named exactly this.
     - **Rejected:**
       - Keeping 168's flow: no gaps, but a heading's place depends on the cards before it.
       - A short section sitting beside the next when there's room (W99's question): its heading leaves the left edge again (Ken).
       - Advantages and Disadvantages each a full row: 130–500px longer than this order, for a pair whose headings already share a line.
       - A lone card one column wide: a Bloodline became a tall strip beside three empty columns.
       - Spanning by the screen's width: pinning the vitals panel takes width the screen can't see (168). A container query, as W45's lone card (214).
     - **Replaces:** Decision 168 in part (its parts' column flow and "a heading kept with its first card"; the top band, Advantages beside Disadvantages, and cards as many across as fit stand).
     - **Revisit if:** a section often holds one short card and the empty row reads as a gap at the table, or the print sheet's archetype page wants the same layout.
     - **Built:** app 0.54.2 (or the open heading's), no data or schema bump, PR #…. Log 2026-10-2x (P16).
```

## 4. What this changes underneath (the sweep)

Answered by grepping readers (`arch-\|trait-col\|trait-grid\|\.76rem` over `src`, `tests`, `tools`). **Check each row before you build**, and say in the PR if one is wrong.

| Today | Where | After P16 |
|---|---|---|
| `.arch-flow{columns:340px; column-gap:28px}`; `.arch-part` a block with `padding-bottom`; `break-after:avoid` on its first `.sect`, `break-inside:avoid` on `.pick` and `.ref` | `shadows.css` 958–962 | `.arch-flow` is a plain block (no `columns`). Each `.arch-part` is a grid: `repeat(auto-fill, minmax(min(300px,100%), 1fr))`, `column-gap:20px`, `align-items:start`, and a `container-type:inline-size`. Its `.sect` and notes span `1 / -1`; cards and the Disciplines table take one track (PQ2). The `break-*` rules go: there are no columns to break. |
| A card's vertical rhythm is `.pick`'s `margin-bottom:10px` | `shadows.css` 237 | Kept. Rows of a grid section are spaced by that margin, not a `row-gap`, so a card looks the same everywhere. Only `.arch-part .pick` loses any `margin-top`. |
| `renderShCharacter` pushes each part's HTML string into `parts` and wraps each in `<section class="arch-part">` | `sheet.js` 575–628 | The same, plus: **a part with exactly one card gets that card marked `solo`** (a class on the card, written by the renderer, which knows the count: `traits.length`, `powers.length`, `vulns.length`, `chosen.length`, `abPerm.length`). Never inferred with `:only-child` or `:last-child` in CSS: a note before or after the card breaks those (the Powers allowance does). |
| `@container (max-width:415px){ .cond-grid > .cond.alone{grid-column:1/-1} }`, W45's lone card | `shadows.css` ~1195 | The precedent. Here: `@container (min-width: 620px) { .arch-part > .solo { grid-column: span 2 } }`, 620 = two 300px tracks and the gap. **Below that the card stays in one track**, which is then the whole row. A `span 2` without the container guard adds an implicit track at one column, and the page scrolls sideways (§7 mutant 2). |
| `.arch-top{gap:0 32px}`, `.arch-top-part{flex:1 1 420px}` | `shadows.css` 953–954 | Gap 20px, so the core mechanic's left edge is the third track's at four columns (measured: 773 = 773). The 420px basis stays. |
| `.trait-cols{column-gap:24px}`; `.trait-grid{minmax(min(260px,100%),1fr); column-gap:10px}` | `shadows.css` 965–968 | `column-gap:20px` and `minmax(min(300px,100%),1fr)` with `column-gap:20px`, so at four columns Advantages' two card columns and Disadvantages' two are the grid's four (measured). The `@media (min-width:1000px)` switch stays (PQ5). |
| The comments: "flow into as many columns as the page has room for, and a part never splits across two (Decision 168)"; the CSS comment above `.arch-flow` | `sheet.js` 570–573; `shadows.css` 950–957 | Rewritten to this order's rule, citing Decision N. |
| `smoke-sheet-archetypes` "Character: the archetype, then Advantages beside Disadvantages…": `.trait-cols > .trait-col` ×2, `.arch-top > .arch-top-part` ×2, `.arch-flow > .arch-part` with `.sect` first and Disciplines present, `.trait-col > .trait-grid details.pick.trait` ×2. Its comment says "its parts in one flow of columns" | ~22–60 | **Passes unchanged**: the class names and nesting stay. Its comment becomes "each part its own row (Decision N)". |
| `smoke-sheet-archetypes` written-in test: `.arch-flow > .arch-part` holds Baseline Traits, Powers, Vulnerabilities | ~311 | Passes unchanged. |
| Notes in a part: `allowHtml` and `toPlace` (`.step-note`), `content.powersText` (`.step-note`), `openingHtml` (`.step-note`, `.controls`) **inside** the power card, the Specialization's "none chosen" chip in its heading | `sheet.js` 584–598, 928–934 | The part-level `.step-note`s span the row, capped (PQ3). `openingHtml` is inside a `.pick`, so it rides with its card. "None chosen" is a heading alone, a row with nothing under it. |
| Custom powers on a non-write-in archetype render with `powerCardHtml`: `.pick.wi-row.pw-card` | `sheet.js` 1927–1935 | A card like any other: it takes one track, and is `solo` if it's the part's only card. |
| Reference panels (`referencePanelHtml`), after Advantages and Disadvantages | `sheet.js` 664, 744 | Unchanged. They're full-width collapsibles already, headings at the left. |
| `phone-check` measures every sheet tab at 390, 768 and 1024px with one Arcanist | `tools/phone-check.mjs` | Adds §6's layout check: the Character tab for each fixture character at 1600 and 1100px, and 1300px with the vitals pinned, plus the existing widths. |
| `.76rem` in nine rules; `style="font-size:.76rem;color:var(--dim)"` on a Discipline's description | `shadows.css` (§ pre-flight); `sheet.js` ~2339 (Loadout & Powers) | `.78rem` (PQ4); the inline style becomes a class (e.g. `.disc-desc`) in `shadows.css`, at `.78rem`, `--dim`. |

**Where the order's own copy points at the old layout:** grep `columns\|flow` in `src/ui/sheet.js` near the Character tab, `docs/VOICE-APP.md` and the app copy (`appCopy`) for a sentence that describes the Character tab's columns. The pre-flight found none in player copy (the tab's lead sentence names no layout). Confirm it in the PR.

## 5. Where things land

No press changes. The jump bar's chips still scroll to each heading (now at the left), Expand all and Collapse all still open and close every Advantage and Disadvantage card, and opening one still doesn't stretch its neighbours (`align-items:start`). **A card that opens in a grid section** (none can today: the archetype's cards aren't `details`) would push its row down, not its column. Nothing to build for that; it's noted for the review.

## 6. Tests (write first; run on `main` and keep the output)

| Name | File | Setup → result |
|---|---|---|
| `P16 1: a section with exactly one card marks it solo, and only then` | smoke-sheet-archetypes | A Vampire Draugur: the Bloodline part's one `.pick` has `solo`; Baseline Traits', Powers' and Vulnerabilities' cards don't. A Werewolf Trueborn's Origin card is `solo`. An Arcanist with **one** Aberration chosen: `solo`; with **two**: neither is. A written-in archetype with one trait: `solo`. A Professional's Subtype with the Powers allowance note before a lone custom power (or any part with a note and one card): the card is `solo`. **On `main`: fails** (no `solo`). |
| `P16 2: every part opens with its heading, and its notes sit outside the cards` | smoke-sheet-archetypes | For each of the ten fixture characters (§ probes): every `.arch-flow > .arch-part`'s first element child is its `.sect`; every part-level `.step-note` is a direct child of `.arch-part`, not inside a `.pick`. **On `main`: passes** (it pins the markup the grid relies on); say so in the PR. |
| `P16 3: the Character tab's layout` (phone-check rows, not `npm test`) | `tools/phone-check.mjs` | For each fixture (Werewolf ×3 Origins, Vampire ×3 Bloodlines, an Arcanist with two Aberrations and Disciplines, a Professional, a written-in Custom with one trait), at 1600px, 1100px, 1300px with the vitals pinned, and 390px: **(a)** every `.arch-part > .sect` and the Advantages heading starts at the same x as the first part (±1px); **(b)** every card's left edge is one of the grid's track lines (the set of distinct lefts in Baseline Traits, ±1px); **(c)** a `solo` card is two tracks and a gap wide when the part has two or more tracks, and the part's width when it has one; **(d)** at four tracks, Disadvantages' heading and the core mechanic start on the third track's line (±1px); **(e)** no sideways overflow. **On `main`: (a) fails** for the Werewolf Trueborn at 1600px (Powers at 418). |
| `P16 4: no inline font size, and no .76rem` | `tests/build.test.mjs` (or wherever the architecture guards live) | No `style="…font-size` in `src/ui/*.js`; no `.76rem` in `src/styles/*.css`. **On `main`: fails.** If an existing guard already forbids inline styles in `src/ui`, extend it rather than adding a second; say which in the PR. |

**Fixtures:** build the ten characters with the engine (`Engine.newCharacter()`, `identity.archetype`, `archetypeChoices.specialization`, `creation.powerLevel`, locked), once, in a helper both the smoke tests and `phone-check` can call. `smokekit.mjs` has `lockedCharacter()` and `writtenInCharacter()`; extend beside them. **Read the specialization ids from the data** (the archetype's `specialization.options`), never a hand list: P21's review found a hand list goes stale.

**Also:**
- **Voice:** no new player copy is expected. If any appears, it goes through `voice.test.mjs` and the PR lists it.
- **`npm run phone-check`** green at its existing widths and with P16 3's rows.
- **The dev preview** (`shadows-dev-preview`): screenshots of a Werewolf and an Arcanist at 1600px and a Vampire at 390px in the PR, beside §'s probes measured again on the branch.

## 7. Mutants, each of which must fail a test

1. `.arch-flow` back to `columns:340px` (P16 3a).
2. The `span 2` without its `@container` guard (P16 3e at 390px: the page scrolls sideways).
3. `solo` dropped, or written on every card of a part (P16 1; P16 3c).
4. `solo` inferred in CSS with `:only-child` or `:last-child` instead of by the renderer (P16 1's note-plus-one-card case).
5. `.trait-grid` or `.trait-cols` left at its old gaps (P16 3b or 3d at 1600px).
6. One `.76rem` put back (P16 4).

## 8. Out of scope

- **The order of the sections**, the jump bar, Expand all, the foot buttons (158 stands).
- **Advantages beside Disadvantages by the page's width** (PQ5): stays on the screen's 1000px.
- **The print sheet's archetype page** (168's *Revisit if*; the print plan owns it).
- **Any other tab's grid** (Main's cards, Loadout's rows), and a wider typography pass. W60 asks only for the `.76rem` cleanup; a type scale is a design pass of its own.
- **Card content.** No text, tag or chip changes.

## 9. Close-out and review checklist

**Close-out** (the close-the-session skill, ***Rule or shape*** tier):
- Decision **N** in `SCHEMA.md` §4 (the number-a-decision skill), its INDEX §3 line under *Sheet & play tracking*, and Decision 168 and its INDEX line marked **superseded in part by N** with the clause in §3a's *Replaces*. **Replaces** names 168 only: check 158's and 214's text for anything else this overrides, and say so in the PR either way;
- CHANGELOG, then `npm run changelog`; the version per §2;
- W99 and W60 moved whole to `log/wishes-granted.md` (each with a line pointing at the PR and the version); the plan's P16 row; a `shipped.md` row; STATE rewritten (§5: P16 done; what's next);
- a `log/2026.md` entry: the measurements, and that the layout guard lives in `phone-check` because jsdom has no layout.

Suggested CHANGELOG lines (player voice):
- **The Character tab reads in rows.** Every section, from Baseline Traits to your Bloodline or Origin, starts on its own line at the left, with its cards lined up beneath. No more hunting for where Powers begins.
- **A section with one card gets room to breathe:** your Bloodline, Origin or Subtype spans two columns instead of one tall strip.

**Review checklist:**
- [ ] §6's tests exist with those names, and the PR shows P16 1, 3 and 4 failing on `main`'s code.
- [ ] §4's rows are each confirmed or corrected in the PR.
- [ ] `git diff origin/main --stat -- src` touches only `sheet.js` (`renderShCharacter`, and the one inline style at ~2339), `shadows.css`, and the generated changelog; `tools/phone-check.mjs` and the test helpers outside `src`.
- [ ] Both existing Character-tab smoke tests pass **unchanged** (only a comment moves).
- [ ] Decision N passes `docs.test.mjs`; 168 is marked superseded in part in SCHEMA and INDEX.
- [ ] Mutants 1–6 are listed in the PR and the log, each with the test that killed it, rerun by the reviewer.
- [ ] The probes' table remeasured on the branch: every heading at the left for all ten, at 1600, 1100, 1300 pinned and 390px.
- [ ] Run in the dev preview, not only `phone-check`: pin the vitals panel at 1300px and check the solo card and the alignment by eye too.
- [ ] `npm run verify` and `npm run phone-check` are green; the version case is stated.

## 10. Stop and ask

- **A change outside** `sheet.js` (`renderShCharacter` and the line at ~2339 only), `shadows.css`, `phone-check.mjs`, the smoke tests and their helpers, the architecture guard (P16 4), and the docs the close-out names.
- **A class name or nesting the two existing smoke tests read needs to change.** It shouldn't; if it does, stop.
- **A part whose card count the renderer can't know** (HTML pushed from a helper that returns several cards). Report which, and how you'd count it.
- **A measurement that doesn't hold:** a heading off the left edge, a card off the track lines, or sideways scroll at any width P16 3 names, that the CSS above can't fix.
- **An existing test that fails.** Expected breaks: **none.** `phone-check`'s existing rows may move only by height, never by overflow, target size or text size.
- §3's answers reading differently from what you're about to build.

## 11. Handing it over

`WORK-ORDERS.md`'s two prompts, with `<plan>/<order>` = `sheet-wishlist/P16-character-tab-layout.md` and `<id>` = **P16**, and these traps under the builder's:

> Five things in this order are easy to get wrong:
>
> 1. **jsdom has no layout.** A test in `npm test` can't see where a heading lands. The layout guard is `phone-check` (P16 3), in real Chromium; the jsdom tests pin the markup it relies on (`solo`, the heading first, notes outside cards). Mutation-test the guard there.
> 2. **`solo` is the renderer's, never CSS's.** The renderer knows each part's card count. `:only-child` and `:last-child` break on a note beside the card, and the Powers part has one.
> 3. **`span 2` only inside its `@container` guard.** At one column, an unguarded span adds a track and the page scrolls sideways on a phone. Follow `.cond-grid`'s pattern (Decision 214), never a screen-width `@media`.
> 4. **One gap everywhere: 20px.** The top band, Advantages beside Disadvantages, the trait grids and the parts all use it, or their columns don't share lines at four tracks (P16 3d).
> 5. **Keep the class names.** `arch-top`, `arch-flow`, `arch-part`, `trait-cols`, `trait-col` and `trait-grid` are read by two smoke tests; they stay, with their nesting.
>
> Tier: **Rule or shape + Fix**. One decision (the next free number, superseding 168 in part), app patch per §2, no data or schema bump. Use the close-the-session skill at the end.
