# State of the build

**Updated:** 2026-11-24
**Versions:** app `0.79.0` · game data `0.60` · character schema `0.35` · table schema `0.22` · pack schema `0.3` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` passes · **0 todo** (a todo is a confirmed defect written as a failing test; CI reports the rest)

This is the working document. It says where the build stands, what is in flight,
and who can clear what. It is **rewritten, not appended** — if a line here is out
of date it is a bug. History lives in `log/`; the authority on architecture,
schemas, decisions and flags is `SCHEMA.md`; `INDEX.md` finds anything else.
**What a plan built, and in which version, is in that plan's file**, not here.

---

## 1. Where things stand

The app is a browser character creator and live play sheet for **Shadows**
(Synergy system). Eight-step wizard → lock → seven-tab sheet. It runs from
`file://` with no server and no build step, which drives most of the
architecture and is enforced by tests.

**This section says what exists, not how each piece works.** What a rule or
behaviour is, and why, is its decision: `INDEX.md` §3 lists every one by
topic. What shipped when is `log/shipped.md`. Don't add a clause here per
decision; that's how this section reached 1,500 words (`log/archive.md` §4).

- **The player sheet** is built and covered by tests: the whole wizard; every
  sheet tab; damage, Pain, armor, Conditions, healing and Take a hit; Sanity,
  Luck, Çredits, IP, Milestones and the session log; loadout with the gear
  catalog; Expert mode; Help and Guide lines; an undoable audit trail; a
  printable sheet, filled or blank. Traits' effects are data (`grants`),
  computed where the engine can and shown as tags everywhere.
- **The archetypes**: the Professional and the Arcanist (`draft`), the
  Werewolf (`0414`) and the Vampire (`0413`), both `draft` with their Majors,
  and a player-written **Custom** one. The Cyborg is cut, still `tbd`, and
  retired from the picker (Decision 277; §3). Supernatural powers have ranks; creation follows the book's caps
  (240, 264) and play stops at 10 (194).
- **Magic** (spells, Cascade, Aberrations, holding a spell) and **combat**
  are built end to end, and both plans are closed.
- **GM mode** is **launched** (260), on for everyone: a table file with its
  cast, players and their characters as copies, packs and the Codex,
  encounters, sessions and the close-out, the Reference, Find and Jot, undo,
  Help and keys. The switch stays, on; tests reach its switched-off path
  through the harness's `GM_OFF`. A GM session is an ordinary batch, with its
  changelog lines and an app bump.
- **CRANK** reputation is on for everyone (239). Rep stops at 0 but for **Burned**; Reputation and Burned set a starting rep (295, 296).
- The engine reproduces the CRB's worked examples (`tests/rules.test.mjs`),
  and a hostile file renders safely everywhere (`tests/hostile.test.mjs`).

**The print front page is full.** Anything more there breaks to a second
page (96). Four pages in all, the archetype's last (153). **One known defect:** the frame/texture decoration shows
on screen but not in Chrome's print/PDF output (Decision 94). Cosmetic only.

---

## 2. Shipped, and what it left behind

The batch board is `log/shipped.md`. **Demo hosting:**
`charactersheet.shadowsrpg.com`, via GitHub Pages, deployed only by the
**release** workflow (Decision 138). The live version is the latest `v*` tag.
How to release is in `CLAUDE.md`, and only there.

**The conventions a change follows** (`excludes`, `grants()`, data paths,
proving a change invisible, the helpers to reuse, focus and redraws) are in
`SCHEMA.md` §1, *Conventions*. Retired text lives in `log/archive.md`,
verbatim.

---

## 3. Areas of work

Grouped by what part of the app or ruleset they touch, not by who owns
them — a status and what's blocking it travel with the topic. `SCHEMA.md` §5
is the authority on a flag's full text.

**Legend:** ✅ done · ⏭ ready (nothing external blocks starting) · 📋 planned (a plan doc exists) · 🔶 partial/stable · ⏸ blocked

| Area | Status | Waiting on |
|---|---|---|
| **Gear & Combat** | ✅ built, plan closed | Deighton: **F42** (which damage Resistance answers), **F48** (the book's ten untyped weapons) |
| **Milestones** — F12, F32 | ✅ built: any Minor repeats, each with its chooser | Ken: **F32** (Arcanist Majors; until then **Add one** is the stand-in) and **F12** |
| **Advantages/Disadvantages fine print** | 🔶 mostly settled · two `excludes` pairs (235, 296) | Deighton. The CRB names no other pair, so none is invented |
| **Cyborg** — F6, F19 | ⏸ **cut and retired from the picker** (277): a saved one opens and plays as before; cybernetics become a list and a mini-game, Professionals only | **W90** holds the six questions before a plan. Then W61 folds saved Cyborgs into Custom and F6, F19 and F5 close |
| **Vampire** — `0413` · **Werewolf** — `0414` | ✅ built as the 2026-10-22 book prints | Nobody. Whether they leave `draft` is Ken's (the chapters dropped "Under Construction") |
| **Arcanist / Magic** | 🔶 built · Origins still `draft` | Deighton: **F43** (the held spell's check). Deighton + Scott + Bill + Ken: Origins and spheres/implements; not blocking |
| **GM mode** — `plans/gm-mode-next.md` | 🔶 launched; built through S28 (the plan says what each session built) | Scott: a session on the live version first (S22), then his to-dos (the plan's §4). Then Ken's pick. **Deighton's read of Help's words** (GQ39) arrives as edits to `gmGuide` |
| **The book** — `plans/crb-catch-up.md` | 📋 what the CRB still needs from the sheet, by chapter, against the mirror at `c99bb58` | Ken: the EMP *names* wait on the book. Scott: confirm the four inscribed Cantrips' TN 7 is his change. Deighton: whether a power that prints its own action keeps it under the free-SFR ruling, and FG-1's Injured / Maimed |
| **Print sheet — visual system** — `plans/print-sheet-scotts-look.md` | 📋 front-page restyle proposed and mocked up | Ken: approve the plan. Scott: send the files (PQ1, PQ2). Deighton: PQ3 |

Closed areas (audit remediation, the custom archetype, creation-pool
economics) are in `plans/archive/`.

---

## 4. Open engineering work

**The audit plan is done**, and `npm run phone-check` passes (140). rev 9's
`C1`–`C3` are still forward notes.

---

## 5. Where to start

**The live site is v0.76.0** (data 0.60, schema 0.35), released 2026-11-24.

**Next is Ken's pick**, each built through a work order (`WORK-ORDERS.md`):
- **The `/impeccable audit`** of the whole app is its own read-only session; Ken triages its report.
- **GM mode, what's next** (`plans/gm-mode-next.md`): Scott's play report first (S22), then Ken's pick.
- **Loadout and gear** (`plans/loadout-and-gear.md`): ends with natural-weapon follow-ons, each waiting on an answer: L8 the Werewolf's damage (LQ40), L9 a trained weapon as natural (W160), L10 hand cyberware (W90). Bone Spines' grappling waits on Deighton (F55).
- **Motion** (`plans/motion.md`): I1–I3 built; I4 is next.
- **Closed plans** are in `plans/archive/`; finding-things left W152–W157 and W159, powers-that-run W132's last two powers (`plans/crb-catch-up.md`), pools-and-numbers (J1–J4, 312–315, released in 0.76.0) F56 for Deighton, and help-on-the-sheet (K1–K5) W177, removing Burned without Admin mode (with Scott), and Deighton's read of the sheet's Help copy.
- **W90**, cybernetics: six questions before a plan.

**Ken alone:** F12 and F32, W38's plan (`plans/two-tabs-one-character.md`,
TQ1–TQ3), and the print plan (`plans/print-sheet-scotts-look.md`).

**Waiting on others:**
- **Deighton:** what a rank of Educated bought in play gives (F44: the IP buy refuses it until then), the held spell's WILL check (F43), and whether a Supernatural's Skills and Powers share its stats' headroom past 10. **One ruling on kickers may clear F46 and F47 together:** do dice stack, and which one is "your Kicker Die". F45 is Concierge's appraising Skill. Burned's buy-off against `0450` and Redeemed waits on the book.
- **Deighton, on vehicles (W91, off the plan):** 17 of the 28 follow-up questions
  (`reference/rulings-2026-10-23.md`), SH3, VK1b, and his in-person talk on
  vehicles without PROT and RES. The loadout plan's §6 lists the rest.
- **GM mode's open questions** (`GQ`_n_) and who holds each: `plans/gm-mode-next.md` §5.
- **Scott:** no questions left. What's his is to-dos (`plans/gm-mode-next.md` §4), a session on the live version first: he tells Ken when one is done, and nobody asks him to reopen a page.

**Don't invest in** the Arcanist's creation-time Unique Aberrations: they
follow `0411` (Decision 110), and Ken expects the Origins subtypes to replace
them.

---

## 6. Keeping this file honest

- **Every volatile fact lives here and nowhere else.** `CLAUDE.md` carries no
  counts. Log entries state figures *as of that session* and are never
  updated — they are history, and history does not drift.
- **`tests/docs.test.mjs` enforces it:** the todo count, the versions and this
  file's length are checked, the flag table is checked against the data, and
  every file `CLAUDE.md` points at must exist.
- **§3 is organized by topic, not by sequence, on purpose (2026-09-12).**
  Several areas are blocked on different people and resolve in whatever
  order those people answer. Don't reintroduce a `#` column to §3.
- **Describe what shipped in `log/` and the plan's file, not here.** A
  paragraph about a finished batch, or a list of which session built what in
  which version, is history; this file keeps only what's still true and
  what's next.
- **Rewrite §1–§5 when the change tier says so** (`CLAUDE.md`), in the same
  commit as the work.
