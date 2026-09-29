# Product

<!-- impeccable:product-schema 1 -->

Product truth for design work (Impeccable). It is not a rules or architecture
authority: for that, `CLAUDE.md` → `docs/STATE.md` → `docs/SCHEMA.md` win, and
this file points at them rather than restating them.

## Platform

web

## Users

**Players, live at the table, are the primary users.** Their main job is play:
mid-scene, often on a phone, they take a hit, drop a Pain Level, spend Luck,
lose Sanity, reload, and need the right number without breaking the scene.
Making a character in the eight-step wizard is a one-time job that comes first
but carries less weight.

**GMs are secondary.** They hand a player the folder or the single HTML file,
and they read the `.shadows.json` files players bring to the table.

The people behind it: Deighton (lead designer, all rules authority), Scott (GM
toolkit, magic, the print sheet's look), Ken (writes the CRB and builds the app).

## Product Purpose

A character creator and live play sheet for **Shadows**, the cyberpunk-noir
urban fantasy RPG on the **Synergy** system from Get Dangerous Games. You build
a character in an eight-step wizard, lock it, and the app becomes a nine-tab
running sheet: damage and Pain Levels, Conditions, Sanity, Luck, Çredits, IP and
Milestones, magic, loadout, a session log, an undoable audit trail, and a
printable sheet, filled in or blank.

It works when a player at the table can trust what the sheet says and change it
without leaving the scene.

## Positioning

All four together; a fillable PDF or a generic VTT sheet can't claim any of them:

- **It knows the rules.** The engine works out every derived value from the
  CRB and reproduces the CRB's own worked examples. The sheet can't get out of
  date or get the math wrong.
- **It works anywhere, from one file.** It needs no install, no account and no
  network. It runs offline from `file://`, fonts included. A GM hands over a
  folder or one HTML file.
- **It remembers everything.** The session log and audit trail make every change
  accountable and undoable.
- **It is NYTE City.** It is Shadows' own product, in the game's voice and
  brand. It also partly sells the game: the live demo is at
  charactersheet.shadowsrpg.com.

## Operating Context

- **At the table:** a phone or laptop beside dice and the book, glanced at
  between turns, sometimes in dim light. Each change is a quick tap. The
  surrounding scene matters more than the app.
- **Creation:** one sitting, often with the GM, sometimes with the CRB open.
  The player chooses an archetype, stats, skills, advantages and gear under the
  creation-pool rules.
- **Files:** the character is a `.shadows.json` file the player keeps, shares
  and brings to the table. Every file is treated as untrusted input.
- **Print:** a landscape printable sheet, filled in or blank. The front page is
  full, so anything more on it pushes onto a second page.
- **Home:** a roster of characters, one per TAG.

## Capabilities and Constraints

These are stated fully in `CLAUDE.md` (*Hard constraints*). The ones that
limit design work:

- The app runs from `file://` with no server and no build step. It makes no
  network request, so fonts, icons and images must be embedded.
- `index.html` stays a shell: no inline styles or logic. Styles live in
  `src/styles/` (`shadows.css` for screen, `print.css`, generated `fonts.css`).
- Adding content (a stat, skill, advantage, archetype, panel) takes no app
  change. The UI renders whatever the data holds, so no archetype is named in UI
  code.
- Store inputs, compute everything else. The UI shows derived values and never
  writes them.
- The app never narrates its own build state. A rules question the designers
  haven't settled is shown to the player as a `playerNote`, not guessed at in
  code.
- Dark and light themes both exist, and a contrast guard checks both.
- Phone layout is a tested concern (`npm run phone-check`). The header is two
  thin rows and the tabs scroll sideways.
- **Open:** the print sheet's visual system (Scott's look, not yet approved);
  whether Cerulean Nights can be embedded (PQ1); Scott's artwork (PQ2); a
  known print/PDF frame-texture defect. See `docs/STATE.md` §3.

## Brand Commitments

- **Voice:** `docs/VOICE-APP.md` (adopted, and enforced by
  `tests/voice.test.mjs`), derived from
  `docs/reference/GUIDE_Shadows_Voice.md`. The app speaks as NYTE City. When the
  player is stuck it switches to tool voice: clear, short and out of the way.
  Player-facing copy lives in the data (`appCopy`, `playerNote`).
- **Name:** *Shadows*, on the *Synergy* system, © Get Dangerous Games.
- **Brand colours** are named in `src/styles/shadows.css`: Midnight Underpass,
  Deep Circuit, Aether Pulse, Neon Veil, Static Cyan, Ghostly Green, Signal Gold,
  Neutral Zone, Gutter Black. Brand stat icons are in `src/data/shadows-icons.js`.
- **Fonts:** Cerulean Nights is the brand display face but is not embedded yet
  (PQ1). Chakra Petch, Inter, Oxanium and Roboto Mono are embedded under OFL.

## Evidence on Hand

- The CRB mirror is in `docs/reference/crb/`. It is read-only here.
- The app's own content is in `src/data/shadows-data.js`, and its release notes
  in `CHANGELOG.md`.
- The live demo is at charactersheet.shadowsrpg.com.
- **Absent. Never make these up:** testimonials, player counts, reviews,
  partner or press claims, pricing, and a licence (licensing is deliberately
  unset until the company is formed).

## Product Principles

1. **Put the table first.** Design for the moment mid-scene: the change a
   player makes most often should be the fastest one to make.
2. **Trust through the engine.** A number on screen is always computed and
   always explainable. Any rule the sheet names is a hover or tap away.
3. **Nothing is lost.** Every change is logged and can be undone. Committing
   (locking, spending, taking a hit) should feel deliberate and be reversible
   wherever the rules allow.
4. **Portable is part of the design.** A design idea that needs a server, a
   network request or a build step is out.
5. **The world speaks unless you're stuck.** Leave room for NYTE City
   everywhere except where a player needs a clear way out.

## Accessibility & Inclusion

**WCAG 2.2 AA** is the floor, in both themes: contrast, full keyboard use,
screen reader semantics, and reduced motion (already respected: the damage
flash doesn't play under it). Touch targets must work on a phone at the table.
