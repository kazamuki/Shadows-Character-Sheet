# A TAG that scans

**Status:** drafted 2026-11-26 by Claude (Opus) at Ken's request; the order below is **approved (all defaults)**. Nothing is built. **Source:** Ken, 2026-11-26, after asking whether the TAG's barcode was real (it wasn't: Decision 128 made it decoration on purpose) and seeing a Code 128 prototype beside today's bars.

## 1. Goal

The barcode under a character's name becomes a real one. A phone pointed at it reads the TAG. On the dark theme the bars are light-on-dark, which no real scanner reads, so a small button beside the barcode, shown only when the pointer is over it, flips it to black bars on a white patch and back. Little touches like this are what make NYTE City feel lived in (Ken).

## 2. What's settled

- **Code 128, subset B, of the TAG's twelve characters.** The prototype (`tmp-barcode-proto/`, untracked, deleted when the order is built) fed every payload to a real decoder (`@zxing/library`): dark-on-white decoded in every case, light-on-dark in none. The prototype's table also compared a URL payload, which doubles the width.
- **Dark theme only gets the button.** The light theme's bars are already dark on light.
- **Nothing is saved.** The flip is view state. No schema, no save-file field.

## 3. Sessions

| Id | Order | What it builds | Status |
|---|---|---|---|
| **Z1** | [`tag-that-scans/Z1-a-tag-that-scans.md`](tag-that-scans/Z1-a-tag-that-scans.md) | `Engine.tagBars`, the real barcode on the sheet, the Review step and the print header, and the flip button | approved, ready to build |

One session. Nothing in it waits on Deighton, Scott or the book.

## 4. Not in this plan

- **A QR code.** Rejected in the order's decision: it's square and doesn't sit in the header's line.
- **A URL in the barcode.** A site and the TAG together is about twice the width; ZQ1 in the order keeps it as the alternative. No page on either site takes a TAG yet.
- **Scanning from paper.** The print header's bars become Code 128 at the size they have now. Whether a phone reads them off a printed page is not promised (ZQ7).

## 5. Questions for Ken

Z1's questions, `ZQ1`–`ZQ8`, are in the order's §4, each with a default.
