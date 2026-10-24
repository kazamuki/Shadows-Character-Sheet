# Security policy

The Shadows character sheet runs in your browser, from a folder on disk or from
[charactersheet.shadowsrpg.com](https://charactersheet.shadowsrpg.com). It makes
no network requests and has no accounts or server. The risky part is the files:
character, table and pack files are made to be shared, so the app treats every
one it opens as untrusted input.

## Reporting a problem

**Report it privately, not in a public issue.**

- **On GitHub:** the repository's **Security** tab → **Report a vulnerability**.
- **By email:** kazamuki+github@gmail.com (Ken, who maintains the app).

Please include what you found and the app version shown in the page footer.
If a file triggers it, attach the file. You'll get a reply from Ken, and once
the problem is fixed and released you'll be credited in the advisory, unless
you'd rather not be.

## In scope

- A `.shadows.json`, `.shadows-table.json` or `.shadows-pack.json` that runs
  script, reaches outside the character when it's opened or undone, crashes the
  app, or corrupts other saved characters.
- Anything that makes the app send a network request, or load code or content
  from somewhere other than its own folder.
- The live site, and the build and release workflow that publishes it.
- Unreleased rulebook or Threat Codex text showing up anywhere public, in this
  repository or the built app. That material lives in a private repository.
  Tell us privately, and don't quote it in the report.

## Not security issues

Rules questions, balance and ordinary bugs are welcome as regular issues,
using the **Bug or playtest report** template.

## Supported versions

Only the latest release, the one on the live site, gets fixes. If you're on an
older copy from a GM, check whether the problem still happens on the live site
before you report it.
