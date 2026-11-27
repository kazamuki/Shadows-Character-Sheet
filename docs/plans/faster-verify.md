# Work order: A faster verify, with every check kept

**Plan:** none. A one-session order, like W143's. **Source:** Ken, 2026-11-26, in I4's conductor session. He asked why verify keeps getting longer and whether it could check only what changed. He also asked for a quicker run for docs-only changes, since a plan or an order changes no code.

**Status: built 2026-11-26** (Decision 321). Drafted by Claude (Opus), I4's conductor. **Approved by Ken 2026-11-26**, in the conductor's session: "Approve, all Default", so ZQ1–ZQ5 are Default, with one change to ZQ1 for a miss the conductor found at the re-check: `rules.test.mjs:1580` reads `docs/plans/crb-catch-up.md` (Decision 288's book-debt check), and Ken chose "Count it as code": that plan joins `CHANGELOG.md` as a code path.

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing a player sees changes.

**Cadence:** the three-session loop in [`../WORK-ORDERS.md`](../WORK-ORDERS.md). The conductor starts the builder (Sonnet), then a fresh reviewer (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `package.json`, `.github/workflows/verify.yml`, a new `tools/test-run.mjs` and `tests/timings.json`, the six slowest test files (split, not changed), one guard, `CLAUDE.md` (*Commands* and *The baseline before a change*), `docs/WORK-ORDERS.md`, and the skills that name verify. It changes no `src/`, data, engine or schema.

**Pre-flight against `main` at `afb4220`** (#401, I4, merged). Take the next free decision number on `origin/main` when it's written (the order says **N**). At the pre-flight it was 320. Everything below was measured on Ken's machine (12 cores, Node 22.12.0), with each test file run on its own and one at a time (`node --test tests/<file>`). For the first few minutes, I4's builder's `verify` was running on the same machine, so the earliest files (alphabetically) read up to about 30% high.

### What the pre-flight found

1. **The suite is 3,906 seconds of work** (about 65 minutes) when its 31 files run one at a time. Six files are two-thirds of it:

   | File | Seconds | Tests |
   |---|---|---|
   | `smoke-wizard` | 616 | 112 |
   | `smoke-sheet-play` | 576 | 133 |
   | `smoke-sheet-help` | 500 | 23 |
   | `smoke-sheet-skills` | 354 | 79 |
   | `smoke-sheet-progression` | 347 | 47 |
   | `smoke-sheet-archetypes` | 280 | 53 |
   | `smoke-table-play` | 205 | 148 |
   | `voice` | 168 | 13 |
   | `smoke-table-cast` | 142 | 112 |
   | `hostile` | 133 | 61 |
   | the other 21 files together | 585 | |

   `engine.test.mjs` takes 18s for its 830 tests. The full table is in the PR that drafted this order.

2. **CI is short of cores, not held up by one file.** `ubuntu-latest` has 4 cores, and `node --test` runs files on cores − 1. 3,906s across 3 lanes is about 22 minutes, close to CI's 16–20 (`gh run list --workflow verify.yml`: 12, 15, 16, 16, 17, 19, 19 minutes on the last seven runs).
3. **This machine is held up by one file.** With 11 lanes, the floor is the slowest file: `smoke-wizard` at about 10 minutes. That's why a local verify is 10–17 minutes. **Splitting CI into jobs can't beat the slowest file, and only splitting that file can.**
4. **A docs-only PR pays the full suite.** #398 and #400 changed only `docs/` and ran 12–16 minutes of CI on every push, then again on `main` after merging.
5. **Booting the app is not the main cost.** One `boot()` (`tests/harness.mjs:40`) parses 2.7 MB of HTML in about 0.8s (1.5s the first time). `smoke-sheet-help` boots about 7 times and takes 22s per test, so the time goes into drawing the sheet again and again. Finding out why is a profiling job of its own (ZQ5).
6. **Other tests read one docs file: `CHANGELOG.md`.** `build.test.mjs:394` (a launched feature needs its line), `voice.test.mjs:76` (maintainer prose), and `smoke-roster` (What's new's groups) all read it, and a change to it also regenerates `src/data/shadows-changelog.js`. No test outside `docs.test.mjs` reads anything under `docs/`. The other hits are comments: `grep -n -E "docs/|README\.md|CLAUDE\.md|DESIGN\.md|CHANGELOG\.md" tests/*.test.mjs`. **Re-run that grep at the build. A new reader moves the line between docs and code.**
7. **How the files split into CI jobs matters.** Node's own `--test-shard=i/4` deals files out in turn by name. With the measured times that's 1431 / 1086 / 1107 / 281 seconds. Dealing the slowest file first to the lightest job gives 974 / 982 / 977 / 974.
8. **`main` has no required checks** (`gh api …/branches/main/protection` → "Branch not protected"). A docs-only run can't leave a PR unmergeable.
9. **The release workflow runs the whole suite itself** (`release.yml`: `npm test` after `release.mjs check`). It stays as it is.

### What Decision 167 already says

Decision 167 rejected skipping the CRB conformance tests when the mirror is absent, because "CI would stop checking … without saying so". The docs-only run follows the same rule: **it says, in the job's summary and its log, that it ran the docs checks only and why.** Every shard keeps 167's private checkout as it is: same token, `persist-credentials: false`.

## 1. Goal and Done when

**Goal.** Every check still runs on every code change, and less time goes into waiting. A docs-only PR gets the checks that can fail on a doc, in about a minute. A code PR's CI runs in parallel jobs. A builder checks the area it's working in after each step and runs the full suite before the PR. The slowest test files are split, so no single file holds the run up.

**Done when:**
- `npm run verify:docs` runs `npm run check`, `docs.test.mjs` and `build.test.mjs`, in under 90s on this machine.
- On a PR whose every changed path is a docs path (ZQ1), CI runs `verify:docs` alone. The job's summary says "Docs-only change: the docs checks ran, the full suite didn't (paths: …)". Any other path gets the full suite. A push to `main` and `workflow_dispatch` always get the full suite.
- A code PR's CI runs the full suite as four jobs (ZQ2), each taking a set of files from `tools/test-run.mjs shard i/4`. Together they run every test file exactly once, and a guard fails if they don't.
- `npm run test:sheet`, `test:table` and `test:wizard` run `test:fast`'s four files plus that area's files.
- The six files over 250s are each split in two along their own section comments (ZQ3). Every test keeps its name, and the suite's test count is unchanged.
- `npm run verify` passes, and its time on this machine is in the PR, before and after. So is CI's time on the PR, against the 16–20 minutes before.
- `CLAUDE.md`, `WORK-ORDERS.md` and the skills say which run goes where (ZQ4).

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*: it changes how a change is checked. It's process and tooling, not a player-facing behaviour, but someone could reasonably choose otherwise, and `CLAUDE.md`'s rule moves. So it's proposed first (this order) and numbered.
- **App, game data, schemas, ruleset:** none. No player sees a difference, so there's no `CHANGELOG.md` line and no bump.
- **Decision:** one, **N** (§3). It replaces nothing numbered. It amends `CLAUDE.md`'s "After a change, the full `npm run verify`, always" and WORK-ORDERS' "a `npm run verify` checkpoint after each" step. Decision 131 (tiers) stands. The builder greps §4's *Touches* for `verify`, `verify.yml`, `test:fast`, `npm test` and `CI`. At the pre-flight only 167 named `verify.yml`, and it stands, kept as above.
- **Flags:** none. **Log:** a `docs/log/2026.md` entry, because this changes how we work, and a `shipped.md` row.

## 3. The decision, drafted

```
N. **Verify checks what a change can break, and runs it in parallel: a docs-only change runs the docs checks, a code change the whole suite in four jobs.**
     *2026-11-NN · Ken + Claude · Touches: npm run verify, verify:docs, test:fast, test:sheet, test:table, test:wizard, tools/test-run.mjs, tests/timings.json, verify.yml, CI shards, docs-only, CLAUDE.md Commands, WORK-ORDERS steps, ZQ1–ZQ5*
     - **Decided:** A PR that changes only docs (`docs/`, and `.md` files other than `CHANGELOG.md`) runs `npm run check`, `docs.test.mjs` and `build.test.mjs`, and says it skipped the rest. Any other PR, every push to `main` and every release run the whole suite. CI runs it as four jobs balanced by measured times. A builder runs its area's tests after each step and the whole suite before the PR and after review fixes. No test file takes more than about five minutes on its own.
     - **Why:** Ken, 2026-11-26. The suite is 65 minutes of work. CI ran it on 3 lanes for 16–20 minutes on every push, docs included, and a builder ran it after every step, so most of a build was waiting.
     - **Rejected:**
       - Choosing tests by what a change touches: the five UI scripts share one scope, and `shared.js` feeds every screen (I3 changed `update()` for the table; I4 touched the wizard, GM mode and the data). The guess is the risk.
       - Node's own `--test-shard`: it deals files out by name, and the measured times come out 1431/1086/1107/281s.
       - Skipping CI on docs-only PRs entirely: `docs.test` is what catches a ledger or an index out of step, and a silent skip is what Decision 167 refused.
     - **Replaces:** nothing numbered. It amends `CLAUDE.md`'s "after a change, the full verify, always" and WORK-ORDERS' per-step verify.
     - **Revisit if:** a docs-only PR breaks `main` (a new test reads a doc); or a code PR passes its area run and fails the whole suite often enough that the per-step run misleads.
     - **Built:** no app, data or schema change. PR (this one), log entry 2026-11-NN.
```

## 4. Questions for Ken

Each has a default. One left blank is answered **Default**.

- **ZQ1: What counts as docs-only.** *(Ken: Default, and `docs/plans/crb-catch-up.md` counts as code, like `CHANGELOG.md`, because `rules.test.mjs:1580` reads it.)* *Default:* every changed path is under `docs/`, or is a `.md` file anywhere except `CHANGELOG.md` (`README.md`, `CLAUDE.md`, `DESIGN.md` and the skills count). `CHANGELOG.md` is code, because three tests read it and it regenerates a `src/` file (finding 6). A change to the `private` pointer is code. *Alternative:* only `docs/**`, so a `CLAUDE.md` or skill edit still pays the full suite.
- **ZQ2: CI's jobs.** *(Ken: Default.)* *Default:* four jobs. `tools/test-run.mjs` gives each a set of files, dealing the slowest first to the lightest job, from a committed `tests/timings.json`. A new file nobody has timed counts as 60s. `npm run test:time` re-times every file and rewrites the table, by hand, when the balance drifts. *Alternative:* Node's `--test-shard=i/4`: no table to keep, but on today's numbers one job gets 1431s and another 281s.
- **ZQ3: Split the six slow files in this order.** *(Ken: Default.)* *Default:* yes. Each of `smoke-wizard`, `smoke-sheet-play`, `smoke-sheet-help`, `smoke-sheet-skills`, `smoke-sheet-progression` and `smoke-sheet-archetypes` is split in two along its own `// ──` section comments, into halves of similar time, named by what they hold (`smoke-wizard-steps` and `smoke-wizard-rules`, for example, not `-a`/`-b`). Without this, four jobs still wait about 10 minutes on `smoke-wizard`, and so does a local run. *Alternative:* leave them for the profiling order (ZQ5). CI then lands near 10 minutes, not 5–6.
- **ZQ4: The loop's checkpoints.** *(Ken: Default.)* *Default:* after each step, the builder runs `test:fast` plus the area run for the files it touched (`test:sheet`, `test:table`, `test:wizard`, or more than one). It runs the full `npm run verify` before opening the PR, and again after the review's fixes. The reviewer runs the full suite on the PR as today. A docs-only change, an order draft for example, runs `verify:docs`. CI runs everything on every code push. *Alternative:* keep the full verify after every step, and take only the CI and docs-only savings.
- **ZQ5: Why the sheet tests are slow.** *(Ken: Default.)* *Default:* out of this order. Add it as a wish: profile `smoke-sheet-help` (22s a test), find what each test redraws, and fix the setup without dropping a check. *Alternative:* in this order, which makes it much bigger and harder to review.

## 5. The assumption sweep

| What | Where (at `afb4220`) | Today | After |
|---|---|---|---|
| `npm run verify` | `package.json` | `npm run check && npm test` | **unchanged**: still the whole suite, one command |
| `npm test` | `package.json` | `node --test "tests/*.test.mjs"` | **unchanged** |
| `test:fast` | `package.json` | engine, rules, docs, build | **unchanged**; the area runs build on it |
| `verify:docs` | new | | `npm run check && node --test tests/docs.test.mjs tests/build.test.mjs` |
| `test:sheet` / `test:table` / `test:wizard` | new | | `node tools/test-run.mjs area <name>`: the fast four plus `smoke-sheet-*`; `smoke-table-*`, `sample-table`, `codexpack`; `smoke-wizard*`, `smoke-roster` |
| `test:time` | new | | times each file on its own and rewrites `tests/timings.json` |
| `tools/test-run.mjs` | new | | `area <name>`, `shard <i>/<n>`, `list` (prints the files for either). No dependency, classic Node, never shipped |
| `tests/timings.json` | new | | `{ "<file>": seconds }`, from this pre-flight's run, then re-timed after the splits |
| The guard | in `docs.test.mjs` (it already checks the repo's own bookkeeping) | | every `tests/*.test.mjs` is in exactly one of the four shards; no `timings.json` key names a missing file; every file is in an area or on a named list `hostile`, `voice` (whole suite only). Mutation-test all three |
| `verify.yml` | one `verify` job: checkout, private checkout, `npm ci`, `check`, `npm test` | | a `changes` job (PRs only: `git diff --name-only` against the base, ZQ1's rule) → either one `docs` job (`verify:docs`, and a `$GITHUB_STEP_SUMMARY` line) or a 4-way matrix (`check` in job 1, then `node tools/test-run.mjs shard i/4 \| xargs node --test`). On push and dispatch: the matrix, always. The private checkout is kept in every job |
| `release.yml` | `npm test` | | **unchanged** (finding 9) |
| `CLAUDE.md` *Commands* | verify, test, test:fast | | adds `verify:docs` and the area runs, one line each |
| `CLAUDE.md` *The baseline before a change* | "After a change, the full `npm run verify`, always." | | ZQ4's sentence. The full verify before a PR, and `verify:docs` for docs-only |
| `WORK-ORDERS.md` | §*What a work order contains* item 12: "a `npm run verify` checkpoint after each" | | "an area run after each, the full verify at the end". Also the builder's prompt if it names verify (grep) |
| Skills | `close-the-session/SKILL.md:14` ("`npm run verify` passes"), `cut-a-release/SKILL.md:33` (`npm run verify`), `close-a-flag:43` and `number-a-decision:64` (`test:fast`) | | the closing check stays the full verify, and a docs-only close is `verify:docs`. `cut-a-release` stays the full verify. The two `test:fast` ones are unchanged |
| `README.md`, `CONTRIBUTING.md` | `README.md:33-34` ("run this before every commit"), `CONTRIBUTING.md:32` ("`npm run verify` before every commit") | | ZQ4's words: the full verify before a PR, `verify:docs` for docs-only, an area run while working |
| The six slow files | `tests/smoke-wizard.test.mjs` and five `smoke-sheet-*` | | each split into two files. Shared setup moves to `smokekit.mjs` only if both halves need it; otherwise it goes with its tests |
| Tests that name a test file | `engine.test.mjs:1064` and `rules.test.mjs:1987`, both comments ("guarded in tests/smoke-sheet-play.test.mjs", "pinned … in smoke-sheet-progression"); no `tools/` hit | | each comment names the half that now holds the test |
| `docs/STATE.md` | its suite line says verify passes and how many `todo` (`docs.test.mjs` checks only that count) | | **unchanged**: no count moves |

**Which guards read a value this changes?** `docs.test.mjs:121-133` reads `package.json`'s `version`, which this doesn't touch (only `scripts`). The STATE `todo` count is unchanged. `package.json` is code under ZQ1, not docs.

**Where does each new thing run?** `verify:docs`: locally, and CI's docs job. The area runs: locally only. The shards: CI only, though `node tools/test-run.mjs shard 2/4` runs locally too.

**What text points at it?** `CLAUDE.md`, `WORK-ORDERS.md:373`, the skills above, `README.md:33-34`, `CONTRIBUTING.md:32`, and `CLAUDE.md`'s *Where things live* `tools/` line.

## 6. Read first

- `CLAUDE.md`: *Commands*, *The baseline before a change*, *Working rhythm*.
- `SCHEMA.md` §4: Decisions 131 (tiers) and 167 (the private mirror in CI).
- `docs/WORK-ORDERS.md`: *What a work order contains*, *The prompts*.
- `.github/workflows/verify.yml`, `release.yml`; `package.json`'s scripts; `tests/harness.mjs` and `tests/smokekit.mjs` (what a split file imports).

## 7. Out of scope

- **Any change to what a test checks.** A split moves tests between files. It never edits, merges, drops or renames a test.
- **Making the sheet tests faster** (ZQ5): a wish, not this order.
- **`release.yml`** and **phone-check** (it runs by hand, outside `npm test`).
- **Choosing tests by what a diff touches**, in CI or locally (§3's first rejection).

## 8. The shapes

```js
// tools/test-run.mjs — node tools/test-run.mjs <cmd>
//   area <sheet|table|wizard>  → prints the fast four + the area's files, then runs them (--list prints only)
//   shard <i>/<n>              → prints the files for shard i of n, from tests/timings.json, slowest first to the lightest
//   time                       → runs each file alone, writes tests/timings.json (seconds, one decimal, sorted by name)
// Deterministic: ties break by file name. A file missing from timings.json weighs 60.
```

## 9. What a person sees

Nothing in the app. In GitHub, a docs-only PR shows one check, **docs**, whose summary reads: *Docs-only change: the docs checks ran, the full suite didn't (paths: docs/plans/x.md, …).* A code PR shows **verify (1/4)** … **verify (4/4)**.

## 10. Worked examples, as named tests and runs

In `tests/docs.test.mjs`:
1. **`test runs: the four shards hold every test file exactly once`**. Mutation: drop a file from `shard`'s output, then give one file to two shards. Each must fail.
2. **`test runs: timings.json names no missing file`**. Mutation: add a key for a file that doesn't exist.
3. **`test runs: every test file is in an area or the whole-suite list`**. Mutation: add an empty `tests/smoke-zzz.test.mjs`. It must fail until the file is listed.
4. **`test runs: the docs-only rule`**. The path rule (ZQ1) lives in `tools/test-run.mjs` as an exported function the workflow calls (`node tools/test-run.mjs docs-only <files>` → exit 0/1). The test pins it: `["docs/plans/x.md"]` → docs-only; `["README.md","docs/a.md"]` → docs-only; `["CHANGELOG.md"]` → not; `["docs/a.md","src/ui/app.js"]` → not; `["private"]` → not; `[]` → not (an empty diff runs everything).

Runs, pasted into the PR:
5. **The count holds.** `npm test`'s `# tests` and `# todo` are the same on `main` and on the branch (the pre-flight's `main` is the number to match; record it in step 1).
6. **CI, both ways.** Push a docs-only commit to a scratch branch, open it as a draft PR, and paste the docs job's summary. Then the real PR's four jobs with their times. Close the draft unmerged.
7. **Local, before and after.** `npm run verify`'s wall time on `main` and on the branch, on the same machine with nothing else running (check `Get-Process node` first).

## 11. Tests beyond the examples

- Mutation-test each guard (examples 1–4) against the pre-fix code, and list each in the PR with the test that catches it. Restore every mutated file in a `finally` or `trap` and `cmp` it against the saved copy.
- After the splits: each new file runs alone (`node --test tests/<new>`) and passes, and the combined count matches.
- `verify.yml` is linted by running it: the draft PR in example 6 is the test of the docs path, and this PR is the test of the matrix.

## 12. Steps

1. `git submodule update --init private`. On a branch fresh from `origin/main`, run `npm run test:fast`, then the full `npm run verify` **once**, recording its `# tests`, its `# todo` and its wall time.
2. `tools/test-run.mjs` (`list`, `area`, `shard`, `docs-only`, `time`) and `tests/timings.json` from this order's table (the full 31 rows are in the drafting PR's description). The `package.json` scripts. Then examples 1–4, failing first. `npm run test:fast`.
3. The splits (ZQ3), one file at a time. After each: that file's two halves alone, then `npm run test:fast`. Then `npm run test:time` to re-time all of them, and commit the new `timings.json`.
4. `verify.yml`: the `changes` job, the docs job and the matrix. Example 6's draft PR.
5. The words: `CLAUDE.md`, `WORK-ORDERS.md`, the skills, `README.md`, `CONTRIBUTING.md`, the two test comments, and `CLAUDE.md`'s *Where things live* `tools/` line.
6. The full `npm run verify` (watch it with a timeout over 17 minutes, or run it in the foreground). Then the docs and the decision (§14).

## 13. Stop and ask

Stop and ask the conductor if:
- a split needs a test edited, renamed or merged to run in its new file;
- the counts in example 5 don't match;
- a test outside `docs.test.mjs` reads a docs path the pre-flight didn't list (finding 6): ZQ1's line moves, and that's Ken's;
- a shard can't run because a file depends on another file having run first (an order between test files is a hidden coupling: say which);
- the private checkout can't be kept as Decision 167 has it in a matrix job.

**Not stops:** `docs.test.mjs` failing until N's INDEX line is in; CI's time on the PR landing above the estimate (report it, with the four jobs' times).

## 14. Close-out

`close-the-session`, *Rule or shape* tier, with no version bump and no CHANGELOG line (no player sees it):
- Decision **N** pasted whole, with *Built* filled in. Its INDEX §3 line goes under the process decisions, beside 131.
- A `docs/log/2026.md` entry: the before and after times. A `docs/log/shipped.md` row. STATE only if a line in it is now wrong.
- The wish for ZQ5, with its `W` id, in `WISHLIST.md`.
- **PR title:** `ci: verify checks what a change can break, in parallel (Decision N)`.
- **PR body:** the template's sections, plus *Where the order didn't fit*; the guards failing first; each mutation and its catching test; examples 5–7's numbers; the draft PR's link and its docs summary.

**Review checklist** (beyond the suite passing):
- Run `node tools/test-run.mjs shard i/4` for i = 1–4 yourself, and check the union is every `tests/*.test.mjs` exactly once.
- Diff the split files against the originals: every `test(` name present once, and no test body changed (`git diff --stat -M` and a name-list comparison).
- Read the docs-only rule against finding 6's grep, re-run at the PR's head.
- Check that a push to `main` takes the matrix, not the docs job (the workflow's `if:`).
- Check that every matrix job keeps Decision 167's private checkout, token and `persist-credentials: false`.
- Check that `CLAUDE.md` still says, plainly, that `main` always passes the full verify.

## 15. Handing it over

Use the two prompts in `WORK-ORDERS.md`, with this order's path: `docs/plans/faster-verify.md`. Add the conductor's notes path. This order's traps:

- **A split moves tests and never touches them.** Compare the name lists before and after, not just the count.
- **`CHANGELOG.md` is code here** (finding 6). It doesn't match `*.md`'s docs-only rule.
- **An empty diff is not docs-only.** If the base can't be found, run everything.
- **Say what was skipped.** The docs job writes its summary line every time (Decision 167's lesson).
- **The private checkout goes in every matrix job,** exactly as `verify.yml` has it today.
- **Time on a quiet machine.** Another session's verify on the same cores inflates every number, so check `Get-Process node` before example 7's runs.
- **`npm run verify` still takes 10–17 minutes until the splits land.** Watch it with a timeout over that, or run it in the foreground.
- **Restore mutated files in a `trap` or a `finally`, and `cmp` them.**

A docs-only probe for the verify workflow; this branch is closed unmerged.
