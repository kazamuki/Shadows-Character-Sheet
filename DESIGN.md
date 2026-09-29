---
name: Shadows Character Sheet
description: A night-shift readout for a Shadows character — midnight ground, cold exact numbers, neon only when something changes.
colors:
  midnight-underpass: "#0D1731"
  underpass-panel: "#111E3D"
  raised-panel: "#16264C"
  deep-circuit: "#203F7B"
  aether-pulse: "#712B8C"
  aether-pulse-lit: "#9B4DBA"
  neon-veil: "#BC489A"
  static-cyan: "#1BBBC4"
  ghostly-green: "#71C388"
  signal-gold: "#F2C94C"
  neutral-zone: "#E7E7E7"
  overcast-steel: "#8C97B5"
  gutter-black: "#111111"
  on-accent: "#FFFFFF"
  light-ground: "#F5F4F2"
  light-panel: "#FFFFFF"
  light-raised-panel: "#EDEBE7"
  light-text: "#111111"
  light-dim: "#5B6472"
typography:
  display:
    fontFamily: "Cerulean Nights, Chakra Petch, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 700
    letterSpacing: "0.1em"
  headline:
    fontFamily: "Cerulean Nights, Chakra Petch, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  title:
    fontFamily: "Cerulean Nights, Chakra Petch, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Roboto Mono, ui-monospace, monospace"
    fontSize: "0.7rem"
    fontWeight: 500
    letterSpacing: "0.12em"
  readout:
    fontFamily: "Oxanium, Roboto Mono, ui-monospace, monospace"
    fontSize: "1.9rem"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tnum"
rounded:
  hairline: "2px"
  xs: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "30px"
components:
  button:
    backgroundColor: "{colors.raised-panel}"
    textColor: "{colors.neutral-zone}"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  button-hover:
    backgroundColor: "{colors.raised-panel}"
    textColor: "{colors.neutral-zone}"
  button-primary:
    backgroundColor: "{colors.aether-pulse}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  button-primary-hover:
    backgroundColor: "{colors.aether-pulse-lit}"
    textColor: "{colors.on-accent}"
  button-go:
    backgroundColor: "{colors.static-cyan}"
    textColor: "{colors.gutter-black}"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  button-sm:
    backgroundColor: "{colors.raised-panel}"
    textColor: "{colors.neutral-zone}"
    rounded: "{rounded.sm}"
    padding: "5px 12px"
  input:
    backgroundColor: "{colors.midnight-underpass}"
    textColor: "{colors.neutral-zone}"
    rounded: "{rounded.sm}"
    padding: "9px 11px"
  card:
    backgroundColor: "{colors.underpass-panel}"
    textColor: "{colors.neutral-zone}"
    rounded: "{rounded.md}"
    padding: "16px 18px"
  readout-card:
    backgroundColor: "{colors.underpass-panel}"
    textColor: "{colors.neutral-zone}"
    typography: "{typography.readout}"
    rounded: "{rounded.lg}"
    padding: "13px 15px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.overcast-steel}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "2px 7px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.overcast-steel}"
    padding: "9px 14px 10px"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-zone}"
  stepper:
    backgroundColor: "{colors.raised-panel}"
    textColor: "{colors.neutral-zone}"
    rounded: "{rounded.sm}"
    height: "30px"
  tip:
    backgroundColor: "{colors.raised-panel}"
    textColor: "{colors.neutral-zone}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  modal:
    backgroundColor: "{colors.underpass-panel}"
    textColor: "{colors.neutral-zone}"
    rounded: "{rounded.md}"
    width: "min(920px, calc(100vw - 32px))"
---

# Design System: Shadows Character Sheet

This records the **screen** system in `src/styles/shadows.css`. The printed sheet
(`print.css`) is a separate system on purpose — white paper, black ink, Aether
Pulse the only accent — and its restyle has its own plan
(`docs/plans/print-sheet-scotts-look.md`). Product truth is in `PRODUCT.md`.
Where this file and the stylesheet disagree, the stylesheet is what ships;
fix whichever is wrong.

## Overview

**Creative North Star: "The Night-Shift Readout"**

A monitor glowing at three in the morning. The ground is Midnight Underpass;
panels sit on it one shade lighter, framed by a single Deep Circuit line. The
numbers are what you came for, and they read cold and exact — Static Cyan for a
value, Ghostly Green for health, Signal Gold for what you can spend. When
something goes wrong, Neon Veil magenta says so, and when a hit lands it flashes
once. The rest of the time the screen is quiet.

It is an instrument, not a poster. Density and legibility win over atmosphere,
because the sheet is read mid-scene on a phone between turns. Atmosphere lives in
precise details: letter-spaced mono labels, a violet haze behind the header, the
display face on a character's name, the magenta hatching on a Health Level that
Massive damage took away. Neon is signal — state, damage, focus, selection —
never decoration.

It is **not** generic cyberpunk (no glitch, scanlines, chromatic aberration or
terminal green), **not** a fantasy parchment sheet (no scrolls, textures or
ornament, magic or not), and **not** a SaaS dashboard (no big soft cards,
pastel gradients or friendly illustration). Shadows is noir and urban fantasy.

**Key Characteristics:**
- Dark midnight-navy ground; depth by tone, one 1px frame line per surface.
- Engineered at rest, colour only in response: hover, selection, state, damage.
- Four type voices, each with one job: display for names, Inter for prose, mono for labels and ids, Oxanium for big numbers.
- Small, consistent radii (3–8px); nothing pill-soft except the jump chips.
- Colour carries fixed meaning: cyan value/focus, green health/done, gold spend/caution, magenta harm/error, violet the brand's hand.
- A light theme exists and folds the neons onto the two brand constants rather than inventing new colours.

## Colors

A cold navy night with five neons, each of which means exactly one thing.

### Primary
- **Aether Pulse** (#712B8C): the brand's hand. Primary buttons, the on-state of a form toggle, text selection, the Take-a-hit panel's frame, the violet haze in the header. Fixed across both themes.
- **Aether Pulse, lit** (#9B4DBA): the hover of anything violet, section labels (`.sect`, group summaries), stat and tab icons at rest, the accent edge on toasts and modals, the Spell Power readout.

### Secondary
- **Static Cyan** (#1BBBC4): a value and where you are. Numeric readouts in text, the active tab underline and wizard step, a selected card's ring, the focus outline on every control, tip and What's-new accent edges, the Go button's fill.

### Tertiary
- **Neon Veil** (#BC489A): harm and error. Damage fill on Health Levels, Pain bands, Conditions, negative modifiers, validation errors, over-budget costs, the landed-hit flash. Also the eyebrow above a step title — its one non-harm use.

### Semantic
- **Ghostly Green** (#71C388): health and done. HP, a completed wizard step, positive modifiers, a picked advantage, final status, granted (free) costs, the locked banner.
- **Signal Gold** (#F2C94C): what you spend and what to watch. Luck, Çredits, costs, CP remaining, warnings, flags (`⚑`), admin mode, draft status, dice.

### Neutral
- **Midnight Underpass** (#0D1731): the ground, and the fill of inputs (they sit *into* the page, below the panel).
- **Underpass Panel** (#111E3D): cards, picks, readout cards, the modal.
- **Raised Panel** (#16264C): buttons, stepper keys, tips, toasts — the surface a finger presses.
- **Deep Circuit** (#203F7B): every frame line, divider and table rule; the scrollbar; stepper hover fill. Fixed across both themes.
- **Neutral Zone** (#E7E7E7): primary text.
- **Overcast Steel** (#8C97B5): secondary text, labels, units, inactive tabs, descriptions.
- **Gutter Black** (#111111): text on the bright cyan Go button only.
- **On-accent** (#FFFFFF): text on a violet or Deep Circuit fill, both themes.

Light theme: **Pale Concrete** ground (#F5F4F2), white panels, a warm raised panel (#EDEBE7), Gutter Black text, a slate dim (#5B6472).

### Named Rules
**The Signal-Not-Decor Rule.** A neon appears only when it means something: a value, a state, a warning, harm, focus. If you can't name what the colour is telling the player, it's Overcast Steel.

**The One Meaning Rule.** Each neon has one job and keeps it on every screen. Magenta never marks something good; green never marks something spent. A new readout takes the colour of what it *is* (a pool of Luck is gold wherever it appears).

**The Fold Rule.** In the light theme, cyan and green fold onto Deep Circuit and gold and magenta fold onto Aether Pulse, because the neons fail contrast on a pale ground. Never hard-code a neon hex; use the token so the fold happens.

## Typography

**Display Font:** Cerulean Nights (with Chakra Petch, embedded, as the working face)
**Body Font:** Inter (with system-ui)
**Label/Mono Font:** Roboto Mono (with ui-monospace)
**Readout Font:** Oxanium (with Roboto Mono)

**Character:** A squared, technical display face for names and titles against a neutral humanist body, with mono as the voice of the system itself — labels, ids, dice, costs — and Oxanium for the numbers a player glances at mid-scene. Cerulean Nights is the brand face but isn't embedded yet; everything renders in Chakra Petch until it is.

### Hierarchy
- **Display** (700, 2.2rem, letter-spaced .1em, uppercase on the brand mark): the home hero and the header's `Shadows //` brand. Nowhere else.
- **Headline** (600, 1.7rem, .04em): a wizard step's title.
- **Title** (600, .95–1.2rem, .04–.06em): card, review-block, hit-panel and modal headings; the character's name in the vitals rail.
- **Body** (400, 15px, 1.55): prose, descriptions, notes. Step notes cap at 62ch, lore at 72ch, reference text at 80ch. Secondary text steps down to .8–.86rem.
- **Label** (500, .58–.74rem, .12–.2em, uppercase): field labels, section rules, table heads, chips, badges, the eyebrow, the vitals keys.
- **Readout** (600, 1.5–1.9rem, tabular figures): stat scores and the Condition cards' big numbers. Inline numbers in text use Roboto Mono at body size instead.

### Named Rules
**The Four Voices Rule.** Display names things, Inter explains them, mono labels and counts them, Oxanium shows the number you came for. Don't cross them: no Inter labels in capitals, no display face in a paragraph, no big numbers in Inter.

**The Mono Caps Rule.** Every label that names a field or a section is Roboto Mono, uppercase, letter-spaced at least .12em, in Overcast Steel (Aether Pulse, lit for section rules). It's the system's handwriting.

## Layout

**Creation** is a three-column frame: the intake ledger on the left (218px), the step in the middle (capped at 920px), the vitals rail on the right (248px, sticky under the header). **The live sheet** drops both rails and runs one full-width column; the tabs move into the header's second row and a horizontal vitals bar of pills leads each tab. The Main tab is a two-column console (stats beside combat, roughly 0.85 : 1.15), stats clustered into four groups carried by spacing, not labels.

The header is always two thin rows (brand with the menu and theme button, then tabs scrolling sideways with an edge fade). It's sticky, except on a screen shorter than 540px.

Breakpoints, as the stylesheet has them:
- **≤1060px** — everything becomes one column; the ledger becomes a sideways-scrolling step strip, the vitals rail moves above the step; two- and three-column form grids stack; main padding drops to 16px sides.
- **≥1000px** — Trackers split into two columns.
- **≤900px** — the Main console stacks.
- **≤640px** — the modal goes full-screen; catalog tables become cards (name on top, labelled numbers wrapping, actions last).
- **≤540px** — stat groups go two across.
- **≤480px** — the brand drops its `Shadows //` prefix so the name gets the room.

Spacing isn't tokenized in CSS; the rhythm in use is 4 / 8 / 12 / 18 / 30px — 8–12px between sibling controls, 12–18px inside a card, 24px above a section rule, 30px before the wizard's nav. Density is deliberately high: a sheet, not a landing page.

## Elevation & Depth

Flat and tonal. Depth is Midnight Underpass → Underpass Panel → Raised Panel, each edged with one 1px Deep Circuit line. Inputs go the other way, filled with the ground so they read as sunk into the panel. Shadows exist only on things that float above the page, and glows only as a response to state.

### Shadow Vocabulary
- **Floating note** (`box-shadow: 0 6px 24px rgba(5,10,22,.45)`): tips and the undo toast.
- **Dialog** (`box-shadow: 0 12px 48px rgba(5,10,22,.6)`, over a `rgba(5,10,22,.62)` backdrop): the modal.
- **Drawer** (`box-shadow: -18px 0 44px rgba(0,0,0,.45)`): the side drawer.
- **Selected ring** (`box-shadow: 0 0 0 1px var(--cyan), 0 0 18px rgba(27,187,196,.12)`): a chosen card.
- **Landed** (`0 0 0 2px var(--magenta), 0 0 18px var(--magenta)`, fading over .7s): a hit landing on what it changed.

### Named Rules
**The Tonal Floor Rule.** Surfaces at rest are flat. A shadow means the thing floats (tip, toast, modal, drawer); a glow means the thing just changed state (selected, hit, pulse). Nothing gets a shadow for looking important.

## Shapes

Hard-edged with slightly softened corners. Radius scales with the size of the thing: 2–3px on meter segments, chips and badges; 4px on buttons, inputs, steppers, toggles and tips; 6px on cards and the modal; 8px on the larger readout surfaces (Condition cards, stat groups, the roster, the hit panel). The only round shapes are the jump chips (14px), pips and status dots (50%). On a phone the modal loses its corners and goes edge to edge.

Every surface is outlined by one 1px line, never a fill change alone. A floating message carries a **3px accent edge** on one side: cyan on the left of a tip or What's-new note, violet on the left of a toast, violet on the top of the modal. Damage has its own marks: filled Health Levels are washed magenta, and ones Massive damage removed are dashed and hatched at 135° so they never read as ordinary damage.

### Named Rules
**The One-Line Frame Rule.** A surface is a tonal step plus one 1px Deep Circuit line. State recolours the line (cyan selected or worn, green picked, magenta danger, violet on hover); it doesn't thicken it, except on the Pain bands, where weight *is* the meaning.

## Components

### Buttons
Engineered at rest, lit on touch.
- **Shape:** gently squared (4px).
- **Default:** Raised Panel fill, one Deep Circuit line, Neutral Zone text, 600 weight, 10px × 22px.
- **Primary:** Aether Pulse fill and line with on-accent text; hover lifts to Aether Pulse, lit.
- **Go:** Static Cyan fill with Gutter Black text — the moment of commitment (Lock & Export, Log session, New character).
- **Small:** 5px × 12px, 500 weight, for row actions. A dashed small button means an action with nothing to spend (reloading from empty).
- **Hover / Focus:** the line turns Aether Pulse, lit; focus is a 2px Static Cyan outline offset 1px, on every control. Disabled drops to 45% opacity.

### Chips and badges
- **Style:** mono caps (.62–.64rem, .08–.12em), 3px radius, a 1px line and text in the same colour, no fill. The colour is the meaning: gold, magenta (pain), green (ok), cyan.
- **Condition chips:** a panel fill with a magenta line; a bad one takes a faint magenta wash. The palette of Conditions to add opens under a `+` summary.
- **Tags:** plain words with a dotted underline that turn cyan on hover, focus or tap and read out a tip. A tag the glossary doesn't know is a plain word with no underline.

### Cards / Containers
- **Corner Style:** 6px (cards, picks, review blocks), 8px (readout surfaces).
- **Background:** Underpass Panel.
- **Shadow Strategy:** none; see Elevation.
- **Border:** one 1px Deep Circuit line; Aether Pulse, lit on hover when the card is a button; a cyan ring when selected; green when a pick is taken.
- **Internal Padding:** 12–18px.

### Inputs / Fields
- **Style:** filled with the ground (sunk), 1px Deep Circuit line, 4px radius, 9px × 11px. Numbers and dates in mono. The label above is a Mono Caps label.
- **Focus:** a 2px Static Cyan outline, offset 1px.
- **Error:** the field stays; the issue list below it speaks in magenta (errors) or gold (warnings).

### Steppers and toggles
- **Stepper:** a framed 4px strip of two 30px Raised Panel keys around a mono value; a key lights Deep Circuit with on-accent text on hover, and fades to 30% at its limit.
- **Form toggle:** joined segments in one frame; the on segment fills Aether Pulse.

### Navigation
- **Tabs:** icon plus label, .85rem at 500, Overcast Steel with Aether Pulse, lit icons. Active is Neutral Zone text, a cyan icon and a 2px cyan underline. One scrolling row, edges fading where there's more; the active tab is kept in view.
- **Intake ledger:** numbered mono steps; done is green, needs attention is gold, active is cyan with a 2px cyan left edge and a faint cyan wash. At ≤1060px it becomes a sideways strip with a bottom edge instead.

### Readouts (signature)
The Night-Shift Readout itself: the numbers a player comes back for.
- **Condition cards:** a mono caps label, a big Oxanium number in the colour of what it is (green HP, cyan Sanity, gold Luck and Çredits, violet SFR), a 5px meter beneath, a faint icon in the corner at 16% opacity. In danger the line, number and meter all turn magenta.
- **Vitals pills and rows:** the same meanings, smaller — a mono caps key over a mono value. A pill that opens something takes a cyan line when hovered or open.
- **Health Level track:** 46 × 34px boxes grouped into Pain bands; the band you're in is lit and marked `▸`; deeper bands carry heavier magenta lines; damage fills magenta from the left.
- **Stat cells:** icon, mono id, Oxanium score, a green or magenta modifier.
- **Hit landing:** one magenta flash (.7s, ease-out) on what the hit changed, twice on Pain readouts when the Pain Level rose. Never on heal or undo, never under reduced motion.

### Tips, toasts and the modal
- **Tip:** Raised Panel, 4px, a 3px cyan left edge, the floating shadow, a mono caps title in cyan, a gold note line when a rule is flagged. It opens on hover, focus or tap, and stays put when pinned.
- **Undo toast:** bottom-centre, a 3px violet left edge, one line with an Undo action; slides up 8px over .18s.
- **Modal:** a native dialog; Underpass Panel, a 3px violet top edge, the head and foot fixed, only the body scrolls; rises 8px over .16s. Full-screen at ≤640px.

## Do's and Don'ts

### Do:
- **Do** use the tokens (`--cyan`, `--magenta`, …), never the hex, so the light theme's fold happens.
- **Do** give every new number the colour of what it is — gold for anything spent, green for health, cyan for a plain value, magenta only for harm.
- **Do** label fields and sections in Mono Caps: Roboto Mono, uppercase, .12em or more, Overcast Steel.
- **Do** frame every surface with one 1px Deep Circuit line and change the line's colour for state.
- **Do** keep motion short (.15–.35s, ease-out) and state-driven, and turn every animation off under `prefers-reduced-motion`.
- **Do** focus every control with the 2px Static Cyan outline.
- **Do** keep text on a violet or Deep Circuit fill `--on-accent` (white) in both themes.

### Don't:
- **Don't** use neon as decoration: no glowing headers, gradient text, neon borders on resting surfaces, or colour that means nothing.
- **Don't** reach for generic cyberpunk: glitch, scanlines, chromatic aberration, terminal green, Matrix rain.
- **Don't** reach for fantasy parchment: scrolls, paper texture, ornament, blackletter — not even on the Magic tab.
- **Don't** drift toward a SaaS dashboard: big rounded cards, soft pastel gradients, friendly illustration, radii past 8px.
- **Don't** put a shadow on a surface at rest; shadows are for things that float.
- **Don't** use Neon Veil for anything good, or Ghostly Green for anything spent.
- **Don't** set big numbers in Inter or prose in the display face.
- **Don't** use a raw neon as text in the light theme; it fails contrast. The fold exists for this.
