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
