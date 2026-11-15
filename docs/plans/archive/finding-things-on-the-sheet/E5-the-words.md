# Work order E5 — The words

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E5. The plan gave E5 five things:
- the tab intros that survived E2, in NYTE voice;
- one wording for the load check's orphan lines and the sheet's "no longer in the game data" chips, engine and UI together;
- the IP amount placeholder that shows as "amoun";
- the `?` on TOL and WILL, sitting where a modifier goes;
- true minus throughout.

E3's §7 handed it the Grimoire's "Improvised spells and ones your GM agreed to…" line, and "every intro".

**Status:** drafted 2026-11-13 by the Opus session that reviewed E3, at the conductor's request. Ken answered EQ36–EQ40 on 2026-11-13 (§4), every one Default. **Approved by Ken 2026-11-13** (in the conductor's session, after EQ36 was explained to him).
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** E4 (colour) and E6 (the phone).
- E4 also edits `shadows.css`, but different rules. E5's only CSS is the two amount fields' width (EQ39) and the TOL and WILL `?` (EQ38).
- E6 waits on E3, not on E5.
- **E8 (W133) comes after E5** and rewrites the same sentences. §9 *For E8* says what it inherits.
**Impeccable:** `/impeccable clarify the sheet's player-facing copy`. The pre-flight below is that pass's analysis. It was run on `main` in the dev preview with the five TestCharacters, at 1280×860 and 375×812. The builder doesn't run it again.

**Pre-flight:**
- **The commit is `7e8ac0f`**: main after #334, app 0.68.2 under `[Unreleased]`, game data 0.54, last decision 286, last EQ 35.
- **Probes on `main`** (the worked examples' "before"):
  - **A minus, on the five characters,** read on every tab from the text, `title`, `aria-label` and `placeholder`, with every `<details>` opened and every `[hidden]` shown. **Only Dax shows a hyphen-minus, and he shows a dozen:**
    - "Pain Level 1 — all checks take -1; totals below include it." (Main)
    - "…all skill checks take -1; the totals below already include it." (Skills)
    - "Pain Lv 1 · -1 skill" (the chip, Main and Skills)
    - "-1 skill · -1 Essence (min 1) · -5% Breaker (min 10%)" (Main)
    - "-1 Skill checks · -1 Essence dice (min 1) · -5% Breaker (min 10%)" (Trackers)
    - a bare "-1" on every tab: the vitals bar's Pain pill.
  - The other four aren't hurt, so they show none. **`voice.test.mjs`'s render check uses an unhurt `lockedCharacter()` and reads visible text only, which is why it passes.**
  - **The amount fields** (`[data-ipamt]` on Progression, `[data-cramt]` on Trackers) are 84px wide with 11px padding a side.
    - **At 375×812 with touch emulated:** 16px mono, so "amount" is 57.6px of text in a 60px content box. The number spinner takes part of that box, which is the critique's "amoun".
    - **At 1280:** 14.72px, the same 84px box.
  - **TOL and WILL** read "TOL 11 ?" where every other stat reads "BOD 6 +0". The `?` is `.deriv-q`, a toggle (`data-derivdesc`), in the slot the other cells use for the modifier (`sheet.js:192–199`). Its row reads "1 + INT 5 + BOD 0 + COOL 4 = 10 + 1 bonus → 11".
  - **The Activity Log's raw ids** (the critique's "audit labels carry raw ids") are history: Dax's "Bought road-warriors-jacket" and Kade's "Bought ranger-protection-armor" were written by older builds. Today's label is `Bought ${pre.name}` (`sheet.js:3127`). **Out of scope** (§7).
- **What the pre-flight found that the plan didn't say:**
  - **The orphan wording is five wordings, not two:**
    - "no longer exists in game data" (the load check, 12 lines);
    - "is no longer in the game data" (`skillLine`'s `dataWarning`);
    - "no longer in the game data" (5 chips);
    - "isn't in the game data any more" (3 Condition and Aberration notes);
    - "isn't in the book any more" (the Grimoire's missing spell).
  - **The Manual Adjustments note is wrong, not just in the wrong voice.** It says to add *Honed*'s Stat point by hand. Since Decision 217, taking Honed asks for its Stat and writes the Adjustment itself (`D.milestones.minorShared`'s `honed` has `choice: { type: "statPoint" }`), so a player who follows the note gets the point twice. **Decision 26** still says "milestone benefits stay prose + manual" without a mark for 217. §14 fixes the mark.
  - **The amount placeholder is on two fields, not one:** Çredits' too.
  - **One test goes vacuous if the wording changes and the test doesn't.** `engine.test.mjs:1285` (C9) filters for `/ no longer exists /` and asserts that **none** are left. With new wording it passes whatever happens. §5 and §13.
  - **`fillTag` drops a line whose placeholder is empty** (`engine.js:390`). `Major Milestone "${t && t.id}"` with no id prints `"undefined"` today, but through `copyOf` it would print nothing. §15.
- **Ledger search.** Searched by name: `versionCheck`, load notice, `loadIssuesHtml`, `dataWarning`, "no longer", "game data", `appCopy`, `copyOf`, `statusLabel`, `sheetHeader`, `step-note`, intro, `deriv-q`, `derivdesc`, TOL/WILL, `statCellHtml`, `data-ipamt`, `data-cramt`, Grant IP, `painChip`, `skillPenalty`, `signed`, `modText`, minus, Manual Adjustment, Honed, Major Milestones, Improvised.
  - **Cited, and they stand:**
    - **71**: state copy lives once in `appCopy`, so the voice is a data edit. It's why §8 puts the new words there.
    - **125**: what the load check finds stays until dismissed.
    - **273**: the load notice's game-data line has no version numbers and no "game data" (`engine.test.mjs:706`). E5 brings the orphan lines into line with it.
    - **36**: TOL and WILL are value-only cells with no modifier. EQ38 keeps that.
    - **285**: Pain's penalty is said once above the table. E5 changes only how its number is written.
    - **217**: Honed's chooser.
    - **26**: the manual ledger.
    - **76**: the voice standard.
  - **The minus rule** (`VOICE-APP.md` §3, Ken 2026-10-09) is a voice rule, not a decision.
  - **Superseded: none by E5.** Decision 26 needs the in-part mark for 217 it never got; §14.
  - **No decision.** E5 is *Fix* (§2), unless Ken takes an alternative that §4 says changes the tier.

**Carried over** (E3's review, 2026-11-13):
- *The order's misses:*
  - **"An undo folds every named row" was overbroad.** `diffChar` folds rows only on a same-length restore. E5 makes no undo claim; nothing E5 changes is logged.
  - **§12 asked for screenshots in the PR, and neither session can attach images.** E5 asks for a **preview check recorded in the PR**: what was loaded, at what size and theme, and what was read (text, a computed style, a measurement). Ken accepted that for E3.
- *The build's misses:*
  - **The builder skipped the seat-sheet check.** E5's intros and chips render on GM mode's seat sheet too, so it's a step (§12) and a checklist item (§14).
  - **The reviewer's own nit commit broke two CSS rules no test reads.** A string replace that removed a duplicate line also matched the end of the line it had just been merged into. Every CSS change in E5 gets a preview check of the rules it touches **and their neighbours**, in both themes. CSS is edited with exact, whole-line edits, never a substring replace.
- *Ken's answers on E3:* the tightened undo wording, the preview check in place of screenshots, and the positional column guard were all accepted.
- **Strings:** E2b's were kept as built except one changelog line. So §9 lists every string E5 changes, old and new, and marks each for the voice pass.
- **`validate()` and `versionCheck()` write copy.** The sweep (§5) grepped `engine.js` as well as `src/ui/` and the data.

---

## 1. Goal and Done when

**Goal:** the sheet's words say what's true, in the city's voice where nobody's stuck and plain words where someone is, and every number reads the same way.

**Done when:**
- **Minus.** No negative number on the sheet is written with a hyphen, at any Pain level. That covers text, `title`, `aria-label` and `placeholder`, on every tab, on the player's sheet and the seat sheet. The vitals pill, the chip, the two lines above the tables and both Pain summaries use `signed()` or `modText()` (`shared.js`).
- **Orphans.** Everything the game data no longer has reads one wording: the load notice's lines, `skillLine`'s `dataWarning`, the row chips, the Condition and Aberration notes, and the Grimoire's missing spell.
  - The wording lives once, in `appCopy`, and is read by the engine (`copyOf`) and the UI (`copy`).
  - No player-facing string says "game data".
- **Intros.** Each tab intro reads as §9 drafts it, after Ken's voice pass, from `appCopy` (EQ36). No intro tells the player how to use the app ("Tap…").
- **Section notes.** The section notes §9 lists read as drafted. None names the engine, "downstream", "prose prerequisites" or "input Stats".
- **Manual Adjustments.** The note no longer tells a player to add a Minor Milestone's benefit by hand where taking the Minor already applies it.
- **TOL and WILL.** The modifier slot is empty, as Decision 36 says. The derivation is still a tap away (EQ38).
- **"amount"** shows whole in both amount fields at 375 and 1280 (EQ39).
- **Nothing a character computes moves.** `gamedataVersion` stays (Decision 68).
- `npm run verify` and `npm run phone-check` pass. The frame fixture is re-recorded only for the frames §13 names.

## 2. Tier, versions, numbers

- **Tier: *Fix*.** Copy, a wrong instruction, and how a number is written. Nothing here is a rule or a data shape:
  - **New `appCopy` keys** follow Decision 71's own rule ("every player-facing string the app generates for a state now lives in one `appCopy` block"), as E1b's `stepOneIntro` and `writeInIntro` did. They are read by code, so Decision 135 holds.
  - **EQ38's default** keeps Decision 36 (value only, no modifier) and moves a control already there.
  - **Where it would change:** if Ken takes EQ38's alternative B (the derivation always shown), Main's stat block changes height, and that is *Rule or shape* (a decision, and E3's §1 *Revisit if* on Main's columns). Its default and alternative A stay *Fix*.
- **Versions:**
  - **App: patch.** `npm run bump` moves `[Unreleased]` from whatever it reads when built (0.68.2 now) to the next patch.
  - **Game data: unchanged.** `appCopy` text changes no computed value and no choice (Decision 68).
  - **Character, table and pack schemas: unchanged.**
- **Numbers:** no decision. No flag. EQ36–EQ40 are this order's questions.

## 3. Decisions

None. *Fix* tier (§2). Decision 26 gets its in-part mark for 217 (§14), a ledger correction rather than a new decision.

## 4. Questions for Ken

Each has a default. A question Ken leaves blank is answered "Default".

**Ken's answers, 2026-11-13** (in the conductor's session, picked from the options, recorded by the conductor):
- **EQ36:** "In appCopy". He asked for it to be explained first, and chose it after the explanation.
- **EQ37:** "isn't in the current rules".
- **EQ38:** "? beside the name".
- **EQ39:** "Widen the two fields".
- **EQ40:** "Six intros + six notes".
- Then: "Approve E5".

- **EQ36 — Where the tab intros live.**
  - **Default:** in `appCopy`, one key a tab (`introSkills`, `introCharacter`, `introProgression`, `introLoadout`, `introNotes`, `introAdmin`), plain text with `{placeholders}`.
    - `VOICE-APP.md` says rewriting the app's voice is a data edit, and Decision 71 put state copy there. `stepOneIntro` is already an intro in `appCopy`.
    - E8 then marks game terms in one file.
  - *Alternative:* leave them in `sheet.js` and change only the words.
- **EQ37 — The orphan wording.** It's tool voice, since the load notice is a file notice (`VOICE-APP.md`). **Default:**
  - **Load line:** `{kind} "{name}" isn't in the current rules. The character keeps it, and your GM says what it does now.`
  - **Row chip:** `not in the current rules`.
  - **Condition, Aberration and spell notes:** `This {kind} isn't in the current rules.`
  - **Why "rules":** "current rules" pairs with Decision 273's version line ("saved under older rules and opens under the current ones"). "Your GM says" hands the table its authority, the shape `VOICE-APP.md` gives for anything unsettled.
  - *Alternative:* "isn't in the book any more", the Grimoire's existing words. Warmer, but it names the CRB for a weapon or a Condition the player may never have read there.
- **EQ38 — TOL and WILL's `?`.** **Default:** the `?` moves up beside the stat's name ("TOL ?"), the way a skill's `?` sits by its name. The slot under the value is left empty, as Decision 36's "no modifier" says. Same toggle, same `data-derivdesc`, same breakdown row.
  - *Alternative A:* the slot holds the word **derived** as the toggle's text. It's a word, so it can't read as an unknown number, but it is jargon a new player may not know.
  - *Alternative B:* no toggle. The breakdown is always shown under the value. This changes Main's height: *Rule or shape* (§2).
- **EQ39 — "amount".** **Default:** both amount fields widen so "amount" shows whole at every width. The CSS is on `[data-ipamt]` and `[data-cramt]` only, not every `.trk` number field, since SAN's set field is a `.trk` number too. The words don't change.
  - *Alternative:* the placeholder names the unit instead ("IP", and "Ç" or "Çredits"), at today's width. Shorter, but it repeats what the button beside it says.
- **EQ40 — How far "every intro" goes.** **Default:** the six tab intros and the six section notes in §9's second table, chosen because each describes the software or says something that isn't true.
  - Empty-state lines ("Nothing carried yet.", "No sessions yet. NYTE City is patient.") stay. They are short, and most already read right.
  - *Alternative:* every `step-note` on the sheet (76 sites). That's a bigger pass and better done as E8's, since E8 rewrites the same sentences.

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| Pain's penalty, written | Bare `${pain.skillPenalty}`, `${pain.essencePenalty}`, `${pain.breakerPenalty}`: "-1" | `sheet.js:12–14` (`painSummary`), `:52` (`painChip`), `:242` (the vitals pill), `:461` (Main's line), `:518` (Skills' line) | `signed()` for each, so "−1" and "−5%". GM mode's twin already does it (`gm.js:4330`) |
| The minus guard | Renders an unhurt `lockedCharacter()` on every tab and reads visible text | `voice.test.mjs:250` | Also renders a hurt one (Pain Lv 1 or more) and reads `title`, `aria-label` and `placeholder` too (§10, example 1) |
| The load check's orphan lines | 12 template literals, "… no longer exists in game data." | `engine.js:6258–6287` (`versionCheck`) | One `appCopy.orphanLine` through `copyOf(key, fallback, vars)` (`engine.js:352`), with `{kind}` and `{name}`. The fallback is the same sentence, so a data file without the key still reads right. Each `name` is passed as `String(…)` (§15) |
| `skillLine`'s orphan `dataWarning` | "Skill "x" is no longer in the game data." | `engine.js:1216` | The same `orphanLine`. **It renders nowhere today:** its only reader, `wizard.js:571`, maps `D.skills`, which never holds an orphan. It's still copy, and `smoke-wizard.test.mjs:268` pins it |
| The row chips | "no longer in the game data", 5 sites | `sheet.js:632` (specialization), `:833` (Aberration chip), `:2129` (gear), `:2288` (weapon), `:2340` (armor) | `copy("orphanChip")` |
| Condition and Aberration notes | "This Condition/Aberration isn't in the game data any more." | `sheet.js:82`, `:642`, `:838` | `appCopy.orphanNote` with `{kind}` |
| A missing book spell | "<b>id</b> isn't in the book any more." | `sheet.js:2495` | The same `orphanNote`, with `{kind}` Spell. The id stays bold |
| What the load notice shows | Engine lines, rendered by `loadIssuesHtml` | `shared.js:996` | Unchanged. **The seat sheet suppresses the notice** (`gm.js:4399–4409` clears `S.importIssues`), so it shows only the chips there |
| Tests that pin the old orphan words | Exact strings, `/no longer exists/` and `/no longer in the game data/` | `engine.test.mjs:1266`, `:1279`, `:1285`, `:2133`, `:5475–5476`; `smoke-wizard.test.mjs:268`; `smoke-sheet-play.test.mjs:2280` | Each reads `appCopy`'s wording, not a literal. **`:1285` is the vacuous trap:** it filters for the old words and asserts that none are left, so it must filter for the new ones. Write it to count orphans *before* the cleanup (5) as well as after (0) |
| `startsWith(`${kind} "${id}"`)` | C9's check that each kind is named | `engine.test.mjs:1279` | Holds if `orphanLine` starts with `{kind} "{name}"` (EQ37's default does). If Ken's wording doesn't, the test reads the template instead |
| Tab intros | Template strings passed to `sheetHeader(title, note)` | `sheet.js:517` Skills, `:730` Character, `:1707` Progression, `:2557` Loadout, `:2641` Notes, `:2652` Admin. Main has a name line, Trackers none (E2b) | `appCopy.intro…` (EQ36), escaped, with `{perHour}` filled for Progression |
| Intros' readers | `sheetHeader` | `sheet.js:39` | Unchanged. **They render on the seat sheet too**, since it draws the same tabs |
| Tests that pin an intro | `/5 IP an hour of play/` | `smoke-sheet-progression.test.mjs:526` | Holds if the new Progression intro keeps "IP an hour of play" (§9's draft does) |
| The lines above the tables | "…all checks take -1; totals below include it." | `sheet.js:461`, `:518`; pinned by `smoke-sheet-skills.test.mjs:1363` (`/all checks take .* totals below include it/`) | Only the minus changes. The regex still holds |
| Manual Adjustments' note | "For milestone benefits and other effects the engine doesn't model yet — e.g. *Honed* grants a Stat point… Stat adjustments cascade through everything downstream; the rest apply flat." | `sheet.js:1678` (Trackers) | §9. It names no Minor whose data has a `choice` (Decision 217); example 6 reads that from the data |
| Its select's option labels | "BOD (cascades)" … | `sheet.js:1681` | **Unchanged** (EQ40). Listed for E8 |
| Major Milestones' note | "…Prose prerequisites are the table's call…" | `sheet.js:1785` | §9 |
| The Grimoire's own-spells note | "Improvised spells and ones your GM agreed to. The book's numbers don't apply to these." | `sheet.js:2550` | §9 |
| Admin's TOL/WILL note | "…adjust their input Stats (or use a Manual Adjustment in Trackers)." | `sheet.js:2700` | §9. **Manual Adjustments is on Trackers** (checked: `renderShTrackers`, `:1557`), so the pointer stays |
| The raise modal's TOL/WILL note | "WILL and TOL cannot be raised directly — they move when their input Stats do." | `sheet.js:3190` | §9 |
| TOL and WILL's `?` | In the modifier slot | `sheet.js:197–199`; `.deriv-q` at `shadows.css:502–504`; `smoke-table-sheet.test.mjs:275` presses `[data-derivdesc]` on the seat sheet | Beside the name (EQ38). Same `data-derivdesc`, so `RO_READERS` (`gm.js:4397`) and that test hold |
| The amount fields | `.trk input[type=number]{width:84px}` | `shadows.css:529`; inputs at `sheet.js:1475`, `:1712` | Wider for `[data-ipamt]` and `[data-cramt]` only (EQ39). The vitals popover's Çredits field is `.pop-cred`'s 110px (`:826`), which fits already |
| `voice.test.mjs`'s rendered-copy checks | Scan visible text for build-state words | `voice.test.mjs` | Unchanged. The new `appCopy` keys fall under "state copy lives in appCopy" (`:156`) |

**What text points at what this changes.**
- Admin's TOL/WILL note points at Manual Adjustments "in Trackers". That's true, and it stays.
- Progression's intro points at the rate control "below". That's true, and it stays.
- Nothing points at the `?` by place.
- The CHANGELOG's old lines are history.

## 6. Read first

- `CLAUDE.md`: constraint 9 (maintainer content never renders), *Change tiers* (*Fix*), *Watch for mechanical drift*.
- `docs/VOICE-APP.md`, whole. It's short.
- `SCHEMA.md` §4: Decisions **26, 36, 71, 125, 217, 273, 285**.
- `src/engine/engine.js`:
  - `copyOf` and `fillTag` (`:352`, `:390`);
  - `versionCheck` (`:6252`);
  - `skillLine`'s orphan branch (`:1209`).
- `src/ui/shared.js`: `copy` (`:1042`), `signed`, `modText`, `numText`, `loadIssuesHtml` (`:996`).
- `src/ui/sheet.js`: every line §5 names.
- `tests/voice.test.mjs:234–265` (the minus checks), `tests/engine.test.mjs:1269–1287` (C9).

## 7. Out of scope

- **The Activity Log's old labels** with raw ids. They are saved history, and today's code writes names. Rewriting stored labels would edit what a file holds.
- **Every other `step-note`** (EQ40's default), including empty states and the Manual Adjustments select's "(cascades)".
- **The wizard's copy.** `validate()` is E1b's, and its strings are settled.
- **GM mode's own tabs.** The seat sheet is in scope only because it draws the player's tabs.
- **Game terms a tap away** (E8, W133).
- **Colour** (E4), and **the phone's layout** (E6).

## 8. The shapes

No save-file field, engine signature, schema or `migrate()` step changes. In the data, `appCopy` gains:

| Key | Template | Read by |
|---|---|---|
| `orphanLine` | `{kind} "{name}" isn't in the current rules. The character keeps it, and your GM says what it does now.` | `versionCheck`, `skillLine` (engine, `copyOf`) |
| `orphanChip` | `not in the current rules` | the five chips (`copy`) |
| `orphanNote` | `This {kind} isn't in the current rules.` | Condition, Aberration and spell notes (`copy` + replace) |
| `introSkills`, `introCharacter`, `introProgression`, `introLoadout`, `introNotes`, `introAdmin` | §9 (EQ36) | `sheetHeader`'s callers |

**Each new key is read**, so `engine.test.mjs`'s "a data key nothing reads" (Decision 135) holds. Each `{placeholder}` is filled, and the engine side goes through `copyOf` with the literal sentence as its fallback.

## 9. The UI: every string, old and new

**Voice pass.** Every *new* string below is a draft for Ken's voice pass. The builder pastes each as it renders into the PR, and the reviewer drafts alternatives side by side through the conductor.
- **City** is city voice (`VOICE-APP.md`: nobody's stuck).
- **Tool** is tool voice: a file notice, or Admin, where a player is fixing something.

**The tab intros** (EQ36, from `appCopy`):

| Tab | Old | New (draft) | Voice |
|---|---|---|---|
| Skills | Trained skills roll 1d10 + Rank + Primary Stat + Synergy; untrained roll 1d10 + Primary Stat only. Tap **?** on any skill for what it covers. | A trained Skill rolls 1d10 + its Rank, its Primary Stat and its Synergy. An untrained one rolls 1d10 + its Primary Stat, and nothing else. | City |
| Character | Who you are and what you can do: your archetype and what it gives you, then the Advantages and Disadvantages you bought. Tap an Advantage or Disadvantage to read what it does. | What you are and what it gives you, then the Advantages and Disadvantages you carry. | City |
| Progression | Logging a session grants *{perHour} IP an hour of play* (change it below if your table runs different), 1 Milestone Point, and refreshes LUCK — it only resets when a session truly ends. | Log a session when it truly ends. It pays {perHour} IP an hour of play (your table can change the rate below), 1 Milestone Point, and refreshes your LUCK. | City |
| Loadout | Weapons, armor and gear: what you carry into the city. | *Unchanged* (moves to `appCopy`) | City |
| Notes | Freeform. The city keeps receipts — so should you. | *Unchanged* (moves to `appCopy`) | City |
| Admin | Direct edits to the character's stored values, bypassing creation caps and pools. For fixing mistakes. Everything here is logged to the Activity Log on Progression and can be undone. | Change any number directly, past creation's caps and pools. It's for fixing mistakes: every change is logged in the Activity Log on Progression and can be undone. | Tool |

**The section notes** (EQ40):

| Where | Old | New (draft) | Voice |
|---|---|---|---|
| Trackers, Manual Adjustments (`:1678`) | For milestone benefits and other effects the engine doesn't model yet — e.g. *Honed* grants a Stat point (any Stat, including WILL, LUCK, or TOL). Stat adjustments cascade through everything downstream; the rest apply flat. | For what the sheet doesn't add up by itself: an item, a ruling, a scar the city left. A Stat moves everything worked out from it; TOL, WILL, LUCK and the maximums move only themselves. | City |
| Trackers, Manual Adjustments' note field placeholder (`:1686`) | why (e.g. Honed milestone) | why (e.g. a ruling) | Tool |
| Progression, Major Milestones (`:1785`) | Once each, any order, subject to prerequisites. Prose prerequisites are the table's call — taking one with a **GM** requirement will ask you to confirm. | Each once, in any order, when you meet what it asks. What the book asks in words is your table's call: taking one marked **GM** asks you to confirm. | City |
| Character, Grimoire (`:2550`) | Improvised spells and ones your GM agreed to. The book's numbers don't apply to these. | Spells you improvised, or settled with your GM. Their numbers are yours, not the book's. | City |
| Admin, Stats (`:2700`) | TOL/WILL aren't editable here — they're derived. To move them, adjust their input Stats (or use a Manual Adjustment in Trackers). | TOL and WILL are worked out from other Stats, so they don't change here. Change the Stats they come from, or add a Manual Adjustment on Trackers. | Tool |
| Progression, Raise a Stat (`:3190`) | WILL and TOL cannot be raised directly — they move when their input Stats do. | TOL and WILL can't be raised with IP. They move when the Stats they come from do. | City |

**Mechanical drift, checked:**
- **Manual Adjustments' "the rest apply flat"** is Decision 26's: TOL, WILL, SAN max, LUCK max and HP max apply flat. The draft keeps it as "move only themselves".
- **Honed is dropped, not replaced:** a Minor with a `choice` applies itself (217).
- **"refreshes LUCK"** is kept word for word. The engine sets `luck.spent = 0` (`engine.js:3666`); "back to full" was considered and not used, in case a cut to LUCK max says otherwise.
- **"can be undone"** is kept, not "Undo takes it back" (the last action is what Undo reaches).
- **The Skills formula** checked against `0420` and `0300` §97: 1d10 + Skill rank + Primary Stat + Synergy Bonus; untrained, the Primary Stat.

**The orphan strings** (EQ37, tool voice): §8's three templates replace every "no longer…"/"isn't in the … any more" in §5.

**The minus.** No new words: "−1", "−5%", "Pain Lv 1 · −1 skill".

**TOL and WILL** (EQ38):
- The `?` beside the name. Its `title` is unchanged ("How TOL is derived"). It gains `aria-label="How TOL is derived"`, since a lone "?" is all a screen reader has.
- The slot under the value is empty.

**"amount"** (EQ39): no new words.

**Where things land:** no press changes. The `?` toggles the same row, and its focus stays on the `?`.

**For E8.** E8 marks game terms in these same sentences.
- **What E5 leaves it:** with EQ36's default, every intro is plain text in `appCopy` with no `<em>` or `<b>`. Today's Progression `<em>` and Skills `<b>?</b>` go, so E8's marking is the only markup in them.
- **The terms in E5's drafts:** Skill, Rank, Primary Stat, Synergy, IP, Milestone Point, LUCK, Advantages, Disadvantages, Manual Adjustment, TOL, WILL, Major Milestones, GM, Stat, Activity Log.
- **What E5 doesn't touch:** "(cascades)" in the Manual Adjustments select. E8 should decide that one.

## 10. Worked examples, as named tests

Write these first, and show each failing on `main`, or say why it passes there.

1. `voice.test.mjs`: **"a minus is a minus: a hurt character's Pain reads −, in text and in attributes"**.
   - A `lockedCharacter()` hurt into Pain Level 1 or more (damage through the engine, not by setting a number).
   - Every tab, opened through `[data-sec]`: visible text, plus every `title`, `aria-label` and `placeholder` in `#main` and the vitals bar, checked against `HYPHEN_MINUS`.
   - It names the five `sheet.js` sites when it fails. Fails on `main` (Dax's lines in the pre-flight).
2. `engine.test.mjs`: **"E5: every orphan line is appCopy.orphanLine, and none says 'game data'"**.
   - A character holding one orphan of each kind `versionCheck` reports: Skill, Advantage, Disadvantage, Condition, Aberration, Weapon, Armor, Gear, Spell, Specialization, Minor and Major Milestone.
   - Each line equals `orphanLine` filled with its kind and the name the check names today. None matches `/game data/`.
   - A Major with no id still gives a line, not `""`.
   - Fails on `main`.
3. `engine.test.mjs`, **C9 rewritten** (`:1269`): it counts orphan lines by the *new* template, five before the cleanup and none after. **Mutation:** put back the old wording on one kind, and the "five before" fails.
4. `smoke-sheet-play.test.mjs`: **"E5: what the game data dropped wears one chip, on the sheet and the seat sheet"**.
   - One orphan weapon, gear and armor (Loadout), a specialization (Character) and an Aberration (Trackers).
   - Each shows `appCopy.orphanChip`, or `orphanNote` where it's a note. Nothing visible says "game data".
   - Then the same character as a seat on GM mode's seat sheet: the same chips.
   - Fails on `main`.
5. `smoke-sheet-progression.test.mjs`: **"E5: each tab's intro is its appCopy line"**.
   - For each tab with an intro, `#main .step-note` under the title equals its `appCopy` key, filled. No intro matches `/\bTap\b/`.
   - The same on the seat sheet's tabs.
   - Fails on `main` (no such keys).
6. Same file: **"E5: Manual Adjustments doesn't ask for a Minor that applies itself"**.
   - Reads `D.milestones.minorShared` for every Minor with a `choice`.
   - Asserts that the Manual Adjustments note **and its note field's placeholder** (`sheet.js:1686`) name none of them, and that the note doesn't say "engine".
   - Fails on `main` (Honed).
7. `smoke-sheet-skills.test.mjs`: **"E5: TOL and WILL show no modifier, and the derivation is a tap on the ? by the name"**.
   - On Main, the `[data-derivdesc]` button sits in TOL's and WILL's name row (with `.sid`), not after the value (`.sv`), and has an `aria-label`. Nothing follows `.sv` but the breakdown row. Pressing it toggles `[data-derivrow]`.
   - Fails on `main`: the button follows `.sv`. (A derived cell has no `.sm2`, so "no modifier text" would pass on `main` vacuously. Don't test that.)
   - `smoke-table-sheet.test.mjs:275` must pass unchanged.
8. **In Chromium (the preview), at 375×812 with touch emulated and at 1280×860, in both themes,** recorded in the PR:
   - each amount field's content width (`clientWidth` minus padding) against the placeholder's measured text width (a canvas `measureText` in the field's own font), with room for the spinner;
   - TOL's cell: the `?` beside the name, nothing under the value;
   - Dax on Main and Skills: "−1" everywhere the pre-flight listed;
   - for the CSS E5 touches and its neighbours, `getComputedStyle` before and after: `.trk input[type=number]` (SAN's set field) and `.deriv-q`.

## 11. Tests beyond the examples

- **`voice.test.mjs` passes** on every new `appCopy` string: no build-state words, no "game data", no hyphen-minus.
- **Totality:** `versionCheck` stays in `engine.test.mjs`'s totality guard (`:725`), and every line it returns is a non-empty string, junk ids included.
- **Mutation tests**, each against the built code:
  - One of the six Pain sites back to a bare `${…}`: example 1 fails.
  - One `versionCheck` kind back to its literal: example 2 fails, and so does example 3's "five before".
  - One chip back to its literal: example 4 fails.
  - An intro back to a literal in `sheet.js`: example 5 fails.
  - "Honed" back in the note: example 6 fails. "Honed" back in the placeholder: example 6 fails too.
  - The `?` back in the slot: example 7 fails.
  - The `String(…)` dropped from a Major's name: example 2's "no id" case fails.
- **Check each for a second path** that already covers it. Example 1's hurt character must be what fails it, not the unhurt one.

## 12. Steps

1. **The examples as failing tests.** Write 1–7, then run `npm run test:fast`.
2. **The minus.** The six sites to `signed()`/`modText()`. Run `npm run test:fast`.
3. **The orphans.** `appCopy`'s three keys, `versionCheck` and `skillLine` through `copyOf`, and the UI's nine sites (five chips, three notes, the spell) through `copy`. Update the tests §5 lists, C9 non-vacuously. Run `npm run verify`.
4. **The words.** The intros into `appCopy` (EQ36) and the section notes (§9). Run `npm run verify`.
5. **TOL and WILL, and "amount"** (EQ38, EQ39): markup and CSS, with whole-line edits. Run `npm run verify`.
6. **In the dev preview, recorded in the PR:**
   - The five TestCharacters, at 1280×860 and 375×812 (touch emulated), dark and light:
     - every tab's intro;
     - Dax's Pain lines;
     - TOL and WILL;
     - both amount fields;
     - Trackers' Manual Adjustments;
     - the Grimoire (Wren).
   - A character with an orphan of each kind §10 example 4 names: the load notice and every chip.
   - **GM mode's seat sheet** (Dead Air): the intros and an orphan chip.
   - Example 8's measurements.
7. **`npm run phone-check`.**
8. **The mutation tests (§11).**
9. **After the last change of any kind, the full `npm run verify` again, and say so in the PR.**
10. **Close-out (§14).**

## 13. Stop and ask

**Stop if:**
- A sentence's new wording would change what it says a rule does (*Watch for mechanical drift*). Bring the line and the book's text.
- A test you didn't expect pins one of §9's old sentences, or an orphan wording, outside the files §5 lists.
- `copyOf`'s fallback can't keep a line when `appCopy` lacks the key.
- An `appCopy` key you add is reported as unread, or one is read by nothing.
- A `phone-check` frame moves that the *Not a stop* list below doesn't name. Bring the frame and what moved in it.

**Not a stop.**
- The tests §5 lists that pin the old orphan words, and `smoke-wizard.test.mjs:268`. Update them to read `appCopy`.
- The app version literals the patch bump moves.
- A frame that moves only by the height of words E5 changed: `sheet: skills`, `sheet: character` and `sheet: progression` (intros), `sheet: trackers` (Manual Adjustments' note). Also `sheet: main`, only by TOL's and WILL's cell height (EQ38: the `?` leaves the space under the value). Re-record those, and list each in the PR with what moved.

## 14. Close-out

- **`close-the-session`, for *Fix*:**
  - a `CHANGELOG.md` line and `npm run changelog`;
  - the app patch bump;
  - the plan's §3 row: E5 links this order and reads "E5 built";
  - a `shipped.md` row with the PR number.
  - STATE only where E5's line is now wrong. A log entry only if something was learned the hard way.
- **Decision 26:** mark it `→ **Superseded in part by Decision 217**`, saying Honed and the other chooser Minors apply themselves. Mark its INDEX line `→ superseded in part by 217`. A ledger correction, found in this pre-flight.
- **CHANGELOG** (player voice, for the voice pass):
  - "**Negative numbers read with a true minus everywhere**, Pain's included."
  - "**Anything the rules dropped says so the same way**, and your GM decides what it does now."
  - "**The tab intros say what the city does, not how the app works**, and the Manual Adjustments note no longer asks you to add Honed's point twice."
  - "**TOL and WILL's ? sits by their names**, and the amount fields show the whole word."
- **PR title:** `fix(sheet): the words — true minus, one wording for what's gone, intros in voice (E5)`.
- **PR body:**
  - the template's sections;
  - **every string §9 lists, as it renders, old and new**, for the voice pass;
  - the preview check (§12 step 6), with what was measured;
  - **Where the order didn't fit**;
  - a line saying the full suite was run after the last change.
- **Review checklist:**
  - Re-do §5's sweep by grepping for readers and old wording:
    - `no longer`, `game data`, `any more`, `skillPenalty`, `essencePenalty`, `breakerPenalty`;
    - `sheetHeader(`, `step-note`, `data-derivdesc`, `data-ipamt`, `data-cramt`;
    - `copyOf(`, `copy(`;
    - every old sentence in §9.
  - Run example 1's scan yourself on Dax, in the preview and on the seat sheet.
  - Read every new string against `VOICE-APP.md`'s checklist, and draft alternatives for Ken through the conductor.
  - Check each §9 rewrite against the rule it states (*mechanical drift*).
  - Check the CSS E5 touched **and the rules beside it**, in both themes, with `getComputedStyle` (the E3 review's own miss).
  - GM mode's seat sheet: the intros and the chips.
  - Re-run §11's mutations.
  - Run `npm run verify` on the PR's head yourself.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **`fillTag` drops a line with an empty placeholder.** Pass every `{name}` as `String(…)`. A Major with no id must still give a line.
- **C9 goes vacuous.** `engine.test.mjs:1285` filters for the old words and asserts that none are left. Rewrite it to count by the new template, and check it fails with one kind's old wording put back.
- **The minus guard passes on an unhurt character.** The new check needs a hurt one, and it reads attributes too.
- **Don't drift a rule while rewording it.** "refreshes LUCK", "can be undone" and "the rest apply flat" each say something exact. §9 says what each keeps.
- **CSS by whole lines.** A substring replace that removes a duplicate can eat the line it was merged into (the E3 review). Check the neighbours in the preview.
- **The seat sheet draws the same intros and chips.** Check it in the preview, not just in jsdom.
- **Copy goes through `appCopy` and `esc`.** An intro was raw HTML in `sheetHeader`. From `appCopy` it's text, so escape it.
- **Mount the private repo** with `git submodule update --init private` in a fresh worktree before the suite.
