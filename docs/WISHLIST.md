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

**W40 — Load the round you mean.** *Claude · 💡 · follows Decision 145*
Raised 2026-09-26, the half of W30 left over. Reload takes standard rounds from
what you carry, but Silver Rounds, Holy Points and Angel Rounds never leave the
gear list: they change the weapon's tags (Withering, +4 DMG, AP…), so the sheet
has to know which kind is in the magazine. 053 lets a Reload swap types once a
turn. The idea: a weapon row remembers what's loaded (`loaded: "silver-rounds"`),
its line shows that ammo's tags, and Reload asks which when more than one kind
fits. What it has to respect: that's a character-schema bump with a
`migrate()` step; specialty rounds are priced "3× standard", so their `reload`
names the same weapons as the standard kind; Angel Rounds only fire from a
weapon with the Angel Mod (F26's stub decides which weapons can take it).

**W41 — A TAGless character.** *Ken · 💡 · follows Decision 146*
Raised 2026-09-24 as W31's other half. Gear calls going TAGless "a legitimate
choice": no government identity, the skrip economy, no 625Ç UBI. A Ghost TAG
already labels the TAG (Decision 146); a TAGless character still shows a plain
one. The idea: a TAGless/TAG'd choice on the Identity step, the player's like
their name, and the label reads differently (e.g. "TAG on file" or "Off grid",
a voice pass). The stored number never changes; every file needs it. What it
has to respect: a new field on the character is a schema bump and a
`migrate()` step defaulting to TAG'd, and `tagReading` should answer for it
rather than a second reader. The app doesn't compute UBI, so nothing else moves.

**W32 — Spell damage in numbers.** *Ken · 💡 · reads Spell Power (Decision 108)*
Raised 2026-09-24. A spell's effect reads "½ SP Damage", and the player works
out their own Spell Power and halves it at the table, every cast. The idea:
the sheet does the arithmetic and keeps the book's words beside it, so with
Spell Power 13, Dart reads **7 (½ SP Damage)**. Halves round up for damage
(Ken). Wherever a spell's effect or overflow shows: the Grimoire, the spell
picker, Main. The Aberrations and the Cascade table name Spell Power damage
too (Backlash, Electrocytes, Elemental Blood).
What it has to respect:
- **Don't parse the prose.** The data writes it five ways ("½ SP", "½ Spell
  Power", "Full Spell Power", bare "SP", "Spell Power"). That's the Focused
  Skills lesson (B12–B14, Decision 134). A structured field, e.g. `damage: {
  sp: 0.5 }` on the effect and each overflow row, is what the engine should
  read. The text stays as the book's words.
- **Rounding isn't in the CRB.** Magic and the spell appendix never say how
  to round ½ SP. "Round up" wants a line in the CRB (Ken's), so the sheet
  isn't the only place it's written.
- **Spell Power can be null** (no Evocation rank), and the engine is total:
  the book text alone shows then.

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

W34–W37 came out of the weekly meeting's walk through character creation on
2026-09-24. All four are **rules questions for the design team**, so all four
are blocked on Deighton. They touch the same few numbers (the Stat Point pool,
how points turn into stats, and starting LUCK), so they should be settled
together rather than one at a time. F8 is part of the same conversation.

**W34 — A stat buy where each point costs more than the last.** *Ken · 🔎 · rules: Deighton*
Today a Stat Point buys one point of any stat, 1:1, from a base of 1 up to 10.
A stat at 9 costs the same to raise as one at 2, so the cheapest build is
always to pile everything into a few stats. The idea is an optional buy where
the price climbs with the stat's current value. There's already a precedent
after creation: raising a stat with IP costs its current value ×10
(Decision 14). *To respect:* it's an **option**, so a character has to record
which method it was built with. That's a stored input, which means a
character-schema change and a `migrate()` step. The cost table belongs in the
data (per Campaign level if it differs), and the wizard shows a running cost
per stat. Decision 10's hard caps stay: a table enforces its limits strictly.
Search Decisions 10, 14 and 98 (the curve past 10) before proposing.

**W35 — A flat Stat Point pool per Campaign level, with no roll.** *Ken · 🔎 · rules: Deighton*
Instead of rolling for Stat Points, every character at a Campaign level gets
the same fixed pool: no dice, no lucky or unlucky rolls, and a table where
nobody's out-built on the first night. It works with either buy, 1:1 or W34's
climbing cost. *To respect:* it's an option next to rolling, not a
replacement. Decision 11 (every creation roll is physical, and the app never
rolls) isn't affected, because a flat pool has no roll. It does need a number
per Campaign level in `powerLevels[*].statPoints`, and a GM-facing choice of
method, which is the same stored-input question as W34. F8's playtest (what
Stat Point totals people really end up with) is the natural source for the
flat numbers.

**W36 — The Stat Point roll gives 10 more than the CRB says.** *Ken · ⏸ · this is F8*
Rolling at Heroic, the wizard's total is 40 + 3d10. The CRB (040, "Rolling
Stat Points") says 3d10 + 30. This isn't a bug in the count. It's open flag
**F8**: the data follows the older reference table, which scales by Campaign
level (30 + 2d10 / 40 + 3d10 / 50 + 4d10 / 60 + 5d10), and the CRB's flat line
disagrees. The player sees `playerNote` saying the number isn't settled. Ruling
it is four numbers in `powerLevels[*].statPoints`, with no app change, and it
closes F8 (three edits: SCHEMA §5, `flagged` in the data, INDEX §2). The
meeting leaned toward revisiting it together with W34 and W35 rather than
fixing it alone, and that's why it's here rather than a quick data edit.

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

---

## 2. Notes for whoever picks these up

- **Next free number: W42.** Everything above is open; W38 has a plan,
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
