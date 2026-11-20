# Plan — Help on the sheet

**Status:** **approved 2026-11-15** (Ken: every KQ on its default; the
Guide lines switch is a must, so a veteran player gets a clean sheet, as
GM mode's switch gives a GM). K1's order is drafted, its KQ9–KQ12
answered and the order approved (Ken, 2026-11-15); K1 is built (0.70.0, Decision 289). Nothing here is a
decision until the session that builds it numbers it in `SCHEMA.md` §4. Its
sessions are `K`_n_ (K for know the sheet) and its questions `KQ`_n_ (§5).
Its orders will be in `plans/help-on-the-sheet/`.
**Covers:** W156 (Help on the character sheet), and W150 (Help's polish)
because the panel this plan builds on is GM mode's (W150's own note waits
on Deighton's read of `gmGuide`, GQ39, but its layout fixes don't move any
copy). W154 (the seat sheet's
intros) is the same copy K3 moves, so K3 takes it too.
**Sources:** `src/ui/gm.js` (Help, Decision 278: `helpContext`, `syncHelp`,
`openHelp`, `paintHelp`, `helpBodyHtml`, `HELP_PREF`, `GUIDE_PREF`),
`src/ui/shared.js` (`TIPS`, `termsHtml`, `SHEET_SECTIONS`), `src/ui/sheet.js`
(`sheetHeader` and the tabs' `step-note` lines), `src/ui/app.js` (the header,
the document's `keydown`), `src/engine/engine.js` (`glossary`, `term`,
`termSpans`), and the data's `gmGuide`, `appCopy.intro*`, `gameTerms` and its
glossaries. Decisions 71, 135, 139, 166, 256, 258, 278, 281, 287.
**Tier:** *Rule or shape*, every session.

---

## 1. The problem, as a player meets it

The sheet has seven tabs (Decision 281) and every one of them is dense. Over
the last two plans it learned to explain itself one word at a time: a tip on
every rule it names (139), the rules' own words tappable inside its sentences
(287), tab intros in the city's voice (E5). What it never got is the thing GM
mode got in S31: somewhere to ask **what this tab is for**.

- **Nobody explains the tab.** Main and Trackers have no intro at all. A new
  player on Trackers sees Sanity, LUCK, Çredits and CRANK with no sentence
  saying when they'd touch any of them.
- **The words are defined, but you have to trip over them.** About 160
  definitions already sit in the data: 18 `gameTerms`, 28 effect tags, 29
  weapon tags, 6 weapon features, 7 mods, 10 armor features, 13 upgrades,
  9 spell tags, 8 Stats, 3 derived stats, 20 Conditions, 9 damage types and
  5 resources. Each one is reachable only by finding a line that uses it.
  There is no list to read before the table, and nothing to search.
- **Some words the sheet leans on have no tip.** On a first look, Health
  Levels, IP, Çredits, Focus, TN and TH are labels on the sheet that no
  `gameTerms` row or glossary answers. (K2's pre-flight makes the real list
  by script.)
- **The intros can't be put away.** A player who knows the sheet reads the
  same sentence on every visit. GM mode has a **Guide lines** switch; the
  sheet has nothing.

**What this plan is not.** It isn't a lot of new rules text. Most of the
words already exist, and the risk runs the other way: a glossary that copies
them is a second copy that drifts (Decision 135). The new data is the
per-tab copy (what a tab is for, when you use it, a tip or two), and
definitions only for the words that have none, each quoted from the CRB.

## 2. The shape

One Help, two guides:

- **The panel is GM mode's, lifted into `shared.js`** (K1). It takes a guide
  (`gmGuide` or the new `sheetGuide`) and a function that says which context
  is open. GM mode's Help behaves exactly as it does now; the S31 tests are
  the proof and don't change. Copying the panel into `sheet.js` instead would
  give two panels to keep in step, and W150's polish would have to land
  twice.
- **`sheetGuide`** sits beside `gmGuide` in the data, in the same shape:
  `ui`, `contexts` (one per tab, then the narrower ones K3 adds), `words`
  as references, and `lines` for the guide lines (K3). Deighton, Scott and
  Ken edit it without touching code (Decision 278's reason).
- **A context's words are references, never text.** `"words": [{ "term":
  "kicker-die" }, { "stat": "WILL" }, { "tag": "Brawler" }]`. The panel
  draws each from where its rule already lives, through one engine reader
  (K2). A word a context names that doesn't resolve fails a test.
- **Every word** is that reader run over every source: one list, A–Z, with a
  filter box. At 160 or so entries GM mode's 43-word list stops working
  without one.
- **Guide lines** is a switch, on until a player turns it off, for the
  player who knows the sheet and wants a cleaner one (Ken, 2026-11-15). It
  lives in Help's foot, as GM mode's does, and is view state in this browser
  (`shadows.ui.sheetGuide`), never in the `.shadows.json` (constraint 7).
  It hides orientation, never a rule (KQ5).

## 3. Sessions

| Session | What a player gets | Tier · app | Waits on |
|---|---|---|---|
| **K1 — One Help, on the sheet too** · order drafted: [`K1-one-help.md`](help-on-the-sheet/K1-one-help.md), KQ9–KQ12 answered | A **?** on the sheet and the **?** key open Help for the tab that's open: what it's for, when you use it (making the character, at the table, between sessions), the words on it, a tip or two. The **Guide lines** switch hides the tab intros. GM mode's Help is the same panel, unchanged, and gets W150's polish: the foot within reach on a phone, a stronger heading | *Rule or shape* · minor | Ken's answers (§5) |
| **K2 — Every word** · **built** (Decision 291, app 0.71.0): [`K2-every-word.md`](help-on-the-sheet/K2-every-word.md), KQ13–KQ18 answered (Default) | *Every word* lists the game's words once, each from where its rule lives, A–Z with a filter. The words the sheet uses with no definition get one, quoted from the CRB; a word the CRB doesn't define is a flag to Deighton, not copy. Each context's words widen from `gameTerms` to every source | *Rule or shape* (the engine reader) and *Content* (the new definitions) · minor, game data bump if a definition is added | K1 merged |
| **K3 — Guide lines everywhere** · **built** (Decision 298, app 0.73.0): [`K3-guide-lines.md`](help-on-the-sheet/K3-guide-lines.md), KQ19–KQ22 answered (Default) | The sheet's other guide lines (Milestones' "Each once, in any order…", Admin's, the loadout links, the empty states) move into `sheetGuide.lines` and obey the switch; a line that states the character's state or a rule stays. Help gains the narrower contexts: the owed-pick dialog (273), Expert mode, Admin, the seat sheet (KQ6). W154's read-only intros on a seat come with it | *Rule or shape* · minor | K1 merged; K2 for the words in the new contexts |
| **K4 — Help's layout** · order drafted 2026-11-20: [`K4-help-layout.md`](help-on-the-sheet/K4-help-layout.md), KQ23–KQ27 for Ken | Ken, after a night with Deighton (2026-11-19): Help's views are tabs at its top (*This page*, *A night at the table*, which now says what a night is, *Every word*), with Close; that head and the vitals' never scroll away. From 1280px the page scrolls in its own box, so a pinned column's scrollbar and the page's aren't side by side at the screen's edge | *Rule or shape* · minor | Ken's answers (KQ23–KQ27) |
| **Voice** | Deighton's read of the copy, as GQ39 is for `gmGuide`: edits to `sheetGuide` in the data | Content · patch | K1 and K3 merged |

**Why this order.** K1 proves the lift on code that already has tests and
puts something in front of players soonest. K2 is where the data grows, and
it's safer once the panel that draws it is settled. K3 is a sweep of
`sheet.js`'s 76 `step-note` lines, sorted three ways (state, rule, guide), and
is easiest when the switch and the contexts it lands in exist.

**What each order's pre-flight must check** (beyond `WORK-ORDERS.md`'s list):
- **K1:** whether a **?** fits the header at 375px beside Expert, Home and ⋮,
  with `npm run phone-check`'s header height (Decision 140 and 208) as the
  floor, before KQ1's default is built. Every reader of `HELP_PREF`,
  `GUIDE_PREF`, `#ghelp` and `data-thelp`, since the lift moves them. The
  document's `keydown` in `app.js`, which already routes Esc to a table's
  Help.
- **K2:** the gap list by script, not by hand: every label and term the
  sheet's renderers write, against every source the reader reads. Two sources
  that define the same word differently (AP is a weapon tag and a spell tag,
  Decision 116) are listed, and the order says which wins on *Every word*.
- **K3:** every `step-note` in `sheet.js` in one table, each marked state,
  rule or guide, so the review checks a classification and not a hunch.

## 4. Out of the plan

- **The wizard.** Its eight steps have intros of their own (`stepOneIntro`)
  and would take the same panel. KQ7.
- **Print.** Paper has no Help; it keeps the words as they are (287).
- **A first-run tour.** Decision 278 rejected one: read once, gone when it's
  needed.
- **New rules.** A definition says what the CRB says. Anything else is a
  flag (`close-a-flag`).

## 5. Questions for Ken

**Answered 2026-11-15 (Ken): Default on all eight.** Ken added one thing
that isn't a question: **the Guide lines switch is a must**, for the
veteran player who wants a cleaner sheet, as GM mode's is for a GM. K1
ships it over the tab intros and K3 extends it to every guide line, so with
it off the sheet shows its state and its rules and nothing that only
explains the sheet. Help itself (the **?**) stays either way.

- **KQ1 — Where the sheet's ? sits.**
  - **Default:** in the header, as GM mode's does, so a GM who plays knows
    where it is. If K1's pre-flight finds it doesn't fit at 375px, it goes
    into the ⋮ menu below 480px, and the **?** key works everywhere.
  - *Alternative:* beside each tab's title, under the header. It costs the
    header nothing, but it scrolls away, and it's a second place to learn.
- **KQ2 — One Guide lines switch or two.**
  - **Default:** two, one for the sheet and one for the table. A GM who
    knows the table may be new to a player's sheet, and the other way round.
  - *Alternative:* one switch for the app.
- **KQ3 — Lift GM mode's panel, or build the sheet its own.**
  - **Default:** lift it into `shared.js` (§2). K1 touches shipped GM code,
    and the S31 tests guard it.
  - *Alternative:* a second panel in `sheet.js`. Nothing in GM mode moves,
    but the two drift, and W150 lands twice.
- **KQ4 — What *Every word* holds.**
  - **Default:** the game's words: `gameTerms`, the tag, feature, mod and
    upgrade glossaries, Stats, derived stats, Conditions, damage types and
    resources.
  - *Alternative:* the catalog too (36 Skills, 87 Advantages and
    Disadvantages, gear, spells). They already have their own lists with
    descriptions, and they'd bury the words a new player is looking for.
- **KQ5 — An intro that states a rule.** `introSkills` says what a Skill
  rolls; `introProgression` says what a session pays.
  - **Default:** a sentence that states a rule or a number is never a guide
    line, and stays when the switch is off. K1 splits those two intros: the
    rule stays, the orientation hides.
  - *Alternative:* the switch hides every intro, and the rule is repeated in
    that tab's Help.
- **KQ6 — Help on GM mode's seat sheet** (Decision 256 draws the player's
  tabs there).
  - **Default:** the table's Help, since one screen has one Help. Its
    `character` context names the sheet's tab that's open and shows that
    tab's words.
  - *Alternative:* the player's Help on a seat.
- **KQ7 — The wizard.**
  - **Default:** out of this plan. A W item for Help on the creation steps,
    once K3 is built.
  - *Alternative:* a K4 in this plan.
- **KQ8 — A word the CRB doesn't define.**
  - **Default:** a flag each, batched to Deighton as one page of one-tap
    picks, as the rules questions were. Until he answers, the word is on
    *Every word* with its `playerNote` and no definition.
  - *Alternative:* the word is left off until he answers.

## 6. Closing

The plan closes when K1–K3 are built and the voice pass is in, or when Ken
says the pass is done. Its leftovers become W items.
