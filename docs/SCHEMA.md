# Shadows Digital Character Sheet — Schema & Decision Log

**Phases 0-3 complete · 3.1 (sheet UX + iconography) · 3.2 (sheet fit & finish) · 3.3 (audit trail, undo & admin mode) · 3.4 (repository restructure) complete** · Character schema 0.4 (game data 0.3) · Ruleset target: CRB v4 (WIP)
Last updated: 2026-08-29 (CRB v4 content pass — Skills, Advantages, Disadvantages)

This document is the project's memory. It defines the file architecture, the two
data schemas (game data and character), the locked design decisions, the open
flags for Deighton, and the build roadmap. Any session of work on this project
should start by reading this file.

---

## 1. Architecture

Content, rules, and presentation are separated so game data can change without
touching the app. Since Phase 3.4 (Decision 54) these live as separate files
under `src/`, loaded by a shell in fixed order: data → icons → engine → ui.

| File | Role | Who edits it |
|---|---|---|
| `src/data/shadows-data.js` | All game content: stats, skills, adv/disadv, power levels, archetypes. JSON wrapped in `window.SHADOWS_DATA = { ... }` (the wrapper exists because browsers block `fetch()` of local `.json` files when an HTML file is opened from disk) | Designers, in any text editor |
| `src/data/shadows-icons.js` | All iconography as inline-SVG strings on `window.SHADOWS_ICONS` (`stats` = brand set keyed by stat/derived id; `ui` = free-to-use chrome icons keyed by name). Same `<script>`-wrapper reason as the data file (see below) | Asset pipeline / designers |
| `src/engine/engine.js` | The pure rules engine. Reads `SHADOWS_DATA`, returns values, **never touches the DOM** — it is loaded in a bare VM by the test suite | App maintainers |
| `src/ui/app.js` | The app: creation wizard, sheet view, session tracking. Renders off the engine, never hardcodes content | App maintainers |
| `src/styles/shadows.css` | Brand tokens and all styling | App maintainers |
| `index.html` | A 31-line shell — markup and `<script src>` tags only. No inline logic, no inline styles | Structural changes only |
| `*.shadows.json` | One character per file. Exported/imported through the app. Portable, player-owned | The app (players via UI) |

**Why icons are a `.js` file, not loose `.svg` files (Phase 3.1 decision).** Three
options were on the table: (a) loose `.svg` files referenced by path, (b) an SVG
sprite via `<use href="sprite.svg#id">`, (c) inline-SVG strings in a `.js` module.
Opening the app from disk (`file://`) rules out (a) and (b): an `<img src="x.svg">`
loads fine from `file://` but **cannot be recolored by CSS** (the whole point of
the brand icons is that they inherit the palette via `currentColor`), and external
`<use>` sprites are **blocked by browsers from `file://`** (same origin/fetch
restriction that forced the `SHADOWS_DATA` wrapper). Option (c) — inline strings on
a global, loaded with `<script src>` — recolors freely, works from `file://`, and
folds into the single-file package exactly like `shadows-data.js`. Icons resolve by
key with a graceful `""` fallback, so a missing icon never breaks the sheet and
adding a stat in `shadows-data.js` stays app-free.

**Core principle: inputs are stored, derived values are computed.** A character
file stores BOD = 7; it never stores the +1 modifier, the 7 Health Levels, or
the 35 HP. The app computes those from game data every time. Change a formula in
`shadows-data.js`, and every character updates on next load. This is what makes
the system modular.

**Versioning:** both files carry version stamps. On character load, the app
compares the character's `gamedataVersion` to the loaded game data and surfaces
mismatches (e.g., a skill the character has that no longer exists) instead of
failing silently.

**Ship path:** `npm run build` inlines every local asset — data, icons, engine,
ui, styles — back into a single `dist/shadows-character-sheet.html`. One
distributable file, same architecture. This was a manual step until Phase 3.4
made it a command (Decision 54); `npm run check` verifies the inline without
writing.

---

## 2. Game Data Schema (`shadows-data.js`)

Top-level shape. Every content entry supports an optional `"flagged": true` +
`"flagNote": "..."` for unresolved design questions.

```js
window.SHADOWS_DATA = {
  meta: {
    schemaVersion: "0.3",
    rulesetVersion: "CRB v4 WIP",
    updated: "2026-06-11"
  },

  // ── Stats ────────────────────────────────────────────────
  stats: [
    { id: "BOD",  name: "Body",       description: "..." },
    { id: "REF",  name: "Reflex",     description: "..." },
    { id: "MOB",  name: "Mobility",   description: "..." },
    { id: "INT",  name: "Intelligence", description: "..." },
    { id: "TECH", name: "Tech",       description: "..." },
    { id: "COOL", name: "Cool",       description: "..." },
    { id: "MAG",  name: "Magnetism",  description: "..." },
    { id: "EMP",  name: "Empathy",    description: "..." }
  ],
  statRules: {
    base: 1,
    max: 10,
    // v4 modifier curve: 1→-3, 2→-2, 3→-1, 4–6→0, 7→+1, 8→+2, 9→+3, 10→+4
    modifiers: { "1": -3, "2": -2, "3": -1, "4": 0, "5": 0,
                 "6": 0, "7": 1, "8": 2, "9": 3, "10": 4 }
  },

  // ── Derived attributes ──────────────────────────────────
  // formula type "sumOfModifiers": base + Σ modifier(stat) for listed stats
  derived: [
    { id: "TOL",  name: "Tolerance", type: "sumOfModifiers",
      base: 1, floor: 1, inputs: ["INT", "COOL", "EMP"] },
    { id: "WILL", name: "Will", type: "sumOfModifiers",
      base: 1, floor: 1, inputs: ["BOD", "INT", "EMP"] },
    { id: "SAN",  name: "Sanity", type: "percent",
      formula: "EMP * 10", floor: 10, cap: 95 }
  ],

  // ── Resources ────────────────────────────────────────────
  resources: {
    luck: {
      startingValue: 2,
      buyUpWith: "characterPoints",
      cpCostPerPoint: null,          // FLAGGED — see §5
      exemptFromBoostCap: true       // confirmed by Ken 2026-06-11
    },
    healthLevels: {
      levelsPerBOD: 1,               // 1 Health Level per point of BOD
      hpPerLevel: 5
      // wound penalties per level: extract from WIP in Phase 1
    },
    credits: { /* starting roll lives on the power level entry */ },
    sfr: { /* SFR / Blood Pool — archetype-dependent, Phase 1 */ }
  },

  // ── Campaign Power Levels ────────────────────────────────
  powerLevels: [
    { id: "street",  name: "Street Level",
      statPoints:  { base: 30, roll: "2d10" },
      skillPoints: { base: 40, roll: "3d10" },
      maxSkillRank: 4, maxPowerRank: 2, maxBoost: 2,
      characterPoints: 10,
      startingCredits: { roll: "3d4", multiplier: 100 },
      description: "..." },
    { id: "heroic",  name: "Heroic",
      statPoints:  { base: 40, roll: "3d10" },
      skillPoints: { base: 45, roll: "3d10" },
      maxSkillRank: 5, maxPowerRank: 3, maxBoost: 3,
      characterPoints: 15,
      startingCredits: { roll: "4d4", multiplier: 100 },
      description: "..." },
    { id: "shadows", name: "Shadows",
      statPoints:  { base: 50, roll: "4d10" },
      skillPoints: { base: 50, roll: "3d10" },
      maxSkillRank: 5, maxPowerRank: 4, maxBoost: 4,
      characterPoints: 20,
      startingCredits: { roll: "5d4", multiplier: 100 },
      description: "..." },
    { id: "wcd",     name: "World Coming Down",
      statPoints:  { base: 60, roll: "5d10" },
      skillPoints: { base: 55, roll: "3d10" },
      maxSkillRank: 6, maxPowerRank: 5, maxBoost: 5,
      characterPoints: 25,
      startingCredits: { roll: "5d10", multiplier: 100 },
      description: "..." }
  ],

  // ── Skills ───────────────────────────────────────────────
  // Check math: 1d10 + Rank + Primary Stat (full score) + Synergy Bonus
  // (modifier of synergy stat). Untrained: 1d10 + Primary Stat only.
  skills: [
    { id: "athletics", name: "Athletics",
      category: "general",            // general | combat | utility
      primaryStat: "BOD", synergyStat: "REF",
      flavorLine: "...",              // the CRB's one-line hook; populated in 0.3
      description: "...",
      covers: [ "..." ],              // bullets behind the skill's "?" expander
      notes: [ "..." ],               // (0.3) optional; the CRB's "Notes" block
      styles: [ { name: "Karate", bonus: "+1 Stun" } ]  // (0.3) Martial Arts only
    }
    // 36 skills: 11 combat / 9 utility / 16 general
  ],

  // ── Advantages & Disadvantages ───────────────────────────
  advantages: [
    { id: "rapid-healing", name: "Rapid Healing",
      cost: 5, maxRank: 3, universal: false,
      description: "...", rankNotes: ["x2", "x3", "x4"] }
    // ...
  ],
  disadvantages: [
    { id: "paranoia", name: "Paranoia",
      pointsGranted: 3, maxRank: 1,
      description: "..." }
    // ...
  ],

  // ── Archetypes (generic, designer-fillable) ─────────────
  // Mirrors the "Reading Archetypes" six-block structure exactly.
  archetypes: [
    {
      id: "arcanist", name: "Arcanist",
      status: "draft",                // draft | tbd | final — app shows badge
      summary: "...", gameplayStyle: "...",
      primaryStats: ["INT", "COOL", "EMP"],

      campaignPowerScaling: {
        // keyed by powerLevel id; free-form trait grants the wizard applies
        street:  { grants: [ /* {type, target, value, label} */ ] },
        heroic:  { grants: [] },
        shadows: { grants: [] },
        wcd:     { grants: [] }
      },

      baselineTraits: [
        { id: "...", name: "...", description: "...",
          effects: [ /* machine-readable where possible, prose otherwise */ ] }
      ],

      specialization: {
        label: "Aberration",          // "Subtype", "Chrome Loadout", "Bloodline"...
        required: true,
        options: [
          { id: "...", name: "...", description: "...", grants: [] }
        ]
      },

      coreMechanic: {
        name: "Magic",
        description: "...",
        // Declares extra character-sheet panels this archetype needs.
        // The app renders panels generically from these declarations.
        panels: [
          { id: "disciplines", type: "rankedList",
            items: ["Evocation", "Enchantment", "Alchemy"],
            cappedBy: "maxPowerRank" },
          { id: "grimoire", type: "table",
            columns: ["Spell Name", "Discipline", "Target", "Threshold", "Materials"] }
        ]
      },

      powers: [
        { id: "...", name: "...", rank: null, drain: null,
          damage: null, duration: null, range: null, description: "..." }
      ],
      vulnerabilities: [ { id: "...", name: "...", description: "..." } ],

      growth: {
        minorMilestones: "shared",    // pulls from milestones.minorShared
        majorMilestones: [ /* archetype-specific entries */ ]
      }
    }
    // cyborg/biomech (status: "tbd" pending rewrite), professional,
    // vampire (tbd), werewolf (tbd)
  ],

  // ── Milestones ───────────────────────────────────────────
  milestones: {
    minorShared: [
      { id: "honed", name: "Honed", description: "..." }
      // Skilled, Improved, Talented, Redeemed...
    ],
    majorGeneral: [ /* incl. prerequisites: { majorCount, skills, advantages } */ ]
  },

  // ── Improvement Points ───────────────────────────────────
  ip: {
    statCost: "currentValue * 10",    // REF 6→7 = 60 IP (per REF_CRB)
    skillCost: "5 * currentRank",     // focused skills: 3 * currentRank (WIP Professional)
    rankCap: 10,                      // skills & powers cap at 10 via IP
    cannotRaiseDirectly: ["WILL", "TOL"]
  }
};
```

### The `panels` concept (why archetypes stay generic)

Archetypes differ wildly in what their sheet needs — a grimoire, an augment
manifest, forms, a blood pool. Rather than hardcoding a Cyborg page and an
Arcanist page, each archetype's `coreMechanic.panels` *declares* what UI it
needs from a small set of panel types (`rankedList`, `table`, `tracker`,
`text`). The app renders whatever is declared. When the Biomech rewrite lands,
you describe its NCI tiers and augment slots as panel declarations in the data
file — no app changes.

Panel types will be finalized in Phase 2 when we know what the five archetypes
actually demand. Where an effect can't be made machine-readable yet, it stays
prose and the sheet displays it as reference text — the app should never block
on un-modeled rules.

---

## 3. Character File Schema (`*.shadows.json`)

```js
{
  meta: {
    schemaVersion: "0.4",
    gamedataVersion: "0.2",          // version of shadows-data.js at save time
    created: "...", updated: "..."
  },

  identity: {
    name: "", age: null, build: "", hair: "", eyes: "", skin: "",
    archetype: "arcanist", specialization: "",
    history: ""                      // creation step 5: what shaped them
  },

  creation: {
    powerLevel: "heroic",
    rolls: {                         // the physical dice, entered by player
      statPoints: null,              // e.g. rolled 14 on 3d10 → pool = 40+14
      skillPoints: null,
      credits: null
    },
    // CP boost ledger — enforces Max Boost per *target*, not per pool
    boosts: [
      // { targetType: "skill"|"stat"|"power", targetId: "handgun", times: 2 }
    ],
    locked: false                    // true once creation completes
  },

  // Archetype-specific creation choices (added in Phase 2, schema 0.2).
  // Inputs only — derived effects are computed from these on render.
  archetypeChoices: {
    rolls: { focusStatBonus: null }, // physical dice for archetype scaling (e.g. Arcanist 2d4)
    focusAllocation: {},             // Arcanist: { INT: 3, EMP: 2 } — focus bonus spread (may exceed 10)
    statBonusAllocation: {},         // Werewolf: 1d4(+N) bonus spread (cap 10)
    aberrations: [],                 // Arcanist: chosen aberration ids
    subtype: null,                   // Professional subtype id (mirrors identity.specialization)
    focusedSkillPicks: [],           // Professional: "chosen at creation" focused skill ids
    naturalAdvantages: [],           // Professional: [{ id, rank }] — also mirrored into
                                     // `advantages` with notes:"natural", cost 0 CP
    disciplines: {}                  // Arcanist: CP-bought ranks { enchantment: 1 } (6 CP each;
                                     // Evocation starting rank from scaling table is NOT stored)
  },

  // Inputs only. base = creation value; ipe = points added via IP after.
  stats:  { BOD: { base: 5, ipe: 0 }, REF: { base: 6, ipe: 0 } /* ... */ },
  skills: { handgun: { rank: 4, ipe: 0 } /* trained skills only */ },

  advantages:    [ { id: "rapid-healing", rank: 1, notes: "" } ],
  disadvantages: [ { id: "paranoia", rank: 1, notes: "" } ],

  // Current-state trackers (max values are computed, never stored)
  trackers: {
    damage: 0,                       // total HP damage taken
    luck:   { bonus: 0, spent: 0 },  // bonus = CP/advantage buy-ups
    san:    { loss: 0 },             // current SAN = computed max − loss
    exhaustion: 0,
    sfr:    { spent: 0 },
    credits: { current: 800, ledger: [ { date, amount, note } ] },
    // (0.3) Manual adjustments — milestone benefits & un-modeled effects.
    // Stat-id targets cascade like any input; TOL/WILL/SAN/LUCK/HP apply flat.
    adjustments: [ { target: "BOD", amount: 1, note: "Honed", date } ],
    // (0.3) Generic archetype tracker panels (e.g. Tolerance Load, Blood Pool)
    panel: { "tolerance-load": { value: 0, max: null } }
  },

  // (0.3) Archetype table/toggle panel content — grimoire rows, augment
  // manifests, Werewolf form. Keyed by panel id, free entry by design.
  panelData: { grimoire: [ { "Spell Name": "...", "Discipline": "..." } ], form: "Human" },

  powers:  [ /* instances with per-character notes */ ],
  gear:    [ { name, type, notes } ],
  weapons: [ { name, type, damage, rof, capacity, ammo, features, notes } ],

  progression: {
    ip: {
      earned: 0,                     // legacy/manual base; counted as a grant
      log: [
        // (0.3) Journal entries carry a kind: "spend" | "grant".
        // Spends update the target's IPE atomically and are undoable;
        // versionCheck flags IPE/journal divergence on import.
        // { date, kind, amount, targetType, targetId, from, to, note }
      ]
    },
    milestonePoints: 0,              // manual MP only — session MP is computed
    milestones: { minor: [ { id, date } ], major: [ { id, date } ] }
  },

  // (0.3) Logging a session grants ipEarned (default 10, overridable),
  // 1 Milestone Point (toggleable), and refreshes LUCK (spent → 0).
  sessions: [
    { date: "", title: "", ipEarned: 10, milestonePoint: true, notes: "" }
  ],
  notes: "",                         // freeform character notes

  // (0.4) Audit trail — a reversible record of every play/admin action. Each
  // entry: { seq, date, kind, label, patch }, where patch is a compact diff
  // (scalars by path; arrays as append/removeAt/set) sufficient to restore the
  // prior state. Undo is last-in-first-out. Admin-mode free-edits log here too.
  audit: [
    // { seq, date, kind:"damage"|"ip"|"milestone"|"admin"|…, label, patch:[…] }
  ]
}
```

**Recalculation:** because only inputs are stored, an IP spend that bumps REF
6→7 automatically updates every REF-based skill total, Health Levels via BOD
synergies, WILL, and anything else downstream the next time the sheet renders.
No cascade logic to maintain — it falls out of the architecture.

---

## 4. Locked Decisions

1. **Ruleset:** CRB v4 per WIP files. v3.6 sheet is reference for *coverage*
   (what a sheet must display), not for rules. WIP_ beats REF_ on conflicts.
2. **Terminology:** stat pool = **Stat Points** (old "Character Points"
   column); old "Freebie Points" = **Character Points** (CP). "Max Freebie
   Boost" = **Max Boost**.
3. **Max Boost semantics:** after advantages are bought, leftover CP may boost
   powers, skills, or stats — but any single target may be boosted at most
   `maxBoost` times (anti-min-max throttle). Enforced via the `boosts` ledger.
   Table maximums (Max Skill Rank, Max Power Rank, stat cap 10) still apply on
   top.
4. **Costs at creation:** Stat Points 1:1 (stats start at base 1, max 10).
   Skill Points 1:1 up to Max Skill Rank. Advantages cost CP; disadvantages
   grant CP, **no cap** — design philosophy: do whatever you want, at a cost.
5. **LUCK:** everyone starts at 2. Buy-ups use CP, treated like an advantage
   purchase, **exempt from Max Boost**.
6. **Health Levels:** 1 HL per point of BOD, 5 HP per HL.
7. **Çredits:** player rolls physically, enters result; pool = table formula.
8. **Skill checks:** 1d10 + Rank + Primary Stat (full score) + Synergy Bonus
   (modifier). Untrained: 1d10 + Primary Stat only.
9. **Derived attributes:** TOL = 1 + INT/COOL/EMP mods (floor 1); WILL = 1 +
   BOD/INT/EMP mods (floor 1); SAN = EMP×10 (floor 10%, cap 95%).
10. **Hard caps:** the wizard enforces all table limits strictly. No
    warn-but-allow in v1.
11. **All rolls are physical:** the app never rolls dice for creation pools.
    Players enter what they rolled. (The Shadows experience includes the dice.)
12. **Supernatural restriction:** archetypes with `canPurchaseAdvantages:
    false` (Werewolf; Vampire assumed) cannot buy Advantages — the wizard
    must enforce this.
13. **Milestone cadence:** 1 Milestone Point per session; Minor at 5/15/25…,
    Major at 10/20/30…; 10 IP per session (WIP Professional).
14. **IP costs:** stat increase = current value ×10; skill rank = 5× current
    (Focused 3×); skills/powers cap at rank 10 via IPE; WILL and TOL cannot
    be raised directly.
15. **Archetypes:** generic six-block structure (Power Scaling, Baseline
    Traits, Specialization, Core Mechanic, Powers & Vulnerabilities, Growth &
    Milestones), designer-fillable, with `status` badges for tbd/draft content.
16. **(Phase 2)** Ranked Advantages cost `cost` **per rank** (Archery Master
    rank 2 = 12 CP). Disadvantages grant `pointsGranted` per rank.
17. **(Phase 2)** Professional natural advantages are stored as normal
    `advantages` entries with `notes: "natural"` and cost 0 CP — they render
    on the sheet like any advantage but never hit the CP ledger.
18. **(Phase 2)** Arcanist focus-stat bonus may push a stat past 10; the
    modifier curve extrapolates +1 per point above 10. Werewolf stat bonus
    allocates to any stat but respects the cap of 10.
19. **(Phase 2)** Arcanist Disciplines are purchasable in the CP step at
    6 CP/rank, capped at the power level's Max Power Rank. Evocation's
    starting rank comes from the scaling table and is computed, not stored.
20. **(Phase 2)** Aberration prose benefits display as reference text only;
    only structured fields (e.g. `tolBonus`) auto-apply to computed values.
    → Resolved in Phase 3 by Decision 26 (manual adjustments ledger).
21. **(Phase 2)** Common-spell *selection* is deferred to Phase 3; the wizard
    shows the computed count (TOL + 2d4) only. → Resolved by Decision 25.
22. **(Phase 2)** Engine normalizes legacy stat-id aliases in skill data
    (e.g. `BODY` → `BOD`) and degrades gracefully on unknown ids, surfacing
    a gold data-issue flag instead of crashing.
23. **(Phase 3)** Logging a session auto-grants the per-session IP (10 per
    WIP Professional cadence, **overridable per session**), 1 Milestone
    Point (toggleable), and refreshes LUCK — it only resets "when a session
    truly ends." Deleting a session removes its IP/MP from the totals.
    (Ken, 2026-06-12)
24. **(Phase 3)** Pain Level penalties are **applied** to every displayed
    skill-check total, with the reason shown inline (breakdown column +
    "Pain Lv N" chip) so the number is table-ready and explainable.
    (Ken, 2026-06-12)
25. **(Phase 3)** The Grimoire is a free-entry table. Free-form stays even
    after a spell catalog exists — players can improvise magic. A catalog
    slots in later as data without touching the sheet. (Ken, 2026-06-12)
26. **(Phase 3)** Un-modeled effects (milestone benefits, aberration prose,
    items) are applied through a **manual adjustments ledger**: stat-id
    targets cascade through everything downstream; TOL/WILL/SAN max/LUCK
    max/HP max apply flat. Milestone benefits stay prose + manual — except
    *Improved*, which prompts for the physical 2d10+15 roll and books it as
    an IP grant.
27. **(Phase 3)** The IP journal is the audit trail: entries are
    `spend` or `grant`; spends update the target's IPE atomically; the last
    entry is undoable; `versionCheck` flags IPE/journal divergence on
    import. Stat raises cost current value ×10 against the **computed**
    current value; WILL/TOL are blocked from direct raise.
28. **(Phase 3)** Character schema bumped to **0.3**. `migrate()` upgrades
    0.2 files on import/resume. `buildExport` seeds starting Çredits from
    the creation roll **only while the credits ledger is empty** — tracked
    balances are never overwritten.
29. **(Phase 3)** Milestone enforcement: Minor duplicates blocked until all
    five have been selected once; Major prerequisites are machine-enforced
    where structured (majorCount, skills any/all, advantages, milestone
    chains) and surfaced as gold "GM:" chips with a confirm step where
    prose (gear, notes, gmApproval).
30. **(Phase 3.1)** The locked sheet is **tab-driven**, not a single scroll.
    Once a character locks, the creation ledger (left rail) is dead weight and
    collapses; a horizontal tab bar becomes the primary nav. Nine tabs: **Main ·
    Skills · Traits · Archetype · Trackers · Progression · Session Log · Loadout
    & Powers · Notes**. The old single "Sheet" view split into the first four.
    Older saved files with `section:"overview"` migrate to `main` via a
    `LEGACY_SECTION` map; any unknown section normalizes to `main`. (Ken,
    2026-06-15)
31. **(Phase 3.1)** Iconography lives in `shadows-icons.js` (see §1). Two sets:
    the **brand stat set** (Get Dangerous Games, game-icons.net style, filled,
    recolored to `currentColor`) keyed by stat/derived id, and a **free-to-use
    UI set** (Lucide, **ISC license — no attribution required**, stroke style)
    keyed by semantic name for condition readouts and tabs. Brand icons appear
    in stat/derived grids and the Vitals rail; UI icons drive the condition
    cards (health/pain/sanity/luck/sfr/credits) and the nine tab glyphs. The
    stat→icon association is presentation, so it stays out of `shadows-data.js`.
    (Ken, 2026-06-15)
32. **(Phase 3.1)** The **Main** tab is a full-width "command console" — the
    duplicated Vitals rail is hidden *on Main only* (an `.app.main-tab` class
    collapses the grid to one column). Layout: a condition strip (the rail's
    replacement) across the top, then a two-column zone — Stats + Derived on the
    left, Combat skills (trained **and** untrained, so every combat roll is on
    hand) + a read-only Weapons quick-reference on the right. Identity drops to a
    collapsible at the bottom. The rail still shows on every other tab. Stacks to
    one column under 900px. (Ken, 2026-06-15)
33. **(Phase 3.1)** Fixed: the REF/Hand brand icon rendered as a solid blob.
    `hand.svg` used a full-canvas background **circle** (r≈256, opacity 1) rather
    than the transparent rect the other ten use; the normalizer now strips any
    full-canvas background shape (rect-path **or** circle) before recoloring.
34. **(Phase 3.1)** No schema bump. Icons are presentation; the character file
    (0.3) and game-data (0.2) schemas are unchanged. The pure engine
    (`/*ENGINE-START*/…/*ENGINE-END*/`) is byte-for-byte untouched — all Phase 3.1
    work is in the UI layer, so the 58 engine unit tests stand without rerun.
35. **(Phase 3.2)** **Full-width sheet on every tab.** The duplicated Vitals
    rail (the `aside`) retires the moment a character locks — `.app.sheet-mode`
    collapses the grid to one column and drops the 920px content cap sheet-wide.
    Main keeps its condition strip; every *other* tab gets a slim horizontal
    **vitals bar** (HP/Pain/SAN/LUCK/SFR/Ç/IP/MP) directly under the header. This
    supersedes Decision 32's "rail hidden on Main only" — the rail is now hidden
    across the whole locked sheet, recovering the right-hand whitespace. (Ken,
    2026-06-16)
36. **(Phase 3.2)** **Four-sphere stat layout on Main.** Stats cluster into
    Physical (BOD/REF/MOB) · Mental (INT/TECH/COOL) · Social (MAG/EMP) · Soul
    (TOL/WILL), rendered as four side-by-side columns (cells stacked vertically,
    top-aligned) with **no sphere labels** — grouping is read purely from
    whitespace. The separate "Derived" box is gone: TOL/WILL fold into the Soul
    column as value-only cells (no modifier), and HP/SAN/LUCK/SFR/Ç live *only*
    in the condition strip. **SAN is deliberately not a stat cell** — it appears
    once, as the live Sanity card, so it isn't duplicated. The grouping
    (`STAT_GROUPS`) is presentation and stays out of `shadows-data.js`. Drops to
    two columns under 540px. (Ken, 2026-06-16)
37. **(Phase 3.2)** **Vitals flyout drawer.** The creation rail's full readout
    (identity, conditions, IP/MP, all eight stats with mods, TOL/WILL/SAN) is
    available on demand from any tab via a "Vitals View" toggle on the bar; it
    slides in from the right over a scrim. Chosen over packing a stat strip into
    the bar — the bar stays a slim glance and the full reference overlays rather
    than squishing content. Scrim click, ×, or Esc closes it. State lives in
    `S.vitalsOpen`; the drawer element is reused (not recreated) so the transform
    animates and the open state survives data-driven re-renders. (Ken,
    2026-06-16)
38. **(Phase 3.2)** **Sticky in-header navigation.** The section tabs move out of
    the scrolling content into a **sticky** header that reads
    **`Shadows // <character name>`**; the active tab underlines at the header's
    lower edge. The old in-content "REGISTRY FILE · <NAME>" banner is removed as
    redundant with the header name. On narrow widths the nine tabs wrap to a
    second header row — accepted; shortening labels is the lever if a single row
    is ever required. (Ken, 2026-06-16)
39. **(Phase 3.2)** **Header overflow menu.** Home and Export move off the
    content into a kebab (⋮) menu pinned to the far right of the header, after the
    last tab. Opens on click; closes on outside-click, Esc, or item-select. Sheet
    actions are chrome now, not content. (Ken, 2026-06-16)
40. **(Phase 3.2)** **Collapsible page footer.** "NYTE CITY REGISTRY · GET
    DANGEROUS GAMES · data/ruleset/app-phase" moves out of the header into a slim
    fixed footer with a show/hide toggle; collapsed state persists to
    `localStorage` (`shadows.footer`). Content keeps bottom padding so the bar
    never covers it. (Ken, 2026-06-16)
41. **(Phase 3.2)** **Number-entry caret fix.** Roll inputs were `type=number`,
    and browsers refuse `setSelectionRange` on number inputs — so after each
    keystroke + re-render the caret snapped to position 0 and the next digit
    landed in front (typing "1" then "5" produced "51"). The five roll/archroll
    inputs are now `type=text inputmode=numeric pattern="[0-9]*"` (numeric keypad
    preserved); the oninput handlers strip non-digits, and the keep-focus helper
    restores the caret to the value's end. (Ken, 2026-06-16)
42. **(Phase 3.2)** **LUCK refresh confirmed — no change.** `Engine.logSession`
    already zeroes `trackers.luck.spent` (Decision 23) and the Log-session button
    calls it, so current LUCK returns to max on session log. Locked in by a new
    engine assertion; re-report if ever observed otherwise. (Ken, 2026-06-16)
43. **(Phase 3.2)** **Date-input theming.** `input[type=date]` now takes the
    themed dark input styling (`color-scheme:dark`, inverted calendar-picker
    glyph), fixing the white background / unreadable text on the Session Log date
    field. (Ken, 2026-06-16)
44. **(Phase 3.2)** **Skills aligned + per-skill descriptions.** Combat/Utility/
    General render as **one** fixed-layout table (`table-layout:fixed` + a shared
    `<colgroup>`) with category subheader rows, so Rank/Check/Breakdown align
    across all three categories. Each skill row carries a "?" that expands an
    inline detail row (description + "Covers:" from `shadows-data.js`); open state
    is tracked in `S.openSkills` and toggled without a full re-render. Extended to
    the Main combat table for consistency. (Ken, 2026-06-16)
45. **(Phase 3.2)** **Traits collapsible.** Advantages and disadvantages render
    as collapsible cards (`<details>`): the summary shows name + CP cost,
    expanding to the description. Default collapsed. (Ken, 2026-06-16)
46. **(Phase 3.2)** **Progression collapsible.** The long sections become
    `<details>`: Raise-a-Stat and Raise-a-Skill open by default (the primary
    spend actions), IP Journal collapsed (history), and Minor/Major Milestones
    open *only* when picks are available (`minorLeft`/`majorLeft` > 0). The IP
    status + grant block and the MP status block stay always-visible. (Ken,
    2026-06-16)
47. **(Phase 3.2)** No schema bump. All Phase 3.2 work is presentation/UI; the
    character (0.3) and game-data (0.2) schemas are unchanged and the pure engine
    (`/*ENGINE-START*/…/*ENGINE-END*/`) is byte-for-byte identical, so the 58
    engine unit tests stand without rerun. App label → "phase 3.2". Verified by a
    headless jsdom harness, now **61 assertions** spanning header chrome, the
    vitals drawer, the footer, skills alignment + description toggles, the traits
    and progression collapse defaults, the caret fix, and the LUCK reset.
48. **(Phase 3.3)** **Audit trail + admin mode are one subsystem.** "Free-edit a
    locked character" (admin) and "see/undo everything that's happened" (audit)
    are the same need: a single ordered, reversible record. New character field
    `audit: [{seq,date,kind,label,patch}]`. Every state-changing **sheet** action
    (damage, SAN, LUCK, trackers, credits, adjustments, IP, milestones, sessions,
    loadout, *and* admin edits) routes through one UI wrapper `commit(kind,label,
    fn)` → snapshot, mutate, `Engine.recordAction`, save+render. Creation/wizard
    actions are **not** audited (pre-lock; the draft autosave covers them). (Ken,
    2026-06-16)
49. **(Phase 3.3)** **Undo is last-in-first-out.** The Activity Log shows every
    action; "Undo last action" peels the most recent and is itself **not** logged
    (it pops, like the old `undoIP`). Arbitrary out-of-order undo is rejected — it
    corrupts dependent state (e.g. undoing an early REF 6→7 while a later 7→8
    stands). The division: **recent slip → Undo; older slip → fix it in Admin
    mode** (also logged, also undoable). The two ad-hoc "Undo spend" buttons (IP,
    LUCK) are retired in favour of the single global undo; LUCK's button becomes
    a forward **Regain (+1)** action. Targeted deletes (milestone/session/
    adjustment) stay, but each is now a logged, undoable action. Undo/diff logic
    lives in the **pure engine** (`diffChar`, `recordAction`, `undoLastAction`)
    so it's covered by tests; arrays diff as append/removeAt/set to keep the log
    light for append-heavy ledgers. (Ken, 2026-06-16)
50. **(Phase 3.3)** **Audit trail lives under Session Log**, not its own tab
    (keeps the 9-tab bar; Decision 38). An "Activity Log" section sits below the
    session history: an Undo button, then the entries newest-first with a kind
    chip + human label; the newest row carries an inline undo (↶). An admin-only
    "Clear activity log" is offered (guarded; not undoable — it drops history, not
    values). (Ken, 2026-06-16)
51. **(Phase 3.3)** **Admin mode reaches everything, incl. archetype + power
    level.** Toggled from the kebab menu; a sticky gold **ADMIN** banner reminds
    you it's on and offers Open-editor / Exit. The editor (a hidden `admin`
    section, no tab, reachable only while admin is on) free-edits identity, power
    level, archetype, stat base+IPE, skill rank+IPE (+add/remove any), advantages/
    disadvantages (rank/add/remove), and LUCK bonus — **bypassing caps and pools**
    (a non-blocking budget echo shows the consequence). Power-level and archetype
    changes carry hard warnings; archetype change confirms before wiping
    `archetypeChoices` (and supernatural advantage-block re-applies), all as one
    undoable step. TOL/WILL aren't editable (derived) — the editor points to their
    input stats / Manual Adjustments. (Ken, 2026-06-16)
52. **(Phase 3.3)** **Main health as HL segments; TOL/WILL derivation surfaced.**
    The Main Health condition card swaps its single % meter for a numberless
    per-Health-Level segment strip (`hlMiniHtml`), reusing the Trackers HL-track
    fill math (partial fill on the current HL) so depletion / the "pain journey"
    reads at a glance — other condition cards keep their % meters. TOL/WILL/SAN
    derivations are generated from `shadows-data.js` (`base` + `inputs`, floor,
    arch/adjustment bonus) so they stay correct if a formula changes: shown always
    in the Vitals drawer, and behind a "?" on the Main Soul cells (the skills "?"
    pattern from Decision 44, `S.openDerived`) to preserve the clean label-free
    grid of Decision 36. (Ken, 2026-06-16)
53. **(Phase 3.3)** **Character schema → 0.4.** `migrate()` seeds `audit: []` on
    older files and bumps 0.3 → 0.4 (import/resume upgrade older saves). The
    engine gains pure audit functions, so it is **no longer byte-identical** —
    the harness needs the new assertions and a rerun (the prior 61 stand; add the
    audit/diff/undo, segment, derivation, and admin-commit-logging cases). App
    label → "phase 3.3". Validated here by a 37-assertion engine diff/undo unit
    suite, an 8-assertion migrate/record/undo check against the real engine, and a
    32-assertion jsdom render+interaction smoke (all tabs, admin mode, activity
    log, undo) — all passing, zero runtime errors.

54. **(Phase 3.4)** **The app becomes a repository.** The single `index.html`
    is split along its existing seams into `src/styles/shadows.css`,
    `src/engine/engine.js`, `src/ui/app.js`, and `src/data/` (data + icons);
    `index.html` is reduced to a 31-line shell of markup and `<script src>`
    tags in fixed order (data → icons → engine → ui). **No application logic
    changed** — the split is a file operation, verified by booting the built
    artifact in jsdom with zero runtime errors across all nine sheet tabs.
    `tools/build.mjs` inlines every local asset back into
    `dist/shadows-character-sheet.html`, making the documented ship path (§1) a
    command rather than a manual step; the `/*ENGINE-*/` and `/*UI-*/` markers
    are retained so older marker-extracting harnesses still work. The `file://`
    constraint is now enforced rather than assumed: **no ES `import`/`export`
    anywhere in `src/`** (CORS blocks modules from disk), `index.html` may not
    grow inline logic or styles, and the engine is loaded in a bare VM with no
    DOM so any reach for `document` fails the suite. `src/ui/app.js` was
    deliberately **not** decomposed further — it is one closure with ~90
    functions sharing state, and that refactor belongs with the Phase 4 renderer
    rewrites, not with a file move. (Ken, 2026-08-02)

55. **(CRB v4 content pass)** **Skills, Advantages and Disadvantages re-merged
    from the CRB.** Sections 042/043/044 are authoritative and were merged whole
    rather than patched. Skills go **34 → 36** (new: `occult-lore` INT/COOL,
    `survival` BOD/INT); two move category (`tactics` general → combat,
    `streetwise` utility → general), giving 11/9/16. Every skill gains the
    `flavorLine` that §2 always documented but the catalog never carried, plus
    an optional `notes` array. Advantages and disadvantages keep **every id** —
    no renames, no removals, so no `migrate()` step. Numeric changes: Poverty
    2→4 CP and Max Rank 1→3, Gullible 3→5, Passive 3→4, and `universal: true`
    on Followers/Minion and Time Sense. A systemic change runs through nine
    entries: absolute Target Numbers became **relative TN modifiers** (Iron
    Will, Machindo, Animal Ken, True Faith, Weak Willed, Fanatic, Terminal
    Disease, Berserker, Addiction). Game data schema **0.2 → 0.3**: the shape
    changed, and because three disadvantage grants moved, a character saved
    against 0.2 was granted different CP than the same character under 0.3 —
    `versionCheck` surfaces that on load, which is the reason to bump. (Ken,
    2026-08-29)

56. **(CRB v4 content pass)** **Martial Arts: two styles at creation, more
    trainable in play.** The CRB said both "may choose up to two Martial Arts
    styles at creation" and "You can train multiple martial arts styles" in the
    same entry. Ken's ruling: two at creation is the cap; additional styles may
    be trained later. Styles ship as a `styles` array on the skill. **Salut**
    is held out of that array until it has a bonus — the CRB lists it as "Salut
    (SPELLING)" with `<TBD>`, and an absent entry is better than a selectable
    one with no effect. The data wording here was authored from Ken's ruling
    rather than lifted from the CRB, so the CRB entry should be updated to match
    before the two drift. (Ken, 2026-08-29)

57. **(CRB v4 content pass)** **Rank tables stay prose; `rankTable` waits for
    the renderer.** Five entries now ship tables — Danger Sense, Long-Lived,
    Rapid Healing, Addiction, and Martial Arts styles — and they do not agree on
    a shape: rank→value, rank→prose, rank→three columns, rank→columns *plus* a
    Milestone grant, and style→bonus, which is not rank-indexed at all.
    Designing a schema from five disagreeing examples, with no renderer to test
    it against, would commit the data to a shape Phase 4 then has to honour or
    migrate. They render as labelled bullets meanwhile — faithful to every
    source value, no interpretation. Structured `rankTable` lands **with** the
    Phase 4 renderer work, as an additive field on five entries. (Ken,
    2026-08-29)

58. **(CRB v4 content pass)** **The Phase 4 selection system is now specified by
    the rulebook rather than proposed — and none of it is encoded yet.** The rev
    9 audit §4 sketched `picks`/`excludes`/`requires` from a feature request;
    the CRB now *requires* it. Choose from a fixed list: Common Sense (1 of 4
    named skills). Choose from a category: Favored Skill, Refined Skill, Martial
    Arts (2 styles). Free text + GM approval: Immunity, Followers/Minion,
    Cursed, Fanatic, Pact, Minor Insanity, Addiction, Enemies, Notorious,
    Defect/Flaw. A different choice **per rank**: Common Sense, Favored Skill,
    Refined Skill, Defect/Flaw. Two requirement types the audit did **not**
    anticipate: a **creation-only** constraint (Long-Lived, "may only purchase
    this Advantage during character creation") and a **`grants`** concept
    sitting beside picks (Long-Lived grants Milestones; Educated +10 Skill
    Points per rank; Hard to Kill +1 max HP per Health Level; Thick Skin +1
    Natural Armor; Lucky/Unlucky modify LUCK spend costs). None of it is in the
    data: encoding a schema with no renderer and no `validate()` hooks would
    make one commit both a content update *and* a new subsystem, which is the
    one thing this project has consistently refused to do. These ~15 entries
    become the **test corpus** when the machinery lands. (Ken, 2026-08-29)

59. **(B2)** **Legacy stat aliases point at live stat ids, and `normStat`
    verifies its own target.** The alias map is the pre-Shadows stat vocabulary
    — `BODY`, `REF`, `INT`, `TECH`, `COOL`, `EMP`, plus `MA` and `ATTR`. Two
    entries had the *source* abbreviation on the target side: `MOVEMENT→"MA"`
    and `ATTRACTIVENESS→"ATTR"`, neither of which is a Shadows id. They now
    resolve to `MOB` and `MAG`. The deeper fault was that `normStat` returned
    the alias target without checking it existed, so an unresolvable alias came
    back *truthy* and `skillLine` threw on `t[pri].value` — taking the Skills
    tab down rather than raising the `dataWarning` it already carries.
    **Decision 22's "degrades gracefully instead of crashing" was therefore
    untrue for exactly the case it was written for**, and is now true: the
    target is verified, and a stale alias degrades to `null`. Guarded two ways
    — a source-level check that every declared alias target is a live stat id,
    so a future alias is covered without editing the test, and a behavioural
    check that an unresolvable stat warns instead of throwing. (Ken, 2026-09-02)

60. **`Engine.undoIP` is removed, not deprecated.** Decision 49 replaced the
    ad-hoc IP undo with the global structural undo; the function stayed defined
    and exported for two phases without a single caller. Every IP mutation in
    the UI runs through `commit()` → `recordAction()`, so `undoLastAction`
    already reverses an IP raise — both the IPE and the journal entry — via the
    generic patch. Keeping a second, divergent undo path on the public API
    invited someone to call the wrong one. Deleted, with a comment at the site
    saying what superseded it, and a test that asserts both halves: `undoIP` is
    gone, and the generic undo does the job. (Ken, 2026-09-02)

61. **(B5)** **The review step's number derives from `creationFlow.steps`.**
    `STEPS` appended `{id:"review", n:8}`, hardcoding the assumption that the
    data holds exactly seven steps. The count in "Step 8 of 8" was already
    derived, so adding or removing a step in the data would have desynced the
    two halves of the same sentence. Now `n: D.creationFlow.steps.length + 1`.
    This is the "adding content should require zero app changes" contract
    applied to the flow itself. (Ken, 2026-09-02)

62. **(Batch 1)** **The engine has a totality contract, and now something
    enforces it.** Decision 22 promised the engine "degrades gracefully on
    unknown ids... instead of crashing." Nothing tested that, and three
    separate sessions each rediscovered a violation independently: **B2**
    (`normStat` returned an unresolvable alias truthy and `skillLine` threw),
    **B7** (`validate` threw on a character with no power level), **B6**
    (`migrate` left holes and the engine threw straight through them). They
    were filed as three unrelated findings in two severity buckets. They are
    one defect: an unenforced promise. The contract is now stated exactly —
    **every exported reader is total on anything `migrate()` returns** — and
    enforced by a guard that runs six degenerate characters through
    twenty-seven readers, every `validate` step, and `skillLine`. It found a
    fourth violation (**B10**) on its first run. (Ken, 2026-09-02)

63. **(B6)** **`migrate()`'s completeness *is* the migration guarantee.**
    `migrate` is version-agnostic — it backfills unconditionally rather than
    stepping 0.1 → 0.2 → 0.3 → 0.4. That is a good design, idempotent and
    simple, but it means every field `newCharacter()` has ever grown must be
    reachable there or old files open with holes. `archetypeChoices` arrived in
    schema 0.2 and never got a backfill; two schema versions later a pre-0.2
    character threw in `statValue()` on the first render and **the sheet could
    not open at all**. The locked import path never even had the shallow
    `Object.assign` that half-protected the unlocked one. `migrate` now walks
    the *current* shape, so a field added tomorrow is covered by construction
    rather than by remembering. Three fields are exempt, and the exemptions are
    load-bearing: `meta.gamedataVersion` (seeding it would mask the exact
    mismatch `versionCheck` exists to report) and `meta.created` / `meta.updated`
    (inventing timestamps fabricates history). With the shape guaranteed on
    both paths, the redundant `Object.assign(newCharacter(), c)` in the import
    handler is deleted — two backfill mechanisms disagreeing about who owns
    defaults was the same *two parallel models* disease as A1/A2, in miniature.
    (Ken, 2026-09-02)

64. **(B3)** **1 Health Level per BOD is an invariant, not a tunable.**
    `resources.healthLevels.levelsPerBOD: 1` sat in the data for four schema
    versions looking like a live knob; `health()` always hardcoded the 1:1 rate.
    The rev 9 audit offered a binary — honour it or remove it — and **both
    branches hide a rules assumption**, because `maxLevels: 10` and
    `bodAbove10Rule` are written assuming 1:1 and become meaningless at any
    other rate. `030_Core_Mechanics.docx` settles it: *"For every point of BOD
    you have, you gain 1 HL"*, capped at ten, and above 10 the **base HP per
    level** rises instead — which the engine already implemented correctly,
    cybernetics included. So it is not a knob awaiting a ruling and not a
    Biomech dependency; it is a redundant field describing a law. Deleted, and
    both of the CRB's worked examples are pinned as tests. (Ken, 2026-09-02)

65. **(Mechanism 3)** **The rulebook's worked examples run as tests.**
    `tests/rules.test.mjs` pins every number the CRB states outright and quotes
    the line it comes from: BOD 4 → 4 HL × 5 HP = 20 HP; a Werewolf at BOD 11 →
    10 HL × 6 HP = 60 HP; Pain Levels at 0–1 / 2+ / 5+ / 8+ HL lost with −1
    Skill, −1 Essence die and −5% Breaker stacking per level; Luck at 2 to
    boost and 3 to explode; the modifier curve's −1-below-4 / +1-above-6 shape.
    A rules change the app misses now **fails the build** instead of surviving
    to the table, and a data field nobody reads is caught the moment someone
    claims it is authoritative. If this file and the CRB disagree, the CRB wins
    and the file is the bug report. (Ken, 2026-09-02)

66. **(B8)** **The two Pain Level floors are numbers the engine carries and the
    sheet states.** The CRB floors Essence Checks at 1 die and Breaker Checks
    at 10% *"to prevent automatic loss."* Both existed in the data only inside
    an unread prose `notes` string, and the sheet displayed bare penalties — a
    player at Pain Level 3 read "−3 Essence die" with nothing telling them where
    it stops. The engine cannot *apply* these: it never sees the dice pool or
    the target number, and that is correct. It now carries them out of
    `painState` as `essenceFloor` / `breakerFloor`, sourced from two new data
    fields, and one shared helper renders both readouts so they cannot drift
    apart. This is the general shape of the fix for prose-that-is-actually-a-rule:
    **promote it to a number, read it, display it.** (Ken, 2026-09-02)

67. **(B9)** **The milestone cadence comes from the data, once.** The cadence
    was stated twice — as prose in `milestones.rules` ("Unlocked at 5, 15,
    25...") and as arithmetic in `milestoneState` — with nothing connecting
    them, and `milestonePointsPerSession` was inert beside a hardcoded 1. They
    agreed on the day this was found, which is the only reason it was not
    already a bug. Now `minorFirstAt` / `minorEvery` / `majorFirstAt` /
    `majorEvery` and `milestonePointsPerSession` are all read, and the cadence
    is pinned by the CRB conformance suite. (Ken, 2026-09-02)

68. **When `gamedataVersion` bumps — and when it must not.** Batch 1 removed a
    data field, added four, and closed a flag, and bumped **nothing**: no
    player-observable value moved, verified by diffing sixty computed outputs
    across health, pain and milestone states before and after. The rule, written
    down because it had been improvised: **bump when a character's computed
    values or available choices can change** — content added or removed, a cost
    or cap altered, an id retired. **Do not bump for changes no character can
    observe** — a field the engine never read, a new field with no effect on
    existing data, a corrected comment, a closed flag. Bumping on a no-op makes
    every saved character report a mismatch for nothing, and a warning that
    cries wolf stops being read. (Ken, 2026-09-02)

69. **(Batch 2)** **The Voice & Style Guide is mirrored into this repo, and the
    CRB copy stays the master.** `docs/reference/GUIDE_Shadows_Voice.md` carries
    a provenance header — source file, source project, date pulled — and a line
    saying the CRB wins on conflict. It is a **mirror, not a second master**:
    re-pull it rather than editing in place. The reason it is here at all is
    that player-facing strings live in *this* repo, and a session judging one
    could not check the standard without cross-project context. That made every
    copy question a round-trip through Ken, which is the same bottleneck F8 has
    been for two sessions. The risk accepted is drift, and the mitigation is
    that a dated mirror is honest about being stale. (Ken, 2026-09-02)

70. **(Batch 2)** **Two audiences, two fields — and the maintainer one cannot
    render.** `flagNote` is written for Ken and Deighton: flag ids, data-file
    field paths, "confirm with D". The app rendered it verbatim to players, so
    someone buying LUCK read *"F1: CP cost per LUCK point stubbed at 1 — confirm
    with D."* The obvious fix — rewrite the notes to sound nicer — is the wrong
    one, because the id and the precision are the whole value of the flag table.
    Instead the entry gains an optional `playerNote`, and `flagHtml()` was
    changed to take **the entry, not a string**, reading only `playerNote` with
    a fallback to `appCopy`. Passing a raw note is no longer expressible.
    `playerNote` is optional on purpose: eleven flags stopped leaking on day one
    without eleven pieces of copy being owed, and specific lines were written
    only for the four a player meets during creation (F1, F2, F8, F14). The
    precedent generalises — **maintainer content and player content are
    different fields, everywhere, from here on.** (Ken, 2026-09-02)

71. **(Batch 2)** **"Not finished" is a state the app renders, not a sentence
    someone remembers to delete.** The app was built to be demonstrated, so it
    narrated its own roadmap: *"Session tracking arrives in Phase 3"*, *"this
    archetype ships as TBD"*, a hardcoded `<b>F14</b>` block, and a footer
    announcing "app phase 3.3". Ten sites in all. Every player-facing string the
    app generates for a *state* now lives in one `appCopy` block, so **changing
    the app's voice is a data edit** — no code is touched. Raw `status` values
    render through `appCopy.statusLabel`, so nobody reads "tbd"; `meta.rulesetVersion`
    became "CRB v4 (in progress)" rather than "CRB v4 WIP". F14 moved out of the
    UI into `ip` alongside every other flag. The lock screen simply lost its
    fourth sentence: the three before it were already a closing cadence, and the
    roadmap note was stepping on the ending. (Ken, 2026-09-02)

72. **(Batch 2)** **`validate()` writes player-facing copy, and that is where a
    build-state sentence hid longest.** Every wizard error and warning a player
    reads is composed in the **engine**, not the UI — `validate()` produced
    *"Cyborg ships as TBD — rules pending. The sheet will carry the flag."*
    Nobody looks for prose in a rules engine, which is exactly why it survived
    the manual comb that found the other nine sites; the enforcement test found
    it in seconds because it renders the app rather than reading the source.
    Its other twenty-odd messages are the **best tool voice in the codebase** —
    *"Pick 3 Combat Skills for your Focused Skills (1/3)"* names the problem,
    the fix, and the distance to done — and they were left exactly as they are.
    `docs/VOICE-APP.md` now records all three places player copy lives: `app.js`,
    `engine.js`, and the data. (Ken, 2026-09-02)

73. **(Batch 2)** **The voice standard is enforced by rendering the app, not by
    reading the source.** `tests/voice.test.mjs` drives all nine sheet tabs and
    every wizard step for all five archetypes, then asserts that no `flagNote`
    is on screen, that no roadmap vocabulary appears, and that no element renders
    a raw `status` as its own text. Three things this cost, worth recording
    because they are the general shape of testing rendered copy:
    **(a)** `body.textContent` includes the inlined data `<script>`, so the
    first version "failed" on notes nobody could see — strip `script`/`style`
    first. **(b)** Corpus scanning cannot localise a regression when three sites
    render the same label, and banning the bare word "draft" fires on the home
    screen's legitimate "Resume draft" — so raw statuses are caught by a DOM
    check on leaf elements instead. **(c)** The test fixture was named "Draft"
    and tripped its own assertion. Every guard was mutation-tested against the
    pre-fix code. (Ken, 2026-09-02)


## 5. Open Flags

Resolved in Phase 1: ~~F3~~ (skill IP cost = 5× current rank; Focused Skills 3×),
~~F4~~ (v4 uses Pain Levels at 2+/5+/8+ HL lost; −1 Skill / −1 Essence die / −5%
Breaker per level).

Fixed in Phase 2 (data): five skills referenced stat id `BODY`, which doesn't
exist in the catalog (`BOD`) — Heavy Weapons, Martial Arts, Melee, Acrobatics
(synergy) and Athletics (primary). Corrected in `shadows-data.js`; the engine
now also tolerates legacy aliases (Decision 22). F8 needs no code change when
ruled: the wizard reads `statPoints` off the power-level entry, so the ruling
is a four-number data edit.

Resolved in the CRB v4 content pass (2026-08-29): ~~F10~~ — both halves closed.
**The flag itself outlived the work by four days.** The renames landed on
2026-08-29 and the docs recorded F10 as closed, but `skillsFlags.flagged` stayed
`true` in the data and kept rendering a Design flag to players for finished
work. Cleared 2026-09-02 (Batch 1) — the block was removed rather than set to
`false`, because dead data that looks live is the defect class Batch 1 exists to
close. Closing a flag is now two edits, not one: the docs *and* the `flagged`
field.
`occult-lore` and `survival` now exist in the catalog, and the Professional
subtype references were renamed to match ("Occult" → "Occult Lore", "Handgun" →
"Handguns"). Focused-skill matching is by **name**, so those two had to move
together. **F5 is three-quarters closed**: Field Medic now names the catalog's
"Medical", Combat Paralysis' text is no longer ambiguous, and Poverty's Max Rank
is ruled at 3; only Cyber-Prophetical still carries `flagged: true`, and it
waits on the Biomech rewrite (F6).

~~F15~~ closed the same day it opened: Ken confirmed Tracking is **INT/EMP** — the
CRB's "(INT / INT)" was a slip made while correcting Occult Lore and Survival off
their derived-attribute synergies — and corrected the CRB. The data had carried
INT/EMP all along, so nothing changed but the flag.

Eleven entries in `shadows-data.js` carry `flagged: true` — was thirteen: four
cleared, two opened.

| # | Item | Owner | Blocking? |
|---|---|---|---|
| F1 | LUCK buy-up cost in CP per point (stubbed 1:1, flagged in data) | Deighton | No |
| F2 | CP boost exchange rate across skills/stats/powers (stubbed 1:1, flagged) | Deighton | No |
| F5 | Adv/Disadv audit flags — **three of four closed by the CRB v4 pass**. Remaining: Cyber-Prophetical (SAN vs TOL), which waits on F6 | Deighton | No |
| F6 | Biomech rewrite (NCI tiers, Set Bonuses, Kicker Dice, TOL pressure) — ships as `status: "tbd"` | Ken/D | No |
| F7 | SFR per archetype: Werewolf defined (WILL×3+N, RoU); Vampire Blood Pool TBD | Ken → docs | No |
| F8 | **Stat Point roll conflict**: WIP says flat "3d10+30" for all levels; REF table scales by power level (30+2d10 … 60+5d10). Data file uses the scaled table pending ruling | Ken/D | **Wizard** |
| F9 | Are the WIP's "General Milestones" shared across all archetypes (REF says General Majors are open to all) or Professional-only? Data file treats them as shared | Ken/D | No |
| F11 | Quick Study milestone requires an "Intuition Advantage" — Intuition is a Skill in the catalog | Ken → docs | No |
| F12 | Minor Milestones pool sourced from REF (v3.5); WIP refers to an unwritten Advancement Section | Ken → docs | No |
| F13 | Vampire `canPurchaseAdvantages: false` is assumed from the Werewolf supernatural baseline — confirm | Ken/D | No |
| F14 | **Skill IP cost at rank 0**: "5 × current rank" prices learning a new skill (0→1) at zero. App costs it as rank 1 (5 IP; Focused 3) pending ruling — flagged in the Progression UI | Deighton | No |
| F16 | **Hemophiliac calls for a "First Aid Skill Check"**; the catalog skill is **Medical**. Field Medic's half was fixed in the same pass, so this is the last real one. (A Professional milestone lists "First Aid" among tool/kit examples — prose, not a skill reference) | Ken → docs | No |

## 6. Roadmap

- **Phase 0 — Schema** ✅
- **Phase 1 — `shadows-data.js`** ✅ — contains: 8 stats + modifier curve,
  3 derived attributes, resources (Health/Pain Levels, Luck w/ spend costs,
  Çredits, SFR, Exhaustion), 4 power levels, 34 skills (10 combat / 10
  utility / 14 general — **36 as of Decision 55**), 57 advantages, 30
  disadvantages, 5 archetypes
  (Arcanist draft, Professional draft w/ 7 subtypes, Werewolf draft w/
  Trueborn origin, Cyborg tbd, Vampire tbd), 5 minor + 25 major milestones,
  IP rules, creation flow. 13 flagged items carried `flagged: true` inline
  (11 as of Decision 55).
- **Phase 2 — App shell + Creation Wizard** ✅ — `index.html`, single file,
  no build step. Three-pane layout: Intake Ledger step rail · step panel ·
  live Vitals rail (TOL/WILL/SAN/HP/pools recompute on every input). Full
  8-step flow: power level (F8 flag surfaced) → identity → stat roll +
  allocation → archetype (Arcanist focus roll/allocation + aberrations;
  Professional subtype/required-stat checks/focused-skill picks/natural
  advantages; Werewolf stat bonus + advantage-purchase block) → history →
  skills (check preview per row) → CP (disadv/adv, LUCK, Arcanist
  disciplines, boosts with per-target Max Boost ledger) → review & lock →
  `<name>.shadows.json` export. Draft autosave to localStorage with resume;
  import with gamedataVersion + missing-id checks. Engine is pure and
  isolated between `/*ENGINE-START*/` / `/*ENGINE-END*/` markers — 43 unit
  tests + 29-assertion jsdom E2E pass.
- **Phase 3 — Sheet & Session Tracking** ✅ — locked characters land on a
  live sheet (left rail becomes section nav: Sheet · Trackers · Progression ·
  Session Log · Loadout & Powers · Notes; Vitals rail switches to a condition
  readout: HP/Pain/SAN/LUCK/SFR/Ç/IP/MP). **Sheet:** identity, stat + derived
  grids, trained-skill tables with full check breakdowns (rank + primary +
  synergy − pain, reason shown inline), untrained reference, adv/disadv,
  archetype reference. **Trackers:** damage with per-HL boxes and Pain Level
  card (skill/Essence/Breaker penalties), SAN loss, LUCK with data-driven
  spend actions (Boost −2 / Explode −3) and undo, generic archetype tracker
  panels (SFR, Exhaustion, Tolerance Load, Blood Pool w/ manual max),
  Çredits with transaction ledger, manual adjustments ledger. **Progression:**
  IP grant/spend/undo with journal, per-target costs computed live, focused-
  skill 3× detection (plural-tolerant name matching vs F10), learn-new-skill
  flow (F14 flagged), Milestone Points (session-derived + manual), Minor/Major
  pick lists with prerequisite chips and the Improved roll prompt.
  **Sessions:** log form (auto 10 IP overridable, MP toggle, LUCK refresh),
  history with delete. **Loadout:** editable weapons/gear tables + generic
  archetype panels (rankedList disciplines, free-entry Grimoire/augments,
  focused-skills list, Tweak text, Werewolf form toggle). Active sheet
  autosaves to localStorage and resumes from Home; imports migrate 0.2 → 0.3
  with versionCheck (now also milestone-id + IPE/journal consistency).
  Engine still pure between markers — 58 engine unit tests, 46-assertion
  sheet E2E, 12-assertion wizard→lock regression smoke, all passing (jsdom).
- **Phase 3.1 — Sheet UX + Iconography** ✅ — locked sheet converted from a
  single scroll to a nine-tab interface (Decision 30); the creation ledger
  collapses on lock and a horizontal tab bar takes over. New `shadows-icons.js`
  module (Decision 31): brand stat set (11 icons, `currentColor`, REF/Hand
  background bug fixed — Decision 33) + free-to-use Lucide UI set (ISC) for
  condition cards and tab glyphs. **Main** rebuilt as a full-width command
  console (Decision 32): condition strip + Stats/Derived beside Combat
  (trained + untrained) + Weapons quick-ref, Vitals rail hidden on Main only.
  Stat/derived grids and the Vitals rail are now icon-forward. No schema bump;
  engine untouched (Decision 34). Verified via headless render across all tabs,
  desktop + mobile + the <900px stacking breakpoint.

- **Phase 3.2 — Sheet fit & finish** ✅ — full-width sheet on every tab with a
  slim horizontal vitals bar and an on-demand Vitals flyout drawer (Decisions
  35-37); four-sphere stat columns on Main with derived/SAN de-duplicated (36);
  sticky in-header nav reading "Shadows // <name>", the registry banner removed,
  Home/Export folded into a header overflow (kebab) menu, registry/version moved
  to a collapsible footer (38-40); number-entry caret fix (41); LUCK refresh
  confirmed (42); date-input theming (43); Skills unified into one aligned table
  with per-skill "?" descriptions (44); Traits and Progression made collapsible
  (45-46). No schema bump; engine untouched (47). Headless jsdom harness at 61
  assertions; ready to present to Deighton.

- **Phase 3.3 — Audit trail, undo & admin mode** ✅ — character schema → **0.4**
  (Decision 53). New unified **audit trail**: every play/admin action routes
  through one `commit()` wrapper into `ch.audit`, with last-in-first-out **Undo**
  (Decisions 48-49); pure-engine `diffChar`/`recordAction`/`undoLastAction`
  (arrays diffed as append/removeAt/set). Surfaced as an **Activity Log** section
  under Session Log with inline + header undo and an admin-only clear (50). New
  **Admin mode** (kebab toggle + sticky ADMIN banner) free-edits identity, power
  level, archetype, stats (base+IPE), skills (rank+IPE/add/remove), adv/disadv,
  and LUCK bonus — bypassing caps/pools, every edit logged and undoable; archetype
  change is guarded and wipes `archetypeChoices` as one step (51). Main **Health**
  card becomes a numberless **HL segment strip**; **TOL/WILL/SAN derivations**
  shown in the Vitals drawer and behind a "?" on the Main Soul cells (52). The two
  ad-hoc undo buttons retire in favour of the global undo; LUCK's becomes a
  forward "Regain (+1)". App label → "phase 3.3". Engine no longer byte-identical
  — harness needs the new assertions + a rerun (53). Validated here by 37 engine
  diff/undo unit assertions, 8 migrate/record/undo assertions on the real engine,
  and a 32-assertion jsdom render+interaction smoke across all tabs, admin mode,
  the activity log, and undo — all passing, zero runtime errors.

- **Phase 3.4 — Repository restructure** ✅ — the app becomes a maintainable
  git repository (Decision 54). Sources split under `src/`; `index.html` is a
  shell; `tools/build.mjs` produces the single-file release; CI runs the suite
  on every push and attaches the built file to tagged releases. Test suite
  formalized at **20 passing assertions + 2 tracked `todo`s** across three
  suites: engine units (no DOM), jsdom boot/wizard/all-tabs smoke, and
  architecture guards. The two `todo`s are confirmed defects written as failing
  tests so they flip green when fixed — **A1** (Arcanist aberrations render
  twice; re-verified 2026-08-02 as 6 `[data-spec]` + 6 `[data-aber]` buttons)
  and **B7** (new: `validate("stats", ch)` throws instead of reporting when the
  character has no power level, `engine.js:574` as of Decision 60). Also re-confirmed: **B2** is
  worse than recorded — `MOVEMENT→"MA"` and `ATTRACTIVENESS→"ATTR"` both resolve
  to ids that do not exist (real ids are `MOB` / `MAG`). No schema bump; engine
  untouched. *(B2 closed 2026-09-02 by Decision 59 — and it was worse again
  than this line records: the bad alias did not merely fail to resolve, it
  threw.)*

- **CRB v4 content pass** ✅ *(2026-08-29 — a data merge, not a phase)* —
  Skills, Advantages and Disadvantages re-merged from CRB sections 042/043/044
  (Decisions 55-58). Skills 34 → 36 with flavor lines throughout; every
  adv/disadv id preserved; three disadvantage point values changed; game data
  → **0.3**. Closed **F10** outright and three quarters of **F5**; surfaced
  **F15** (Tracking INT/INT, confirmed a CRB slip and closed the same day) and
  opened **F16** (Hemophiliac's First Aid reference).
  Also closed a real gap in the test suite: the stat-id guard looped over a
  `synergy` array the data does not have, so it had never checked
  `synergyStat` — the field the engine actually reads, and the one carrying
  both invalid stats this pass turned up. No app code changed; the suite held
  at 20 passing / 2 todo / 0 failing throughout.

- **Quick-win pass** ✅ *(2026-09-02 — three audit findings, not a phase)* —
  **B2**, **B4** and **B5** closed as Decisions 59-61: the two dead stat
  aliases now resolve (and `normStat` verifies its target, so the class of bug
  cannot return silently), the superseded `Engine.undoIP` is deleted, and the
  review step numbers itself off the data. Engine and UI both touched; no
  schema bump, no data change, no id moved. Suite **28 passing assertions + 2
  tracked `todo`s** — four new guards, each mutation-tested against the
  pre-fix code to confirm it actually fails there. **A1** and **B7** remain the
  two `todo`s.

- **Batch 1 — Engine totality & CRB conformance** ✅ *(2026-09-02)* — the first
  batch of the debt-ledger plan. Decisions 62-68. **B6, B7, B8, B9, B10** and
  **B3** closed; the stale **F10** flag cleared. The engine's promise from
  Decision 22 is now a written contract with a guard behind it, `migrate()`
  guarantees its own completeness, and `tests/rules.test.mjs` turns the CRB's
  worked examples into build-breaking assertions. Suite **45 passing + 1 tracked
  `todo`** across four files — up from 26 + 2. No schema bump and no
  gamedataVersion bump (Decision 68): sixty computed outputs were diffed before
  and after and every one was identical. **A1** is now the only `todo`, and it
  closes with A3 in Batch 3.

- **Batch 2 — App voice & status copy** ✅ *(2026-09-02)* — Decisions 69-73.
  The app stopped narrating its own build state. Ten leak sites closed across
  `app.js`, `engine.js` and the data; `flagNote` can no longer render;
  player-facing state copy consolidated into one `appCopy` block, so the voice
  is a data edit. `docs/VOICE-APP.md` records the city-voice / tool-voice split
  and the test for which you are in — *is the player stuck right now?* Suite
  **51 passing + 1 `todo`**, with `tests/voice.test.mjs` rendering the whole
  app and reading every string a player can see. No schema or gamedataVersion
  bump (Decision 68): no computed value moved.

- **Phase 4 — Selection & constraint system** ⏭ — build `picks` / `excludes` /
  `requires` for advantages & disadvantages (rev 9 audit §4), then retrofit
  archetype specialization onto it (A3), which retires the Arcanist/Professional/
  Werewolf branches and fixes A1 + A2 as a side effect. Biomech (F6) then lands
  as data rather than a fourth special case. Clear **F8** first — it is a
  four-number data edit and the only wizard-blocking flag.

**Session handoff protocol:** every phase ends with current files +
this document updated. Ken adds the latest versions to project knowledge.
A new session resumes with: *"Continue the character sheet build — Phase N.
Files are in project knowledge; read SCHEMA.md first."*
