// Shadows TTRPG game data - generated from CRB v4 WIP sources, 2026-06-11
// Everything after this line is JSON. Edit freely; the app reads window.SHADOWS_DATA.
//
// ============================================================================
// HOW TO EDIT THIS FILE  (read before adding or changing anything)
// ============================================================================
// This file is the single source of game content for the character sheet. The
// app reads `window.SHADOWS_DATA` and never hardcodes content, so changing a
// value here changes the app everywhere on next load. The file is loaded with
// `<script src>`, which means it is executed as JavaScript -- so these `//` and
// `/* */` comments are safe and are ignored at runtime.
//
// THE GOLDEN RULES
//   1. `id` is a contract. Character files (*.shadows.json), prerequisites, and
//      engine lookups all reference entries by `id`. NEVER change or reuse an
//      existing id once characters exist -- rename the `name` instead. Adding a
//      NEW id is always safe.
//   2. Only INPUTS live here and in character files; the app COMPUTES everything
//      derived (modifiers, HP, WILL, skill totals) at runtime. Edit a formula
//      and every character updates. Do not bake computed numbers into the data.
//   3. Stat references must be valid stat ids (BOD/REF/MOB/INT/TECH/COOL/MAG/EMP).
//      `primaryStat`, `synergyStat`, derived `inputs`, etc. are checked against
//      the `stats` list; an unknown id surfaces a gold data-issue flag in the app
//      rather than crashing (Decision 22).
//   4. After ANY edit, re-validate (the file must still parse as JS). A quick
//      check: `node -e "global.window={};require('./shadows-data.js')"`.
//
// MARKING UNRESOLVED DESIGN QUESTIONS
//   - Durable, app-visible flags are DATA fields on the entry:
//        "flagged": true, "flagNote": "F8: ... confirm with D."
//     These survive everywhere and the app can display them.
//   - Review notes added in this pass for Ken to verify are `//` comments
//     prefaced with `REVIEW:` and the SCHEMA flag number. They are for the human
//     reading the source; delete them once the question is settled. Every open
//     flag from SCHEMA.md section 5 is surfaced at its relevant section below.
//
// VERSIONING: bump `meta.schemaVersion` only when the SHAPE changes (new fields,
// renamed keys). Bump `meta.rulesetVersion` / `meta.updated` for content edits.
// ============================================================================
window.SHADOWS_DATA = {

  /* META -- version stamps. The app compares a character's saved
     `gamedataVersion` against this on load and surfaces mismatches (e.g. a skill
     the character has that no longer exists) instead of failing silently.
     UPDATE: bump `schemaVersion` on a structural change; set `rulesetVersion`
     and `updated` whenever content changes. */
  "meta": {
    "schemaVersion": "0.2",
    "rulesetVersion": "CRB v4 WIP",
    "updated": "2026-06-11",
    "notes": "Generated from WIP_NewIntroduction.md (authoritative) and REF files (fallback). WIP beats REF on conflicts."
  },
  /* STATS -- the 8 Basic Stats. These ids are the most-referenced contract in
     the file: skills point at them (`primaryStat`/`synergyStat`), derived
     attributes sum them, archetypes list `primaryStats`, character files store
     them. Do NOT change an existing id. To add a stat: append an entry, then add
     it to `statRules.modifiers`; the app picks it up (icon optional -- a missing
     icon falls back to "" and never breaks the sheet). `name` and `description`
     are free to edit. */
  "stats": [
    {
      "id": "BOD",
      "name": "Body",
      "description": "The broadest of the physical Basic Stats. This is your whole body. Ranks in BOD play into the amount of health you have, your physical endurance and how much you can lift, capacity to handle pain, how well you resist poison or disease and infection. It also determines the baseline damage for melee weapons, kicks, and punches."
    },
    {
      "id": "REF",
      "name": "Reflexes",
      "description": "Hand-eye coordination, agility, reflexes, and accuracy with weapons. Used heavily in combat, spellcasting under pressure, and any moment where hesitation gets you killed."
    },
    {
      "id": "MOB",
      "name": "Mobility",
      "description": "A physical representation of how easy it is for you to get around. Determines your base running speed, sprint speed, and how far you can jump with a running start."
    },
    {
      "id": "INT",
      "name": "Intelligence",
      "description": "The edge that cuts through noise. Pattern recognition, argumentation, the ability to think three moves ahead when everyone else is still reacting."
    },
    {
      "id": "TECH",
      "name": "Technological Aptitude",
      "description": "How well you understand the machines that run the city - and how badly things go when you don't. Governs your ability to use, break, modify, or survive technology that was never designed with your safety in mind."
    },
    {
      "id": "COOL",
      "name": "Cool",
      "description": "How you act when everything is on the line and everyone is watching. Panic is contagious. So is confidence. COOL decides which one you bring into the room."
    },
    {
      "id": "MAG",
      "name": "Magnetism",
      "description": "Presence. The way a room shifts when you walk in. People trust you, follow you, and sometimes don't know why. That's not charm -- that's gravity."
    },
    {
      "id": "EMP",
      "name": "Empathy",
      "description": "The emotional and intuitive Stat. It has direct correlation to your Sanity and is a snapshot of your character's overall humanity. Low EMP leaves people cold to themselves and colder to others. It is also the first thing NYTE City takes."
    }
  ],
  /* STAT RULES -- the engine for every stat-derived number. `modifiers` is the
     v4 curve (score -> modifier) used by skill synergy bonuses and derived
     attributes; if you retune the curve, every computed total moves. `base`/`max`
     bound creation and IP raises. `beyondHumanLimits` documents that some
     archetypes exceed 10 (the app extrapolates +1/point above 10, Decision 18).
     `ranges` is reference prose shown to players. UPDATE the `modifiers` map to
     match `stats` if you add a stat. */
  "statRules": {
    "base": 1,
    "max": 10,
    "modifiers": {
      "1": -3,
      "2": -2,
      "3": -1,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 1,
      "8": 2,
      "9": 3,
      "10": 4
    },
    "modifierRuleText": "For each point below 4, a -1 penalty for skills or synergies. For each point above 6, a +1 bonus for skills or synergies.",
    "beyondHumanLimits": "Some Archetypes (Vampires, Werewolves) are not bound by normal human ceilings; their Basic Stats can exceed 10. Once a stat passes 10, gains slow down.",
    "ranges": [
      {
        "range": "3 or lower",
        "meaning": "Very young or old, an old injury or trauma, poor genetics, or hard living has left a mark. This will matter in play."
      },
      {
        "range": "4-6",
        "meaning": "Human average. You get by. You don't stand out."
      },
      {
        "range": "7-9",
        "meaning": "Exceptional. The city notices."
      },
      {
        "range": "10",
        "meaning": "The edge of human potential. Pushing past this comes at a cost."
      }
    ]
  },
  /* DERIVED -- attributes the app COMPUTES from stats; never stored on a
     character. Two `type`s in use: "sumOfModifiers" (base + sum of the modifier
     of each stat in `inputs`, clamped to `floor`) and "percent" (evaluate
     `formula`, clamp to `floor`/`cap`). `inputs` and `formula` must reference
     valid stat ids. TOL and WILL cannot be raised directly by IP (see `ip`).
     To add a derived attribute, copy a block and pick the matching `type`. */
  "derived": [
    {
      "id": "TOL",
      "name": "Tolerance",
      "type": "sumOfModifiers",
      "base": 1,
      "floor": 1,
      "inputs": [
        "INT",
        "COOL",
        "EMP"
      ],
      "description": "How much strain your body can endure before the power you wield starts pushing back. As you cast spells or activate cybernetics, Exhaustion builds. Push too far, and your body refuses to cooperate."
    },
    {
      "id": "WILL",
      "name": "Will",
      "type": "sumOfModifiers",
      "base": 1,
      "floor": 1,
      "inputs": [
        "BOD",
        "INT",
        "EMP"
      ],
      "description": "Your defense against intrusion - mental, emotional, or supernatural. It comes into play when something tries to break you from the inside."
    },
    {
      "id": "SAN",
      "name": "Sanity",
      "type": "percent",
      "formula": "EMP * 10",
      "floor": 10,
      "cap": 95,
      "description": "Your connection to reality and its people, based on EMP alone. No one is perfectly sane: maximum SAN is 95%."
    }
  ],
  /* RESOURCES -- the pools and tracks a character spends or accrues. Each
     sub-key is its own system: `healthLevels` (HL count + HP/level + Pain Level
     thresholds and per-level penalties the app applies to displayed checks,
     Decision 24), `luck` (starting value + CP buy-up + spend actions), `credits`
     (currency symbol/desc; the starting roll lives on each power level, not
     here), `sfr` (supernatural fuel), `exhaustion` (Arcanist strain). Spend
     actions and thresholds are read directly by the Trackers tab -- edit the
     numbers here and the tracker UI follows. */
  "resources": {
    "healthLevels": {
      "levelsPerBOD": 1,
      "hpPerLevel": 5,
      "maxLevels": 10,
      "bodAbove10Rule": "For each point of BOD above 10, the base HP of each Health Level goes up by 1 (HL count stays capped at 10).",
      "painLevels": [
        {
          "level": 0,
          "hlLostThreshold": 0,
          "label": "Pain Level 0",
          "description": "Shock, adrenaline, surface wounds (0-1 HL lost)."
        },
        {
          "level": 1,
          "hlLostThreshold": 2,
          "label": "Pain Level 1",
          "description": "Deep bruising, bleeding, compromised movement (2+ HL lost)."
        },
        {
          "level": 2,
          "hlLostThreshold": 5,
          "label": "Pain Level 2",
          "description": "Fractures, internal damage, failing strength (5+ HL lost)."
        },
        {
          "level": 3,
          "hlLostThreshold": 8,
          "label": "Pain Level 3",
          "description": "Catastrophic injury, survival is uncertain (8+ HL lost)."
        }
      ],
      "painPenaltiesPerLevel": {
        "skillChecks": -1,
        "essenceCheckDice": -1,
        "breakerCheckPercent": -5,
        "notes": "Essence Checks can never drop below 1 die. Breaker percentages cannot be reduced below 10%."
      }
    },
    "luck": {
      "startingValue": 2,
      "buyUpWith": "characterPoints",
      "cpCostPerPoint": 1,
      "exemptFromBoostCap": true,
      "flagged": true,
      "flagNote": "F1: CP cost per LUCK point stubbed at 1 — confirm with D.",
      "spend": [
        {
          "action": "Boost the roll",
          "cost": 2,
          "effect": "Increase the face result of a die by 1. Can turn a Botch into a plain failure, or boost a 9 to a 10 to explode the die."
        },
        {
          "action": "Explode the roll",
          "cost": 3,
          "effect": "Roll the die again and add the new result to the total."
        }
      ],
      "refresh": "Luck does not refresh during breaks, pauses, or downtime - only when a session truly ends."
    },
    "credits": {
      "symbol": "Ç",
      "description": "A Universal Basic Income keeps you fed, sheltered, and connected. Credits become relevant when you want something beyond survival - gear, favors, transport, information. Tracked as a simple numerical total."
    },
    "sfr": {
      "name": "Spiritual Force Rating",
      "description": "The pressure behind a supernatural nature - the energy channeled to activate Powers. No spellcraft check to activate: spend the required SFR and the effect triggers. Rate of Use (RoU) limits the maximum SFR channeled in a single turn. Some Powers drain SFR over time, counting against RoU each turn.",
      "appliesTo": "supernatural archetypes (per archetype scaling tables)"
    },
    "exhaustion": {
      "description": "Tied to specific forms of power. For Arcanists, repeated or reckless spellcasting builds Exhaustion as Tolerance is strained. Not spent like a resource: accumulates through risk and failure, recovered through rest. Full rules in the Magic section."
    }
  },
  /* SKILL CHECK RULES -- the dice math the app displays in skill breakdowns and
     check previews. `trained`/`untrained` are the formulas (Decision 8),
     `difficulties` the standard TNs, plus explosion/botch behavior. This is
     reference/display text and the engine's formula source; keep it in sync with
     any change to how checks are computed in the app. */
  "skillCheckRules": {
    "trained": "1d10 + Skill Rank + Primary Stat (full score) + Synergy Bonus (modifier of synergy stat)",
    "untrained": "1d10 + Primary Stat only",
    "difficulties": {
      "easy": 10,
      "medium": 15,
      "hard": 20
    },
    "explosion": "Rolling a 10 lets you roll again and add the result; chains on repeated 10s.",
    "botch": "Rolling a 1: the action fails and the situation gets worse."
  },
  /* POWER LEVELS -- the 4 campaign tiers. The creation wizard reads the chosen
     tier's `statPoints`/`skillPoints` pools, the `max*` caps (enforced strictly,
     Decision 10), `characterPoints`, and `startingCredits` roll. `maxBoost` caps
     how many times any single target may be CP-boosted (Decision 3). Archetype
     scaling tables (below) key off these `id`s, so keep the four ids stable.
     `roll` strings are physical dice the player enters -- the app never rolls. */
  "powerLevels": [
    {
      "id": "street",
      "name": "Street Level",
      "order": 1,
      "statPoints": {
        "base": 30,
        "roll": "2d10"
      },
      "skillPoints": {
        "base": 40,
        "roll": "3d10"
      },
      "maxSkillRank": 4,
      "maxPowerRank": 2,
      "maxBoost": 2,
      "characterPoints": 10,
      "startingCredits": {
        "roll": "3d4",
        "multiplier": 100
      },
      "description": "Where it all begins. Threats consist of thugs, small gangs, local hackers, and the occasional brush with something larger. Magic exists, but rarely crosses your path directly. Conflicts are personal and immediate. Expect a neighborhood to borough-level scope."
    },
    {
      "id": "heroic",
      "name": "Heroic",
      "order": 2,
      "statPoints": {
        "base": 40,
        "roll": "3d10"
      },
      "skillPoints": {
        "base": 45,
        "roll": "3d10"
      },
      "maxSkillRank": 5,
      "maxPowerRank": 3,
      "maxBoost": 3,
      "characterPoints": 15,
      "startingCredits": {
        "roll": "4d4",
        "multiplier": 100
      },
      "description": "You've proven you can survive the streets. Threats escalate to gang leaders, coordinated hacking groups, and the attention of mid-tier corporate interests. The supernatural world begins to take notice. Expect district to sector-level scope."
    },
    {
      "id": "shadows",
      "name": "Shadows",
      "order": 3,
      "statPoints": {
        "base": 50,
        "roll": "4d10"
      },
      "skillPoints": {
        "base": 50,
        "roll": "3d10"
      },
      "maxSkillRank": 5,
      "maxPowerRank": 4,
      "maxBoost": 4,
      "characterPoints": 20,
      "startingCredits": {
        "roll": "5d4",
        "multiplier": 100
      },
      "description": "You operate in direct opposition to corporate power, organized crime, and entrenched supernatural forces. Your actions reshape zones and regions, and may draw attention from powers beyond NYTE City."
    },
    {
      "id": "wcd",
      "name": "World Coming Down",
      "order": 4,
      "statPoints": {
        "base": 60,
        "roll": "5d10"
      },
      "skillPoints": {
        "base": 55,
        "roll": "3d10"
      },
      "maxSkillRank": 6,
      "maxPowerRank": 5,
      "maxBoost": 5,
      "characterPoints": 25,
      "startingCredits": {
        "roll": "5d10",
        "multiplier": 100
      },
      "description": "The highest starting scale of play. Threats include the full weight of corporations, criminal empires, and supernatural entities capable of destabilizing entire regions - or the world itself. Survival may not be the only question; what survives with you becomes just as important."
    }
  ],
  // REVIEW (F8 - BLOCKS WIZARD): WIP vs REF disagree on the stat-point roll. The
  // data below uses the scaled REF table; once D. rules, this is a four-number
  // edit to `powerLevels[*].statPoints` -- no app change. See SCHEMA.md section 5.
  "powerLevelFlags": {
    "flagged": true,
    "flagNote": "F8: WIP 'Rolling Stat Points' says a flat 'Roll 3d10 + 30' for all levels; the REF table scales stat point rolls by power level (30+2d10 / 40+3d10 / 50+4d10 / 60+5d10). Data file uses the scaled REF table pending confirmation. Note: explosions do NOT happen on creation rolls."
  },
  /* SKILLS -- the 36-skill catalog (11 combat / 9 utility / 16 general). Each entry's
     `primaryStat` and `synergyStat` MUST be valid stat ids (a wrong id -- e.g.
     legacy "BODY" -- is auto-normalized where known and otherwise flagged, not
     crashed; Decision 22). `category` drives table grouping on the sheet.
     `covers` is the bullet list shown under the skill's "?" expander. Character
     files reference skills by `id`, so adding is safe but renaming an id is not.
     NOTE: any skill named in a Professional subtype's `focusedSkills` must exist
     here by name -- see the F10 review note below. */
  "skills": [
    {
      "id": "archery",
      "name": "Archery",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "COOL",
      "flavorLine": "Archery is older than the LINK. That's not a weakness.",
      "description": "The ability to use bows, crossbows, slings, and slingshots effectively.",
      "covers": [
        "Targeted shots with bows or slings",
        "Rapid reloads and sustained ranged attacks",
        "Use of mechanical aids such as compound bows"
      ]
    },
    {
      "id": "beam-weapons",
      "name": "Beam Weapons",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "TECH",
      "flavorLine": "Energy doesn’t care about cover. Neither does the person holding it.",
      "description": "The ability to operate weapons that fire energy, including continuous beams or pulsed energy projectiles.",
      "covers": [
        "Attacking with Laser rifles and plasma pistols",
        "Working with Energy pulse projectors",
        "Maintaining aim and control under recoil or energy discharge"
      ],
      "notes": [
        "Does not include magical energy or supernatural powers."
      ]
    },
    {
      "id": "combat-sense",
      "name": "Combat Sense",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "INT",
      "flavorLine": "The half-second between noticing and reacting is where most people die.",
      "description": "The ability to perceive and react to threats in combat. Used to determine initiative and situational awareness.",
      "covers": [
        "Recognizing threats and prioritizing targets",
        "Reacting to ambushes or sudden attacks",
        "Tactical awareness under stress"
      ]
    },
    {
      "id": "dodge",
      "name": "Dodge",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "MOB",
      "flavorLine": "Everyone thinks they can dodge. They're right, once.",
      "description": "The ability to avoid attacks or evade damage from traps and environmental hazards.",
      "covers": [
        "Sidestepping strikes",
        "Dodging projectiles or area effects",
        "Escaping hazardous terrain during combat"
      ]
    },
    {
      "id": "handguns",
      "name": "Handguns",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "COOL",
      "flavorLine": "Everyone in NYTE City has one. Not everyone knows what to do after the first shot.",
      "description": "The ability to use semi-automatic, single-handed firearms, including pistols, revolvers, and small-caliber wrist-mounted weapons.",
      "covers": [
        "Accurate single-handed shooting",
        "Quick reloading under pressure",
        "Maintaining aim while moving"
      ]
    },
    {
      "id": "heavy-weapons",
      "name": "Heavy Weapons",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "BOD",
      "flavorLine": "The conversation’s already over. This is the punctuation.",
      "description": "The ability to operate large-caliber and mounted weapons, including vehicle-mounted guns, grenade launchers, and rocket launchers.",
      "covers": [
        "Maintaining aim with heavy recoil",
        "Targeting multiple or distant enemies",
        "Using mounted or vehicle-based weapon systems"
      ]
    },
    {
      "id": "martial-arts",
      "name": "Martial Arts",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "BOD",
      "flavorLine": "A weapon can be taken. A form can't.",
      "description": "The ability to fight unarmed or with specialized techniques, including strikes, holds, and maneuvers.",
      "covers": [
        "Hand-to-hand combat techniques",
        "Defensive maneuvers, parries, and grapples",
        "Use of specialized weapons integral to a Martial Art"
      ],
      "notes": [
        "Choose up to two Martial Arts styles at creation. You may train additional styles later in play.",
        "Each style trained grants its own bonus."
      ],
      "styles": [
        {
          "name": "Commando",
          "bonus": "+1 Stun"
        },
        {
          "name": "Escrima",
          "bonus": "+1 Disarm"
        },
        {
          "name": "Jujitsu",
          "bonus": "+1 Grapple"
        },
        {
          "name": "Karate",
          "bonus": "+1 Stun"
        },
        {
          "name": "Krav Maga",
          "bonus": "+1 Disarm"
        },
        {
          "name": "Kung Fu",
          "bonus": "+1 Knockdown"
        },
        {
          "name": "Custom Style",
          "bonus": "Talk with GM to determine bonus"
        }
      ]
    },
    {
      "id": "melee",
      "name": "Melee",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "BOD",
      "flavorLine": "When the gun jams, the knife doesn't.",
      "description": "The ability to use handheld, improvised, and thrown weapons effectively, including knives, clubs, chair legs, shuriken, grenades, and similar items. Also used when taking the Parry action.",
      "covers": [
        "Close-quarters combat with melee weapons",
        "Improvised weapons and thrown objects",
        "Defensive Parry techniques"
      ]
    },
    {
      "id": "rifles",
      "name": "Rifles",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "COOL",
      "flavorLine": "Distance is a luxury. Patience is a skill.",
      "description": "The ability to operate rifles, including urban combat rifles, shotguns, and sniper rifles.",
      "covers": [
        "Accurate long-range shooting",
        "Rapid follow-up shots under stress",
        "Sustained fire in combat situations"
      ]
    },
    {
      "id": "smgs",
      "name": "SMGs",
      "category": "combat",
      "primaryStat": "REF",
      "synergyStat": "COOL",
      "flavorLine": "Close. Fast. Loud. In that order.",
      "description": "The ability to operate submachine guns, covering weapons capable of burst or full-automatic fire.",
      "covers": [
        "Maintaining control during automatic fire",
        "Accurate suppression and rapid engagement",
        "Targeting multiple opponents in close to mid-range"
      ]
    },
    {
      "id": "tactics",
      "name": "Tactics",
      "category": "combat",
      "primaryStat": "INT",
      "synergyStat": "EMP",
      "flavorLine": "Positioning wins fights. Everything else just decides how long they take.",
      "description": "Applied understanding of combat strategy and positioning.",
      "covers": [
        "Assessing combat situations",
        "Identifying advantages and weaknesses",
        "Determining effective courses of action"
      ],
      "notes": [
        "Awareness identifies the situation; Tactics determines how to act on it.",
        "The GM may provide guidance based on available information."
      ]
    },
    {
      "id": "basic-tech",
      "name": "Basic Tech",
      "category": "utility",
      "primaryStat": "INT",
      "synergyStat": "TECH",
      "flavorLine": "Everything in NYTE City is held together by someone who knows which wire not to pull.",
      "description": "General knowledge and practical use of mechanical, vehicular, and common technologies.",
      "covers": [
        "Repair and maintenance of everyday devices",
        "Mechanical systems and basic electronics",
        "Vehicles and non-specialized machinery"
      ]
    },
    {
      "id": "cybernetics",
      "name": "Cybernetics",
      "category": "utility",
      "primaryStat": "TECH",
      "synergyStat": "INT",
      "flavorLine": "The body is hardware. Cybernetics is the warranty work.",
      "description": "Knowledge and manipulation of cybernetic implants, limbs, and integrated systems.",
      "covers": [
        "Installation, removal, and modification of cyberware",
        "Diagnosing cybernetic malfunctions",
        "Understanding implant–system interactions"
      ]
    },
    {
      "id": "demolitions",
      "name": "Demolitions",
      "category": "utility",
      "primaryStat": "TECH",
      "synergyStat": "COOL",
      "flavorLine": "The placement is everything. The rest is just timing.",
      "description": "The creation, placement, and disarming of explosive devices.",
      "covers": [
        "Plastic explosives, IEDs, and industrial explosives",
        "Timers, detonators, and triggering mechanisms",
        "Safe neutralization of explosive threats"
      ],
      "notes": [
        "Does not include grenade or rocket launchers (see Heavy Weapons Skill)"
      ]
    },
    {
      "id": "engineering",
      "name": "Engineering",
      "category": "utility",
      "primaryStat": "TECH",
      "synergyStat": "INT",
      "flavorLine": "Basic Tech fixes what’s broken. Engineering decides what gets built next.",
      "description": "Advanced technical expertise in the design and manipulation of complex systems.",
      "covers": [
        "Advanced electronics and circuitry",
        "Experimental or cutting-edge technologies",
        "Designing, modifying, or improving complex devices"
      ]
    },
    {
      "id": "interface",
      "name": "Interface",
      "category": "utility",
      "primaryStat": "INT",
      "synergyStat": "TECH",
      "flavorLine": "NYTE City has a second skin. Most people live on the surface.",
      "description": "Direct interaction with the LINK through a tactile or neural interface.",
      "covers": [
        "Navigation of digital environments",
        "Espionage, intrusion, and data extraction",
        "LINK-based actions performed by digilantes"
      ]
    },
    {
      "id": "medical",
      "name": "Medical",
      "category": "utility",
      "primaryStat": "TECH",
      "synergyStat": "COOL",
      "flavorLine": "Field medicine isn't about saving lives. It's about buying time.",
      "description": "Training in diagnosing and treating injuries and illnesses.",
      "covers": [
        "Trauma care and emergency stabilization",
        "Use of medical tools and supplies",
        "Treatment of disease, toxins, and physical harm"
      ]
    },
    {
      "id": "programming",
      "name": "Programming",
      "category": "utility",
      "primaryStat": "INT",
      "synergyStat": "TECH",
      "flavorLine": "Code doesn't argue. It does exactly what you wrote, including the mistakes.",
      "description": "The creation and modification of software systems.",
      "covers": [
        "Writing and altering programs",
        "Creating viruses, scripts, and utilities",
        "Debugging and software analysis"
      ]
    },
    {
      "id": "robotics",
      "name": "Robotics",
      "category": "utility",
      "primaryStat": "TECH",
      "synergyStat": "INT",
      "flavorLine": "They don’t get tired. They don’t get scared. Someone still has to tell them what to do.",
      "description": "Knowledge of robotic systems combining mechanics, electronics, and software.",
      "covers": [
        "Construction and modification of robots",
        "Disabling or reprogramming robotic systems",
        "Working with autonomous (Drones) and semi-autonomous machines"
      ]
    },
    {
      "id": "security",
      "name": "Security",
      "category": "utility",
      "primaryStat": "REF",
      "synergyStat": "INT",
      "flavorLine": "Every security system was designed by someone. That someone had assumptions.",
      "description": "Understanding and exploitation of security measures.",
      "covers": [
        "Physical security layouts and guard procedures",
        "Surveillance systems and electronic locks",
        "Identifying vulnerabilities in security design"
      ]
    },
    {
      "id": "acrobatics",
      "name": "Acrobatics",
      "category": "general",
      "primaryStat": "REF",
      "synergyStat": "BOD",
      "flavorLine": "Falling is easy. Falling and landing somewhere useful takes practice.",
      "description": "Physical agility, balance, and coordination.",
      "covers": [
        "Tumbling and balance",
        "Parkour and agile movement",
        "Acrobatic feats in dynamic environments"
      ]
    },
    {
      "id": "athletics",
      "name": "Athletics",
      "category": "general",
      "primaryStat": "BOD",
      "synergyStat": "REF",
      "flavorLine": "NYTE City is vertical, hostile, and fast. Athletics is the tax you pay to move through it.",
      "description": "Physical strength, stamina, and gross motor capability.",
      "covers": [
        "Running, climbing, and jumping",
        "Lifting, pushing, and pulling",
        "Feats of strength and endurance"
      ]
    },
    {
      "id": "awareness",
      "name": "Awareness",
      "category": "general",
      "primaryStat": "INT",
      "synergyStat": "EMP",
      "flavorLine": "What you don't notice doesn't care.",
      "description": "Perceptiveness and attention to detail.",
      "covers": [
        "Visual, auditory, and sensory observation",
        "Detecting threats or anomalies",
        "Noticing subtle environmental or behavioral cues"
      ]
    },
    {
      "id": "deception",
      "name": "Deception",
      "category": "general",
      "primaryStat": "MAG",
      "synergyStat": "INT",
      "flavorLine": "Everyone's working with a version of the truth. Deception is authoring theirs.",
      "description": "The ability to mislead, misdirect, or lie to influence others' perceptions.",
      "covers": [
        "Lying, bluffing, and maintaining cover stories",
        "Creating false impressions or misleading narratives",
        "Concealing true intentions",
        "Recognizing and resisting deception"
      ],
      "notes": [
        "Outcomes reflect the degree of confusion, doubt, or misperception, not forced actions",
        "Can be opposed by the target’s Deception skill"
      ]
    },
    {
      "id": "disguise",
      "name": "Disguise",
      "category": "general",
      "primaryStat": "COOL",
      "synergyStat": "MAG",
      "flavorLine": "The face you were born with is one option.",
      "description": "The ability to convincingly appear as another person.",
      "covers": [
        "Altering physical appearance",
        "Mimicking mannerisms and voice",
        "Adopting lifestyles or personas"
      ]
    },
    {
      "id": "intimidation",
      "name": "Intimidation",
      "category": "general",
      "primaryStat": "COOL",
      "synergyStat": "MAG",
      "flavorLine": "Not everyone needs to be convinced. Some people just need to understand the cost.",
      "description": "The ability to influence others through fear, threat, or presence.",
      "covers": [
        "Creating hesitation, uncertainty, or caution in others",
        "Using posture, tone, or reputation to assert dominance",
        "Reading and exploiting others’ fear responses",
        "Recognizing and resisting Intimidation"
      ],
      "notes": [
        "Outcomes reflect increased leverage, temporary compliance, or hesitation, not forced actions",
        "Can be opposed by the target’s Intimidation skill"
      ]
    },
    {
      "id": "intuition",
      "name": "Intuition",
      "category": "general",
      "primaryStat": "EMP",
      "synergyStat": "INT",
      "flavorLine": "By the time you can explain it, it's already too late to act on it.",
      "description": "Instinctive understanding of people and situations.",
      "covers": [
        "Reading body language and tone",
        "Sensing deception or hidden motives",
        "Gut reactions to social interactions"
      ]
    },
    {
      "id": "investigation",
      "name": "Investigation",
      "category": "general",
      "primaryStat": "INT",
      "synergyStat": "TECH",
      "flavorLine": "Everything leaves a trace. Investigation is knowing which ones matter.",
      "description": "Systematic gathering and analysis of information.",
      "covers": [
        "Research and data analysis",
        "Interviews and questioning",
        "Digital searches and information tracing"
      ]
    },
    {
      "id": "occult-lore",
      "name": "Occult Lore",
      "category": "general",
      "primaryStat": "INT",
      "synergyStat": "COOL",
      "flavorLine": "Most people are happier not knowing. Most people also don't survive long enough for it to matter.",
      "description": "Knowledge of supernatural phenomena and hidden truths.",
      "covers": [
        "True magic and occult practices",
        "Knowledge of Monsters and otherworldly entities",
        "Supernatural classifications and myths"
      ]
    },
    {
      "id": "persuasion",
      "name": "Persuasion",
      "category": "general",
      "primaryStat": "MAG",
      "synergyStat": "COOL",
      "flavorLine": "People do what they want to do. Persuasion is making them want to do something else.",
      "description": "The ability to influence others through reasoned argument, negotiation, or appeal.",
      "covers": [
        "Convincing others to consider your point of view",
        "Shaping decisions, opinions, or cooperation through dialogue",
        "Anticipating objections and countering them effectively",
        "Recognizing and resisting Persuasion"
      ],
      "notes": [
        "Outcomes reflect increased willingness, openness, or temporary cooperation, not forced actions",
        "Can be opposed by the target’s Persuasion skill"
      ]
    },
    {
      "id": "pilot",
      "name": "Pilot",
      "category": "general",
      "primaryStat": "REF",
      "synergyStat": "INT",
      "flavorLine": "The vehicle does what physics allows. The pilot decides what that means.",
      "description": "The ability to operate any vehicle, mech, or steerable machine at speed and under pressure.",
      "covers": [
        "Cycles, grounders, and jumpers",
        "Watercraft and specialized transports",
        "Maneuvering any steerable vehicle, including Rigs"
      ]
    },
    {
      "id": "seduction",
      "name": "Seduction",
      "category": "general",
      "primaryStat": "MAG",
      "synergyStat": "EMP",
      "flavorLine": "The most dangerous thing in the room is rarely armed.",
      "description": "The ability to influence others through charm, allure, and personal presence.",
      "covers": [
        "Creating attraction or interest that can sway choices",
        "Leveraging appearance, personality, or body language",
        "Reading social cues and emotional responses",
        "Recognizing and resisting Seduction"
      ],
      "notes": [
        "Outcomes reflect temporary influence, attention, or willingness, not forced actions",
        "Can be opposed by the target’s Seduction skill"
      ]
    },
    {
      "id": "stealth",
      "name": "Stealth",
      "category": "general",
      "primaryStat": "REF",
      "synergyStat": "COOL",
      "flavorLine": "Presence is a choice. So is absence.",
      "description": "Avoiding detection through concealment and quiet movement.",
      "covers": [
        "Hiding and shadowing",
        "Silent movement",
        "Evading visual, auditory, or sensor-based detection"
      ]
    },
    {
      "id": "streetwise",
      "name": "Streetwise",
      "category": "general",
      "primaryStat": "INT",
      "synergyStat": "EMP",
      "flavorLine": "Every city has an official map. NYTE City has another one underneath.",
      "description": "Knowledge of the criminal and underground landscape of NYTE City.",
      "covers": [
        "Gray and black markets",
        "Pawn shops, fixers, and safe houses",
        "The Labyrinth and other shadow networks"
      ]
    },
    {
      "id": "survival",
      "name": "Survival",
      "category": "general",
      "primaryStat": "BOD",
      "synergyStat": "INT",
      "flavorLine": "Comfort is a city concept. Survival is what's left when the city isn't.",
      "description": "Endurance and self-sufficiency in hostile environments.",
      "covers": [
        "Locating food, water, and shelter",
        "Navigating wilderness or ruined areas",
        "Avoiding environmental hazards and predators"
      ]
    },
    {
      "id": "tracking",
      "name": "Tracking",
      "category": "general",
      "primaryStat": "INT",
      "synergyStat": "EMP",
      "flavorLine": "In NYTE City, nothing disappears. It just moves.",
      "description": "Following trails to locate a target.",
      "covers": [
        "Physical tracking of people or creatures",
        "Digital and data-based tracking",
        "Interpreting signs, patterns, and residual evidence"
      ],
      "flagged": true,
      "flagNote": "F15: CRB v4 Skills section lists Tracking as (INT / INT); a self-synergy is unique in the catalog and adds INT score + INT modifier to the same check. Retaining INT/EMP pending a ruling."
    }
  ],
  // REVIEW (F10 - affects subtype skill picks): the catalog half is now closed --
  // "Occult Lore" and "Survival" both exist above as of the CRB v4 pass. What
  // remains is naming: archetypes.professional still says "Occult" (catalog:
  // "Occult Lore") and "Handgun" (catalog: "Handguns"), and the app matches
  // focused skills by NAME, not id. See SCHEMA.md section 5.
  "skillsFlags": {
    "flagged": true,
    "flagNote": "F10: partially resolved by the CRB v4 Skills pass - 'Occult Lore' and 'Survival' now exist in the catalog and every skill carries a flavorLine. Remaining: archetypes.professional names 'Occult' (catalog 'Occult Lore') and 'Handgun' (catalog 'Handguns'); focused-skill matching is by name, so these must be reconciled."
  },
  /* ADVANTAGES -- purchasable traits. `cost` is CP PER RANK (Decision 16: an
     Archery Master at rank 2 = 12 CP), `maxRank` caps ranks, `universal: true`
     marks traits any archetype may take. Multi-rank scaling lives in the prose
     `description`. Supernatural archetypes with `canPurchaseAdvantages:false`
     cannot buy any of these (Decision 12). Professional "natural" advantages are
     stored on the character as normal entries with notes:"natural" at 0 CP
     (Decision 17) -- they are NOT a separate list here. `id` is referenced by
     milestone/advantage prerequisites, so do not rename existing ids.
     REVIEW (F5 - adv/disadv audit): four entries carry "flagged":true from the
     audit -- Cyber-Prophetical (SAN/TOL), Field Medic (skill-name), plus Poverty
     and Combat Paralysis on the disadvantage side. Confirm each with D. */
  "advantages": [
    {
      "id": "ambidextrous",
      "name": "Ambidextrous",
      "cost": 1,
      "maxRank": 1,
      "description": "Retain accuracy bonuses when making aimed shots using your off hand."
    },
    {
      "id": "animal-ken",
      "name": "Animal Ken",
      "cost": 2,
      "maxRank": 1,
      "description": "Animals have a natural kinship with you, and aren't likely to feel threatened or attack you. MAG Essence Checks to calm, befriend, or interact with an animal have a Target Number (TN) of 6."
    },
    {
      "id": "archery-master",
      "name": "Archery Master",
      "cost": 6,
      "maxRank": 4,
      "description": "Gain 1 extra attack per round when using bows. Each rank grants an additional 1 attack per round. This doesn't apply to crossbows."
    },
    {
      "id": "aura-sight",
      "name": "Aura Sight",
      "cost": 10,
      "maxRank": 1,
      "description": "You gain the ability to see the aura of living beings within 30 feet of you. Aura Sight allows you to perceive these energy fields through solid objects and walls. The aura can indicate power level, mood, and even mental or physical health overall. You're allowed to take 8 on Intuition checks if you can perceive the aura of your target."
    },
    {
      "id": "backfooted",
      "name": "Backfooted",
      "cost": 8,
      "maxRank": 1,
      "description": "Being on your backfoot is comfortable. When facing attackers who attempt to disable you using a stunt maneuver (trip, throw, grapple, disarm) roll a Martial Arts check difficulty 18. If you win the opposed check then the maneuver attempted is completely negated. If your check explodes you're allowed a single counter attack before the turn ends."
    },
    {
      "id": "bullseye",
      "name": "Bullseye",
      "cost": 4,
      "maxRank": 3,
      "description": "Aimed shots apply +4 bonus damage on a successful hit. This applies to guns and ranged weaponry only. Each Rank after the first gains an additional +2 bonus to damage."
    },
    {
      "id": "charismatic",
      "name": "Charismatic",
      "cost": 3,
      "maxRank": 3,
      "description": "You're skilled in dealing with social situations. Each Rank in Charismatic converts a result of 1 on the die to a 2 when making MAG Essence Checks."
    },
    {
      "id": "common-sense",
      "name": "Common Sense",
      "cost": 4,
      "maxRank": 4,
      "description": "You have a natural aptitude for seeing what others tend to miss. Choose one of the following skills: Investigation, Awareness, Basic Tech, or Intuition. You can choose to take 6 instead of rolling on the selected skill. Each Rank in this Advantage allows you choose a different skill you don't already have selected.",
      "universal": true
    },
    {
      "id": "combat-cunning",
      "name": "Combat Cunning",
      "cost": 4,
      "maxRank": 1,
      "description": "You're particularly gifted with fighting. When performing a stunt during combat, rolling a natural 9 or a 10 automatically succeeds but the roll can no longer explode. If the stunt was opposed and the opponent's roll explodes the stunt will have to beat the enemies roll as normal.",
      "universal": true
    },
    {
      "id": "contacts-major",
      "name": "Contacts (Major)",
      "cost": 3,
      "maxRank": 4,
      "description": "A Major Contact is someone who has a lot of influence, resources, or high level access to something in the game world that can be used to greatly help you out when you're in a pickle. Each Rank in this Advantage increases that overall magnitude of the contact's power to help. Major Contact's are usually powerful or tied to powerful people in the game world. They risk their reputation's or possibly worse by helping you with illicit activity which means they're not always available. GM's discretion.\n\nEXAMPLES: son to a Hub City senator that knows how to pull his weight and can get information on people by special request, a sorcerer in the Daedalus Belt who's well versed in ancient texts and has their own private library regarding arcane topics, or a high corporate mogul who's loaded to the gills and can get you discrete access to weapons and transportation from time to time.",
      "universal": true
    },
    {
      "id": "contacts-minor",
      "name": "Contacts (Minor)",
      "cost": 1,
      "maxRank": 4,
      "description": "A minor contact is someone who has some influence, resources, or access to something in game that can be used to help you when you need a little boost. Each Rank in in this Advantage will grant 1 minor contact who can offer a small amount of aid when called upon. Minor Contacts can be called upon more often in game but have to work a lot harder to get what's being asked.\n\nEXAMPLES: low grade hacker who can help find data about things hidden on the LINK that most average citizens can't locate, lowtown fence with access to some decent gear but nothing that would cost more than 5K credits to acquire, or a local scholar with a better than average knowledge of things occult and the supernatural and has a few worn rare texts to pull from.",
      "universal": true
    },
    {
      "id": "cyber-prophetical",
      "name": "Cyber-Prophetical",
      "cost": 10,
      "maxRank": 1,
      "description": "Suffer no Sanity loss when you acquire cybernetics.",
      "flagged": true,
      "flagNote": "Open question for D: SAN vs TOL interaction (pending Biomech rewrite)."
    },
    {
      "id": "danger-sense",
      "name": "Danger Sense",
      "cost": 3,
      "maxRank": 5,
      "description": "You're able to sense when something threatens you.\n\n- Rank 1/2/3 = sense danger at 5/50/500 feet.\n\n- Rank 4 identifies the main visible threat.\n\n- Rank 5 identifies the main threat, whether seen or unseen."
    },
    {
      "id": "divine-intervention",
      "name": "Divine Intervention",
      "cost": 8,
      "maxRank": 1,
      "description": "The gods favor you. Or in this case, the game will bend to your cry for help but only once. This is the one and only ex-machina in Shadows. Once Divine Intervention has been called into effect it can't be called in again for the lifetime of the character who used it. This intervention can heal the character to full health, cure toxins, magical illness, or dispel a horrifying curse in whatever way the GM sees fit or it can automatically succeed a Death Save when the character is dying. This will appear to be a miracle most likely and defy explanation."
    },
    {
      "id": "dream-walker",
      "name": "Dream Walker",
      "cost": 12,
      "maxRank": 1,
      "description": "You have the ability to walk into other peoples dreams when you sleep. Roll a contested WILL Essence Check to enter the dream of another sleeping person. If you're successful you enter their Dreamscape. You need to be able to see that individual or have a reference like a photo or video feed to assist you. If you fail your WILL Essence check you can't attempt to enter that person's dream again until they enter a new sleep cycle. If the target of your dream walking becomes aware you are an intruder they can push you immediately and this will prevent future attempts to enter their dreams in the future."
    },
    {
      "id": "educated",
      "name": "Educated",
      "cost": 5,
      "maxRank": 5,
      "description": "Gain 10 additional Skill Points. Gain 10 more skills points for each Rank in Educated.",
      "universal": true
    },
    {
      "id": "eidetic-memory",
      "name": "Eidetic Memory",
      "cost": 10,
      "maxRank": 1,
      "description": "INT Essence checks used for memory recall are automatically successful, no roll is required. The memory recall is also unerring. However, there are extenuating circumstance like being incapacitated, suffering a head injury, or being under the influence of drugs. When you're compromised in these ways, Eidetic Memory doesn't apply."
    },
    {
      "id": "favored-skill",
      "name": "Favored Skill",
      "cost": 5,
      "maxRank": 5,
      "description": "Choose a Skill each time you purchase Favored Skill as an Advantage. Once per encounter, while rolling on a selected Favored Skill, if you roll a 1 you can automatically re-roll that check taking the second result. This re-roll can only occur once and can't be altered except through normal means like spending LUCK. Favored Skill only applies to Basic Skill Checks."
    },
    {
      "id": "favors",
      "name": "Favors",
      "cost": 6,
      "maxRank": 3,
      "description": "Gain 1 favor from someone you have helped in the past. Each rank grants an additional favor, and using a favor reduces rank by 1. Favors can be spent and repurchased later, with appropriate cost each time.",
      "universal": true
    },
    {
      "id": "field-medic",
      "name": "Field Medic",
      "cost": 5,
      "maxRank": 1,
      "description": "Add a 1d4 Kicker Die whenever using the Medicine Skill. If there is already a Kicker Die applied to that skill from another Advantage or Archetype ability the die type is increased by 1. I.e. if the Kicker Die was already 1d4 it would now be 1d6 instead when rolling on this skill.",
      "flagged": true,
      "flagNote": "Skill name standardization pending (Medical vs First Aid references)."
    },
    {
      "id": "followers-minion",
      "name": "Followers/Minion",
      "cost": 5,
      "maxRank": 3,
      "description": "Gain 1 follower or companion who can assist your character. Each rank grants an additional follower or companion. Max 3 ranks."
    },
    {
      "id": "ghost-step",
      "name": "Ghost Step",
      "cost": 6,
      "maxRank": 1,
      "description": "When you don't want to be seen, you're not. Gain a +3 synergy bonus to Stealth checks."
    },
    {
      "id": "ghost-tag-s",
      "name": "Ghost TAG(s)",
      "cost": 8,
      "maxRank": 1,
      "description": "Your TAG is a complex high qualilty counterfeit. When scanned it will provide the false identity you've constructed and tie this identity to finances, contact info, and any background fabricated to protect your real information. Those who want to identify this as a fake must make an Investigation or Electronic Security Check difficulty 30 or greater to learn the truth. Using corporate resources like artificial intelligence lowers the difficulty to a 27. A successful Investigation check only points out that the TAG is a fake, but this won't expose the the holder's true identity.",
      "universal": true
    },
    {
      "id": "gun-master",
      "name": "Gun Master",
      "cost": 6,
      "maxRank": 4,
      "description": "Gain 1 attack per round when using firearms. Each rank grants an additional 1 attack per round. Max 4 ranks."
    },
    {
      "id": "hard-to-kill",
      "name": "Hard to Kill",
      "cost": 4,
      "maxRank": 4,
      "description": "Gain +1 HP to all Health Level's per Rank of this Advantage. Max 4 ranks.",
      "universal": true
    },
    {
      "id": "hyper-vigilance",
      "name": "Hyper Vigilance",
      "cost": 6,
      "maxRank": 1,
      "description": "You've seen enough combat that you have an intuitive sense of it. Gain a Kicker Die of 1d4 whenever using Combat Sense. If you already have a Kicker Die applied from another Advantage or Archetype ability then the die type goes up by 1. I.e. if the Kicker Die was already 1d4 it would now be 1d6 instead when rolling on this skill."
    },
    {
      "id": "immunity",
      "name": "Immunity",
      "cost": 10,
      "maxRank": 1,
      "description": "You are immune to something that is otherwise lethal. GM approval needed."
    },
    {
      "id": "iron-will",
      "name": "Iron Will",
      "cost": 4,
      "maxRank": 1,
      "description": "WILL Essence Checks have a Target Number (TN) of 7."
    },
    {
      "id": "junkyard-genius",
      "name": "Junkyard Genius",
      "cost": 5,
      "maxRank": 1,
      "description": "With your sense of how technology works you can apply it in ways that most people don't. Once per encounter, you can improvise a device, tool, or gadget using the materials and technology around you. This device/tool/gadget offers a +3 synergy bonus to TECH related skill checks as long as the device is operational. This Advantage will not apply if there is no technology or machinery in reach to begin with. This also requires that you have access to basic tools if the gadget is complex enough. By the end of the encounter the gadget will fall inert but it can be properly reconstructed later on through gameplay if so desired."
    },
    {
      "id": "last-stand",
      "name": "Last Stand",
      "cost": 4,
      "maxRank": 1,
      "description": "When your health drops to 0, gain a number of attacks equal to your BOD score. Afterwards, you fall unconscious and need to roll to save against dying per normal."
    },
    {
      "id": "lightning-calculator",
      "name": "Lightning Calculator",
      "cost": 1,
      "maxRank": 1,
      "description": "You're able to quickly resolve complex mathematical equations without having to use technology or writing it down. When applicable, you can take 6 on Programming, Basic Tech, Advanced Tech skills instead of rolling. If you're helping someone using any TECH related skill they gain a +1 synergy bonus to succeed while in your presence. This Advantage can't be used while you're in combat.",
      "universal": true
    },
    {
      "id": "long-lived",
      "name": "Long-Lived",
      "cost": 5,
      "maxRank": 3,
      "description": "You have an exceptionally long life span, and may be older than you seem. You gain the financial and social benefits that come with age. Rank 1 = 140 years, Rank 2 = 220 years, Rank 3 = 300 years"
    },
    {
      "id": "lucky",
      "name": "Lucky",
      "cost": 3,
      "maxRank": 1,
      "description": "Luck point costs are reduced.\n\n- Boost now costs 1 point (down from 2)\n\n- Explode now costs 2 points (down from 3)",
      "universal": true
    },
    {
      "id": "machindo",
      "name": "Machindo",
      "cost": 7,
      "maxRank": 1,
      "description": "Machines and technology just seem to work around you even when it doesn't for someone else. You instinctually understand what's happening and can utilize the tech that you control with ease. You're allowed to take 6 on any Basic Tech, Engineering, Interface, or Robotics skill checks that deal with computers, vehicles, or technology. Whenever making an INT or TECH based Essence check the Target Number (TN) is 7."
    },
    {
      "id": "magic-bane",
      "name": "Magic Bane",
      "cost": 10,
      "maxRank": 1,
      "description": "Magical effects are only half as potent on you. This impacts damage and healing."
    },
    {
      "id": "medium",
      "name": "Medium",
      "cost": 5,
      "maxRank": 1,
      "description": "You are sensitive to the world beyond the veil. You can interact with spirits of the dead and beings from beyond."
    },
    {
      "id": "melee-master",
      "name": "Melee Master",
      "cost": 5,
      "maxRank": 4,
      "description": "Gain 1 attack per round when making melee attacks. Each rank grants an additional 1 attack per round. Max 4 ranks."
    },
    {
      "id": "night-vision",
      "name": "Night Vision",
      "cost": 2,
      "maxRank": 1,
      "description": "No penalty for visual Awareness checks made in low or no light conditions."
    },
    {
      "id": "nine-lives",
      "name": "Nine Lives",
      "cost": 15,
      "maxRank": 1,
      "description": "When required to roll a Death Save you are allowed to roll up to 9 times to save against dying. Each time a Death Save is rolled it it counts against the pool available rolls. This pool of Death Saves can't be replenished. If all extra Death Saves have been rolled the next Death Save check is treated as normal. Unless you've utterly failed all saves and are currently deceased."
    },
    {
      "id": "pain-tolerance",
      "name": "Pain Tolerance",
      "cost": 6,
      "maxRank": 3,
      "description": "Ignore 1 level of Pain per rank. Each rank grants an additional 1 bonus. Max 3 ranks."
    },
    {
      "id": "quick-draw",
      "name": "Quick Draw",
      "cost": 8,
      "maxRank": 1,
      "description": "Draw and use a weapon immediately as a free action. This allows aimed shots with their full Accuracy bonus as well.",
      "universal": true
    },
    {
      "id": "rapid-healing",
      "name": "Rapid Healing",
      "cost": 5,
      "maxRank": 3,
      "description": "While out of combat your body heals much more quickly. Each Rank in Rapid Healing applies a multiplier to the amount of HP healed over time.\n\n- Ranks 1/2/3 apply a multiplier of x2/x3/x4"
    },
    {
      "id": "refined-skill",
      "name": "Refined Skill",
      "cost": 8,
      "maxRank": 5,
      "description": "This demonstrates a powerful grasp over a skill. Each time you purchase Refined Skill it applies to a different Skill. Skills with this Advantage explode on a natural 9 or a 10. Exploding is ignored if the skill is used with the Combat Cunning Advantage to perform a stunt."
    },
    {
      "id": "reputation",
      "name": "Reputation",
      "cost": 4,
      "maxRank": 4,
      "description": "You are either feared or beloved by those who know you. This will be due to some event in your past or work you do that puts in a position of influence. Each Rank in Reputation will expand on how far reaching that influence is. People that know who you are will likely treat you with greater respect, honor, and excitement that normal. Some of the benefits being that people may pay for your drinks, offer discounts, trust you more completely, or vouch for you when they're complete strangers.\n\n- Rank 1: You're well know to a small group of people or neighborhood granting you a quiet respect whenever you're in that area.\n\n- Rank 2: On the LINK you have come to be known in small ways so even when you're outside your local area people sometimes recognize you.\n\n- Rank 3: At least an entire sector is aware of who you are and when you're on the streets intereacting with people they will often approach or engage you.\n\n- Rank 4: Your feats are legendary, whole territories have heard of you and you can't go anywhere without people being awe struck in some way by being in your presence.",
      "universal": true
    },
    {
      "id": "riposte",
      "name": "Riposte",
      "cost": 4,
      "maxRank": 1,
      "description": "When using a melee weapon, whenever you successfully parry a strike you may apply the weapons damage (no BOD bonus) to the attacker. This is considered a passive counter attack and counts a stunt for that turn if the damage is applied in this way."
    },
    {
      "id": "scrapper",
      "name": "Scrapper",
      "cost": 10,
      "maxRank": 1,
      "description": "Hand to hand damage and blunt melee weapon damage is halved."
    },
    {
      "id": "sense-of-direction",
      "name": "Sense of Direction",
      "cost": 2,
      "maxRank": 1,
      "description": "You can discern all cardinal directions even while blindfolded or underground. You can take 6 on Survival Checks whenever using it to navigate within your surroundings.",
      "universal": true
    },
    {
      "id": "snatch",
      "name": "Snatch",
      "cost": 8,
      "maxRank": 1,
      "description": "On a successful Parry you can snatch the projectile launched at you right out of the air. You have to be able to perceive the object in order to grab it."
    },
    {
      "id": "spirit-guide",
      "name": "Spirit Guide",
      "cost": 7,
      "maxRank": 3,
      "description": "You're given a guide from beyond the veil. They will do what they can to help you or move you onto the right course. Spirit Guide's can appear as angel's, disfigured spirits, fey, or even dark shadows on the wall. Whatever their form they assist you in your endeavors in strange ways. Make an EMP Essence Check with a Threshold 2 to call upon the aid of your guide. If successful the guide can aid you by adding a Kicker Die of 1d4 to your next skill check, reveal a small secret that wouldn't be known to the character (GM's discretion), or reduce the difficulty of an unopposed check by 5. This can only be done once for each Rank in Spirit Guide per game session."
    },
    {
      "id": "stunt-rider",
      "name": "Stunt Rider",
      "cost": 7,
      "maxRank": 1,
      "description": "Retain accuracy bonus with guns or ranged weapons while making aimed shots from a moving vehicle. Stunts performed using this advantage work as normal. If you have the Bullseye Advantage, the damage bonus still applies if the attack successfully hits the target."
    },
    {
      "id": "thick-skin",
      "name": "Thick Skin",
      "cost": 3,
      "maxRank": 3,
      "description": "Gain +1 Natural amor per rank of Thick Skin. Natural armor is unaffected by Armor Piercing effects."
    },
    {
      "id": "thick-skull",
      "name": "Thick Skull",
      "cost": 5,
      "maxRank": 1,
      "description": "Ignore bonus damage from normal attacks hitting the head. if the attacker's roll exploded and deals damage this Advantage can't prevent that bonus damage."
    },
    {
      "id": "time-sense",
      "name": "Time Sense",
      "cost": 1,
      "maxRank": 1,
      "description": "You have perfect timing and you always know the actual time instinctually. This is true even if you're underground, unconscious, or taken to other planes of existence. You can take 8 on any check used that is focused on time, or timing once per game sessio"
    },
    {
      "id": "true-faith",
      "name": "True Faith",
      "cost": 15,
      "maxRank": 1,
      "description": "Through sheer faith you activate an aura that repels supernatural attacks, magic, and psychic assaults for 1 minute (12 rounds).\n\n- Within 10 feet of you, supernatural beings apply -3 Pain Penalty on all their checks even if they're immune to pain effects.\n\n- Essence Checks to defend against supernatural abilities/powers has a base Target Number of 6.\n\n- Magic and psychic abilities used against you have an 85% chance of failure.\n\n- True Faith can only be activated once per encounter."
    },
    {
      "id": "unshakeable",
      "name": "Unshakeable",
      "cost": 4,
      "maxRank": 1,
      "description": "Unshakeable negates the synergy bonus attackers gain from having Suprise when attacking you specifically."
    },
    {
      "id": "untouchable",
      "name": "Untouchable",
      "cost": 4,
      "maxRank": 3,
      "description": "During a combat encounter, when making a Dodge roll you may add a synergy bonus equal to your Acrobatics Rank to the roll. This negates a botch if the check results in a 1. You can use this Advantage a number of times per combat encounter equal to the number of Ranks in Untoouchable."
    },
    {
      "id": "wealthy",
      "name": "Wealthy",
      "cost": 6,
      "maxRank": 4,
      "description": "Start with additional 10,000 Ç. Gain an additional 2,000 Ç/month for each rank."
    }
  ],
  /* DISADVANTAGES -- the mirror of advantages. `pointsGranted` is CP GRANTED per
     rank (Decision 16), `maxRank` caps ranks. There is NO cap on how much CP a
     character may gain from disadvantages (Decision 4: "do whatever you want, at
     a cost"). Same id-stability rule. Entries flagged from the audit (e.g.
     Combat Paralysis) are part of the F5 review above. */
  "disadvantages": [
    {
      "id": "addiction",
      "name": "Addiction",
      "pointsGranted": 3,
      "maxRank": 3,
      "description": "An addiction is a habitual behavior that is very persistent. The addiction you have can be a minor one that doesn't impede on your day to day life or is readily easy to satisfy. A major addiction is cumbersome and can create havoc in your day to day life if you don't get a fix every day or every 5 to 6 hours.\n\n- Rank 1 Minor Addiction: Equivalent to smoking cigarettes. You suffer the negative effects of this addiction after 2 days without a fix. All WILL and COOL Essence Checks start at Target 9.\n\n- Rank 2 Moderate Addiction: Equivalent to being a hard alcoholic. You suffer the negative effects of this addiction after 18 hours without a fix. You suffer symptoms of withdrawal and are persistently at Pain Level 1 for up to a week or until you get a fix. WILL and COOL Essence Checks are still Target 9.\n\n- Rank 3 Major Addiction: Equivalent to a Heroine addiction. You suffer the negative effects of this addiction after 6 hours without a fix. You begin to feel the symptoms of withdrawal. WILL and COOL Essence Checks are still Target 9 and you are at Pain Level 2 for up to 2 weeks or until you get your next fix."
    },
    {
      "id": "age",
      "name": "Age",
      "pointsGranted": 8,
      "maxRank": 1,
      "description": "You're between the ages of 13 to 15. This carries with it social and physical limitations as a result.\n\n- BODY Max: 5\n\n- REF Max: 6\n\n- MOB Max: 6\n\n- You're either a dependent to someone or have emancipated yourself.\n\n- Access to certain areas is more heavily restricted by law.\n\n- You're more likely to be targeted for exploitation.\n\nPhysical limitations can be partially surpassed through the use of cybernetics but STATS are limited to human maximum as the body is not fully grown."
    },
    {
      "id": "berserker",
      "name": "Berserker",
      "pointsGranted": 7,
      "maxRank": 1,
      "description": "This isn't just a short temper, there's a brewing storm of fury within you at all times. It is a challenge to keep it at bay especially if you're in the presence of violence. Sanity is reduced by 15%. At the start of combat, roll a Sanity check. Failure means you have lost your ability to keep the beast inside and the following effects are active.\n\nYou're consumed by the need to commit violence. You will attack anyone you consider to be a threat or anyone that attempts to stop you from drawing blood while in berserk. This lasts until the end of the encounter and can only happen once per encounter.\n\nYou suffer a -2 penalty to all defensive actions during combat as you aren't concerned about taking injury or avoiding pain.\n\n- Hand to hand attacks with Martial Arts or Melee skills get a +2 to hit and +4 to damage.\n\n- COOL Essence checks are Target 9 while in a state of berserk.\n\n- Breaking berserk requires a COOL Essence Check at Target 9 Threshold 3 and may be rolled on your turn each combat round until the effect is negated or the encounter concludes.\n\n- If you are about to attack an ally, you can make COOL Essence Check Target 9 Threshold 2 to stop yourself. On a successful check you stop the attack but you're still in berserk."
    },
    {
      "id": "blood-lust",
      "name": "Blood Lust",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "The sight of blood is intoxicating. Sanity is reduced by -5%. When you witness blood there is a wave of euphoria that is disorienting and suspends your sense of your surroundings briefly.\n\n- Sanity is reduced by -5%.\n\nRoll a Sanity Check when blood is drawn for the first time during Combat. If the check fails Combat Sense Checks fail automatically on a 1, 2, or 3 due to the distraction. If the check is successful this effect is negated until next encounter."
    },
    {
      "id": "combat-paralysis",
      "name": "Combat Paralysis",
      "pointsGranted": 8,
      "maxRank": 1,
      "description": "Instead of rolling for initiative you start each turn at the end of the initiative order. During the first round of combat you're the last to take action regardless of initiative and can't prepare any actions until the second round.",
      "flagged": true,
      "flagNote": "Mechanical ambiguity flagged in adv/disadv audit."
    },
    {
      "id": "coward",
      "name": "Coward",
      "pointsGranted": 12,
      "maxRank": 1,
      "description": "In violent, dangerous, or threatening circumstances you have to resist the urge to run in a panic. This threat doesn't even need to be one that actively targets you. At the end of your turn you're allowed to reroll a COOL Essence check to stop your terror. This Disadvantage only triggers once per encounter.\n\nMake a COOL Essence Check to keep from running in a panic. Target 10 | Threshold 3.\n\nIf successful you remain calm and can take actions during combat normally for the next 10 rounds. If this check fails you will run in terror in an attempt to escape the situation. You'll be unable to take any combat actions and if you have enemies who can attack you they are allowed a single attack against you. You may use non-combat skills to aid you in your attempted escape while affected by Coward.\n\nCoward can only be activated once every 10 rounds."
    },
    {
      "id": "cursed",
      "name": "Cursed",
      "pointsGranted": 5,
      "maxRank": 3,
      "description": "You've been afflicted with a magical/supernatural curse. This curse affects certain aspects of gameplay. These effects could range from cosmetic to life altering. Talk to your GM about any unique effects the curse may cause. Each Rank in Cursed applies increased penalties as well as making the curse more powerful (less discrete).\n\nEXAMPLE: A cosmetic effect at Rank 1 might be you're horrifically disfigured in some obvious way.\n\nEXAMPLE: A life altering effect at Rank 1 could be that you're constantly at Pain Level 1 whenever you're moving and this pain can't be negated even with drugs or magic.\n\nIt should also be discussed whether or not the curse in question has a way to be removed. If it can, one method could be to use a magical ritual of high complexity to abolish it. Any method of removal will likely be something tied to your background in some way. Fairy tales or similar stories can be a very good inspiration if you need some help with ideas on how to conjure and dispel curses."
    },
    {
      "id": "cyber-allergy",
      "name": "Cyber Allergy",
      "pointsGranted": 12,
      "maxRank": 1,
      "description": "You are not able to install any cybernetics or nano-tech. Your body will reject the augmentations completely causing rampant illness until it is removed. If nanites are used they will fail automatically causing an allergic reaction in the bodies tissues."
    },
    {
      "id": "defect-flaw",
      "name": "Defect/Flaw",
      "pointsGranted": 2,
      "maxRank": 4,
      "description": "You have a specific flaw or defect that makes things more difficult for you. These can be things like being illiterate, suffering from dyslexia, or color blindness. Discuss what the defect is with your GM when you select this Disadvantage. Relevant skills this Disadvantage affects suffer a -2 penalty. Each Rank purchased for this Disadvantage applies to a different defect and skill(s).\n\nPossible defects could be:\n\n- Color Blindness (visual Awareness Checks)\n\n- Hard of hearing (audio Awareness Checks)\n\n- Uncontrollable Stutter (Persuasion Checks)\n\n- Shaky hands (Combat Skills like Handgun or Melee)\n\n- Vertigo (Acrobatics Checks)\n\n- Missing eye or lack of depth perception (combat skills using fire arms or Pilot)"
    },
    {
      "id": "danger-magnet",
      "name": "Danger Magnet",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "There are no shortage of threats in the world. For whatever reason, you happen to attract the worst of the worst. The dangers you stumble across are more threatening in general. And if you're unlucky enough to be working with someone who also has this Disadvantage the number of those heightened threats increases.\n\n- Mortal threats start at 1 level higher than normal.\n\n- If other players in the team also have this Disadvantage the number of total threats is increased by 1 for each player who has Danger Magnet."
    },
    {
      "id": "distractable",
      "name": "Distractable",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "You're easily distracted. With Awareness and Combat Sense checks you automatically fail if you roll a natural 2 or a 3 on the die. Rolling a 1 is sitll a botch."
    },
    {
      "id": "dwarf",
      "name": "Dwarf",
      "pointsGranted": 5,
      "maxRank": 1,
      "description": "You're incredibly short. This affects certain physical attributes and skills.\n\n- BODY Max: 8\n\n- MOB Max: 3\n\n- Height Max: 3'6''\n\n- Easily Hidden: +3 bonus to Stealth, but only whenever your trying to hide."
    },
    {
      "id": "enemies",
      "name": "Enemies",
      "pointsGranted": 1,
      "maxRank": 4,
      "description": "Enemies are anyone that will try to hurt, capture, or kill you at the earliest opportunity. It's possible you don't even know that you've made these enemies as well. They may have valid reasons, they may not. Doesn't matter. Each Rank in Enemies increases the power, number, or influence of the enemies you have.\n\n- Rank 1 is an individual who despises you and they may want to attack you but they're not always able to do this or may not have a lot of resources at their disposal.\n\n- Rank 2 is a small group of people who know you and will likely commit to violence if they encounter you.\n\n- Rank 3 is an enemy at the agency level like the police or a gang and they are active searching for you at all times\n\n- Rank 4 is a powerful authority like a corporation who uses their resources to try to find you and they don't care who they hurt to make sure they're successful."
    },
    {
      "id": "fanatic",
      "name": "Fanatic",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "Fanaticism is a powerful obsession. This describes a psychological rigidity that is nearly impossible to break and is rigorously defended. You decide what the character is fanatical about and discuss it with the GM. It could be a relligious belief, an ideal, or personal code of your own making that shapes the way you live your life. Whoever challenges your fanatical beliefs will likely be met with hostility or possibly even violence and it doesn't matter if this person is a friend or loved one. You're allowed to make a Sanity check to stop yourself from overreacting at any time, but only once per encounter.\n\n- Base Sanity is reduced by 15%, your Sanity score can't be lower than 10% regardless of penalties.\n\n- All EMP Essence checks are Target 9."
    },
    {
      "id": "faultlessly-honest",
      "name": "Faultlessly Honest",
      "pointsGranted": 10,
      "maxRank": 1,
      "description": "Anytime you speak you will do your level best to speak the truth. You can choose not to answer, but that in of it self is an answer. If you attempt to lie, make a MAG Essence check at Target 10 with a Threshold of 3. if you're successful in telling a lie your Sanity score is reduced by 30% for the next 24 hours."
    },
    {
      "id": "giant",
      "name": "Giant",
      "pointsGranted": 5,
      "maxRank": 1,
      "description": "You're much taller and more massive than most. This has certain physiological side effects that can't be avoided.\n\n- BODY Max: 11\n\n- REF Max: 5\n\n- MOB Max: 8\n\n- Minimum Height: 6'10''\n\n- Easy Target: Opponents you face in combat have a +1 Accuracy Bonus against you regardless of what attack they use. This also applies when you're attempting to use cover to prevent incoming damage.\n\n- Heavy Weight: Incoming Melee and Martial Arts damage you receive is reduced by 4 and you gain +2 Automatic Hits for any BODY Essence Checks when grappling smaller opponents."
    },
    {
      "id": "gullible",
      "name": "Gullible",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "If you're in a situation where you need to determine if someone is lying to you or whenever someone is outright dishonest you may not be able to tell. Any time you make a Intuition check to detect lies or deceit that roll fails automatically on a natural 2 or 3. Rolling a 1 is still a botch. This Disadvantage doesn't apply if the lie being told is outrageously preposterous."
    },
    {
      "id": "hallucinations",
      "name": "Hallucinations",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "Hallucinations are sporadic and unpredictable. Sanity checks are reduced by 25% overall and anything that would cause you make a Sanity roll applies hallucinations as a condition you suffer from should you fail that particular check. Remember, base Sanity score can't be reduced to below 10% regardless of penalties. The hallucinations you experience may be pleasant or horrifying, but that isn't the real danger. While hallucinating, Awareness and Combat Sense checks will automatically fail. Worse, being able to tell the difference between friend and foe requires succeeding on a EMP Essence check Target 10 or you can't tell the difference. This state lasts for 1d4 rounds."
    },
    {
      "id": "hemophiliac",
      "name": "Hemophiliac",
      "pointsGranted": 10,
      "maxRank": 1,
      "description": "Any damage that causes bleeding is potentially lethal because your blood doesn't clot. After taking damage you will have to roll a First Aid check to stop any bleeding that occurs with a at Difficulty 18. Success means the hemorrhage is stopped, but you'll skip your next turn in combat from patching yourself together. If it fails, you're hemorrhaging uncontrollably. You can remain active a number of rounds equal to your BODY Score before you pass out from blood loss. You can attempt to stop the hemorrhage at the end each of your turns until you've succeed or become incapacited. Using nano-surgeons, SpeedHeal, or medical tech to resolve the hemorrhage works without having to roll on First Aid."
    },
    {
      "id": "minor-insanity",
      "name": "Minor Insanity",
      "pointsGranted": 1,
      "maxRank": 5,
      "description": "You're dealing with some level of mental illness that can effect the way you see the world and your ability to keep yourself mental stable. Each Rank in Minor Insanity reduces your Sanity by 5%. You also express certain negative traits that could be things like the following: paranoia, bad temper, sadistic, compulsive liar, compulsive behaviors, impulsiveness, etc. Discuss these traits with the GM. You can use IP during gameplay to buy out this Disadvantage."
    },
    {
      "id": "monster-magnet",
      "name": "Monster Magnet",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "The supernatural world can be quite violent. You've seen this and know personally what this is like. In fact, you tend to find yourself on the business end of supernatural dangers more than most. And those are usually more severe as well.\n\n- Whenever dealing with a supernatural threat it starts at 1 level higher than normal.\n\n- If other players also have this Disadvantage the number of those threats increases for each player with Monster Magnet."
    },
    {
      "id": "notorious",
      "name": "Notorious",
      "pointsGranted": 1,
      "maxRank": 3,
      "description": "You have a reputation, and it's not good. The reasons for your tarnished public image are to be discussed with the GM. Whatever the cause, when dealing with strangers who only know you by your reputation will likely make things difficult.\n\n- Persuasion Checks are 1 Difficulty Level higher.\n\n- Relevant MAG Essence Checks have +1 to their Threshold as well.\n\nEach Rank beyond the first adds +1 to Persuasion Check Difficulty stacking with the initial change. Threshold is also increased by +1 per Rank after the first."
    },
    {
      "id": "pact",
      "name": "Pact",
      "pointsGranted": 15,
      "maxRank": 1,
      "description": "This is a nearly unbreakable bond with a supernatural being or a mystical oath you've taken. The details of the pact and who it was made with should be discussed with your GM if you're selecting this Disadvantage at character creation. It should be noted that the character was either tricked or coerced to take on this pact. It was a trap that sprung on you. It means that the character has to go against their own nature in some way as part of the deal. Conditions for being released from your oath should be determined as part of your discussion with the GM. When the conditions for release are met you may use IP remove this Disadvantage. If you choose to go against your pact it has severe consequences. The penalties listed are removed immediately once you choose to follow your pact again.\n\n- Lose the ability to use LUCK.\n\n- All Essence checks have a +1 to Threshold."
    },
    {
      "id": "pain-sensitive",
      "name": "Pain Sensitive",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "You're sensitive to pain. Specifically when taking damage in combat you're going to feel it more intensely. When calculating your Pain Level, it is always 1 Level higher than normal."
    },
    {
      "id": "passive",
      "name": "Passive",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "You will fight only if forced into it. At the start of combat, during initiative, make an EMP Essence check Target 9. Threshold is 2. On a failed check you will refuse to fight during combat. You're allowed to roll this check again at the end of each of your turns per round."
    },
    {
      "id": "poverty",
      "name": "Poverty",
      "pointsGranted": 2,
      "maxRank": 1,
      "description": "You have to constantly replenish your cash reserves. While you can survive off your universal income everything else is nearly out of reach.\n\n- You have at least Ç75,000 debt\n\n- The purchase of weapons, armor, and vehicles is prohibited until you have cleared the debt you owe.\n\n- Half of the Credits you receive from the work you do are automatically withdrawn and counted against your debt.\n\n**Each Rank in Poverty raises your outstanding debts by Ç20,000 each.**",
      "flagged": true,
      "flagNote": "Max Rank discrepancy flagged in adv/disadv audit."
    },
    {
      "id": "social-stigma",
      "name": "Social Stigma",
      "pointsGranted": 1,
      "maxRank": 1,
      "description": "People perceive you in a negative light. It could be the way you look, the way you dress, or perhaps the way you talk. Persuasion checks fail automatically on a natural 2 or 3. 1's still count as a botch."
    },
    {
      "id": "terminal-disease",
      "name": "Terminal Disease",
      "pointsGranted": 7,
      "maxRank": 1,
      "description": "You suffer from a terrible disease. You're always in pain and it looks like you'll die early. This could be as early as six months from the start of gameplay. You're always at Pain Level 1 and this stacks with increases in Pain Level from loss of Health Levels. Physically oriented Essence checks (BODY, REF, MOB) are Target 9."
    },
    {
      "id": "unlucky",
      "name": "Unlucky",
      "pointsGranted": 5,
      "maxRank": 1,
      "description": "Luck point costs are increased.\n\n- Boosts cost 3 points\n\n- Explode costs 4 points"
    },
    {
      "id": "weak-willed",
      "name": "Weak Willed",
      "pointsGranted": 6,
      "maxRank": 1,
      "description": "WILL Essence checks are Target 9."
    }
  ],
  /* ARCHETYPES -- 5 entries, all sharing one generic six-block structure
     (Decision 15) so the app never hardcodes a per-archetype page:
       1. identity:      id, name, status, primaryStats, summary/gameplayStyle/lore
       2. campaignPowerScaling: per-power-level grants (keyed by power level id;
          `*Roll` strings are physical dice the player enters)
       3. baselineTraits: always-on features (machine-readable `effects` where
          possible, prose otherwise)
       4. specialization: the required pick -- `label` varies per archetype
          ("Aberration" / "Subtype" / "Origin" / "Bloodline"); `options` carry
          their own grants, required stats, focused skills, tweaks, powers
       5. coreMechanic:  the signature system + `panels` (see below)
       6. powers + vulnerabilities, then growth (minorMilestones + archetype
          majorMilestones)
     `status`: "final" | "draft" | "tbd" -- the app shows a badge and treats
     tbd/draft content as reference text, never blocking on un-modeled rules.
     `canPurchaseAdvantages:false` (supernatural) is enforced by the wizard.

     PANELS are how archetypes stay generic: `coreMechanic.panels` DECLARES the
     extra sheet UI an archetype needs from a small vocabulary -- "rankedList"
     (e.g. Disciplines, cappedBy a power-rank field), "table" (e.g. Grimoire,
     free-entry columns), "tracker" (e.g. Exhaustion, max = a derived id), "text".
     The app renders whatever is declared. To give a new archetype custom sheet
     panels you describe them here as data; no app change (this is how the Biomech
     rewrite will add NCI tiers / augment slots). Effects that can't be modeled
     yet stay prose and display as reference.

     REVIEW (F7 - SFR per archetype): Werewolf SFR is defined (WILL*3+N w/ RoU,
       in its scaling table); Vampire Blood Pool is still TBD.
     REVIEW (F13 - Vampire): vampire `canPurchaseAdvantages` is ASSUMED from the
       Werewolf supernatural baseline -- confirm with D. (see vampire entry).
     See SCHEMA.md section 5 for both. */
  "archetypes": [
    {
      "id": "arcanist",
      "name": "Arcanist",
      "status": "draft",
      "primaryStats": [
        "INT",
        "COOL",
        "EMP"
      ],
      "summary": "Wizards, sorcerers, mages - many names exist for those who unlocked the ability to manipulate Aether and wield its power like a weapon. What they gain in power, they trade for risk of ripping themselves, or the world, apart. The Aether doesn't care how curious you are. It only cares whether you can hold on.",
      "gameplayStyle": "Arcanists reshape reality through study and will. You solve problems by bending the rules of the world - rewriting physics, enchanting tools, or unraveling what others do not understand. Your power is immense, but every spell carries risk. Control is everything.",
      "lore": "An Arcanist is what happens when someone looks at the fabric of reality, understands that it can be pulled apart and rewoven, and decides that knowing how is worth whatever it costs them. They have traded normalcy for comprehension. Their spells are not tricks. They are statements made directly to the universe, and the universe listens. The Aether leaves marks. Arcanists wear them.",
      "supernatural": false,
      "canPurchaseAdvantages": true,
      "campaignPowerScaling": {
        "columns": [
          "Focus Stat Bonus Points",
          "TOL Bonus",
          "Aberrations",
          "Evocation Starting Rank",
          "Common Spells"
        ],
        "notes": "Focus Stats are INT, COOL, and EMP. Bonus stat points can push a base stat beyond 10.",
        "byPowerLevel": {
          "street": {
            "focusStatBonusRoll": "1d4",
            "tolBonus": 0,
            "aberrations": 1,
            "evocationStartingRank": 1,
            "commonSpells": "TOL + 1d4"
          },
          "heroic": {
            "focusStatBonusRoll": "2d4",
            "tolBonus": 1,
            "aberrations": 2,
            "evocationStartingRank": 2,
            "commonSpells": "TOL + 2d4"
          },
          "shadows": {
            "focusStatBonusRoll": "3d4",
            "tolBonus": 2,
            "aberrations": 3,
            "evocationStartingRank": 3,
            "commonSpells": "TOL + 3d4"
          },
          "wcd": {
            "focusStatBonusRoll": "4d4",
            "tolBonus": 5,
            "aberrations": 4,
            "evocationStartingRank": 4,
            "commonSpells": "TOL + 4d4"
          }
        }
      },
      "baselineTraits": [
        {
          "id": "aetheric-attunement",
          "name": "Aetheric Attunement",
          "description": "Through study and exposure, your body has become sensitive to Aether. You perceive active magical effects, lingering enchantments, and unstable distortions as shifts in light, pressure, or atmosphere.",
          "benefit": "You automatically recognize the presence of active magic within range of your Awareness checks and gain a +5 modifier when attempting to identify or detect magical effects within meters equal to your WILL."
        },
        {
          "id": "arcane-conduit",
          "name": "Arcane Conduit",
          "description": "Your body acts as a living channel for Aether. You do not require SFR to cast spells; instead, your magic is fueled through personal containment and risk (see Casting Magic). Without this trait, Aether cannot be channeled safely.",
          "benefit": null
        }
      ],
      "specialization": {
        "label": "Aberration",
        "required": true,
        "countBy": "campaignPowerScaling.aberrations",
        "intro": "Through extended exposure to Aether over time, cosmic energies have subtly altered your body. These are known as Aberrations.",
        "options": [
          {
            "id": "arcane-fortitude",
            "name": "Arcane Fortitude",
            "description": "You're more tolerant of the cosmic forces that you manipulate on a daily basis.",
            "benefit": "Gain +2 to TOL."
          },
          {
            "id": "unshakable-mind",
            "name": "Unshakable Mind",
            "description": "The Arcanist can peer into the depths of alternate realms, see through the veil, or encounter the terrifying realities of the world itself.",
            "benefit": "Gain +10% bonus to any Sanity Breaker Check."
          },
          {
            "id": "thaumaturgical-sight",
            "name": "Thaumaturgical Sight",
            "description": "With this Aberration you can see the threading and weave a spell creates, even if you have no other sight.",
            "benefit": "Gain +2 for any Occult Check; what you see is only visible to you."
          },
          {
            "id": "aethereal-link",
            "name": "Aethereal Link",
            "description": "You're linked to the cosmos in a way that is utterly different from most. When animals are close you are able to understand them at a telepathic level.",
            "benefit": "Hear the thoughts of creatures around you within meters equal to your WILL. With a successful WILL Essence Check (TN 9 TH 1), communicate telepathically with a single creature in range while you maintain concentration."
          },
          {
            "id": "resonant-whispers",
            "name": "Resonant Whispers",
            "description": "Magic is reactive to some people. When they touch things, it allows them to hear the whispers of magic within.",
            "benefit": "Gain +3 to any Occult check to discern the properties of any charm, talisman, or artifact. Requires physical contact for at least one minute; the effect has audible and visual side effects everyone can see/hear."
          },
          {
            "id": "aetheric-magnetism",
            "name": "Aetheric Magnetism",
            "description": "Small things always seem to be easy to acquire or happen to be available when you need them.",
            "benefit": "Rolling a Breaker Check and getting under 35% grants a small boon or lets you find something that gives +1 to all General and Utility Skill Checks for the rest of the Encounter."
          }
        ]
      },
      "coreMechanic": {
        "name": "Magic",
        "description": "Channeling the flow of Aether through your body. All magic is done through Evocation Essence Checks: your Evocation Rank determines the number of dice rolled, aiming to Hit the Target Number (TN) enough times to meet or beat the Threshold (TH). For every Dud rolled, you gain a point of Exhaustion. If a Dud pushes Exhaustion past your Tolerance (TOL), you cause a Rupture and cannot cast until you have recovered.",
        "disciplines": {
          "maxRankBy": "powerLevel.maxPowerRank",
          "creationCostNote": "At character creation, raising a Discipline by 1 point costs 6 Character Points (REF source; pre-rename 'Freebie points').",
          "list": [
            {
              "id": "evocation",
              "name": "Evocation",
              "description": "The fastest, most dangerous form of spellcraft, weaving Aether into glyphs on the fly. Volatile, powerful, and often unpredictable."
            },
            {
              "id": "enchantment",
              "name": "Enchantment",
              "description": "A measured approach: spells prepared in advance, woven into objects like talismans, weapons, or protective garments, ready to be activated when needed."
            },
            {
              "id": "alchemy",
              "name": "Alchemy",
              "description": "The ancient art of permanently transforming objects into magical artifacts. Slow and methodical, requiring rare materials and days or weeks of careful rituals - with extraordinary rewards."
            }
          ]
        },
        "panels": [
          {
            "id": "disciplines",
            "type": "rankedList",
            "title": "Disciplines",
            "items": [
              "Evocation",
              "Enchantment",
              "Alchemy"
            ],
            "cappedBy": "maxPowerRank"
          },
          {
            "id": "exhaustion",
            "type": "tracker",
            "title": "Exhaustion",
            "max": "TOL"
          },
          {
            "id": "grimoire",
            "type": "table",
            "title": "Grimoire",
            "columns": [
              "Spell Name",
              "Discipline",
              "TN",
              "TH",
              "Effect",
              "Notes"
            ]
          }
        ]
      },
      "powers": [],
      "vulnerabilities": [],
      "growth": {
        "minorMilestones": "shared",
        "majorMilestones": [],
        "flagged": true,
        "flagNote": "Arcanist Powers and Growth & Milestones sections are empty in the WIP. Arcanist Major Milestones exist in REF_CRB (e.g., Aetheric Potency) - extract on request."
      }
    },
    {
      "id": "cyborg",
      "name": "Cyborg",
      "status": "tbd",
      "flagged": true,
      "flagNote": "F6: Full rewrite queued (rename to Biomech; TOL replaces SAN as primary resource pressure; NCI tiers; Set Bonuses; Kicker Dice rules). Content below is WIP narrative only.",
      "primaryStats": [
        "INT",
        "COOL",
        "EMP"
      ],
      "summary": "Some people love technology, others become it. Cyborgs are humans who have gone all in, complete with a Neurocybernetic Interpreter, cyber-limbs, nanobots, and more. Cyborgs pay for their cybernetics with a combination of Credits and humanity.",
      "gameplayStyle": "You redefine yourself piece by piece. Cyborgs adapt by installing the tools they need - social infiltrator, heavy hitter, data ghost, or battlefield support. Your limits are defined by tolerance and humanity, not imagination.",
      "lore": "A Cyborg has looked at the flesh and decided it was a rough draft. What comes next is intentional. This is not modification. This is authorship. Eventually, a normal person becomes a cyborg when upgrading their Neurocybernetic Interpreter (NCI) to beta or higher - the link between flesh and machine with pseudo-AI managing the systems and user intent. Every enhancement is a decision you don't get to walk back.",
      "supernatural": false,
      "canPurchaseAdvantages": true,
      "campaignPowerScaling": {
        "byPowerLevel": {}
      },
      "baselineTraits": [],
      "specialization": {
        "label": "Chrome Loadout",
        "required": true,
        "options": []
      },
      "coreMechanic": {
        "name": "Cybernetics (NCI)",
        "description": "The NCI tracks the toll: Tolerance creeping upward, Humanity shifting beneath you. The NCI alpha/beta distinction marks the threshold between recreational augmentation and true identity change.",
        "panels": [
          {
            "id": "augments",
            "type": "table",
            "title": "Installed Cybernetics",
            "columns": [
              "Augment",
              "Location",
              "TOL Cost",
              "Effect",
              "Notes"
            ]
          },
          {
            "id": "tolerance-load",
            "type": "tracker",
            "title": "Tolerance Load",
            "max": "TOL"
          }
        ]
      },
      "powers": [],
      "vulnerabilities": [],
      "growth": {
        "minorMilestones": "shared",
        "majorMilestones": []
      }
    },
    {
      "id": "professional",
      "name": "Professional",
      "status": "draft",
      "primaryStats": [],
      "primaryStatsNote": "Varies by profession Subtype (see requiredStats per subtype).",
      "summary": "The quintessential human. Focusing on adaptability, Professionals make a living working in NYTE City and have become experts at surviving. They bring skills, techniques and Tweaks to situations that expect a mundane human; Professionals teach them otherwise.",
      "gameplayStyle": "Professionals thrive on preparation and precision. Where others rely on supernatural gifts or tech, you rely on training, foresight, and execution. You excel in skill-driven play, turning planning, equipment, and expertise into decisive advantages.",
      "lore": "No bloodline. No implants rewriting their nervous system. No covenant with forces older than language. Just a person who decided that wasn't going to be enough of a reason to lose. They are not the most powerful thing in any room. They are frequently the most dangerous.",
      "supernatural": false,
      "canPurchaseAdvantages": true,
      "campaignPowerScaling": {
        "columns": [
          "Focused Skill Max Bonus",
          "Natural Advantages"
        ],
        "byPowerLevel": {
          "street": {
            "focusedSkillMaxBonus": 1,
            "naturalAdvantageRanks": 2
          },
          "heroic": {
            "focusedSkillMaxBonus": 2,
            "naturalAdvantageRanks": 3
          },
          "shadows": {
            "focusedSkillMaxBonus": 3,
            "naturalAdvantageRanks": 4
          },
          "wcd": {
            "focusedSkillMaxBonus": 4,
            "naturalAdvantageRanks": 5
          }
        }
      },
      "baselineTraits": [
        {
          "id": "focused-skills",
          "name": "Focused Skills",
          "description": "Every Professional subtype has a set of skills they have focused on that are optimal for their job. Easier to train, and masterable beyond the Campaign Power Level's maximum limits.",
          "effects": [
            "IP cost for Focused Skills: 3 x current rank (standard is 5 x current rank).",
            "Maximum rank of Focused Skills exceeds the Campaign Power Level limit by the Focused Skill Max Bonus."
          ]
        },
        {
          "id": "natural-advantages",
          "name": "Natural Advantages",
          "description": "Para-metaphysical abilities that give Professionals an edge. Select ranks equal to the Campaign Power Level's Natural Advantage Ranks from the listed pool, free of Character Point cost.",
          "pool": [
            {
              "advantageId": "ambidextrous",
              "maxRank": 1
            },
            {
              "advantageId": "danger-sense",
              "maxRank": 5
            },
            {
              "advantageId": "educated",
              "maxRank": 5
            },
            {
              "advantageId": "favored-skill",
              "maxRank": 5
            },
            {
              "advantageId": "iron-will",
              "maxRank": 1
            }
          ]
        }
      ],
      "specialization": {
        "label": "Subtype",
        "required": true,
        "intro": "When selecting the Professional Archetype, you select your profession Subtype. Each Subtype has Required Stats (minimum thresholds) and a unique Tweak - pseudo-supernatural abilities developed through a powerful connection to the craft.",
        "options": [
          {
            "id": "cleaner",
            "name": "Cleaner",
            "description": "Cleaners are killers. No other way to say it. A lucrative vocation, but only for those who can remain unseen and undetected.",
            "requiredStats": {
              "BOD": 6,
              "REF": 8
            },
            "focusedSkills": [
              "Acrobatics",
              "Combat Sense",
              "Security",
              "Stealth",
              "2 Combat Skills (chosen at creation)"
            ],
            "tweak": {
              "name": "Vanish",
              "description": "A mastery over bodily movements combined with patience to effectively disappear altogether. You become a ghost in the flesh.",
              "benefits": [
                "Gain a 1d6 Kicker die for all Stealth Checks.",
                "You may automatically succeed a Stealth Skill Check a number of times per session equal to your REF Bonus."
              ]
            }
          },
          {
            "id": "enforcer",
            "name": "Enforcer",
            "description": "Policeman, thug, bodyguard, or vigilante - you ply your trade dealing with threats in a calculated way, looking for a weakness to exploit. Your teacher was life itself.",
            "requiredStats": {
              "REF": 5,
              "MOB": 7,
              "BOD": 8
            },
            "focusedSkills": [
              "Athletics",
              "Combat Sense",
              "Intimidation",
              "Investigation",
              "Survival"
            ],
            "tweak": {
              "name": "Hard Knock Life",
              "description": "You've been through the worst that life has to offer, developing incredible fortitude in both mind and body.",
              "benefits": [
                "BOD Essence Checks start with 2 Automatic Hits when dealing with death, strength, endurance, injury, or resisting physical conditions (e.g. poison).",
                "Select 2 implants from the cybernetics list for free. The NCI doesn't count against the implants chosen for this Tweak."
              ]
            }
          },
          {
            "id": "fence",
            "name": "Fence",
            "description": "You have a network of people who bring you things you can't get anywhere else - and the people of this world trust you. As part of the underworld economy, you can purchase extremely rare, high quality items.",
            "requiredStats": {
              "INT": 7,
              "MAG": 7
            },
            "focusedSkills": [
              "Awareness",
              "Combat Sense",
              "Streetwise",
              "Basic Tech"
            ],
            "tweak": {
              "name": "Concierge",
              "description": "A foundation that lets you survive on wits and cunning, plus an underground knowledge of the black market.",
              "benefits": [
                "Take 5 on Persuasion checks when negotiating prices with vendors, merchants, and black marketeers.",
                "Add a 1d4 kicker die when appraising the value of gear, contraband, or standard items.",
                "Use a Streetwise Skill Check to determine what you know about a person, item, or situation: at 20+, the GM provides one non-public detail, plus one more per 5 points above 20 (max three details)."
              ]
            }
          },
          {
            "id": "jack-of-all-trades",
            "name": "Jack of All Trades",
            "description": "You've adapted to a way of life that allows you to pick up skills quickly - the quality of being a genius with the capacity for comprehending even complex skills.",
            "requiredStats": {
              "INT": 9,
              "COOL": 7
            },
            "focusedSkills": [],
            "tweak": {
              "name": "Master of None",
              "description": "Real mastery comes from understanding all your options and using what you have available to the best of your ability.",
              "benefits": [
                "Once per encounter, apply a +1d4 kicker die to a number of skills up to your INT bonus. Once assigned, the bonus can't be reassigned for the remainder of that encounter.",
                "All skills are treated as Focused Skills and may be improved at 3 x current rank up to rank 4. At Rank 5 and above, the standard cost of 5 x current rank returns."
              ]
            },
            "note": "Focused Skills: none (all skills are treated as Focused per the Tweak)."
          },
          {
            "id": "mercenary",
            "name": "Mercenary",
            "description": "People who sell their talent for the craft of combat to the highest bidder. An abundance of training and mental conditioning makes them a good commodity.",
            "requiredStats": {
              "BOD": 6,
              "REF": 7
            },
            "focusedSkills": [
              "Athletics",
              "Awareness",
              "Combat Sense",
              "Handgun",
              "1 Additional Combat Skill"
            ],
            "tweak": {
              "name": "Battle Hardened",
              "description": "Combat has been part of your life so long it's nearly your best friend. Pain, disorientation, and serious injury have made you far tougher than the average person.",
              "benefits": [
                "Immunity to one combat condition: Dazed, Knocked Down, Agony, or Sickened.",
                "Gain +3 to your next combat action whenever you are Surprised or Ambushed.",
                "You may add another condition immunity in place of a Major Milestone during gameplay, to a maximum of 3 immunities overall."
              ]
            }
          },
          {
            "id": "slayer",
            "name": "Slayer",
            "description": "Slayers dedicate themselves to killing the supernatural forces of darkness. They learn how they operate, who they feed on, and how to kill them efficiently.",
            "requiredStats": {
              "INT": 7,
              "BOD": 5,
              "EMP": 7
            },
            "focusedSkills": [
              "Athletics",
              "Combat Sense",
              "Intuition",
              "Occult",
              "Stealth",
              "Survival",
              "Tracking"
            ],
            "tweak": {
              "name": "Hunter's Calling",
              "description": "Knowledge and instinct honed against the things that hunt in the dark.",
              "benefits": [
                "When facing a supernatural enemy, gain a +1d6 kicker die to combat checks against those targets. This applies to Occult and Tracking skills as well when hunting your quarry.",
                "Opposed or Extended WILL Essence Checks used to defend against psychic, magical, or supernatural attacks have Automatic Hits equal to your EMP bonus."
              ]
            }
          },
          {
            "id": "true-warrior",
            "name": "True Warrior",
            "description": "A life spent in practice and training. The body isn't just physical, but spiritual: True Warriors draw upon their own life force, Chi, to perform incredible feats.",
            "requiredStats": {
              "BOD": 8,
              "REF": 7
            },
            "focusedSkills": [
              "Acrobatics",
              "Combat Sense",
              "Intuition",
              "Martial Arts",
              "Occult"
            ],
            "tweak": {
              "name": "Power Style",
              "description": "Pseudo-supernatural abilities using the body's energy (Chi). Usable Chi equals your TOL score; each ability has a Chi cost. Activate individually or simultaneously via a WILL Essence Check (TN 8, TH 1 per ability being activated). Cumulative cost of active abilities cannot exceed TOL. Activating or switching abilities requires the check again; on failure, no abilities can be activated until a successful check (once per turn in combat). All abilities are sustained through concentration.",
              "benefits": [
                "Iron Shirt [Chi 2]: Gain Natural Armor equal to BOD Bonus + 1.",
                "Unwavering Focus [Chi 3]: Focused Skills gain a 1d4 kicker die while active.",
                "Fleet of Foot [Chi 3]: Run, Sprint, and Jump are doubled.",
                "Wind Dancing Defense [Chi 4]: Gain a 1d6 kicker die when using Dodge during combat.",
                "Death Touch [Chi 4]: Martial Arts attacks are Armor Piercing when not using melee weapons.",
                "Flying Talons [Chi 5]: Make 3 throwing attacks using thrown weapons matching your Martial Art style, once per turn, following the same rules as a firearm burst."
              ]
            }
          },
          {
            "id": "wheelman",
            "name": "Wheelman",
            "description": "A calling to live on the edge of the world with nothing but skill and adrenaline - and a kinship with machines that can push any vehicle beyond normal limits.",
            "requiredStats": {
              "BOD": 6,
              "REF": 9
            },
            "focusedSkills": [
              "Athletics",
              "Awareness",
              "Basic Tech",
              "Combat Sense",
              "Pilot",
              "Deception"
            ],
            "tweak": {
              "name": "Stunt Driver",
              "description": "How far can the boundaries of physics be pushed? You don't hesitate to find out. (Piloting a mech is considered a vehicle.)",
              "benefits": [
                "While piloting any vehicle you have the Lucky advantage (Boosting costs 1 LUCK, Exploding costs 2 LUCK).",
                "Pilot Skill Checks explode on a natural 9 or 10. When you declare a stunt for the first time on your turn, it doesn't use your stunt action - or you may instead Take 6 on your next Pilot check.",
                "REF Essence Checks related to piloting a vehicle start with 1 automatic Hit."
              ]
            }
          }
        ]
      },
      "coreMechanic": {
        "name": "Tweaks & Focused Skills",
        "description": "A Professional doesn't have a power that defines them. They have a method - and devotion to a method has a way of becoming something else entirely. Something the city might even call a Tweak.",
        "panels": [
          {
            "id": "focused-skills",
            "type": "list",
            "title": "Focused Skills"
          },
          {
            "id": "tweak",
            "type": "text",
            "title": "Tweak"
          }
        ]
      },
      "powers": [],
      "powersNote": "Powers section marked TBD in WIP.",
      "vulnerabilities": [],
      "growth": {
        "minorMilestones": "shared",
        "majorMilestones": "general",
        "cadence": [
          "Every session completed grants 10 Improvement Points (IP).",
          "Every 5 sessions: pick a Minor Milestone.",
          "Every 10 sessions: earn a Major Milestone."
        ]
      }
    },
    // REVIEW (F13): `canPurchaseAdvantages:false` below is ASSUMED from the
    // Werewolf supernatural baseline; confirm with D. (also noted in data field).
    {
      "id": "vampire",
      "name": "Vampire",
      "status": "tbd",
      "flagged": true,
      "flagNote": "WIP contains narrative only - no Campaign Power Scaling, Baseline Traits, Specialization (Bloodline), Core Mechanic, or Powers yet.",
      "primaryStats": [
        "BOD",
        "REF",
        "MOB"
      ],
      "summary": "As old as civilization itself. Vampires have had centuries to accumulate power, influence, and everything that comes with both. Vampires can be part of many different houses, each with their own strengths, resources, allies, and enemies.",
      "gameplayStyle": "Vampires navigate hunger, power, and eternity in equal measure. You walk a different version of NYTE City - one shaped by blood, secrecy, and influence. Your abilities are potent and intoxicating, but indulgence always carries consequences.",
      "lore": "In NYTE City, Vampires thrive in the shadows, concealed by the chaos of urban decay. While they remain hidden from public knowledge, Vampires are not hiding. They are waiting. The Unseen Court, a secretive governing body, ensures their kind stays in the shadows while exerting influence over corporations, criminal syndicates, and political figures. You are undead. You consume blood to survive. Sunlight kills you - and NYTE City, to its credit, never fully sees the sun. Whatever path you choose, feeding is not optional.",
      "supernatural": true,
      "canPurchaseAdvantages": false,
      "canPurchaseAdvantagesNote": "Assumed per the supernatural baseline established in the Werewolf section - confirm.",
      "campaignPowerScaling": {
        "byPowerLevel": {}
      },
      "baselineTraits": [],
      "specialization": {
        "label": "Bloodline",
        "required": true,
        "options": []
      },
      "coreMechanic": {
        "name": "Blood & Hunger",
        "description": "TBD.",
        "panels": [
          {
            "id": "blood-pool",
            "type": "tracker",
            "title": "Blood Pool",
            "max": null
          }
        ]
      },
      "powers": [],
      "vulnerabilities": [],
      "growth": {
        "minorMilestones": "shared",
        "majorMilestones": []
      }
    },
    {
      "id": "werewolf",
      "name": "Werewolf",
      "status": "draft",
      "flagged": true,
      "flagNote": "Trueborn origin is partially complete (powers list trails off: Moonlit Vitality, Ancestral Wisdom, Spirit Pack, Ancestral Dominance are name-only). Other Origins (Unblooded, Forge Fang) referenced in lore but not defined.",
      "primaryStats": [
        "BOD",
        "REF",
        "MOB"
      ],
      "summary": "Lycanthropy is both a curse and a gift: immense strength, savage instinct, and the weight of a tribe and lineage older than the city. Werewolves can shift into their beast form when words stop working and something more permanent is required.",
      "gameplayStyle": "Werewolves live between restraint and release. Bound to a tribe and driven by instinct, you navigate loyalty, territory, and transformation. When the beast emerges, subtlety fades and raw power takes over - but that power always demands something in return.",
      "lore": "For as long as there have been people, there have been wolves in the shadows - protectors not from mankind, but for mankind, against the things that lurk beyond the Veil. They are the knife in the dark, the last line of defense against things that humanity cannot, or should not, know about. The beast is not a separate creature. It is the same person, with different priorities.",
      "supernatural": true,
      "canPurchaseAdvantages": false,
      "campaignPowerScaling": {
        "columns": [
          "Stat Bonus",
          "Starting SFR",
          "Rate of Use (RoU)"
        ],
        "byPowerLevel": {
          "street": {
            "statBonusRoll": "1d4",
            "startingSFR": "WILL*3 + 5",
            "rou": 3
          },
          "heroic": {
            "statBonusRoll": "1d4+1",
            "startingSFR": "WILL*3 + 10",
            "rou": 5
          },
          "shadows": {
            "statBonusRoll": "1d4+2",
            "startingSFR": "WILL*3 + 15",
            "rou": 7
          },
          "wcd": {
            "statBonusRoll": "1d4+3",
            "startingSFR": "WILL*3 + 20",
            "rou": 9
          }
        }
      },
      "baselineTraits": [
        {
          "id": "supernatural",
          "name": "Supernatural",
          "description": "A connection to the spirit grants access to Spiritual Force Rating (SFR) to fuel powers; SFR spent per round is limited by Rate of Use (RoU). Being supernatural grants mighty power, but locks you out of Advantages that normal humans use to level the playing field.",
          "effects": [
            "Gains SFR and RoU per Campaign Power Scaling.",
            "Unable to purchase Advantages."
          ]
        },
        {
          "id": "werewolf-form",
          "name": "Werewolf Form",
          "description": "Transform into a beastly form granting boons while channeling the wolf spirit.",
          "effects": [
            "While transformed: REF +2, MOB +2, BOD +4.",
            "Natural Weapons - Claws: Melee, Damage 8 + BOD. Fangs: Melee, Damage 10 + BOD."
          ]
        },
        {
          "id": "feral-instincts",
          "name": "Feral Instincts",
          "description": "Predator senses, with a predator's limitations.",
          "effects": [
            "+2 to Awareness Skill Checks involving sight, smell, or hearing.",
            "While transformed, cannot make TECH-based Skill Checks."
          ]
        },
        {
          "id": "regeneration",
          "name": "Regeneration",
          "description": "Werewolves regenerate 1 HL of damage per round, unless inflicted with Withering Damage (such as from silver).",
          "effects": [
            "Regenerate 1 HL per round; blocked by Withering Damage."
          ]
        }
      ],
      "specialization": {
        "label": "Origin",
        "required": true,
        "intro": "Every werewolf has an origin - a bloodline, or something you were forced into. Each Origin grants unique powers.",
        "options": [
          {
            "id": "trueborn",
            "name": "Trueborn",
            "description": "Trueborn werewolves have always been lycanthrope: heritage, tradition, and family ties that bind them. Spirits embodying the power, force, and will of the wolf bound themselves to family bloodlines, passing the gift down through generations.",
            "transformation": "Transform at will with a WILL Essence Check (TN 7, TH 2); takes 1 round. A botch prevents attempting transformation for 1d4 rounds. Transform back at will; forced back if knocked unconscious or after losing more than 50% of health as Withering Damage.",
            "starterPower": {
              "name": "Lunar Phase Blessing",
              "description": "An intrinsic connection to the moon grants boons during each phase, active during the corresponding week of the cycle.",
              "phases": [
                {
                  "phase": "New Moon",
                  "boon": "Shroud of Shadows",
                  "effect": "+2 to Stealth and Deception Skill Checks"
                },
                {
                  "phase": "Waxing Moon",
                  "boon": "Hunter's Edge",
                  "effect": "+1 REF and BOD"
                },
                {
                  "phase": "Full Moon",
                  "boon": "Apex Fury",
                  "effect": "For 3 SFR: gain +2 REF, BOD, and MOB until unconscious or reduced to 50% Health"
                },
                {
                  "phase": "Waning Moon",
                  "boon": "Resilient Spirit",
                  "effect": "Natural Armor treated as Warding"
                }
              ]
            },
            "additionalPowers": [
              "Moonlit Vitality (TBD)",
              "Ancestral Wisdom (TBD)",
              "Spirit Pack (TBD)",
              "Ancestral Dominance (TBD)"
            ]
          }
        ]
      },
      "coreMechanic": {
        "name": "Transformation & SFR",
        "description": "The beast is always there - an instinct, a pressure, a part of you with its own opinions about how situations should be resolved.",
        "panels": [
          {
            "id": "sfr",
            "type": "tracker",
            "title": "SFR",
            "max": "startingSFR"
          },
          {
            "id": "form",
            "type": "toggle",
            "title": "Form",
            "options": [
              "Human",
              "Werewolf"
            ]
          }
        ]
      },
      "powers": [],
      "vulnerabilities": [],
      "growth": {
        "minorMilestones": "shared",
        "majorMilestones": []
      }
    }
  ],
  /* MILESTONES -- advancement unlocks driven by Milestone Points (1/session,
     Decision 13). `rules` documents cadence (Minor at 5/15/25..., Major at
     10/20/30...). `minorShared` is the pool everyone draws from (no duplicates
     until all five are taken once, Decision 29). `majorGeneral` is open to all
     archetypes; archetype-specific majors live on each archetype's `growth`.
     `prerequisites` is the machine-enforced gate the app reads:
       majorCount: N            -> requires N majors already taken
       skills: { any:[[id,rank]] / all:[[id,rank]] }  -> skill thresholds by id
       advantages: { all:[[id,rank]] }                -> required advantages
       milestones: ["id"]       -> must already hold a named milestone (chains)
       note / skills.note        -> PROSE the app surfaces as a "GM:" confirm chip
     Use real catalog ids in prerequisites; prose `note` is for rules that aren't
     machine-checkable yet.
     REVIEW (F9): `majorGeneral` is treated as shared across all archetypes (REF
       says General Majors are open to all; WIP lists them under Professional).
       Confirm with D. -- see `majorGeneralNote` near the end of this section.
     REVIEW (F12): `minorShared` is sourced from REF_CRB v3.5; the WIP refers to
       an Advancement Section not yet written. Confirm for v4 (see
       `minorSharedSource`). Both flags are in SCHEMA.md section 5. */
  "milestones": {
    "rules": {
      "milestonePointsPerSession": 1,
      "minor": "Unlocked at 5, 15, 25... Milestone Points. All characters share the same pool; may not duplicate until each Minor Milestone has been selected.",
      "major": "Unlocked at 10, 20, 30... Milestone Points. Taken only once each, in any order, subject to prerequisites. Divided into General (open to all) and Archetype (limited to that Archetype).",
      "source": "Cadence from REF_CRB Advancement + WIP Professional Growth section."
    },
    "minorShared": [
      {
        "id": "skilled",
        "name": "Skilled",
        "benefit": "Gain 5 Skill Points, which can be used to increase Skills by 1 rank per point instead of the usual cost."
      },
      {
        "id": "improved",
        "name": "Improved",
        "benefit": "Gain 2d10+15 bonus IP. 10's explode as normal."
      },
      {
        "id": "talented",
        "name": "Talented",
        "benefit": "Gain a Rank in an existing Advantage or acquire a new Advantage (5 points or less) at no IP cost."
      },
      {
        "id": "redeemed",
        "name": "Redeemed",
        "benefit": "Reduce a Rank (or eliminate entirely) an existing Disadvantage at no IP cost."
      },
      {
        "id": "honed",
        "name": "Honed",
        "benefit": "Gain and place a single Stat point, applicable to any Stat including WILL, LUCK, or TOL."
      }
    ],
    "minorSharedSource": "REF_CRB (v3.5) - WIP refers to an Advancement Section not yet written. Flagged for v4 confirmation.",
    "majorGeneral": [
      {
        "id": "specialist",
        "name": "Specialist",
        "flavor": "You've been in this game long enough to know how to push it just a little further, when it counts.",
        "prerequisites": {
          "majorCount": 0
        },
        "benefit": "Your Kicker Die increases by 1 size (d4 to d6, d6 to d8, or d8 to d10)."
      },
      {
        "id": "defensive-dance",
        "name": "Defensive Dance",
        "flavor": "The world slows. Blades blur. You don't move away - you move through.",
        "prerequisites": {
          "majorCount": 0,
          "skills": {
            "any": [
              [
                "dodge",
                1
              ],
              [
                "melee",
                1
              ]
            ]
          }
        },
        "benefit": "Once per encounter, when you succeed on two consecutive Defensive Actions in the same round, your next Defensive Action gains a +4 bonus."
      },
      {
        "id": "bullet-ballet",
        "name": "Bullet Ballet",
        "flavor": "Each shot a beat, each beat a kill. Welcome to the bullet ballet.",
        "prerequisites": {
          "majorCount": 0,
          "skills": {
            "note": "Rank 1+ in a Ranged Weapon skill"
          }
        },
        "benefit": "Once per encounter, when you succeed on two consecutive Ranged attacks in the same round, your next attack with that weapon gains a +4 bonus."
      },
      {
        "id": "martial-momentum",
        "name": "Martial Momentum",
        "flavor": "Strike. Shift. Strike again. They fall before they even see the rhythm.",
        "prerequisites": {
          "majorCount": 0,
          "skills": {
            "any": [
              [
                "melee",
                1
              ],
              [
                "martial-arts",
                1
              ]
            ]
          }
        },
        "benefit": "Once per encounter, when you succeed on two consecutive Melee or Martial Arts attacks in the same round, your next attack with that weapon gains a +4 bonus."
      },
      {
        "id": "custom-fit",
        "name": "Custom Fit",
        "flavor": "In the world of armor couture, you're a bespoke badass.",
        "prerequisites": {
          "majorCount": 0
        },
        "benefit": "After personalizing a specific set of armor, permanently increase its damage reduction die by one step (d4 to d6, d6 to d8, max d12). Applies only to that armor; lost if it is sold, destroyed, or replaced."
      },
      {
        "id": "tuned-edge",
        "name": "Tuned Edge",
        "flavor": "You know exactly how it kicks, how it swings, and where to strike hardest.",
        "prerequisites": {
          "majorCount": 0,
          "skills": {
            "note": "Rank 1+ in the preferred Weapon skill"
          }
        },
        "benefit": "After refining a specific weapon, it gains +1 to damage. Applies only to that weapon; lost if it's significantly modified again, replaced, or destroyed."
      },
      {
        "id": "tools-of-the-trade",
        "name": "Tools of the Trade",
        "flavor": "Your tools aren't stock. They're wired, welded, and worn to your way of doing things.",
        "prerequisites": {
          "majorCount": 0,
          "gear": "At least one Tool-type item or kit"
        },
        "benefit": "Gain +1 to checks made with one specific tool or kit (Hacking, Lockpicking, First Aid, etc). Must be maintained to keep the bonus."
      },
      {
        "id": "skill-paragon",
        "name": "Skill Paragon",
        "flavor": "Some have made their skills more than a function of necessity. At this level it is a true art form.",
        "prerequisites": {
          "majorCount": 0,
          "note": "Pick a Focused Skill from your Profession"
        },
        "benefit": "The chosen skill can no longer botch on a natural 1; the 1 is added to your total like any other result.",
        "repeatable": "Can be chosen again for other skills."
      },
      {
        "id": "heroic-conditioning",
        "name": "Heroic Conditioning",
        "flavor": "You're in the thick of it all the time, and you don't succumb to physical exhaustion like others do.",
        "prerequisites": {
          "majorCount": 0
        },
        "benefit": "When doing any physical activity that requires a Skill, Essence, or Breaker Check, ignore 1 Pain Level of penalties."
      },
      {
        "id": "grace-under-fire",
        "name": "Grace Under Fire",
        "flavor": "When things go awry, it brings out your best.",
        "prerequisites": {
          "majorCount": 0
        },
        "benefit": "Select a non-combat skill. In an encounter, LUCK spent to Boost or Explode a Skill Check on that skill is reduced to 1."
      },
      {
        "id": "signature-weapon",
        "name": "Signature Weapon",
        "flavor": "A personalized, named weapon that reflects your growing legend.",
        "prerequisites": {
          "majorCount": 1,
          "skills": {
            "note": "Rank 4+ in the weapon type"
          },
          "gmApproval": true
        },
        "benefit": "Choose a base weapon. Upgrade it: +2 Mod Slots, +1 free Upgrade. Attunement: cannot be permanently taken from you except by destruction or conscious sacrifice; can always be repaired/rebuilt with time and resources."
      },
      {
        "id": "survival-instinct",
        "name": "Survival Instinct",
        "flavor": "Sometimes survival is the highest form of victory.",
        "prerequisites": {
          "majorCount": 1,
          "skills": {
            "all": [
              [
                "dodge",
                1
              ],
              [
                "melee",
                1
              ]
            ]
          }
        },
        "benefit": "Once per encounter, add a 1d4 Kicker Die when taking a Defensive Action."
      },
      {
        "id": "weapon-expert",
        "name": "Weapon Expert",
        "flavor": "You know this weapon better than any other.",
        "prerequisites": {
          "majorCount": 1
        },
        "benefit": "Select a specific weapon in your arsenal. Gain a +1d4 kicker to combat rolls using it; if a +1d4 already applies, it increases to +1d6 instead."
      },
      {
        "id": "unbreakable",
        "name": "Unbreakable",
        "flavor": "You've made it through the madness stronger and tougher than ever.",
        "prerequisites": {
          "majorCount": 1
        },
        "benefit": "When resisting mental assault with an Extended WILL Essence Check, gain 2 Automatic Hits. Stacks with the Iron Will Advantage."
      },
      {
        "id": "unfazed",
        "name": "Unfazed",
        "flavor": "Horrors of the supernatural don't hit like they used to.",
        "prerequisites": {
          "majorCount": 1
        },
        "benefit": "Once per encounter, automatically succeed on a Sanity Breaker Check."
      },
      {
        "id": "quick-study",
        "name": "Quick Study",
        "flavor": "You're fast at gauging a situation and knowing what's needed to move forward.",
        "prerequisites": {
          "majorCount": 1,
          "advantages": {
            "all": [
              [
                "danger-sense",
                1
              ],
              [
                "intuition",
                1
              ]
            ]
          },
          "flagged": true,
          // REVIEW (F11): see SCHEMA.md section 5.
          "flagNote": "Prerequisite lists an 'Intuition Advantage' - Intuition is a Skill in the catalog, not an Advantage. Confirm."
        },
        "benefit": "When making a Combat Sense Skill Check, you may Take 6."
      },
      {
        "id": "hardcore-parkour",
        "name": "Hardcore Parkour",
        "flavor": "You can do incredible things on foot that most can't.",
        "prerequisites": {
          "majorCount": 1,
          "advantages": {
            "all": [
              [
                "cat-like-balance",
                1
              ],
              [
                "time-sense",
                1
              ],
              [
                "danger-sense",
                1
              ]
            ]
          }
        },
        "benefit": "When performing Stunts requiring an Acrobatics Skill Check, you can Take 6.",
        "details": [
          "Fall damage at 10 meters or less is reduced to 0.",
          "When performing a dodge as a defensive action, add +3 to the Dodge Skill Check."
        ]
      },
      {
        "id": "shake-it-off",
        "name": "Shake it Off",
        "flavor": "The body is an amazing thing and you've made yours extremely resilient.",
        "prerequisites": {
          "majorCount": 1,
          "advantages": {
            "all": [
              [
                "hard-to-kill",
                1
              ],
              [
                "thick-skull",
                1
              ],
              [
                "scrapper",
                1
              ]
            ]
          }
        },
        "benefit": "Gain 5 Natural Armor.",
        "repeatable": "Can be selected up to two times."
      },
      {
        "id": "make-my-own-luck",
        "name": "Make My Own Luck",
        "flavor": "You don't rely on Luck, you bend it to your will.",
        "prerequisites": {
          "majorCount": 2
        },
        "benefit": "When rolling your Kicker Die, roll twice and take the higher result."
      },
      {
        "id": "bullet-dodger",
        "name": "Bullet Dodger",
        "flavor": "You're keen on how to move when bullets are flying everywhere.",
        "prerequisites": {
          "majorCount": 2,
          "advantages": {
            "all": [
              [
                "hard-to-kill",
                1
              ],
              [
                "lucky",
                1
              ]
            ]
          }
        },
        "benefit": "When performing defensive actions against ranged attackers (such as taking cover), attackers roll an Accuracy Breaker Check at 35%. On success, normal defensive actions apply; otherwise, the ranged attack misses."
      },
      {
        "id": "cyber-psion",
        "name": "Cyber Psion",
        "flavor": "Your body can't tell the difference between the machine and the biological. Installed cybernetics are accepted as you.",
        "prerequisites": {
          "majorCount": 2,
          "advantages": {
            "all": [
              [
                "cyber-prophetical",
                1
              ],
              [
                "rapid-healing",
                1
              ]
            ]
          }
        },
        "benefit": "Cybernetics no longer need repair and regenerate like biological parts.",
        "details": [
          "You gain the Addiction Disadvantage at Rank 2 for consuming raw Carbon to sustain your inorganic structures."
        ]
      },
      {
        "id": "iconic-weapon",
        "name": "Iconic Weapon",
        "flavor": "Your Signature weapon becomes feared, respected, or whispered about in certain circles.",
        "prerequisites": {
          "majorCount": 3,
          "milestones": [
            "signature-weapon"
          ]
        },
        "benefit": "Upgrade it: +1 Mod Slot (total 3), +1 Upgrade (total 2). Attunement: Gain +5 on social skills (Deception, Intimidation, Persuasion, Seduction) when the weapon is visible."
      },
      {
        "id": "cant-see-me",
        "name": "Can't See Me",
        "flavor": "Some learn to hide well. Others learn to practically disappear - hiding even their aura from things that go bump in the night.",
        "prerequisites": {
          "majorCount": 3,
          "advantages": {
            "all": [
              [
                "danger-sense",
                1
              ],
              [
                "lucky",
                1
              ]
            ],
            "note": "Favored Skill: Stealth required"
          }
        },
        "benefit": "When a Stealth Skill Check is called, you may instead make a WILL Essence Check (TN 8, TH 3). On success, you are effectively invisible as you move through the environment. Detection requires a WILL Essence Check (TN = your WILL, TH = 3 + your Hits when entering stealth).",
        "details": [
          "Once entered, even those with Aura Sight cannot perceive you."
        ]
      },
      {
        "id": "god-tier",
        "name": "God Tier",
        "flavor": "Humanity is faced with death, granting a powerful incentive to do what no other being could imagine possible.",
        "prerequisites": {
          "majorCount": 3,
          "skills": {
            "note": "Selected Skill must be at least Rank 8"
          }
        },
        "benefit": "The selected Skill has a flat +25 Modifier instead of the standard Rank + Primary Stat + Synergy Bonus."
      },
      {
        "id": "legendary-weapon",
        "name": "Legendary Weapon",
        "flavor": "Your Iconic weapon is more than gear - it's a symbol, mythologized in the streets or the LINK.",
        "prerequisites": {
          "majorCount": 5,
          "milestones": [
            "iconic-weapon"
          ]
        },
        "benefit": "Upgrade it: +1 Mod Slot (total 4), +1 Upgrade (total 3). Signature Effect: a cinematic combat move or reactive ability once per session (work with GM; e.g. Vampiric weapon, Phasing attack, Surestrike). Attunement: bound to your identity - anyone else using it suffers significant penalties unless ritually attuned or part of your legacy."
      }
    ],
    "majorGeneralNote": "Listed under the Professional's Growth & Milestones in the WIP, but REF_CRB defines General Major Milestones as open to all archetypes. Treated as shared - flagged for confirmation (F9)."
  },
  /* IMPROVEMENT POINTS (IP) -- post-creation advancement costs (Decision 14).
     `perSession` is the default grant (overridable per session, Decision 23).
     Stat raise = currentValue * 10 (computed against the CURRENT value, so it
     scales as the stat grows). Skill raise = 5 * currentRank, Focused skills
     3 * currentRank. `rankCap` caps skills/powers at 10 via IP. WILL and TOL are
     in `cannotRaiseDirectly` -- they only move via their input stats or manual
     adjustments. IPE = IP-purchased enhancement, tracked per target on the sheet.
     REVIEW (F14): at rank 0 the "5 * currentRank" formula prices learning a NEW
     skill (0->1) at zero. The app currently charges it as rank 1 (5 IP; Focused
     3) pending D.'s ruling, and flags it in the Progression UI. SCHEMA.md sec 5. */
  "ip": {
    "perSession": 10,
    "statIncreaseCost": {
      "formula": "currentValue * 10",
      "example": "REF 6 to 7 costs 60 IP; 9 to 10 costs 90 IP."
    },
    "skillIncreaseCost": {
      "formula": "5 * currentRank",
      "focusedFormula": "3 * currentRank"
    },
    "rankCap": 10,
    "statCapNote": "Stats are generally capped at 10 for Humans but may be increased via magical or mechanical enhancements, items, etc.",
    "cannotRaiseDirectly": [
      "WILL",
      "TOL"
    ],
    "ipeNote": "Track IP Enhancement (IPE) per stat/skill/advantage/power on the character sheet."
  },
  /* CREATION FLOW -- the ordered wizard steps and the rules for leftover CP.
     `steps` is the 8-step sequence the wizard renders (label + optional note).
     `boostRules` governs spending leftover Character Points after advantages:
     `spendOn` lists valid targets, `cpCostPerPoint` the rate (stubbed, see F2),
     `maxBoostPerTarget` points at the power level's `maxBoost` (any single target
     boosted at most that many times -- the anti-min-max throttle, Decision 3),
     `exemptions` lists targets the cap ignores (LUCK), and `hardCapsStillApply`
     names the table maxima that bound boosts regardless. `supernaturalRestriction`
     restates the canPurchaseAdvantages rule. Reorder/relabel steps freely; keep
     step `id`s stable if the wizard branches on them. */
  "creationFlow": {
    "steps": [
      {
        "id": "power-level",
        "n": 1,
        "label": "Determine the Campaign Power Level with your GM"
      },
      {
        "id": "concept",
        "n": 2,
        "label": "Decide who you want to be in NYTE City"
      },
      {
        "id": "stats",
        "n": 3,
        "label": "Roll for your Stat Points and assign your Base Stats",
        "note": "Explosions do not happen on creation rolls."
      },
      {
        "id": "archetype",
        "n": 4,
        "label": "Choose your Archetype - the pivot that sharpens who you are becoming"
      },
      {
        "id": "history",
        "n": 5,
        "label": "Build your character's history: What shaped them? What do they owe, fear, or want?"
      },
      {
        "id": "skills",
        "n": 6,
        "label": "Allocate Skill Points to reflect your training and expertise"
      },
      {
        "id": "character-points",
        "n": 7,
        "label": "Spend Character Points on Advantages, Disadvantages, and powers. Allocate any remaining points.",
        "note": "Formerly 'Freebie Points'. Disadvantages grant CP (no cap). Leftover CP may boost powers, skills, or stats - any single target at most maxBoost times. LUCK buy-ups are exempt from the boost cap."
      }
    ],
    "boostRules": {
      "spendOn": [
        "power",
        "skill",
        "stat",
        "luck"
      ],
      "cpCostPerPoint": 1,
      "flagged": true,
      "flagNote": "F2: CP boost exchange rate stubbed at 1:1 across target types - confirm with D.",
      "maxBoostPerTarget": "powerLevel.maxBoost",
      "exemptions": [
        "luck"
      ],
      "hardCapsStillApply": [
        "maxSkillRank",
        "maxPowerRank",
        "statRules.max"
      ],
      "supernaturalRestriction": "Archetypes with canPurchaseAdvantages=false cannot buy Advantages (Werewolf confirmed; Vampire assumed)."
    }
  }
};
