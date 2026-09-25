// GENERATED from CHANGELOG.md by tools/changelog.mjs — edit the markdown, then
// run `npm run changelog`. tests/docs.test.mjs fails if this falls behind.
window.SHADOWS_CHANGELOG = [
  {
    "version": "0.28.1",
    "date": null,
    "intro": [],
    "items": [
      "**Version numbers you can read.** Each release in **What's new** shows its version in the same clean digital face as your stats, so 0.28.0 no longer reads like 0.20.0."
    ]
  },
  {
    "version": "0.28.0",
    "date": "2026-09-25",
    "intro": [],
    "items": [
      "**Keep every character you play.** This browser used to hold one sheet and one draft, and opening another character meant replacing one. Now Home lists every character you've made or imported, newest first, each with Open, Export and Remove. Tap a card to pick up where you left off. Your old sheet and draft are already on the list.",
      "**Home says what isn't in a file yet.** A character with changes you haven't exported says *Changes not exported yet*. The browser is a convenience, not a backup: clearing site data erases everything in it, and the exported `.shadows.json` is the copy that lasts.",
      "**Nothing is replaced behind your back.** Importing or locking a character adds it to the list. The one question left is a file older than the copy you already have. If the browser can't save a change, the page says so until it can.",
      "**Tap a tag to read it.** AP, Conceal, Burning, Blast (10m) and every other tag on a weapon, an arrowhead or a spell now tells you what it does. Hover or tap it on Main, on Loadout, in the catalog and in your Grimoire. A few the book hasn't pinned down yet say so, and leave it to your GM.",
      "**Your stats say what they mean.** Hover or tap a score on Main to read what a 3, a 6 or an 8 says about you, and what changes past 10.",
      "**Ammo is in the shop.** Rounds, shells, power cells and arrowheads have their own section in the equipment catalog. Buy a pack of broadheads and a dozen go in your bag, counted down with Use one.",
      "**The rules are on the sheet.** Skills has *How a check works*: the roll, the target numbers, the 10 that explodes and the 1 that botches. The Archetype tab has your *Lineage*, and an Arcanist's Magic reference adds charging, holding a spell, the Sovereign Soul, learning and teaching, the Glyphs of each Domain, and the Enchantment and Alchemy tables.",
      "**Each archetype's story, up front.** Choosing an archetype in character creation shows its lore.",
      "**No more pop-up boxes.** When the sheet can't do something, it says why at the bottom of the screen without stopping you. Deleting a session or removing a Milestone asks in the sheet's own window, with Cancel ready.",
      "**More sheet, less header.** The top bar is two slim rows on every screen: your name, then the tabs in one line. Where they don't all fit, swipe or scroll them sideways; the tab you're on stays in view. On a tablet the header takes about half the room it did, and the sheet fits a phone without sliding sideways. On a phone turned on its side, the header scrolls away with the page."
    ]
  },
  {
    "version": "0.26.1",
    "date": "2026-09-25",
    "intro": [],
    "items": [
      "**The sheet looks the same offline.** Its typefaces travel inside the file now, so a copy opened with no connection keeps its look instead of falling back to your system's fonts, and opening it never reaches out to a font server.",
      "**Numbers you can read at a glance.** Your stats and the Health, Sanity, Luck and Çredits readouts use a clean digital face now. An 8 no longer passes for a 0."
    ]
  },
  {
    "version": "0.26.0",
    "date": "2026-09-24",
    "intro": [],
    "items": [
      "**Inscribed spells are in the book.** Traps, wards, gear inscriptions, Everlight, Hearthstone, Second Wind, Consecration and the three Wardings join the Book of Known Spells. You can know one and keep it in your Grimoire like any other spell.",
      "**A spell says what it's made with.** One that can only be inscribed reads \"Enchantment only · 4 hours\" (or Alchemy, in days), and its TH is that Discipline's. Mastering it is priced from that TH too.",
      "**Filter the book by Discipline.** Evocation, Enchantment or Alchemy, next to tier and Domain in the spell picker.",
      "**Starting spells are ones you can cast.** A spell that can only be inscribed says so and waits until after creation.",
      "**Every inscribed object in the shop shows its spell.** The Grave-iron blade and Ferryman's coin read as the book now has them.",
      "**Sixteen new spells in the Book of Known Spells**, from Glasswalk, Borrowed Tongue and Mend among the Cantrips up to Borrowed Time. Blink, Tracer, Sure Hand, Doorway, Invisicloak and Consecrate are among them.",
      "**Every spell says how long it lasts.** Duration sits beside Range and Target when you open a spell in your Grimoire.",
      "**Overflow says how much.** Lines that read \"increases by [X]\" now give the number: +½ SP damage, +2m, +1 round.",
      "**Some spells work differently now**, as the book prints them. Mind Nudge pushes a target along a course they're already on, or holds them back. Tremor, Frostbite, Glimmer and Facemask changed too. A spell you already know updates by itself."
    ]
  },
  {
    "version": "0.25.1",
    "date": "2026-09-24",
    "intro": [],
    "items": [
      "**Every Major Milestone shows all it does.** Hardcore Parkour, Cyber Psion and Can't See Me each have rules past their first line (Hardcore Parkour's fall damage and Dodge bonus, for one) that the Progression tab never showed. They're under the benefit now.",
      "**\"No Milestone unlocked\" says when the next one is**: \"next at 15 MP\", counted from where you are, not the whole list of thresholds.",
      "A Werewolf's starting SFR reads **WILL × 3 + 5** on the Archetype step, not `WILL*3 + 5`."
    ]
  },
  {
    "version": "0.25.0",
    "date": "2026-09-24",
    "intro": [
      "Game data **0.18**. A character file from 0.24 opens as it was."
    ],
    "items": [
      "**A Mercenary chooses a fifth Focused Skill**, one Combat Skill of your choice, on the Archetype step. A Mercenary you've already locked gets the choice on Loadout & Powers, beside their Focused Skills, and it undoes like anything else.",
      "**Focused Skills can start higher.** At creation, a Professional's Focused Skills go past the Campaign Power Level's Max Skill Rank by the Focused Skill Max Bonus: +1 at Street Level, up to +4 at World Coming Down. The Skills step shows both caps.",
      "**Jack of All Trades raises every skill at the Focused price**, 3 × its current rank, for every rank up to 4. From rank 5 on it's the standard price. Whether Master of None also lifts every skill's starting cap isn't settled yet. For now it doesn't, and the Subtype card says so.",
      "**A Cleaner's two Combat Skill picks can't land on a skill the Cleaner already has**, like Combat Sense, so every Cleaner ends up with six Focused Skills.",
      "Each Subtype card lists its Focused Skills by name, and says what it asks you to choose."
    ]
  },
  {
    "version": "0.24.1",
    "date": "2026-09-24",
    "intro": [
      "Character schema **0.12**. A character file from 0.24.0 opens as it was, and its number carries over."
    ],
    "items": [
      "**Your character's number is now their TAG**, the Trusted Authentication Gateway NYTE City issues every resident. It sits under your name as `TAG-` and the same twelve characters it had before, with the same barcode, so every file you've already exported is still the same character."
    ]
  },
  {
    "version": "0.24.0",
    "date": "2026-09-24",
    "intro": [
      "Character schema **0.11** · game data **0.17**. A character file from 0.23 opens as it was, and gets its intake number the first time it's opened."
    ],
    "items": [
      "**Every character has a NYTE City intake number.** It sits under your name on the sheet, on the printed sheet and on the last step before you lock, with its barcode, so two characters called Vex are never mixed up. A character keeps its number for good, in every file you export.",
      "**Nothing replaces your saved character without asking.** This browser keeps one sheet and one draft. Importing a file, starting a new character, or locking one now asks first if that would replace a different character, or a newer copy of the same one, and offers to export the saved one before it goes.",
      "**Main names your specialization.** The line under your name reads, for example, *Werewolf · Trueborn · Heroic*.",
      "**Hardcore Parkour can be taken.** One of its prerequisites named an Advantage that's no longer in the game, so the Milestone stayed locked for everyone. It now asks for one Major Milestone, Acrobatics at rank 4 or better, and Danger Sense.",
      "**A Trueborn sees their Lunar Phase Blessing.** The Werewolf's starting power, and what each phase of the moon grants, is on the Archetype tab and on the Trueborn's card when you make one. The powers that come later are listed too, marked as not written yet.",
      "**Mastering a spell no longer looks like tampering.** An Arcanist who had mastered a spell was told their file might have been edited by hand. It wasn't, and the app no longer says so.",
      "**What the app finds when it opens a file stays until you dismiss it.** If a character holds something the game no longer has, the note sits at the top of every page, in the wizard too, instead of vanishing on your next click.",
      "**Character files are safer to share.** A file made to cause trouble can no longer put anything on your screen but text, whether you open it, edit it in Admin mode, or undo."
    ]
  },
  {
    "version": "0.23.0",
    "date": "2026-09-24",
    "intro": [],
    "items": [
      "**See what's new.** Every update's notes are in the app. Open **What's new** from the home screen, the ⋮ menu on your sheet, or the version in the footer. When the app has updated since your last visit, the home screen tells you, and the new releases open first."
    ]
  },
  {
    "version": "0.22.0",
    "date": "2026-09-24",
    "intro": [
      "Character schema **0.10** · game data **0.16** · ruleset CRB v4 (in progress). A character file from 0.21 opens as it was: its weapons start with no mods and a full magazine, and its typed gear rows stay typed."
    ],
    "items": [
      "**Change your vitals where you see them.** Tap HP, Pain, SAN, LUCK or Çredits, on the bar above any tab or on Main's cards, and a small panel opens with the same buttons Trackers has. Hurt, Heal, Take a hit, add a Condition, spend LUCK, earn or spend Çredits, all without leaving the tab, and all undoable.",
      "**A hit lands.** When you take damage, your HP and the Health Level boxes that took it flash, and Pain pulses twice if its level went up. Nothing flashes with reduced motion on.",
      "**Shop with the numbers in front of you.** Weapons, armor and gear each have a catalog to browse: search, filter by section, show only what you can afford, sort by price, and see a weapon's attack and damage for *your* character before you add or buy it.",
      "**Mods and magazines.** Install mods into a weapon's slots (a Scope on a rifle, a Silencer, an Angel Mod), and see what they add. Count your rounds down with Single, Burst and Full Auto buttons, and Reload, on Loadout and on Main.",
      "**Gear you carry is counted.** Gear's Equipment chapter and the Magic chapter's shop are in the catalog: chems and kits stack with a count and **Use one**, Talismans keep their charges and show the spell they hold. A Nanomed Kit, a dose of Speed Heal or a Field Repair Kit you carry comes off your gear when you use it.",
      "**Main is ready for a fight.** Its Combat column starts with the weapons you carry and the armor you're wearing, then the combat skills."
    ]
  },
  {
    "version": "0.21.0",
    "date": "2026-09-24",
    "intro": [
      "Character schema **0.9** · game data **0.15** · ruleset CRB v4 (in progress)."
    ],
    "items": [
      "**A Cascade is your GM's to call.** When TOL goes below zero, the sheet tells you to roll a d10, add your Rupture's degree and tell your GM the total. Then it opens a list of every Aberration for you to record the one they name. You no longer enter the dice.",
      "**Read what you might have caught.** Every Aberration in the picker shows its full text, in Good, Neutral and Bad, with a search. One you already have is dimmed. **+ Add an Aberration** on Trackers uses the same picker.",
      "**The magic text matches the finished Magic chapter.** Force's Domain description, how Overflow reads past 2x, Dominate Mind's text, and two Aberrations (Animal Ken reads MAG, and Beacon works like Monster Magnet).",
      "**The AP tag on a spell is explained.** Iron Lance's AP now reads Armor Piercing: it skips RES, and PROT still rolls."
    ]
  },
  {
    "version": "0.20.0",
    "date": "2026-09-23",
    "intro": [
      "Character schema **0.9** · game data **0.15** · ruleset CRB v4 (in progress)."
    ],
    "items": [
      "**Take a hit opens in its own window.** Your HP and Health Levels sit at the top, the page behind waits, and Apply stays greyed out with the reason beside it until the hit is ready: the PROT die, the Shock Check, the check at zero. Esc or Cancel drops it.",
      "**The spell book picks on a click anywhere in the row.** A spell you can't take is dimmed and says why, the search stays at the top while you scroll, and **Done** closes the book. Every pick is still saved as you make it.",
      "**Skills show where the bonus comes from.** Each skill shows its two stats as icons with your numbers, like \"REF 5 · COOL +1 syn\", in the wizard and on the sheet. The synergy is dimmed until the skill is trained.",
      "**Trackers uses the whole screen.** On a wide screen it's two columns: Damage, Armor, Pain and Conditions on the left, Sanity, LUCK, archetype trackers and Çredits on the right. Health Levels sit in the Damage card, grouped by the Pain Level each one puts you at, with yours lit.",
      "**The spell book opens in the middle of the screen**, not pinned to the top-left.",
      "**Jump around the long pages.** Loadout has a row of buttons that jump to each section, your archetype's included. The Character Points step has one that stays at the top as you scroll, with a filter over Advantages and Disadvantages (anything you've taken stays in view) and the CP you have left.",
      "**Quick Study can be taken.** Its prerequisite now asks for the Intuition skill at Rank 1, as the rulebook does. It asked for an Intuition advantage, which doesn't exist, so no one could take it."
    ]
  },
  {
    "version": "0.19.1",
    "date": "2026-09-23",
    "intro": [
      "Character schema **0.9** · game data **0.14** · ruleset CRB v4 (in progress)."
    ],
    "items": [
      "**Martial Arts no longer scrambles the Skills step.** Training it used to squeeze the style picker into a narrow column and push every skill below it out of line. The picker now spans the row, and the skills after it stay in place."
    ]
  },
  {
    "version": "0.19.0",
    "date": "2026-09-23",
    "intro": [
      "Character schema **0.9** · game data **0.14** · ruleset CRB v4 (in progress)."
    ],
    "items": [
      "**Choose your starting spells in the wizard.** An Arcanist enters the TOL + 1d4 (up to 4d4) roll on the Character Points step and picks that many spells from the book. They land in the Grimoire, Known, when you lock.",
      "**Evocation sets how far you can reach at creation.** A spell's TH can't be higher than your Evocation rank. Buy a rank on the same step and the next tier opens right there. Un-buy it and the step tells you which spell needs it; nothing is dropped behind your back.",
      "**After creation, learn anything.** A spell whose TH is past your Evocation dice is marked **Beyond your pool**: it can still be cast, but only an exploding 10 gets there. Mastery counts.",
      "**The spell picker opens as its own window**, on the sheet and in the wizard. Search and filter, see each spell's numbers before you take it, and keep picking without it closing. Esc or a click outside closes it. Undo still works while it's open."
    ]
  },
  {
    "version": "0.18.0",
    "date": "2026-09-23",
    "intro": [
      "Character schema **0.9** · game data **0.13** · ruleset CRB v4 (in progress)."
    ],
    "items": [
      "**Record it.** After a Cascade, one button writes it into Notes and puts the Aberration on your sheet. One Undo takes back both.",
      "**Aberrations on the Trackers tab.** Permanent ones are cards with a note and Remove; temporary ones are chips you Clear when they wear off. Add one by hand from the catalog when the GM rules it. You can't hold the same Aberration twice.",
      "**Drained** takes 2 off your maximum TOL, down to 0, and leaves your current TOL where it was. Clearing it gives the 2 back to the maximum, and you rest the rest back.",
      "**Phantom Pain** puts you at Pain Level 1 even at full health. The Pain line says what's adding to it.",
      "**Spell Attack** (Evocation + REF + WILL, the scores themselves) sits beside Spell Power in the Grimoire.",
      "**A Magic reference** on the Archetype tab: the Spellcraft roll and its five outcomes, spell tiers, the Cascade Table, the Aberration Table and every Aberration. Permanent Aberrations also show there.",
      "**Three Unique Aberrations follow the current rulebook:** Aethereal Link hears animals, Thaumaturgical Sight's +2 is for analyzing magic, and Resonant Whispers reads talismans and artifacts."
    ]
  },
  {
    "version": "0.17.0",
    "date": "2026-09-23",
    "intro": [
      "Character schema **0.9** · game data **0.12** · ruleset CRB v4 (in progress)."
    ],
    "items": [
      "**The Grimoire reads the book.** Add spells from the Book of Known Spells with a picker that shows each spell's TN, TH, range and effect before you add it. Search by name, Glyph or effect, and filter by tier or Domain. A book spell shows its full entry: flavor, target, defending, Overflow and tags.",
      "**Spell Power** (Evocation + WILL) sits at the top of the Grimoire.",
      "**Master a spell** for 30 IP × its TH. It goes in the IP journal, and the spell's TH drops by 1. A Mastered TH 1 spell needs no roll.",
      "**Spells you typed in yourself** are kept exactly as you wrote them. If one's name matches a book spell, **Link to the book** swaps in the book's numbers and keeps your notes. Improvised and house spells stay free-typed.",
      "The Arcanist's text no longer points you at a \"Magic section\" that isn't there."
    ]
  },
  {
    "version": "0.16.0",
    "date": "2026-09-23",
    "intro": [
      "Character schema **0.8** · game data **0.11** · ruleset CRB v4 (in progress)."
    ],
    "items": [
      "**Cascades.** An Arcanist now tracks TOL spent. At TOL it says you're Exhausted. Past TOL, a Cascade panel takes your d10 and the Rupture's degree and reads the Cascade Table. If you land on an Aberration, it takes the second die too and lists that category's Aberrations for your GM to pick from. **Add to notes** writes the result into Notes.",
      "**Undo right where you clicked.** Every change on the sheet shows a short toast naming what happened, with an Undo that takes back that action and nothing newer.",
      "**Conditions are one click.** Adding a Condition is a palette of chips. A Condition you already have is greyed out, and a body-part one asks where. On Main, clicking an active Condition's chip shows its effect and recovery.",
      "The damage stepper says **Heal 5 / Heal 1 / Hurt 1 / Hurt 5**. It used to show `+5`, which made the HP headline go *down*.",
      "Light mode: the violet buttons (Take a hit, Continue, Open sheet, Buy…) had near-black text on violet, which was hard to read. It's white now, and a build check covers every filled control in both themes."
    ]
  },
  {
    "version": "0.15.0",
    "date": "2026-09-23",
    "intro": [
      "Character schema **0.8** · game data **0.10**."
    ],
    "items": [
      "**TOL is 1 + INT + BOD + COOL** (as the rulebook now has it; it was INT/COOL/EMP). Every character's TOL can move, and the Arcanist's most of all.",
      "**Natural Armor** (Thick Skin, Shake it Off, Iron Shirt, a Trueborn's waning moon) is one number. Take a hit applies it, and the print sheet's Nat column fills. Conditional sources ask whether they're on.",
      "**Nanomed Kit** on Trackers: clears Agonized, Bleeding, Paralyzed and Poisoned, stabilizes the Dying, and proposes the HP it regenerates by dose."
    ]
  },
  {
    "version": "0.14.1",
    "date": "2026-09-22",
    "intro": [],
    "items": [
      "The built file (the demo site, and the file players get) rendered blank on screen from v0.13.0. It works again. Opening `index.html` from the folder was never affected."
    ]
  },
  {
    "version": "0.14.0",
    "date": "2026-09-22",
    "intro": [
      "Game data **0.9**."
    ],
    "items": [
      "**Loadout picks from the catalog.** Add or Buy (paid from Çredits) any weapon or armor piece. Weapon lines show the attack total and resolve `BOD+X` to a number. Wear one body piece, and add upgrades by slot and quality.",
      "**Recovery on Trackers:** Rest (BOD per day), Focused Healing (the only way back for Massive-lost Health Levels and Injured), Field Repair, the after-fight wear roll, and **Turn Reset**, which ticks Bleeding and lists each Condition's recovery check.",
      "The print sheet shows your armor and its Integrity."
    ]
  },
  {
    "version": "0.13.0",
    "date": "2026-09-22",
    "intro": [
      "Character schema **0.8** · game data **0.8**. Also carries 0.11.0 and 0.12.0."
    ],
    "items": [
      "**Take a hit.** Enter the damage, type and your PROT roll. The worn armor answers (PROT, RES, AP, Compromised), and the sheet asks for the Shock Check or the check at zero when one is due. It adds what follows (Unconscious, Prone, Dying) and undoes as one action. Massive damage strips Integrity and removes Health Levels outright.",
      "**Conditions** (the rulebook's table, plus Dying): add them on Main or Trackers. Agonized raises Pain, the flat penalties reach every Skill Check total, the helpless ones show a banner, and Dying counts Death Marks.",
      "Design-team rulings: a new skill after creation costs 25 IP, stats past 10 follow the designers' curve, and Condition penalties stack to −8.",
      "**The print sheet is redesigned** (0.11.0): a case-file front page, Health Levels in Pain Level bands, and Skills in two panels. Printing a blank sheet no longer comes out empty, and Notes no longer clip."
    ]
  },
  {
    "version": "0.10.1",
    "date": "2026-09-21",
    "intro": [
      "Character schema **0.7** · game data **0.7**. Also carries 0.10.0."
    ],
    "items": [
      "**Light theme** (0.10.0): a toggle in the header, remembered per browser.",
      "**The catalog arrives**: 54 weapons, 9 ammo types, 11 arrowheads, 37 armor pieces. **Magic's shared half** arrives too: 96 Known spells across five Domains, and the Spellcraft rules.",
      "The Arcanist's Rupture works as the CRB says: it spends TOL by its degree. Exhausted is what you are at 0 TOL, not a second pool. The old Exhaustion tracker is gone."
    ]
  }
];
