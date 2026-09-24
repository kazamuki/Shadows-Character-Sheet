# Shadows Digital Character Sheet — Schema & Decision Log

**Phases 0-3 complete · 3.1 (sheet UX + iconography) · 3.2 (sheet fit & finish) · 3.3 (audit trail, undo & admin mode) · 3.4 (repository restructure) complete** · Character schema 0.9 (game data 0.14) · Ruleset target: CRB v4 (WIP)
Last updated: 2026-09-23 (Starting spells in the wizard and the spell picker modal, Decision 111)

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
      base: 1, floor: 1, inputs: ["INT", "BOD", "COOL"] },   // Decision 103
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
      styles: [ { id: "karate", name: "Karate", bonus: "+1 Stun" } ],  // Martial Arts only
      // (0.4) Skills host `picks` on the same terms as adv/disadv. Martial Arts
      // points at its own `styles` array rather than restating it — one list.
      picks: [ { id: "style", type: "option", count: 2, optional: true,
                 distinct: true, from: { optionsFrom: "styles" } } ]
    }
    // 36 skills: 11 combat / 9 utility / 16 general
  ],

  // ── Advantages & Disadvantages ───────────────────────────
  advantages: [
    { id: "rapid-healing", name: "Rapid Healing",
      cost: 5, maxRank: 3, universal: false,
      description: "...", rankNotes: ["x2", "x3", "x4"] },

    // (0.4) Selection & constraint fields — ALL optional. An entry without
    // them behaves exactly as it always did. See Decisions 77-78.
    { id: "common-sense", name: "Common Sense", cost: 4, maxRank: 4,
      description: "...",
      creationOnly: true,              // may only be bought during creation
      excludes: ["some-other-id"],     // symmetric: stated once, locks both ways
      requires: {                      // same vocabulary as milestone prereqs
        stats: { REF: 6 },
        skills: { any: [["handguns", 2]], all: [] },
        advantages: { all: [["combat-cunning", 1]] }
      },
      picks: [
        { id: "skill",                 // key inside the character's `selections`
          label: "Skill",              // player-facing label on the control
          type: "skill",               // "skill" | "option" | "text"
          from: { ids: [...] },        // fixed list. or { category: "combat" },
                                       // or omitted = the whole skill catalog.
                                       // option picks: { options: [...] } or
                                       // { optionsFrom: "styles" } — a list the
                                       // OWNING entry already carries
          count: 1,                    // slots (per rank when perRank)
          perRank: true,               // need = count x rank
          distinct: true,              // no repeats across slots
          optional: true,              // slots are a CAP, not a demand
          gmApproval: true,            // text picks: warns, never blocks
          note: "..." }                // shown under the control
      ] }
  ],
  disadvantages: [
    { id: "paranoia", name: "Paranoia",
      pointsGranted: 3, maxRank: 1,
      description: "..." }
    // Same optional selection fields as advantages.
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
        // How many to pick. A path resolved against the power-level scaling row.
        // ABSENT means exactly one — four of the five archetypes say nothing and
        // that silence IS the declaration (Decision 79).
        countBy: "campaignPowerScaling.aberrations",
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
          // (0.12, Decision 108) `grimoire` is its own panel type: book spells
          // from the named catalog, plus your own spells in these columns.
          { id: "grimoire", type: "grimoire", catalog: "spells",
            columns: ["Spell Name", "Discipline", "TN", "TH", "Effect", "Overflow", "Notes"] },
          // (0.13, Decision 110) read-only rules from the named data sections,
          // on the Archetype tab.
          { id: "magic-reference", type: "reference", title: "Magic reference",
            shows: ["spellcraftRules", "spellTiers", "cascadeTable", "aberrationTable", "aberrations"] }
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
  },

  // ── Gear: weapons, ammunition, armor (0.6) ────────────────
  // Merged from the CRB v4 equipment chapter (docs/reference/crb/Gear.md).
  // One flat `weapons` array with a `category` discriminator, same shape as
  // `skills` — a new weapon needs zero app changes. Tags/Features are stored
  // as the exact strings the book prints (including any "(Xm)" parameter)
  // rather than forced into a fixed id set; *Glossary arrays give the
  // base-name definition for display. A few tags used in weapon tables have
  // no formal CRB definition (Suppression, Blast, Anti-Materiel, "Reach" as
  // a tag) and carry `flagged: true` rather than an invented rule.
  weapons: [
    { id: "combat-knife", name: "Combat Knife", category: "melee", skill: "melee",
      damage: "BOD+3", style: "Blade", reach: "1m", parry: null, damageType: "Normal",
      availability: "Common", cost: 100, tags: ["Conceal"], features: [],
      flavorLine: "..." }
    // 54 entries: melee/martialArts/handguns/smgs/grenades/urbanRifles/
    // shotguns/sniperRifles/heavyWeapons/beamSidearms/beamLongarms/
    // beamSpecialist/beamHeavy/archery. Ranged categories use acc/range/rof/
    // capacity/mods instead of style/reach/parry/damageType; grenades use
    // radius instead of acc/range/rof/capacity.
  ],
  // (0.9, Decision 100) The catalog's own section headings, in the book's
  // order: what the Loadout picker groups by. Every weapon's `category` is one.
  weaponCategories: [ { id: "smgs", name: "Submachine Guns" } ],  // 14 entries
  weaponTagGlossary: [ { id: "AP", description: "..." } ],       // 29 entries
  weaponFeatureGlossary: [ { id: "Scope", description: "..." } ], // 6 entries
  weaponModGlossary: [ { id: "Silencer", slots: 1, description: "..." } ], // 7 entries
  ammunition: [ { id: "handgun-rounds", name: "Handgun Rounds", weaponType: "Handgun",
    availability: "Common", cost: "15Ç/mag", flavorLine: "..." } ],       // 9 entries
  arrowheads: [ { id: "barbed-tip", name: "Barbed Tip", effect: "Base weapon DMG",
    tags: ["Bleeding"], availability: "Uncommon", cost: "100Ç/6" } ],     // 11 entries

  // PROT is a die the player rolls physically (Decision 11 — the app never
  // rolls dice); RES is a flat reduction; INT is a depleting resource.
  // `armorRules` began as reference text (Decision 92). The hit resolver
  // (Decision 99) and Loadout & recovery (Decision 100) now read its numbers.
  // Head/Hand armor doesn't roll PROT or track INT at all; it grants a named
  // `feature` instead.
  armorRules: {
    protNote: "...", resNote: "...", integrityNote: "...",
    integrityLossByDifficulty: { easy: "1d4", medium: "1d6", hard: "1d8", legendary: "1d10" }, // the wear die
    compromisedNote: "...", repairNote: "...",
    baseResAgainst: ["kinetic"], coverageLocations: { light: ["torso"], /* medium, full */ },
    defaultCoverage: "light", defaultHitLocation: "torso", soakedIntegrityLoss: 1,   // Decision 99
    qualityOrder: ["Low", "Mid", "High"],       // an upgrade's minQuality is ranked here
    slotNames: { body: "Body armor", head: "Head", hand: "Hands" }, coverageNames: { light: "..." },
    repairKitDie: "1d6", repairKitNote: "...", armorerNote: "...", wearNote: "..."   // Decision 100
  },
  armorFeatureGlossary: [ { id: "Concealable", description: "..." },  // 10 entries
    { id: "Headshot Defense", redirect: { from: "head", to: "torso" } },             // Decision 99
    { id: "Self-Healing", afterEncounter: { checkDie: "1d4", succeedsOn: 3, restoresDie: "1d4" } } ], // Decision 100
  armorUpgradeGlossary: [ { id: "Tri-Weave", minQuality: "Mid", integrityBonus: 10,
    repeatable: true, description: "..." } ], // 6 entries; also resAgainst (Ablative, Warding).
  // An upgrade id in an armor's preInstalledFeatures takes no slot and is read
  // as already in the printed stats (Plasteel's Tri-Weave; Decision 100).
  // (0.10, Decision 104) Natural Armor: how it answers a hit is the F25 stub.
  // Its sources are `grants` of type "naturalArmor" -- on an advantage
  // ({ perRank }), a Major Milestone ({ amount }, per time taken) or a
  // specialization option ({ stat, plus } read as the stat's modifier + plus).
  // A grant with `while` is conditional: shown, never summed; the hit panel
  // asks. `resAgainst` on a grant adds classes it answers (Resilient Spirit).
  naturalArmorRules: { flagged: true, flagNote: "F25 ...", playerNote: "...",
    resAgainst: ["kinetic"], ignoresAp: true, text: "..." },
  armor: [
    { id: "kevlar-vest", name: "Kevlar Vest", slot: "body", coverage: "light",
      prot: "1d6", res: 2, integrity: 20, quality: "Mid", material: "Light",
      availability: "Common", mods: 1, cost: 500, flavorLine: "..." },
    { id: "motorcycle-helmet", name: "Motorcycle Helmet", slot: "head",
      quality: "Low", material: "Light", availability: "Common", cost: 150,
      feature: "Headshot Defense", flavorLine: "..." }
    // 37 entries: 8 light + 8 medium + 9 full body coverage, 6 head, 6 hand.
    // slot:"body" always carries prot/res/integrity; slot:"head"/"hand" never do.
  ],

  // ── Conditions (0.8, Decision 95) ───────────────────────────────────
  // One entry per row of 054's Conditions table, plus Dying (no table row —
  // plan CQ9). effect/recovery/short are display text; the engine reads only
  // the structured hooks, and a Condition with none is text on a chip.
  conditionRules: {
    noStacking: "...", helpless: "...", painClamp: "...",
    rollPenalty:      { appliesTo: "skillChecks", text: "..." },      // Decision 98
    penaltyStacking:  { stacks: true, cap: -8, text: "..." },          // every penalty on one roll
    locationStacking: { perLocation: true }
  },
  bodyLocations: [ { id: "left-arm", name: "Left Arm" } ],   // 6: head, torso, arms, legs
  conditions: [
    { id: "agonized", name: "Agonized", short: "+1 Pain Level", effect: "...", recovery: "...",
      painLevels: 1 },                      // adds to Pain Level before the 0–3 clamp
    { id: "burning", ..., rollPenalty: -1,  // summed onto every Skill Check total
      ongoing: { source: true, per: "round" } },   // or { hp: 1, per: "round" } (Bleeding)
    { id: "frightened", ..., rollPenaltyWhen: { amount: -1, when: "while the source is present" } },
    { id: "prone", ..., attackDefense: -3 },       // shown on Combat lines, never summed
    { id: "stunned", ..., helpless: true },        // the "2 or better hits" banner
    { id: "injured", ..., location: true },        // needs a bodyLocations id — Injured, Maimed only
    { id: "dying", ..., helpless: true, counter: { max: 3, label: "Death Marks", atMax: "..." } }
    // 20 entries.
  ],
  // (0.9, Decision 100) Natural and Focused Healing. The engine proposes BOD
  // per day of rest and never decides the GM's halving; Focused Healing takes
  // the HP the care restored and is the only path that clears `clears` or
  // restores a Massive level. damageRules.whileDying also gains resetCheck/
  // resetText (and carries F24).
  recoveryRules: {
    naturalHealing: { stat: "BOD", speedHealMultiplier: 2, text: "...", speedHealText: "..." },
    focusedHealing: { clears: ["injured"], text: "...", massiveText: "..." },
    // (0.10, Decision 105) 054's list is the master (CQ12). Dose n inside a
    // day regenerates 1 HP every n rounds for `roundsStat` rounds.
    nanomed: { clears: ["agonized", "bleeding", "paralyzed", "poisoned"], endsDying: true,
               roundsStat: "BOD", text: "...", doseText: "..." }
  },

  // ── Magic: archetype-independent half only (0.7, Decision 93) ──────
  // Merged from docs/reference/crb/Magic.md. Origins (Book/Blood/Bound) are
  // deliberately NOT here — that's the Arcanist subtype question, still
  // blocked on the archetype four-way comparison (STATE.md §3). Everything
  // below applies to any caster regardless of subtype.
  domains: [
    { id: "elements", name: "Elements", glyphs: ["Fire", "Lightning", "Water", "Air", "Earth"],
      description: "..." }
    // force, matter, mind, soul — 5 total.
  ],
  spellTiers: [ { id: "cantrip", name: "Cantrip", tn: 7, th: 1, description: "..." } ], // 4: cantrip/standard/advanced/superior
  spellTagGlossary: [ { id: "AOE", description: "..." } ], // 8 entries; AP is the weapon tag's meaning (Decision 116)
  // `spellcraftRules` documents the roll, the five outcomes (Overflow/
  // Manifest/Fizzle/Rupture/Cascade), Concentration, Sovereign Soul,
  // Charging, and the Improvised → Known → Mastered progression as
  // reference text — the same role `armorRules` plays. No engine code
  // executes any of it (Decision 11: the app never rolls dice).
  spellcraftRules: { rollNote: "...", outcomes: { overflow: "...", manifest: "...", fizzle: "...", rupture: "...", cascade: "..." },
    exhaustion: "...", charging: { standardAction: true, tnReductionPerTurn: 1, maxTurns: 3, floorTN: 5, breakCheck: "..." },
    concentration: "...", sovereignSoul: { willingConscious: "No modifier", unconsciousAlly: "+1 TH", unwilling: "+3 TH" },
    castingRequiresVoice: "...", progression: { improvised: "...", known: "...", mastered: "..." },
    teaching: { taught: "...", copiedCold: "..." } },
  enchantmentMaterialCategories: [ { id: "once-living", examples: ["Wood", "Bone", "Leather"], charges: 3,
    onDepletion: "...", onRupture: "...", recharging: "..." } ], // 3: degradable/once-living/inorganic-durable
  enchantmentTimeTable: [ { tier: "cantrip", evocationTH: 1, enchantmentTH: 3, enchantmentMinTime: "3 hours",
    alchemyTH: 6, alchemyMinTime: "6 days" } ], // one row per spell tier
  enchantmentExtendedTime: { note: "...", reductionCapByRank: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 } },
  // `spells` is the full Known-spell catalog: id + tier + domain + glyph +
  // tn/th/range/spellType/damageType/target/effect/defending/overflow/tags.
  // Overflow keeps the WIP's own `[X]` placeholders verbatim — unresolved
  // balance magnitudes, not a transcription gap.
  spells: [
    { id: "firebolt", name: "Firebolt", tier: "standard", domain: "elements", glyph: "Fire",
      tn: 8, th: 2, range: "Short", spellType: "offensive", damageType: "elemental",
      target: "1 person or object", effect: "SP Damage", defending: "Dodge",
      overflow: { "1x": "Damage increases by [X].", "2x+": "Damage increases, and the target is Burning." },
      tags: ["Fire"], flavorLine: "..." }
    // 96 entries: 18 Cantrip + 47 Standard + 17 Advanced + 14 Superior, across
    // the 5 domains. A handful (e.g. Counterspell) have th:null/overflow:null
    // and a `notes` field instead — no Threshold, no Overflow, by design.
  ],

  // ── Cascade and Aberrations (0.11, Decision 106) ─────────────────────
  // Magic.md's two tables and Appendix_Aberrations.md's lists. Rows are
  // ranges on a die the player rolls and enters; `Engine.cascade()` looks
  // them up. `max: null` is open-ended. The Cascade Table starts at 3: a
  // Cascade's Rupture is degree 2 or more, since casting needs TOL above 0.
  cascadeTable: { die: "1d10", rollNote: "...",
    rows: [ { min: 7, max: 8, id: "temporary-aberration", name: "Temporary Aberration",
              aberration: "temporary", effect: "..." } ] },  // 5 rows, 3–4 … 12+
  aberrationTable: { die: "1d10", note: "...",
    rows: [ { min: 1, max: 3, temporary: "good", permanent: "neutral" } ] }, // 3 rows, 1–10
  aberrationCategories: [ { id: "good", name: "Good" } ],   // good / neutral / bad
  // (0.13, Decision 110) the rules for an Aberration the character has: one
  // per id, and the floor an `adjust` stops at.
  aberrationRules: { intro: "...", permanent: "...", noStacking: "...",
                     adjustFloor: 0, adjustNote: "..." },
  // The Cascade's list, NOT the Arcanist's creation-time Unique Aberrations
  // (those are `specialization.options`). `as` is display text naming the
  // Advantage or Disadvantage an entry works like; it grants nothing.
  // (0.13, Decision 110) two optional hooks the engine reads once one is on
  // the character: `painLevels` (Phantom Pain, 1) adds to Pain like Agonized,
  // `adjust` (Drained, { TOL: -2 }) moves a derived stat after its own floor.
  aberrations: [
    { id: "danger-sense", name: "Danger Sense", category: "good",
      as: "Danger Sense Advantage, Rank 3", description: "..." },
    { id: "drained", name: "Drained", category: "bad", adjust: { TOL: -2 }, description: "..." }
    // 39 entries: 15 Good, 15 Neutral, 9 Bad.
  ]
};
```

### The `panels` concept (why archetypes stay generic)

Archetypes differ wildly in what their sheet needs — a grimoire, an augment
manifest, forms, a blood pool. Rather than hardcoding a Cyborg page and an
Arcanist page, each archetype's `coreMechanic.panels` *declares* what UI it
needs from a small set of panel types (`rankedList`, `table`, `tracker`,
`text`). The app renders whatever is declared. When the Cyborg rewrite lands,
you describe its NCI tiers and augment slots as panel declarations in the data
file — no app changes.

Panel types will be finalized in Phase 2 when we know what the five archetypes
actually demand. Where an effect can't be made machine-readable yet, it stays
prose and the sheet displays it as reference text — the app should never block
on un-modeled rules.

A `tracker` counts up from 0 against its `max` (a number, `"TOL"`, or
`"startingSFR"`; none means the player sets it). Three optional fields shape
what it says (Decision 106): `note` is the line under it, `atMax` replaces
that line once the count reaches the max, and `overMax: "cascade"` opens the
Cascade panel once the count passes it. The Arcanist's `tol-spent` uses all
three. The value lives in `trackers.panel[id]` like any other tracker.

A `grimoire` panel (Decision 108) names its `catalog` (`spells`) and keeps
`columns` for the player's own spells. Its rows live in `panelData[id]`. The
numbers it shows come from two `spellcraftRules` entries: `spellPower`
(`{ discipline: "evocation", stat: "WILL" }`, Evocation rank + WILL) and
`mastery` (`{ ipPerTH: 30, thReduction: 1 }`). A third, `spellAttack`
(`{ discipline: "evocation", stats: ["REF", "WILL"] }`, Decision 110), adds
the stats' scores, not their bonuses. Decision 111 adds `startingSpells`
(`{ countFrom: "TOL", discipline: "evocation" }`: TOL + the scaling row's
`startingSpellsRoll`, TH capped at the rank at creation only) and
`castingPool` (`{ discipline: "evocation" }`: a TH above that rank is
marked as reachable only by an exploding 10).

A `reference` panel (Decision 110) names the data sections it `shows`. The
sheet has one renderer per section name and skips a name it has none for.
It renders on the Archetype tab.

---

## 3. Character File Schema (`*.shadows.json`)

```js
{
  meta: {
    schemaVersion: "0.9",
    gamedataVersion: "0.12",          // version of shadows-data.js at save time
    created: "...", updated: "..."
  },

  identity: {
    name: "", age: null, build: "", hair: "", eyes: "", skin: "",
    archetype: "arcanist",
    // NO `specialization` since 0.5 — it lives once, in archetypeChoices, and
    // is derived for display via Engine.specializationLabel() (Decision 79).
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
    // (0.5) THE specialization. One array for every archetype — Aberrations,
    // Subtype, Origin, Bloodline, Chrome Loadout. Length is whatever
    // specializationNeed() resolves from the data (1 unless `countBy` says
    // otherwise). Replaces identity.specialization + subtype + aberrations,
    // which were three fields for one idea and the root of A1/A2.
    specialization: [],
    focusedSkillPicks: [],           // Professional: "chosen at creation" focused skill ids
    naturalAdvantages: [],           // Professional: [{ id, rank }] — also mirrored into
                                     // `advantages` with notes:"natural", cost 0 CP
    disciplines: {}                  // Arcanist: CP-bought ranks { enchantment: 1 } (6 CP each;
                                     // Evocation starting rank from scaling table is NOT stored)
  },

  // Inputs only. base = creation value; ipe = points added via IP after.
  stats:  { BOD: { base: 5, ipe: 0 }, REF: { base: 6, ipe: 0 } /* ... */ },
  skills: { handgun: { rank: 4, ipe: 0 } /* trained skills only */ },

  // `selections` (0.5) answers the entry's `picks`, keyed by pick id. Skill and
  // option picks store an ARRAY of ids, one per slot; text picks store a string.
  // Absent means nothing chosen yet, which every reader tolerates.
  advantages:    [ { id: "favored-skill", rank: 2, notes: "",
                     selections: { skill: ["handguns", "melee"] } } ],
  disadvantages: [ { id: "cursed", rank: 1, notes: "",
                     selections: { detail: "The mark answers to no drug." } } ],
  // Skills carry them too: skills: { "martial-arts": { rank: 3, ipe: 0,
  //   selections: { style: ["karate", "jujitsu"] } } }

  // Current-state trackers (max values are computed, never stored)
  trackers: {
    damage: 0,                       // total HP damage taken
    luck:   { bonus: 0, spent: 0 },  // bonus = CP/advantage buy-ups
    san:    { loss: 0 },             // current SAN = computed max − loss
    sfr:    { spent: 0 },
    // (0.7) No `exhaustion` field: it was never its own resource. A Rupture
    // spends TOL directly; Exhausted is what 0 TOL is called, not a second
    // tracked value (Decision 93).
    credits: { current: 800, ledger: [ { date, amount, note } ] },
    // (0.8) Active Conditions (Decision 95). One entry per id ("you have it or
    // you don't"), except a location-bearing Condition, which is one per body
    // part (Decision 98). Pain, penalties and Helpless are derived, never stored.
    // migrate() drops junk entries and keeps the first of any duplicate.
    conditions: [ { id: "injured", location: "left-arm", note: "" },
                  { id: "dying", marks: 1 } ],
    // (0.8) Plan P4. Health Levels removed by Massive damage (drawn from the
    // right of the track, counted as lost, so they feed Pain), and the part
    // of `damage` that can't regenerate. Written by applyHit (Decision 99);
    // hlState() reads massiveLevels, and nothing reads witheringDamage until
    // an archetype regenerates.
    massiveLevels: 0,
    witheringDamage: 0,
    // (0.9, magic plan M7) Aberrations a Cascade left, or a GM ruled. One per
    // id. Read by aberrationState(); the catalog says what each does
    // (Decision 110), so nothing derived is stored here.
    aberrations: [ { id: "dense-frame", permanence: "permanent", note: "" } ],
    // (0.3) Manual adjustments — milestone benefits & un-modeled effects.
    // Stat-id targets cascade like any input; TOL/WILL/SAN/LUCK/HP apply flat.
    adjustments: [ { target: "BOD", amount: 1, note: "Honed", date } ],
    // (0.3) Generic archetype tracker panels (e.g. Tolerance Load, Blood Pool)
    panel: { "tolerance-load": { value: 0, max: null } }
  },

  // (0.3) Archetype table/toggle panel content — grimoire rows, augment
  // manifests, Werewolf form. Keyed by panel id.
  // (0.9, Decision 108) A grimoire row is EITHER a book spell, where only the
  // id, stage and notes are stored and every number is read from `spells`,
  // OR the player's own, the typed columns plus custom:true. migrate() tags a
  // pre-0.9 row custom and never links a typed name to the book by itself.
  panelData: { grimoire: [ { spellId: "zap", stage: "known", notes: "" },          // "known" | "mastered"
                           { custom: true, "Spell Name": "...", "TN": "...", "Notes": "..." } ],
               form: "Human" },

  powers:  [ /* instances with per-character notes */ ],
  gear:    [ { name, type, notes } ],          // still free-entry; the general
                                                // Equipment chapter is not yet merged
  // (0.6) A weapon entry is EITHER a catalog reference (`id` into the new
  // `weapons` game-data array, `notes` only — stats read from the catalog)
  // OR freeform (`custom: true`, every field preserved as typed, same shape
  // as before 0.6). migrate() tags every pre-0.6 entry `custom: true` rather
  // than guessing which catalog weapon a free-typed name meant. Loadout's
  // catalog picker writes the reference, and Engine.weaponLine() computes the
  // rest (Decision 100).
  weapons: [ { id: "combat-knife", notes: "" },
             { custom: true, name, type, damage, rof, capacity, ammo, features, notes } ],
  // (0.6) Same split as weapons. `integrityLoss` is current-state input (like
  // trackers.damage), not derived — max Integrity comes from the catalog.
  // (0.8, plan P5) worn: the one body piece that rolls PROT (CQ7) · scrapped:
  // driven to 0 by Massive, which integrityLoss alone can't say · upgrades:
  // armorUpgradeGlossary ids. Compromised is derived. Read by armorState()
  // and resolveHit() (Decision 99); written by Loadout (Decision 100).
  // A custom piece may carry `coverage` (light/medium/full); absent reads as
  // light, which is what every reader did before, so a file without it is
  // valid both ways and there is no migrate() step or schema bump.
  armor:   [ { id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] },
             { custom: true, name, prot, res, integrity, coverage, integrityLoss, notes, worn, scrapped, upgrades } ],

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
    → **Superseded in part by Decisions 103 and 109** — TOL's inputs are INT/BOD/COOL (103), and Drained can take maximum TOL below the floor of 1, to 0 (109); WILL and SAN stand.
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
    → **Superseded in part by Decision 97** — a new skill after creation costs a flat 25 IP, not the rank-1 price.
15. **Archetypes:** generic six-block structure (Power Scaling, Baseline
    Traits, Specialization, Core Mechanic, Powers & Vulnerabilities, Growth &
    Milestones), designer-fillable, with `status` badges for tbd/draft content.
16. **(Phase 2)** Ranked Advantages cost `cost` **per rank** (Archery Master
    rank 2 = 12 CP). Disadvantages grant `pointsGranted` per rank.
17. **(Phase 2)** Professional natural advantages are stored as normal
    `advantages` entries with `notes: "natural"` and cost 0 CP — they render
    on the sheet like any advantage but never hit the CP ledger.
18. **(Phase 2)** Arcanist focus-stat bonus may push a stat past 10; the
    modifier curve extrapolates +1 per point above 10 (superseded past 10 by
    Decision 98: +1 per 5 points). Werewolf stat bonus
    allocates to any stat but respects the cap of 10.
    → **Superseded in part by Decision 98** — the curve past 10.
19. **(Phase 2)** Arcanist Disciplines are purchasable in the CP step at
    6 CP/rank, capped at the power level's Max Power Rank. Evocation's
    starting rank comes from the scaling table and is computed, not stored.
20. **(Phase 2)** Aberration prose benefits display as reference text only;
    only structured fields (e.g. `tolBonus`) auto-apply to computed values.
    → Resolved in Phase 3 by Decision 26 (manual adjustments ledger).
21. **(Phase 2)** Common-spell *selection* is deferred to Phase 3; the wizard
    shows the computed count (TOL + 2d4) only. → **Superseded by Decision 25** — the Grimoire decided it: free entry.
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
    → **Superseded in part by Decision 108**: book spells come from the
    catalog, and free entry stays for your own. The "without touching the
    sheet" half was wrong, since a catalog needed a reader and a picker.
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
    → **Superseded in part by Decision 49** — "the last entry is undoable": the one global undo replaced the IP-only one.
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
    → **Superseded in part by Decision 35** — the rail is hidden on every locked tab, not Main only.
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
    → **Superseded in part by Decisions 77 and 87** — "none of it is encoded yet" stopped being true: 77 encoded the selection system, 87 `grants`.

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

74. **(Docs)** **`HANDOFF.md` is retired, and volatile facts live in exactly one
    place.** HANDOFF had become two documents jammed together: about a hundred
    and sixty lines of current position, and two hundred and forty-five lines of
    append-only session log that pushed the useful part below the fold. Worse,
    the same volatile numbers were restated across `CLAUDE.md`, `HANDOFF.md`
    and `docs/README.md`, and every one of them had gone stale — the file a cold
    session reads **first** was telling it the suite was "20 passing, 2 todo"
    when it was 51/1, and that the decision ledger was "at 54" when it was at 73.
    Three sessions started from a wrong picture. So: current position moves to
    **`docs/STATE.md`**, which is *rewritten and never appended* and carries the
    batch board; history moves to **`docs/log/2026.md`**, append-only and never
    revised, because figures stated as-of-a-session are history and history does
    not drift; `CLAUDE.md` carries **no counts at all** and points at STATE for
    them. A stub remains at `docs/HANDOFF.md` so saved prompts still land.
    **The orientation path went from ~1,300 lines to ~250** — `SCHEMA.md` stays
    the authority but is explicitly not read front to back.

    Enforced, because a convention that relies on remembering is the thing that
    just failed: `tests/docs.test.mjs` checks STATE's suite line against the
    real test count, rejects a count reappearing in `CLAUDE.md`, requires the
    decision ledger's numbering to be unbroken, requires every document
    `CLAUDE.md` references to exist, caps STATE's length, and — the F10 case —
    **cross-checks the §5 flag table against `flagged: true` in the data**, so
    closing a flag in one place but not the other fails the build. Its first
    version counted `todo` tests by reading only the `test(` line, missed the
    one real `todo` whose `{ todo: }` sits on the next line, and *agreed with an
    updater script carrying the identical bug* — a guard validating its own
    blind spot. All five checks were mutation-tested afterwards.
    (Ken, 2026-09-02)

75. **(Versioning)** **Four versions, four triggers — and `schemaVersion` stopped
    meaning two things.** The project had three version numbers and no way for
    Ken and Claude to confirm they were looking at the same build: `package.json`
    sat at 0.4.0 with nothing reading it, and Batch 2 had just *removed* the only
    user-visible indicator (the footer's "app phase 3.3", correctly — it was
    roadmap vocabulary aimed at a player). The app now carries **`APP_VERSION`**
    in `src/ui/app.js`, mirrored in `package.json`, printed in the footer, and
    bumped **when a player can see a difference**. Set to **0.5.0**: Batches 1
    and 2 both changed visible behaviour.

    The naming collision mattered more than the missing number. `meta.schemaVersion`
    meant the **game data's content version** inside `shadows-data.js` and the
    **character file's schema version** inside a character — two different things,
    one name, and no way to tell which you were reading. The data key is renamed
    to **`gamedataVersion`**, matching exactly the field it stamps onto
    characters, so `c.meta.gamedataVersion !== D().meta.gamedataVersion` now reads
    as what it is. No character file stores the key *name*, so no `migrate()`
    step was needed.

    The data file's own versioning comment was also wrong: it said to bump only
    on *shape* changes, which is not what anyone has ever done — the CRB v4 pass
    bumped 0.2 → 0.3 for content, correctly, and Decision 68 codified that rule
    afterwards. The comment now matches practice. `tests/docs.test.mjs` fails the
    build if `APP_VERSION`, `package.json` and `STATE.md` disagree, if the footer
    stops rendering the constant, or if the data file reverts to calling its
    version `schemaVersion`. (Ken, 2026-09-02)

76. **(Voice)** **`docs/VOICE-APP.md` is adopted, not draft.** Ken reviewed and
    accepted it. It is the standard for every string a player reads in the app,
    it derives from `reference/GUIDE_Shadows_Voice.md` (which stays the master
    for rulebook prose), and it is enforced by `tests/voice.test.mjs` rather than
    by anyone remembering it. The operative rule is one question — **is the
    player stuck right now?** Stuck means tool voice: clear, short, out of the
    way. Not stuck means the city can speak. (Ken, 2026-09-02)

77. **(Batch 3)** **One selection system, three hosts.** Advantages,
    disadvantages and skills now declare `picks` / `excludes` / `requires`, and
    a character stores its answers as `selections` on the entry that asked. The
    rev 9 audit §4 sketched this from a feature request; Decision 58 recorded
    that the CRB had turned the sketch into a requirement and named ~15 entries
    as the corpus. All fifteen are encoded, plus Martial Arts styles.

    Three shapes, deliberately small: a **fixed list** (`from.ids` — Common
    Sense's four named skills), a **category** (`from.category`), and **free
    text** (`type: "text"`). `perRank` scales the slot count with rank and
    `distinct` refuses a repeat, which together express the sentence four
    entries share — *"Choose a different Skill for each rank."* `optional`
    marks slots that are a **cap rather than a demand**, which is what Martial
    Arts' *"up to two styles"* actually says, and without it a trained martial
    artist who had not picked a style could not lock their character.

    `optionLock` is **symmetric**: declaring `excludes` on one entry locks the
    other even though it says nothing, so a mutual lock is stated once in the
    data and cannot half-exist. `requires` deliberately reuses the milestone
    prerequisite vocabulary rather than inventing a second way to say "REF 6".

    **No entry declares `excludes` or `requires` yet**, because the CRB names
    no pair. Both are exercised against a synthetic fixture pushed into the
    loaded data by the test. Writing a lock into the data to give the machinery
    something to chew on would be resolving a rules question in code, and one
    invented mutual exclusion is exactly the kind of thing that reads as
    authoritative six months later. (Ken, 2026-09-03)

78. **(Batch 3)** **The mechanical picks are the app's business; the fiction is
    the table's.** Ten entries — Immunity, Followers/Minion, Cursed, Fanatic,
    Pact, Minor Insanity, Addiction, Enemies, Notorious, Defect/Flaw — say some
    version of *"work out the details with your GM."* Treating an empty text
    field as an error like any other would **block a player from locking a
    character** because a conversation had not happened yet, at session zero,
    which is precisely when it has not happened. So a pick marked `gmApproval`
    produces a **warning**; a pick with a fixed list, a category or a per-rank
    count produces an **error**. The line is not "text vs. list", it is *can the
    app tell whether this is right?* Where it cannot, it says so and gets out of
    the way — the same principle as Decision 66's floors, which the engine
    carries and displays but never applies. (Ken, 2026-09-03)

79. **(A3 — closes A1 and A2)** **One specialization model, and the count comes
    from the data.** There were three fields for one idea:
    `identity.specialization`, `archetypeChoices.subtype` (its duplicate) and
    `archetypeChoices.aberrations` (the multi-select). Two renderers each
    special-cased a subset, which is why the Arcanist rendered its aberrations
    **twice and required both** (A1) and why the sheet showed a Professional
    "none chosen" under a header naming the very subtype it could not see (A2).
    Both were symptoms; the parallel models were the disease.

    **Character schema 0.4 → 0.5.** `archetypeChoices.specialization: [ids]` is
    the only storage; `identity.specialization` and `subtype` are **derived for
    display** and deleted by `migrate()`, which folds all three into the array
    in that precedence order. Deleting rather than ignoring them is the point —
    a field left lying around is a path a future reader drifts back onto.

    The count needed **no new data field.** The audit proposed
    `selectMode: "single" | "count"`; the Arcanist already carried
    `specialization.countBy: "campaignPowerScaling.aberrations"`, and the other
    four archetypes carried nothing, which *is* "exactly one". `countBy` present
    → resolve the path; absent → 1. Adding `selectMode` would have meant editing
    five entries to state what their silence already stated. Biomech's Chrome
    Loadout is now a data entry rather than a fourth branch, which was the
    reason to unify in the first place. (Ken, 2026-09-03)

80. **(Batch 3)** **Two realms, one trap, written down.** `loadEngine()` runs
    the engine and the data inside a `vm` context, so every array they return
    carries **that** realm's `Array.prototype`. `assert.deepEqual` is strict and
    compares prototypes, so an engine array never matches a literal `[]` written
    in a test file: the failure prints two identical-looking values, says "not
    equal", and shows no difference at all. It cost two debugging rounds in this
    batch. Spread engine arrays into local ones on **both** sides of a
    `deepEqual`, or assert on `.length`. The warning now sits on `loadEngine()`
    itself, where the next session meets it before writing the assertion rather
    than after. (Ken, 2026-09-03)

81. **(Batch 3)** **A stale `natural` advantage no longer survives a subtype
    change.** Found while rewriting the specialization handler, not looked for.
    Professional Natural Advantages are stored in
    `archetypeChoices.naturalAdvantages` **and mirrored** into `ch.advantages`
    with `notes: "natural"`. Changing subtype cleared the first and left the
    second, so a player who switched from Cleaner to Enforcer kept the Cleaner's
    free advantages — invisibly, because the pool readout counts the ledger and
    not the mirror. Both sides are cleared together now. This is the same
    two-parallel-models fault as A1/A2, one layer down, and the general lesson
    holds: **a mirror needs one writer.** (Ken, 2026-09-03)

82. **(Batch 3, post-review)** **A trait held twice is still one trait — and an
    adversarial review found it.** PR #7 was reviewed by a separate model in a
    fresh context with no access to the reasoning that produced it. Eight
    findings, all eight verified against the code before anything was changed;
    five were real and are fixed here.

    **The substantive one.** A Professional can hold the *same* advantage on two
    ledger rows: once free through the Natural Advantages pool
    (`notes: "natural"`) and once bought with CP. `entryFor` addressed a trait by
    id alone, so `picksFor` / `setSelection` / `trimSelections` read and wrote
    **whichever row came first** — which depended on allocation order, silently.
    `favored-skill` is in that pool *and* carries picks, so this was reachable
    with shipped data on the day it merged. The fix states the model rather than
    patching the symptom: **two rows, one trait.** Ranks add up, the purchased
    row owns the store, and `setSelection` deletes any store on the other row so
    the two cannot drift apart — which is A1's disease again, one layer down and
    for the third time (see also Decision 81).

    **The other four.** A free-only trait demanded picks that had no control to
    fill them, because the CP step rendered a control only when the *purchased*
    rank was above zero — an error a player could not clear. `Resume draft`
    loaded straight from `localStorage` while both other load paths called
    `migrate()`, so a draft written under schema 0.4 came back with its
    specialization in a field no reader looks at any more. Decision 81's mirror
    fix was wired into the *subtype* handler only, leaving both *archetype*
    change handlers stranding the same rows — both already warned that they
    cleared natural advantages, and now they do, through one shared
    `resetArchetypeChoices`. And `specializationNeed` fell back to 1 when a
    declared `countBy` could not resolve, inventing a requirement on a corrupt
    import where `main` had raised none.

    A sixth defect surfaced while fixing the first: the natural-advantage mirror
    is rebuilt from the ledger on every rank change, which threw away the
    `selections` the free row had just been given. Found by asking what else
    wrote to the row that had become a store.

    **What the process is worth recording for.** Two of the guards written for
    these findings **passed before the fix** — one refused for the wrong reason
    (no slot, not a duplicate), one tested an engine path that was already
    correct when the bug was entirely in the UI. Both were tightened until they
    failed first. A review that hands you a finding does not hand you a guard,
    and *"the test passes"* is not evidence until it has been seen to fail.
    Eight mutations, eight caught. (Ken, 2026-09-03)

83. **(Batch 3a)** **The ledger's ✓ meant "no errors," not "nothing left to
    do."** `renderLedger` marked a passed step done whenever `validate()` came
    back with no *errors*, which is also true of a step sitting on open
    *warnings* — a player who walked past Stats or Skills with points still
    unspent got the same green checkmark as a player who had spent every one.
    Nothing was blocking them; nothing was telling them either.

    A passed step now renders one of three states: **done** (no errors, no
    warnings), **active** (the current step), or **attention** (passed, but
    `validate()` still has something to say) — shown as `!` in gold rather than
    a checkmark. A callout beneath the ledger names how many steps are in that
    state and jumps to the first one. No new validation was written; this reads
    the warnings `validate()` already produced and stops discarding them at the
    row level. Guard: `tests/smoke.test.mjs`, confirmed failing against the
    pre-fix renderer before being kept. (Ken + Claude, 2026-09-04)

84. **(Docs)** **Nine CRB v4 chapters are mirrored into `docs/reference/crb/`,
    following the pattern Decision 69 set for the Voice & Style Guide.** Same
    deal: a mirror, not a second master — the live document wins on conflict,
    and a stale copy is re-pulled rather than reconciled in place. The
    difference from 69 is scale, so the shared provenance header moved to one
    `docs/reference/crb/README.md` instead of repeating it in each file.
    Chosen chapters are the ones that gate engine formulas, merged data, or an
    open flag today: `020_Synergy_System`, `030_Core_Mechanics`,
    `040_Character_Creation`, `041_Archetypes`, `042_Skills`, `043_Advantages`,
    `044_Disadvantages`, `054_Conditions_and_Recovery`, `Gear`. Pulling them
    confirmed — but did not resolve — F1, F2, F8, F9, F11, F13, F16 and the
    unnumbered beyond-10 flag: the WIP text still says what the existing
    `flagNote`s already recorded, so nothing here is a ruling. The remaining
    seven chapters (onboarding, the three encounter chapters, Downtime) stay
    unmirrored until they actually gate a batch — `055_Downtime` in particular
    is short in the source because the Advancement section F12 needs hasn't
    been written yet. (Ken + Claude, 2026-09-04)

85. **(Docs)** **`GUIDE_Shadows_Voice.md` is re-pulled with pandoc.** Its first
    pull (Decision 69, 2026-09-02) predates pandoc being available in-session
    and used a cruder extraction that flattened all bold/italic emphasis and
    every blockquote to plain text — a real loss on a *style* guide, where
    which line is a worked quote versus body prose is part of what it's
    teaching. No wording changed, only which characters carry emphasis; the
    re-pull note is in the file's own header rather than a second entry here.
    (Ken + Claude, 2026-09-04)

86. **(Repository)** **Decision 54's deferred refactor lands: `src/ui/app.js`
    splits into four classic scripts.** `shared.js` (state, persistence, the
    commit/render loop, cross-cutting render helpers), `wizard.js` (the eight
    creation-step renderers), `sheet.js` (the nine locked-sheet renderers),
    and a trimmed `app.js` (chrome, event wiring, boot) — loaded in that order
    after `engine.js`. No namespace object: classic `<script>` tags in one
    document already share a single global scope executed in order (the same
    mechanism `Engine` and `window.SHADOWS_DATA` already rely on), so the
    split needed zero renames — every identifier moved verbatim. Pulled ahead
    of Batch 3b rather than after it (the original order in SCHEMA §6) because
    3b turned out to be blocked on Educated's step-ordering ruling, which this
    branch never touches; 3a had already resolved that ruling by construction,
    so nothing here waits on it either way. Zero behaviour change: the suite
    holds at 87 passing / 0 todo, and `index.html`'s script order and
    `tests/build.test.mjs`'s manifest both grew by three entries, nothing else.
    (Ken + Claude, 2026-09-05)

87. **(Batch 3b)** **The other half of Decision 58 lands: a `grants` array
    gives an advantage/disadvantage a static mechanical effect.** Unlike
    `picks`, nothing here is a player choice — `grants: [{type, ...}]` on the
    entry, read fresh every call by one new engine function, `Engine.grants(ch)`,
    which scans held advantages and disadvantages and sums by type. Four
    existing readers now add it in rather than computing cleanly off stats
    alone: `skillPool()` (Educated, `skillPoints`/`perRank`), `health()` (Hard
    to Kill, `hpPerLevel`/`perRank`, applied to `hpPer` so it lands on every
    Health Level as the CRB says), `luckState()` (Lucky/Unlucky, `luckCost`
    keyed by a new stable `id` on each `resources.luck.spend[]` entry —
    `boost`/`explode` — rather than string-matching the prose `action` field),
    and `milestoneState()` (Long-Lived, `milestone`/`kind`/`atRank`, added
    straight onto `minorAvail`/`majorAvail` as extra unlocked slots so the
    existing pick-list UI needs no changes). Educated growing the Skill Point
    pool retroactively at the CP step needed no new wizard-flow code either —
    Batch 3a's attention-state ledger already re-validates a passed step
    live, so it just starts firing once `skillPool()` is grants-aware. Thick
    Skin stays out per the existing Batch 3b scope note (armor design in
    flux). `gamedataVersion` **0.4 → 0.5** (a held character's computed
    pools/costs change); `APP_VERSION` **0.7.0 → 0.8.0** minor (a player can
    see a difference); no character-schema bump — nothing new is stored on
    the character. (Ken + Claude, 2026-09-05)

88. **(Batch 3b, F17)** **Long-Lived's ranks stack.** The CRB gives an
    "Effect" per rank row rather than "gain another," so whether rank 3 grants
    2 Minor + 1 Major Milestone slots (stacking) or replaces ranks 1-2's
    effect with just 1 Major was genuinely ambiguous — a rules call, not an
    app one. Ken confirmed stacking; implemented that way and flagged
    (`flagged: true`, F17) pending Deighton's sign-off as the rules authority,
    rather than treated as fully settled on Ken's word alone. Stacking was
    also the safer default regardless — an over-grant is easy to spot and
    correct at the table, a silent under-grant is not. (Ken + Claude, 2026-09-05)

89. **A printable sheet is a second rendering path, not a second data model.**
    `Sheet.renderPrintView(ch?)` renders a universal three-page paper layout
    (Character Info/Stats/Combat/Health/Defense, full Skills, Weapons/Gear/
    Advantages/Disadvantages/Notes) styled by a new `print.css` — its own
    white/violet paper theme, independent of the app's dark on-screen UI.
    `ch` is optional: present, it reads the same engine outputs the live sheet
    already uses; absent, it renders a blank fillable template from
    `SHADOWS_DATA` alone, since every label on a blank sheet is game data, not
    a character. Defense prints blank either way — the app has no armor model
    yet (F18) — with plain-language copy rather than inventing one to fill
    the layout. Reachable as "Print sheet" in the sheet header for a live
    character, and "Print a blank character sheet" on Home for a
    physical-only player who never opens the wizard.
    A second build artifact, `dist/shadows-blank-sheet.html`
    (`tools/build.mjs`'s `buildBlankSheetHtml()`), boots the real app in
    jsdom and calls the same `renderPrintView(null)` there, so a standalone
    download link can never drift from what the live app renders — no
    hand-maintained second template. No schema bump, no `gamedataVersion`
    bump (no computed value changed); `APP_VERSION` **0.8.0 → 0.9.0** minor
    (a player can now do something new). (Ken + Claude, 2026-09-07)

90. **A light theme toggle, ported as a mechanism rather than a token set.**
    `getdangerousgames.com` and `shadowsrpg.com` share a `theme.css` /
    `theme-init.js` / `theme-toggle.js` trio built on their own semantic
    tokens (`--bg-page`, `--card-bg`, `--text-primary`...), which don't exist
    here — `shadows.css` names its tokens after the brand palette directly
    (`--ground`, `--panel`, `--frame`, `--cyan`, `--gold`...) and is referenced
    by name in ~230 places. Rewriting the stylesheet onto the shared token
    names would touch all of them for zero player-visible difference, so this
    keeps the app's own token names and ports the *mechanism* instead: an
    `html[data-theme]` attribute, a blocking pre-paint script, `localStorage`
    persistence, and a sun/moon toggle button — same architecture, this app's
    variable names.
    `--frame` (Deep Circuit) and `--violet` (Aether Pulse) already pass WCAG
    text contrast against the light ground and stay fixed across both themes,
    same as the brand-constant split the other two sites use. `--cyan`,
    `--green`, `--gold` and `--magenta` were tuned for the dark ground only
    (1.5–2.2:1 against `#F5F4F2` as text, all failing AA) and fold onto
    whichever constant already carries that role on the other two sites:
    cyan/green → `--frame`, gold/magenta → `--violet`. `--ink` flips too —
    it exists to put dark text on a bright button (`.btn.go`), and in light
    mode that button's background is a folded (now dark-navy) token, so the
    text needs to go light instead.
    The toggle button is static markup in `index.html`, sitting beside
    `#hdractions` rather than inside it, because `renderTopChrome()` clears
    `#hdractions` on every screen change (home/wizard/sheet) and the theme
    preference is global, not sheet-only — a dynamically-rendered button
    would vanish the moment the screen changed. `theme-init.js` runs as its
    own `<script src>`, first in `<head>` before the `shadows.css` `<link>`,
    which is a different concern from the data → icons → engine → ui load
    order that follows it in `<body>` — both orders are enforced by
    `tests/build.test.mjs`. No schema bump, no `gamedataVersion` bump (no
    computed value changed); `APP_VERSION` **0.9.0 → 0.10.0** minor (a player
    can now do something new). (Ken + Claude, 2026-09-07)
91. **(PR #7 review, closed)** **One prerequisite vocabulary, checked in one
    place.** The rev-9 adversarial review found `requirementState` (an
    advantage/disadvantage/skill's `requires`) reimplementing `majorPrereqs`
    (a milestone's `prerequisites`) rather than sharing it, so fields the
    milestone side already understood — `majorCount`, `milestones`, `gear`,
    `note`, `gmApproval` — were silently treated as satisfied in a `requires`
    block, because `requirementState` never read them at all. Both now call a
    single `checkPrereqs(ch, p)`; `majorPrereqs` adds only the "already
    taken" check, which is about the milestone's identity, not its
    prerequisites.
    The same review found the Professional stat gate special-cased as its own
    `if (a.id==="professional")` stat loop, duplicating `requirementState`
    instead of using it — exactly the per-archetype special-casing Decision
    79 (A3) set out to end. Fixed by renaming the subtype field from
    `requiredStats` to `requires: { stats: {...} }` (8 sites in
    `shadows-data.js`) and routing the gate through `checkPrereqs`; the
    `if (a.id==="professional")` branch itself stays, since Professional is
    still the only archetype with a specialization-level gate to check, but
    the stat-check code inside it is gone.
    Third: `optionLock`'s `heldIds` scanned only advantages and disadvantages,
    so a skill could never appear on either side of an `excludes` pair even
    though skills host `picks` the same way. `heldIds` now folds in held
    skills, and `traitName` and the exclusion lookup resolve skill ids too.
    No entry in the data declares `excludes`/`requires`/`prerequisites`
    beyond the synthetic test fixtures (Decision 77), so none of this was
    reachable by a player — it closes debt, not a live bug. Two new tests in
    `engine.test.mjs` exercise the previously-ignored fields and the
    skill-exclusion directions, mutation-tested against the pre-fix code
    (both failed there, both pass now) rather than only against post-fix
    behavior. (Ken + Claude, 2026-09-07)

92. **(Weapons, Ammo & Armor — data)** **The equipment chapter merges as
    catalogs, not as engine logic.** `docs/reference/crb/Gear.md` (mirrored
    2026-09-04, re-confirmed byte-identical to Ken's 2026-09-12 re-attachment)
    turned out to already be a complete, populated catalog rather than the
    placeholder F18 had assumed — every earlier session apparently stopped
    reading after the introduction. Merged as seven new game-data arrays
    (`weapons` 54, `ammunition` 9, `arrowheads` 11, `armor` 37) plus five
    reference glossaries (`weaponTagGlossary`, `weaponFeatureGlossary`,
    `weaponModGlossary`, `armorFeatureGlossary`, `armorUpgradeGlossary`) and
    `armorRules`, which documents the PROT/RES/Integrity mechanic as
    reference text the same way `ip.statCost` documents IP math — no engine
    code executes any of it. Tags and Features are stored as the exact
    strings the book prints, including per-weapon parameters like
    "Area (5m)", rather than forced into a fixed id set; a handful of tags
    used in weapon tables have no formal CRB definition at all (Suppression,
    Blast, Anti-Materiel, "Reach" as a tag distinct from the Reach column)
    and carry `flagged: true` rather than an invented rule.
    Character schema **0.5 → 0.6**: a `weapons` entry is now either a catalog
    reference (`id` + `notes`, stats read from the catalog) or freeform
    (`custom: true`, every field preserved exactly as the old free-text shape
    stored it); `migrate()` tags every pre-0.6 entry `custom: true` rather
    than guessing which catalog weapon a player's free-typed name meant. A
    new `armor` field follows the same split, with `integrityLoss` as
    current-state input (same category as `trackers.damage`) rather than a
    derived value. Game data **0.5 → 0.6** for the new content itself.
    Deliberately **not** built this batch: the Loadout tab's UI still edits
    the old free-text columns (no picker references the new catalogs yet),
    there is no Conditions system, and Massive damage math is reference text
    only — those are a second, engine-focused batch by design, so the two
    kinds of risk (content transcription vs. new engine machinery) don't ship
    in the same review. See `log/2026.md` for the full account, including the
    session's own correction of an F20 flag opened in error two entries
    earlier. (Ken + Claude, 2026-09-12)

93. **(Magic — archetype-independent half, data)** **The Magic chapter splits
    cleanly into a universal Spellcraft system and an archetype question
    (Origins), and only the first merges here.** `Magic.md` (Ken's WIP,
    reviewed 2026-09-20) puts Origins (Book/Blood/Bound) explicitly in "the
    Arcanist chapter" — that's the subtypes/spheres/implements question
    STATE.md §3 already had waiting on the four-way Deighton/Scott/Bill/Ken
    comparison, so it stays out. Everything else — the Spellcraft roll,
    Domains/Glyphs, the four spell tiers, Concentration, Sovereign Soul,
    Charging, the Known/Mastered progression, Enchantment/Alchemy's
    materials and time rules — applies to any caster regardless of subtype,
    and merges as five new game-data structures: `domains` (5), `spells`
    (96, the full Known-spell catalog across Cantrip/Standard/Advanced/
    Superior), `spellTiers`, `spellcraftRules` (reference text, the same
    role `armorRules` plays — no engine code executes any of it, matching
    Decision 11), and `enchantmentMaterialCategories`/`enchantmentTimeTable`/
    `enchantmentExtendedTime`. `spellTagGlossary` follows the same pattern
    Decision 92 used for undefined weapon tags: `AP` appears on one spell
    but isn't in the WIP's own tag list, so it's `flagged: true` rather than
    assumed. Overflow text keeps the WIP's own `[X]` placeholders verbatim —
    those are unresolved balance magnitudes, not a transcription gap, and
    none was invented to fill one.
    **This also corrects a live mechanical error, not just adds content.**
    The Arcanist's `coreMechanic.description` previously described Rupture
    as "Duds accumulate into an Exhaustion pool separate from TOL, and a Dud
    that pushes Exhaustion past TOL causes a Rupture" — a mechanic the WIP
    never specified this way. The corrected rule (confirmed directly with
    Scott, 2026-09-20): a Rupture is a per-roll outcome (Duds exceed Hits
    *that roll*) and spends TOL directly, by the Rupture's degree.
    Exhausted is what a character is at 0 TOL — a condition, not a second
    tracked resource layered on top of it. The TOL formula itself
    (`derived.TOL` inputs INT/COOL/EMP) was independently re-checked against
    the WIP during this session and needed no change; a candidate
    discrepancy (INT/BOD/COOL) traced back to a misreading, not a real
    drift, and Scott confirmed the formula on record before anything here
    was touched — worth naming because Decision 9 could otherwise have been
    "corrected" on a bad read.
    **Schema consequence:** the Arcanist's `exhaustion` tracker panel
    (`type: "tracker", max: "TOL"`) is removed, and so is the special-cased
    `trackers.exhaustion` field it was hand-wired to in `app.js`/`sheet.js`
    (pre-dating the generic `trackers.panel[id]` mechanism Decision 26/87
    established and never migrated onto it). `migrate()` drops a pre-0.7
    character's `trackers.exhaustion` value outright rather than carrying it
    forward under a new name — there is nothing to preserve, since the old
    field never meant what the corrected rule needs tracked. Character
    schema **0.6 → 0.7**. The Grimoire panel gains an `Overflow` column.
    Game data **0.6 → 0.7** for the new content and the corrected
    description text. App **0.10.0 → 0.10.1** (patch): an existing Arcanist
    draft renders a different tracker panel and different Discipline/Magic
    copy, which is a player-visible difference even though the archetype is
    still `status: "draft"`.
    Deliberately **not** built this batch: Origins/subtypes (blocked, see
    above), wiring the Grimoire table to reference `spells` by id (still
    free-entry — an engine+UI batch, same split Decision 92 drew for the
    Loadout picker; → **built by Decision 108**), and the Tools of the Trade pricing tables (every row is
    still `[X] Ç` in the WIP, not ready to merge as a finished catalog the
    way the equipment chapter's pricing was). (Ken + Claude, 2026-09-20)
    → **Superseded in part by Decisions 103 and 116** — 103: its note that INT/BOD/COOL was a misreading: Deighton ruled TOL is INT/BOD/COOL. 116: `AP` is no longer flagged; it means Armor Piercing, as the weapon tag does.

94. **(Print sheet — visual redesign, app)** **The printable sheet's front
    page moves from a linear stack of full-width sections to a case-file
    layout — a spine tab strip plus chamfered cards, Stats narrow left,
    everything else stacked right — and starts drawing from Scott's real
    Affinity artwork instead of an invented approximation.** Scott exported
    SVGs of his in-progress character-sheet redesign (the page frame, a
    circuit-trace/hex background texture, and a stat "combo dial" concept);
    the frame's exact chamfer/notch path and its color (`#722B8D`) come from
    that file's real coordinates, traced via the browser's own transform
    math, not eyeballed. `print.css` carries both as data-URI custom
    properties (`--p-frame`, `--p-texture`) drawn as a stroke/background
    overlay — deliberately **not** a `clip-path` on the content itself: a
    first attempt clip-path'ed real page content to the frame's outline and
    silently deleted the "SHADOWS" wordmark, because that notch is a
    separate protruding tab in Scott's design, not empty space cut from a
    rectangle. **Known limitation, left open:** the overlay renders
    correctly on screen (confirmed by force-enabling the print stylesheet)
    but not yet in Chrome's actual print/PDF output — most likely a
    print-pipeline quirk specific to `background-image` on generated
    (`::before`/`::after`) content, since ordinary `background-color`
    elements print fine. Kept rather than reverted because it fails inert
    (no layout break, nothing hidden) and Scott's source is itself a
    work-in-progress two-page **portrait** spread with only Stats built (in
    two competing styles — a vertical hex-dial sidebar vs. a plain ruled
    table) — a second, complete handoff is expected, at which point
    portrait-vs-landscape becomes a real decision rather than an assumption;
    the print sheet stays landscape until then.
    Two more changes from the same pass, independent of the Scott assets:
    the Health Levels ladder now groups its cells into Pain Level bands — a
    gap plus a border-weight/color step at each threshold, read live from
    `D.resources.healthLevels.painLevels` so a data change to the bands
    moves the rendering automatically, never hardcoded. (A first version
    gave each band its own labeled row; that added roughly 190px and pushed
    the front page onto a second physical sheet — the same session also
    fixed a real bug where the printed page never showed content at all
    (`#printSheet` was never un-hidden for print media) and a pre-existing
    overflow on the Loadout page that clipped the Notes box across a page
    break; see `log/2026.md` for both. Shipped health-ladder version is one
    row, grouped by spacing and border weight only.) And the Skills page
    moved from one full-width
    table to two panels split by category row-count rather than a fixed
    proportion, each skill row now carrying its Primary/Synergy stat as an
    icon badge (the same brand icon set the live sheet already ships)
    instead of a bare text column.
    App **0.10.1 → 0.11.0** (minor): a materially different look for an
    existing capability, not a bug fix and not new data. No game-data or
    character-schema change. (Ken + Scott + Claude, 2026-09-21)

95. **(Conditions — catalog and schema 0.8, data + engine)** **Conditions
    are a data catalog with structured effects, and the active ones are
    inputs on the character.** Ken signed off the combat plan's §3
    (`plans/combat-and-conditions.md`) on 2026-09-22: P1–P7 and P9 as
    written, P8 renamed from "Reset" to **"Turn Reset"** so the button reads
    as an encounter helper. This decision locks only what Session 2 built;
    the rest of §3 locks when the session that builds it numbers it.
    **Data (game data 0.7 → 0.8):** a top-level `conditions` array — the 19
    rows of `054_Conditions_and_Recovery.md`'s table plus **Dying**, which
    054 treats as a Condition in prose and recovery but gives no row (plan
    CQ9, a CRB doc fix for Ken). Where Gear's older Conditions table
    disagrees with 054 (plan CQ8 — five rows), the app follows 054. Each
    entry carries display text (`short`, `effect`, `recovery`) and only the
    hooks the engine can compute: `painLevels`, `rollPenalty`,
    `rollPenaltyWhen`, `attackDefense`, `helpless`, `ongoing`, `location`,
    `counter`. Everything else (Blinded's autofail, Grappled's −5 to
    sophisticated movement, Poisoned's secondary Condition) is text on the
    chip. `bodyLocations` (six ids) and `conditionRules` (the three stubbed
    rules below, each `flagged` with a `playerNote`) sit beside it. Adding a
    Condition is a data edit with zero app changes. Dying's Death Marks are a
    generic `counter` (`max`, `label`, `atMax`), not an id special case.
    **Character (schema 0.7 → 0.8):** `trackers.conditions: [{ id,
    location?, marks?, note? }]`, plus plan P4's `trackers.massiveLevels` and
    `trackers.witheringDamage` and P5's `armor[i].worn`/`scrapped`/`upgrades`
    — landed together so there is one migration, though nothing reads the
    damage or armor fields until Session 3. "You have it or you don't":
    `Engine.addCondition()` refuses a second entry with the same id, except a
    location-bearing Condition, which keys by id + body part (**F22** stub:
    an Injured arm and an Injured leg are two entries) and demands a body
    part. `migrate()` drops junk entries and keeps the first of any
    duplicate, so a hand-edited file can't smuggle one past the rule.
    `versionCheck()` reports a Condition id the data no longer defines;
    `conditionState()` still renders it by name with no effects. Every add,
    clear, Death Mark and note goes through `commit()`, so it is undoable
    with no new undo code. (Ken + Claude, 2026-09-22)

96. **(Conditions — what they do to the numbers, engine + app)** **Pain
    Level is the Health-Levels band plus Condition Pain, clamped 0–3; a
    Condition's flat penalty lands on every Skill Check total; attack/defense
    and conditional penalties are shown, never summed.** `painState()` adds
    `conditionState().painLevels` to the band for HL lost and clamps to the
    table ("never falls below 0 or climbs above 3", 054) — Agonized at Pain 0
    reads 1, at Pain 3 stays 3 — and returns `fromHealth`/`fromConditions` so
    the sheet can say where the number came from. Condition Pain carries the
    full per-level penalty (Skill, Essence die, Breaker %), because it *is*
    a Pain Level. A flat `rollPenalty` (Disoriented, Burning, Shocked) is
    summed into `skillLine().checkBonus` and reported separately as
    `breakdown.conditions`. Stubbed pending Deighton: **F20** — it reaches
    Skill Checks only, not Essence dice or Breaker % (plan CQ1); **F21** —
    different Conditions' penalties stack with no cap (plan CQ2). Each stub
    renders its `playerNote` on Trackers only when a Condition it governs is
    active, so the uncertainty surfaces where it bites instead of on every
    sheet. `attackDefense` (Blinded −5, Prone −3, Restrained −5) is listed on
    Main's Combat section and `rollPenaltyWhen` (Frightened) beside the
    totals, both marked "not in the totals" — the CRB states them for
    attack/defense and for "while the source is present", neither of which
    the sheet can know. **UI:** Conditions chips on Main (under the vitals
    strip), full cards with effect, recovery text and a note field on
    Trackers, one add row with a body-part picker that appears only for a
    Condition that needs one → **Superseded in part by Decisions 107 and 110** (107:
    the add row became a chip palette, and Main's chips open their details; 110:
    Pain also counts an Aberration's `painLevels`, Phantom Pain), a Helpless banner, Death Mark pips, and a
    "Cond" pill in the vitals bar. **Print:** a Conditions tick list under
    Stats on the front page, with body-part Conditions and Dying's Death
    Marks on full-width rows. That column had about 100px spare below Stats.
    A first two-column list cost 203px and pushed the front page past one
    sheet, just as the stacked health ladder did in Decision 94. The shipped
    version is 150px and holds the page at its 720px minimum both blank and
    filled, with about 2px spare on a filled sheet. That was measured by
    force-enabling `print.css` in the browser, not asserted by a test, since
    jsdom has no layout. Treat any further addition to that column as a page
    break. App **0.11.0 → 0.12.0** (minor, new capability). (Ken + Claude,
    2026-09-22)

97. **(Design-team rulings, 2026-09-22 — rules + data + engine)** **Four
    flags close on a ruling from the design team (Scott + Deighton), and a
    new skill after creation costs a flat 25 IP.** F1: a LUCK point costs
    1 CP at creation. F2: boosting a skill, stat or power costs 1 CP per
    point at creation, across all three. Both were already the stubbed
    values, so only the flags go — no computed value moves. F17: Long-Lived's
    ranks stack (rank 3 = 2 Minor + 1 Major Milestone slots), and it is
    creation-only, so a character starts with them — as Decision 88 already
    built it. **F14 changes a price:** at creation, rank 0 → 1 costs 1 Skill
    Point (the pool already charged that); after creation, learning a new
    skill costs **25 IP**, not the rank-1 price of 5 (3 Focused) the app
    stubbed. The designers' reason: it makes a point in any skill you expect
    to want worth buying at creation, and a rank switches on Synergy. The
    price is data (`ip.skillIncreaseCost.newSkill`); `ipCost()` reads it
    whenever the current rank is 0. Past rank 0 the formula is unchanged
    (5 × current rank, Focused 3 ×). **Flat for Focused skills too:** a
    Professional's Focused skill at rank 0 also costs 25 — confirmed by the
    designers "for now". The CRB's
    Advancement text should state the 25 (a doc fix for Ken). Folded into
    game data 0.8, which has not shipped; no separate bump. Also answered the
    same day: plan CQ8 — the Conditions and Recovery chapter is the master
    document for Conditions, and Gear's table becomes a pointer to it (a CRB
    edit for Ken; the app already follows 054, Decision 95). **F8 stays
    open**: the designers want to playtest how many Stat Points people
    realistically end up with before choosing between the flat and scaled
    rolls. (Ken + Scott + Deighton + Claude, 2026-09-22)

98. **(Design-team rulings, part 2, 2026-09-22 — rules + data + engine)**
    **The stat curve past 10 is settled, the three Conditions stubs close,
    and the combat plan's Session 3 questions are answered.** From Scott +
    Deighton, the same day as Decision 97:
    - **Stats past 10** (the old unnumbered `statMod` flag): 11–15 = +5,
      16–20 = +6, 21–25 = +7, another +1 for every 5 points after that.
      `statMod()` read the top of the curve as +1 per point, so an 11 was
      already right but a 12 read +6 instead of +5. The step is data
      (`statRules.beyondTen.stepEvery`). This replaces Decision 18's
      extrapolation. BOD past 10 adding 1 HP per Health Level was confirmed
      as already built (Decision 64 and the rules tests).
    - **F20 closed:** a Condition's "−1 to all rolls" hits Skill Checks
      only, not Essence dice or Breaker % — the stub, now the rule.
    - **F21 closed:** different Conditions stack, and the same one doesn't.
      **Every penalty on one roll caps at −8**, whatever it comes from
      (Conditions, range, cover, visibility). `conditionState()` caps the
      Condition sum at `penaltyStacking.cap`. Conditions alone can't reach
      −8 with the current catalog; range and cover, which push a roll there
      at the table, are outside the sheet, so the cap is also stated on
      Trackers as a "How this works" note.
    - **F22 closed:** one body-part Condition can sit on two parts — and
      **only Injured and Maimed are body-part Conditions.** DeSynced loses
      its body-part picker; its text still names limbs/head/torso and asks
      the player to note which.
    - **Plan CQ4:** Siege causes Massive damage, to people too. Gear's
      Siege tag ("double damage to soft targets") is out of date; the
      glossary text is updated here and the CRB needs the same fix (Ken).
    - **Plan CQ5:** only Massive damage causes Injured or Maimed. A Called
      Shot is the exception only when the weapon or the way it's used deals
      Massive damage (a sniper rifle, say). 053's Called Shot text needs to
      say so (Ken).
    - **Plan CQ6:** Health Levels removed by Massive damage count toward
      Pain. Getting them back takes Focused Healing (a Nanomed Kit,
      hospitalization) **and** a replacement: a prosthetic or other limb
      replacement, possibly magical.
    - **Plan CQ7:** no layering. Two pieces of armor can't cover the same
      body part, and all body armor covers at least the torso (a vest is
      torso, a duster is torso/arms/legs), so one worn body piece is the
      rule. Plan P5's single `worn` flag holds.
    - **Plan CQ10:** the Shock threshold is half of max Health Levels,
      rounded up (2 → 1, 3 → 2, 5 → 3).
    CQ4–CQ7 and CQ10 are recorded here and in the plan but not yet built:
    Session 3 builds them and cites this decision. Game data 0.8 (unshipped)
    absorbs the stat curve, the DeSynced change and the Siege text; no
    separate bump. (Ken + Scott + Deighton + Claude, 2026-09-22)

99. **(Taking a hit — combat plan Session 3, data + engine + app)** **A hit
    is resolved by a pure engine function and applied as one audited,
    undoable action. Massive damage removes Health Levels from the right of
    the track, and those count as lost.** Ken approved the Session 3
    proposal on 2026-09-22; this locks plan P6 and the parts of P4/P5 that
    Session 2 only stored.
    - **Engine.** `hlState(ch)` is the Health Level picture every track
      draws: `damage` empties levels left to right; `trackers.massiveLevels`
      removes them from the right. Both count as HL lost, so both feed Pain
      (CQ6), and HP left = (levels − Massive) × HP per level − damage.
      `painState()` now reads it; with no Massive levels it computes exactly
      what it did before. `armorState(ch)` reads the worn body piece (the
      first with `worn: true` if a hand-edited file has two — reported, not
      thrown): max Integrity = catalog INT + each upgrade's `integrityBonus`
      (Tri-Weave +10 per install), Compromised = Integrity 0, RES classes =
      `armorRules.baseResAgainst` (Kinetic) + each upgrade's `resAgainst`
      (Ablative → Energy, Warding → Magical), coverage from
      `armorRules.coverageLocations`. Head and hand pieces never roll PROT;
      a worn one's feature can carry a `redirect` (Headshot Defense: head →
      torso). `resolveHit(ch, hit)` is pure and returns the breakdown, the
      patch and the prompts; `applyHit(ch, hit, choices)` is the only writer
      and **re-resolves from the same inputs**, so a stale preview can't
      write stale numbers. The UI wraps it in `commit()`: damage, Massive
      levels, Withering, armor wear and any Conditions undo as one step.
    - **The rules as built.** Regular and Withering: PROT (the die the player
      rolled, checked against the die size) + RES if the damage type's
      `resClass` is one the armor answers and the hit isn't AP and the armor
      isn't Compromised or scrap. A hit the armor stops completely costs
      `soakedIntegrityLoss` (1). Nothing else costs Integrity in the moment:
      the after-fight wear roll is Session 4. Massive (053): skips PROT and
      RES, strips Integrity equal to the damage, removes ⌊damage ÷ 10⌋ HL,
      +1 if the armor ends at 0 or there was none. Armor a Massive hit
      leaves at 0 is marked `scrapped`, which covers armor that was already
      Compromised: a tank round finishes it. **Scrap still rolls PROT with
      no RES**, the same as Compromised. 053 says scrap can't be repaired,
      not that it stops protecting. A hit location the worn piece doesn't
      cover bypasses it entirely. The default location is center mass
      (`armorRules.defaultHitLocation`, torso).
    - **Consequences (054).** Shock is due when the levels *this hit* took
      (after − before, Massive included) reach ⌈max HL × ½⌉ (CQ10). It
      counts levels, not raw damage: 4 HP already in plus an 11-point hit
      empties three levels at BOD 5 and triggers it. A hit that reaches zero
      skips Shock and asks the At Zero check instead. It asks again on every
      hit while you're at zero and not Dying. While Dying, damage is an
      automatic Death Mark and no check is asked. The player enters
      pass/fail and the engine adds the Conditions from `damageRules`
      (Shock fail → Unconscious + Prone; At Zero pass → Unconscious + Prone,
      fail → Dying) through `addCondition()`, so the no-duplicates rule
      holds. Nine Lives is named beside the check when the character holds
      it. It's a pass the player chooses, not an automation. Conditions a
      damage type *can* cause (`damageTypes[].inflicts`, from Gear's Damage
      Types) are offered as ticks; Gear's "always" ones (Burning → Agonized,
      Burning) come pre-ticked. Injured and Maimed are offered only on
      Massive (CQ5), on the body part the hit **landed** on, after any
      redirect. A helmeted head shot that Headshot Defense turns into a
      torso hit maims the torso, not the head. `applyHit` sets that location
      itself, whatever the caller passes, and refuses a Condition the hit
      didn't offer. (The first cut used the part aimed at; the PR #26
      review caught it.)
    - **Data (game data 0.8, unshipped — folded in, no bump).**
      `damageTypes` (Blade, Blunt, Ballistic, Electric, Energy, Burning,
      Magical), `damageCategories`, `damageRules` (Massive, Shock, At Zero,
      Dying). **How a category resolves is on the category, not keyed on its
      id:** `bypassesArmor` (Massive's path: skip PROT/RES, strip Integrity,
      remove Health Levels by `damageRules.massive`), `recordsWithering`,
      and `inflicts` (Conditions the category adds to its type's: Massive's
      Injured/Maimed). The engine, the panel and the audit label all read
      those flags, so no code compares against the literal `"massive"`
      (PR #26 review). Also and on `armorRules`: `baseResAgainst`, `coverageLocations`,
      `defaultCoverage`, `defaultHitLocation`, `soakedIntegrityLoss`. Upgrade
      and feature glossary entries gained `resAgainst`, `integrityBonus` and
      `redirect`. A new damage type or upgrade is a data edit.
    - **New stub, F23.** The CRB gives Kinetic RES to Blade/Blunt/Ballistic
      and extends it to Energy (Ablative) and Magical (Warding), but never
      says where **Electric** or **Burning** fall. Both are stubbed as
      Energy: no RES without Ablative Plating. Where the **Resistance**
      upgrade's 50% sits against PROT/RES is also unstated, so it isn't
      applied. The panel shows the stub's `playerNote` only on a hit it
      governs. This contradicted STATE's "no stubs needed". Ken saw the gap
      in the proposal before it was built.
    - **No armor on the sheet yet.** Nothing writes `ch.armor[]` until
      Session 4's pickers, so when no body piece is worn the panel offers
      "armor that isn't on the sheet yet". It takes a PROT roll and RES
      (or, for Massive, its current Integrity), is treated as base Kinetic
      armor covering the hit, and tracks no wear. Session 4 makes it
      automatic.
    - **Withering** adds what gets through to `trackers.witheringDamage` as
      well as `damage`. Lowering `damage` by hand, or Heal all, trims it to
      match, so it never exceeds the damage. Heal all never touches Massive
      levels; a separate **Restore a Massive level** button is the explicit
      action CQ6 asks for (one level per press, audited).
    - **App.** "Take a hit" panel on Trackers, with a live breakdown, the
      checks it asks for, Condition ticks and Apply/Cancel. Massive levels
      are drawn hatched and dashed on the Trackers track, Main's mini-track
      and the print ladder. The damage card states Massive and Withering.
      The plain damage buttons and the number field still edit `damage`
      directly (P7). App **0.12.0 → 0.13.0** (minor, new capability).
      Character schema unchanged (0.8 already carried every field).
      (Ken + Claude, 2026-09-22)
    → **Superseded in part by Decisions 100 and 112** — the bare "Restore a Massive level" button folded into Focused Healing (100); Take a hit opens as a modal, not a panel on Trackers, and Apply waits with its reason instead of alerting (112).

100. **(Loadout & recovery — combat plan Session 4, data + engine + app)**
    **Loadout writes weapons and armor from the catalog, a weapon line is
    computed, and every recovery step is one audited action.** Ken approved
    the Session 4 proposal on 2026-09-22 and settled four questions. The hit
    panel's stand-in armor is removed. **Buy** sits next to Add. Weapon mods
    and rounds-in-magazine tracking are deferred, so there's no schema bump.
    A Nanomed Kit button is deferred until this lands. Thick Skin and natural
    armor move to a post-Session-4 cleanup session. This locks plan P8 and P9.
    - **Weapons.** `weaponLine(ch, i)` reads a catalog weapon. Attack is
      that weapon's skill's `checkBonus`, so Pain and Conditions are already
      in it (053: "1d10 + your Skill + modifiers"). ACC is carried apart,
      because only Single fire adds it. `BOD+3` resolves to BOD's value + 3
      (053's own example: BOD 5 does 8). A number is fixed damage. Anything
      else ("6/round") stays text. A custom weapon reads back what was typed.
      The weapon's damage type isn't mapped onto `damageTypes`: nothing
      consumes it, since the hit panel is for incoming damage.
    - **Armor.** `addLoadout(ch, kind, id, {buy})` adds a catalog piece. The
      first piece in a slot goes on. **Buy** also pays the catalog price
      through `addCredits` in the same action, so one undo takes back both.
      It refuses a price the player can't cover or one the catalog doesn't
      state ("By Contract"); Add still works then. `setWorn` is one piece per
      **slot**: body (CQ7), head, hands. `upgradeOptions`/`addUpgrade` apply
      Gear's rules: one mod slot each, `minQuality` ranked by
      `armorRules.qualityOrder`, only `repeatable` upgrades twice (Tri-Weave,
      Resistance). A custom piece states no slots or quality, so neither
      limit binds it. **A built-in upgrade is already in the printed
      stats (Ken, 2026-09-22).** The Plasteel Weave Jacket's Tri-Weave is
      part of its INT 30, so only upgrades the player installs add their
      effect. Session 3 read it that way on purpose (log), but the reading
      never reached Decision 99's text. This session briefly changed it to
      40 before finding the log entry and asking. Ken ruled 30: start from
      the catalog as printed, and tune numbers later if play says so.
      `integrityLoss` also reads clamped to the maximum, so removing an
      upgrade can't show negative Integrity.
    - **Wear and repair (053, Gear).** `armorWear` takes the difficulty's
      die (`integrityLossByDifficulty`) and the player's roll, checked
      against the die. It can leave armor Compromised, never scrap; only
      Massive scraps. A feature with `afterEncounter` (Self-Healing: 1d4, 3+
      regains 1d4, never past max) is asked for in the same action.
      `repairArmor` takes the Field Repair Kit's die (`repairKitDie`) or an
      armorer's full restore, and refuses scrap.
    - **Healing (055).** `naturalHealing` proposes BOD per day. The panel
      multiplies by days and by Speed Heal's ×2, and the player can change
      the number, because "the GM may halve that" is a GM's call, not a
      formula. `heal(ch, {kind})` is one writer. Natural Healing takes HP
      only and never touches Massive levels or a Condition. Focused Healing
      takes the HP the care restored, clears what
      `recoveryRules.focusedHealing.clears` names (Injured), and restores
      Massive levels (CQ6: with a replacement). **The bare "Restore a
      Massive level" button (Decision 99) is gone, folded into Focused
      Healing**, so the ruling's "and a replacement" is stated where the
      level comes back. Withering is trimmed to the damage left.
    - **Turn Reset (P8).** `resolveReset`/`applyReset` work like
      `resolveHit`/`applyHit`: pure preview, a writer that re-resolves.
      Each Condition with `ongoing` ticks: Bleeding's fixed 1, and the
      entered source damage for Burning/Shocked. The damage goes straight
      onto the total. **It isn't a hit**, so there's no armor and no Shock
      (054 asks Shock of "a single hit"). At Zero is asked again (054: "every
      time you take damage"). Every active Condition's recovery is listed as
      text, and no check is run. `hitPrompts` was split so both paths share
      `damagePrompts` (At Zero, Death Mark).
    - **New stub, F24.** 054 says damage while Dying is "an automatic failure
      and a mark" and that ongoing damage ticking is "another mark". At a
      Reset where Bleeding ticks, is that one mark or the check plus one
      per source? **Stub:** each source that ticks is one Death Mark and
      takes the place of the check. With nothing ticking, the WILL check is
      asked, and a fail is a mark. The panel shows the stub's `playerNote`
      only when it applies.
    - **Data (game data 0.9 — Decision 68: new choices a character can
      observe, such as a rest proposing BOD per day and Self-Healing asked
      after a fight).** `weaponCategories` (the picker's groups),
      `recoveryRules`, `damageRules.whileDying.resetCheck/resetText` (F24).
      On `armorRules`: `qualityOrder`, `slotNames`, `coverageNames`,
      `repairKitDie`, notes. Self-Healing's `afterEncounter`. `repeatable` on
      Tri-Weave and Resistance.
    - **Character schema unchanged (0.8).** A custom armor piece may now
      carry `coverage`. Absent reads as light, which every reader already
      assumed, so older and newer files read each other and there's no
      `migrate()` step.
    - **App.** Loadout has a catalog picker for each of weapons and armor
      (Add / Buy with its price / + Custom), weapon lines, and armor rows
      (worn, Integrity bar, built-in features, upgrades, repair, notes).
      Main's combat column shows weapon lines and the worn armor. Trackers
      adds Turn Reset, Rest and Focused Healing to the damage card, plus an
      Armor card with After the fight. The hit panel says "no body armor
      worn" instead of offering a stand-in. **Print:** the front page's
      Defense card fills from the worn piece (RES, Integrity, PROT on the
      locations it covers; name, features, Warding) and no longer carries
      the "not tracked digitally" note. The Loadout page gets computed
      weapon columns and an Armor table **beside** Gear. Full width, it
      measured 104px against about 68px spare and spilled a blank sheet onto
      a fourth page. Side by side, all three pages hold at 720px, blank and
      filled (measured with print.css force-enabled). App **0.13.0 →
      0.14.0** (minor).
    - **Deferred, by Ken's call:** weapon mods and ammo tracking (both need
      schema 0.9), a Nanomed Kit button (054 and Gear disagree on whether it
      clears Paralyzed, plan CQ12), and Thick Skin/natural armor (cleanup
      session; the print Defense card's Nat column stays blank until then).
      Also a CRB doc fix: 054's table lets a week of downtime clear Injured,
      while 055 says Focused Healing is required (plan CQ13). The app's
      Focused Healing clears it either way.
    (Ken + Claude, 2026-09-22)
    → **Superseded in part by Decisions 104 and 105** — the deferred Natural Armor and Nanomed Kit are built.
101. **(Docs)** **The batch board leaves `STATE.md` for `docs/log/shipped.md`,
    and unscheduled ideas get `docs/WISHLIST.md`.** Decision 74 put the board
    in STATE. By 2026-09-22 it was twenty-odd rows of merged history, and STATE
    had reached its 200-line guard (`tests/docs.test.mjs`) with the board as the
    biggest block in it. That was the guard working: the history belongs with
    the other history. `log/shipped.md` is append-only like `log/2026.md`, with
    one row per merged batch. STATE §2 keeps only what shipped work left behind
    that is still true now (the live deploy, the two traps). Separately,
    `WISHLIST.md` holds ideas nobody has committed to yet, as `W` ids that are
    never reused, raised by Ken or by Claude. It is not a queue and not STATE
    §3: STATE lists what is in flight or waiting on someone, and a wishlist item
    waits only on a free session and Ken's yes. An item leaves the wishlist
    when it is picked up and is struck through, not deleted. Neither change is
    player-visible, so no version moves. (Ken + Claude, 2026-09-22)
102. **(Docs)** **A decision that replaces another marks it in the same
    change, in the ledger and in the index, and a test holds the two
    together.** The ledger reached 101 entries, and Ken asked whether the
    code-level ones should move to an archive. They stay. Numbers are cited
    141 times in `src/` and `tests/` alone, so an archive could only move text
    and add a place to look. And a split by importance would have archived
    Decision 93 as a routine data merge, when a note inside it was what caught
    Deighton's TOL ruling reversing a formula Scott had confirmed. Length was
    never the cost. The cost was entries that read as current after a later
    decision replaced them: Decision 18's INDEX line still said "+1 per point
    above 10" after Decision 98, and six more were in the same state (14, 21,
    27, 32, 58, 99), only two of them noted anywhere. So the ledger entry gets
    `→ **Superseded [in part] by Decision N**` with a clause saying what, the
    INDEX line gets `→ **superseded [in part] by N**`, and a wholly replaced
    line is struck through. Entries are never deleted and never renumbered.
    `tests/docs.test.mjs` fails if the two disagree. The old marker "→
    Resolved by Decision 25" on 21 became the first case. INDEX also gains a
    short **load-bearing** table (the decisions that shape what gets built,
    as opposed to how) and a **Housekeeping** group for the four entries that
    record rather than choose (33, 34, 42, 47). `CLAUDE.md` carries the
    working rule: before numbering a decision, search the ledger for what it
    touches. (Ken + Claude, 2026-09-22)

103. **(Deighton's TOL ruling — combat plan cleanup, data)** **TOL = 1 +
    INT + BOD + COOL bonuses, floor 1. It was INT/COOL/EMP.** Deighton
    ruled on 2026-09-22; WILL is confirmed unchanged at 1 + BOD + INT + EMP,
    and SAN is untouched. **Replaces Decision 9 in part** (the TOL formula)
    **and Decision 93 in part**: 93 recorded INT/BOD/COOL as a misreading
    that Scott had confirmed against, and the ruling makes that "misreading"
    the rule. Data only: `derived.TOL.inputs` swaps EMP for BOD. No engine
    change, since `derived()` sums whatever `inputs` names, and no schema
    change, since TOL is never stored (constraint 7). Every character's TOL
    can move, so game data **0.9 → 0.10** (Decision 68), shared with
    Decisions 104–105; app **0.14.1 → 0.15.0** with them (minor, for their
    new capabilities; on its own this would have been a patch). The Arcanist feels it most:
    its focus-stat bonus lands on INT/COOL/EMP, so EMP points stop feeding
    TOL and BOD, which that bonus can't reach, starts to. That is the ruling
    working as given, and Scott has it; it is not a defect to fix in code.
    **Pinned** in `tests/rules.test.mjs` from the CRB's rewritten worked
    example (`040` l.88–89: INT 4, BOD 3, COOL 9 → TOL 3). Nothing tested the
    formula before, and both tests fail against the old inputs. The CRB edit landed the same day in `020`, `040`, `041` and `Magic.md`,
    and all four were re-pulled. (Ken + Claude, 2026-09-23)
    → **Superseded in part by Decision 109**: its floor of 1 holds for the
    formula, but the Drained Aberration can take maximum TOL below it, to 0.

104. **(Natural Armor — combat plan cleanup, data + engine + app)**
    **Natural Armor is one derived value, `Engine.naturalArmor(ch)`, read by
    the hit resolver, and how it answers a hit is stubbed as F25.** The CRB
    grants it in four places and never says what it does. Thick Skin gives
    +1 per rank and says only "unaffected by Armor Piercing". Shake it Off
    (a Major Milestone, twice) gives 5. Iron Shirt (True Warrior's Power
    Style, a Chi ability that has to be active) gives BOD bonus + 1. The
    Trueborn's Waning Moon boon has it "treated as Warding". This is the
    Decision 66 shape the 3b note named: promote it to a number, read it,
    display it. It is not a Thick Skin special case. Ken chose the stub over
    display-only on 2026-09-23, because a display-only value would leave the
    hit panel under-protecting a Thick Skin character.
    - **Sources are data.** A `grants` entry of type `naturalArmor` works on
      an advantage (`perRank`), a Major Milestone (`amount`, per time
      taken) or a specialization option (`stat` + `plus`). **This extends
      Decision 87's `grants` to Milestones and specializations**, but only
      for this reader: `grants()` itself still scans advantages and
      disadvantages. A grant with `while` is conditional (Iron Shirt, the
      waning moon). It is listed with its amount and never summed, the
      same rule as `rollPenaltyWhen` (Decision 96), and the hit panel asks
      whether it's on. Stored nowhere (constraint 7); a hit takes the ids of
      the ones that are on (`hit.natural`), like the PROT roll.
    - **The F25 stub, in `naturalArmorRules`:** a flat reduction after PROT
      and RES, on every body part (it's the body, so coverage doesn't
      apply). It answers Kinetic, like base RES, and a `resAgainst` grant
      extends that (Resilient Spirit adds Magical). AP doesn't get past it,
      per Thick Skin's own text. Massive skips it, as it skips PROT and RES.
      Sources stack. The hit panel shows the stub's `playerNote` whenever
      the character has any. Natural Armor finishing off what armor let
      through doesn't count as the armor soaking the hit (no 1 INT).
    - **Display.** Main's combat column, the Trackers Armor card and
      Loadout carry one line: "Natural Armor 7 · Iron Shirt +3 while
      active". Print's Defense card fills its Nat column from the always-on
      amount on every location. Conditional sources aren't printed as a
      number. The "nothing answers the hit" lines say so only when nothing
      does.
    - **A totality gap, found by the new guard.** A degenerate character
      with a `null` in `advantages[]` crashed `grants()`, `advSpent()` and
      everything downstream of them. That was a pre-existing gap: `migrate()`
      passed the list through. `migrate()` now drops non-entries from
      advantages, disadvantages and both Milestone lists, as it already did
      for Conditions (Decision 95). No schema bump, since the shape doesn't
      change.
    - **Tests.** Sums and conditionality, a hit with and without worn
      armor, AP, a Kinetic-only miss, Massive, Resilient Spirit on Magical,
      `applyHit` writing post-skin damage, and totality on a "junk grant
      sources" character. Each was mutation-tested (no absorption, AP
      skipping it, `through` ignoring it, rank ignored, `migrate` keeping
      junk), and each mutation failed a test.
    Game data **0.9 → 0.10** and app **0.15.0**, shared with 103 and 105.
    Character schema unchanged (0.8). (Ken + Claude, 2026-09-23)
105. **(Nanomed Kit — combat plan cleanup, CQ12, data + engine + app)**
    **054's "With Çredits" list is the master: a Nanomed Kit clears
    Agonized, Bleeding, Paralyzed and Poisoned and stabilizes the Dying.**
    Ken ruled on 2026-09-23. Gear's entry leaves out Paralyzed, so it is
    the one that changes (a CRB fix for Ken), following Decision 97's
    precedent that Conditions and Recovery is the master document.
    `heal(ch, {kind: "nanomed", dose, hp})` is a third kind in the one
    healing writer. It clears everything on `recoveryRules.nanomed.clears`
    that's active, plus Dying and its Death Marks. The player doesn't
    tick them, because the kit does it all. `nanomedKit(ch, dose)` proposes
    the regeneration: dose n inside a day is 1 HP every n rounds for BOD
    rounds, so floor(BOD / n). The player can lower it, because a fight
    that ends early or a crash cuts it short, and that's a table call.
    Injured still takes Focused Healing. The kit isn't taken out of
    inventory or paid for, since Loadout's gear is free text; the Çredits
    tracker is where a purchase goes. A "Nanomed Kit" panel sits next to
    Rest and Focused Healing on Trackers, and is one undoable action.
    Pinned: the four clear, Injured stays, 7 / 3 / 2 HP at doses 1–3 for
    BOD 7. (Ken + Claude, 2026-09-23)

106. **(Cascade and Aberrations — combat plan's Magic-tables side session,
    data + engine + app)** **The Cascade Table, the Aberration Table and the
    Appendix's Good/Neutral/Bad lists are game data, and the sheet looks
    them up from the player's own dice.** `cascadeTable`, `aberrationTable`,
    `aberrationCategories`, `aberrationRules` and `aberrations` (39: 15/15/9)
    merge from `Magic.md` and `Appendix_Aberrations.md` as they stood
    2026-09-22. `spellcraftRules.outcomes.cascade` no longer says "not yet
    encoded". The Cascade's Aberrations are a different list from the
    Arcanist's creation-time Unique Aberrations (`specialization.options`),
    and the two stay apart.
    - **The engine reads, never rolls** (Decision 11, combat plan P1).
      `Engine.cascade(ch, { roll, degree, aberrationRoll, pick })` returns
      the row for 1d10 + the Rupture's degree, then the category for the
      Aberration die, the options in it, and the GM's pick if it's one of
      them. Each step it can't take yet comes back `pending` or as a `why`,
      never a throw (constraint 8). A pick from outside the rolled category
      is ignored.
    - **The table starts at 3 on purpose, and that isn't a gap.** You can't
      cast at 0 TOL, so the Rupture that drives TOL below zero is at least
      degree 2, and 1d10 + 2 can't come in under 3. A degree-1 entry gets a
      `why` that says so. Nothing is flagged, since the CRB's own rules close
      it.
    - **The Arcanist gets a TOL Spent tracker.** This session found the
      Arcanist had no way to track TOL at all. Decision 93 removed the old
      `exhaustion` panel, which modeled the wrong rule, and nothing replaced
      it. (The `tolerance-load` tracker is the Cyborg's.) `tol-spent` is a
      generic tracker against `max: "TOL"`, stored in `trackers.panel` like
      every other, so **character schema is unchanged (0.8)**. This fills the
      gap 93 left rather than reversing it: 93 ruled out a second resource
      beside TOL, and this counts TOL itself. Trackers gain three optional
      data fields: `note`, `atMax` (shown at the max, "Exhausted") and
      `overMax: "cascade"`. None of them is special-cased on an id.
    - **Nothing about a Cascade is stored.** Once TOL Spent passes TOL, the
      Cascade panel asks for the dice and shows the result, the Aberration
      category and the list to pick from. **Add to notes** writes one line
      into `notes` (`Engine.logCascade`) as one undoable action. Tracking
      acquired Aberrations as structured data is a schema bump, and Ken
      chose not to take it this session.
      → **Superseded in part by Decisions 110 and 115**: 110's **Record it**
      also stores the Aberration on the character (`trackers.aberrations`,
      seeded by 108's 0.9), in the same undo. Since 115 the panel no longer
      asks for the dice or shows the result, because the GM reads the tables.
    - **Pinned:** every band of the Cascade Table, the degree-1 `why`, both
      columns of the Aberration Table, the 15/15/9 count and the seven `as`
      references (`rules.test.mjs`). Also the tables' contiguity, totality on
      degenerate characters and bad input, and `logCascade` keeping existing
      notes and refusing without a pick (`engine.test.mjs`). Mutation-tested:
      an off-by-one range, a Good permanent row, a gap in the table, an
      unchecked pick and a notes overwrite each fail a test.
    Game data **0.10 → 0.11**: a new tracker and new choices on the
    Arcanist's sheet (Decision 68). Ships in app **0.16.0**. (Ken + Claude,
    2026-09-23)

107. **(Sheet feel — wishlist pass, app)** **Four wishlist items ship as one
    UI decision: W7, W11, W12 and W14.** Ken picked them on 2026-09-23. None
    touches rules, data or the character file.
    - **W7: text on a filled control is `--on-accent`.** `.btn.primary` set
      a violet fill and no color, so the light theme's near-black `--text`
      landed on violet at 2.2:1. `--on-accent` (#FFFFFF, the same in both
      themes) is the text on every violet or frame fill: primary buttons and
      their hover, the active form toggle, stepper hover, and `::selection`.
      `build.test.mjs` resolves both themes' tokens and checks every rule
      that paints `background: var(--token)` against its own color, its
      un-hovered rule's, or the `--text` it inherits, at WCAG AA (4.5:1).
      Shapes that never hold text are exempt by name. It fails the pre-fix
      CSS on all six defects.
    - **W11: the damage stepper says Heal and Hurt.** The headline is HP
      left, and the stepper edits damage taken (constraint 7). So `+5` made
      the big number go down. The buttons are Heal 5 / Heal 1 / Hurt 1 /
      Hurt 5, Heal is disabled at no damage, and the audit labels match.
    - **W12: every `commit()` offers its own undo.** A toast names the
      action with an Undo button for six seconds, through the one LIFO undo
      (Decision 49; the Activity Log stays under Session Log, Decision 50).
      It undoes only while that action's audit entry is still the newest
      one, **by identity**, since `recordAction` reuses a seq once an undo
      pops it. A seq check let a leftover toast take back a later action. The
      smoke test caught that before merge, and it's mutation-tested. The
      toast lives outside `#main`, never takes focus, is hidden in print, and
      drops its animation under `prefers-reduced-motion`.
    - **W14: adding a Condition is a chip palette.** **Replaces Decision 96
      in part** (its "one add row with a body-part picker"). Both tabs show a
      collapsible palette of every catalog Condition with its `short` text.
      One click adds, and W12's toast is what makes one click safe. A
      Condition already held is greyed out. A body-part one opens a "where?"
      row instead, and the engine still refuses a duplicate part out loud.
      Main's active chips open their effect and recovery in place, where
      before they only had a hover tooltip.
    App **0.16.0**, shared with Decision 106. (Ken + Claude, 2026-09-23)

108. **(The Grimoire reads the book — magic plan Session 1, schema 0.9,
    data + engine + app)** **A Grimoire row is a book spell or your own, and
    a book spell stores only which spell it is.** Ken agreed the plan
    (`plans/magic-on-the-sheet.md`, M1–M5 and M10) on 2026-09-23, after
    loading Wren Calloway and finding nothing new for magic. **Replaces
    Decision 25 in part.** Free entry stays for your own spells, and its
    "a catalog slots in without touching the sheet" was wrong. It also does
    what Decision 93 left for "an engine+UI batch".
    - **Schema 0.8 → 0.9.** Book rows are `{ spellId, stage: "known" |
      "mastered", notes }`. Your own rows are the typed columns plus
      `custom: true`. `migrate()` tags every pre-0.9 row custom and **never**
      links a typed name to the book, the same rule as 0.6's weapons. It
      drops junk rows and normalises `stage`. The same bump seeds the plan's
      M7 field, `trackers.aberrations`, so magic takes one migration. Its
      reader comes in Session 2.
    - **`grimoire` is a panel type** naming its `catalog`. `Engine.grimoire(ch)`
      is the one reader, and it doesn't create the row list (only writers
      do). Each book line carries the spell's numbers and text, with **TH − 1
      when Mastered**, `noRoll` at TH 0 (`Magic.md`: "a Mastered TH 1 spell
      requires no roll"), and the Mastery price. A `spellId` the data lost
      renders as missing. A typed row whose name matches a book spell you
      don't hold (case and punctuation ignored) offers **Link to the book**,
      which keeps its Notes column. `addSpell` refuses a duplicate.
    - **Spell Power = Evocation rank + WILL** (`Magic.md` l.284) is shown at
      the top of the Grimoire, read from `spellcraftRules.spellPower`.
      **Spell Attack** (Evocation + REF + WILL) is deliberately **not**
      computed. The book doesn't say whether REF is the score or its
      modifier, so that one waits for a ruling. (→ **Answered by Decision
      109**: the raw scores. Built in the plan's Session 2 as M11.)
    - **Mastering spends IP through the journal.** `ipCost`/`spendIP` take a
      `spell` target at `mastery.ipPerTH` × the printed TH, so undo reverses
      it like any spend (Decision 49). Only a Known book spell with a TH can
      be Mastered.
    - **The picker shows a spell before you add it** (W4's lesson): search
      (→ **Superseded in part by Decision 111**: the picker is a modal the
      sheet and the wizard share, not an inline section of the Grimoire)
      over name, Glyph, effect and tags, plus filters for tier and Domain. A
      spell you hold reads Known. One you typed as your own reads **Link
      yours** and links that row instead of adding a copy. That one was
      found by loading Wren, whose typed Kindle the first version offered to
      duplicate.
    - **Copy (M10).** The Grimoire note that narrated the build (constraint
      9) is gone. The Arcanist description and the wizard no longer point at
      a "Magic section" the app doesn't have.
    - **Pinned:** Spell Power and Mastery's TH − 1, no roll and 30 × TH
      (`rules.test.mjs`). Also migrate tagging without linking and
      idempotence, the reader not writing, Link keeping notes, duplicates
      refused, IP spend and refusal, and totality (`engine.test.mjs`), plus
      two smoke tests. Mutation-tested: TH not lowered, rows not tagged,
      the reader creating rows, Link dropping notes, a held spell offered
      for linking, Mastery not setting the stage, and Spell Power ignoring
      the rank. Each fails a test.
    Game data **0.11 → 0.12** (the panel type and the two rules entries
    change what an Arcanist's sheet offers). Character schema **0.8 → 0.9**.
    App **0.16.0 → 0.17.0**. (Ken + Claude, 2026-09-23)

109. **(Deighton's magic rulings — the magic plan's MQ1–MQ3 and Spell Attack,
    docs)** Deighton answered all four on 2026-09-23, relayed by Ken. **No
    code changes in this entry.** Each answer is built by the plan session
    that needs it (`plans/magic-on-the-sheet.md` §6 has the questions).
    - **MQ1 — Starting spells can be any tier, gated by Evocation rank.** "A
      new arcanist can start with advanced or superior spells, but they
      would need the ranks in Evocation." The threshold, confirmed by Ken:
      **a spell's TH can't exceed the character's Evocation rank**, counting
      ranks bought at creation. The power level's rank cap (Street 2, Heroic
      3, Shadows 4, World Coming Down 5) then does the gating. The
      appendix's "works from the Cantrip and Standard lists" is the usual
      case, not a rule. For the plan's Session 3 (M6), which is now
      unblocked.
    - **MQ2 — Drained lowers maximum TOL by 2, can go below 1, and leaves
      current TOL alone.** "They can choose to be very mean." Ken's worked
      example: max 8 / current 3 becomes max 6 / current 3, and a max of 2
      becomes 0. The sheet stores TOL *Spent*, so recording Drained also takes
      2 off TOL Spent, floored at 0. That keeps current at the lower of what it
      was and the new max. **Replaces Decisions 9 and 103 in part**: their
      floor of 1 still holds for the formula, but Drained applies after it,
      down to 0. **Max TOL is never below 0.** **Removing Drained grants no
      TOL** (Ken): max rises by 2 and current stays, so TOL Spent goes up by
      2. At max 8, Drained makes it 6. After resting to 6 and then removing
      Drained, TOL is still 6, and the character recovers back to 8 naturally.
      Current never moves when Drained comes or goes.
    - **MQ3 — Phantom Pain applies at full health.** "Your PL1 happens even
      if you are full health." It's `painLevels: 1` like Agonized, clamped at 3.
    - **Spell Attack = Evocation rank + raw REF + raw WILL**, not the
      bonuses. It answers what Decision 108 left out, and the plan adds it as
      M11 in Session 2.
    (Deighton via Ken, 2026-09-23)

110. **(Aberrations on the character, and the Magic reference — magic plan
    Session 2, data + engine + app)** **An Aberration the character picks up
    is stored as `{ id, permanence, note? }`, and what it does is read from
    the catalog every time.** Ken agreed the shape on 2026-09-23 (the plan's
    M7, M8, M9 and M11). **Replaces Decision 106 in part**: Notes stops being
    the only record of a Cascade. **Replaces Decision 96 in part**: Pain
    counts Aberration Pain as well as Condition Pain. Builds Decision 109's
    MQ2, MQ3 and Spell Attack answers.
    - **One per id** (Ken: "like conditions, there can be only one instance
      at a time"). Recording one you hold is refused out loud, and so is a
      Cascade pick of one you hold, before anything is written. The GM picks
      another. `aberrationRules.noStacking` says it.
    - **Hooks in the data, not special cases.** An `aberrations` entry can
      carry `painLevels` (added to Pain like Agonized, then the 0–3 clamp) and
      `adjust` (a derived stat, moved after its own floor, down to
      `aberrationRules.adjustFloor`: 0). Phantom Pain has `painLevels: 1` and
      Drained has `adjust: { TOL: -2 }`. The floor never lifts a value
      something else (a manual adjustment) already took under it. Every
      other Aberration is text on its card.
    - **Current TOL doesn't move** when an Aberration changes max TOL. The
      sheet stores TOL *Spent*, so `recordAberration` and `removeAberration`
      shift every tracker counting against `max: "TOL"` by the change in max,
      floored at 0. That gives Ken's examples: 8/3 → 6/3, 2 → 0, 0 stays
      0, and removing Drained at 6/6 → 8/6. It keys on `max: "TOL"`, not on
      `tol-spent`, and it keeps a character already past zero past zero.
    - **Record it** (was Add to notes): `Engine.recordCascade` writes the
      Notes line and records the Aberration, and the sheet wraps both in one
      `commit()`, so one undo takes back both. A result with no Aberration
      only writes the note. `logCascade` stays as the note half.
      → **Superseded in part by Decision 115**, this bullet whole:
      `recordCascade` and `logCascade` are gone. A Cascade records through the picker, with the date in the
      Aberration's own note, and nothing goes into Notes.
    - **UI.** Trackers shows an Aberrations section under TOL Spent wherever
      a tracker declares `overMax: "cascade"`, or on any sheet already
      holding one. Permanent ones are cards with Remove (a quest or ritual is
      the GM's call) and a note. Temporary ones are chips with Clear. A
      palette, the same shape as W14's, adds one by hand with a
      Temporary/Permanent toggle, and a held one is greyed out there and in
      the Cascade's pick list. Since Decision 115 the palette and the pick
      list are one picker modal, with each Aberration's
      text on its card. Permanent ones also show read-only on the
      Archetype tab as **Permanent Aberrations**. Nothing on Main except
      the Pain line, which now names what adds to it ("from Agonized,
      Phantom Pain"). Ken agreed Main stays clear until playtesting says
      otherwise.
    - **Spell Attack = Evocation rank + REF score + WILL** (`spellcraftRules.
      spellAttack`, `Engine.spellAttack`). A Basic Stat reads its score,
      not its bonus; WILL is derived and reads its value. It's shown beside
      Spell Power in the Grimoire with its breakdown.
    - **A `reference` panel type.** It names the data sections it shows
      (`shows`), and the sheet has one renderer per section name
      (`spellcraftRules`, `spellTiers`, `cascadeTable`, `aberrationTable`,
      `aberrations`). A name with no renderer is skipped. The Arcanist
      declares **Magic reference** and it renders on the Archetype tab, not
      Loadout. The Arcanist description now points there (M10's pointer).
    - **The Unique Aberrations follow `041`** (Ken: Scott has been making the
      edits). Aethereal Link reaches animals, not creatures. Thaumaturgical
      Sight's +2 is for Occult checks when analyzing magic, and it sees "the
      resonance a spell leaves". Resonant Whispers drops charms, since
      Talismans and Artifacts are the Magic chapter's two categories. Display
      text only, and no id changes. Ken expects the Origins subtypes to
      replace this list.
    - **Pinned:** the four Drained examples, Phantom Pain at full health and
      its clamp with Agonized, and Spell Attack from the scores
      (`rules.test.mjs`). Also one per id, the stored shape, a missing id
      rendered and reported by `versionCheck`, the floor not lifting, Record
      it undoing in one step and refusing before it writes, the reference
      panel's sections existing, and totality with junk Aberrations
      (`engine.test.mjs`), plus two smoke tests and the Cascade one updated.
      Mutation-tested: no Spent shift, no floor, a floor that lifts, Pain
      ignoring Aberrations, Spell Attack reading REF's bonus, Record it
      skipping the Aberration or writing before it refuses, duplicates
      allowed, removal giving TOL back, either hook dropped from the data,
      the Pain line losing its source and the reference panel not rendering.
      Each fails a test.
    Game data **0.12 → 0.13** (Drained and Phantom Pain change computed TOL
    and Pain, Decision 68). Character schema unchanged at **0.9**: Decision
    108 seeded `trackers.aberrations`. App **0.17.0 → 0.18.0**. (Ken +
    Claude, 2026-09-23)

111. **(Starting spells in the wizard, and the spell picker as a modal —
    magic plan Session 3, data + engine + app)** **A new Arcanist chooses
    TOL + the power level's roll of Known spells from the book, and at
    creation a spell's TH can't pass their Evocation rank.** Ken agreed the
    shape on 2026-09-23 (the plan's M6). Builds Decision 109's MQ1. Does what
    Decision 21 deferred and Decision 25 left to free entry. **Replaces
    Decision 108 in part**: its inline picker becomes a modal.
    - **On the Character Points step, not the Archetype step.** The plan said
      the Arcanist's step, but Evocation ranks are bought on step 7 (Decision
      19) and step 7's boosts move INT, BOD and COOL, so both the count and
      the cap are only final there. The block sits under Disciplines, and
      buying a rank opens the next tier while the player watches. The
      Archetype step's note points there.
    - **No second store, no schema bump.** The roll is
      `archetypeChoices.rolls.startingSpells` (Decision 11: the player
      rolls). Picks are the Grimoire's own book rows, `{ spellId, stage:
      "known", notes }`, so lock changes nothing. Changing archetype in the
      wizard clears `panelData`, so an old Arcanist's picks don't come back.
      A locked sheet's admin change leaves panels to its single undo.
    - **The data.** The Arcanist's scaling rows carry `startingSpellsRoll`
      (`"1d4"`…`"4d4"`), which replaces the string `commonSpells` (`"TOL +
      1d4"`) that nothing could compute from. `spellcraftRules.startingSpells`
      names what the count adds to (`countFrom: "TOL"`) and the Discipline
      that caps TH (`evocation`).
    - **`Engine.startingSpells(ch)`** is the one reader: the die, the roll,
      the count (null until the roll is entered), the picks, the cap, and any
      pick over it. `canAddStartingSpell` refuses an unknown spell, a
      duplicate, a TH over the cap (with `needs`) and a pick past the count.
      `addStartingSpell` goes through it into `addSpell`.
    - **What blocks and what warns** (`validate("character-points")`). No
      roll entered and short of the count **warn**, like an unspent pool. A
      held spell over the rank and more picks than the count are
      **errors**. Un-buying a rank never drops a pick on its own: the step
      says which spell needs which rank, and the player decides.
    - **After lock nothing gates a spell's TH** (Ken: like a skill past its
      creation cap, the limit is for a balanced start). Instead
      `spellcraftRules.castingPool` marks a Grimoire spell whose TH, after
      Mastery, is above the Evocation pool: it can be cast, but only an
      exploding 10 reaches it (Magic.md, Step 2: the pool is Evocation rank
      d10s). The sheet's picker shows the same marker.
    - **The modal** is the first focus-and-dismiss primitive (`openModal`
      / `closeModal` in `shared.js`), the one W2/W3/W6 want. It's a native
      `<dialog>` opened with `showModal()`, so the browser makes the page
      inert, traps Tab and closes on Esc. The backdrop closes it too. Where
      `showModal()` is missing (jsdom) it opens as a plain dialog and Esc is
      handled by hand. Focus goes back to the opener, or to `returnTo` when
      a re-render replaced it. The undo toast moves inside an open modal,
      because the page behind is inert, and back out on close. It's hidden
      in print and drops its animation under reduced motion.
    - **One picker, two modes** (`spellPickMode`). On the sheet a result
      reads Add, Known or Link yours, and each is one `commit()` with its
      toast. In the wizard it reads Choose, Remove, or **Needs Evocation N**
      (disabled), and a status line keeps "Chosen 2 of 5 · TH up to 1" in
      view. The modal stays open across picks and refreshes itself.
    - **Pinned:** 041's rolls by power level and the count as TOL + the roll,
      and MQ1's gate counting ranks bought at creation (`rules.test.mjs`).
      Also the count following TOL, the gate and the count cap, warn vs.
      error, no gate after lock, the pool marker with Mastery, and totality
      (`engine.test.mjs`), plus three wizard smoke tests and the two sheet
      picker tests moved to the modal. Mutation-tested (16 mutants): no TH gate,
      the count ignoring TOL, the cap ignoring bought ranks, no count cap,
      short of the count blocking, an over-rank pick or too many going
      unreported, no roll unwarned, the pool marker ignoring Mastery, the
      gate leaking onto the sheet, an archetype switch keeping picks, the
      toast left outside the modal, focus not returned, Esc not closing, the
      wizard's button ignoring the gate, and the modal not refreshing after a
      pick. Each fails a test.
    Game data **0.13 → 0.14** (new choices at creation, Decision 68).
    Character schema unchanged at **0.9**. App **0.18.0 → 0.19.0**. (Ken +
    Claude, 2026-09-23)

112. **(Modals, the skill line and Trackers' layout — wishlist pass, app)**
    **Three wishlist passes ship as one UI decision: the modal pass (W6,
    W23–W26), the skill line (W20, W21) and Trackers' layout (W1, W10).**
    Ken picked them on 2026-09-23. None touches rules, data or the character
    file. **Replaces Decision 99 in part** (its "Take a hit panel on
    Trackers"), and extends Decision 111's modal.
    - **The modal gets a footer** (`openModal({ foot })`) that stays put
      while the body scrolls; the head does too. Any `[data-modalclose]` in
      it closes, and `bind` gets the body and the footer. The dialog is
      centred again: the stylesheet's `*` reset zeroed the margins a native
      `<dialog>` centres with, so the 0.19 picker opened pinned top-left.
    - **W6: Take a hit is a modal.** Its body leads with HP and the Health
      Level track, then the form and what the hit would do. Apply is in the
      footer and stays disabled while anything is pending, with the reason
      next to it (`hitPending`: no damage yet, a PROT die not entered, a
      Shock Check or a check at zero not marked). Those were alerts on
      Apply. Cancel, ×, Esc and the backdrop drop the form. Each change
      redraws the modal and puts focus back where it was. The two number
      fields redraw as they're typed, not on `change`, which fires on blur:
      a redraw then would replace Apply between the press and the click.
      They're `inputmode="numeric"` text, like the wizard's roll fields, so
      the caret goes back to the end. `openHitModal()` is callable from
      anywhere, which is what W2/W3's HP popover wants.
    - **W23–W26: the spell picker.** A click anywhere on a row is its
      button's click; the button stays for the keyboard and screen readers,
      and a field or link keeps its own click. A row whose button can't act
      is dimmed and says why in the row ("Already in your Grimoire.", the
      engine's reason in the wizard), since a tooltip never reaches a touch
      screen. The search, filters and status line are sticky over the
      results. The footer has **Done** (Ken's pick, (a) not staged picks)
      and says each pick is kept as it's made.
    - **W20/W21: a skill's stats are icons with the character's numbers.**
      `skillStatsHtml` draws "REF 5 · COOL +1 syn": the primary adds its
      score, the synergy its modifier (030). The wizard puts it on the
      skill's name line, above the description. The sheet's breakdown uses
      it in place of the bare text, which was the same line. Violet and
      magenta match the print badges (Decision 94). The synergy is dimmed on
      an untrained skill, whose check leaves it out.
    - **W1/W10: Trackers reads in two columns from 1000px.** The body
      (Damage, recovery, Armor, Pain, Conditions) down the left; Sanity,
      LUCK, the archetype's trackers and Çredits down the right; Manual
      Adjustments full width below. One column on a phone, in the same order.
      The Health Level track moved into the Damage card, grouped into the
      Pain Level bands the print sheet draws (`pPainBandFor`, from data), and
      the band you're in is lit. The same track tops the hit modal. The
      damage stepper has its own row, so it wraps as one group.
    - **Pinned:** five smoke tests (the hit modal, the at-zero check
      pending in the footer, the picker's row click, disabled row, sticky
      head and Done, the skill line in the wizard, and the Trackers columns
      and bands). Mutation-tested (13 mutants): no row click, no dimmed row,
      no Done, no sticky head, the at-zero check not pending, numbers
      redrawing on `change`, the field losing focus, the old skill line,
      the synergy never dimmed, bands off by one, the wrong band lit, no
      grid, and the track outside the card. Each fails a test.
    App **0.19.1 → 0.20.0**. Game data and character schema unchanged.
    (Ken + Claude, 2026-09-23)

113. **(Quick Study's Intuition — F11, data)** **Quick Study's prerequisite
    is the Intuition skill at Rank 1, not an advantage.** 041 (mirror of
    2026-09-22) reads "1 Major Milestone already selected, Danger Sense
    Advantage at least Rank 1, Intuition skill at least Rank 1". The data
    had carried the WIP's "Intuition Advantage" as an advantage prerequisite
    since Phase 1. No advantage has that id, so the prerequisite could never
    be met, and **no character could take Quick Study**. That's a defect,
    not a stub. The engine already reads `skills` prerequisites, so the fix
    is data only: Danger Sense stays under `advantages`, and Intuition moves
    to `skills.all`. The benefit text is left as it was: 041's new
    parenthetical says "Treat the d10 as X", which isn't ready to copy.
    Pinned in `rules.test.mjs` (fails on the old data). Game data **0.14 →
    0.15**: a choice that was closed is now open (Decision 68). App and
    schema unchanged. (Ken + Claude, 2026-09-23)

114. **(Jump bars — W5 and W22, app)** **Loadout and the Character Points
    step get a bar that jumps to each section the page drew, and step 7's
    bar also filters and sticks.** Ken picked both on 2026-09-23. No rules,
    data or schema change.
    - **One helper, the page's own sections.** `sectionList(prefix)` in
      `shared.js` hands out `sect(label, html)`: the heading gets an id and
      `tabindex="-1"`, and the short label goes on the bar. So an
      archetype's panels (the Arcanist's Disciplines and Grimoire) show up
      with no app change, as W5 asked. `jumpTo` scrolls the heading to just
      under the sticky header, and under a sticky bar if there is one. It
      then focuses the heading, so the keyboard carries on from there.
      Smooth unless reduced motion. Anchors and scroll, not sub-tabs, so
      print and Ctrl-F still see the whole page.
    - **Loadout (W5):** a plain bar under the title, not sticky, since the
      sheet's header already takes the top of the screen.
    - **Step 7 (W22)** sticks under the header. The header wraps on a
      phone, so boot measures it into `--hdr-live` (a ResizeObserver
      where there is one). The bar has a filter over Advantages and
      Disadvantages, matching name and description. A pick you hold always
      stays visible (`.pick.selected`), as W22 asked. It shows "N of M" and
      the **CP still to spend**, the one number you need while scrolling
      that page. Filtering works on the rendered page, so typing keeps focus,
      and `S.cpFilter` carries it through the re-render a stepper causes.
    - **Pinned:** two smoke tests. Mutation-tested (5 mutants): an archetype
      panel left off the bar, a held pick filtered out, the filter lost on a
      re-render, focus not moved, the bar not sticky. Each fails a test.
    Ships in app **0.20.0**, with Decisions 112 and 113. (Ken + Claude,
    2026-09-23)

115. **(The GM runs the Cascade, and one Aberration picker — app + data)**
    **The Cascade panel stops reading the player's dice. It gives the
    instruction, roll a d10, add the Rupture's degree and tell your GM, and
    opens an Aberration picker for whatever the GM names.** Scott told Ken on
    2026-09-24 that the GM resolves a Cascade and says which Aberration it
    left. Ken picked both shapes the same day. **Replaces Decision 106 in
    part** (the panel asking for the dice and showing the result) and
    **Decision 110 in part** (Record it as a Notes line plus the Aberration,
    `recordCascade`, and the W14-shaped palette).
    - **The tables stay data.** `cascadeTable` and `aberrationTable` are
      unchanged and still render in the Arcanist's Magic reference.
      `Engine.cascade()` stays as their reader, and the CRB conformance tests
      pin the tables through it. The sheet no longer calls it. `logCascade`
      and `recordCascade` are removed, since nothing calls them.
    - **Nothing goes into Notes.** A Cascade's Aberration is recorded with
      `note: "Cascade, YYYY-MM-DD"`, which the player can rewrite on its
      card. The audit entry reads "Cascade: Name (permanence)". Backlash, a
      Cosmetic Mutation and Burned Out aren't recorded. The panel says the GM
      runs them and anything that lasts goes in Notes.
    - **One picker, in Decision 111's modal.** It opens from the Cascade
      panel and from **+ Add an Aberration** on Trackers. It has a
      Temporary/Permanent toggle, whose status line reads
      `aberrationRules.temporary` or `.permanent`, and a search over name,
      `as` and description. Below that are Good, Neutral and Bad as cards,
      each with its whole text, because Ken asked to read them before the
      pick. One you hold is disabled and says "You have it". A pick is one
      `commit()`, then the modal closes and focus goes back to its button.
    - `aberrationRules.temporary` is new: "A Temporary Aberration lasts 8
      hours", which is the Cascade Table's own clock. It's display text only.
    - **Pinned:** the Cascade smoke test is rewritten. It checks there are no
      dice inputs, every Aberration is on a card with its text, and search
      and the toggle work. It checks a pick records with the dated note and
      no Notes line, focus returns, a held one is disabled, and undo works.
      The palette test moved to the picker. An engine test covers the note
      and the one undo. Mutation-tested: cards without their text fail the
      smoke test.
    No game data or schema bump, since nothing a character computes changes
    (Decision 68). App **0.20.0 → 0.21.0**. (Ken + Scott + Claude,
    2026-09-24)

116. **(The spell tag AP is Armor Piercing — data)** **`spellTagGlossary`'s
    `AP` means what the weapon tag means: it bypasses the target's RES, and
    PROT still rolls.** Ken's ruling, 2026-09-24. **Replaces Decision 93 in
    part**, which flagged AP rather than assume it, because only Iron Lance
    uses it and the Magic chapter's own tag list doesn't name it. Iron
    Lance's effect line already reads "SP Damage, armor piercing", so the
    CRB said it all along. The flag and its note are gone, and the player
    now sees a definition instead of "(Undefined…)". Ken adds AP to the
    appendix's tag list. It's display text, since no engine code reads spell
    tags, so there's no game data bump (Decision 68). Ships in app
    **0.21.0** with Decision 115. (Ken + Claude, 2026-09-24)

117. **(Let a hit land — W15, app)** **An action that leaves more damage
    than before flashes what it changed, once.** Ken's wishlist item, picked
    up in the 2026-09-24 wishlist session under his "everything, no pauses".
    No rules, data or schema change.
    - **One hook, in `commit()`.** `landedFrom(before, ch)` compares the
      Health Level cells before and after (`hlCells`). If damage or Massive
      went up, `S.landed` names the cells whose fill grew and whether the
      Pain Level rose (or the character went Down). `renderMain` takes it
      into `landedNow` for that one render and clears it, so a tab switch
      or any later render doesn't replay it. So a hit from the modal, Hurt,
      a typed damage total and a Turn Reset tick all land the same way.
      Healing and undo never flash, since undo doesn't go through `commit()`.
    - **One effect.** A magenta flash on the HP readouts (the vitals pill,
      Main's Health card, Trackers' HP) and on each Health Level box that
      took damage, on the track and Main's mini track. The Pain readouts (the
      pill, Main's Pain card, Trackers' Pain card) play it twice when the
      level rose: the distinct beat W15 asked for. None of it plays under
      `prefers-reduced-motion`.
    - **Pinned:** one smoke test. Mutation-tested (5 mutants): the flash
      replaying on a later render, healing flashing, the wrong boxes, Pain
      always beating, Pain never beating. Each fails the test.
    Ships in app **0.22.0**. (Ken + Claude, 2026-09-24)

118. **(The catalog browser — W4, engine + app)** **Loadout's weapon and
    armor pickers are a modal that shows every number before Add or Buy, with
    search, a section filter, "What I can afford", and a sort.** Ken's
    wishlist item, 2026-09-24 session. No data or schema change. It extends
    Decision 100 (Add and Buy side by side, Buy paying in the same action)
    and reuses the spell picker's shape (Decisions 111–112): a sticky head,
    a status line, a **Done** footer, and a modal that stays open for the
    next pick, each pick one `commit()` with its undo toast.
    - **One reader, two places.** `Engine.catalogLine(ch, kind, id)` returns
      what Loadout would draw for that entry once carried: a weapon's attack
      (its skill's check, Pain and Conditions in it), damage resolved for
      this character (BOD+3 reads 8 at BOD 5), range, RoF and capacity; an
      armor piece's PROT, RES, Integrity and mod slots. It adds `price`,
      `availability`, `flavorLine`, and `buy: { ok, why }`: "Costs 7,500Ç.
      You have 1,500Ç." or "No street price". `weaponLine` now builds on the
      same `weaponDefLine`, and an engine test pins that every catalog
      weapon's line is the same before and after it's carried. It's total,
      and null for an unknown id. The line also carries a grenade's
      `radius`.
    - **The modal.** Rows list name, section, skill, style and tags, then
      the numbers, the price and availability, and Add and Buy. Buy is off
      when you can't pay, and the row says why in text (W24's lesson: a
      tooltip never reaches a touch screen). Add stays on, for gear that's
      found or issued. A click on the row, not its buttons, opens the
      catalog's flavour line, so a row has two actions and neither is
      a guess. Sorts: book order, price either way, damage (weapons),
      Integrity (armor), name. On a phone each row is a card with its
      numbers labelled.
    - **Loadout** keeps only what you own, plus **Browse the catalog** and
      **+ Custom** under each section. The native `<select>`, its Add and its
      Buy are gone.
    - **Pinned:** a smoke test (numbers before adding, search, afford, sort,
      details, Buy keeps the modal open and refreshes the balance, undo) and
      two engine tests (parity with `weaponLine`, totality). The two older
      Loadout smoke tests now go through the modal. Mutation-tested (6
      mutants): the afford filter ignored, no refresh after a pick, Buy never
      disabled, the engine never refusing on price, no sort, details that
      never open. Each fails a test.
    Ships in app **0.22.0**. (Ken + Claude, 2026-09-24)

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
waits on the Cyborg rewrite (F6).

~~F15~~ closed the same day it opened: Ken confirmed Tracking is **INT/EMP** — the
CRB's "(INT / INT)" was a slip made while correcting Occult Lore and Survival off
their derived-attribute synergies — and corrected the CRB. The data had carried
INT/EMP all along, so nothing changed but the flag.

~~F16~~ closed 2026-09-22: Ken corrected Hemophiliac in the CRB to call for a
**Medical** Skill Check (both mentions), and the data entry was re-synced to
match and its flag dropped. Text-only — no computed value or available choice
moved, so no `gamedataVersion` bump (Decision 68).

Sixteen objects in `shadows-data.js` carry `flagged: true` as of 2026-09-22
(a recursive count: sixteen, plus F20–F22 opened by the Conditions session,
minus F1, F2, F14, F17 and F20–F22, closed by Decisions 97–98, plus the
three F23 entries opened by the hit resolver, Decision 99, plus F24 on
`damageRules.whileDying`, Decision 100, plus F25 on `naturalArmorRules`,
Decision 104).

~~F1~~, ~~F2~~, ~~F14~~ and ~~F17~~ closed 2026-09-22 on a design-team ruling
(Decision 97). F1/F2/F17 confirmed what the app already did; F14 moved a price.
~~F20~~, ~~F21~~ and ~~F22~~ closed the same day (Decision 98), hours after the
Conditions session opened them; so did the unnumbered stat-curve flag. `tests/docs.test.mjs` is what keeps the table below honest, not this
sentence.

~~F11~~ closed 2026-09-23 (Decision 113): 041 now asks for the Intuition
**skill** at Rank 1, and Quick Study's data follows it.

| # | Item | Owner | Blocking? |
|---|---|---|---|
| F5 | Adv/Disadv audit flags — **three of four closed by the CRB v4 pass**. Remaining: Cyber-Prophetical (SAN vs TOL), which waits on F6 | Deighton | No |
| F6 | Cyborg rewrite (NCI tiers, Set Bonuses, Kicker Dice, TOL pressure) — ships as `status: "tbd"` | Ken/D | No |
| F7 | SFR per archetype: Werewolf defined (WILL×3+N, RoU); Vampire Blood Pool TBD. **2026-09-10 meeting (Scott/Deighton) added Vampire direction, not yet locked**: blood efficiency scales with age/power, bagged blood restores less SFR than fresh, a feeding vampire is vulnerable (treated as grappled), and sunlight resistance is a rare-power exception — the cost never fully goes away. A Werewolf predator's-mark rework (flat 2 SFR returned on takedown, vs. the current 1-spent/1-returned) was also proposed, not locked | Ken → docs | No |
| F8 | **Stat Point roll conflict**: WIP says flat "3d10+30" for all levels; REF table scales by power level (30+2d10 … 60+5d10). Data file uses the scaled table pending ruling. **Design team, 2026-09-22: still open** — they want to playtest how many Stat Points people realistically get before choosing | Ken/D | **Wizard** |
| F9 | Are the WIP's "General Milestones" shared across all archetypes (REF says General Majors are open to all) or Professional-only? Data file treats them as shared | Ken/D | No |
| F12 | Minor Milestones pool sourced from REF (v3.5); WIP refers to an unwritten Advancement Section | Ken → docs | No |
| F13 | Vampire `canPurchaseAdvantages: false` is assumed from the Werewolf supernatural baseline — confirm | Ken/D | No |
| F18 | **Weapons/Armor/Defense system** — the catalog half is done: weapons/ammunition/arrowheads/armor merged into game data as Decision 92 (2026-09-12). **The 2026-09-10 meeting (Scott/Deighton) settled the Massive damage formula** (strips armor Integrity equal to the weapon's damage, removes 1 Health Level per 10 points of that damage, +1 additional HL if armor was reduced to zero or there was none; weapons carry an MD1/MD2/MD3 shorthand not yet assigned — Thunderclap/Shockwave/Blackout already exist in the catalog as named grenades with matching stats) **and a first-pass grenade evasion rule** (MOB Essence check, not REF — threshold 2 clears a 5m radius, threshold 3 clears 10m). **The Conditions system is done** (Decisions 95–96, 2026-09-22), and so is **the hit resolver** (PROT/RES/Integrity math, Massive damage, Shock and At Zero — Decision 99, 2026-09-22). **Loadout pickers, weapon lines, the worn toggle and the recovery actions are done too** (Decision 100, 2026-09-22). What's left: assigning MD ratings across the gear list (Design, small) | Ken/D/Scott | No |
| F19 | **Cyborg install cost mechanism** — proposed as either temporary Sanity erosion (roughly 1–5% permanent max-SAN reduction per install, d6 for major replacements) or a temporary Health Level cost that recovers over weeks (borrowing the Massive Damage mechanic). Scott is on record as unsure which; whichever is chosen, recovery must not be cheap enough to make the cost meaningless. Blocks the Cyborg rewrite's IP-sink design (part of F6) | Ken/D/Scott | No |
| F23 | **RES against Electric and Burning, and the Resistance upgrade** — the CRB gives base (Kinetic) RES to Blade/Blunt/Ballistic and extends it to Energy (Ablative Plating) and Magical (Warding), but never says where Electric or Burning damage falls. Stubbed as Energy: no RES without Ablative. Separately, the Resistance upgrade's 50% reduction (Thermal/Electric/Freezing) has no stated order against PROT and RES, so the hit resolver doesn't apply it and tells the player to adjust by hand. One grouped question for Deighton (Decision 99) | Deighton | No |
| F24 | **Ongoing damage while Dying, at a Reset** — 054 says damage while Dying is "an automatic failure and a mark against you", and that ongoing damage from Burning or Bleeding ticking is "another mark". When Bleeding ticks at a Reset, is that one mark (the check fails automatically) or the WILL check plus a mark per source? Stubbed: each source that ticks is one Death Mark and stands in for the check, which isn't asked; with nothing ticking the check is asked (Decision 100). Worth asking alongside F23 | Deighton | No |
| F25 | **How Natural Armor answers a hit** — the CRB grants it in four places (Thick Skin +1/rank, Shake it Off 5, Iron Shirt BOD bonus + 1, Waning Moon "treated as Warding") but never says how it applies. Stated: "unaffected by Armor Piercing" (Thick Skin) and "treated as Warding". Stubbed (Decision 104): a flat reduction after PROT and RES, on every body part, Kinetic only unless Warded, ignores AP, skipped by Massive, and every source stacks. Ask with F23: they're the same RES-class question | Deighton | No |

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

- **Batch 3 — Selection & constraint system** ✅ *(2026-09-03)* — Decisions
  77-81. `picks` / `excludes` / `requires` built once and hosted by three
  things: advantages, disadvantages and skills. All ~15 entries Decision 58
  named are encoded, plus Martial Arts styles. **A3** retrofitted archetype
  specialization onto one model, which retired the Arcanist / Professional /
  Werewolf branches in `renderArchetype` and the aberration-only branch in
  `renderShArchetype` — **A1 and A2 closed as a side effect and the suite's
  last `todo` flipped green.** Character schema **0.4 → 0.5** (one
  specialization array replaces three fields, with a `migrate()` step);
  game data **0.3 → 0.4** (fifteen entries now demand an input they did not
  before); app **0.5.0 → 0.6.0**. A stale-mirror defect in the Professional
  natural-advantage pool was found and fixed in passing (Decision 81).

- **Batch 3a — the ledger attention state** ✅ — `renderLedger` marks a passed
  step done when it has no *errors*, ignoring warnings entirely, so a player who
  walks past Skills with ten unspent points gets a green tick. That is shipped
  behaviour for every step and every player, not an Educated problem. A third row
  state — done / active / needs attention — driven by warnings on a step already
  passed, plus a callout linking back. The rows are already clickable and
  `validate()` already emits the warnings. **It goes first because it is the
  thing that makes `grants` safe to land.**

- **Batch 3b — `grants`** ✅ *(2026-09-05)* — the other half of Decision 58:
  Educated (+10 Skill Points/rank), Hard to Kill (+1 max HP per Health Level),
  Lucky / Unlucky (LUCK spend costs) and Long-Lived (Milestones), via a new
  `grants` array consumed by `skillPool`/`health`/`luckState`/`milestoneState`
  (Decision 87). **Educated needed a wizard-flow ruling** — bought at step 7,
  it grows the step-6 pool retroactively — and 3a settled it by construction:
  surfacing the unspent points and letting the player go back means the points
  are usable at creation, and the app says so rather than reopening a step in
  silence. Long-Lived's rank-stacking ambiguity flagged rather than guessed
  (F17, Decision 88). Game data **0.4 → 0.5**; app **0.7.0 → 0.8.0**.

  **Thick Skin is deliberately not in 3b.** It grants Natural Armor, the armor
  design is still in flux, and **four separate places in the data already grant
  Natural Armor in prose** — Thick Skin, the Iron Shirt Martial Arts style, an
  archetype effect, and an archetype benefit. Four sources for one quantity is
  the Decision 66 shape (*promote it to a number, read it, display it*), so
  Natural Armor becomes a real derived value with its own reader when the design
  lands — not a Thick Skin special case bolted on early. Until then it ships as
  reference text, like every other un-modeled rule.

- **Decompose `src/ui/app.js`** (Decision 54's deferred refactor) ✅ — done on
  `refactor/decompose-app-js`, ahead of 3b rather than after it (Decision 86).
  Then Cyborg (F6) as data rather than a fourth special
  case. Clear **F8** on its own track — it is a four-number data edit and the
  only wizard-blocking flag.

- **Magic on the sheet** — planned 2026-09-23 in
  `docs/plans/magic-on-the-sheet.md`: the Grimoire reads the book (Session 1 —
  **done**, Decision 108), then acquired Aberrations and a Magic reference
  (Session 2 — **done**, Decision 110), then starting spells in the wizard
  (Session 3 — **done**, Decision 111). **The plan is closed.** Its rules
  questions (`MQ`n) all went to Deighton and were answered (Decision 109).

- **Conditions, damage & armor** (F18's engine half) — planned 2026-09-22 in
  `docs/plans/combat-and-conditions.md`: Conditions first (Session 2 — **done**,
  Decisions 95–96), then hit resolution through armor (Session 3 — **done**,
  Decision 99), then Loadout pickers and recovery actions, including the Turn
  Reset helper (Session 4 — **done**, Decision 100), then the cleanup session
  (**done**, Decisions 103–105: Deighton's TOL ruling, Natural Armor as one
  derived value with F25, the Nanomed Kit), and the Magic-tables side
  session (**done**, Decision 106: the Cascade and Aberration tables, and a
  TOL Spent tracker for the Arcanist). **The plan is closed.** Weapon mods and
  ammo went to `WISHLIST.md`. The plan holds the sequencing rationale and the
  open questions (`CQ`n).

**Session handoff protocol:** every phase ends with current files +
this document updated. Ken adds the latest versions to project knowledge.
A new session resumes with: *"Continue the character sheet build — Phase N.
Files are in project knowledge; read SCHEMA.md first."*
