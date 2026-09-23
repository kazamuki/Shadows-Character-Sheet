# Wishlist — ideas not yet scheduled

A parking lot. Things worth doing that nobody has committed to yet — mostly UX
and table feel. **Nothing here is a decision or a plan.** When an item gets
picked up it moves out: into a branch, a `plans/` doc if it takes more than one
session, and a numbered decision in `SCHEMA.md` §4 when it lands. Then its row
here is struck through with a pointer to where it went, not deleted, so the id
stays meaningful.

This is not `STATE.md` §3. STATE is the pick-up-work view for things that are
in flight or waiting on someone. An item here is waiting on nobody but a free
session and Ken saying yes.

**Adding an item:** next free `W` number, never reused. Say who raised it, what
the player feels today (not just the fix), and anything the fix has to respect —
a hard constraint from `CLAUDE.md`, a decision, a rules question. A rules
question means the item is blocked on Deighton, and it says so. Claude adds
items here too, marked as such; Ken triages them.

**Status:** 💡 idea · 🔎 needs a look (shape unclear) · ⏭ ready (shape is clear, just needs doing) · ~~struck~~ moved out

---

## 1. Items

### Trackers & vitals

**W1 — Trackers wastes the right half of the screen.** *Ken · 💡*
Every tracker card is full-width with its controls packed left: Damage's
stepper and action row, Sanity, Luck, Çredits. At a desktop width most of each
card is empty. Options: a two-column grid of tracker cards on wide screens
(Damage + Armor + Pain as one column, Sanity/Luck/Çredits as the other), or
putting each card's action buttons on the right of its own row. The grid is the
bigger win — it also puts Damage, Armor and Pain side by side, which is how
they're read (see W10). Must still collapse to one column on a phone.

**W2 — Make the quick-info pills interactive.** *Ken · 💡*
The vitals bar (HP, Pain, SAN, Luck, Ç, IP, MP) on every non-Main tab is
read-only; changing any of them means going to Trackers. Clicking a pill
should open a small popover for *that* value: HP → Take a hit / ±damage; Pain →
add or clear a Condition; Luck → spend/regain; SAN → loss; Ç → earn/spend.
Popovers call the same actions Trackers does — no second code path, every
change still lands in the audit trail as one undoable action (Decisions 48–49).
Pairs with W6: HP's popover can just open the hit modal.

**W3 — Same interactivity on Main's vitals cards.** *Ken · 💡*
Main's Health/Pain/Sanity/Luck/Çredits cards are the big version of W2's pills
(Decision 32's command console). Same popovers, same actions. Build W2 and W3
as one component rendered at two sizes, not twice.

**W6 — Take a hit becomes a modal.** *Ken · 💡*
Today it opens as an inline panel under Damage, below the HL boxes, and the page
around it stays live. Taking a hit is the one moment that deserves the whole
screen: a modal that shows current HP and the Health Level track up top, the
worn armor that will answer, the inputs, and the result preview before Apply —
and doesn't let Apply fire until the inputs are valid (it already gates on
damage; the modal makes the reason unmissable). Needs: focus trap, Esc to
cancel, return focus to the button that opened it. Decision 99's resolver is
already pure (`resolveHit` previews, `applyHit` commits), so this is a UI move,
not an engine change. Also the natural target for W2/W3's HP popover.

**W10 — Health Levels sit outside the Damage card.** *Claude · 💡*
The five `5/5` boxes float in their own row between Damage and Armor, grey
until something is lost, and nothing ties them to Pain. The print sheet already
groups HL into Pain Level bands (Decision 94). Bring that on-screen: HL track
inside the Damage card, each box banded by the Pain Level it drives, so a
player sees *why* they're at Pain 2 instead of reading it in a separate card.
Folds into W1's layout.

~~**W11 — The damage stepper runs backwards from what it displays.**~~ *Claude · → Decision 107, app 0.16.0: Heal 5 / Heal 1 / Hurt 1 / Hurt 5*
The card shows `25 / 25 HP` in big green, and `+5` turns it into `20 / 25`.
The stepper edits *damage taken* (store inputs — Constraint 7, correct), but
the number on screen is HP remaining, so "+" makes the number go down. Checked
in the running app, 2026-09-22. Either relabel the stepper (`Hurt 5` / `Heal 5`,
or `−5 HP` / `+5 HP` with the sign matching the display) or show the damage
number as the headline. Relabelling is the smaller change and keeps the model.

~~**W12 — Undo where the action happened.**~~ *Claude · → Decision 107, app 0.16.0: `showUndoToast` in `shared.js`, which undoes only its own audit entry*
Undo lives under Session Log (Decision 50). Mid-fight, a mis-click on `+5` or a
wrong Apply means leaving the tab to fix it. A short toast after any tracker
action — "Took 12 damage · Undo" — calling the same LIFO undo (Decision 49)
would make every button feel safe to press. Probably the highest
value-per-line item on this list.

### Loadout & catalog

**W4 — Search, filter, and a full view for the weapon/armor catalog.** *Ken · 💡*
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

**W5 — Section shortcuts inside Loadout.** *Ken · 💡*
Loadout & Powers is one long scroll: Weapons, Armor, Gear, Focused Skills,
Tweak, and archetype powers. A small in-page nav (chips or a sub-tab row) at the
top — Weapons · Armor · Gear · Powers — that jumps to each section. Keep it
anchors-and-scroll rather than sub-tabs, so print and Ctrl-F still see the
whole page. Section names should come from what's rendered, not a hardcoded
list, so an archetype panel shows up on its own ("zero app changes" rule).

**W13 — A fight view.** *Claude · 🔎*
During combat a player needs: their weapon lines (attack check, damage),
Defense/armor INT, HP/Pain, Conditions, Luck, and Take a hit. Those live on
three tabs — Main, Loadout, Trackers. Main's Combat table lists combat *skills*,
not the weapons actually carried, which is what gets rolled. Worth deciding
whether Main becomes the fight dashboard (weapon lines on Main, above or instead
of the skills table) or whether that's a separate mode. Bigger than the rest of
this list; wants its own proposal before any code. W2/W3/W6 are steps toward it
either way.

**W16 — Weapon mods and rounds in the magazine.** *Ken · ⏭*
Deferred twice from the combat plan (Session 4, then the cleanup session,
2026-09-23) as "if wanted". Today a weapon line shows capacity as text, and the
mods glossary is reference only: a player can't mark a scope on a rifle or
count down a magazine. Shape: `weapons[i].mods: [ids]` from
`weaponModGlossary` and `weapons[i].rounds`, as **one** character schema 0.9
bump with its `migrate()` step and the round-trip test (constraint 8). Mods
that change a number (ACC, damage) are read by `weaponLine()`, the way armor
upgrades are by `armorPiece()`. Anything the Gear chapter leaves vague is a
Deighton question, not a guess.

**W17 — Consumables you carry: a Nanomed Kit comes out of stock.** *Claude · 💡*
Raised 2026-09-23, from Decision 105. The Nanomed Kit panel heals and clears,
but using one doesn't take a kit from Loadout or cost the 4,500Ç. The player
has to remember to cross it off gear and to log the purchase. Speed Heal, the
battle chems and Field Repair Kits have the same gap, because Loadout's gear
is free text. Shape to decide first: consumables as catalog entries with a
count (a schema bump, so it could share W16's 0.9 migration), and the panel
offering "use one you carry" next to "bought on the spot". Wants a proposal
before code.

### Theme & polish

~~**W7 — Primary buttons are unreadable in light mode.**~~ *Ken · → Decision 107, app 0.16.0, with a contrast guard in `build.test.mjs`*
`Take a hit`, `Apply hit`, `Buy`, the recovery actions' apply button — and
off the sheet, the wizard's `Continue` and Home's `Open sheet`/`Resume draft`.
Every `.btn.primary`: dark text on violet. Cause, found 2026-09-22: `.btn.primary` in `shadows.css` sets only the
background and border, so text inherits `--text`, which the light theme turns
near-black (computed `rgb(17,17,17)` on `rgb(113,43,140)`). Fix is one declared
foreground on `.btn.primary` that holds in both themes. Worth sweeping the other
accent-background buttons (Heal all, Add, Custom weapon) in the same pass, and
worth a small contrast guard in the smoke test so the next token change can't
reintroduce it — mutation-test it against the current CSS.

~~**W14 — Conditions as chips, not a dropdown.**~~ *Claude · → Decision 107, app 0.16.0: a chip palette on both tabs, and Main's chips open their details*
Main and Trackers both add Conditions via `select` + `Add`. Active Conditions
could render as chips with the penalty inline
(`Stunned · −2`), click to open details or remove. Makes "what's wrong with me
right now" a glance instead of a read, and it's the same component W2's Pain
popover wants.

**W15 — Let a hit land.** *Claude · 💡*
Game feel. Applying a hit changes numbers silently. A brief flash on the HP
pill and the HL boxes that were lost, and a distinct beat when Pain Level
changes, would make damage feel like damage. Respect
`prefers-reduced-motion`. Cosmetic, cheap, and easy to overdo — one effect,
not a system.

### Docs

~~**W18 — `CHANGELOG.md` stopped at 0.7.0.**~~ *Claude · → caught up through v0.15.0 in `CHANGELOG.md`; `docs.test.mjs` now fails without a section for the current version*
Found 2026-09-22 and noted only in that day's log entry, so it had nowhere to
be picked up from until now. The file is still headed "[Unreleased] — app
0.7.0", and its last tag section is `v0.4.0-phase-3.3`. Everything from 0.8.0
to 0.15.0 is missing, and CI attaches the build to each `v*` release, so a
download can't be traced back through it. The history already exists in
`log/shipped.md` and the ledger. The fix is one catch-up pass, one section per
tag, written for what a player would notice. It should also decide whether the
file keeps up per release or points at `log/shipped.md`, so it can't go stale
the same way again.

---

## 2. Notes for whoever picks these up

- **W2, W3, W6 and W12 are one piece of work in practice.** A shared
  popover/modal primitive, the undo toast, and the hit modal all want the same
  focus-and-dismiss handling. Build the primitive once.
- **W1 and W10 are one layout pass.** Doing W1 without W10 lays out a card
  that W10 rearranges again.
- **W12's toast is built** (app 0.16.0). W2/W3/W6's popovers and modal
  still want one shared primitive for focus and dismissal. The toast isn't
  that primitive, since it never takes focus.
- None of these touch rules. If one starts to — e.g. W13 wants to show a
  computed number the engine doesn't have yet — that part stops and goes to
  Deighton.
