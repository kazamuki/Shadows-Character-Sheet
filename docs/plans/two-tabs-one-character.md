# Plan — Two tabs on one character (W38)

**Status:** proposed 2026-09-25, not started. Ken asked for the proposal as a
plan to pick up later. Nothing here is a decision until the session that
builds it numbers it in `SCHEMA.md` §4. Its open questions are `TQ`_n_ (§5).
**Covers:** `WISHLIST.md` W38, and Decision 141's **Revisit if** ("a player
loses play to two tabs on one character").
**Sources:** `src/ui/shared.js` (the roster: `saveChar`, `lastSaved`,
`writeEntry`, `markExported`), Decisions 128, 141 and 124.
**Tier:** *Rule or shape*. No save-file shape moves, but what the app does
when two tabs disagree is a player-facing behaviour someone could have
chosen otherwise.

---

## 1. The problem, as a player meets it

Open Mara in two tabs (a laptop at the table, and the tab left open from
last week). Take 12 damage and spend 2 LUCK in tab A. Glance at tab B, which
still shows the morning's Mara, and tick a Condition. Tab B saves *its*
whole character over tab A's entry. The damage and the LUCK are gone, and
nothing on either screen says so. Undo can't help: tab B's audit trail never
had tab A's actions in it.

It's older than the roster (the single-slot app had it too), but a list of
characters makes several open tabs more likely, and playtesting is when
someone will first hit it.

## 2. What it costs today

- Every save writes the whole character (`writeEntry`), so the last writer
  wins outright. Nothing merges.
- `saveChar` already keeps `lastSaved = { id, json, changed, exported }`, and
  `changed` only ever moves forward (Decision 141). So a tab can already
  tell "the entry moved since I last wrote it" by comparing the stored
  `changed` with its own. The data needed to detect this exists; nobody reads it.

## 3. The proposal

**One rule: a tab that isn't holding the newest copy stops saving and says so.**

1. **Detect, two ways.**
   - **Before every save:** `saveChar` reads the stored entry's `changed`.
     If it's newer than `lastSaved.changed` and the stored character
     differs from `lastSaved.json`, this tab is stale. This check is the
     guarantee: it works even if no event ever arrives (a background tab
     the browser has throttled, or `file://` in a browser that doesn't fire
     storage events there).
   - **Early warning:** a `storage` event listener for the open character's
     key marks the tab stale the moment the other tab writes, so the player
     sees it *before* touching anything. The event never fires in the tab
     that wrote, which is exactly the behaviour wanted.
2. **When stale, don't write.** The save is skipped, so the newer copy
   survives. The action the player just took stays on this screen and isn't
   lost silently either: see 3.
3. **Say so, on the page, until resolved.** A banner above every page, the
   same place a refused save already shows (`importIssuesHtml`), in tool
   voice: *"This character changed in another tab. Nothing here is being
   saved."* with two buttons:
   - **Load the newer copy** (default): reads the entry, runs `migrate()`,
     re-renders. Anything done in this tab since it went stale is dropped;
     the banner says how many actions that is, from this tab's audit trail.
   - **Keep this tab's copy**: writes this tab's character over the other,
     after `askFirst()` ("The other tab's changes will be lost. Export them
     first?" with Export, reusing the replace guard's pattern from
     Decision 128).
4. **What doesn't count as a change.** `markExported` rewrites the entry to
   move `exported` only; that must not mark other tabs stale (compare
   `changed`, never the raw string). **Remove** from another tab
   (`newValue === null`) shows its own line: *"This character was removed
   in another tab."*, with Save it again or Go home.
5. **Home too.** Home lists the roster from storage when it renders. A
   `storage` event while Home is open re-renders the list, so a character
   created or removed elsewhere shows up without a reload. Cheap, and the
   same listener.

**What it respects:** the app works without storage, so every read is
guarded as today, and with no storage there's no second copy to disagree
with. The engine isn't touched (constraint 5). Nothing new is written into
the character (constraint 7): staleness is page state, like `saveFailed`.

## 4. Alternatives weighed

- **Merge the two tabs' changes.** The audit trail is per tab, and two
  patches to the same array (`set` fallbacks, C8) don't compose. A merge
  that is right most of the time and silently wrong sometimes is worse than
  a clear stop. **Rejected.**
- **Lock the character to the first tab that opens it** (a heartbeat key).
  It needs timers and stale-lock recovery when a tab crashes, and it blocks
  the harmless case (reading the sheet in a second tab). **Rejected.**
- **`BroadcastChannel` instead of `storage` events.** No better here: the
  entry in storage is the truth, and the save-time check covers any missed
  message. **Not needed.**
- **Just warn, keep saving.** The last write still wins, so the warning
  arrives after the loss. **Rejected.**

## 5. Open questions for Ken

- **TQ1:** Is **Load the newer copy** the right default, or should the
  banner offer the two buttons with no default? (Recommendation: newer copy.
  The other tab is usually the one being played in.)
- **TQ2:** Should the wizard (a draft) get the same guard? A draft in two
  tabs is rarer and cheaper to lose. (Recommendation: yes, since it's the
  same code path in `saveChar`, so leaving drafts out would be extra code.)
- **TQ3:** Worth a line in the What's new entry telling players not to play
  one character in two tabs? (Recommendation: no. The banner explains it
  when it happens.)

## 6. One session, in this order

1. Save-time check in `saveChar` and the `stale` page state; the banner with
   both buttons. Smoke tests in jsdom: two `boot()`s sharing one storage,
   tab B's write refused after tab A's, tab A's play intact, both buttons.
2. The `storage` listener (early warning, Remove, Home re-render). jsdom can
   dispatch a `StorageEvent` by hand; a real-Chromium check with two pages
   in one context confirms the browser fires it.
3. Mutation-test: drop the save-time check (the event alone must not be the
   guarantee), then drop the `changed` comparison in favour of a raw-string
   one (an export in tab A must not stale tab B).
4. Decision N, INDEX line, app patch (a visible fix) and a CHANGELOG line;
   W38 struck through, pointing here.

**Versions:** app patch. Game data and character schema unchanged.
