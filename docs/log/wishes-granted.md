# Wishes granted

Wishlist items that were built, moved here from `WISHLIST.md` so the live list
shows only what's still open. Each entry is as it stood when it left: the
heading says who raised it and, after the arrow, where it went (a decision, an
app version); the text under it is the wish as written, which is what the
player felt before the fix. Like `2026.md` beside it, this is history: true as
of the pointer on each heading, and never updated to match the present. For
what the app does now, the decision named in the pointer is the authority.

`W` ids are never reused, so an id cited anywhere in the docs is either open in
`WISHLIST.md` or here. Grouped by the same topics as the wishlist.

---

### Trackers & vitals

**W1 — Trackers wastes the right half of the screen.** *Ken · → Decision 112, app 0.20.0: two columns from 1000px, the body on the left*
Every tracker card is full-width with its controls packed left: Damage's
stepper and action row, Sanity, Luck, Çredits. At a desktop width most of each
card is empty. Options: a two-column grid of tracker cards on wide screens
(Damage + Armor + Pain as one column, Sanity/Luck/Çredits as the other), or
putting each card's action buttons on the right of its own row. The grid is the
bigger win — it also puts Damage, Armor and Pain side by side, which is how
they're read (see W10). Must still collapse to one column on a phone.

**W2 — Make the quick-info pills interactive.** *Ken · → Decision 119, app 0.22.0: HP, Pain, SAN, LUCK and Ç open a popover of Trackers' own controls*
The vitals bar (HP, Pain, SAN, Luck, Ç, IP, MP) on every non-Main tab is
read-only; changing any of them means going to Trackers. Clicking a pill
should open a small popover for *that* value: HP → Take a hit / ±damage; Pain →
add or clear a Condition; Luck → spend/regain; SAN → loss; Ç → earn/spend.
Popovers call the same actions Trackers does — no second code path, every
change still lands in the audit trail as one undoable action (Decisions 48–49).
Pairs with W6: HP's popover can just open the hit modal.

**W3 — Same interactivity on Main's vitals cards.** *Ken · → Decision 119, app 0.22.0: the same popover, anchored to the card*
Main's Health/Pain/Sanity/Luck/Çredits cards are the big version of W2's pills
(Decision 32's command console). Same popovers, same actions. Build W2 and W3
as one component rendered at two sizes, not twice.

**W6 — Take a hit becomes a modal.** *Ken · → Decision 112, app 0.20.0: HP and the track up top, Apply waits with its reason; `openHitModal()` for W2/W3*
Today it opens as an inline panel under Damage, below the HL boxes, and the page
around it stays live. Taking a hit is the one moment that deserves the whole
screen: a modal that shows current HP and the Health Level track up top, the
worn armor that will answer, the inputs, and the result preview before Apply —
and doesn't let Apply fire until the inputs are valid (it already gates on
damage; the modal makes the reason unmissable). Needs: focus trap, Esc to
cancel, return focus to the button that opened it. Decision 99's resolver is
already pure (`resolveHit` previews, `applyHit` commits), so this is a UI move,
not an engine change. Also the natural target for W2/W3's HP popover.
*Update (Decision 111):* the primitive exists. `openModal`/`closeModal` in
`shared.js` is a native `<dialog>` with Esc, backdrop close, the page made
inert, focus returned to the opener, and the undo toast carried inside. The
spell picker is its first user, so W6 is now a matter of moving the Take a hit
panel into it.

**W10 — Health Levels sit outside the Damage card.** *Claude · → Decision 112, app 0.20.0: the track in the Damage card, in the print sheet's Pain Level bands, yours lit*
The five `5/5` boxes float in their own row between Damage and Armor, grey
until something is lost, and nothing ties them to Pain. The print sheet already
groups HL into Pain Level bands (Decision 94). Bring that on-screen: HL track
inside the Damage card, each box banded by the Pain Level it drives, so a
player sees *why* they're at Pain 2 instead of reading it in a separate card.
Folds into W1's layout.

**W11 — The damage stepper runs backwards from what it displays.** *Claude · → Decision 107, app 0.16.0: Heal 5 / Heal 1 / Hurt 1 / Hurt 5*
The card shows `25 / 25 HP` in big green, and `+5` turns it into `20 / 25`.
The stepper edits *damage taken* (store inputs — Constraint 7, correct), but
the number on screen is HP remaining, so "+" makes the number go down. Checked
in the running app, 2026-09-22. Either relabel the stepper (`Hurt 5` / `Heal 5`,
or `−5 HP` / `+5 HP` with the sign matching the display) or show the damage
number as the headline. Relabelling is the smaller change and keeps the model.

**W12 — Undo where the action happened.** *Claude · → Decision 107, app 0.16.0: `showUndoToast` in `shared.js`, which undoes only its own audit entry*
Undo lives under Session Log (Decision 50). Mid-fight, a mis-click on `+5` or a
wrong Apply means leaving the tab to fix it. A short toast after any tracker
action — "Took 12 damage · Undo" — calling the same LIFO undo (Decision 49)
would make every button feel safe to press. Probably the highest
value-per-line item on this list.

**W42 — Hurt, Heal and Take a hit are not visible on Main.** *Claude · critique P1 · → Decision 151, app 0.33.0: Heal 1 · Hurt 1 · Take a hit after Pain on Main; Hurt 1 greys out at zero*
The most common change mid-fight lives behind tapping the Health card (or on
Trackers). Main shows the numbers well but no verb. *The fix:* a visible
Hurt / Heal / Hit row under the Health and Pain cards, bound by
`bindVitalControls` so it can't drift from the popover. *To respect:* every
change is a `commit()` with its undo toast; DESIGN.md's "shadows are for things
that float" and no new neon.
*Harden.* Each tap is its own `commit()` and its own toast, so five quick
Hurt 1s are five undo steps. That's right (each can be taken back), but the
toast must not stack five deep over the row being tapped. Hurt has no upper
clamp in `bindVitalControls` (`setDamage` floors at 0 only), so the row must
read sensibly past the last Health Level, where Massive damage and Helpless
already mean something. On a phone the row has to fit three 44px buttons
beside each other at 320px without wrapping into the Pain card.

### Loadout & catalog

**W4 — Search, filter, and a full view for the weapon/armor catalog.** *Ken · → Decision 118, app 0.22.0: a modal with search, section, afford and sort, the numbers before Add/Buy*
The pickers are native `<select>`s: 55 weapons in 14 groups, 37 armor pieces,
type-a-letter to jump, no search. And each option shows only name and price —
**no damage, ACC, range, PROT or RES until after it's added**, so a player
shops blind. Wants: a text search; a filter for "what I can afford" (Çredits is
already known); a filter by skill/group; and a browse view — a table or card
grid with the stats that matter, sortable, with Add/Buy on each row. The browse
view can be a modal (same pattern as W6) so Loadout stays a list of what you
own. Data already has everything this needs (Decision 92) — zero data changes.
*Claude, 2026-09-23:* the Grimoire's picker (Decision 108) is a working version
of this: search, filters, the numbers shown before Add, and held entries greyed
out. `spellResultsHtml` in `sheet.js` and its handler in `app.js` are the
pattern to reuse for weapons and armor.

**W5 — Section shortcuts inside Loadout.** *Ken · → Decision 114, app 0.20.0: from the sections the page drew*
Loadout & Powers is one long scroll: Weapons, Armor, Gear, Focused Skills,
Tweak, and archetype powers. A small in-page nav (chips or a sub-tab row) at the
top — Weapons · Armor · Gear · Powers — that jumps to each section. Keep it
anchors-and-scroll rather than sub-tabs, so print and Ctrl-F still see the
whole page. Section names should come from what's rendered, not a hardcoded
list, so an archetype panel shows up on its own ("zero app changes" rule).

**W13 — A fight view.** *Claude · → Decision 122, app 0.22.0: Main is the fight view, weapons first; a separate mode waits on play showing it's needed*
During combat a player needs: their weapon lines (attack check, damage),
Defense/armor INT, HP/Pain, Conditions, Luck, and Take a hit. Those live on
three tabs — Main, Loadout, Trackers. Main's Combat table lists combat *skills*,
not the weapons actually carried, which is what gets rolled. Worth deciding
whether Main becomes the fight dashboard (weapon lines on Main, above or instead
of the skills table) or whether that's a separate mode. Bigger than the rest of
this list; wants its own proposal before any code. W2/W3/W6 are steps toward it
either way.

**W16 — Weapon mods and rounds in the magazine.** *Ken · → Decision 120, app 0.22.0, schema 0.10: mods in fixed slots, Fire and Reload on Loadout and Main*
Deferred twice from the combat plan (Session 4, then the cleanup session,
2026-09-23) as "if wanted". Today a weapon line shows capacity as text, and the
mods glossary is reference only: a player can't mark a scope on a rifle or
count down a magazine. Shape: `weapons[i].mods: [ids]` from
`weaponModGlossary` and `weapons[i].rounds`, as **one** character schema 0.9
bump with its `migrate()` step and the round-trip test (constraint 8). Mods
that change a number (ACC, damage) are read by `weaponLine()`, the way armor
upgrades are by `armorPiece()`. Anything the Gear chapter leaves vague is a
Deighton question, not a guess.

**W17 — Consumables you carry: a Nanomed Kit comes out of stock.** *Claude · → Decision 121, app 0.22.0: gear from a catalog, counted; the Nanomed, Speed Heal and repair-kit actions take from it*
Raised 2026-09-23, from Decision 105. The Nanomed Kit panel heals and clears,
but using one doesn't take a kit from Loadout or cost the 4,500Ç. The player
has to remember to cross it off gear and to log the purchase. Speed Heal, the
battle chems and Field Repair Kits have the same gap, because Loadout's gear
is free text. Shape to decide first: consumables as catalog entries with a
count (a schema bump, so it could share W16's 0.9 migration), and the panel
offering "use one you carry" next to "bought on the spot". Wants a proposal
before code.

**W27 — The Magic chapter's shop: blanks, supplies and inscribed objects.** *Claude · → Decision 121, app 0.22.0: in the equipment catalog, Talismans with charges and their spell; Services are W28*
Scott's finished Magic chapter (2026-09-24) prices its Tools of the Trade:
raw materials, ritual supplies, inscription blanks, and a catalog of
Talismans, Wards, Artifacts and services with the spell each holds. Today an
Arcanist writes them into Gear by hand. Once it's in the data, it could be a
tab in W4's catalog browser, and an item could link to its spell in the book.
It's new content only, with no rules question, though "Warding" services
change what armor's RES stops, which the hit resolver would need to read.

**W28 — Magic's Services: Warding by damage type, and Self-mending.** *Claude · → Decision 143, app 0.29.0: Ken ruled Magic's three Wardings replace Gear's one; Elemental, Spirit and Aether are damage types; the old Warding answers all three; Self-mending is text*
Raised 2026-09-24 while merging W27. The Magic chapter sells Warding as
three services, Elemental (2,500Ç), Spirit (5,000Ç) and Aether (12,000Ç),
each "Armor RES applies to [that] damage", plus Self-mending (Ironhide, "One
mod slot"). The data has one `Warding` armor upgrade that extends RES to
"magical" damage, and `damageTypes` has no Elemental, Spirit or Aether.
Which damage types those are, and whether the three replace the one upgrade,
is a rules question (it's F23's neighbour), so these stayed out of the
catalog. Once ruled they're armor upgrades, not gear.

**W33 — Martial Arts styles.** *Claude · → app 0.29.0: the Skills tab shows the chosen styles with their bonuses and lists every style. Choosing them already existed in the wizard (the `style` pick); the rest is W39*
Raised 2026-09-24. Martial Arts carries a list of styles in the data (Commando,
Escrima, Jujitsu, Karate, Krav Maga and more), each with a bonus ("+1 Stun",
"+1 Disarm"), and no screen shows them. The smallest step is showing the list
where Martial Arts is described, under S6's "a rule the sheet names is a tap
away". Choosing a style is bigger: it's a stored input (a character-schema
change), and whether its bonus is something the sheet applies is Deighton's.

**W30 — Reload from what you carry.** *Claude · → Decision 145, app 0.30.0: standard rounds by the mag, shells by the round, "Reload anyway" in the audit; loading specialty rounds is W40*
Raised 2026-09-24, with AQ4. Once ammunition is in the shop as its own category
(the audit plan's S6), Reload could take a magazine from the matching rounds you
carry and say when you're out, the way the Nanomed Kit already comes off what
you carry. The data has a hook, `weaponType` on each ammunition entry
("Handgun", "Rifle (shotgun)"). What it lacks: how a bought unit ("15Ç/mag")
maps to a weapon's capacity, and whether one "mag" of Handgun Rounds fits every
handgun. If the CRB is silent, that's a question for Deighton, not a guess.

**W31 — TAGless and Ghost TAG characters.** *Ken · → Decision 146, app 0.30.0: the Ghost TAG half (Black TAG is the same thing); TAGless is W41*
Raised 2026-09-24 with the TAG. Every character shows a TAG under its name,
because every file needs the number to tell characters apart. But the CRB lets
a character go TAGless (living in the skrip economy, no UBI) or carry a Ghost
TAG (the Advantage) or a Black TAG, and the sheet says nothing about either.
The idea: the label reads differently for them, e.g. "TAG on file" for a
TAGless character or "Ghost TAG" when the Advantage is held. The stored number
never changes. What it needs first: a way to mark a character TAGless, which
the data doesn't have, and whether that's a player choice or a GM one. Holding
Ghost TAG is already on the character, so that half could come first.

**W40 — Load the round you mean.** *Claude · → Decision 149, app 0.31.0: specialty rounds stay loaded with their tags; Reload asks which; F34 open*
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

**W41 — A TAGless character.** *Ken · → Decision 148, app 0.31.0: TAG'd or TAGless on the Identity step and in Admin; the TAG reads Off grid*
Raised 2026-09-24 as W31's other half. Gear calls going TAGless "a legitimate
choice": no government identity, the skrip economy, no 625Ç UBI. A Ghost TAG
already labels the TAG (Decision 146); a TAGless character still shows a plain
one. The idea: a TAGless/TAG'd choice on the Identity step, the player's like
their name, and the label reads differently (e.g. "TAG on file" or "Off grid",
a voice pass). The stored number never changes; every file needs it. What it
has to respect: a new field on the character is a schema bump and a
`migrate()` step defaulting to TAG'd, and `tagReading` should answer for it
rather than a second reader. The app doesn't compute UBI, so nothing else moves.

**W32 — Spell damage in numbers.** *Ken · → Decision 147, app 0.31.0: every plain Spell Power amount, damage or not, rounded up*
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

### Theme & polish

**W7 — Primary buttons are unreadable in light mode.** *Ken · → Decision 107, app 0.16.0, with a contrast guard in `build.test.mjs`*
`Take a hit`, `Apply hit`, `Buy`, the recovery actions' apply button — and
off the sheet, the wizard's `Continue` and Home's `Open sheet`/`Resume draft`.
Every `.btn.primary`: dark text on violet. Cause, found 2026-09-22: `.btn.primary` in `shadows.css` sets only the
background and border, so text inherits `--text`, which the light theme turns
near-black (computed `rgb(17,17,17)` on `rgb(113,43,140)`). Fix is one declared
foreground on `.btn.primary` that holds in both themes. Worth sweeping the other
accent-background buttons (Heal all, Add, Custom weapon) in the same pass, and
worth a small contrast guard in the smoke test so the next token change can't
reintroduce it — mutation-test it against the current CSS.

**W14 — Conditions as chips, not a dropdown.** *Claude · → Decision 107, app 0.16.0: a chip palette on both tabs, and Main's chips open their details*
Main and Trackers both add Conditions via `select` + `Add`. Active Conditions
could render as chips with the penalty inline
(`Stunned · −2`), click to open details or remove. Makes "what's wrong with me
right now" a glance instead of a read, and it's the same component W2's Pain
popover wants.

**W15 — Let a hit land.** *Claude · → Decision 117, app 0.22.0: one flash on what the hit changed, a second beat on Pain*
Game feel. Applying a hit changes numbers silently. A brief flash on the HP
pill and the HL boxes that were lost, and a distinct beat when Pain Level
changes, would make damage feel like damage. Respect
`prefers-reduced-motion`. Cosmetic, cheap, and easy to overdo — one effect,
not a system.

**W43 — Small tap targets and sub-floor text.** *Claude · → app 0.32.1: 24px everywhere and 44px on a touchscreen, nothing under 11px, violet and magenta words on their own read tokens, a test for each*
Measured: the `?` tip is 18px (`.skill-q`, `shadows.css`), "+ Add a condition"
26px, steppers and action rows 30px. "What's new" is 10.56px and "GDG ▴" 9.6px,
under the 11px floor, and `#9b4dba` on `#0d1731` is 3.5:1 against the 4.5:1
needed. The `?` tips also lean on hover. *The fix:* 44px hit areas (padding or a
pseudo-element, so the look stays), 40px+ on steppers, the two labels to 11px or
more, the violet text lifted by a token change so the light-theme fold still
holds. Check that every tip opens from keyboard and touch.

### Skills

**W19 — Choosing a Martial Arts style breaks the Skills grid.** *Ken · → fixed in app 0.19.1: `.alloc > .picks` spans the grid, with a smoke guard (mutation-tested)*
Train Martial Arts in the wizard's Skills step and its style picker appears
squeezed into a narrow column, and every skill below it shifts one column
over: Melee's name sits under the steppers and its bonus wraps to the left
edge. Cause, found 2026-09-23 in the preview: `.alloc` is a three-column grid
(name · stepper · bonus) whose rows are `display: contents`, and the picks
block (`picksHtml`, Batch 3) is inserted as a plain grid child, so it takes
one 194px cell and pushes every later cell along. The likely fix is one rule,
`.alloc > .picks { grid-column: 1 / -1 }`. Check any other `.alloc` that
can hold picks, and add a smoke assertion that the row after a picks block
still starts in column 1. Mutation-test it.

**W20 — Stat icons beside the skill name.** *Ken · → Decision 112, app 0.20.0: `skillStatsHtml` on the wizard's name line and in the sheet's breakdown*
In the wizard's Skills step and the sheet's Skills tab, a skill reads as its
name, then a new line with "REF + COOL syn". Put the stats on the name's line
as the brand stat icons (`statIco`, `shadows-icons.js`), primary and synergy
told apart. The print sheet already does this with its Primary/Synergy
badges (Decision 94), so the two should match. One pass with W21, since
it's the same line.

**W21 — Show the character's own numbers on a skill's stats.** *Ken · → Decision 112, app 0.20.0: "REF 5 · COOL +1 syn", the synergy dimmed until trained*
Archery is REF + COOL synergy. With REF 5 and COOL 7, show "REF 5 · COOL +1
syn", so a player sees where the check bonus comes from without doing the
sum. Shape to respect: the primary stat adds its **score** and the synergy
stat adds its **modifier** (030: "Skill rank + Primary Stat + Synergy Bonus"),
so the synergy number should read as a bonus, not a score. The engine
already returns both (`skillLine().breakdown`), so this is display only.
Wizard and sheet.

### Wizard

**W22 — A sticky filter and jump bar on the Character Points step.** *Ken · → Decision 114, app 0.20.0: filter, jumps and the CP left, sticky*
Step 7 is the longest page in the app: 30 Disadvantages, then every
Advantage, then LUCK, Disciplines, Starting spells (Decision 111) and
Boosts. A bar that sticks under the header, with a text filter over names
and descriptions and jump links to each section. The filter should leave a
taken entry visible even when it doesn't match, so nothing you hold
disappears. It must still work at phone width.

**W34 — A stat buy where each point costs more than the last.** *Ken · → Decision 150, app 0.32.0: the climbing buy is the rule, 1 a point to 6 and 2 from 7 to 10*
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

**W35 — A flat Stat Point pool per Campaign level, with no roll.** *Ken · → Decision 150, app 0.32.0: flat 45/50/55/60, or a roll, the GM's pick*
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

**W36 — The Stat Point roll gives 10 more than the CRB says.** *Ken · → Decision 150, app 0.32.0: F8 closed, the old rolls replaced*
Rolling at Heroic, the wizard's total is 40 + 3d10. The CRB (040, "Rolling
Stat Points") says 3d10 + 30. This isn't a bug in the count. It's open flag
**F8**: the data follows the older reference table, which scales by Campaign
level (30 + 2d10 / 40 + 3d10 / 50 + 4d10 / 60 + 5d10), and the CRB's flat line
disagrees. The player sees `playerNote` saying the number isn't settled. Ruling
it is four numbers in `powerLevels[*].statPoints`, with no app change, and it
closes F8 (three edits: SCHEMA §5, `flagged` in the data, INDEX §2). The
meeting leaned toward revisiting it together with W34 and W35 rather than
fixing it alone, and that's why it's here rather than a quick data edit.

**W37 — Starting LUCK of 6, maybe by Campaign level.** *Ken · → Decision 157, app 0.35.0: 4 at every level, the split between 6 and 2*
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

**W44 — The wizard's vitals rail buries the step on small screens.** *Claude · critique P2 · → Decision 161, app 0.35.1: one sticky line of the points left, Vitals opens the full rail in the flyout, one title per step*
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
*Re-checked 2026-10-01, before building.* A day of changes had landed since
the critique, none of them on the rail, so the target held, but running the
wizard at 375px corrected the entry. The rail sat above the **header** too, not
only above step 1: a new character opened on 443px of vitals, and step 1's
first card was at y=800 on an 812px screen. The strip didn't cut its labels at
all: none of the eight contained the colon or dash the code cut at, so it
showed whole sentences, one step per screen. Since the critique, Back and
Continue had come to stick to the bottom (0.33.1), so a sticky line would be
squeezed from both ends, and the fixed footer's bottom 31px already sat over
the nav. The sheet had gained its own vitals pattern (Decision 160), a bar plus
a flyout, which a wizard line should reuse rather than add a third. And the
fix's HP / SAN / LUCK line was the wrong line: while building, a player spends
Stat Points, Skill Points and CP; HP, SAN and LUCK are the sheet's.
*Built (Decision 161).* Below 1060px the rail is one line sticking under the
header, after the step strip: Stats, Skills and CP left, and a Vitals pill
opening the whole rail in the sheet's flyout (no pin; focus goes back to the
pill). On step 7 the line scrolls away, since the jump bar already counts CP
and pinning both took 40% of a phone. While a field has focus the line and
Back/Continue stop sticking. Each step's `short` in the data names it in the
strip and as its title, the sentence under it once. Stats read "—" until a
Stat Point is spent. Back/Continue clear the footer (its height is measured,
like the header's); a jump on step 7 reads the bar's own sticky `top`, so it
lands under whatever is pinned. The strip's "second look" callout, which
wrapped 140px tall and stretched every step, keeps to one line. Home's
`[ 1 0 ]` glyph went. Campaign Power Level's stated default was left open: it
is Ken's call for the GM text, not the UI's.

### Modals & pickers

These build on the modal primitive (`openModal`, Decision 111), whose first
user is the spell picker. They belong in that primitive or the picker's
shared renderer, so the sheet and the wizard both get them.

**W23 — Clicking anywhere on a row picks it.** *Ken · → Decision 112, app 0.20.0*
In the spell picker, only the small button at the end of a row acts. The
whole row should: Add, Choose, Remove or Link yours, whichever the row's
button says. Keep the button, since it's what the keyboard and a screen
reader use, and don't let a click inside a text field or a link trigger it.
On the sheet each add is a `commit()` with its undo toast, so a stray click
is one Undo away.

**W24 — A disabled row should look disabled.** *Ken · → Decision 112, app 0.20.0: dimmed, with the reason in the row*
Today only the button greys out ("Needs Evocation 3", "Known"), and the
reason is in a `title` tooltip that touch screens never show. Dim the whole
row, drop the pointer cursor, and put the reason in the row as text.
Contrast still has to pass in both themes (W7's guard).

**W25 — The picker's search stays in view.** *Ken · → Decision 112, app 0.20.0*
Scrolling the spell list scrolls the search box, filters and the "Chosen 2
of 7" status line out of sight. Make that block sticky at the top of the
modal body. It's the picker's shared renderer, so this is for the sheet as
well as for starting spells.

**W26 — A way to finish, not just close.** *Ken · → Decision 112, app 0.20.0: Done in a footer that says picks are kept*
The modal only has × and Esc, which read as "cancel", yet every pick has
already been saved. Two shapes, and they differ:
(a) a **Done** button in the modal's footer that just closes, making it
clear the picks are already kept (small, matches how it works now); or
(b) staged picks with **Accept** and **Cancel**, where Cancel throws the
session's picks away. (b) changes how the picker commits and how undo
groups (one audit entry per session instead of one per spell). Claude's
take: (a), unless there's a case for backing out of a whole picking session
that per-pick Undo doesn't already cover. **Ken chose (a), a Done button,** on 2026-09-23.

### Docs

**W18 — `CHANGELOG.md` stopped at 0.7.0.** *Claude · → caught up through v0.15.0 in `CHANGELOG.md`; `docs.test.mjs` now fails without a section for the current version*
Found 2026-09-22 and noted only in that day's log entry, so it had nowhere to
be picked up from until now. The file is still headed "[Unreleased] — app
0.7.0", and its last tag section is `v0.4.0-phase-3.3`. Everything from 0.8.0
to 0.15.0 is missing, and CI attaches the build to each `v*` release, so a
download can't be traced back through it. The history already exists in
`log/shipped.md` and the ledger. The fix is one catch-up pass, one section per
tag, written for what a player would notice. It should also decide whether the
file keeps up per release or points at `log/shipped.md`, so it can't go stale
the same way again.
