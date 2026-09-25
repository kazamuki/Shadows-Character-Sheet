---
name: cut-a-release
description: Release the Shadows character sheet, i.e. put what's under CHANGELOG's [Unreleased] heading on the live site (charactersheet.shadowsrpg.com) and a GitHub Release. Use when Ken asks to release, ship, tag or deploy a version. Works from a cloud session.
---

# Cut a release

`CLAUDE.md` → **Working rhythm** says releasing is a rename, a regenerate, then
the release workflow. The version itself was bumped when the work was done
(`npm run bump`), not here.

## 1. On a branch from an up-to-date main

```bash
npm run release:prep            # "## [Unreleased] — app X" → "## vX — <today>", regenerates What's new
```

Read the section it dated (`node tools/release.mjs notes`): it becomes the
GitHub Release's notes as written, and players read it in **What's new**.
Player voice, no decision numbers or audit ids (CLAUDE.md, *The changelog*).

In `docs/STATE.md` §5, the "live site is vX" sentence names the new version.
That's the only STATE edit a release makes.

```bash
npm run verify
npm run release:check           # expects the tag to be free
```

Commit (`docs(changelog): X's section takes its tag's name`), open the PR,
merge it once CI passes.

## 2. Run the workflow, from main

GitHub → Actions → **release** → Run workflow, on `main`, with the version.
Or, where `gh` is signed in:

```bash
gh workflow run release.yml --ref main -f version=X.Y.Z
gh run watch
```

It runs `release:check` again on main, tests and builds once, creates the
`vX.Y.Z` tag and the Release with both HTML files attached, and deploys Pages.
Tick **dry run** to try it on a branch without releasing.

Pushing a `vX.Y.Z` tag from a machine still works and does the same thing.

## 3. Confirm

Load charactersheet.shadowsrpg.com and read the footer: it should say the new
app version. If it doesn't, compare against STATE before debugging anything.

## If the check refuses

It names each problem. The usual ones: the heading is still `[Unreleased]`
(run `release:prep`), What's new is stale (`npm run changelog`), or the tag
exists. A released version is never re-tagged: bump instead.
