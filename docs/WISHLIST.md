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

W45–W46 are what's left of the 2026-09-30 design critique (score
27/40, snapshot in `.impeccable/critique/`) after its combat-table finding,
W43 (tap targets and small text, 0.32.1), W42 (Health verbs on Main, 0.33.0)
and W44 (the wizard on a phone, 0.35.1) shipped. W45 and W46 are
**player-facing layout or behaviour**, so they're the *Rule or shape* tier
("propose before building"). None touches a rule.

**Re-checked 2026-10-01 (critique re-run, 29/40)** against 0.35.1, after the
Character tab (158), the Raise modals (159), the pinned vitals panel (160) and
W44 (161). Every tab was run live at 375px and on a wide screen, and focus was
tested with real key presses. W45–W47 all still stand. W45 and W47 turned out
broader than first written and are reworded below. W57–W60 are new from the
same run. Ken's order: the lock flow (W46 with W57) first; W45's shape for
Main on a phone is left open.

Each carries a **Harden** note from a 2026-09-30 pass: what it has to survive
when built, checked against the code rather than guessed. Since W43, controls
are 44px on a touchscreen and `npm run phone-check` fails on anything smaller,
or on text under 11px, so a new control inherits the floor rather than
re-arguing it.

**W45 — On a phone, every tab spends a third of the screen before its content.** *Claude · 🔎 · critique P2, widened 2026-10-01*
*Main:* below the 94px header come a "LIVE SHEET" eyebrow, the name again as
the hero's h1, the barcode and TAG, and the archetype line. That's 213px
before the HP number, and 357px before the first card with a long name that
wraps to three lines. Stats still come before weapons and armour on a phone:
`.main-stats` starts at about 825px and `.main-combat` at about 1600px (the
grid stacks at ≤900px, `shadows.css`), so a veteran mid-fight scrolls past
all of Stats to reach their weapon. *Every other tab:* the eyebrow plus a
vitals bar of 8 pills wrapping to 3 rows put each tab's title at 335px.
*Character (158):* its sticky jump bar wraps 7 chips to 3 rows, 161px, so
with the header 31% of the screen stays pinned while reading. The Çredits
card still sits alone in its grid row, now because the W42 verbs row splits
the grid; go three across or span it.
*The fix:* the name once, in the header (the hero keeps TAG and archetype);
combat before stats on a phone; a one-row vitals bar and no eyebrow on the
other tabs; Character's jump bar one row that scrolls sideways, as the header
tabs do. *Open, Ken's call:* does Main on a phone become Health, Pain, the
verbs, weapons and armour, with stats moving to Skills where checks are
rolled? And once the panel is pinned on a wide screen, should Main's vitals
cards slim down? (Decision 160 rejected *hiding* the panel, not slimming the
cards.)
*Harden.* The header already cuts a long name with an ellipsis on a phone and
a portrait tablet (`phone-check` shows it), so if the hero drops the name, a
long name is never shown whole anywhere. Keep one place where it wraps
instead of cutting. The hero's TAG line has three states, not one: a TAG, a
Ghost or Black TAG's label (Decision 146), and TAGless, which reads "Off grid"
(148). An unnamed character's title is "Unnamed" today. Any move has to read
right in all of them.

**W46 — The lock moment has no ceremony.** *Claude · 💡 · critique, Ken chose "one short beat"*
Locking is the best emotional beat in the product and it becomes the sheet with
an immediate export. Ken picked a sub-second NYTE City beat, for instance the
TAG barcode drawing in. *To respect:* short, state-driven, off under
`prefers-reduced-motion`, and no glow on a resting surface (DESIGN.md). Build
it with W57, so the beat rewards a lock the player confirmed rather than
replacing the confirmation.
*Checked 2026-10-01:* after Lock & Export, `document.getAnimations()` is
empty, there's no toast, and focus falls to `<body>`; the beat should leave
focus somewhere sensible (the sheet's heading). The detector's zero-offset
cyan glow is `.card.selected`'s ring and its striped gradient is the Massive
hatching; DESIGN.md sanctions both, so they're closed. `.76rem` is off the
type ramp at `sheet.js:1811` (an inline style; it was `:1726`) and in about
nine rules in `shadows.css`, so it's a ramp question, not one line. (The
infinite pulse on `.admin-banner .dot` stops under reduced motion since W43,
and a test holds every animation to that.)
*Harden.* The lock handler (`wizard.js`, `[data-lock]`) saves, renders the
sheet and calls `exportChar()` in the same click. The beat must run alongside
that, never in front of it: a download started from a timer after the
animation can lose the click's permission to download, and the export is
what keeps the character safe. A TAGless character has no barcode, so the
beat needs a version for "Off grid". It plays on the lock and never again: not
on a reload, a theme switch or a re-render of a sheet that's already locked.

**W47 — A keyboard press loses its place almost everywhere off Main.** *Claude · 🔎 · found building W42, widened 2026-10-01*
A commit or `update()` re-renders, which replaces the button that was
pressed, so focus falls to `<body>`: press Enter on Trackers' Hurt 1 and the
next Enter does nothing, and Tab starts again from the top. Tested with real
key presses on 0.35.1, focus is lost after: every Trackers commit (Hurt and
Heal, SAN, LUCK, condition quick-add, Rest); Progression's Grant IP; the
flyout's Pin and Unpin (`setVitalsPinned`, `app.js`); **Raise in a Raise
modal** (159), whose `refresh()` rebuilds the results, so focus even leaves
the dialog; and every wizard stepper and the Custom classification cards.
Main's W42 row keeps focus (Decision 151), and so does the popover
(`refreshPopover`, `shared.js`), except that a control the press disables
(LUCK Regain reaching 4/4) has no fallback. Esc from a Raise modal returns
focus correctly.
*The fix:* one rule rather than a patch per control, applied in `renderMain`,
the modal's `refresh()` and `refreshPopover`: note the focused element's
`data-*` key before the render and focus its twin after. If the twin is gone
or disabled, fall back to somewhere harmless (the section, or the popover's
trigger), never to a control that changes something (W42 found Heal 1
handing Enter to Hurt 1). The lock's focus is W46's.

**W57 — The lock asks nothing, and its warnings are hidden when it's pressed.** *Claude · 🔎 · critique P1, 2026-10-01 · Ken: build first, with W46*
Lock & Export went through with 4 Stat Points, 21 Skill Points and 5 CP
unspent: those are warnings, not errors, so nothing stops it, and the sheet
has no unlock, only Admin free-edit. At 375px the sticky `.wiznav` is 156px
tall and covers the issues list just as the Lock button comes into view.
"Locking finalizes creation…" sits below the fold. *The fix:* a review beat
before the commit that lists what's unspent and what the lock gives up, then
the commit, then W46's beat. The export still fires in the same click as the
commit (W46's *Harden*). Decision 141 has Lock add or update a roster entry
"without asking". That ruling was about replacing a character, not about an
unspent pool, so a confirmation sits beside it rather than reversing it, but
the decision that builds this should say so.

**W58 — The closed vitals flyout is still in the tab order.** *Claude · 🔎 · critique P2, 2026-10-01*
`.vdrawer` is hidden by `transform:translateX(100%)` and `aria-hidden="true"`
(`shadows.css`), so its Close button and six vital buttons stay focusable:
Tab walks into invisible controls on every sheet tab, and `aria-hidden`
content that takes focus is an accessibility failure in itself. Opening it on
the sheet leaves focus on the toggle; the wizard's branch in `app.js` moves
it in. *The fix:* `inert` (or `visibility:hidden` after the slide) while
closed, and move focus in on open and back to the toggle on close. Seen once
and not confirmed: widening past the pin breakpoint left `aria-hidden` stale
until the next render.

**W59 — Steppers don't say what they change.** *Claude · 🔎 · critique P2, 2026-10-01*
Every stepper is `aria-label="decrease"` / `"increase"` (`wizard.js`,
the stepper helper): the Skills step has 36 buttons that all read "increase,
button", and the value beside them isn't a live region, so a screen reader
never hears the new number. *The fix:* name the target ("Raise BOD",
"Lower Firearms") from the same data the row shows, and announce the value
after a press, politely, once.

**W60 — Small accessibility and copy fixes from the re-run.** *Claude · 🔎 · critique P2–P3, 2026-10-01 · Fix tier*
None of these needs a proposal. Each is a named finding to fix in place.
- Input placeholders render the browser's `#757575` on `--bg` at 3.8:1
  (Trackers' "amount", "note (what for)", "±"); there's no `::placeholder`
  rule. AA needs 4.5:1, in both themes.
- The Custom classification cards render `aria-pressed="null"` before one is
  picked (`wizard.js`, `cls&&cls.id===c.id`): coerce it with `!!`.
- A step's label runs into its note with no full stop ("…assign your Base
  Stats Explosions do not happen…", `stepHeader`), and step 4's label uses
  " - " for a dash.
- `document.title` stays "Shadows — Character Intake" on a locked sheet.
- Heading levels skip: the wizard's h1 → h3, Trackers' h1 → h4.
- `.cond .meter i` transitions `width`, a layout property; `transform:scaleX`
  does the same without reflow.
- Pin lives only in the flyout, and Main has no vitals toggle, so Pin can't
  be found from Main.

### Beyond one sheet

**W29 — A GM mode: link to the table's characters, read them, leave notes.** *Ken · 💡 · a different tier of product: needs a server*
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

- **Next free number: W61.** Everything above is open; W38 has a plan,
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
