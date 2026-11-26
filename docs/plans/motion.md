# Plan — Motion

**Status:** **approved 2026-11-24** (Ken: "These are all awesome. They add
some flair and impact", after the Motion Lab page; then, on I1's order, "I
agree with the defaults for all the questions", with IQ1–IQ6 left blank, so
Default). Nothing here is a decision
until the session that builds it numbers it in `SCHEMA.md` §4. Its sessions
are `I`_n_ (I for impact) and its questions `IQ`_n_ (§5). Its orders are in
`plans/motion/`.
**Covers:** W62 (a file reads in, I4). It sets aside W124, W129, W134 and
W128, which each want one of this plan's beats once their own rules are built
(§4).
**Sources:** the Motion Lab page (an artifact, Ken's), `DESIGN.md` (*Readouts*,
*Do's and Don'ts*: motion short and state-driven, nothing under reduced
motion, no neon on a resting surface), `src/ui/shared.js` (`commit`,
`landedFrom`, `landedCls`, `update`, `refreshPopover`), `src/ui/app.js`
(`renderMain`'s take-once of `S.landed` and `S.issued`), `src/ui/sheet.js`
(the readouts), `src/ui/gm.js` (the encounter row, clocks, the close-out),
`src/styles/shadows.css` (the `landed`, `struck` and `tagPrint` keyframes and
the reduced-motion block), `tests/build.test.mjs` (W43's reduced-motion guard).
Decisions 117 (a hit flashes), 163 (the lock prints the TAG), 164
(`keepPlace`), 270 (the Tonight strip), 315 (spend an amount).
**Tier:** *Rule or shape*, every session: each is a player-facing behaviour
someone could have chosen otherwise.

---

## 1. The problem, as a player meets it

The sheet already has two beats, and both work: a hit flashes what it changed
(117) and a lock prints the TAG (163). Everything else changes silently.

- **A number jumps.** Spend 2 Luck and the 6 becomes a 4. You see where you
  landed but not what it cost, and on a phone between turns you often can't
  tell whether the tap took.
- **The end of a night has no end.** Log session adds a line to History. The
  fifth Milestone Point, the moment a Minor Milestone opens, looks exactly
  like the fourth. The tenth, a Major, looks like the ninth.
- **A GM looks up and has lost the turn.** Next turn moves the cyan edge with
  no motion, so a GM whose eyes were on their notes has to read the list
  again to see who's up.
- **Opening a file is a toast.** W62 wanted it to feel like slotting a script
  into a deck.

**What this plan is not.** It isn't decoration. Every beat answers something
the player or GM just did and plays once. Nothing loops, nothing waits, and
reduced motion gets the end state.

## 2. The shape

**The rules every beat keeps** (the Motion Lab's, and `DESIGN.md`'s):
1. **It answers something you did.** A commit, a turn, a load. Nothing moves
   on its own, and nothing moves on undo.
2. **It plays once.** The render that follows the action takes the beat and
   clears it, as `landedNow` does (117). A tab switch or a later render
   doesn't replay it. A nudge gets three beats at most.
3. **It's short.** Most beats .15–.35s; a hit and the lock under a second;
   only a Major Milestone gets about 1.3s, and a tap skips it.
4. **It never makes you wait.** Clicks land mid-beat. The number is right in
   the HTML from the first frame: a count rewinds it and counts forward, and
   if the browser never draws a frame, the right number is what shows.
5. **Reduced motion gets the end state.** CSS (W43's guard covers every new
   rule) and a `calm()` check in JS for anything a script moves.
6. **Signal, never decoration.** Magenta for harm, gold for anything spent or
   earned, green for health, cyan for a plain value. No glitch, no glitter.

**One kit, in `shared.js`** (I1): the take-once hook beside `landedFrom`,
`calm()`, a number count, the floating change, a restartable class, and the
register line and stamp that I2–I4 reuse. Later wishes (§4) get their beat
from it instead of inventing one.

## 3. Sessions

| Session | What a player or GM gets | Tier · app | Waits on |
|---|---|---|---|
| **I1 — What it changed** · order drafted 2026-11-24: [`I1-what-it-changed.md`](motion/I1-what-it-changed.md), approved 2026-11-24 (Ken: IQ7–IQ10 Default) | The kit. On the sheet, every tracker readout counts to its new value and the change floats off the one you touched: HP, Sanity, Luck, SFR, a named pool, Çredits. A hit fills its Health Levels left to right; a meter's lost part lingers for a beat; a heal gets one quiet green line. Undo stays still | *Rule or shape* · minor | **Built** (Decision 316, app 0.77.0, PR #394) |
| **I2 — The night's end** · order drafted 2026-11-25: [`I2-the-nights-end.md`](motion/I2-the-nights-end.md), approved 2026-11-25 (Ken: IQ11 (d), IQ12–IQ17 Default) | Log session reads the night into the register: under its button, the night's line prints and its IP and MP take a gold stamp, the Milestone track draws its new point, and History's new row drops in. At a Minor Milestone (5, 15, 25 MP) a small gold burst and its plate; at a Major (10, 20, 30 MP) every point lights in turn, a bigger burst, and the Major plate prints in, both ending on **Choose**. A Milestone taken settles into the list. Lock & Export rings three times when the wizard's last step is done | *Rule or shape* · minor | **Built** (Decision 317, app 0.78.0, PR (this one)) |
| **I3 — Across the table** | GM mode: Next turn slides the cyan edge to the row acting now, and a new round takes a stamp. A clock's + draws its segment in, and *Full* takes the TAG's stamp. A row that goes down fades back instead of snapping, *Down* takes a stamp and Tonight's chip slides in. Writing a close-out turns the draft lines into register lines one seat at a time, a seat that crosses a Major gets a small burst, and the session takes its *Written* stamp | *Rule or shape* · minor | I2 merged (the register line and burst are I2's) |
| **I4 — A file reads in** (W62) | Opening a character, a table or a pack reads the file's real contents onto the screen for about a second: the name, the archetype and TAG (or the table's or pack's own lines), the counts, what was repaired. Any tap or key finishes it; a second load of the same file in a sitting gives the summary only; a refused file drops the fiction and says what to do | *Rule or shape* · minor, and the lines are `appCopy` with a voice pass | I1 merged |

**Why this order.** I1 builds the kit on the behaviour with the most tests
already (117's), so the take-once hook is proven before anything leans on it.
I2 is the moment Ken asked for and the biggest beat, and it needs the count
and float. I3 is GM mode's, on the same kit. I4 is the most copy and the least
code, so it can go any time after I1.

**What each order's pre-flight must check** (beyond `WORK-ORDERS.md`'s list):
- **Every twin.** A number drawn in five places (the pill, the drawer's row,
  Main's card, the Trackers block, the popover) counts in all of them, and the
  float goes on one. Grep the readers; never list them from memory.
- **Every redraw path.** `renderMain`, `renderVitals`, `renderDrawer`,
  `refreshPopover`, and GM mode's `renderTable` and `paintTonight`. A beat
  taken in one and played after another is the easy bug.
- **The frame trap.** A browser pane that isn't drawing never fires
  `requestAnimationFrame` (log, 2026-11). A count that rewinds the number
  before its first frame shows the wrong number there.
- **I2:** where Progress draws the Milestone count and the owed-pick prompt
  (Decision 273's dialog), and that **Choose** opens the same chooser it does
  today. W129's payday would sit on this beat later; I2 builds no money.
- **I3:** every path that moves the acting row (Next turn, a pick, a key),
  and that the close-out's Written state survives a re-render without
  replaying.
- **I4:** the gate's real output for each file kind (`migrate()`,
  `migrateTable()`, `migratePack()`), so each line is read from what loaded.

## 4. Out of the plan

- **Tabs slide, content settles** (the Motion Lab's tab card). Navigation is
  the most-used thing in the app, and even 160ms there reads as lag (IQ2).
- **The light sweep and any loop.** The sweep leans SaaS; three beats does the
  nudge in the sheet's own language. The Admin banner's dot, the one loop the
  app has, stops in I2 (IQ3).
- **Print.** Paper has no motion.
- **Wishes that want a beat once their rules exist,** each set aside here:
  - **W129** (Wealthy pays out at each Milestone) and **W124** (Poverty's debt
    paid down at each Milestone): the money would arrive on I2's Milestone
    beat with the count and float. Both wait on Deighton's rules.
  - **W134** (Sanity Loss and Recovery): a Sanity band crossed would get the
    double beat a Pain Level gets (117). It waits on the book.
  - **W128** (the sheet knows when an encounter ends): an "encounter over"
    moment would take the register stamp. How an encounter ends on a
    player's sheet is its own design first.

## 5. Questions for Ken

Each has a default; one left blank is answered "Default". **All six are
Default** (Ken left them blank when he approved I1, 2026-11-24).

- **IQ1 — The set and its order.** I1 to I4 as §3 says. *Default: yes.*
- **IQ2 — Tab settle.** Leave it out (§4). *Default: out.*
- **IQ3 — Loops.** None, and the Admin banner's dot stops pulsing (it holds
  still, gold) in I2. *Default: yes.* **Built in I2.**
- **IQ4 — The Major Milestone's 1.3 seconds.** The one beat past a second,
  skippable by any tap or key. *Default: yes.*
- **IQ5 — Bursts in GM mode.** Only a seat crossing a Major gets one; a Minor
  gets its gold chip. The big moment belongs on the player's own sheet.
  *Default: yes.*
- **IQ6 — A heal moves.** Decision 117 says healing never flashes. I1 gives a
  heal one quiet green line (.35s) and the count; undo still moves nothing.
  This supersedes 117 in part. *Default: yes.*
