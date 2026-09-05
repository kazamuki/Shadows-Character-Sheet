<!--
  MIRROR FOLDER — do not edit the files in here in place.

  These are dated snapshots of chapters from the in-progress Shadows CRB v4,
  pulled so a session working on data, the engine, or docs can check current
  rules text without cross-project context — the same reason
  docs/reference/GUIDE_Shadows_Voice.md exists (Decision 69). This folder
  follows that pattern (Decision 84).

  The CRB is the master. If a file here disagrees with the live document,
  this mirror is stale — re-pull it, don't edit around it or reconcile in
  place.
-->

# CRB v4 mirror

## Source

Each file mirrors one chapter of the CRB v4 WIP, which lives under the same
OneDrive account as any workstation this repo is worked from:

```
%OneDrive%\Documents\Gaming\Shadows\Core Rule Book\CRB in progress\CRB v4\<same filename>.docx
```

`%OneDrive%` is not this repo's path — it's an environment variable Windows'
OneDrive client sets on every machine it's installed on, pointing at that
machine's own local sync root. That's why the path above has no drive letter
or username in it: it resolves correctly on any workstation signed into the
same OneDrive account, without translation.

## Re-pulling a file

```bash
pandoc -f docx -t gfm --wrap=preserve -o docs/reference/crb/<name>.md "$OneDrive/Documents/Gaming/Shadows/Core Rule Book/CRB in progress/CRB v4/<name>.docx"
```

Pandoc overwrites the whole file, so re-add the file's own one-line mirror
comment at the top afterward and bump the pull date in the table below.

## What's mirrored, and why

| File | CRB chapter | Why it's here |
|---|---|---|
| [020_Synergy_System.md](020_Synergy_System.md) | Ch.2 — the dice/stat system | `statMod()`, beyond-10 scaling (the unnumbered flag in `SCHEMA.md` §5) |
| [030_Core_Mechanics.md](030_Core_Mechanics.md) | Ch.3 — checks, HP/HL, Essence/Breaker checks | damage and Pain Level math already on the sheet |
| [040_Character_Creation.md](040_Character_Creation.md) | Ch.4 — stat rolls, derived attributes | F1, F2, F8 |
| [041_Archetypes.md](041_Archetypes.md) | Ch.4.1 — archetypes, Milestones | F5, F6, F7, F9, F13 |
| [042_Skills.md](042_Skills.md) | Ch.4.2 — skill catalog | source of the merged data (Decision 55); cross-check for F11 |
| [043_Advantages.md](043_Advantages.md) | Ch.4.3 — advantages | source of the merged data (Decision 55); cross-check for F11 |
| [044_Disadvantages.md](044_Disadvantages.md) | Ch.4.4 — disadvantages | source of the merged data (Decision 55); cross-check for F16 |
| [054_Conditions_and_Recovery.md](054_Conditions_and_Recovery.md) | Ch.5.4 — conditions, recovery | Pain Levels, damage, recovery — already on the sheet |
| [Gear.md](Gear.md) | equipment chapter | future loadout data; the open Natural Armor / Thick Skin question |

Not mirrored (lower value for data/engine work as of this pull): `010_Onboarding`
(lore/voice, not mechanics), `050_Playing_the_Game`, `051_Social_Encounters`,
`052_Environmental_Encounters`, `053_Combat_Encounters` (GM procedure, not yet
reflected in sheet mechanics), `055_Downtime` (currently 43 lines — thin
because the Advancement section it would need, F12, hasn't been written yet).
Pull one of these the same way, the day it actually gates work.

**Pulled 2026-09-04.** Converted with `pandoc -f docx -t gfm --wrap=preserve`.
