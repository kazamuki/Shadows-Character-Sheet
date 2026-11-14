# Work order E8 — The game's words a tap away

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E8. It's **W133**, which Ken set apart from E2 on 2026-11-12 (EQ22): a game term inside a sentence the app writes opens its rule on hover or tap, on Decision 139's primitive. It comes after E5, which rewrote the same sentences (E5's §9 *For E8*).

**Status:** drafted 2026-11-13 by the Opus session that reviewed E5, at the conductor's request. Ken answered EQ41–EQ45 on 2026-11-13 (§4), every one Default. **Approved by Ken 2026-11-13** (in the conductor's session).
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** nothing that edits `sheet.js`, `shared.js` or the tip CSS. E4 (colour) and E6 (the phone) touch `shadows.css`; if either is open when E8 builds, the conductor checks the `.term` rule doesn't collide.
**Impeccable:** `/impeccable clarify the game words inside the sheet's sentences`. The pre-flight below is that pass's analysis; the builder doesn't run it again.

**Pre-flight:**
- **The commit is `c2d21cd`**: main after #336 (E5), app 0.68.3 under `[Unreleased]`, game data 0.54, last decision 286, last EQ 40, next free W155.
- **Probes on `main`** (the worked examples' "before"). The five TestCharacters, each hurt to damage ×3, every tab, every `<details>` open, reading the sites §5 names:
  - **Kade's Night Vision**, Main: "Dim −1 and Dark −3 don't apply to your attacks". Skills: "No Dim or Dark penalty on visual checks". Both plain text. This is W133's own case.
  - **Juno's Stunt Driver** rows, Skills: "Take 6: 19 on your next Pilot check…" (three Take lines) and "Explodes on a natural 9 or 10". Her Progression flag note reads "Which Kicker Die grows is your GM's call until the rule is settled." All plain.
  - **Wren's Aetheric Attunement** mark: "…within meters equal to your WILL".
  - **The intros** (all five characters): Skills names Rank, Primary Stat and Synergy; Progression names IP, Milestone Point and LUCK; Character names Advantages and Disadvantages.
  - **The Pain line** on Main and Skills: "Pain Level 2 — all checks take −2…" (all five, hurt). GM mode's encounter list already makes "Pain Level N" a tip (`gm.js:3448`, `TIPS.painlevel`). The sheet doesn't.
  - **Nothing in a sentence on the sheet is a tip today.** `data-tip` appears on tags, stat scores, CRANK and GM mode's encounter rows only (`grep -on 'data-tip="[a-z]*"' src/ui/*.js`).
- **The data's sentence sources**, scanned for candidate terms (whole word):
  - `whenText` (40 rows): WILL 1, Dodge 3, Parry 2, "Defensive Action" 1, "Skill Check" 1.
  - `playerNote` (23): TOL 1, SAN 1, IP 2, "Kicker Die" 2, Bleeding 1.
  - `appCopy` strings: IP 4, Primary Stat 1, Synergy 1, Rank 1, LUCK 1, Milestone Point 1.
  - `recoveryRules.naturalHealing.text`: "…HP equal to your BOD each day…"; `speedHealText`: "Speed Heal doubles it for 24 hours."
- **Where the rules already live in the data** (a term's tip reads one of these, never a copy):
  - `visibility` (`shadows-data.js:1114`): the four light levels with their attack penalty. No sentence of their own; 0530 has one for each.
  - `resources.healthLevels.painLevels`: label and description per level; `painPenaltiesPerLevel` the numbers.
  - `skillCheckRules`: `trained`, `untrained`, `explosion`, `botch`.
  - `derived`: TOL, WILL and SAN, each with a `description`.
  - `resources.luck`: `spend` (Boost, Explode) and `refresh`.
  - `milestones.rules`: the cadence numbers.
  - `conditions`: 20 entries, each with `effect` and `recovery`.
  - `Engine.statReading` (Decision 139) for the eight Stats.
  - **Not in the data:** Kicker Die (CRB `0300` §Kicker Die), Take X (`0300` §Take X), Defensive Actions (`0530` §Defensive Actions). Each is a short section in the book.
- **What the pre-flight found that W133 didn't say:**
  - **The tap-target floor refuses a word.** `phone-check` counts every `button` under 24px (44px on the touch phone) as too small (`tools/phone-check.mjs:600–607`). A word inside a sentence is about 16px tall. WCAG 2.5.8 exempts a target inside a sentence ("Inline"), and the check needs that exemption, written down, or every term fails it (EQ42).
  - **The CRB writes its penalties with a hyphen** ("a **-1 Penalty**", `0530`). A verbatim quote carrying a number would break the minus rule (`voice.test.mjs`). So the light levels quote only the book's "refers to" sentence, and their numbers come from the `visibility` table, written by code with `signed()`.
  - **Two tips for one thing already exist in GM mode.** `TIPS.condition` and `TIPS.painlevel` live in `gm.js` (`:3372`, `:3384`), so the player's sheet can't count on them. E8's term tip reads the same data through the engine. It doesn't move or reuse GM mode's (§7).
  - **`flagHtml` escapes its whole note through `noticeHtml`** (`shared.js:1096`, seven callers of `noticeHtml`). A term in a `playerNote` needs its own path, not a change to `noticeHtml`.
- **Ledger search.** Searched §4's Touches lines and text by name: `tip`, `TIPS`, `data-tip`, `tipChar`, glossary, `Engine.glossary`, `statReading`, `skillCheckRules`, `visibility`, `skillRowText`, `whenText`, `attackNotes`, `checkNotes`, kicker, Take X, `painlevel`, `playerNote`, `flagHtml`, `appCopy`, `sheetHeader`, intro, `phone-check`, 44px, print.
  - **Cited, and they stand:**
    - **139**: the one tip primitive (hover or focus shows it, tap pins it, works in a modal). E8 adds a kind, not a primitive. Its *Rejected* rules out `openPopover` and `title=`, and both stay ruled out here.
    - **71**: state copy lives in `appCopy`, so the intros stay plain text there (§9, EQ41).
    - **135**: every data key is read or named as text. `gameTerms` is read by the engine; each row's `description` and `bookSource` are text by name (`engine.test.mjs:333`'s `TEXT_KEY`). No archetype or term is named in code.
    - **207**: a Reference panel draws what the data holds, and its *Rejected* turns down "copying the tips' text into the Reference's data: one edit should move both". E8's terms point at the data rather than copy it, for the same reason.
    - **233 and 237**: the Skill-row marks, attack notes and check notes are the engine's words, "text here, never markup" (`sheet.js:324`). E8 keeps them text in the engine and wraps them in the UI.
    - **256**: the seat sheet's readers (`RO_READERS`, `gm.js:4397`, includes `[data-tip]`) work read-only. A term trigger is a `[data-tip]`, so it works there too.
    - **283**: a Condition's chip on Main opens its note and rule. A Condition named inside a sentence is a different reader; E8 doesn't change the chip.
    - **285**: Pain's penalty is said once above the table. E8 makes "Pain Level N" in that line a term, and leaves the line's words alone.
    - **96 and 233**: marks aren't printed. E8's terms aren't either.
  - **Superseded: none.** E8 extends 139 (a new tip kind, inside sentences) and doesn't overturn it.
  - **One decision, N** (§3).

**Carried over** (E5's review, 2026-11-13):
- *The order's misses:*
  - **§5 missed two Pain hyphen sites and the whole IP-balance path.** Sweep by grepping every reader, never by tab. This order's §5 lists each call site by line, and the review checklist (§14) greps for the helper's callers and every `esc(` of a sentence §5 names.
  - **A reworded rule drifted** ("move only themselves"). E8 rewrites no sentence. Its new words are the tips' titles and the light levels' number lines (§9), each checked against its table.
  - **A placeholder was missed** (`sheet.js:1686`). E8 wraps no attribute: `title`, `aria-label` and `placeholder` stay plain text (§9).
- *The build's misses:*
  - **The examples were written after the code**, so none was run red on `main`. Here, step 1 writes the examples and runs them on `main`, and the PR quotes each failure (§12). It's a review checklist item.
  - **The seat sheet's intros were checked only in jsdom.** Step 6 reads the seat sheet in the browser.
  - **The first hurt fixture was DOWN**, so a mutation passed vacuously. Every fixture asserts the state it claims before the test uses it (§10, §11).
- *Ken's E5 answers:* S2 and the Major Milestones note in the reviewer's words, the rest as built, W152–W154 wishlisted.
- **The voice-pass list goes in the PR body**, as a table, not in a notes file.
- **Screenshots can't be attached.** The preview check is recorded in the PR: what was loaded, at what size and theme, and what was read. Both themes, and the seat sheet.

---

## 1. Goal and Done when

**Goal:** a player reading a line the sheet wrote can open what a game word in it means, without leaving the line. Night Eyes' "In Dark, your attacks take −1 instead of −3" is the case: **Dark** opens what Dark is and what it does to an attack.

**Done when:**
- **The terms.** A data list, `gameTerms`, names each term and where its rule lives (§8). The engine finds terms in a string (`Engine.termSpans`) and resolves one (`Engine.term`). Neither touches the DOM.
- **The sentences.** On the sites §5 lists, each term on the list (EQ44) is a tip trigger, on its first appearance in that block (EQ45):
  - the Skill rows' marks and Take X lines;
  - Main's attack notes and Skills' check notes;
  - the six tab intros;
  - the Pain line on Main and on Skills, and Trackers' Pain card title;
  - the Rest panel's line;
  - a flag's `playerNote`.
- **The tip.** Hover or focus shows it, a tap pins it, Esc or a tap elsewhere puts it away, inside a modal too: Decision 139's behaviour, unchanged. A tap on a term inside a Skill row doesn't open or close the row.
- **The words are the source's.** A term's tip reads the table or rule its number came from. A quoted rule equals the CRB's sentence, checked by a test that reads `private/crb/` (§11).
- **The phone.** A term is the word itself, underlined, at 375×812 with touch emulated (EQ42), and `phone-check` passes with the inline exemption written into it and nothing else exempted.
- **Read-only and print.** A term opens its tip on GM mode's seat sheet, and the printed sheet shows plain words.
- **Nothing a character computes moves.** `gamedataVersion` stays (Decision 68): new text, no new value or choice.
- `npm run verify` and `npm run phone-check` pass. The frame fixture is re-recorded only for the frames §13 names.

## 2. Tier, versions, numbers

- **Tier: *Rule or shape*.** A new data list the engine reads, two engine functions, and a player-facing behaviour someone could have chosen otherwise (which words, how they look on a phone).
- **Versions:**
  - **App: minor.** A new capability a player can use. `npm run bump` moves `[Unreleased]` from whatever it reads at build (0.68.3 now) to the next minor.
  - **Game data: unchanged.** `gameTerms` and the light levels' `description` are text and pointers. No character's computed values or choices move (Decision 68), and the build proves it by a diff (§11).
  - **Character, table and pack schemas: unchanged.** Nothing is stored.
- **Numbers:** one decision, written **N**: the lowest free number on `origin/main` when it's built (286 is the last today). No flag. EQ41–EQ45 are this order's questions.

## 3. Decisions

Ready to paste. The builder fills **Built** and replaces **N**.

```
N. **A game word inside a sentence the sheet writes opens its rule on the tip: the data lists the words and where each one's rule lives, the engine finds them, and the UI makes each a trigger.**
   *<date> · Ken + Claude · Touches: gameTerms, Engine.termSpans, Engine.term, termsHtml, TIPS.term, data-tip, visibility description, skillFxHtml, attackNotesHtml, checkNotesHtml, sheetHeader intros, Pain line, Rest line, flagHtml, playerNote, phone-check inline exemption, .term, print, seat sheet, Decision 139, Decision 207, Decision 233, Decision 256, W133*
   - **Decided:** `gameTerms` lists each term by its `forms` (exact words; `{n}` is a number) and where its rule lives: a `from` the engine reads (a light level, a Pain Level, the check rules, a derived stat, a Stat, LUCK, the Milestone cadence, a Condition), or a `description` quoted from the CRB with its `bookSource`. `Engine.termSpans(text)` returns where each listed term first appears in a string (whole word, case kept, longest form first, never overlapping); `Engine.term(id, ch)` returns its tip. The UI's `termsHtml` escapes the text between them and makes each span a Decision 139 tip trigger (`data-tip="term"`), on the sites the order names: the Skill rows' marks, the attack and check notes, the tab intros, the Pain line, the Rest line and a flag's `playerNote`. A term is the word, underlined; `phone-check` exempts it as a target inside a sentence (WCAG 2.5.8). Print shows the word. No attribute and no string in `appCopy` carries markup.
   - **Why:** W133: Ken had to ask what Dim and Dark were. The tip is already where a rule is a hover or tap away (AQ4); a term inside a sentence is the gap. The list is explicit so a capitalised word is never a guess, and the tip reads the rule's own table so it can't drift from the number.
   - **Rejected:**
     - Each engine writer returning `{ text, terms }`: every reader of `skillLine`, `attackNotes`, `checkNotes` and the intros would change shape, print and GM mode's included, for spans the engine can find in the finished text.
     - Markers inside `appCopy` (`[[Rank]]`): a second syntax in the voice's own file, and a term the list knows would still need the list.
     - A ⓘ after the line, listing its terms (EQ42's alternative): 44px, but it moves the rule away from the word the player was reading.
     - Every occurrence a trigger (EQ45's alternative): a tab stop on each.
     - Reusing GM mode's `TIPS.condition` and `TIPS.painlevel`: they live in `gm.js`, and a term reads more kinds than those two.
   - **Replaces:** nothing. It extends Decision 139 (a tip kind inside a sentence) and reads 233's and 237's marks as text.
   - **Revisit if:** playtesters miss a term on a phone, or tap the wrong one of two next to each other; a sentence site outside the list needs terms (EQ43); or the list grows past what one sentence can be scanned for without a cost a player feels.
   - **Built:** app <minor>, no game-data or schema bump, PR #<n>, log <date> (E8).
```

## 4. Questions for Ken

Each has a default. A question Ken leaves blank is answered "Default".

**Ken's answers, 2026-11-13** (in the conductor's session, picked from the options, recorded by the conductor):
- **EQ41:** "Engine finds them".
- **EQ42:** "The word, underlined".
- **EQ43:** "The named sites".
- **EQ44:** "The default list".
- **EQ45:** "First in each block".
- Then: "Approve E8".

- **EQ41 — Where the terms are found.**
  - **Default:** the engine finds them in the finished text (`Engine.termSpans`), and the UI wraps them. Every writer keeps returning text. `appCopy` stays plain text, with no markers.
  - *Alternative A:* each engine writer returns `{ text, terms }`. Exact, but the shape of `skillLine().marks`, `attackNotes`, `checkNotes` and more changes, with every reader.
  - *Alternative B:* markers in the strings (`[[Rank]]`). Ken controls exactly which words in an intro are tappable, at the cost of brackets in the voice's file.
- **EQ42 — How a term looks and taps, on a phone too.**
  - **Default:** the word itself, with a dotted underline, as its own focusable trigger. `phone-check` exempts it as a target inside a sentence (WCAG 2.5.8's *Inline*), named in the tool, and exempts nothing else.
  - *Alternative:* a **ⓘ** at the end of the line, 44px, whose tip lists the line's terms and what each means. Every target stays 44px, but the rule is no longer at the word.
- **EQ43 — Which sentences.**
  - **Default:** the sites W133 and E5's §9 name: the Skill rows' marks and Take X lines, the attack and check notes, the six tab intros, the Pain line (Main, Skills, Trackers' card title), the Rest line, and a flag's `playerNote`.
  - *Alternative:* every sentence the sheet writes, its cards' descriptions and the catalogs included. A much bigger pass, better done once this one has been played with.
- **EQ44 — Which words.**
  - **Default:** game terms whose rule the data holds or the book states in a short section:
    - the four light levels;
    - "Pain Level N";
    - Kicker Die;
    - "Take N";
    - explode and botch;
    - Defensive Action;
    - the check's parts (Rank, Primary Stat, Synergy), which open how a check works;
    - TOL, WILL, SAN and LUCK;
    - the eight Stats by their ids;
    - Milestone Point;
    - the twenty Conditions by name.
  - **Left out:**
    - "Skill" on its own: it's in every other line;
    - IP, Advantages and Disadvantages: the data has no rule sentence for them;
    - app words (Activity Log, Manual Adjustment, GM);
    - Skill names: each already has its own ? on the Skills tab.
  - *Alternative:* the default plus every Skill name, which opens the Skill's description.
- **EQ45 — Each time, or the first time.**
  - **Default:** the first time each term appears in a block (one note, one mark, one intro). "No Dim or Dark penalty" has two terms, and each is a trigger once.
  - *Alternative:* every time. More tab stops, and a sentence that says "Dark" twice shows two underlines.

## 5. The assumption sweep

Each row was found by grepping the reader, not by reading a tab.

| What | True today | Where | True after |
|---|---|---|---|
| The tip primitive | `TIPS` holds `tag`, `spelltag`, `stat`, `crank`; `gm.js` adds `packrec`, `condition`, `enctrait`, `wave`, `surprise`, `ambush`, `painlevel` | `shared.js:580`; `gm.js:3136`, `:3372–3384` | `TIPS.term(id)` added in `shared.js`, reading `Engine.term(id, tipChar())`. Nothing else in `TIPS` changes |
| What opens a tip | `[data-tip]` + `data-term`, by delegation on `document` (capture click, so a tag inside a row reads out instead of opening it) | `shared.js:612–645` | Unchanged. A term is a `[data-tip]`, so it gets the capture: a tap inside a Skill row doesn't toggle the row |
| The seat sheet's readers | `RO_READERS` includes `[data-tip]`; `tipChar()` falls back to `readOnlyChar` | `gm.js:4397`, `shared.js:579` | Unchanged. A term works read-only, and a Stat term reads the seat's character |
| Skill-row marks and Take X | `skillFxHtml(l)`: `esc(t.text)` for each `takeX` and `marks` row | `sheet.js:327–332` (called at `:378`) | `termsHtml(t.text)` |
| Attack notes | `attackNotesHtml`: `esc(n.text)` | `sheet.js:334` (Main, `:486`) | `termsHtml(n.text)` |
| Check notes | `checkNotesHtml`: `esc(n.text)` | `sheet.js:336` (Skills, `:519`) | `termsHtml(n.text)` |
| The six intros | `sheetHeader(title, esc(copy(…)))`; Progression through `copyFill` | `sheet.js:517`, `:730`, `:1707`, `:2557`, `:2641`, `:2652` | `termsHtml(copy(…))` / `termsHtml(copyFill(…))`. `sheetHeader` still takes HTML (`:42`'s comment) |
| Main's name line | `sheetHeader(charName, …archetype · spec · power level)` | `sheet.js:406` | **Unchanged.** Names, not terms |
| The Pain line, Main | `esc(pain.label)` then "— all checks take…" | `sheet.js:461` | `termsHtml(pain.label)`; the rest of the line unchanged (Decision 285) |
| The Pain line, Skills | the same | `sheet.js:518` | the same |
| Trackers' Pain card title | `<h2>${esc(pain.label)}</h2>` | `sheet.js:1600` | `termsHtml(pain.label)` |
| Pain's other twins | `esc(pain.label)` in the Take-a-hit modal's header (`:1142`) and HP popover (`:1522`); print's `p-note` (`:2867`) | `sheet.js` | **Unchanged** (EQ43). The modal and popover are controls' panels; print shows no tips. Listed so the review doesn't call them misses |
| The Rest line | `esc(nh.text)` and `esc(nh.speedHealText)` | `sheet.js:1344` | `termsHtml(nh.text)`, `termsHtml(nh.speedHealText)`: "BOD" is a term |
| A flag's note | `flagHtml(entry)` → `noticeHtml(label, text)`, which escapes all of `text` | `shared.js:1095–1097` (callers: `sheet.js:672`, `:1793`, `:2294`, `:2356`, `:3224`; `wizard.js:316`, `:351`, `:463`, `:624`, `:650`, `:664`, `:771`) | `flagHtml` builds its own `<div class="flag">` with `termsHtml(note)`. `noticeHtml` and its other callers are unchanged. **The wizard's flags get terms too**: one renderer |
| The data's sentence text | `whenText`, `playerNote`, `skillRowText`, `recoveryRules`, `appCopy`: plain text | `shadows-data.js` | Unchanged. No string gains markup |
| `visibility` | `{ id, name, attack }` × 4 | `shadows-data.js:1114` | Each row also gets `description`: the CRB's "refers to"/"means" sentence for that level, verbatim, without the bold (0530 §Visibility). The numbers stay in `attack` |
| The data key guard | Every key read or text by name | `engine.test.mjs:333–383` | `gameTerms` read by `Engine.termSpans`/`term`; `forms`, `from` read; `description`, `bookSource` text by name |
| `voice.test.mjs`'s data scans | No build-state words, no hyphen-minus number in any data text | `voice.test.mjs` | Unchanged; the new descriptions fall under it. That's why the light levels quote no number |
| The tap-target check | Every `button, a[href], summary, select, input` under 24px (44px touch) fails | `tools/phone-check.mjs:600–607` | A `.term` inside running text is exempt, by one named clause citing WCAG 2.5.8 *Inline*. The exemption is tested (§11) |
| Print | `renderPrintView` draws its own lines; marks aren't printed (Decisions 96, 233) | `sheet.js:2996` | Unchanged. `termsHtml` isn't called from print. A `.term` that ever reaches print reads as the word (`print.css`) |
| Tests that read these sentences | By `textContent` (E5's intro test, the fx/notes smoke tests); `hostile.test.mjs:323` checks `innerHTML` for `[object Object]` | `tests/` | A term's text is the word, so `textContent` is unchanged and these hold. **Any test that reads one of these sites' `innerHTML` and fails is a stop** (§13) |
| The frame fixture | Box counts per frame | `tools/frame-fixture.json` | A trigger is a box: counts move on `sheet:` frames that show a term. Heights don't (§13) |

**What text points at what this changes.**
- Nothing names a tip by place.
- Skills' intro no longer says "Tap ? on any skill" (E5). Nothing E8 adds says "tap" either: the underline is the affordance.
- E5's §9 *For E8* listed the terms in E5's drafts. EQ44 keeps those with a rule in the data and leaves out the app's words (Manual Adjustment, Activity Log, GM).

## 6. Read first

- `CLAUDE.md`: constraints 1, 2, 5, 7 and 9; *Change tiers* (*Rule or shape*); *Watch for mechanical drift*; *Decisions*.
- `docs/VOICE-APP.md`, whole.
- `SCHEMA.md` §4: Decisions **139, 207, 233, 237, 256, 283, 285, 135, 71, 68**.
- `src/ui/shared.js`: *Tips* (`:563–678`), `copy`/`copyFill` (`:1042–1044`), `noticeHtml`, `flagHtml` (`:1095`), `esc`, `signed`.
- `src/engine/engine.js`: `glossary` (`:2460`) as the model for a lookup that never throws; `statReading` (`:2477`); `attackNotes`/`checkNotes` (`:1256`, `:1267`); `fillTag`.
- `src/ui/sheet.js`: every line §5 names.
- `tools/phone-check.mjs:590–640`.
- CRB: `0300_Core_Mechanics.md` §Kicker Die, §Take X, §Results (botch, explosion); `0530_Combat_Encounters.md` §Visibility, §Defensive Actions.

## 7. Out of scope

- **Every other sentence** (EQ43's default): card descriptions, catalogs, the wizard's own copy, GM mode's tabs. A flag note in the wizard gets terms only because `flagHtml` is one renderer.
- **Attributes.** `title`, `aria-label`, `placeholder` stay plain.
- **Rewording any sentence.** E8 wraps words; it doesn't change them. If a term only fits by rewording, that's a stop.
- **GM mode's own tips** (`TIPS.condition`, `TIPS.painlevel` in `gm.js`): not moved, not changed.
- **Skill names as terms** (EQ44's default), and the "(cascades)" in Manual Adjustments' select: E5 handed that one to E8 as a word to decide, and it isn't a game term (EQ44). It stays.
- **Print.**
- **Colour** (E4) and **the phone's layout** (E6).

## 8. The shapes

No save-file field, schema or `migrate()` step changes.

**Data.** `gameTerms`, a new top-level array, after `skillRowText`:

```js
/* Decision N (W133): the game's words a sentence on the sheet can name, and where each one's rule lives. `forms` are exact
   words, case kept; `{n}` stands for a number. A row's tip reads `from` (a rule the data already holds) or quotes the CRB
   (`description`, from `bookSource`). Read by Engine.termSpans and Engine.term. */
"gameTerms": [
  { "id": "bright", "forms": ["Bright"], "from": { "visibility": "bright" } },
  { "id": "dim",    "forms": ["Dim"],    "from": { "visibility": "dim" } },
  { "id": "dark",   "forms": ["Dark"],   "from": { "visibility": "dark" } },
  { "id": "blind",  "forms": ["Blind"],  "from": { "visibility": "blind" } },
  { "id": "pain-level", "forms": ["Pain Level {n}"], "from": { "painLevel": "{n}" } },
  { "id": "kicker-die", "forms": ["Kicker Die", "Kicker Dice", "Kicker die", "kicker die"], "description": "…", "bookSource": "0300 Core Mechanics, Kicker Die" },
  { "id": "take-x", "forms": ["Take {n}"], "description": "…", "bookSource": "0300 Core Mechanics, Take X" },
  { "id": "explode", "forms": ["Explodes", "explodes", "explode"], "from": { "check": "explosion" } },
  { "id": "botch", "forms": ["botches", "botch", "Botch"], "from": { "check": "botch" } },
  { "id": "defensive-action", "forms": ["Defensive Actions", "Defensive Action"], "description": "…", "bookSource": "0530 Combat Encounters, Defensive Actions" },
  { "id": "skill-check", "forms": ["Primary Stat", "Synergy", "Rank"], "from": { "check": "trained" } },
  { "id": "TOL", "forms": ["TOL"], "from": { "derived": "TOL" } },
  { "id": "WILL", "forms": ["WILL"], "from": { "derived": "WILL" } },
  { "id": "SAN", "forms": ["SAN"], "from": { "derived": "SAN" } },
  { "id": "LUCK", "forms": ["LUCK"], "from": { "luck": true } },
  { "id": "stat", "from": { "stats": true } },
  { "id": "milestone-point", "forms": ["Milestone Points", "Milestone Point"], "from": { "milestones": true } },
  { "id": "condition", "from": { "conditions": true } }
]
```

- **`forms`** are exact. A row with `{ "stats": true }` takes its forms from `D.stats` ids (BOD, REF, …), and `{ "conditions": true }` from `D.conditions` names. So a term is never typed into code, and a Condition added to the catalog is a term with no edit here (Decision 135).
- **`description` text** is drafted by the builder **verbatim from the CRB** section `bookSource` names, bold markers removed. It's the book's first paragraph, or for Defensive Actions the three actions' first sentences, and a test checks every sentence against the file (§11).
  - **A quote must carry no number written with a hyphen.** If the section's sentence has one, stop (§13).
- **`visibility` rows gain `description`:** 0530's sentence for that level ("Dim refers to areas with poor lighting, flickering neon or half-lit warehouses that make it difficult to determine distance, shape, or color."), verbatim, no bold.
- **The `from` kinds** are a closed set, each a reader:
  - `visibility`;
  - `painLevel`;
  - `check` (a `skillCheckRules` key);
  - `derived`;
  - `luck`;
  - `stats`;
  - `milestones`;
  - `conditions`.
  
  An unknown kind resolves to nothing, and its forms are never matched (§11's totality).

**Engine** (`engine.js`, exported):

- **`termSpans(text) → [{ start, end, id, n? }]`.**
  - **Input:** `text` is any value; a non-string or empty string returns `[]`.
  - **Matching:**
    - whole words only: no letter or digit right before or after;
    - case kept exactly;
    - the longest form wins where two overlap ("Pain Level 2" before "Level"; "Primary Stat" before a Stat id), and spans never overlap;
    - only the **first** span of each `id` + `n` is returned (EQ45). So "Dim" and "Dark" each appear once, and "Pain Level 2" and "Pain Level 3" are two.
  - `n` is the number a `{n}` form matched.
  - A row whose `from` doesn't resolve contributes no forms.
  - Never throws.
- **`term(id, ch, n) → { title, text, more:[…] } | null`.**
  - **Unknown `id`:** `null`.
  - **What each `from` kind reads:**
    - `visibility`: title the level's name; text its `description`; more one line with its attack penalty from the table (§9). `signed()` isn't in the engine, so the engine returns the number and the UI writes it.
    - `painLevel`: the level's label and description, and its penalties from `painPenaltiesPerLevel`, as numbers.
    - `check`: `skillCheckRules[key]` as text. For `trained` it's the trained and untrained lines.
    - `derived`: the derived stat's name and `description`.
    - `luck`: `spend`'s actions with their cost, and `refresh`.
    - `stats`: `statReading(ch, id)` when `ch` is given, else the stat's name and description.
    - `milestones`: the cadence numbers.
    - `conditions`: `effect`, with `recovery` in more.
  - **Returns numbers, never formatted signs,** so the UI writes every minus.
  - **Never throws:** a `ch` that `migrate()` produces always works; a missing one degrades to the character-free reading.

**UI** (`shared.js`):

- **`termsHtml(text)`** returns HTML.
  - It escapes every piece of `text` between spans.
  - It writes each span as a tip trigger with `data-tip="term"` and `data-term` holding the id and, when there is one, `|n`, escaped. The trigger's text is the escaped word.
  - A non-string or empty `text` returns `""`.
  - It's the only function that puts a term in HTML.
- **`TIPS.term(key)`** splits `id|n`, calls `Engine.term(id, tipChar(), n)` and returns `{ title, text, more }`, writing each number with `signed()`. It returns `null` when the engine does.

**Escaping, stated once:** strings in `appCopy` and the data stay plain text. `termsHtml` is the only place a term becomes markup, and it escapes everything it doesn't wrap. A sentence that contains `<`, `&` or a quote renders as text, wrapped or not (§11's hostile case).

## 9. The UI

**What a player sees.** In the sentences EQ43 names, each listed word (EQ44) on its first appearance (EQ45) reads as the word, with a dotted underline in the text's own colour (EQ42). Nothing else about the line changes: same words, same size, same wrap.

**What each interaction must do** (behaviour; markup is the builder's, within Decision 139's primitive):

| Press | What happens | Where focus goes | Where the record ends up |
|---|---|---|---|
| Hover a term (250ms) | Its tip shows under it | Stays where it was | Nothing stored |
| Focus a term (Tab) | Its tip shows | On the term | Nothing stored |
| Tap or click a term | Its tip pins; a second tap unpins it | On the term | Nothing stored |
| Tap a term inside a Skill row, a `<summary>` or a card | The tip pins; **the row doesn't open or close** (the capture click, `shared.js:633`) | On the term | — |
| Esc, or a tap elsewhere | The tip goes | Stays on the term (Esc) / wherever the tap landed | — |
| A term inside an open modal (the Rest panel's line, a flag in a modal) | The tip rides inside the modal (`tipEl`) | On the term | — |
| A term on GM mode's seat sheet | The same, read-only: Stats read the seat's character (`tipChar`) | On the term | — |

**The trigger** is focusable, has the word as its accessible name, and is never inside another `button` (a tag inside a button was S1's bug). On the sites §5 names, a line that is itself a button stays plain; the builder says in the PR if any is.

**The tip's words** (drafts for the voice pass; tool voice, since the player is looking something up):

| Term | Title | Text | More |
|---|---|---|---|
| Dim (each light level) | **Dim** | `visibility.description` (the book's sentence) | "Attacks against a target in Dim light take −1." From `attack`, written with `signed()`; Bright reads "Attacks against a target in Bright light take no penalty." |
| Pain Level N | the level's `label` | its `description` | "−N on Skill checks · −N Essence dice · −N% Breaker", from `painPenaltiesPerLevel`, written as `painPenaltyLine` writes it (E5's minus) |
| Kicker Die, Take N, Defensive Action | **Kicker Die** / **Take X** / **Defensive Actions** | the quoted `description` | — |
| explode, botch | **Explodes** / **Botch** | `skillCheckRules.explosion` / `.botch` | — |
| Rank, Primary Stat, Synergy | **A Skill check** | `skillCheckRules.trained` | `skillCheckRules.untrained` |
| TOL, WILL, SAN | the derived stat's `name` | its `description` | — |
| LUCK | **LUCK** | `resources.luck.refresh` | each `spend` row: "Boost the roll (2): …" |
| A Stat id | as Decision 139's stat tip | — | — |
| Milestone Point | **Milestone Points** | "One a session." with the Minor and Major cadence from `milestones.rules`, as numbers | — |
| A Condition | its `name` | `effect` | `recovery` |

- **The cadence sentence and the light lines are the only new prose.** Each reads its numbers from the table, so it can't drift. Both go to the voice pass.
- **The book's quotes are verbatim,** with no voice pass.

**Style:** the dotted underline is in the text's colour; the trigger inherits the font and has no background, border or padding. Check both themes, and that no neighbouring rule (`.tag`, `.skill-q`, `.deriv-q`) is eaten. Whole-line CSS edits, never a substring replace (E3's review).

**For later.** The terms EQ44 leaves out, and the sites EQ43 leaves out, go to `docs/WISHLIST.md` only if Ken asks; this order doesn't add a wish.

## 10. Worked examples, as named tests

Write these first, run them on `main`, and **paste each failure into the PR** (§12 step 1). One that passes on `main` is a finding unless the PR says why.

1. `engine.test.mjs`: **"N: termSpans finds each listed term once, whole words, longest first"**.
   - `termSpans("No Dim or Dark penalty on visual checks")` → Dim at 3, Dark at 10.
   - `termSpans("Dimmer lights")` → `[]`.
   - `termSpans("Pain Level 2 — all checks take −2")` → one span, `pain-level`, `n` 2.
   - `termSpans("Take 6: 19 on your next Pilot check")` → `take-x`, `n` 6.
   - `termSpans("a trained Skill rolls 1d10 + its Rank, its Primary Stat and its Synergy")` → Rank, Primary Stat and Synergy as one id (`skill-check`), **once** (the first, Rank). "Stat" inside "Primary Stat" isn't a second span.
   - A Condition name from `D.conditions` (read, not typed) is found.
   - `termSpans(null)`, `termSpans(42)`, `termSpans({})` → `[]`.
   - Fails on `main`: no `termSpans`.
2. `engine.test.mjs`: **"N: every term resolves to a tip, and its numbers are the table's"**.
   - For every `gameTerms` row (and each Stat and Condition form), `term(id, lockedCharacter(), n)` is non-null with a non-empty `title`.
   - Dark's tip carries `attack` −3 read from `D.visibility` (the test reads the table, and never types −3).
   - Pain Level 2's numbers equal `painPenaltiesPerLevel` × 2 (the fixture asserts level 2 first).
   - `term("nope")` → `null`; `term("dim", null)` works.
   - Fails on `main`.
3. `rules.test.mjs`: **"N: a term's quoted rule is the book's, word for word"**.
   - For every `gameTerms` row with a `description`, and every `visibility` row's `description`: each sentence appears in the `private/crb/` file its `bookSource` names (0530 for the light levels), after removing `**`.
   - No `description` has a number written with a hyphen-minus.
   - Fails on `main` (no rows).
4. `smoke-sheet-skills.test.mjs`: **"N: Night Vision's Dim and Dark open their rules, on Skills and Main"**.
   - A locked character holding Night Vision (find the Advantage by its `visibility` grant in the data, not by id).
   - On Skills, the mark's `[data-tip="term"]` triggers read "Dim" and "Dark". The line's `textContent` is unchanged from `Engine.skillLine`'s mark text.
   - Pressing Dark pins a tip whose title is "Dark" and whose text holds −3 written with U+2212.
   - Pressing it inside the Skill row leaves the row as it was.
   - On Main, the attack note's Dim and Dark are triggers.
   - Fails on `main`.
5. `smoke-sheet-progression.test.mjs`: **"N: the intros' terms are triggers, and their text is still appCopy's"**.
   - For each intro, `textContent` equals its `appCopy` line, filled (E5's assertion stands).
   - Skills' intro has exactly one `skill-check` trigger.
   - Progression's has Milestone Point and LUCK.
   - Admin's too (opened from the menu, as the E5 nit fixed).
   - Fails on `main`.
6. `smoke-sheet-play.test.mjs`: **"N: Pain Level, the Rest line and a flag's note carry their terms"**.
   - A character hurt to Pain Level 2 or more and **asserted not DOWN** before anything else. On Main and Skills, "Pain Level 2" is one trigger whose tip names the level's description.
   - The Rest panel opened: BOD is a trigger.
   - A flagged entry with a `playerNote` holding "Kicker Die" (Juno's Specialist Major, read from the data): Kicker Die is a trigger.
   - Fails on `main`.
7. `smoke-table-sheet.test.mjs`: **"N: a term on the seat sheet opens its tip, read-only"**.
   - The seat sheet's Skills tab: a term pins its tip, and a Stat term reads the seat's value, not the GM's last-open character.
   - `smoke-table-sheet.test.mjs:275` (the `[data-derivdesc]` press) still passes.
   - Fails on `main`.
8. `hostile.test.mjs`: **"N: a sentence with markup in it stays text, wrapped or not"**.
   - `termsHtml('Dim <img src=x onerror=1> & "Dark"')` renders, when set as `innerHTML`, with no `img` element. Its `textContent` equals the input, and Dim and Dark are triggers.
   - A `playerNote` with `<b>` in it (set on a cloned data entry) renders the characters.
   - Fails on `main` (no `termsHtml`). After the build, the mutation that drops `esc` on a segment fails it.
9. **In Chromium (the preview), at 375×812 with touch emulated and at 1280×860, in both themes,** recorded in the PR:
   - Kade (Night Vision) on Main and Skills: tap Dark, read the tip. At 375, the tip sits inside the viewport (`scrollWidth` = `clientWidth`).
   - Juno on Skills: Take 6 and Explodes.
   - A term inside a Skill row: the row doesn't toggle.
   - The `.term` rule's `getComputedStyle` (underline, colour, font) in both themes, beside `.tag` and `.skill-q` unchanged.
   - `phone-check`'s target line: ok, with the exemption counted.
   - **GM mode's seat sheet** (Dead Air): one term pinned, in the browser, not jsdom.

## 11. Tests beyond the examples

- **Totality** (`engine.test.mjs`'s totality contract, `:634`): `termSpans` and `term` on every hostile value the guard uses, never throwing. A `gameTerms` row with an unknown `from` kind, or a `visibility` id that isn't there, resolves to `null` and its forms aren't matched. Test it with a cloned data object.
- **The list is the data's** (Decision 135): no term, Stat or Condition name typed in `engine.js` or `src/ui/`. Add the guard to `engine.test.mjs`'s archetype-id check, or beside it.
- **Every `from` kind is read**, and an unknown one has a test (the default branch).
- **`voice.test.mjs`** passes on the new text: no build-state words, no hyphen-minus. Example 1 of E5 (the minus scan) still passes with triggers in the lines. A tip's numbers are inside `#tip`; open one Pain Level tip in that test and scan it.
- **Nothing a character computes moves:** script the engine's outputs (`skillLine`, `attackNotes`, `checkNotes`, `painState`, `derived`) for every archetype on `main` **before** the change, and diff after (*How exact to be*, P21). Report the count in the PR.
- **`phone-check`'s exemption is tested both ways:** it passes with `.term`; a `.term` given `display:block` (not inline in a sentence) is still counted; a plain small `button` is still caught.
- **Mutation tests**, each against the built code:
  - `termsHtml` without `esc` on a segment: example 8 fails.
  - `termSpans` returning every occurrence: example 1's "once" fails.
  - Shortest form first: example 1's Primary Stat case fails.
  - `skillFxHtml` back to `esc(t.text)`: example 4 fails.
  - The Rest line back to `esc`: example 6 fails.
  - `flagHtml` back to `noticeHtml`: example 6 fails.
  - The capture click removed from term triggers (if the builder's markup needs a branch for it): example 4's "row unchanged" fails.
  - A light level's tip number typed as a literal: example 2 fails.
  - The phone-check exemption widened to every `button`: the plain-button case fails.
- **Check each for a second path.** For example, E5's intro test also reads `textContent`; make sure example 5 fails on the *trigger* count, not on the text.
- **Every fixture asserts its state first**: hurt and standing, Night Vision held, the flag present.

## 12. Steps

1. **The examples as failing tests on `main`.** Write 1–8. Run `npm run test:fast` on `main`'s code, and **paste each failure's name and assertion line into the PR's Evidence**. An example that passes on `main` is a stop unless the reason is written down.
2. **The data:** `gameTerms`, the light levels' `description`, each quote checked against the CRB as you write it (example 3). Run `npm run test:fast`.
3. **The engine:** `termSpans` and `term`, total. Run `npm run verify`.
4. **The UI:** `termsHtml`, `TIPS.term`, `flagHtml`, and the call sites §5 lists, one at a time. Run `npm run verify` after each group.
5. **CSS and `phone-check`'s exemption,** whole-line edits. Run `npm run verify` and `npm run phone-check`.
6. **In the dev preview, recorded in the PR:**
   - the five TestCharacters at 1280×860 and 375×812 (touch emulated), dark and light;
   - example 9's reads;
   - GM mode's seat sheet in the browser;
   - the printed sheet's preview, showing no trigger.
7. **The engine-output diff** (§11), with its count.
8. **The mutation tests** (§11).
9. **After the last change of any kind, the full `npm run verify` again, and say so in the PR.**
10. **Close-out** (§14).

## 13. Stop and ask

**Stop if:**
- A term would only fit by rewording its sentence.
- A CRB sentence a `description` needs carries a hyphen-minus number, or the book has no short sentence for a term on EQ44's list. Bring the section.
- A `from` needs a kind §8 doesn't list.
- A site §5 lists renders its sentence inside a `button`, a `<label>` or an `<option>`.
- A test you didn't expect reads one of §5's sites by `innerHTML` and fails.
- A `phone-check` frame moves by height, or a frame the *Not a stop* list doesn't name moves at all.
- The engine-output diff shows any change.
- An example passes on `main` with no reason you can write down.

**Not a stop.**
- The app version literals the minor bump moves.
- Box counts on `sheet: main`, `sheet: skills`, `sheet: character`, `sheet: trackers`, `sheet: progression`, `sheet: loadout`, `sheet: notes` (a trigger is a box), with no height moving by more than 1px. Re-record those, and list each in the PR with its count.
- `voice.test.mjs` or the key guard asking for the new keys to be read or named. Read them; don't list them as exempt.

## 14. Close-out

- **`close-the-session`, for *Rule or shape*:**
  - **The decision:** paste §3, fill **N** and **Built**, and add its INDEX §3 line under the tips' topic.
  - **CHANGELOG** line(s) and `npm run changelog`.
  - **The app minor bump.**
  - **STATE** rewritten where E8's line is now wrong.
  - **A log entry**, and the `shipped.md` row with the PR number.
  - **The plan's §3 row:** E8 links this order and reads "E8 built".
  - **W133** moves to `log/wishes-granted.md` with the PR, per `WISHLIST.md`'s header.
- **CHANGELOG** (player voice, for the voice pass):
  - "**The game's words inside the sheet's own lines open their rules.** Tap *Dark* in Night Vision's line, *Take 6* on a Skill, or *Pain Level 2* above your Skills, and the rule is right there."
- **PR title:** `feat(sheet): the game's words a tap away (E8, Decision N)`.
- **PR body:**
  - the template's sections;
  - **the voice-pass table, in the body**: every new string as it renders (each tip title, the light lines, the cadence line, the changelog), old (none) and new;
  - **Evidence:** each example's failure on `main`, quoted;
  - the preview check (§12 step 6), with what was measured, both themes, the seat sheet;
  - the engine-output diff's count;
  - **Where the order didn't fit**;
  - a line saying the full suite was run after the last change.
- **Review checklist:**
  - **Redo §5's sweep:**
    - grep `termsHtml(` and check each caller is a site §5 lists;
    - grep `esc(` on each listed site's sentence, so none is left unwrapped;
    - grep `data-tip="term"` outside `termsHtml`, which should find none;
    - grep `renderPrintView` for any call to `termsHtml`.
  - **No term in code:** grep `src/` for every `gameTerms` form and every Condition name.
  - **The quotes:** read each quoted `description` against the CRB yourself, not just the test.
  - **Mechanical drift:** every tip number against its table (light, Pain, cadence, LUCK costs).
  - **Mutations:** re-run §11's yourself.
  - **The examples on `main`:** check example 1, 4 and 6 fail there yourself (scratch worktree, its own `npm ci`).
  - **Each fixture's state:** hurt-not-DOWN, Night Vision held.
  - **In the preview, both themes, 375 and 1280:** a term in a Skill row doesn't toggle it; the tip stays in the viewport; the `.term` rule and its neighbours by `getComputedStyle`.
  - **The seat sheet in the browser.**
  - **`phone-check`'s exemption:** it names `.term` inside running text only, and nothing else was loosened.
  - **The suite:** `npm run verify` on the PR's head.
  - **Voice:** read every new string against `VOICE-APP.md`, and send alternatives for Ken through the conductor.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **Examples first, red on `main`, quoted in the PR.** E5's weren't.
- **A fixture is checked for the state it claims** before the test leans on it. E5's first hurt fixture was DOWN.
- **The engine returns numbers, the UI writes the minus.** A tip's −3 goes through `signed()`; the CRB's own "-3" is never quoted.
- **Escape everything you don't wrap.** `appCopy` and the data are plain text; `termsHtml` is the only door to markup.
- **A term is never inside a button,** and a tap on one inside a row doesn't toggle the row.
- **Terms come from the data**, including the Stat ids and Condition names. None is typed in code.
- **CSS by whole lines,** and check `.tag`, `.skill-q` and `.deriv-q` beside `.term` in both themes.
- **`phone-check`'s exemption is one named clause,** tested both ways. It isn't a general loosening.
- **The seat sheet in the browser,** not just jsdom.
- **Mount the private repo** with `git submodule update --init private` in a fresh worktree before the suite. Example 3 reads it.
