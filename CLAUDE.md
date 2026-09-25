# CLAUDE.md

Standing instructions for this repository. Read this first, every session.

This file holds what is true across *all* sessions. It deliberately carries **no
counts** — no test totals, no decision numbers, no line counts — because those
drifted here three times and a cold session read them as current. Live numbers
are in `docs/STATE.md`. Each procedure below is stated here and nowhere else;
other documents point at it.

## Orientation — three documents, in order

1. **This file** — the hard constraints, and how we work.
2. **`docs/STATE.md`** — where the build stands and what's next, grouped by area
   with its status and who it waits on. Short by design. Read it whole.
3. **`docs/INDEX.md`** — the map. Where each kind of thing is written down, what
   every id (`A1`, `B7`, `F8`, `W12`, `AQ3`) means and whether it's closed, and
   every decision grouped by topic. Use it instead of grepping; it is checked
   against the ledger.

**`docs/SCHEMA.md`** is the authority — architecture (§1), both schemas (§2, §3),
the decision ledger (§4), the open flags (§5) — and is **never read front to
back**. INDEX says which section to open. If SCHEMA and this file disagree,
SCHEMA wins and this file needs fixing.

Do not start editing before reading STATE and the SCHEMA sections your work
touches. Most mistakes on this project are made by someone who had the local
picture but not the design picture.

## The project in one paragraph

A browser character creator and live play sheet for **Shadows**, a cyberpunk-noir
urban fantasy RPG running on the **Synergy** system (Get Dangerous Games).
Eight-step intake wizard → lock → a nine-tab running sheet with damage and Pain
Levels, Sanity, Luck, Çredits, IP and Milestones, session log, loadout, and an
undo-able audit trail. Deighton is the lead designer and holds all rules
authority. Scott works on the GM toolkit and magic system. Ken writes and
maintains the CRB and builds this app.

## Commands

```bash
npm run verify     # build check + full test suite — run BEFORE and AFTER every change
npm test           # engine units, CRB conformance, hostile files, voice, jsdom smoke, architecture guards
npm run test:fast  # engine, rules, docs and build only: the inner loop while working. verify still gates
npm run build      # → dist/shadows-character-sheet.html (the file players get) and the blank sheet
npm run changelog  # CHANGELOG.md → src/data/shadows-changelog.js (the app's What's new)
npm run bump -- X.Y.Z  # the app version, everywhere it's written, plus CHANGELOG's [Unreleased] heading
npm run release:check  # is this commit ready to tag? (release:prep dates the heading first)
npm run phone-check    # header height and sideways overflow at phone and tablet widths, in real Chromium
npm run fonts          # regenerate src/styles/fonts.css from the font packages (rarely)
```

`npm install` first — `node_modules` is not committed. Claude Code's
`SessionStart` hook (`.claude/settings.json`) runs `npm ci` when it's missing
or stale.

**Procedures as skills.** `.claude/skills/` holds the runbooks for closing a
session, numbering a decision, opening or closing a flag, and cutting a
release. They carry the steps and commands; the rules they follow are stated
here, and only here.

`docs/STATE.md` says how many `todo` tests to expect. Any `todo` tests are **confirmed
defects written as failing assertions on purpose** — they flip green when fixed.
Do not delete one to make the output cleaner.

If `npm run verify` fails, fix the code, not the test. The exception: a test
encoding an outdated decision, in which case update `docs/SCHEMA.md` in the same
change.

**Seeing a UI change run, not just pass tests:** opening `index.html` straight
from `file://` renders inert in some embedded/automated browsers — the markup
shows but no script executes, so nothing is clickable. `tools/devserver.mjs` is
a zero-dependency static file server (not shipped, not part of the app or its
build) that serves the repo over plain HTTP so a browser tool can actually run
it: `node tools/devserver.mjs` → `http://localhost:8420`, loopback only, and
nothing outside the repo. `.claude/launch.json`
wires it up as `shadows-dev-preview` for Claude Code's browser tool to start on
its own. Check before reaching for a different one or building it again.

## Hard constraints — breaking any of these breaks the app for players

1. **The app runs from `file://` with no server and no build step.** A GM hands a
   player a folder and it works. This is load-bearing, not a preference. It
   makes no network request either: even the fonts are embedded (Decision 137).
2. **No ES `import`/`export` anywhere in `src/`.** CORS blocks modules from disk.
   Everything is a classic script sharing script scope.
3. **`index.html` stays a shell** — markup and `<script src>` tags only. No inline
   styles, no inline logic.
4. **Script order is fixed:** theme-init → data (then the generated release notes)
   → icons → engine → ui.
5. **The engine never touches the DOM.** `src/engine/engine.js` reads
   `window.SHADOWS_DATA` and returns values. Tests load it with no DOM present.
6. **IDs are immutable.** Every id in `shadows-data.js` may be referenced by a
   saved `.shadows.json` character file. Display `name` changes freely; `id`
   never does. If an id truly must change, it needs a `migrate()` step and a
   schema bump.
7. **Store inputs, compute everything else.** A character stores `BOD = 7` —
   never the modifier, the Health Levels, or the HP. Never write a derived value
   into the character object. This is why audit/undo could be a generic
   structural diff instead of per-action inverse handlers.
8. **The engine is total.** Every exported reader returns something for any
   character `migrate()` can produce — it reports a problem, it never throws.
   `migrate()`'s completeness *is* the migration guarantee: a field added to
   `newCharacter()` must survive a round trip through it.
9. **Maintainer content never renders.** `flagNote` is for Ken and Deighton;
   `playerNote` and `appCopy` are what a player sees. The app does not narrate
   its own build state — no phases, no "TBD", no flag ids, no "confirm with D".
10. **A character file is untrusted input.** Files are made to be shared, so
    `migrate()` is the gate: every stored number comes out a number, and undo
    only writes inside the character (Decision 124).

Constraint 1's no-network half and 2–5 are enforced by `tests/build.test.mjs` and `tests/engine.test.mjs`;
8 by `tests/engine.test.mjs`; 9 by `tests/voice.test.mjs`; 10 by
`tests/hostile.test.mjs`. If a test fails on one of them, the test is right.

## Where things live

```
index.html              Shell: markup and script/link tags, nothing else.
src/data/               Game content + icons. Designers edit these. Also the
                        release notes, generated from CHANGELOG.md — never
                        edited by hand (Decision 123).
src/engine/engine.js    Pure rules engine. No DOM.
src/ui/                 Wizard + sheet, as four classic scripts sharing one
                        global scope (shared, wizard, sheet, then app for
                        chrome/boot) — no namespace object, see Decision 86.
src/styles/             shadows.css (brand tokens + screen), print.css, and
                        fonts.css, generated, with its licences in fonts/.
tests/                  Engine units, CRB conformance, hostile files, voice, smoke, guards.
tools/                  build.mjs (inlines everything into dist/), changelog.mjs,
                        release.mjs (bump, prep, check), fonts.mjs, outputs.mjs,
                        phone-check.mjs, devserver.mjs, session-start.mjs.
.claude/                settings.json (the SessionStart hook), launch.json (the
                        dev server), skills/ (the procedures as runbooks).
docs/                   STATE, INDEX, SCHEMA, VOICE-APP, WISHLIST, and audits/,
                        plans/, log/, reference/ — INDEX §1 says what's in each.
```

Adding a stat, skill, advantage, archetype, or panel should require **zero** app
changes. If it doesn't, that's a bug in the app — not a reason to special-case
the data. The other direction holds too: a data field is read by code or named
as text (`…Text`, `…Note`, `description`), never a setting the code ignores.
`tests/engine.test.mjs` fails on an archetype id in code and on a data key
nothing reads (Decision 135).

## Versions — four of them, four different triggers

Four numbers move independently. Bumping the wrong one, or none, is how a
session ends up debugging a build the other person isn't looking at. Current
values are in `docs/STATE.md`; the app renders its own in the footer, so **the
first move when something looks wrong is to compare the footer against STATE**.

| Version | Lives in | Bump it when |
|---|---|---|
| **App** | `APP_VERSION` at the top of `src/ui/app.js`, mirrored in `package.json` | **A player can see a difference.** patch = visible fix · minor = new capability · major = existing character files or the workflow break |
| **Game data** | `meta.gamedataVersion` in `shadows-data.js` | **A character's computed values or available choices can change** — content added or removed, a cost or cap altered, an id retired. *Never* for a change no character can observe (Decision 68) |
| **Character schema** | `meta.schemaVersion` on the character, stamped by `newCharacter()` and `migrate()` | **The shape of a saved `.shadows.json` changes.** Always needs a `migrate()` step in the same commit |
| **Ruleset** | `meta.rulesetVersion` in `shadows-data.js` | The CRB moves. Not ours to bump on a whim — it tracks Ken's document |

Two traps worth knowing:

- **Don't bump on a no-op.** Batch 1 removed a data field and added four, and
  bumped nothing: sixty computed outputs were diffed before and after and every
  one was identical. A version that cries wolf stops being read.
- **`schemaVersion` used to mean two different things** — the data file's own
  content version *and* the character file's schema version. The data key was
  renamed to `gamedataVersion` (Decision 75) to match the field it stamps onto
  characters. If you see `meta.schemaVersion`, you are looking at a character.

`tests/docs.test.mjs` fails the build if `APP_VERSION`, `package.json`,
`package-lock.json`, `README.md` and `STATE.md` disagree. **The numbers
themselves are deliberately absent from this file**; `docs/STATE.md` is the
only place they live.

## Change tiers — what a change must touch

Name the tier before you start; each includes everything in the one above it
(Decision 131). The point is that a typo doesn't pay for a rules change's
paperwork, and a rules change doesn't skip any of it.

| Tier | What it is | It must touch | It skips |
|---|---|---|---|
| **Docs** | Docs, plans, the wishlist, process. No code, no data | The doc itself. A line in `docs/log/2026.md` only if it changes how we work | STATE, unless its §3–§5 is now wrong. Versions |
| **Fix** | A bug, copy, a named finding, a test. No rule or shape moves | Tests, and any new guard mutation-tested. **If a player can see it:** a `CHANGELOG.md` line, `npm run changelog`, and an app patch bump. The finding's status in INDEX §2 | A decision. STATE, unless what's next changed. The log, unless something was learned the hard way |
| **Content** | Data a character can observe: content added or removed, a cost, a flag closed | Everything in Fix, plus `gamedataVersion` per Decision 68, a log entry, and a closed flag's three edits (see *Flags*) | — |
| **Rule or shape** | Engine behaviour, a data or save-file shape, architecture, or a player-facing behaviour someone could reasonably have chosen otherwise | Everything in Content, plus: **propose before building**; a numbered decision with its INDEX line and supersession marks (see *Decisions*); a schema bump and a `migrate()` step if the save file's shape moves; STATE rewritten | — |

**When a batch merges,** it gets one row in `docs/log/shipped.md`, added in the
PR itself. **STATE is rewritten, never appended; the log is appended, never
revised** — its figures are true as of that entry. Both change in the same
commit as the work they describe.

**The changelog, in detail.** Lines go under `## [Unreleased] — app X.Y.Z` in
`CHANGELOG.md`, in player voice: no decision numbers, audit ids, document
numbers, or who ruled what. `npm run changelog` regenerates
`src/data/shadows-changelog.js`, the app's **What's new** window, which players
read (Decision 123). Never edit the generated file by hand. `docs.test.mjs`
fails if it lags the markdown, but no test can tell when a visible change never
got a line. That part is on you.

## Decisions

**A decision isn't made until it's numbered** in `SCHEMA.md` §4, in the same
change as the code it describes, with a one-line summary under its topic in
`INDEX.md` §3. Only choices get numbered: a rule, a data shape, an architectural
rule, or a player-facing behaviour someone could have chosen otherwise. A no-op
version check or a routine fix is a log line, not a decision.

**Search before you propose.** Before proposing any change, search §4's
**Touches** lines (and the ledger's text) for the stat, field, rule or UI
element it touches — by name, not just by topic. If a decision covers it, cite
it. Propose reopening it only when its **Revisit if** has happened, or when
something new has come up that its **Rejected** list didn't weigh, and say
which. Re-raising a rejected option with nothing new is how settled questions
get relitigated (Decision 130).

**An entry is a short record** — `docs.test.mjs` checks the shape:

```
130. **<The decision, in one line.>**
     *2026-09-24 · Ken + Claude · Touches: <the things it governs, by name>*
     - **Decided:** what is now true, in one to three sentences.
     - **Why:** the reason that won.
     - **Rejected:** each alternative seriously considered, and why it lost.
     - **Replaces:** Decision N (in part: what changed), or "nothing".
     - **Revisit if:** the condition that would make this worth reopening.
     - **Built:** app/data/schema version, PR, log entry. Detail lives there.
```

About 25 lines at most. Build detail, test names and review notes go in the log
or the PR, not the ledger.

**Mark what it replaces.** A note buried in an unrelated entry counts: Deighton's
TOL ruling reversed a formula confirmed inside Decision 93, a data-merge
decision nobody would have filed under "stats". For every earlier decision the
new one overrides:

- mark the old entry `→ **Superseded by Decision N**` (or `in part`) with a
  clause saying what changed;
- mark its `INDEX.md` line `→ **superseded [in part] by N**`, struck through
  when wholly replaced;
- say so in the new decision's **Replaces**.

Never delete or renumber an entry; numbers are cited from code and tests.
`tests/docs.test.mjs` fails if the ledger and the index disagree, but only you
can find a replacement nobody marked (Decision 102).

## Flags — rules questions the app must not answer

**Never resolve a rules question in code.** Design questions go to Deighton.
Stub the behaviour, mark the data entry `flagged: true` with a `flagNote` that
names its F-number, add a row to the flag table in `SCHEMA.md` §5 and a line in
`INDEX.md` §2, and surface the uncertainty in the app (a `playerNote`) rather
than hiding a guess. **Closing a flag is three edits:** its §5 row, `flagged`
in the data, and its INDEX §2 line. `tests/docs.test.mjs` fails on a flag with
no open F-number. One philosophical ruling usually clears several flags at once,
so group related flags rather than pressing them one at a time.

## How Ken and Claude work together

**Propose before you build** anything in the *Rule or shape* tier. Ken wants the
shape of the change and its consequences first, not a finished diff to review
backwards. *Fix* and *Docs* work in scope — a typo, a named audit finding, a
test — can just be done.

**Give the 50,000-foot view first.** Macro-level pattern mismatches before
line-level notes. If something is wrong at the architecture level, say that
before listing the small stuff.

**Frank pushback is the standing expectation**, especially on UX. If an approach
is worse than an alternative, say so plainly and say why. Agreeing to be
agreeable wastes Ken's time.

**Suggestions are inspiration, not directives.** Ken often writes his own version
of a proposal and has it audited afterward. Offer the reasoning, not just the
artifact.

**Verify, don't assert.** Run the thing. Three findings on this project were
worse than two rounds of documentation recorded, and each was only caught by
executing the code rather than reading it. When you add a guard, **mutation-test
it** against the pre-fix code — a guard that passes before and after is
decoration.

**Player-facing copy follows `docs/VOICE-APP.md`.** The app speaks as NYTE City —
except where the player is stuck, which is tool voice: clear, short, out of the
way. Three places generate player copy and one of them surprises people:
`src/ui/` (the renderers, split across `shared.js`/`wizard.js`/`sheet.js`/
`app.js` — Decision 86), **`src/engine/engine.js` (`validate()` writes every
wizard error and warning)**, and the data. When a string is doing real narrative
work, flag it for a voice pass rather than shipping a guess.

**Watch for mechanical drift.** Rewording an entry can quietly change what it
does — an absolute floor becoming a relative modifier, a cost shifting, a
stacking rule inverting. Any edit that touches rules text gets cross-checked
against the CRB (mirrored in `docs/reference/`, never edited here) before it
lands, and if the CRB states a worked example, pin it in `tests/rules.test.mjs`.

**Ideas for later go to `docs/WISHLIST.md`** as `W` ids, rather than being done
unasked.

## Working rhythm

- **One branch per batch.** Whatever the app or cloud session names it
  (`claude/…` is normal) is fine; the finding or decision is carried in the
  commit subjects and the PR title, where it gets searched.
- **Commit subjects in the imperative, naming the finding or decision:**
  `fix(ui): render aberrations once (A1)`.
- **`main` is always openable and always passes `npm run verify`.**
- **Releasing is a rename, a regenerate, then the release workflow**
  (Decision 138). `npm run release:prep` renames the `[Unreleased]` heading to
  `vX.Y.Z — <date>` and regenerates What's new; commit and merge. Then run the
  **release** workflow from `main` with the version. It checks, builds once,
  creates the tag and the Release (its notes are that CHANGELOG section, both
  files attached) and deploys the live site (`charactersheet.shadowsrpg.com`).
  A cloud session can do all of it. Check a deploy by loading the page and
  reading its footer. The `cut-a-release` skill walks it.

## What's next

`docs/STATE.md` §3 is the only source for this — grouped by area, with a
status and what's blocked on whom, since those change every session and
different areas resolve in whatever order the people they wait on answer, not
in a fixed sequence. This section stays generic rather than naming an area,
because naming one is exactly how the last version of this section went
stale twice in a row.
