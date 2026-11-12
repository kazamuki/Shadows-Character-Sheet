# S31 build notes (WIP, paused 2026-11-12 at the conductor's request)

Done: gmGuide data and shape guard; helpContext, ? button and key, panel (column from 1280px, flyout below), guide lines, empty states;
smoke-table-help tests, keys/cast tests updated; docs (Decision 278, INDEX, log, shipped, STATE, CHANGELOG lines); phone-check `tableHelp` walk
(all Help-open rows ok at 1280/1300/1980; the only over-budget row is the frame fixture's 8 wizard Stats frames, believed pre-existing from E1b's copy pass, not run on main).
Header at 390px: 94px (11%), no overflow; table name ellipsizes ("Dead Air" -> "Dea...").
Five help sentences fixed after reading them against the app: In play, Combat Sense, More/Delay, Find's kinds, strip's Down.

Not done: `outputs.mjs --against` result (was still running; before-snapshot in the session's temp dir, may be lost: rerun both),
the harden test (draft: scratchpad/harden-test.txt, not in repo), Impeccable harden and polish, `npm run bump -- 0.67.0` then `npm run changelog`,
full `npm run verify`, PR (fill "PR #…" in SCHEMA 278's Built line and shipped.md), PR body sections.
