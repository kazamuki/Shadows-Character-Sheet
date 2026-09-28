# Plan — The print sheet in Scott's look

**Status:** proposed 2026-09-26, not started. Nothing here is a decision
until the session that builds it numbers it in `SCHEMA.md` §4. Its open
questions are `PQ`_n_ (§6).
**Covers:** Decision 94's open item: portrait vs. landscape, and drawing
from Scott's finished export once it landed. Decision 89's **Revisit if**
does not trigger (§4 says why).
**Sources:** Scott's Affinity export, `Shadows Character Sheet -
landscape_1…10.svg` (2026-09-23, in the team's `Core Rule Book/Character
Sheets` folder, not checked in); `src/styles/print.css`;
`renderPrintView` and its helpers in `src/ui/sheet.js`; Decisions 89, 94,
95, 135, 137.
**Tier:** *Rule or shape*. A new data field on `stats`, and a front page a
player can see is different. It supersedes part of Decision 94.

---

## 1. What landed

Ten SVG pages. Page 1 is a stray artboard (five hexagons). Page 10 is a
portrait Power Armor spread. Pages 2–9 are two-page **landscape** spreads:

- **2**: the core. Stats, Character Info, Combat Skills, Attacks, Health
  Levels and Defenses on the left, and all three skill tables on the right.
- **3–9**: one left page per archetype (Custom, Human, Arcanist, Cyborg,
  Professional, Vampire, Werewolf), each with a grey silhouette watermark.
  They share one right page: Weapons, Gear, Advantages, Disadvantages, Notes.

That settles Decision 94's open question: **landscape**, as we print now.

**The files can't be the print sheet, only its reference.** The text came
out split glyph by glyph ("Scor e", "Appe arance"), and Ç and the minus signs
came out as empty boxes. Every box sits at a fixed coordinate, so filling in
a character would bring back the per-item layout that "adding a skill needs
zero app changes" rules out. Some content also disagrees with the data (§5).
So we take the visual language and keep our data-driven layout.

## 2. The proposal: the front page in Scott's visual language

A working mockup exists (uncommitted; see §7). It fits one sheet, three
pages in all as today, and `npm run verify` passes against it.

1. **Cards.** White cards with a thin grey outline and bevelled corners
   (`corner-shape: bevel`; rounded in browsers without it). A centred,
   lowercase display heading over a thin violet rule. **No solid header
   bars**, violet or magenta. Tables inside a card get a plain header over
   a black line, as on Scott's sheets.
2. **Stat badges.** Each stat's shipped glyph sits inside a flat-topped
   hexagon outlined in its group's color: cyan (BOD, REF, MOB), magenta (INT,
   TECH), violet (COOL, MAG, EMP), gold (WILL, TOL, LUCK, SAN). This needs
   the one data change in the plan (§3).
3. **Wordmark.** "shadows / adventures in nyte city" in the display face:
   violet over a cyan offset, as in Scott's lockup. It stays small, in the
   frame's top-left notch, because the front page has no room for Scott's
   large bottom-left placement (Decision 96's budget).
4. **Health Levels** are slanted cells. The Pain Level bands stay (Decision 94's
   border weight and color step, read from data).
5. **Combat Quick-Ref** becomes Scott's combat-skills strip: one row of
   skill names over joined write-in boxes, each with its primary stat's
   glyph in that stat's group color. `grid-auto-flow: column`, so the
   row takes however many combat skills the data has.
6. **No spine.** The violet "Character Sheet — Front" tab strip goes. Scott's
   sheets have none, and beside the lighter cards it reads heavy. The frame
   has a notch on its left edge that the spine used to hide, so the column
   gains left padding to clear it.

Items 1, 3, 4 and 6 are CSS only. Items 2 and 5 touch `pStatIcon` and
`pSkillCellsHtml`.

**One side effect:** item 5 turns two rows of cells into one, which frees
about 50px at the foot of the right column. That's the front page's first
spare room since Decision 96. The plan leaves it empty.

### The font decides how much of this lands

The wordmark and headings are **Cerulean Nights**, and Decision 137 keeps it
out of the embedded fonts ("it isn't ours to ship"). It is only
used where the machine has it installed. Everywhere else the display stack
falls back to Chakra Petch. Rendered both ways, the fallback keeps the cards,
badges, slanted cells and strip, but the wordmark and headings become generic
lowercase sans. **Most players will see the fallback.** Hence PQ1 and PQ2, and
two fallbacks that don't need a licence:

- **The wordmark as artwork, not text.** If Scott exports the lockup with its
  text converted to outlines, it is a Get Dangerous Games logo, not a font,
  and can be embedded like the frame already is (a data-URI custom
  property). The print sheet would have the real wordmark on every machine.
- **Headings in the fallback go uppercase.** Chakra Petch reads better in
  capitals (today's print headers). The heading keeps `text-transform:
  lowercase` only when Cerulean Nights is actually present: `renderPrintView`
  checks `document.fonts.check()` and sets a class. That is one line, and it
  never makes a network request.

## 3. The one data change: stat groups

The color groups are Scott's; neither the CRB nor the data has them. The
mockup hardcodes a stat-id → group map in `sheet.js`, and that can't ship
(CLAUDE.md: a new stat needs zero app changes).

**Proposed:** each entry in `D.stats` gets `group`, one of `physical`,
`mental`, `social`, and the four derived rows (WILL, TOL, LUCK, SAN) are
colored as `derived` by their place on the sheet, not by a field.
`print.css` maps each group to a color. A stat added to an existing group
needs no code. A new *group* falls back to the neutral ink outline until
it gets a color.

- **Game data version:** no bump. No computed value or choice changes
  (Decision 68).
- **Character schema:** unchanged. Nothing is stored on the character.
- **Decision 135** is satisfied: code reads the key.
- **The group names never render.** They are presentation, not rules. If
  Deighton would rather the groups have no names at all, `accent: "cyan"`
  works the same (PQ3).

**Rejected:**
- Keeping the map in code. It breaks the zero-app-changes rule for stats.
- A color value in the data. It would put presentation into game content.
  A group name lets print and screen color it differently.

## 4. What this plan leaves out

Each is worth doing. None belongs in a restyle.

- **Skill rows that show the sum** (TOTAL = Primary + Synergy + Rank +
  Modifiers), from Scott's skills page. Better for play at the table, but it
  changes what the sheet shows, and it needs the per-part numbers from an engine
  reader (Decision 89: never arithmetic in the print path). A plan of its
  own.
- **Archetype pages with the silhouettes** (pages 3–9). The biggest visual win
  in the set, and a real design question: which sections, driven by what
  data. Cyborg is blocked on F6, Vampire on F7, and several section names
  (Spiritual Force, Enhancements, House Powers) need checking against the
  CRB first.
- **The "Active" tab** on Scott's Health Level cells. It is not clear
  what it marks at the table (PQ4), and the app doesn't invent rules.
- **Pages 2 and 3** (Skills, Loadout) keep their current look in this plan.
  The same card and table styles would carry over. A second pass once the
  front page is agreed.
- **The screen sheet.** The group colors could reach the live sheet's stat
  icons too (PQ5). Not here.

## 5. What Scott's sheet says that the data doesn't

These are for Deighton and Scott, not for this plan to settle:

- **The skill list.** Scott's Utility skills include Advanced Tech, Basic
  Security, E-Security, Electronics, First Aid and Med Tech. The data has
  Basic Tech, Cybernetics, Demolitions, Engineering, Medical, Programming,
  Robotics and Security. His General column has Art, Authority, Charismatic
  Leader, Cycle, Drive, Education, Etiquette, Human Perception, Legend Lore
  and Tutor, which the data doesn't. Either the sheet predates the current
  list or the data is behind.
- **Defenses.** Scott has PROT, RES, INT, NAT, Parry and Dodge as single
  values. The data is per body location (Decision 100).
- **LUCK's icon.** Scott has one (a d10 in a hex); the app has none, so
  LUCK's badge prints empty. PQ2 covers reusing it.

## 6. Open questions

- **PQ1 (Scott):** Can Cerulean Nights be embedded, even as a Latin subset
  inside the one file? If yes, Decision 137's "isn't ours to ship" is
  revisited and most of §2's fallback work goes away.
- **PQ2 (Scott):** Can we lift his artwork: the wordmark with its text
  converted to outlines, the LUCK glyph, and later the silhouettes?
- **PQ3 (Deighton):** Do the stat groups mean anything in the rules? If they
  do, name them; if not, `accent` keeps them presentation only.
- **PQ4 (Scott):** What does the "Active" tab on a Health Level cell mark?
- **PQ5 (Ken):** Should the live sheet's stat icons take the group colors too?

## 7. How it would be built

One session, after PQ1–PQ3 are answered (PQ4 and PQ5 can wait):

1. Fold the mockup's override block into `print.css` properly. Drop the
   dead rules it overrides: the purple bars, the `clip-path` chamfer, the
   `.p-tabstrip`. The fallback display stack follows `--display` from
   Decision 137 (Chakra Petch), not the mockup's Oxanium.
2. Add `group` to `D.stats`; `pStatIcon` and `pSkillCellsHtml` read it.
   Remove `P_HEX_GROUP`.
3. Embed the outlined wordmark if PQ2 allows, and add the font-present
   class if PQ1 is a no.
4. Tests: a stat without `group` renders the neutral badge. The front
   page's blank print stays one sheet. Mutation-test both against the
   mockup.
5. Check a **real PDF**, not the print preview. Decision 94's frame defect
   has only ever been checked in Chromium's emulated print, and this
   machine has no PDF rasteriser.
6. Paperwork per *Rule or shape*: a decision superseding Decision 94 in part
   (the bars, the chamfer and the spine, and landscape settled), an app
   **minor** bump as in Decision 94, a changelog line, a log entry, and
   STATE rewritten.

The mockup is uncommitted in the `audit-plan-session-6b-6f4280` worktree: an
override block at the end of `print.css`, plus `P_HEX_GROUP` and the two
helpers in `sheet.js`. Treat it as a sketch to rebuild from, not a branch
to merge.
