# Work order I2: The night's end

**Plan:** [`../motion.md`](../motion.md) §3, row I2; §4 (the Admin banner's dot, IQ3); §5 (IQ1–IQ6). **Source:** the Motion Lab page's *A session goes into the register*, *A Milestone arrives* and *A nudge, not a pulse* cards, which Ken approved with the plan (2026-11-24: "These are all awesome. They add some flair and impact").

**Built on:** Decision 316 (I1's kit: `beatsFrom`, `S.beats` taken once in `renderMain`, `playBeats` last in `update()`, `calm()`, `countHtml`, the float placed from its readout), 117 (a hit flashes), 163 (the lock prints the TAG: `S.issued`), 164 (`keepPlace`), 217 (any Minor repeats; five Minors ask by a chooser), 228 (IP from hours), 230 (a training lands on a Milestone Point), 266 (a session stops running powers), 281 (Progression's order: Log a session, IP, Milestones, History, Activity Log), 67 (the cadence is the data's).

**Status: drafted 2026-11-25** by Claude (Opus), I1's reviewer, at the conductor's request. **Not yet approved.** Ken answered IQ11 with option (d) (2026-11-25, through the conductor); IQ12–IQ17 (§4) wait on Ken; one left blank is answered "Default" (`WORK-ORDERS.md`, step 3). The plan's IQ1–IQ10 are Default (Ken, 2026-11-24: "I agree with the defaults for all the questions"), IQ3 and IQ4 most of all.

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **I2 build** (Sonnet), then a fresh **I2 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `shared.js` (I1's kit), `sheet.js` (Progression, the vitals pill and drawer), `wizard.js` (Lock & Export), `shadows.css`, `src/data/shadows-data.js` (`appCopy` only, no game-data bump), `tools/phone-check.mjs`, `DESIGN.md`, the tests and the docs. No engine or schema change.

**Pre-flight against `main` at `6615a1d`** (#394, I1, merged). Take the next free decision number on `origin/main` when it's written; the order says **N**. **The pre-flight found three places where the plan's picture isn't the app's:**
1. **There is no Milestone "Choose" today.** Decision 273's Choose is the owed *Focused Skill* pick (`data-fowedopen`, `openFocusedPicker`), not a Milestone. An owed Milestone shows only as "*n* to pick" in the Minor or Major group's summary, which opens itself (`sheet.js:1976, 2006`). So "both end on Choose" needs a Choose this order builds (IQ14), and it must not reuse 273's.
2. **There is no Milestone track.** MP is a number in five places (below). The Lab's ten-pip track with Minor and Major marks is new UI (IQ11).
3. **Log session scrolls to the page's top, and History is at its bottom.** `sheet.js:4459` calls `scrollPageTop()` after the commit. Progression's order is Log a session, IP, Milestones, History, Activity Log (281). So a beat on History's new row plays off-screen, and the Lab's layout (form, track, plate and register together) isn't the page's (IQ11).

```
commit()           shared.js:328-340. S.landed=landedFrom; S.beats=beatsFrom(before, ch); update(); the undo toast.
beatsFrom()        shared.js:393-404. null unless locked; counts {hp,san,luck,sfr,cred,pool:<id>} from beatReads(),
                   cells, healed. Wrapped in try: total. I2 adds keys to beatReads and three fields to the result.
Take-once          app.js:191: const beat=S.beats||null; S.beats=null; beatsNow = S.screen==="sheet" ? beat : null;
                   at the top of renderMain, on every screen. playBeats() is last in update() (shared.js:307).
playBeats()        shared.js:420-494. Counts every [data-count] twin, one float per key on [data-float] (the open
                   popover's first, else #main's), placed from the readout's text extent measured BEFORE the float
                   goes in (c6550ba). Cells, the meter tail. stopBeats() cancels the last run.
landedCls()        shared.js:360-362: render-time classes (struck, landed, painup, mended), read off landedNow/beatsNow.
Log session        sheet.js:4448-4460: dry run for the training it lands (230) and the powers it stops (266); one
                   commit("session", …, ()=>Engine.logSession(ch, entry)); then scrollPageTop().
Engine.logSession  engine.js:3981-3994: pushes the session, clears running powers, resets Luck spent, settles training.
milestoneState()   engine.js:3619-3645: mp, minorAvail/majorAvail (cadence from data: minorFirstAt 5, minorEvery 10,
                   majorFirstAt 10, majorEvery 10; plus Long-Lived's grants), minorLeft/majorLeft, nextMinorAt/nextMajorAt.
MP readers         sheet.js:366 (pill "MP"), 397 (drawer "Milestone Pts"), 1968 (Milestones' heading, a sentence),
                   1969 (Milestones' MP block .big), 2069 (History's heading, a sentence); wizard.js:92 (the rail's
                   drawer, unlocked). Print shows none.
IP readers         sheet.js:365 (pill), 396 (drawer row), 1932 (Progression's IP block .big), 1933 ("earned · spent",
                   a sentence), 2069 (History's heading); 2335 and the raise/IP-buy status lines (sentences, aria-live,
                   unchanged); 3292 (print); wizard.js:91.
Owed groups        sheet.js:1976 (Minor <details>, open when minorLeft>0, "— n to pick"), 2006 (Major, the same).
                   No id on either; the Milestones section's jump id is sectionList's ("pr-<n>", 1968).
Taken journal      sheet.js:1996-1999 (Minor rows, oldest first), 2027-2036 (Major rows, oldest first).
History            sheet.js:2068-2075: sessions newest first; each a .pick with h2 (title) and .cost (date · +IP · +1 MP).
Lock & Export      wizard.js:843 (Review's nav: data-lock, disabled while blocked); wizard.js:1290 refreshNav() flips
                   `disabled` on input without a re-render; wizard.js:1177-1192 the lock itself (S.issued, 163).
Admin dot          shadows.css:567-568 (.admin-banner .dot, pulseDot 1.6s infinite); 1249 (its reduced-motion line);
                   sheet.js:235 (the markup); build.test.mjs:231 (the contrast guard's textless set names it).
announce()         shared.js:99-109: the sr-only status line; it sets its text in a requestAnimationFrame.
Contrast guard     build.test.mjs:226-248: every rule with a var() background is checked for text contrast unless
                   its selector is in `textless`, ends in " i", or is ::before/::after.
`.pip`             already taken: `.cond-counter .pip` (CRANK's counter). The MP track needs its own class.
phone-check        tools/phone-check.mjs: real Chromium (playwright-core), outside npm test; already opens Progression
                   with a Major unlocked on a Professional.
```

**Probes on `main`** (`lockedCharacter()` with four sessions logged, on Progression; a jsdom probe at `6615a1d`):
- At 4 MP, `milestoneState` is `mp=4 minorAvail=0 majorAvail=0`. Logging a session (2 hours) makes it `mp=5 minorAvail=1 majorAvail=0 left=1/0`. `S.beats` is `null` afterwards (taken). The Minor group's summary reads "Minor Milestones — 1 to pick". There's no `.focused-owed` and no `[data-fowedopen]`.
- The pills read `LUCK 4/4`, `IP 50`, `MP 5`. History's first row is the session just logged. The page's sections are `pr-0` Log a session, `pr-2` Milestones, `pr-3` History, `pr-4` Activity Log (IP takes `pr-1` by `secs.at`).
- Four presses of `+1 manual` take MP from 5 to 9, each its own commit. An Undo from the toast takes back one. A manual MP crosses a threshold exactly as a session does.

**Carried over**

*From I1's order (what the order got wrong or left out):*
- **It placed the float with no way to place it.** §9 said "at the readout's top right", but every host it named (Main's `.big`, `.trk`, `.pop-now`) is wider than the number, and its tests checked only that a float existed. The float landed 90–214px off the number, and only the review caught it, by measuring in the browser (fixed in 1234343 and c6550ba). **I2's burst, plate and stamps get a test that measures position in real Chromium** (§11, `phone-check`), not just presence in jsdom.
- **Its sweep missed tests that read text it would change.** A float inside `.big` changed `.big`'s `textContent`, and two J1 tests read it. Grep `tests/` for every selector whose text this order adds to (§5's last rows).
- **Its totality loop couldn't fail.** `beatsFrom` over the hostile set "after `migrate()`" never throws, because `migrate()` cleans the file first. The builder's direct-input test was the real guard. §11 asks for direct inputs.
- **Its decision was over the cap.** The draft ran 421 words against `docs.test.mjs`'s 350, so the builder trimmed its Touches, and the review lost searchable names. Decision **N** below is under 350 as written: paste it whole.
- **STATE's rules moved under it.** #393 (merged mid-review) made STATE say what's next, not what a plan built. STATE has a hard cap of 2,500 words (`docs.test.mjs`). I2's STATE edit is one line (§14).

*From I1's build (what the build got wrong):*
- **The meter's tail lost on specificity.** `.cond .meter i.beat-tail` tied the card's own bar rules and lost on source order, so Luck's tail painted solid gold (742060a). Check every new colour rule's computed value in the browser, not its source.
- **The float was measured after it went in.** On Main the host is the `.big`, so the Range took in the float itself (c6550ba). Anything I2 places by measuring is measured before it's inserted.
- **Two checks were never made by eye:** the light theme and the OS reduce-motion setting. Neither the builder nor the reviewer could, because the browser pane was hidden. **Both are named checks here (§12, step 6), and `phone-check` measures them** (Playwright's `emulateMedia({ reducedMotion, colorScheme })`), since the Major burst and its plate are the biggest beats yet.
- **A hidden pane barely draws.** With the Browser pane hidden, `requestAnimationFrame` fires about twice a second, so a count looks like a jump. The review drove frames with a 16ms shim (`requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16)`) and read each value a count span took with a MutationObserver. Do the same, and say so in the PR.

*From the conductor:*
- **Ken's answers:** IQ1–IQ10 are all Default ("I agree with the defaults for all the questions"). A question left blank is answered "Default".
- **Expect conflicts from parallel PRs.** K5 (#391) and the STATE trim (#393) both conflicted with I1, in `CHANGELOG.md`, `README.md`, `package.json`, `app.js`, STATE and the logs. Expect the same; the conductor merges `main` in and says so. Re-run `npm run verify` after each merge.
- **The frame trap holds for the MP count and the track** (I1's §3): with no frame drawn, the new number and the new pip are what shows.

---

## 1. Goal and Done when

**Goal.** Logging a session reads as the end of a night, where the player is looking. Under Log session's button, the night's register line prints in (its title or date, its IP and its MP) and takes a gold stamp, IP and MP count to where they landed, and a Milestone track draws its new point. The real History row further down drops in quietly. When that point opens a Minor Milestone, a small gold burst and a plate say so; when it opens a Major, every point on the track lights in turn, a bigger burst fires, and the Major plate prints in. Both plates end on **Choose**, which takes you to the pick. A Milestone taken settles into its list. On Review, Lock & Export rings three times when it's ready, then holds still. The Admin banner's dot stops pulsing. Undo, reduced motion, a later render and a tab switch move nothing.

**Done when:**
- Logging a session at 4 MP: the IP and MP pills count to their new values. One `+1` floats off Progression's MP block and one `+<IP>` off its IP block. In the strip under Log session's button, in this order: the register line prints in (the session's title, or its date when untitled; `+10 IP`; `+1 MP`) and stamps gold, the track's fifth pip draws in, then a Minor burst plays and the plate "Minor Milestone" chips in under the track with **Choose**. History's first row drops in. The page doesn't scroll anywhere new.
- At 9 MP to 10: every pip lights in turn, 60ms apart. The Major burst fires, and the Major plate prints in. The whole beat is about 1.3s from the click, and any tap or key during it jumps to the end, while that tap or key still does what it does.
- **Choose** opens the owed group (Major first if both are owed), brings it into view and focuses its first enabled **Take**. It never opens 273's dialog.
- The plate stays while a Milestone is owed (IQ13), with no motion after its first render. Once the last owed Milestone is taken it's gone, and the taken row settles into its journal with a gold line.
- `+1 manual` MP across a threshold plays the track's point, the burst and the plate (IQ12). It doesn't print a register line or drop a History row, because no session was added.
- The register line stays: it always shows the latest session in `ch.sessions` (read from the character, so a reload keeps it). Only its print-in and stamp are the beat. With no sessions, there's no line.
- On Review, the first time Lock & Export is drawn enabled for a character in a sitting, it rings three times (.7s each) and then holds still. Going Back and returning doesn't ring it again. Neither does fixing and re-breaking an issue.
- The Admin banner's dot holds still, gold.
- Undo, a tab switch, a later render: nothing counts, prints, bursts or rings. With reduced motion: the numbers, the pip, the plate and the row are already final, nothing moves, and the screen reader hears "Minor Milestone ready" or "Major Milestone ready" once.
- `phone-check` measures each beat's place (§11) at 1280px and 375px, and in the light theme and reduced motion. `npm run verify` passes; W43's guard and the contrast guard pass with the new CSS.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape* (a player-facing behaviour, new UI on Progression, and the Admin dot's loop removed).
- **App:** minor, 0.77.0 → **0.78.0** (or the next minor if another lands first). A player can see it.
- **Game data:** none. The new `appCopy` strings are text a player reads, not a value a character can observe (Decision 68): no `gamedataVersion` bump. Say so in the PR.
- **Character, table and pack schema, ruleset:** none. Nothing is saved. The beat lives in `S` (constraint 7). `S.lockRung` is a sitting's view state, never written to a file.
- **Decision:** one, **N** (§3). It replaces nothing, and it extends 316 without changing it. The builder still greps §4's Touches for `scrollPageTop`, `pulseDot`, `.admin-banner` and `data-lock` (§5's last row) and marks anything a hit says otherwise.
- **Flags:** none.

## 3. The decision, drafted

Paste as written; fill *Built*. It is under 350 words.

```
N. **A night's end moves once: a logged session drops into History, IP and MP count, a track draws the new point, and an opened Milestone gets a burst and a plate ending on Choose.**
     *2026-11-NN · Ken + Claude · Touches: beatsFrom, beatReads, playBeats, ip, mp, logged, opened, taken, nightLineHtml, mpTrackHtml, msPlateHtml, data-mschoose, beat-burst, beat-ring, S.lockRung, data-lock, Log session, History, Milestones, .admin-banner .dot, pulseDot, announce, phone-check, appCopy.msPlate, I2*
     - **Decided:** A commit that logs a session, or opens a Minor or Major, plays once. IP and MP count everywhere they're drawn. Under Log session, the night's register line prints and stamps gold, and a track marked from the data's cadence draws the new point. A Minor gets a small burst; a Major lights every point in turn and a bigger burst (about 1.3s; a tap skips it). A plate stays under the track while a Milestone is owed; its Choose opens that group at its first Take. History's new row drops in; a Milestone taken settles in. Lock & Export rings three times once a sitting. The Admin dot holds still. Nothing moves on undo or under reduced motion.
     - **Why:** Ken, after the Motion Lab (2026-11-24). The fifth Milestone Point looked like the fourth, and the pick is the point of the moment.
     - **Rejected:**
       - The plate only for the beat: a later render would lose Choose.
       - Reusing Decision 273's Choose: that dialog is the Focused Skill picker.
       - A track in the Milestones block: the player is at Log session.
       - A burst for every Milestone Point: only a threshold is an event.
       - A ring that loops, or a light sweep: a loop is how motion gets annoying (IQ3).
     - **Replaces:** nothing. It extends Decision 316's kit with IP and MP.
     - **Revisit if:** W129 or W124 is ruled (money arrives on this beat), or a Milestone can be crossed without a commit.
     - **Built:** app 0.78.0, PR (this one), log entry 2026-11-NN.
```

## 4. Questions for Ken

Each has a default. One left blank is answered **Default**.

- **IQ11 — Where the night lands.** The page and the Lab differ (pre-flight finding 3). **Ken's answer: (d)** (2026-11-25, through the conductor). A strip directly under Log session's button holds, top to bottom: the night's register line, the track, and, while a Milestone is owed, the plate. The register line shows the session's title (or its date when untitled), its IP earned and its MP earned, and is where the "read into the register" beat plays, since Log session still lands at the page's top. The page doesn't scroll anywhere new. The real History row further down gets only its quiet drop-in. The sequence is the register line printing, the IP and MP stamp, the track's new point, then any burst and plate, all inside §2's timing (a Major about 1.3s; a tap or key skips to the end). *Not taken:* the default (the strip without the register line), (b) scroll to History, (c) the track in the Milestones block.
- **IQ12 — What plays the Milestone beat.** *Default:* any commit that raises `minorAvail` or `majorAvail`: Log session, `+1 manual`, an Admin edit. One hook, as I1's IQ9. History's beat plays only when a session was added.
- **IQ13 — The plate stays while owed.** *Default:* yes. The burst and the print-in play once; the plate itself stays under the track, still, until nothing is owed. *Alternative:* the plate shows only for the beat, and the group summary's "n to pick" is all that's left.
- **IQ14 — What Choose does.** *Default:* it opens the owed group (Major first if both are owed), scrolls it into view under the sticky header and the jump bar (`jumpTo`'s own reckoning), and focuses its first enabled **Take**. The Minors that ask by a chooser (217) open it from there as they do today.
- **IQ15 — When Lock & Export rings.** *Default:* the first time in a sitting that Review draws it enabled for that character, whether arriving at Review already complete or fixing the last issue there. Three rings of .7s, then still, and never again that sitting for that character. *Alternative:* every time it turns from disabled to enabled.
- **IQ16 — IP and MP count.** *Default:* yes. I1's count in the pills, the drawer's rows and Progression's IP and MP blocks, and one float off each block, as I1's IQ7 left them for I2. The sentences that name them (History's heading, "earned · spent", the raise status lines) don't count.
- **IQ17 — The strip's words** (a voice pass; `appCopy`, so editable without code). *Default:* the register line reads the session's title (its date when untitled), `+n IP` and `+n MP`, the numbers as History writes them; `Minor Milestone` / `Major Milestone` as the plate's title, a line "*n* to pick" (as the group summary says it), and **Choose**. Screen reader: "Minor Milestone ready" / "Major Milestone ready". Ken or a voice pass may want the city's voice on the title line.

## 5. The assumption sweep

Every reader, found by grepping `ms.mp`, `ip.available`, `ip.earned`, `sessions.length`, `minorLeft`, `majorLeft`, `minorTaken`, `majorTaken`, `data-seslog`, `scrollPageTop`, `data-lock`, `refreshNav`, `admin-banner`, `pulseDot`, `fowedopen` in `src/` and `tests/` at `6615a1d`. **Twins count.**

| What | Where (at `6615a1d`) | Today | After |
|---|---|---|---|
| `beatReads` | `shared.js:381-391` | six keys | adds `ip` (`Engine.ipState(ch).available`) and `mp` (`Engine.milestoneState(ch).mp`), each in `put`'s try |
| `beatsFrom` | `shared.js:393-404` | `{counts, cells, healed}` | adds `logged` (sessions grew by one), `opened` (`{ minor, major }`, how many `minorAvail`/`majorAvail` rose), `taken` (`{ kind, index }` when a Minor or Major was added); null still when nothing moved |
| Take-once | `app.js:191` | `S.beats` taken on every screen | unchanged; I2's beats ride the same object |
| `playBeats` | `shared.js:420-494` | counts, floats, cells, tail | also plays the track's new pip, the burst and the plate's print-in, and the skip listener for a Major; History's and the journal's classes are render-time (`landedCls`'s way) |
| IP pill | `sheet.js:365` | `numText(ip.available)` | `countHtml("ip", …)`; not a float host |
| MP pill | `sheet.js:366` | `ms.mp` | `countHtml("mp", …)`; not a float host |
| IP / MP drawer rows | `sheet.js:396-397` | plain | count spans |
| IP block | `sheet.js:1932` | `.big` | count span; `data-float="ip"` on its `.trk` |
| IP "earned · spent" | `sheet.js:1933` | a sentence | **unchanged** |
| Milestones heading | `sheet.js:1968` | "Milestones — 5 Milestone Points" | **unchanged** (a sentence) |
| MP block | `sheet.js:1969` | `.big` | count span; `data-float="mp"` on its `.trk` |
| History heading | `sheet.js:2069` | a sentence | **unchanged** |
| History rows | `sheet.js:2070-2075` | newest first | the first row takes `beat-row` (the quiet drop-in, nothing else), on the render after a `logged` beat only |
| Minor / Major groups | `sheet.js:1976, 2006` | summary "n to pick", opens itself | unchanged markup; each gets an id (`ms-minor`, `ms-major`) so Choose can find it |
| Taken journals | `sheet.js:1996-1999, 2027-2036` | rows | the row at `taken.index` takes `beat-settle` once |
| Log a session | `sheet.js:2048-2066` | the form | the strip goes after its button row: `nightLineHtml(ch)`, `mpTrackHtml(ch)`, then `msPlateHtml(ch)` |
| The register line | new, in the strip | | the latest session: title or date, `+n IP`, `+1 MP` (or nothing for MP when it earned none); `beat-print` and `beat-stamp` on the render after a `logged` beat only. A second reader of `ch.sessions`' last entry beside History's first row: both read the same entry, never a copy |
| Log session's binder | `sheet.js:4448-4460` | commit, `scrollPageTop()` | unchanged: the strip is at the page's top (IQ11 (d)) |
| `+1 manual` MP | `sheet.js:4371` `[data-mp]` binder | commit | unchanged; its commit plays the Milestone beat (IQ12) |
| Raise / IP-buy status lines | `sheet.js:3528, 3707, 3867` (aria-live) | "You have n IP" | **unchanged**: a count inside `aria-live` reads out every step (I1's stop) |
| Print | `sheet.js:3292` | | **unchanged** |
| The wizard's rail drawer | `wizard.js:91-92` | IP, MP | **unchanged** (creation; `beatsFrom` is null unlocked) |
| Lock & Export | `wizard.js:843`, `refreshNav` `wizard.js:1290` | disabled or not | takes `beat-ring` once per character per sitting (`S.lockRung`, a Set of `meta.id`), in both places |
| The lock itself | `wizard.js:1177-1192` | `S.issued`, 163 | **unchanged** |
| Admin dot | `shadows.css:567-568, 1249` | pulses forever | holds still, gold; `pulseDot` and its reduced-motion line go |
| Contrast guard | `build.test.mjs:231` | `textless` names `.admin-banner .dot` | still names it. A new filled shape (a pip's fill, a ray) is drawn on `::after` or on an `i`, or added to `textless` with a comment |
| `.pip` | `.cond-counter .pip` | CRANK's | untouched; the track uses `.mp-pip` |
| `announce()` | `shared.js:99-109` | text set in a frame | used once per opened Milestone, calm or not; a pane that never draws says nothing (accepted: a screen reader's page draws) |
| W43's guard | `build.test.mjs:349` | animation and transition rules need a reduced block | passes with every new rule in the reduced block |
| DESIGN.md *Readouts* | Hit landing, Counting | | adds **The night's end** and **Nudge** lines (§9) |
| Tests that read text this adds to | grep at build time: `.trk .big` on Progression, `details.group summary`, History's `.pick`, the Log block, `[data-lock]` | | a count span and a strip inside these must not change a text a test reads; list each hit in the PR |

**Which guards read a value this changes?** None of the engine's; no character value moves. The contrast guard (`textless`), W43's guard, I1's beats tests (`beatsFrom`'s shape grows: test 9 accepts null or an object with `cells`, so it still passes), and `keepPlace` (164): Choose and the plate's button are new controls, so the builder checks that `dataKey` finds `data-mschoose`'s twin after a re-render.

**Where does each new thing render?** The register line, the track and the plate: Progression's Log block only. The burst: inside the plate (Minor) or over the track (Major). The stamps: History's first row. The settle: the taken journal row. The ring: Review's Lock & Export. Count spans: the six IP and MP rows above.

**What text points at it?** The plan's §3 I2 row and §4's IQ3 line; DESIGN.md's *Readouts*; the wishlist's W124 and W129 **Plan** lines, which already point at I2's beat and stay; `copy("majorGmChip")` and the group summaries (unchanged).

## 6. Read first

- `CLAUDE.md`: constraints 1, 2, 5, 7 and 9 (the plate's copy is `appCopy`; no maintainer words).
- `SCHEMA.md` §4: Decisions 316 (all of it), 163, 164, 217, 230, 273 (to know what Choose is not), 281.
- `DESIGN.md`: *Readouts*, *Do's and Don'ts*, *The Fold Rule*.
- `src/ui/shared.js`: `beatReads`, `beatsFrom`, `playBeats`, `stopBeats`, `landedCls`, `calm`, `announce`, `jumpTo`, `sectionList`, `keepPlace`.
- `src/ui/sheet.js`: `renderShProgression`, `logSessionHtml`, `sessionHistoryHtml`, the `data-seslog`, `data-mp`, `data-takeminor`, `data-takemajor` binders.
- `src/ui/wizard.js`: `wizNav` at Review, `refreshNav`, the `data-lock` binder.
- `tests/smoke-sheet-beats.test.mjs` (I1's), `tests/smoke-sheet-progression.test.mjs`, `tests/smoke-wizard.test.mjs`, `tests/build.test.mjs` (the contrast guard, W43), `tools/phone-check.mjs`.
- The Motion Lab page (Ken's artifact) for the timings: row .3s, title .42s (+.08s), stamp .4s (+.42s), Minor burst .55s, Major rays .85s, pips 60ms apart, plate print .45s, title settle .55s (+.2s), ring .7s × 3.

## 7. Out of scope

- **Money on the Milestone beat** (W129, W124): their rules are Deighton's. I2 builds no payday, and the beat leaves no slot for one.
- **GM mode** (I3): the close-out's register, a seat's burst. I2's `opened` and the burst are what I3 reuses, so keep them in `shared.js`.
- **A file reading in** (I4).
- **Tabs, What's new's nudge**: the Lab showed the nudge on What's new too. The plan names only Lock & Export (§3). Leave What's new.
- **Changing what a press does.** Every number lands where it lands on `main`. Log session still scrolls to the top (IQ11 (d)).

## 8. The shapes

All in `src/ui/shared.js` beside I1's kit, except the two renderers in `sheet.js`. Nothing is saved.

```js
// beatsFrom(before, ch) gains, beside counts / cells / healed:
logged: boolean,                                // ch.sessions has one more entry than before
opened: null | { minor: number, major: number }, // how far minorAvail and majorAvail rose; null if neither did
taken:  null | { kind: "minor"|"major", index: number }   // the journal row just added

// counts gains "ip" and "mp" (beatReads), each skipped when its reader can't give a finite number.

nightLineHtml(ch) -> string   // "" with no sessions; else one line for the last of ch.sessions: its title (escaped) or its date,
// "+n IP" and, when it earned one, "+1 MP" (the per-session MP from the data's rules). Words from appCopy.msPlate.

mpTrackHtml(ch) -> string     // "" when the cadence can't make a band (majorEvery not a positive integer ≤ 20)
// One .mp-pip per point from the last Major threshold reached to the next (majorEvery of them), .on up to mp,
// .mark on each Minor and Major threshold in the band, with a mono caps label under the marks ("Minor", "Major").
// Each pip carries data-pip="<its point>" (not data-mp: the +1 manual button binds every [data-mp], sheet.js:4371), so playBeats finds the new one. aria-hidden; the readout is the MP number.

msPlateHtml(ch) -> string     // "" when nothing is owed; else one plate: .ms-plate.major when majorLeft>0, else .minor,
// its title, "n to pick", and <button data-mschoose="major|minor">Choose</button>. Copy from appCopy.msPlate.
```

- **beatsFrom stays total.** A hostile `sessions` (not an array), a `progression` with no `milestones`: no `logged`, no `opened`, never a throw. Test it with direct inputs (Carried over).
- **The frame trap.** The track's new pip is `.on` in the HTML. The beat draws it in only inside a frame callback (as I1's count does). With no frame drawn, the pip is simply on.
- **The skip.** While a Major beat runs, one `pointerdown` or `keydown` listener on `document` (capture, passive, never `preventDefault`) finishes it: every pip lit, the burst removed, the plate at rest. It removes itself when the beat ends or is skipped. `stopBeats()` removes it too.
- **Measured before inserted.** The burst's origin is the new pip's (Minor) or the track's middle (Major), measured with `getBoundingClientRect` against its host before the burst goes in (Carried over).

## 9. The UI

**The strip** (IQ11 (d)) sits under Log session's button row, inside its `review-block`: the register line, then the track, then the plate. On a phone it's full width. The register line looks like the Lab's register row: the date in mono, the title in weight 600, the IP and MP in the numeric face in gold.

**The beat on Log session or `+1 manual`** (played by `playBeats`, never under `calm()`):

| Moment | What moves | When |
|---|---|---|
| The register line | drops in (.25s) and its title prints left to right (.3s); render-time class, on `logged` only | 0 |
| The stamp | the line's IP and MP take the gold stamp (.3s) | +.2s |
| The count | IP and MP count in every twin; one float off each Progression block | first frame, .3s |
| The new pip | the pip at the new MP draws in left to right (`tagPrint`, .25s) | +.35s (at the first frame when no line printed: `+1 manual`) |
| Minor opened | a burst of 8 short gold rays from the new pip (.5s); the plate chips in (.3s) | +.55s; done by ~1.05s |
| Major opened | the band's pips flash gold in turn, 50ms apart (+.35s to ~.85s); a burst of 12 rays, gold and cyan, from the track's middle (.7s, from +.6s); the plate prints in (`tagPrint` .4s, from +.85s), its title settling (.4s, +.1s) | done by ~1.35s, inside §2's "about 1.3s" |
| History | the first row drops in (.3s), nothing else | render-time class, on `logged` only, off-screen |
| A Milestone taken | its journal row chips in with a gold line fading to the frame (.9s) | render-time, on `taken` only |

**Where things land** (focus and place):

| Press | The number in the HTML | What moves | Where focus is |
|---|---|---|---|
| Log session at 4 MP | the register line, the new IP and MP; pip 5 on; the Minor plate | register line print and stamp, count, floats, pip, Minor burst, plate chip-in, History row's drop-in | the page's top, as today; focus as `keepPlace` leaves it |
| Log session at 9 MP | the same, pip 10, the Major plate | the Major beat | as above |
| A tap or key during the Major beat | | the beat jumps to its end; the tap or key does what it does | wherever that press puts it |
| Choose | | nothing moves; the owed group opens | its first enabled Take |
| Take a Minor | the taken row | the row settles; the plate goes when nothing is owed | as today (164) |
| Undo, a tab switch, a later render | as stored | nothing | as today |
| Review, Lock ready for the first time | | three rings | unchanged |

**The plate's look** follows the Lab: a 1px gold line with a 3px gold left edge on the panel; the Major plate taller with a gold wash. The title is in the display face, Major in caps. It holds still at rest (*The Tonal Floor Rule*: no glow at rest).

**The ring:** a cyan `box-shadow` that grows to 9px and fades, `animation: ring .7s ease-out 3`, on `data-lock` when it gets `beat-ring`. In the reduced block.

**The Admin dot:** `.admin-banner .dot` keeps its size and gold. `animation` and `@keyframes pulseDot` are deleted, and so is its line in the reduced block.

**DESIGN.md** (*Readouts*), add after **Counting**:
- **The night's end:** under Log session, the night's register line prints in and its IP and MP stamp gold, and History's new row drops in quietly. The Milestone track draws its new point. A Minor gets a small gold burst and its plate; a Major lights every point in turn and gets the one beat past a second (about 1.3s; a tap skips it). The plate holds still while a Milestone is owed and ends on Choose.
- **Nudge:** a button that becomes the next thing to do rings three times, once a sitting, then holds still. Nothing loops: the Admin dot holds still.

**Copy** (`appCopy.msPlate`, a voice pass, IQ17): `{ lineIp: "+{n} IP", lineMp: "+{n} MP", untitled: "{date}", minorTitle: "Minor Milestone", majorTitle: "Major Milestone", left: "{n} to pick", choose: "Choose", minorReady: "Minor Milestone ready", majorReady: "Major Milestone ready" }`. The builder pastes each as it renders into the PR.

## 10. Worked examples, as named tests

A new file, `tests/smoke-sheet-night.test.mjs`. Write these first and show each failing on `main`.

1. **`I2: logging a session prints its register line, counts IP and MP, floats them, draws the new point and drops the row in`** — `lockedCharacter()` with four sessions, on Progression. Enter 2 hours and press Log session. Immediately: every `[data-count="ip"]` and `[data-count="mp"]` reads the new value and carries `data-from`. There's one `.beat-float` in the IP block reading `+10` and one in the MP block reading `+1`. The strip's register line, above the track, reads the session's title, `+10 IP` and `+1 MP`, and has `beat-print` and `beat-stamp`. The pip `[data-pip="5"]` is `.on`. History's first `.pick` has `beat-row`. After 1.5s: no `data-from`, no `.beat-float`. Switch tabs and back: the register line is still there, with no beat class.
2. **`I2: the fifth point opens a Minor: a burst, and a plate that stays and ends on Choose`** — the same press. `.ms-plate.minor` with `[data-mschoose="minor"]`, one `.beat-burst` inside the plate, and `announce`'s line reads "Minor Milestone ready" once a frame has run. Switch to Main and back: the plate is still there, with no burst and no animation class.
3. **`I2: the tenth point lights every point in turn, and a tap skips to the end`** — nine sessions. Log one. Pips 1–10 carry flash delays 350, 400, …, 800ms, ascending (after the register line and stamp). There's one `.beat-burst.major` and `.ms-plate.major`. Dispatch a `pointerdown` on `document` at 100ms: no `.beat-burst`, every pip `.on` with no inline delay, the plate at rest, and the pointerdown's own target still got its click.
4. **`I2: Choose opens the owed group at its first Take, and never the Focused Skill dialog`** — with a Minor owed, press Choose. `#ms-minor` is `open`, `document.activeElement` is its first enabled `[data-takeminor]`, and `#modal` isn't open. With a Major and a Minor owed, Choose goes to `#ms-major`.
5. **`I2: a manual Milestone Point plays the Milestone beat, not History's`** — at 4 MP, press `+1 manual`. Plate and burst as in test 2. No register-line beat class and no `beat-row` on History; the register line still shows the last session, unchanged.
6. **`I2: a beat plays once: undo, a later render and a tab switch move nothing`** — log at 4 MP, wait 1.5s, `update(false)`, switch tabs. No `data-from`, `.beat-float`, `.beat-burst`, `beat-row`, `beat-print`, `beat-stamp` or `beat-settle`. Undo from the toast: none either, and the plate is gone (nothing owed).
7. **`I2: reduced motion gets the end state, and the screen reader still hears it`** — stub `matchMedia` as I1's test 5 does. Log at 9 MP. Every number final, the register line present, pip 10 `.on`, the Major plate present, no `data-from`, `.beat-float`, `.beat-burst`, no inline transition or delay on a pip, and the announcer reads "Major Milestone ready".
8. **`I2: with no frame drawn, the new number and the new point are all that ever show`** — stub `requestAnimationFrame` never to call back. A MutationObserver on the MP spans and the track: the old MP never appears, and pip 5 is never un-`.on`.
9. **`I2: a Milestone taken settles into its list once`** — with a Minor owed, take Improved (or any Minor that takes no chooser). The new journal row has `beat-settle`. After a tab switch it doesn't.
10. **`I2: Lock & Export rings three times the first time it's ready, then never again that sitting`** — a draft one issue short of locking, on Review. Fix it (the input that clears the last error): `[data-lock]` is enabled and has `beat-ring`. Go Back and return: no `beat-ring`. A second draft reaching Review complete: it rings.
11. **`I2: the Admin dot holds still`** — `build.test.mjs`: no rule on `.admin-banner .dot` has an `animation`, and `pulseDot` is gone.

## 11. Tests beyond the examples

- **Position, in real Chromium** (`tools/phone-check.mjs`, a new pass; outside `npm test`, as phone-check is). It has to run, and the PR pastes its output. At 1280px and 375px:
  - the register line above the track, inside the Log block, its right edge inside the viewport at 375px;
  - the Minor burst's centre within 6px of pip 5's centre;
  - the Major burst within the track's box;
  - the plate's left edge on the Log block's content edge;
  - each float's right edge within 6px of its `.big`'s right edge, measured from the text, as I1's is;
  - nothing past the viewport's right edge, and `scrollWidth` equal to `clientWidth`.
  It runs once more with `emulateMedia({ reducedMotion: "reduce" })`: no element has a running animation (`document.getAnimations()` is empty a frame after the log). And once with `colorScheme: "light"`: the plate's line and title resolve to the light theme's fold (`--gold` → Aether Pulse), read with `getComputedStyle`. **This is the carry-over's measured check, not a screenshot.**
- **Totality, with direct inputs:** `beatsFrom` on pairs of the shapes I1's test 9 uses, plus `sessions: "x"`, `progression: { milestones: null }` and `progression: null`. Null or the shape, never a throw.
- **The contrast guard and W43's guard:** unchanged, and passing.
- **`keepPlace`:** a re-render while the plate's Choose has focus keeps focus on Choose (164's twin match).
- **Mutation-test each guard** against the pre-fix code, and list each in the PR with the test that catches it:
  - `opened` from `mp` crossing a hard-coded 5 or 10 instead of `minorAvail`/`majorAvail` (a test with the data's cadence changed: `minorFirstAt: 3`)
  - the plate shown only on the beat (test 2's tab switch)
  - Choose reusing `data-fowedopen` (test 4)
  - the skip listener left on after the beat (test 3: a later `pointerdown` changes nothing, and the listener count is back to 0)
  - `logged` set by `+1 manual` (test 5)
  - the register line drawn only during the beat, not from `ch.sessions` (test 1's tab switch)
  - the register line reading a copy of the session rather than the last entry (a test deleting the last session: the line shows the one before)
  - the ring on every enable (test 10)
  - the pip rewound before the first frame (test 8)
  - dropping `calm()` from the burst (test 7)
  - the burst measured after it's inserted (phone-check's position pass)

## 12. Steps

1. `git submodule update --init private`; on a branch fresh from `origin/main`, `npm run test:fast`.
2. Write §10's tests; run them and show each failing on `main` in the PR.
3. `beatReads` and `beatsFrom`'s new fields; the IP and MP count spans and floats. `npm run verify`.
4. `mpTrackHtml`, `msPlateHtml`, the strip, Choose, the group ids. `npm run verify`.
5. `playBeats`: the pip, the bursts, the plate's print-in, the skip; History's and the journal's render-time classes; `announce`. The CSS, each animated rule in the reduced block. `npm run verify`.
6. Lock & Export's ring (`S.lockRung`, `wizNav`, `refreshNav`); the Admin dot. `npm run verify`.
7. **The walk, in the dev preview** (`shadows-dev-preview`; seed a locked character with four sessions as `shadows.active.v1` and press Open sheet; drive frames with the 16ms shim if the pane is hidden), each item named in the PR with what was seen:
   1. Log a session at 4 MP: the register line prints and stamps, the count, both floats, pip 5, the Minor burst, the plate, in that order; then scroll to History's row (its drop-in has finished).
   2. At 9 MP: the Major beat, start to end, then again with a tap at ~.3s.
   3. Choose with a Minor owed, then with both owed.
   4. Take the Minor: the settle, and the plate goes.
   5. `+1 manual` across 15: the track's point, the burst and the plate; no register-line beat, no History beat.
   6. Undo from the toast and from the Activity Log: nothing moves.
   7. **Reduced motion, the OS's or DevTools' emulation, by eye**: nothing moves, every number right, the plate there.
   8. **The light theme, by eye**: the plate, the burst's rays, the pips and the stamps fold as the tokens do.
   9. 375px: `scrollWidth` against `clientWidth`, and the burst inside the viewport.
   10. Review: Lock & Export rings once, then holds still; Back and forward, no ring.
   11. Admin mode: the dot is still.
8. `npm run phone-check` with the new pass; paste its output.
9. The docs and versions (§14). `npm run verify`.

## 13. Stop and ask

Stop and ask the conductor if:
- a Milestone threshold can be crossed without `commit()` (a binder that writes MP or sessions and calls `update()` itself);
- a count span would sit inside an `aria-live` region;
- a reader §5 doesn't list draws IP or MP as a number;
- `keepPlace` matches on an attribute this order adds;
- a test outside §10 has to change, other than the version literals `npm run bump` moves;
- IQ11's (d) doesn't fit the page as built (say what you saw, with a screenshot or the metrics).

**Not stops:** `docs.test.mjs` failing until N's INDEX line is in; the contrast guard asking for a `textless` entry for a new filled shape (add it with a one-line comment); I1's beats test 9 needing nothing (its shape check still holds); `phone-check`'s B19 phone-width header failure, which fails on `main` by design.

## 14. Close-out

`close-the-session`, *Rule or shape* tier:
- Decision **N** pasted whole, *Built* filled; its INDEX §3 line under *Sheet & play tracking*, beside 316.
- `npm run bump -- 0.78.0`; `CHANGELOG.md` under `[Unreleased] — app 0.78.0`, then `npm run changelog`:
  - *Logging a session reads as the end of a night: the night prints in under the button, and your IP and Milestone Points count up.*
  - *A track under Log session shows how far you are from the next Milestone. When you reach one, it says so, and Choose takes you to the pick.*
  - *Lock & Export rings when your character is ready to lock. The Admin dot holds still.*
- `DESIGN.md` (§9). The plan's I2 row (built, the decision, the app version) and §4's IQ3 line. **STATE: one line, Motion's** ("I3 is next" or what Ken picks). It's under its 2,500-word cap; check with `node --test tests/docs.test.mjs`. A `docs/log/2026.md` entry and a `docs/log/shipped.md` row.
- **PR title:** `feat(sheet): a night's end moves once (Decision N, I2)`.
- **PR body:** the template's sections, plus *Where the order didn't fit* (empty is fine), the tests failing on `main`, each mutation and its catching test, `phone-check`'s output, the walk's eleven items with what was seen, and every new string as it renders (IQ17's voice pass).

**Review checklist** (beyond the suite passing):
- Re-grep IP's and MP's readers on the PR (`ms.mp`, `ip.available`, `ip.earned`): every one is a count span or an "unchanged" row.
- Run `phone-check`'s new pass yourself, and the walk's items 1, 2, 6, 7 and 8 in the dev preview.
- Measure the register line's, the burst's and the plate's places in the browser yourself; don't take the PR's numbers (Carried over).
- The sequence by eye at Slow (or with the 16ms shim): register line, stamp, point, then burst and plate; a Major inside about 1.3s.
- Every new colour rule's computed value in both themes, against the card it sits on (Carried over: the tail).
- `S.beats` and `S.lockRung` are never in a saved character.
- Choose never reaches `openFocusedPicker`.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path: `docs/plans/motion/I2-the-nights-end.md`. This order's traps:

- **The plate is two things.** Its print-in and burst are a beat (once, `playBeats`, never under `calm()`). Its presence is state: drawn while a Milestone is owed, on every render. Don't make the plate itself take-once.
- **Thresholds come from the data.** `opened` compares `minorAvail` and `majorAvail`, never MP against 5 or 10. Long-Lived adds a slot with no MP, and the cadence is data (Decision 67).
- **`logged` and `opened` are separate.** `+1 manual` opens a Milestone and logs nothing; a session with its Milestone Point unticked logs and opens nothing.
- **Measure before you insert.** I1's float went wrong twice on this (Carried over).
- **The skip never eats the press.** Capture, passive, no `preventDefault`, and it removes itself.
- **`.pip` and `data-mp` are taken.** Use `.mp-pip` and `data-pip`: `sheet.js:4371` binds every `[data-mp]` as the manual stepper.
- **A new filled shape meets the contrast guard.** Draw it on `::after` or an `i`, or add it to `textless`.
- **Reduced motion is three places:** the CSS block, `calm()` for anything a script moves, and `announce()`, which speaks either way.
- **The register line is state, its print-in is the beat.** Draw it from the last of `ch.sessions` on every render; only `logged` adds `beat-print` and `beat-stamp`. The same split as the plate.
- **History's drop-in plays off-screen** under IQ11 (d). That's accepted; don't scroll to it.
- **The pane may be hidden.** Drive frames with the 16ms shim, and check reduced motion and the light theme in `phone-check`, where they're measured.
