# Plan — Shadows accounts: sign in, your sheets anywhere, join a table

**Status:** proposed 2026-10-28 by Claude (Opus), from a planning talk with
Ken. **Not to be built until GM mode's plan ([`gm-mode.md`](gm-mode.md)) is
done** (Ken, 2026-10-28). Ken answered the first eight questions that day (§5,
NQ1–NQ8). The rest have defaults. The next step is approving the plan, and
after that comes N0's setup, which is Ken's work and needs no work order.
**Tier of this document:** *Docs*. Each session names its own tier, and every
session except N0 is *Rule or shape*.

Ken, 2026-10-28: four wishes, which together are **W138** and W29's stages
2–3:

1. **Shadows accounts.** Sign in with Discord, for players and GMs. Store
   only what's needed: the Discord id and a name.
2. **Join a GM's table** with an account.
3. **Hand a sheet to the table directly** rather than passing
   `.shadows.json` files around (GM mode's seats, S3b).
4. **Keep characters and tables online**, so another browser or computer can
   open them.

Sessions are `N1`… (N for Network). Questions are `NQ`_n_.

---

## 1. What it must respect

- **Constraint 1 stays.** The folder copy works from `file://` with no
  network, exactly as it does today. It can't sign in, because Discord's
  login returns to a fixed `https://` address and a page opened from disk
  has none. Ken, NQ2: that's fine. Accounts are an extra on the hosted site
  and never a requirement (W29's rule). This **replaces Decision 137 in
  part**: the hosted page makes requests, only to its own `/api/`, and only
  once the player chooses to sign in.
- **The browser's copy is still the working copy.** The cloud copy is a
  backup that syncs. Play keeps working with the wifi down, and a save that
  can't reach the server waits and says so.
- **The character file doesn't change shape.** The server wraps it
  (`{ owner, rev, updatedAt, character }`), so the character schema doesn't
  move for this plan. The table file is treated the same way.
- **`migrate()` is still the gate** (constraint 10, Decision 124). The server
  stores files and checks who's asking. It doesn't run the engine: a Worker
  gets 10 ms of CPU per request, and it doesn't need it. Every copy that
  comes down passes `migrate()` or `migrateTable()` on load, as a file does
  today.
- **The player owns the character** (W29). The GM reads it and never writes
  it. GM changes travel as dispatches the player accepts.
- **It ships switched off** (Decision 173) behind its own flag,
  `FEATURES.accounts`.
- **The server is its own codebase**, `worker/`, outside `src/`. The rule
  against ES modules and the build guards are for the app that runs from
  disk, and they stay that way. The worker gets its own tests, run with
  Cloudflare's local test tools.

## 2. The shape

**One address, the app and its server together.** The sheet stays at
`charactersheet.shadowsrpg.com`. That domain's DNS moves to Cloudflare (Ken,
NQ1, with Scott, who owns it). The page stays on GitHub Pages behind
Cloudflare's proxy, and a Worker answers `/api/*` on the same host. Keeping
one origin means:

- the login cookie is first-party, so Safari and Firefox don't block it;
- there's no CORS to configure;
- players' browser saves stay where they are (localStorage belongs to its
  origin, so moving the app to a new address would leave every saved
  character behind);
- the release workflow (Decision 138) deploys the page as it does now. The
  Worker gets its own deploy.

**The pieces, all on Cloudflare's free plan** (checked 2026-10-28; a busy
table makes a few hundred requests a night):

| Piece | Free allowance | Holds |
|---|---|---|
| Worker | 100k requests a day, 10 ms CPU each | Login, permissions, size caps |
| D1 (SQLite) | 5M rows read and 100k written a day, 500 MB per database | Accounts, tables, seats, revisions, invites |
| R2 | 10 GB, 1M writes and 10M reads a month, downloads free | The character and table files |
| Durable Objects | 100k requests a day | Nothing yet: live push, if it's ever wanted |

Since 2026-09-01, D1 queries **fail** past the daily limit instead of being let
through. The Workers Paid plan ($5 a month) lifts every limit above if it
ever matters.

**Login.** Discord OAuth, `identify` scope only (no email). The Worker swaps
the code for the user's id and name, stores them, and sets its own session
cookie (HttpOnly, Secure, SameSite=Lax). Discord's token is thrown away. The
client secret lives in Worker secrets. The stored id is Discord's numeric id,
because usernames change.

**Not quite "no PII".** A stable Discord id counts as personal data under
GDPR, and characters carry free text (names, logs, notes). "As little as we
can" is achievable: an id, a display name, and the files the player chose to
store. That still needs a short privacy page, **Download everything** and
**Delete my account** (which removes everything, at once).

**A table's private parts stay private.** A GM's table holds the Codex and
GM-only notes. A player at that table receives only their own piece: their
seat, their dispatches, the table's name. That piece is **stored separately**
from the GM's table file, so the server never has to filter a big file
correctly to keep a secret.

**The API**, W29's sketch made specific:

```
GET    /api/me                         who am I (or 401)
POST   /api/logout · DELETE /api/me    sign out · delete everything
GET    /api/me/export                  every file I own, zipped

GET    /api/characters                 my characters: tag, name, rev, updatedAt
GET    /api/characters/:tag            one, latest
PUT    /api/characters/:tag            { baseRev, character } → { rev } or 409 { theirs }
DELETE /api/characters/:tag

GET|PUT|DELETE /api/tables/:id         the GM's own table file, same revision rule
POST   /api/tables/:id/invites         GM: a join link → { code, expires }
POST   /api/join/:code                 player: ask to join → pending
POST   /api/tables/:id/seats/:seat     GM: approve, seating a character
DELETE /api/tables/:id/seats/:seat     either side: leave, which removes the GM's access
GET    /api/tables/:id/seats/:seat     GM: that character's latest copy, read-only
POST   /api/tables/:id/seats/:seat/dispatches   GM → player inbox
```

**When two copies clash: pick one** (Ken, NQ7). A save carries the revision
it started from. If the server holds a newer one, it refuses (409). The
device that's behind shows both copies (name, last change, how many changes)
and the player keeps one. The other is downloaded as a file first, so
nothing is lost. W38 (two tabs) is the same problem inside one browser, and
its `storage`-event fix is worth building first.

## 3. Sessions

Nothing here starts before GM mode's plan is done, and in particular S3b
(seats) and the dispatch. N4 and N5 carry those same objects, so they're
built from files first and the network layer comes after.

| Session | What | Tier | Waits on |
|---|---|---|---|
| **N0** | Setup: shadowsrpg.com's DNS on Cloudflare, the Discord app (made under a Discord *team*, so it can move to GDG), the privacy page, `worker/` scaffolded and deployed with `/api/health` only | Docs / infra | Ken; Scott for the DNS |
| **N1** | Sign in and out, `/api/me`, Delete my account, Download everything, the `FEATURES.accounts` switch, the "Signed in as" chrome | Rule or shape | N0 |
| **N2** | Your characters online: save on change (debounced), the list on Home, open from another device, pick one on a clash | Rule or shape | N1 |
| **N3** | The GM's tables online, the same way | Rule or shape | N2; GM mode done |
| **N4** | Join a table: invite link or QR, the GM approves, either side leaves | Rule or shape | N3; S3b |
| **N5** | Seat an online character: the GM reads its latest copy, leaving removes it, dispatches arrive in the player's inbox | Rule or shape | N4; the dispatch |
| **N6** | The Codex delivered to GMs (NQ8) | Rule or shape | Ken: NQ8 |
| later | Live push over a Durable Object, if a table asks for it (GQ19 says not yet) | — | A table asking |

Each session names its decisions as "the next free number" (`CLAUDE.md`,
*Decisions*). N1 marks Decision 137 superseded in part. N1's guard is that
`dist/` makes **no request to an absolute URL**, only relative `/api/`, and
only after a sign-in click. That's mutation-tested against a build that
fetches at load.

## 4. What this costs to get wrong

This is the project's first attack surface. A permissions bug means one
player reads another's sheet, or a player reads the GM's Codex. So:

- every `/api/` route checks the session **and** that the caller owns or is
  seated at the thing it's asking for, with a worker test for each refusal;
- a size cap on every PUT (NQ11), and a rate limit per account;
- a security review of `worker/` before `FEATURES.accounts` turns on;
- D1's Time Travel restore and a nightly R2 copy as backups.

## 5. Questions

**Answered by Ken, 2026-10-28:**

| # | Question | Answer |
|---|---|---|
| NQ1 | Which domain hosts the app and the server? | `charactersheet.shadowsrpg.com`, its DNS moved to Cloudflare. The domain is Scott's: he moves it or lets Ken manage the DNS |
| NQ2 | Is it OK that the folder copy can't sign in? | Yes |
| NQ3 | Who owns the accounts and hosting? | Ken now, GDG once it's an LLC. So the Discord app is made under a team, and the Cloudflare account is one that can be handed over |
| NQ4 | Players without Discord? | Accounts are an enhancement. Files still work |
| NQ5 | How long is data kept? | A year since the last sign-in. Without an email there's no way to warn anyone, so every sign-in shows "kept until …", and Download everything is one click away |
| NQ6 | Does the GM keep a sheet after its player leaves? | No. While the player is seated, the GM can read it. Leaving or revoking ends that |
| NQ7 | Two copies clash? | Pick one. The player owns the character, so the player picks |
| NQ8 | Deliver the Codex through accounts? | Maybe. Ken isn't sure how secure that is (default below) |

**Open, with the default the build takes:**

| # | Question | Default |
|---|---|---|
| NQ8 | **The Codex online.** The server can keep it in a private bucket and hand it only to accounts on a GM list Ken keeps. Once downloaded, the GM has the file, as with a pack today: this isn't DRM. What it adds is no emailing files, knowing who has it, an end to updates for someone removed, and a watermark (the pack carries the downloader's id) so a leaked copy is traceable. The risks: an auth bug, or a leaked admin key, exposes it, and the private repo's content now lives with a second provider | Not in N1–N5. N6 with a hand-kept GM list and the watermark; Patreon tiers as a later idea |
| NQ9 | Do the GM's tables go online too (N3), or only characters? | Yes, both |
| NQ10 | At a table, do players see each other's sheets? | No. Only the GM does |
| NQ11 | A cap per file, and per account? | Measure the largest real files first. Until then 1 MB a character, 5 MB a table, 50 characters and 10 tables an account |
| NQ12 | Who can run a table? | Any signed-in account |
| NQ13 | What name does the GM see? | The Discord display name, which the player can change in the app |
| NQ14 | Is a signed-in player's character saved online automatically, or only when they ask? | Ask once per character ("Keep Rook online?"), then automatic |
