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

### Wizard

W37 came out of the weekly meeting's walk through character creation on
2026-09-24, with W34–W36, which Deighton ruled on 2026-09-27 (Decision 150,
now in `log/wishes-granted.md`). It's a **rules question for the design
team**, so it's blocked on Deighton.

**W37 — Starting LUCK of 6, maybe by Campaign level.** *Ken · 🔎 · rules: Deighton*
Everyone starts with 2 LUCK today (Decision 5, `resources.luck.startingValue`).
The meeting wants 6. The other idea discussed was to vary it by Campaign
level, and the direction is undecided: more LUCK at Street level (to help a
fragile character survive) or more at World Coming Down (to fit the scale).
*To respect:* **maximum LUCK is computed, not stored** (constraint 7). It's
`startingValue` plus bought LUCK, so changing the base raises every existing
character's maximum too, locked ones included. That's probably right, but it
should be a choice, and it's a `gamedataVersion` bump. A per-level value means
moving the number onto `powerLevels[*]`, and the four places in `wizard.js`
and `sheet.js` that read `luck.startingValue` directly should go through one
engine reader first. Decision 5 needs superseding, and the CRB's Luck section
(030) needs the new number.

### The sheet at the table (from the design critique)

W44–W46 are what's left of the 2026-09-30 design critique (score
28/40, snapshot in `.impeccable/critique/`) after its combat-table finding,
W43 (tap targets and small text, 0.32.1) and W42 (Health verbs on Main, 0.33.0)
shipped. All are **player-facing
layout or behaviour**, so they're the *Rule or shape* tier ("propose before
building"). None touches a rule. Measurements are from a 375px viewport; the
Main tab was seen running, the other tabs were read from `DESIGN.md` and the
code.

Each carries a **Harden** note from a 2026-09-30 pass: what it has to survive
when built, checked against the code rather than guessed. Since W43, controls
are 44px on a touchscreen and `npm run phone-check` fails on anything smaller,
or on text under 11px, so a new control inherits the floor rather than
re-arguing it.

**W44 — The wizard's vitals rail buries the step on small screens.** *Claude · 🔎 · critique P2*
At 1060px and below the vitals rail (BOD to LUCK) sits above step 1, and at 800px
the actual choice is off screen. The step title and its subtitle are the same
sentence, and the step strip truncates its labels. The rail also shows "1 (-3)"
placeholders before anything is chosen. *The fix:* collapse the rail to one
sticky HP / SAN / LUCK line, show one title, shorten the strip labels. The
`[ 1 0 ]` eyebrow means nothing to a first-timer, and Campaign Power Level asks a
question a new player can't answer without a stated default.
*Harden.* Step 7's jump bar is already sticky under the header
(`top:var(--hdr-live)`), so a sticky vitals line stacks with it and the two
must share one offset, not overlap. On iOS a sticky bar plus the open
keyboard can cover the field being typed in, so try it with a field focused
near the bottom of the screen. The short strip labels have to come from the
data (today the strip cuts `st.label` at its first colon or dash), not from a
list in `wizard.js`, or a new step needs an app change. A stated default for
Campaign Power Level is a choice for Ken and the GM text, not a value the UI
picks.

**W45 — Main repeats identity before the first number.** *Claude · 🔎 · critique P2*
On a phone the name appears in the header and again in the hero, with a "LIVE
SHEET" eyebrow, the barcode and TAG, and the archetype line: about 190px before
any number. *The fix:* the name once, in the header; the hero keeps TAG and
archetype. Same pass: on a phone the stat grid comes before weapons and armour,
though the code comments say combat leads. A veteran mid-fight has to scroll past
all of Stats to reach their weapon. *Open:* does Main become Health, Pain,
armour and weapons, with stats on their own tab? That's an information-architecture
call for Ken. The Çredits card sits alone in its grid row; go three across or span it.
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
`prefers-reduced-motion`, and no glow on a resting surface (DESIGN.md). The
detector also flagged a zero-offset cyan glow and a striped gradient. Check
those against DESIGN.md when this is picked up, and `sheet.js:1726`'s `.76rem`,
which is off the type ramp. (Its infinite pulse on `.admin-banner .dot` was
fixed with W43: it stops under reduced motion, and a test now holds every
animation to that.)
*Harden.* The lock handler (`wizard.js`, `[data-lock]`) saves, renders the
sheet and calls `exportChar()` in the same click. The beat must run alongside
that, never in front of it: a download started from a timer after the
animation can lose the click's permission to download, and the export is
what keeps the character safe. A TAGless character has no barcode, so the
beat needs a version for "Off grid". It plays on the lock and never again: not
on a reload, a theme switch or a re-render of a sheet that's already locked.

**W47 — A keyboard tap on Trackers loses its place.** *Claude · 🔎 · found building W42*
Every `commit()` re-renders `#main`, which replaces the button that was
pressed, so focus falls to `<body>`: press Enter on Trackers' Hurt 1 and the
next Enter does nothing, and Tab starts again from the top. The vitals
popover already puts focus back (`refreshPopover`), and Main's W42 row does
too (Decision 151). Trackers' stepper, SAN, LUCK and the recovery panels
don't. *The fix:* one rule in `renderMain` rather than a patch per control:
note the focused element's `data-*` key before the render and focus its twin
after, falling back to somewhere harmless, never to a control that changes
something (W42 found Heal 1 handing Enter to Hurt 1).

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

## 2. Notes for whoever picks these up

- **Next free number: W56.** Everything above is open; W38 has a plan,
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
