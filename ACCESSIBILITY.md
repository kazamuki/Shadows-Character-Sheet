# Accessibility

The Shadows character sheet is for everyone at the table: on a phone beside the
dice, on a laptop, with a keyboard, with a screen reader, with motion turned
down. If something in the app gets in your way, we want to hear about it, and
we treat it as a bug.

## Our goal

We aim for **[WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA**, in both the
dark and the light theme. In practice that means:

- **Readable contrast.** Text has a contrast ratio of at least 4.5:1 against
  its background. The light theme swaps the brand's neon colours for darker
  ones, because the neons are too faint on a pale background.
- **Everything works from the keyboard.** Every control can be reached with
  Tab and used with Enter or Space, and has a visible focus outline. When a
  press redraws part of the page, focus comes back to the same control, or to
  the card it was in. It never drops back to the top of the page.
- **Works with screen readers.** Controls have names, a pressed or expanded
  state is announced, and the structure uses headings and labels, not only
  layout.
- **Reduced motion is respected.** If your device asks for less motion, every
  animation and moving transition is switched off, including the damage
  flash.
- **Sized for a finger.** Controls are at least 24 pixels across, and at least
  44 on a touch phone. Text is never smaller than 11 pixels. Nothing scrolls
  sideways at phone width.
- **Works offline.** The app makes no network requests, so a slow or missing
  connection never blocks it.

## How we check

These checks run automatically on every change:

- **Contrast:** every filled control is checked for readable text in both
  themes.
- **Reduced motion:** every animation and moving transition is checked for a
  reduced-motion off switch.
- **Keyboard:** the interface tests press controls from the keyboard and check
  where focus lands.
- **Sizes and overflow:** `npm run phone-check` measures control sizes, text
  sizes and sideways scrolling in a real browser at phone and tablet widths.

## Known limitations

- **No assistive-technology testing yet.** We haven't yet tested the app with
  screen-reader users or other assistive-technology users. Our checks catch
  rule breaks, not every barrier, so your reports matter.
- **The automated checks don't cover everything.** The contrast check covers
  filled controls, not every line of text. No automated tool scans whole pages.
- **The printed sheet is made for paper.** For a screen reader or
  magnification, use the sheet in the browser. It has the same character and
  the same numbers.
- **The GM mode is still being built** and is switched off in the released
  app. It will be checked against the same goal before it's switched on.

## Where it runs

The app runs in a current web browser, on desktop, tablet or phone. It works
from the live site, [charactersheet.shadowsrpg.com](https://charactersheet.shadowsrpg.com),
or from a downloaded folder with no internet connection. We test in Chromium,
and we expect current Chrome, Edge, Firefox and Safari to work. If one
doesn't, tell us.

## Reporting a barrier

Open an issue with the
[**Accessibility barrier** template](https://github.com/kazamuki/Shadows-Character-Sheet/issues/new?template=accessibility.md).
Tell us what you were trying to do, what got in the way, and what you use: a
screen reader, magnification, keyboard only, voice control, or something else.
You don't need to know which guideline it breaks.

If you'd rather not post in public, email Ken at kazamuki+github@gmail.com.

A barrier that stops you using the app is fixed ahead of other bugs. We'll
reply on the issue, and if a fix will take a while, we'll suggest a way around
it in the meantime.

## For contributors

The rules above apply to every change that touches the interface. For a UI
change:

- Run `npm run verify` (it runs the contrast, reduced-motion and keyboard
  checks) and `npm run phone-check`.
- Use the change from the keyboard alone, in the dev preview
  (`node tools/devserver.mjs`), in both themes.
- Give every new control a name a screen reader can read, and keep focus where
  it was when a press redraws the page. `keepPlace` in `src/ui/shared.js` does
  this.
- Use the colour tokens in `src/styles/shadows.css`, not raw hex colours, so
  the light theme's darker colours apply.
- Say what you checked in the pull request's **Evidence** section.

The design floor is in [`PRODUCT.md`](PRODUCT.md) (*Accessibility & Inclusion*)
and the visual rules in [`DESIGN.md`](DESIGN.md).
