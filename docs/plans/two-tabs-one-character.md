# Plan — Characters you can trust: two tabs, old files, a copy (W38, W147, W122)

**Status:** proposed 2026-09-25 for W38 alone; **widened 2026-11-27** by Claude (Opus, the conductor) at Ken's
request ("Widen it"), to W147 and W122, and to tables, which save the same way and didn't exist in September.
**Approved by Ken 2026-11-27**, in the conductor session, every question on its default: TQ4 "Tables too", TQ5 "TAG
from its created date", TQ6 "Exact copy, draft later" (the draft copy is W181), TQ1–TQ3 and TQ7 "All four defaults". Nothing here is a decision until the session that builds it numbers it in `SCHEMA.md` §4. Its questions
are `TQ`_n_ (§5), its sessions `T`_n_ (§6). **The path keeps its old name** so W38's and INDEX's links still land.
**Covers:** `WISHLIST.md` W38, W147 and W122, and Decision 141's **Revisit if** ("a player loses play to two tabs on
one character").
**Sources, re-read at `main` `4b5a145` (2026-11-27):** `src/ui/shared.js` (the roster: `saveChar`, `lastSaved`,
`writeEntry`, `markExported`, `removeChar`, `rosterEntries`, `guardReplace`, `supersedes`), `src/ui/gm.js` (the
table's twins: `saveTable`, `lastTableSaved`, `markTableExported`, `removeTable`; packs at ~3527), `engine.js`
`newCharacter()` and `migrate()` (~6174, the TAG backfill). Decisions 128, 133, 141, 171, 181, 124.
**Tier of this document:** *Docs*. Each session names its own tier; all three are *Rule or shape*.

**Why these three together.** Each is a way a player's character stops being the one they think it is: overwritten
by another tab (W38), doubled by an old file (W147), or impossible to branch without starting over (W122). All three
live in the roster's code on Home and in `migrate()`'s TAG rule, and none waits on a ruling or the book.

---

## 1. The problems, as a player meets them

**Two tabs (W38).** Open Mara in two tabs (a laptop at the table, and the tab left open from last week). Take 12
damage and spend 2 LUCK in tab A. Glance at tab B, which still shows the morning's Mara, and tick a Condition. Tab B
saves *its* whole character over tab A's entry. The damage and the LUCK are gone, and nothing on either screen says
so. Undo can't help: tab B's audit trail never had tab A's actions in it. **A GM meets the same thing with a table**:
`saveTable` is `saveChar`'s twin (one key, the whole table, last writer wins), and a table holds a year of sessions.

**An old file (W147).** A file saved before 0.24.0 (2026-09-24) has no `meta.id`, so `migrate()` mints a fresh
random TAG on every load. Import it twice and Home shows two Maras. The older-copy guard can't help: the two never
share a TAG. Four of the five local test characters were like this, and playtesters' early exports are too.

**No copy (W122).** Home offers Open, Export and Remove. A second Werewolf, or "Mara, if she'd taken Hacking",
starts from nothing.

## 2. What it costs today, and what already exists

- Every save writes the whole entry, so the last writer wins outright. Nothing merges.
- `saveChar` keeps `lastSaved = { id, json, changed, exported }`, and `changed` only ever moves forward (Decision
  141). So a tab can already tell "the entry moved since I last wrote it" by comparing the stored `changed` with its
  own. `saveTable` keeps `lastTableSaved` the same way (Decision 171: "by the roster's rules"). The data needed to
  detect a stale tab exists for both; nobody reads it.
- **Packs** (Decision 181) are written once, on import (`gm.js` ~3527), and never autosaved, so two tabs can't
  overwrite a pack's play. Only a Remove in another tab affects one.
- `migrate()` line ~6174: `if (!isIntakeId(c.meta.id)) c.meta.id = newIntakeId();`. **Every** character file the
  app has ever written carries `meta.created` (it's in `newCharacter()` since the first commit, 2026-08-02), to the
  millisecond.
- Decision 128 **rejected** matching characters by name ("two players can share one and a rename would lose the
  match"). Any answer to W147 has to get round that, not re-raise it.

## 3. The proposal

### 3a. Two tabs (W38), for characters and tables

**One rule: a tab that isn't holding the newest copy stops saving and says so.**

1. **Detect, two ways.**
   - **Before every save:** `saveChar` (and `saveTable`) reads the stored entry's `changed`. If it's newer than
     `lastSaved.changed` and the stored character differs from `lastSaved.json`, this tab is stale. **This check is
     the guarantee:** it works even if no event ever arrives (a background tab the browser throttled, or `file://`
     in a browser that doesn't fire storage events there).
   - **Early warning:** a `storage` event listener for the open entry's key marks the tab stale the moment the other
     tab writes, so the player sees it *before* touching anything. The event never fires in the tab that wrote, which
     is the behaviour wanted.
2. **When stale, don't write.** The save is skipped, so the newer copy survives.
3. **Say so, on the page, until resolved.** A banner above every page, where a refused save already shows
   (`importIssuesHtml`), in tool voice: *"This character changed in another tab. Nothing here is being saved."* (a
   table: *"This table changed in another tab…"*), with two buttons:
   - **Load the newer copy** (TQ1's default): reads the entry, runs `migrate()` (or `migrateTable()`), re-renders.
     Anything done here since it went stale is dropped; the banner says how many actions, from this tab's audit trail.
   - **Keep this tab's copy:** writes over the other, after `askFirst()` (*"The other tab's changes will be lost.
     Export them first?"* with Export), reusing the replace guard's pattern (Decision 128).
4. **What doesn't count as a change.** `markExported` rewrites the entry to move `exported` only; that must not stale
   other tabs (compare `changed`, never the raw string). **Remove** in another tab (`newValue === null`) shows its own
   line: *"This character was removed in another tab."*, with **Save it again** or **Go home**.
5. **Home too.** A `storage` event while Home is open re-renders its lists (characters, tables, packs), so one made
   or removed elsewhere shows without a reload. Same listener.
6. **One helper, two callers.** The check, the stale state and the banner are written once in `shared.js` and called
   by `saveChar` and `saveTable` (`shared` loads before `gm`). A second copy in `gm.js` is the thing to avoid.

**Respects:** every storage read stays guarded; with no storage there's no second copy to disagree with. The engine
isn't touched (constraint 5). Staleness is page state, like `saveFailed`, never written into the character or the
table (constraint 7).

### 3b. An old file keeps one TAG (W147)

**`migrate()` gives an id-less character a TAG derived from its `meta.created`, not a random one.** The same old
file then always comes out as the same TAG, so a second import is an update of the first (the existing older-copy
rule, Decision 141), and two different characters differ in `created` by at least a millisecond.

- The derived TAG uses the TAG's own alphabet and shape (`TAG-XXXX-XXXX-XXXX`, Crockford base-32), from a fixed hash
  of the `created` string. It's an ordinary TAG from then on: exported, it carries that id.
- **No name in it.** That's what clears Decision 128's rejection: a rename can't break the match, and two players'
  Maras made at different moments never collide.
- A file with no valid `created` either (hostile or hand-made) still gets a random TAG, as today. `migrate()` stays
  total (constraints 8, 10).
- **What it doesn't fix:** a copy already imported twice keeps its two random TAGs. Home shows both; the player
  removes one. (TQ5 asks whether that's enough.)

### 3c. Make a copy (W122)

**Home's character row gains Copy.** The copy is a new character: a new TAG (Decision 128: a TAG is issued once),
a new `created`, and its own entry. TQ6 decides what it starts as; the default is an exact copy of the character as
it is now, named "<name> (copy)", with **an empty audit trail** (undo in the copy mustn't walk back into the
original's history, Decision 124) and its own `changed`, unexported. Copy opens the new character, so the player
sees which one they're in. A table seat that names the original's TAG keeps naming the original (254).

## 4. Alternatives weighed

**For two tabs:**
- **Merge the two tabs' changes.** The audit trail is per tab, and two patches to the same array (`set` fallbacks,
  C8) don't compose. A merge that is right most of the time and silently wrong sometimes is worse than a clear stop.
  **Rejected.**
- **Lock the character to the first tab that opens it** (a heartbeat key). It needs timers and stale-lock recovery
  when a tab crashes, and it blocks the harmless case (reading the sheet in a second tab). **Rejected.**
- **`BroadcastChannel` instead of `storage` events.** No better: the entry in storage is the truth, and the save-time
  check covers any missed message. **Not needed.**
- **Just warn, keep saving.** The last write still wins, so the warning arrives after the loss. **Rejected.**
- **Characters only, tables later.** The same code twice, the second copy written when a GM loses a session.
  **Rejected** unless Ken says otherwise (TQ4).

**For an old file:**
- **Match by name and `created`, and ask** (W147's own sketch). It asks a question the data can answer, and it's
  Decision 128's rejected name-match with a prompt on top. **Rejected** in favour of 3b.
- **Leave it.** Only pre-0.24 files are affected. But they're exactly the playtesters' files, and the fix is a few
  lines in `migrate()`. **Rejected.**

**For a copy:**
- **A draft copy** that re-opens the wizard from the original's creation choices. It's the better tool for "Mara with
  Hacking", but the sheet doesn't keep a creation snapshot apart from play, so building one is its own design. **Not
  now**: W181 (TQ6 (b)).

## 5. Open questions for Ken

| Id | Question | Default |
|---|---|---|
| **TQ1** | **The stale banner's default button.** (a) **Load the newer copy** is the primary button. (b) Two buttons, neither primary | **(a).** The other tab is usually the one being played in |
| **TQ2** | **Does a draft (the wizard) get the same guard?** | **Yes.** It's the same `saveChar` path; leaving drafts out would be extra code |
| **TQ3** | **A What's new line telling players not to play one character in two tabs?** | **No.** The banner explains it when it happens; the changelog line says the app now catches it |
| **TQ4** | **Tables too?** (a) The same guard on a GM's table, in the same session. (b) Characters only | **(a).** `saveTable` is `saveChar`'s twin, and a table holds a year of sessions. One helper serves both |
| **TQ5** | **An id-less old file.** (a) `migrate()` derives its TAG from `meta.created` (3b): re-imports merge, nothing to ask. (b) Ask on import when a name and `created` match. (c) Leave it | **(a).** It needs no question and no name, so Decision 128's reason holds. Copies already doubled stay doubled; Remove clears one |
| **TQ6** | **What Copy makes.** (a) An exact copy as it is now: locked if the original is, its play kept, audit trail empty, named "<name> (copy)". (b) (a), and a draft copy from the creation choices as a later wish. (c) Only a draft copy | **(b).** (a) is buildable today and total; a draft copy needs a creation snapshot the sheet doesn't keep, so it's a W of its own |
| **TQ7** | **Copy on a table?** A GM duplicating a table (a campaign's second group) | **No, not here.** A table's sessions and cast belong to one group; it's a GM wish if asked |

## 6. Sessions

Three work orders, one at a time, in this order: the data-loss fix first.

| Session | What | Tier | Waits on |
|---|---|---|---|
| **T1** | **Two tabs** (3a): the save-time check and the stale state in one `shared.js` helper; the banner and its two buttons; the `storage` listener (early warning, Remove, Home re-render); `saveChar` and, per TQ4, `saveTable` | Rule or shape (no save-file shape moves); app minor | TQ1–TQ4 |
| **T2** | **An old file keeps one TAG** (3b): `migrate()`'s derived TAG; Decision 133's "anything else invalid gets a fresh TAG" changes for an id-less file with a `created` | Rule or shape (no schema bump: the shape doesn't move, the backfill rule does); app patch | TQ5 |
| **T3** | **Make a copy** (3c): Copy on Home's row, the new TAG and `created`, the empty audit trail, the open | Rule or shape; app minor | TQ6, TQ7 |

**T1's test shape** (carried from the first draft): smoke tests in jsdom with two `boot()`s sharing one storage —
tab B's write refused after tab A's, tab A's play intact, both buttons; a hand-dispatched `StorageEvent`; a
real-Chromium check with two pages in one context to confirm the browser fires it. **Mutation-test:** drop the
save-time check (the event alone mustn't be the guarantee), and swap the `changed` comparison for a raw-string one
(an export in tab A mustn't stale tab B).
**T2's:** the same old file migrated twice gives one TAG; two files a millisecond apart give two; a file with no
`created` still gets a random one; `hostile.test.mjs` with a junk `created`.
**T3's:** the copy's TAG differs, its audit trail is empty, undo in it never touches the original, and Remove of one
leaves the other.

**Versions:** no game-data, character, table or pack schema move in any of the three.
