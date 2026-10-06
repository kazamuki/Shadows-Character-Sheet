# Wishlist — ideas not yet scheduled

A parking lot. Things worth doing that nobody has committed to yet — mostly UX
and table feel. **Nothing here is a decision or a plan.** When an item gets
picked up it moves out: into a branch, a `plans/` doc if it takes more than one
session, and a numbered decision in `SCHEMA.md` §4 when it lands. Then its
entry moves, whole, to [`log/wishes-granted.md`](log/wishes-granted.md), with a
pointer on its heading to where it went. This list only ever shows what's open.

This is not `STATE.md` §3. STATE is the pick-up-work view for things that are
in flight or waiting on someone. An item here is waiting on nobody but a free
session and Ken saying yes.

**Adding an item:** next free `W` number, never reused. Say who raised it, what
the player feels today (not just the fix), and anything the fix has to respect —
a hard constraint from `CLAUDE.md`, a decision, a rules question. A rules
question means the item is blocked on Deighton, and it says so. Claude adds
items here too, marked as such; Ken triages them.

**Status:** 💡 idea · 🔎 needs a look (shape unclear) · ⏭ ready (shape is clear, just needs doing)
---

## 1. Items

### Loadout & catalog

**W39 — Train a Martial Arts style in play, and apply its bonus.** *Claude · 🔎 · the bonus half is Deighton's*
Raised 2026-09-25, finishing W33. The wizard lets a player choose up to two
styles, and Martial Arts says "you may train additional styles later in
play", but a locked sheet has no way to add one: `setSelection` is only
reached from the wizard, and the pick's two-slot cap is a creation rule. The
bonuses ("+1 Stun", "+1 Grapple") are shown, never applied, and nothing says
what +1 Stun adds to. *Needs:* how a style is trained after creation (IP?
GM's word?) and what each bonus modifies, both Deighton's, before the sheet
does more than show them.

### The sheet at the table (from the design critique)

The 2026-09-30 design critique (27/40, snapshot in `.impeccable/critique/`)
and its 2026-10-01 re-run (29/40) are mostly built: W43, W42, W44, W46, W47
and W57, then W45 and W58 (Decisions 165 and 166). What's left is W59 and
the last of W60. Since W43, controls are 44px on a touchscreen and
`npm run phone-check` fails on anything smaller, or on text under 11px; since
W45 it also fails on a vitals bar or a sheet's jump bar of two rows, and on a
phone's Health card below 30% of the screen. A new control inherits those
floors rather than re-arguing them.

**W65 — LUCK bought with CP counts against the Max Character Point Boost.** *Ken · ⏭ · Rule or shape · raised 2026-10-04 from the CRB's Campaign Power Level table*
Today a player can buy any amount of LUCK with CP at creation: Decision 5
makes it "exempt from Max Boost", and the wizard's Luck row says so
(`wizard.js`, "exempt from Max Boost"; `luckSpent` in the engine has no cap
and `canBoost` never sees it). The CRB table says Max Character Point Boost
caps how many times CP may raise any one stat, skill, power or Luck at
creation, so a Street Level character can put at most 2 points into Luck this
way (2 / 3 / 4 / 5 by level, the same numbers as `powerLevels[].maxBoost`).
**Ken's rulings, confirmed by Deighton (2026-10-04):** only CP spent on Luck counts, so the 4 free
starting LUCK are outside the cap; and Luck is capped like everything else,
because consistency is the right place to start. That reverses Decision 5's
exemption and Decision 157's "bought up to 5 becomes 7" example.
*To build:* a numbered decision superseding Decision 5 in part (marks in
SCHEMA and INDEX); the Luck buy-up held to `pl.maxBoost` in the stepper and
`validate`; the "exempt" copy in the wizard and in `creationFlow` step 7's note
removed; `gamedataVersion` per Decision 68, since what a character can choose
moves. A character file already over the cap must load untouched, with
`validate` warning and nothing in the file changing (constraints 7, 8, 10).
Deighton confirmed both rulings (Ken asked, 2026-10-04); playtests and player
feedback may revisit them, so the decision's **Revisit if** should say so. No
open flag. Do it with W66, which touches the same row's text.

**W67 — The session log's default date is UTC, so it says tomorrow in the evening.** *Claude · ⏭ · Fix · raised 2026-10-05 in W29 S8b*
`sheet.js` defaults a new session's date with `toISOString().slice(0,10)`,
which is the UTC day: after 7 pm in New York (or whenever the local day is
behind UTC's) a player's new session is dated tomorrow. `gm.js`'s `localDay()`
builds the day from `getFullYear`, `getMonth` and `getDate` and is the pattern.
*To respect:* a session already saved keeps its date; only the default moves.
Player-visible, so a CHANGELOG line and a patch bump, and a test that builds the
date in local time (as S8b's `localDay` test does) and runs under a UTC+ zone.

**W66 — Rename "Max Boost" to "Max Character Point Boost" in the app.** *Ken · ⏭ · Fix (copy) · raised 2026-10-04*
The CRB's table column still reads "Max Freebie Boost", which is the old name
(Decision 2 renamed Freebie Points to Character Points but left this one as
"Max Boost"). Ken's name is **Character Point Boost**; the column becomes Max
Character Point Boost. Player-facing strings that say "Max Boost" or "Boosts"
for the CP purchase: `wizard.js` (the level summary chip, the Boosts section
heading, the Luck row), `sheet.js` (the power-level change note), and engine
messages (`canBoost`'s "Max Boost reached"). *To respect:* **ids and data keys
stay** (`maxBoost`, `boosts`, constraint 6), since a saved file may name them.
Only display text moves, and `docs/VOICE-APP.md` decides the wording. Do it with
W65, since both touch the Luck row's text. It is a player-visible change, so it
needs a CHANGELOG line and a patch bump.

**W64 — Go back Home from character creation.** *Ken · ⏭ · raised 2026-10-04*
In the wizard there's no way back to the Home screen. The sheet has **Home**
in its ⋮ menu, but the wizard header is empty (`renderTopChrome` clears the
actions on the wizard screen), so a player who wants their roster, or
to start over, refreshes the page. Ken's choice: **a Home control in the
wizard header**, matching the sheet's.
*To respect:* nothing is lost by leaving. A new character is saved the moment
the player changes something (`btn-new` in `renderHome`) and appears under
Your characters, so Home needs no "are you sure?" for a touched character.
An untouched one was never saved and just disappears, which is fine. The
control is 44px on a touchscreen (`phone-check` fails below that) and must not
push the header to a second row. It reuses the `data-home` handler in
`bindMain`, which the sheet's menu also reaches.
Worth a look while there: the Home reset sets only `{screen, ch, step,
maxReached}` in `bindMain` but also `section` and `admin` in the sheet's
version in `renderTopChrome`; one helper would stop the two drifting.

**W59 — Steppers don't say what they change.** *Claude · 🔎 · critique P2, 2026-10-01*
Every stepper is `aria-label="decrease"` / `"increase"` (`wizard.js`,
the stepper helper): the Skills step has 36 buttons that all read "increase,
button", and the value beside them isn't a live region, so a screen reader
never hears the new number. *The fix:* name the target ("Raise BOD",
"Lower Firearms") from the same data the row shows, and announce the value
after a press, politely, once.

**W60 — Small accessibility and copy fixes from the re-run.** *Claude · 🔎 · critique P2–P3, 2026-10-01 · mostly shipped in 0.36.0*
Seven of the eight shipped in 0.36.0 (`docs/log/shipped.md`). Pin from Main
came with W45 (Decision 165). The other six: placeholders at `--dim`, the picked wizard card reads pressed, step sentences end as
sentences (and step 7's note no longer says "maxBoost"), the window's title
names the character, headings no longer skip a level, and the meter's
transition, which never played, is gone. Each has a W60 smoke test. What's
left is one:
- `.76rem` is off the type ramp: an inline style at `sheet.js:1811` and about
  nine rules in `shadows.css`. A ramp question for a typeset pass, moved here
  from W46. *Harden.* Anything that steps down stays at or above 11px
  (`.7rem` is 11.2px; `phone-check` fails below 11), and the inline style
  should become a class first, since a ramp sweep of `shadows.css` won't find
  it.

### Beyond one sheet

**W29 — A GM mode: link to the table's characters, read them, leave notes.** *Ken · 🔎 · planned, not approved: `plans/gm-mode.md` (the file-based stage and the GM toolkit; live sync stays here)*
Raised 2026-09-24, at the end of the whole-app audit. Today a GM who wants a
player's HP, Conditions or loadout asks for it, or collects exported files by
hand. The wish: the GM links up with the characters at the table, sees their
data without asking, and can put notes onto a character's sheet.

*What already points this way.*
- **Identity.** Every character has a permanent NYTE City intake number (Decision 128).
- **What gets synced.** A character stores only inputs (constraint 7), and every change
  is already a small structural patch in the audit trail (Decisions 48–49). Those
  patches are exactly what a sync layer sends.
- **One engine on both ends.** The engine is pure and never touches the DOM
  (constraint 5), so a server could run the same code to check and compute.
- **The gate.** `migrate()` already treats every file as untrusted (Decision 124). A
  server would run the same gate on everything it accepts.

*What it must respect.*
- **Constraint 1.** The sheet keeps working from `file://` with no server. Linking is
  an extra that needs a network, never a requirement.
- **The player owns the character.** The GM doesn't edit it. GM writes are *notes*
  and *suggestions* ("take 12 Ballistic to the torso") that the player accepts, and an
  accepted one becomes an ordinary undoable action on the player's own sheet. That
  also avoids the hard problem of two people editing one sheet.
- **The intake number is a name, not a key.** It's printed on paper. Access comes from
  joining a table, never from knowing a number.
- **Consent and privacy.** Joining a table is what lets the GM see a sheet, and
  leaving stops it. Player data on a server means someone owns the hosting, the
  cost and how long it's kept.

*A skeleton, cheapest first.*
1. **No server.** With the roster (Decision 141), a GM's browser holds several characters
   read-only, imported from the players' exports and refreshed by re-importing (a
   newer copy of the same intake number just updates; Decision 128's rule). GM
   notes go back as a small "dispatch" file a player imports into a *From your GM*
   inbox. Most of the value, with no infrastructure.
2. **Live, read-only.** A table service. A player's sheet pushes its latest snapshot,
   and the GM's view subscribes.
3. **Two-way, player-approved.** GM notes and suggested changes are pushed to the
   player's sheet and accepted or declined there.
4. **The GM toolkit on top:** initiative, one hit applied to several characters,
   encounter state. That's Scott's area, so his design as much as the app's.

For stages 2–3, the API is roughly:
```
POST   /tables                           GM creates a table        → { tableId, joinCode }
POST   /tables/:t/seats                  player joins: code + a character snapshot → { seatToken }
GET    /tables/:t/characters             GM: every seated character, latest snapshot + revision
PUT    /characters/:intake               player: new snapshot { rev, character }, or the patches since rev
GET    /tables/:t/events                 live stream (SSE or WebSocket): { intake, rev } changed
POST   /characters/:intake/notes         GM: { text, visibility: "player" | "gm-only" }
POST   /characters/:intake/suggestions   GM: { label, patch } → the player accepts or declines
DELETE /tables/:t/seats/:intake          player leaves; the GM's copy goes with them
```
It can stay small: one serverless function and one store per table (Cloudflare
Workers with Durable Objects, or a hosted realtime database). Players join with
a code or a QR at the table; accounts can wait.

*Before anything is built:* who hosts and pays; whether stage 1 is enough on its
own; how long player data is kept; and whether this is the character sheet's
job or the GM toolkit's.

**W38 — Two tabs open on one character overwrite each other.** *Claude, raised in S6c · ⏭ · planned: `plans/two-tabs-one-character.md`*
Open the same character in two browser tabs, play in one, then touch anything
in the other: the second tab saves its older copy over the first's, and the
play is gone with no warning. The roster (Decision 141) doesn't cause this, and
the single-slot app had it too, but a list of characters makes several open
tabs more likely. *The fix:* listen for the `storage` event. When another tab
writes the entry for the open character, stop saving from this tab and say so,
with a button to reload from the newer copy. *To respect:* the app works
without storage, so the listener is guarded like every other read.

**W62 — Slotting a file in reads it on screen, like a script loading in NYTE City.** *Ken · 💡 · raised 2026-10-02 with GQ10's packs*
Today a character file imports with a toast that names it, and a Codex pack
(GQ10) would do the same. Ken's idea: a terminal opens, reads through what's
in the file, and closes on what landed, so loading a character or slotting in
the Codex feels like jacking a script into a deck rather than opening a file.
*What the shape has to respect,* as Claude sees it:
- **It reads what's really there.** The lines are the file's own contents as
  the gate checks them (the character's name, archetype and TAG; the pack's
  entries and traits by name), and the last line is the real outcome: counts,
  what was repaired. Not a canned script on a timer.
- **Short and skippable.** About a second, any key or tap finishes it, and it
  never sits between a GM and a fight. Repeating the same load in one sitting
  goes straight to the summary.
- **Reduced motion gets the summary only** (the app already honours
  `prefers-reduced-motion`), and a screen reader hears the outcome once, not
  every line.
- **A refused file drops the fiction.** That's the player being stuck, so it
  speaks in tool voice (`VOICE-APP.md`) and says what to do.
- **The copy is data** (`appCopy`, Decision 76) and gets a voice pass; the
  mono font is already embedded, so nothing touches the network (137).
- One primitive in `shared.js`, used by every import: a character, a table,
  a pack, and a dispatch once that exists.

**W63 — The hosted sheet is a demo; the full game is a pack you slot in.** *Ken · 🔎 · Rule or shape · raised 2026-10-04 · reopens GQ10 in part*
Today `charactersheet.shadowsrpg.com` is the whole sheet: every archetype,
the full catalog, all of it, free. Ken wants the live site to be a **demo**: a
real taste of Shadows and its data that everyone gets, with the full CRB
content arriving as a file the player adds to unlock the rest. It is the same
move as GQ10's Codex pack, applied to the core game: the mode and its logic
ship in every build, and a pack supplies the content.
*Settled with Ken, 2026-10-04:*
- **A slice is free.** The demo carries a limited set of archetypes and data,
  not the whole book. The player builds and plays **one real character**
  through the whole wizard and sheet, with save and export working.
- **Demo characters carry over.** A character made in the demo stays valid
  once the pack is added. IDs are immutable (constraint 6), so this holds if
  the demo's data is a strict subset of the full data, and a test should
  prove it (every demo id exists in the full data).
- **The unlock is the same `.shadows-pack.json` as the Codex.** One pack
  mechanism, imported once, checked like any untrusted file (Decision 124).
  The CRB is a core pack and the Codex is a GM pack. The file is built from
  `private/` (Decision 167).
*What the shape has to respect, as Claude sees it:*
- **GQ10 changes in part.** It says "core player content stays free in the
  sheet, Vampire and Werewolf included," and that the repo stays public "as a
  matter of trust." Taking this up means a numbered decision that narrows
  GQ10 and marks it superseded in part. It must also say which archetypes
  are in the slice. That is a content call (Ken, and Deighton for what the
  demo shows of the rules), not an engineering one.
- **The "slice" is the hard design question.** Candidate cuts: a few
  archetypes, or all archetypes with trimmed catalogs, or the full rules with
  a character cap. Each decides what a demo player can miss. This is the
  first thing to settle, because the data split follows from it.
- **The app must still make no network request** (constraint 1, Decision
  137). The pack is a file the player adds, never a fetch. The site and the
  offline file both work the same way: demo until a pack is slotted in.
- **One app, one version history.** Same reasoning as GQ10's rejection of two
  builds. The demo is the data subset, not a second codebase. `gamedataVersion`
  moves with the data a character can observe (Decision 68), and a pack
  carries its own content version.
- **The engine is total** (constraint 8). A character that references an id
  the loaded data lacks (a full character opened in a demo, or a pack removed
  afterwards) must not throw. It should open read-only or say plainly what's
  missing, in tool voice. Same rule for a pack older than the character.
- **Repo vs. protection.** This repo is public, so the demo is a **trust and
  product line, not DRM**: anyone can read the data from the source. Say so
  in the decision, so nobody later treats it as access control. The CRB text
  itself is in `private/` and stays out of the public tree already. Whether
  the *game data* (370KB of descriptions and rules text in `shadows-data.js`)
  also moves into the pack is part of the slice question.
- **How the full pack reaches people** (Patreon, a store, handed out, free
  for backers) and whether it is paid is Ken's and Deighton's, and not an app
  question. The app only needs a good "add your pack" moment (W62's loading
  screen fits) and an honest demo state.
- **Voice.** The demo's framing ("you're seeing a slice of NYTE City") is
  player copy and gets a voice pass (`VOICE-APP.md`). It is data in
  `appCopy`, and it never narrates build state (constraint 9).
- **The pack's gate is shared work.** S9 of `plans/gm-mode.md` builds the
  pack shape, gate, storage key and import. Build the demo after that, or
  with it, so there is one pack mechanism.
*Open for whoever picks it up:* the slice (which archetypes, which catalogs);
whether the demo is also a quickstart path (a guided first character) or
just a trimmed sheet; what the Home screen says before a pack is slotted
in; whether a pack can be removed, and what that does to characters that
use it.

### Custom characters

Raised 2026-09-30 while planning the custom archetype
(`plans/custom-archetype.md`), by walking a made-up character through every
step. Each is a place someone might want to write something in that the plan
leaves out on purpose. None blocks it.

**W48 — Natural Armor a custom character writes in, which the hit panel uses.** *Claude · 🔎 · touches F25*
A tough creature's "hide like stone" can be written as a trait, but the hit
resolver won't subtract it. Natural Armor's sources are `grants` on
advantages, Major Milestones and specializations (Decision 104); a written-in
trait has no `grants`. *To respect:* how Natural Armor answers a hit is the
F25 stub, still Deighton's.

**W49 — A resource pool the player names.** *Claude · 💡*
Glamour, Chi, a Blood Pool. The plan's checkboxes cover what the rules have
today (TOL, SFR). A third, **Uses another pool**, would give a tracker whose
title and max the player types. Tracker titles come from the data today, so
this needs a little code.

**W50 — Stat changes at creation.** *Claude · 💡*
Deighton sets a custom character's stat changes "in the same stroke as
powers", but the Adjustments ledger is only on the sheet, after lock. Fine at a
table where characters lock together; awkward for someone building alone.
*To respect:* a stat change at creation must not read as Stat Points spent.

**W51 — A shapeshifting form toggle for a custom character.** *Claude · 💡*
The Werewolf's form toggle has fixed options from the data. A custom
shapeshifter writes its forms as powers for now; a toggle with options the
player names would put the form on the sheet.

**W52 — Written-in Major Milestones.** *Claude · 💡*
A custom archetype has no Major Milestones of its own; the general Majors are
open to it. The Adjustments ledger covers a GM's custom reward meanwhile.

**W53 — "Magical being" as a classification.** *Ken, from Deighton · 💡 · rules: Deighton*
Fae and beings like them: a third axis of power, distinct from Supernatural.
The plan's **Other** classification, with its own text, covers it until then.
*Needs:* what a Magical being can buy, Deighton's. Then it's one row in
`classifications`.

**W61 — A retired archetype folds its characters into Custom.** *Ken · 🔎 · raised 2026-10-01 with the Cyborg cut; Rule or shape*
The team has cut the Cyborg (`plans/crb-catch-up.md`), and an id can never
just be deleted (constraint 6). Today a removed archetype leaves a character
on an orphan that `versionCheck` reports and every reader has to step around.
Ken's idea: the Custom archetype's write-in fields can hold an orphaned
character, so make that the endpoint for **any** archetype that's removed or
reshaped out from under its players. It shouldn't happen often, but it's
cheap hardening against it.

*The shape Claude proposed.* A data key on the archetype, e.g.
`"retired": { "into": "custom" }`, and not an id check in `migrate()`
(Decision 135 bans archetype ids in code). On load, a character on a retired
archetype gets the archetype's name, summary, classification, baseline traits,
vulnerabilities and powers copied into `archetypeChoices.writeIn` and
`powers`. Then it switches to Custom, a notice says what happened and to see
the GM, and the journal records it. This is triggered by the game data, not
the save-file schema, so it's a load-time conversion beside `migrate()`, not
a schema step, and it has to be safe to run twice. The cousin pattern is
Decision 143's `retired` armor upgrade, which still works but isn't offered.
That's the other option to weigh: **retire in place** (the archetype keeps
working for those who have it and just can't be picked) vs. **fold into
Custom** (its rules are gone, so the character shouldn't keep running on
them).

*Caveats to relitigate before building:*
1. **Computed bonuses vanish silently.** Constraint 7 means an archetype's
   bonuses aren't stored on the character; they're computed from its data.
   Fold a character into Custom and anything the archetype computed is gone:
   an Arcanist's TOL bonus and focus-stat bonus, a Professional's Focused
   Skill price and starting-cap bonus, Natural Advantages' free ranks, a
   Werewolf's SFR and RoU. The conversion either writes them down first (as
   Adjustments or trait text) or names each one the player is losing.
2. **Panels without a Custom twin.** Custom has no `table` panel, so an
   archetype's table rows (Cyborg's Installed Cybernetics) would have to
   become trait text or notes. Trackers with no matching mechanic
   (Cyborg's Tolerance Load) have no home; Custom's "magic" box means TOL
   Spent and the Cascade, which is the wrong fit.
3. **Choices that only made sense inside the archetype**: a specialization
   pick, focus allocations, Disciplines. Each becomes text, or is dropped
   with a note.
4. **It's one way.** A converted file that's saved stays Custom, even if the
   archetype later returns.
5. **Custom is a holding pen, not always the destination.** A chromed ex-Cyborg
   really belongs on the Professional with cybernetics, and the subtype is the
   player's and GM's pick, not something a migration can guess. The notice
   has to say "your GM rebuilds this in Admin", not imply the job is done.
6. **Is it a rescue or insurance?** The wizard lets a player pick Cyborg today
   (with a warning), and the Cyborg has no content, so a saved one holds at
   most table rows and a tracker count. Ask whether anyone has one. Either way
   it's worth having for Vampire and Werewolf, both still draft.

*To respect:* constraints 6–8 and 10 (the conversion runs on untrusted files
and must stay total), Decision 135, Decision 153's write-in shape, and
Decision 152 (the folded character keeps its classification, so what it may
buy doesn't change under it). Lands with the Cyborg's retirement, which needs
its own numbered decision.

---

### For the designers

**W56 — A tuning bench: change the game's numbers, see what moves, hand back a change request.** *Ken · ⏭ · shaped with Claude 2026-10-01*
Raised 2026-10-01. Today a numeric ruling (LUCK starting at 4, not 2) reaches
the app by Ken relaying it to Claude in a session. `shadows-data.js` is
meant for designers in a text editor (SCHEMA §1), but it's thousands of
lines of JSON, and finding the number is the easy half. The hard half is
what the number touches. The wish is a page Ken, Scott or Deighton opens,
changes numbers on, and exports as something a session then lands.

*The shape.*
- **A bench, not an editor.** It never writes `shadows-data.js`. It exports
  a *change request*: a small file listing each change as
  `{ path, from, to }`, with who proposed it, why, and the `gamedataVersion` it
  was made against. A session lands it as *Content* tier work, with the
  version bump, the changelog line, the CRB cross-check and any flag it closes.
  The tool takes the typing out of the change. Review still happens.
- **Show what moves.** A number on its own is hard to judge, so the bench shows
  what it does to characters. It loads the real engine with no DOM (constraint 5),
  so it can run sample characters (one per archetype at each power level)
  before and after the change, side by side: HP, SAN, LUCK, CP left, whatever
  differs. Deighton then sees "every Street-level character starts with 2 more
  LUCK" and not only `resources.luck.startingValue: 2 → 4`. Without this
  part it's a form over a JSON file. This part is why it's worth building.
- **Only real knobs.** It offers only numbers the engine actually reads. The
  Decision 135 key guard already knows which those are, and the bench should
  use that list and not keep its own. Invariants that look like settings
  (1 Health Level per BOD, Decision 64) aren't offered.
- **Catch prose that goes stale.** Text often repeats a number. A vehicle
  perk spells out "Boosting costs 1 LUCK, Exploding costs 2 LUCK", and SAN's
  description says the cap is 95%. The bench lists every text field that
  quotes a changed number, so the request flags the copy for a voice pass and
  the copy doesn't drift.
- **Lives in `tools/`, never shipped.** It isn't part of the player build or
  `src/`. Like the app it runs from `file://` (classic scripts, export through
  a Blob download), so it can go to Deighton as a folder.

*Settled with Ken, 2026-10-01.*
1. **Numbers only, to start.** Adding or editing advantages, archetypes or
   powers would be a content editor, which is a much bigger tool and a
   separate wish if it's ever wanted.
2. **Not hosted, to start.** It goes out as a folder. A page on the live site
   would always match `main`, so it's worth revisiting, but it would be a
   public page offering to change the rules.
3. **Sign-off stays a conversation.** Ken, Scott and Claude can raise anything
   with Deighton as needed. The request records who proposed each change, and
   the bench doesn't add an approval step.
4. **Ken hands the request to Claude, and a skill lands it.** A new
   `.claude/skills/` runbook (working name `land-a-tuning`), alongside
   `close-a-flag`. It checks the request was made against the current
   `gamedataVersion`, applies each path, and runs the before/after diff to
   decide whether Decision 68 calls for a bump. It goes through the CRB
   cross-check and pins any worked example in `tests/rules.test.mjs`. It
   rewrites or flags the stale prose, closes any flag the change answers,
   writes the changelog line, and runs `verify`. The rules stay in
   `CLAUDE.md`, and the skill only carries the steps. If applying the paths
   turns out to be fiddly, a small script can do that one step.

*Also a review sheet.* The idea came from wanting to hand Deighton the raw
numbers to check. So the bench should be readable as an audit as much as a
place to edit. Each number shows its label, its section and the text that
explains it. A **Confirmed** tick sits beside each one, and it goes out in the
same request file. A request made up only of ticks is a useful result in its
own right: a record of which numbers Deighton has checked, and against which
`gamedataVersion`.

*To respect:* constraints 1, 5 and 6 (an id is never offered for editing).
Decision 68 (a change no character can observe bumps nothing, and the
before/after diff is how you tell). Decision 135. *Change tiers* in
`CLAUDE.md`: a request is input to a Content change and doesn't replace one.
Building the bench itself is tooling no player sees, so it's not *Rule or
shape* work. Choosing how designer changes reach the data is a workflow choice
someone could have made differently, so it probably earns a decision when it
lands.

## 2. Notes for whoever picks these up

- **Next free number: W68.** Everything above is open; W38 has a plan,
  `plans/two-tabs-one-character.md`, waiting on Ken's TQ1–TQ3. What was
  built is in [`log/wishes-granted.md`](log/wishes-granted.md).
- **The primitives worth reusing.** A modal (`openModal`, Decision 111) for
  anything that takes the screen; a popover (`openPopover`, Decision 119)
  for a small panel beside what opened it, which follows the render; the
  catalog browser (`openCatalog`, Decision 118), which takes a new catalog
  as a `kind` with `Engine.catalogLine` reading it; the undo toast, which
  every `commit()` gets for free.
- **One binder per set of controls.** Trackers' vitals controls are bound by
  `bindVitalControls(root)`, so a popover and the page can't drift apart.
  A new place that shows the same controls should call it, not copy it.
- Most of these don't touch rules. If one starts to — e.g. it wants to show a
  computed number the engine doesn't have yet — that part stops and goes to
  Deighton.

**W54 — Main's SFR card for a written-in pool.** *Claude · 💡*
A Custom character who ticks **Uses SFR** counts its pool on Trackers, but
Main's SFR card and the vitals read `Engine.sfr()`, which takes its size from
the archetype's scaling row, and a written-in archetype has none. Main could
read the tracker panel's player-set max instead.

**W55 — Sticky notes on the Notes tab.** *Ken · 💡*
Small notes a player pins as cards at the top of Notes (a contact's number,
a debt, tonight's lead), with the free-form page still below them. A note is
added, edited and removed like a gear row, and logged. Raised 2026-10-01 while
locking a power's words (Decision 154), whose Notes field stays free.
*To respect:* the free-form page stays as it is; cards are the player's, not
derived from anything.
