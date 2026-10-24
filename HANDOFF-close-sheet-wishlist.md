# Handoff: close the sheet-wishlist plan, open a vehicles-and-gear plan

*Written 2026-10-24 by the P16 conductor session (Opus), for a fresh session. Paste this whole file as the first message.*

## Progress (updated 2026-10-24, end of the conductor session)

**#245 is merged** (`8fb5b1d`). Branch **`claude/close-sheet-wishlist`** (pushed, no PR yet) holds a WIP commit with:
- **Step 1's move, done:** `docs/plans/sheet-wishlist.md` and `sheet-wishlist/` are `git mv`'d to `docs/plans/archive/`. Relative links inside them are fixed (one level deeper), and so is `archive/crb-v4-sync.md`'s link to it. The archived plan has a "Closed 2026-10-24" status line. INDEX §1 lists it under closed, with the old-path note. STATE §3's bullet is rewritten.
- **Step 2, checked, nothing to move:** the built rows name 28 wishes, and all of them are already in `wishes-granted.md`. The only one still open is **W130**, P20a's follow-on (Age's MOB cap can drop), which wasn't granted, so it stays open.
- This handoff file is committed on the branch so you have it. **Delete it before opening the PR.**

**`npm run verify` is red on that branch, on purpose:** `docs.test.mjs`'s wishlist guard (~line 386–425) refuses a **Plan:** line that links an archived or missing plan. `docs/WISHLIST.md` still has 14 such lines (`grep -n "sheet-wishlist" docs/WISHLIST.md`):
- **W69** (line ~275) and **W91** (~311): repoint them to the new gear plan once it exists, and the plan must name them (the guard checks).
- **Twelve "set aside by [sheet-wishlist §4]" lines** (W49–W52-ish ideas, W55, W56, W62, W63, W100, W61, W90; read each). The guard allows only a link to a live plan, or exactly `none yet` (no trailing text). Either give each a live home (the gear plan's own *Not scheduled* section, for gear-area ones, or another plan), or set it to `none yet` and keep its reason in the wish's body. **Ask Ken which** if it isn't obvious. Recommendation: `none yet`, with the reason moved into the body, for every non-gear one.
- Prose mentions (line ~463, "Sequence after sheet-wishlist's P14") should name the new plan's id.

**So what's left:** step 3 (draft the gear plan), then the WISHLIST repointing above, then `verify` green, then delete this file, then the PR (step 4). Steps 1–2 below are done; skim them for context.

## Before you start

- **PR #245 (P16, the Character tab's layout, Decision 246, app 0.54.2) must be merged first.** Its close-out edits `docs/plans/sheet-wishlist.md` (P16's row), `docs/WISHLIST.md` and `docs/log/wishes-granted.md`, so moving those files before it lands would conflict. Check with `gh pr view 245 --json state`. If it's still open, stop and tell Ken.
- Cut a fresh branch from `origin/main`. Run `git submodule update --init private`, then `npm run test:fast` as the baseline (CLAUDE.md).
- Read `CLAUDE.md`, `docs/STATE.md` and `docs/INDEX.md` §1 (where plans live) first. **Tier: Docs.** No code, no data, no version bump. It gets one PR, and Ken approves the new plan before any of its orders are drafted.

## What Ken decided (2026-10-24, in the P16 conductor session)

Ken: "close and archive the sheet-wishlist plan and make a new plan for vehicles and gear". The new plan is a smaller one, focused on vehicles and worn gear modifiers, plus any wishlist items that would augment them or sit in the same code area. His reason: the old plan "has done a lot of good work", and Deighton's vehicle data is several days away, so he'd rather start a fresh plan. He agreed to all four points of the proposal below, and added one: **every wish the old plan finished moves to `docs/log/wishes-granted.md`**, to keep the wishlist clean.

## The work

### 1. Archive `docs/plans/sheet-wishlist.md`

- **Precedent:** the two CRB syncs. `crb-v4-sync.md` and `crb-sync-2026-10-22.md` moved to `docs/plans/archive/` with their work-order folders. INDEX §1's plans line (`docs/INDEX.md` ~line 30) lists them under "Closed, kept as history in `plans/archive/`", with a note on which older log entries cite the old path. Do the same for `sheet-wishlist.md` and `sheet-wishlist/` (`git mv`).
- **Fix every link** to the old path: grep `sheet-wishlist` across `docs/`, `CLAUDE.md`, `.claude/skills/`, `README.md` and `tests/`. `docs.test.mjs` may check links or the INDEX. **Don't edit log entries**: the log is append-only (CLAUDE.md), so add the "cites the old path" note to INDEX instead, as the precedent does.
- Give the archived plan a closing status line at the top: what it built (P1–P21 except P14 and P15) and where P14 and P15 went.
- **Loose ends, verify each, don't assume:**
  - §4 *Not scheduled*: each row already points at another home (W90/W61 on the cybernetics flags, W38 on `two-tabs-one-character.md`, W29/W73–W86 on GM mode, and so on). Check that `WISHLIST.md` agrees for each wish. Since #242, every wish names the plan that covers it.
  - §5 WQ3–WQ6 became flags F45–F47 (P21, Decision 237). Confirm they're in SCHEMA §5 and INDEX §2, and that no WQ is left unanswered.
  - Spin-off wishes the plan named (W110, W119, W121, W122, W130, W132, W135 the phone HP card from P16, and so on) need a home or an honest "not scheduled" in `WISHLIST.md`, not a pointer to an archived plan.

### 2. Move finished wishes to `wishes-granted.md` (Ken's addition)

- Every wish one of P1–P21 granted moves **whole** from `docs/WISHLIST.md` to `docs/log/wishes-granted.md`, each with a line naming its PR and version. That's the existing close-out pattern; P16 did it for W99 and W60.
- Most were probably moved already by each order's close-out. **Check every one**: for each built row in the plan's §3 table, grep its W ids in both files. Move only what's still in WISHLIST and fully done. A wish that's only partly done stays, with its remainder stated.
- `wishes-granted.md` is under `log/`. Check its header for whether it's append-only before adding to it.

### 3. Draft the new plan: vehicles and worn gear

- **New file** under `docs/plans/`, for example `loadout-and-gear.md`, with work orders in a folder of the same name. Use a new session letter and question prefix that don't collide with existing ids (INDEX §2 lists P, S, Y, V, W, AQ, CQ, MQ, XQ, VQ, YQ, GQ, TQ, PQ and so on; pick one that's free). Follow the shape of an existing plan (`gm-mode.md`, or the archived `sheet-wishlist.md`).
- **Carry over P14 and P15** under the new letters, each noting "was P14/P15 in sheet-wishlist". `git mv` P14's drafted order (`P14-loadout-rows.md`) into the new folder. It's **shelved**: it gets revised to Deighton's rulings before it's built, and its Status already lists what changes.
  - P14 is vehicles (W91, Powered Armor included, a save shape: `vehicles`, schema 0.29). It waits on Deighton's follow-ups in `docs/reference/rulings-2026-10-23.md`: SH3 (a typed vehicle), VK1b (the Mods number) and VD1 (vehicles without PROT and RES).
  - P15 is worn gear modifiers (W69). Its first step is data work, `damageType` for the 25 weapons without one. Powered Armor's enhancements were ruled 2026-10-23 (PA5–PA8).
- **Sweep the wishlist for the area**: every wish touching Loadout & Powers, gear, weapons, armor, vehicles, magazines, inventory or the loadout rows. Grep `WISHLIST.md`, and grep the code readers too (`src/ui/sheet.js`'s loadout renderers, and the gear parts of `src/data/shadows-data.js`). For each wish, record **buildable now** (no Deighton dependency) or **waits on Deighton** (which ruling). That split is the point of the plan, so there's real work to build while the vehicle data is outstanding. Show the evidence for each call.
- **Order the sessions** so the buildable-now ones come first, with why. Put Deighton's open follow-ups in one *Waiting on* list. Add a WQ-style questions table with a default for each.
- **Repoint** each covered wish in `WISHLIST.md` to the new plan. Add the new plan to INDEX §1 as **Proposed**, and to STATE §3 if STATE lists areas.

### 4. Close out

- `npm run verify`. Expect `docs.test.mjs` to catch broken links and INDEX drift.
- One PR: "docs(plans): archive sheet-wishlist, propose the vehicles-and-gear plan". Its body lists every wish moved to wishes-granted, every wish repointed, and the buildable-now/waits split. The new plan's questions go to Ken for approval. **Don't draft any work order until he approves the plan.**
- Add a `docs/log/2026.md` line only if this changes how we work (Docs tier). Archiving a plan is precedent, not new.

## Housekeeping left from P16

- The P16 sessions, "P16 build" (`local_445b5e24-572a-4f1d-9347-d0f2c53f32db`) and "P16 review" (`local_dbcbd7ab-40c6-4736-9065-2109b897ce54`), can be archived once #245 merges, on Ken's yes.
- P16's conductor notes (session scratchpad, not in the repo) record: Ken's four answers in PR #245 comment 6387582982 (even rows, solo text 75ch, 1300 pinned at 2 columns and Advantages/Disadvantages on the column lines only at four both accepted, the HP card as W135). Everything that mattered is in the PR and Decision 246.
- After the merge, the next build is Ken's pick. **S12b (Site Profiles, GM mode)** is drafted and approved, so it could go straight to a builder through the `run-a-work-order` skill.
