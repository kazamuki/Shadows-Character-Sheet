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
// VERSIONING: bump `meta.gamedataVersion` when a character's computed values or
// available choices can change -- content added or removed, a cost or cap
// altered, an id retired. Do NOT bump for a change no character can observe: a
// field the engine never read, a new field with no effect, a corrected comment,
// a closed flag. See Decision 68; the four-version model is in CLAUDE.md.
// (This comment used to say "shape changes only", which is not what anyone has
// ever done -- the CRB v4 pass bumped 0.2 -> 0.3 for content, correctly.)
// ============================================================================
window.SHADOWS_DATA = {

  /* META -- version stamps. The app compares a character's saved
     `gamedataVersion` against this on load and surfaces mismatches (e.g. a skill
     the character has that no longer exists) instead of failing silently.
     UPDATE: bump `gamedataVersion` per the rule above; set `rulesetVersion`
     and `updated` whenever content changes.
     What each version changed is in the session log and, up to 0.17, in
     docs/log/archive.md (it was a `notes` string here that shipped to every
     player; audit C10). `meta` holds only what the app reads. */
  "meta": {
    "gamedataVersion": "0.21",
    "rulesetVersion": "CRB v4 (in progress)",
    "updated": "2026-09-24"
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
    "beyondTen": { "stepEvery": 5 },
    "modifierRuleText": "For each point below 4, a -1 penalty for skills or synergies. For each point above 6, a +1 bonus for skills or synergies.",
    "beyondHumanLimits": "Some Archetypes (Vampires, Werewolves) are not bound by normal human ceilings; their Basic Stats can exceed 10. Once a stat passes 10, gains slow down: 11-15 is +5, 16-20 is +6, 21-25 is +7, and another +1 for every 5 points after that.",
    "ranges": [
      {
        "max": 3,
        "meaning": "Very young or old, an old injury or trauma, poor genetics, or hard living has left a mark. This will matter in play."
      },
      {
        "min": 4, "max": 6,
        "meaning": "Human average. You get by. You don't stand out."
      },
      {
        "min": 7, "max": 9,
        "meaning": "Exceptional. The city notices."
      },
      {
        "min": 10, "max": 10,
        "meaning": "The edge of human potential. Pushing past this comes at a cost."
      }
    ]
  },
  /* DERIVED -- attributes the app COMPUTES from stats; never stored on a
     character. Two `type`s in use: "sumOfModifiers" (base + sum of the modifier
     of each stat in `inputs`, clamped to `floor`) and "percent" (`formula`,
     then clamped to `floor`/`cap`). A `formula` is numbers, never text:
     `{ stat, times, plus }` is stat × times + plus (Decision 135), the same
     shape as a Werewolf's `startingSFR`. `inputs` and `formula.stat` must be
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
        "BOD",
        "COOL"
      ],
      "description": "How much Aetheric backlash your body can absorb before it stops cooperating. A Rupture spends TOL directly, equal to its degree; at zero you're Exhausted and can't cast until you recover. One hour of rest restores 1 point."
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
      "formula": {
        "stat": "EMP",
        "times": 10
      },
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
     here), `sfr` (supernatural fuel). TOL itself is the strain resource for
     casting -- a Rupture spends it directly (Decision 93); there is no
     separate Exhaustion pool layered on top, so it carries no entry here. Spend
     actions and thresholds are read directly by the Trackers tab -- edit the
     numbers here and the tracker UI follows. */
  "resources": {
    "healthLevels": {
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
        "essenceCheckDiceFloor": 1,
        "breakerCheckPercentFloor": 10,
        "skillChecks": -1,
        "essenceCheckDice": -1,
        "breakerCheckPercent": -5,
        "notes": "Essence Checks can never drop below 1 die. Breaker percentages cannot be reduced below 10%."
      }
    },
    "luck": {
      "startingValue": 2,
      "cpCostPerPoint": 1,
      "spend": [
        {
          "id": "boost",
          "action": "Boost the roll",
          "cost": 2,
          "effect": "Increase the face result of a die by 1. Can turn a Botch into a plain failure, or boost a 9 to a 10 to explode the die."
        },
        {
          "id": "explode",
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
      "description": "The pressure behind a supernatural nature - the energy channeled to activate Powers. No spellcraft check to activate: spend the required SFR and the effect triggers. Rate of Use (RoU) limits the maximum SFR channeled in a single turn. Some Powers drain SFR over time, counting against RoU each turn."
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
    "playerNote": "How many Stat Points you roll isn't settled. The sheet uses the table that scales with your Campaign Power Level.",
    "flagNote": "F8: WIP 'Rolling Stat Points' says a flat 'Roll 3d10 + 30' for all levels; the REF table scales stat point rolls by power level (30+2d10 / 40+3d10 / 50+4d10 / 60+5d10). Data file uses the scaled REF table pending confirmation. Note: explosions do NOT happen on creation rolls."
  },
  /* SKILLS -- the 36-skill catalog (11 combat / 9 utility / 16 general). Each entry's
     `primaryStat` and `synergyStat` MUST be valid stat ids (a wrong id -- e.g.
     legacy "BODY" -- is auto-normalized where known and otherwise flagged, not
     crashed; Decision 22). `category` drives table grouping on the sheet.
     `covers` is the bullet list shown under the skill's "?" expander. Character
     files reference skills by `id`, so adding is safe but renaming an id is not.
     A Professional subtype's `focusedSkills.ids` name skills here by id, and
     `focusedSkills.choose.category` names a `category` (Decision 134). */
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
      "picks": [
        {
          "id": "style",
          "label": "Martial Arts style",
          "type": "option",
          "count": 2,
          "optional": true,
          "distinct": true,
          "note": "Up to two at creation. More may be trained later in play (Decision 56).",
          "from": { "optionsFrom": "styles" }
        }
      ],
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
          "id": "commando",
          "name": "Commando",
          "bonus": "+1 Stun"
        },
        {
          "id": "escrima",
          "name": "Escrima",
          "bonus": "+1 Disarm"
        },
        {
          "id": "jujitsu",
          "name": "Jujitsu",
          "bonus": "+1 Grapple"
        },
        {
          "id": "karate",
          "name": "Karate",
          "bonus": "+1 Stun"
        },
        {
          "id": "krav-maga",
          "name": "Krav Maga",
          "bonus": "+1 Disarm"
        },
        {
          "id": "kung-fu",
          "name": "Kung Fu",
          "bonus": "+1 Knockdown"
        },
        {
          "id": "custom",
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
      ]
    }
  ],
  // F10 closed 2026-09-02. Both halves are done: the catalog gained Occult Lore
  // and Survival in the CRB v4 pass, and archetypes.professional was renamed to
  // match in the same pass -- which mattered then, because focused-skill
  // matching was by NAME, not id (it's by id since Decision 134). The flag outlived the work it described and was still
  // rendering to players; the whole block is removed rather than set to false,
  // because dead data that looks live is the defect class this batch closes.
  /* ADVANTAGES -- purchasable traits. `cost` is CP PER RANK (Decision 16: an
     Archery Master at rank 2 = 12 CP), `maxRank` caps ranks, `universal: true`
     marks traits any archetype may take. Multi-rank scaling lives in the prose
     `description`. Supernatural archetypes with `canPurchaseAdvantages:false`
     cannot buy any of these (Decision 12). Professional "natural" advantages are
     stored on the character as normal entries with source:"natural" at 0 CP
     (Decisions 17, 142) -- they are NOT a separate list here. `id` is referenced by
     milestone/advantage prerequisites, so do not rename existing ids.
     REVIEW (F5 - adv/disadv audit): the CRB v4 pass closed three of the four.
     Field Medic now names the catalog's "Medical"; Combat Paralysis' text is no
     longer ambiguous; Poverty's Max Rank is ruled at 3. Only Cyber-Prophetical
     (SAN/TOL) still carries "flagged":true, and it waits on the Biomech rewrite
     (F6). Hemophiliac's "First Aid" reference (F16) was corrected to Medical in the
     CRB and re-synced 2026-09-22. See SCHEMA.md section 5. */
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
      "description": "You have a natural kinship with animals. They aren’t threatened by you and rarely attack. Target Numbers (TN) for MAG Essence Checks to calm, befriend, or interact with an animal are reduced by 2."
    },
    {
      "id": "archery-master",
      "name": "Archery Master",
      "cost": 6,
      "maxRank": 4,
      "description": "Each rank grants 1 additional attack per round when using Archery Skill weapons.\n\nThis doesn't apply to crossbows."
    },
    {
      "id": "aura-sight",
      "name": "Aura Sight",
      "cost": 10,
      "maxRank": 1,
      "description": "Everyone in NYTE City wears a mask. Aura Sight sees behind it.\n\nYou see the aura of living beings within 30 feet of you. Aura Sight allows you to perceive these energy fields through solid objects and walls. Auras can indicate:\n\n- Power Level\n\n- Mood\n\n- Mental Health\n\n- Physical Health\n\nTake 8 on Intuition Skill Checks if you can perceive the aura of your target."
    },
    {
      "id": "backfooted",
      "name": "Backfooted",
      "cost": 8,
      "maxRank": 1,
      "description": "Being on your backfoot is comfortable.\n\nWhen facing attackers who attempt to disable you using a stunt maneuver (trip, throw, grapple, disarm), roll a Martial Arts Skill Check difficulty 18. If successful, the attempted maneuver is completely negated. If your check explodes you gain a single counterattack before the turn ends."
    },
    {
      "id": "bullseye",
      "name": "Bullseye",
      "cost": 4,
      "maxRank": 3,
      "description": "Aimed shots apply +4 bonus damage on a successful hit. This applies to ranged weaponry only.\n\nEach Rank after the first gains an additional +2 bonus to damage."
    },
    {
      "id": "charismatic",
      "name": "Charismatic",
      "cost": 3,
      "maxRank": 3,
      "description": "Each Rank in Charismatic converts a single result of 1 on the die to a 2 when making MAG Essence Checks."
    },
    {
      "id": "common-sense",
      "picks": [
        {
          "id": "skill",
          "label": "Skill",
          "type": "skill",
          "from": { "ids": ["investigation", "awareness", "basic-tech", "intuition"] },
          "count": 1,
          "perRank": true,
          "distinct": true,
          "note": "Take 6 on the selected Skill."
        }
      ],
      "name": "Common Sense",
      "cost": 4,
      "maxRank": 4,
      "description": "You have a natural aptitude for seeing what others tend to miss. Choose one of the following skills:\n\n- Investigation\n\n- Awareness\n\n- Basic Tech\n\n- Intuition\n\nTake 6 on the selected skill.\n\nChoose a different Skill for each rank.",
      "universal": true
    },
    {
      "id": "combat-cunning",
      "name": "Combat Cunning",
      "cost": 4,
      "maxRank": 1,
      "description": "You're particularly gifted with fighting. When performing a stunt during combat, rolling a natural 9 or a 10 automatically succeeds but the roll can no longer explode. If the stunt was opposed and the opponent's roll explodes the stunt will have to beat the enemy’s roll as normal.",
      "universal": true
    },
    {
      "id": "contacts-major",
      "name": "Contacts (Major)",
      "cost": 3,
      "maxRank": 4,
      "description": "A Major Contact carries significant influence, resources, or access — and uses it when you need them to. Each rank increases the magnitude of that contact's reach and power.\n\nMajor Contacts risk real exposure helping you with illicit activity. They aren't always available. GM's discretion.\n\nEXAMPLES:\n\n- Son to a Hub City senator that knows how to throw his weight around and can get information on people by special request\n\n- A sorcerer in the Daedalus Belt who's well versed in ancient texts and has their own private library regarding arcane topics\n\n- A high corporate mogul who's loaded to the gills and can get you discreet access to weapons and transportation from time to time",
      "universal": true
    },
    {
      "id": "contacts-minor",
      "name": "Contacts (Minor)",
      "cost": 1,
      "maxRank": 4,
      "description": "A Minor Contact has just enough influence, resources, or access to be useful when you need a small assist. Each rank grants one additional Minor Contact. Minor Contacts are available more often, but their reach has limits, and they work harder to deliver.\n\nEXAMPLES:\n\n- A low-grade hacker who can surface data most citizens can't find on the LINK\n\n- A Lowtown fence with access to decent gear under 5,000 credits\n\n- A local scholar with above-average knowledge of the occult and a few rare texts",
      "universal": true
    },
    {
      "id": "cyber-prophetical",
      "name": "Cyber-Prophetical",
      "cost": 10,
      "maxRank": 1,
      "description": "The body is hardware. This is the compatibility patch.\n\nSuffer no Sanity loss when you acquire cybernetics.",
      "flagged": true,
      "flagNote": "F5: open question for D - SAN vs TOL interaction (pending the Biomech rewrite, F6). CRB v4 text is unchanged from the flagged version."
    },
    {
      "id": "danger-sense",
      "name": "Danger Sense",
      "cost": 3,
      "maxRank": 5,
      "description": "The city always telegraphs. Most people aren't listening.\n\nYou sense when something or someone threatens you.\n\n- Rank 1 — Effect: Sense danger within 5 feet\n\n- Rank 2 — Effect: Sense danger within 50 feet\n\n- Rank 3 — Effect: Sense danger within 500 feet\n\n- Rank 4 — Effect: Identifies main visible threat\n\n- Rank 5 — Effect: Identifies main threat, both seen and unseen"
    },
    {
      "id": "divine-intervention",
      "name": "Divine Intervention",
      "cost": 8,
      "maxRank": 1,
      "description": "The gods favor you. Once.\n\nDivine Intervention can restore you to full health, cure toxins, magical illness, or a horrifying curse, or automatically succeed a single Death Save. The form it takes is the GM's call. Once called, it never answers again."
    },
    {
      "id": "dream-walker",
      "name": "Dream Walker",
      "cost": 12,
      "maxRank": 1,
      "description": "The mind is a locked door. Dream Walker is the key.\n\nWalk into the dreams of sleeping targets.\n\nRoll a contested WILL Essence Check to enter the dream of another sleeping person.\n\n- If successful, you enter their Dreamscape. You need to be able to see that individual or have a reference like a photo or video feed to assist you.\n\n- If you fail you can't attempt to enter that person's dream again until they enter a new sleep cycle.\n\nIf the target of your dream walking becomes aware you are an intruder, they can push you out immediately and this will prevent future attempts to enter their dreams."
    },
    {
      "id": "educated",
      "name": "Educated",
      "cost": 5,
      "maxRank": 5,
      "description": "Each rank grants 10 additional Skill Points.",
      "universal": true,
      "grants": [{ "type": "skillPoints", "perRank": 10 }]
    },
    {
      "id": "eidetic-memory",
      "name": "Eidetic Memory",
      "cost": 10,
      "maxRank": 1,
      "description": "In NYTE City, information is currency. Eidetic Memory means you never lose any.\n\nINT Essence checks used for memory recall are automatically successful and unerring.\n\nEidetic Memory does not apply when:\n\n- Incapacitated\n\n- Suffering a head injury\n\n- Under the influence of drugs."
    },
    {
      "id": "favored-skill",
      "picks": [
        {
          "id": "skill",
          "label": "Skill",
          "type": "skill",
          "count": 1,
          "perRank": true,
          "distinct": true
        }
      ],
      "name": "Favored Skill",
      "cost": 5,
      "maxRank": 5,
      "description": "Choose a Skill. Once per encounter you may re-roll a botch for that selected skill, taking the second result. LUCK cannot be used to modify this second result.\n\nChoose a new skill for each rank in Favored Skill."
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
      "description": "The difference between patching and healing is the hands doing it.\n\nAdd an additional 1d4 Kicker Die whenever making a Medical Skill Check.\n\nThis advantage can stack with other kicker die applied to this Skill Check."
    },
    {
      "id": "followers-minion",
      "picks": [
        {
          "id": "detail",
          "label": "Name your followers, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Followers/Minion",
      "cost": 5,
      "maxRank": 3,
      "description": "Gain 1 follower or companion who can assist you. Each rank grants an additional follower or companion. GM Approval needed.\n\nExample:\n\n- Assistant\n\n- Thrall\n\n- Mercenary who follows you",
      "universal": true
    },
    {
      "id": "ghost-step",
      "name": "Ghost Step",
      "cost": 6,
      "maxRank": 1,
      "description": "When you don't want to be seen, you're not.\n\nGain a +3 synergy bonus to Stealth Skill Checks."
    },
    {
      "id": "ghost-tag-s",
      "name": "Ghost TAG(s)",
      "cost": 8,
      "maxRank": 1,
      "description": "In NYTE City, your TAG is your face. A Ghost TAG gives you a different one.\n\nYour Trusted Authentication Gateway (TAG) is a complex high quality counterfeit. When scanned it will provide the false identity you've constructed and tie it to finances, contact info, and a fabricated background.\n\nAn opponent must do an Investigation or Security skill check at 30 difficulty to learn the truth. Using corporate resources like artificial intelligence lowers the difficulty to 27. A successful Investigation or security skill check will only reveal that the TAG is fake, not the holder’s true identity.",
      "universal": true
    },
    {
      "id": "gun-master",
      "name": "Gun Master",
      "cost": 6,
      "maxRank": 4,
      "description": "Each rank grants 1 additional attack per round when using firearms."
    },
    {
      "id": "hard-to-kill",
      "name": "Hard to Kill",
      "cost": 4,
      "maxRank": 4,
      "description": "NYTE City hasn't finished with you yet. It may need to try harder.\n\nGain +1 max HP to all Health Levels per Rank.",
      "universal": true,
      "grants": [{ "type": "hpPerLevel", "perRank": 1 }]
    },
    {
      "id": "hyper-vigilance",
      "name": "Hyper Vigilance",
      "cost": 6,
      "maxRank": 1,
      "description": "Combat leaves a mark. This is the useful one.\n\nAdd an additional Kicker Die of 1d4 for Combat Sense Skill Checks."
    },
    {
      "id": "immunity",
      "picks": [
        {
          "id": "detail",
          "label": "Name what you are immune to, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
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
      "description": "NYTE City finds a way to break most people. This is what it looks like when it can't.\n\nReduce Target Number of WILL Essence Checks by 1."
    },
    {
      "id": "junkyard-genius",
      "name": "Junkyard Genius",
      "cost": 5,
      "maxRank": 1,
      "description": "NYTE City is full of broken things. Most people see junk. You see potential.\n\nWith your sense of how technology works you can apply it in ways that most people don't. Once per encounter, you can improvise a device using the materials and technology around you. This device offers a +3 synergy bonus to TECH-related skill checks as long as the device is operational.\n\nYou cannot use this Advantage if there is no technology or machinery within reach. This also requires that you have access to basic tools if the gadget is complex enough. At the end of the encounter, the device falls inert but can be properly reconstructed later, if desired."
    },
    {
      "id": "last-stand",
      "name": "Last Stand",
      "cost": 4,
      "maxRank": 1,
      "description": "Going down swinging isn't a tactic. It's a personality trait.\n\nWhen your health drops to 0, gain a number of attacks equal to your BOD. Afterwards, you fall unconscious and need to roll to save against dying as normal."
    },
    {
      "id": "lightning-calculator",
      "name": "Lightning Calculator",
      "cost": 1,
      "maxRank": 1,
      "description": "NYTE City runs on numbers. Some people just see them faster.\n\nResolve complex mathematical equations without technology or writing. When applicable, Take 6 on:\n\n- Programming\n\n- Basic Tech\n\n- Engineering\n\nIf you're helping someone using any TECH-related skill they gain a +1 synergy bonus while you're present.\n\nThis Advantage can't be used while you're in combat.",
      "universal": true
    },
    {
      "id": "long-lived",
      "creationOnly": true,
      "name": "Long-Lived",
      "cost": 5,
      "maxRank": 3,
      "description": "NYTE City has been here a long time. So have you.\n\nYou have an exceptionally long life span. You are older than you seem.\n\n- Rank 1 — Minimum Age: 70 · Maximum Age: 140 years · Effect: 1 Minor Milestone\n\n- Rank 2 — Minimum Age: 110 · Maximum Age: 220 years · Effect: 1 Minor Milestone\n\n- Rank 3 — Minimum Age: 150 · Maximum Age: 300 years · Effect: 1 Major Milestone\n\nYou may only purchase this Advantage during character creation.",
      "grants": [
        { "type": "milestone", "kind": "minor", "atRank": 1 },
        { "type": "milestone", "kind": "minor", "atRank": 2 },
        { "type": "milestone", "kind": "major", "atRank": 3 }
      ]
    },
    {
      "id": "lucky",
      "name": "Lucky",
      "cost": 3,
      "maxRank": 1,
      "description": "Luck doesn't care about odds. Neither do you.\n\nLuck point costs are reduced.\n\n- Boost now costs 1 point (down from 2)\n\n- Explode now costs 2 points (down from 3)",
      "universal": true,
      "grants": [
        { "type": "luckCost", "spendId": "boost", "delta": -1 },
        { "type": "luckCost", "spendId": "explode", "delta": -1 }
      ]
    },
    {
      "id": "machindo",
      "name": "Machindo",
      "cost": 7,
      "maxRank": 1,
      "description": "Every system has a logic. Machindo means you already know it.\n\nTechnology works for you the way it doesn't for anyone else. When dealing with computers, vehicles, or technology, Take 6 on the following skill checks:\n\n- Basic Tech\n\n- Engineering\n\n- Interface\n\n- Robotics\n\n- Pilot\n\nWhenever making an INT or TECH-based Essence check the Target Number (TN) is reduced by 1 (to a minimum of 1)."
    },
    {
      "id": "magic-bane",
      "name": "Magic Bane",
      "cost": 10,
      "maxRank": 1,
      "description": "Magic writes its own rules. You're the exception.\n\nAll Magical effects (both positive and negative) are only half as potent on you."
    },
    {
      "id": "medium",
      "name": "Medium",
      "cost": 5,
      "maxRank": 1,
      "description": "The dead don't always stay that way in NYTE City. Neither do their secrets.\n\nThe veil between the living and the dead is thinner for you. You may choose to interact with spirits of the dead and beings from beyond it."
    },
    {
      "id": "melee-master",
      "name": "Melee Master",
      "cost": 5,
      "maxRank": 4,
      "description": "The first hit starts the fight. The rest of yours end it.\n\nEach rank grants 1 additional attack per round when making melee attacks."
    },
    {
      "id": "night-vision",
      "name": "Night Vision",
      "cost": 2,
      "maxRank": 1,
      "description": "NYTE City never fully turns the lights off. But close enough.\n\nNo penalty for visual Awareness checks made in low or no light conditions."
    },
    {
      "id": "nine-lives",
      "name": "Nine Lives",
      "cost": 15,
      "maxRank": 1,
      "description": "Most people get one chance. You get nine. The city will catch up eventually.\n\nWhen called to make a Death Save, roll up to 9 times. Each time a Death Save is rolled it counts against the available pool. This pool of Death Saves can't be replenished. If all extra Death Saves have been rolled the next Death Save check is treated as normal. Unless you've utterly failed all saves and are currently deceased."
    },
    {
      "id": "pain-tolerance",
      "name": "Pain Tolerance",
      "cost": 6,
      "maxRank": 3,
      "description": "Pain is an invoice. You stopped paying full price.\n\nIgnore 1 level of Pain per rank."
    },
    {
      "id": "quick-draw",
      "name": "Quick Draw",
      "cost": 8,
      "maxRank": 1,
      "description": "The holster is a formality.\n\nDraw and use a weapon immediately as a free action. Aimed shots retain their full Accuracy bonus.",
      "universal": true
    },
    {
      "id": "rapid-healing",
      "name": "Rapid Healing",
      "cost": 5,
      "maxRank": 3,
      "description": "While out of combat, your body heals faster.\n\n- Rank 1 — Heal Multiplier: x2\n\n- Rank 2 — Heal Multiplier: x3\n\n- Rank 3 — Heal Multiplier: x4"
    },
    {
      "id": "refined-skill",
      "picks": [
        {
          "id": "skill",
          "label": "Skill",
          "type": "skill",
          "count": 1,
          "perRank": true,
          "distinct": true
        }
      ],
      "name": "Refined Skill",
      "cost": 8,
      "maxRank": 5,
      "description": "Choose a skill. Refined Skills explode on a natural 9 or 10. The explosion is suppressed when this skill is used with Combat Cunning to perform a stunt.\n\nChoose a different skill for each rank in this advantage."
    },
    {
      "id": "reputation",
      "name": "Reputation",
      "cost": 4,
      "maxRank": 4,
      "description": "Reputation travels faster than bullets.\n\nYou are feared, beloved, or both. Each rank expands how far that name reaches. Those who know your name offer deference: discounts, trust, access, vouches from strangers. The further your reputation extends, the more doors open before you touch them.\n\n- Rank 1: A neighborhood or small group knows your name. Quiet respect wherever you're known.\n\n- Rank 2: Your name has reached the LINK. Outside your area, people occasionally recognize you.\n\n- Rank 3: An entire sector knows who you are. On the streets, people approach you.\n\n- Rank 4: Whole territories have heard your name. Strangers have already decided what you are before you speak.",
      "universal": true
    },
    {
      "id": "riposte",
      "name": "Riposte",
      "cost": 4,
      "maxRank": 1,
      "description": "When using a melee weapon, whenever you successfully parry a strike, you may Riposte: apply your weapon’s damage (no BOD bonus) to the attacker. This counterattack counts as a stunt for the turn."
    },
    {
      "id": "scrapper",
      "name": "Scrapper",
      "cost": 10,
      "maxRank": 1,
      "description": "You've been hit before. These days it's a rounding error.\n\nHand-to-hand damage and blunt melee weapon damage against you are halved, rounded down."
    },
    {
      "id": "sense-of-direction",
      "name": "Sense of Direction",
      "cost": 2,
      "maxRank": 1,
      "description": "You discern all cardinal directions even while blindfolded or underground. Take 6 on Survival Checks used to navigate your surroundings.",
      "universal": true
    },
    {
      "id": "snatch",
      "name": "Snatch",
      "cost": 8,
      "maxRank": 1,
      "description": "If you can perceive an object fired at you, on a successful Parry you snatch the projectile right out of the air."
    },
    {
      "id": "spirit-guide",
      "name": "Spirit Guide",
      "cost": 7,
      "maxRank": 3,
      "description": "Something followed you back. It means well. Probably.\n\nA guide from beyond the veil has taken an interest in you. They steer you toward the right course when they can. Spirit Guides wear many forms: angels, disfigured spirits, fey, even dark shadows on the wall. Whatever their shape, their help arrives in strange ways.\n\nMake an EMP Essence Check (Target 8, Threshold 2) to call on your guide. On success, the guide assists — options include:\n\n- Add a 1d4 kicker die to your next Skill Check\n\n- Reveal a small secret unknown to you (GM’s discretion)\n\n- Reduce the difficulty of an unopposed check by 5\n\nCall on your guide once per rank per session."
    },
    {
      "id": "stunt-rider",
      "name": "Stunt Rider",
      "cost": 7,
      "maxRank": 1,
      "description": "The speedometer is someone else’s problem.\n\nRetain Accuracy bonus with ranged weapons while making aimed shots from a moving vehicle. Stunts performed using this Advantage work as normal.\n\nIf you have the Bullseye Advantage, the damage bonus still applies if the attack successfully hits the target."
    },
    {
      "id": "thick-skin",
      "name": "Thick Skin",
      "cost": 3,
      "maxRank": 3,
      "description": "Gain +1 Natural Armor per rank.\n\nNatural Armor is unaffected by Armor Piercing effects.",
      "grants": [{ "type": "naturalArmor", "perRank": 1 }]
    },
    {
      "id": "thick-skull",
      "name": "Thick Skull",
      "cost": 5,
      "maxRank": 1,
      "description": "Aim for the head. See where it gets you.\n\nIgnore bonus damage from normal attacks hitting the head. Damage added from an exploded roll still applies."
    },
    {
      "id": "time-sense",
      "name": "Time Sense",
      "cost": 1,
      "maxRank": 1,
      "description": "Your sense of time is perfect. Underground, unconscious, or on another plane of existence, you always know the actual time. Once per session, Take 8 on any Skill Check focused on time or timing.",
      "universal": true
    },
    {
      "id": "true-faith",
      "name": "True Faith",
      "cost": 15,
      "maxRank": 1,
      "description": "Whatever’s out there, it blinks first.\n\nThrough sheer faith, you activate an aura that repels supernatural attacks, magic, and psychic assaults for 12 Rounds. This aura applies the following effects:\n\n- Within 10 feet of you, supernatural beings suffer a -3 Pain Penalty on all skill checks even if they're immune to pain effects.\n\n- Reduce Target number of Essence Checks to defend against supernatural abilities and powers by 2.\n\n- Magic and psychic abilities used against you have an 85% chance of failure.\n\nTrue Faith can only be activated once per encounter."
    },
    {
      "id": "unshakeable",
      "name": "Unshakeable",
      "cost": 4,
      "maxRank": 1,
      "description": "Surprise grants no Synergy Bonus against you."
    },
    {
      "id": "untouchable",
      "name": "Untouchable",
      "cost": 4,
      "maxRank": 3,
      "description": "Close only counts to the people missing.\n\nEach rank grants 1 use per combat encounter. Spend a use when making a Dodge Skill Check to add your Acrobatics rank as a Synergy Bonus. A natural 1 on this check doesn’t botch."
    },
    {
      "id": "wealthy",
      "name": "Wealthy",
      "cost": 6,
      "maxRank": 4,
      "description": "Start with an additional 10,000 Ç. Gain an additional 2,000 Ç/per month for each rank."
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
      "picks": [
        {
          "id": "detail",
          "label": "Name the substance",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Addiction",
      "pointsGranted": 3,
      "maxRank": 3,
      "description": "You have an addiction to a substance of your choice. Each rank upgrades the severity of the addiction, how long you can go without your addiction, and the withdrawal effects should you fail to get a fix in time.\n\n- Rank 1 — Example: Minor. Cigarettes, chewing tobacco · Addiction timeline: 2 days · Withdrawal Effects: Target Number of WILL and COOL Essence checks are increased by 1\n\n- Rank 2 — Example: Moderate. Hard alcoholic, Ketamine · Addiction timeline: 18 hours · Withdrawal Effects: Rank 1 effects and Pain Level +1 for 1 week or until next fix.\n\n- Rank 3 — Example: Major. Heroin, Cocaine · Addiction timeline: 6 hours · Withdrawal Effects: Rank 1 effects and Pain Level +2 for 2 weeks or until next fix."
    },
    {
      "id": "age",
      "name": "Age",
      "pointsGranted": 8,
      "maxRank": 1,
      "description": "NYTE City doesn’t wait for you to grow up.\n\nYou're between the ages of 13 to 15. This carries with it social and physical limitations:\n\n- BOD Max: 5\n\n- REF Max: 6\n\n- MOB Max: 6\n\n- You're either dependent to someone or have emancipated yourself.\n\n- Access to certain areas is more heavily restricted by law.\n\n- You're more likely to be targeted for exploitation.\n\nCybernetics push past some of these limits, but Stats cap at human maximum due to your body not being done growing."
    },
    {
      "id": "berserker",
      "name": "Berserker",
      "pointsGranted": 7,
      "maxRank": 1,
      "description": "This isn't just a short temper; there's a brewing storm of fury always within you. It is a challenge to keep it at bay especially if you're in the presence of violence.\n\nSanity is reduced by 15%.\n\nAt the start of combat, roll a Sanity check. Failure means you have lost your ability to keep the beast inside and the following effects are active.\n\n- You're consumed by the need to commit violence. You will attack anyone you consider to be a threat or anyone that attempts to stop you from drawing blood while berserk. This lasts until the end of the encounter and triggers only once per encounter.\n\n- You suffer a -2 penalty to all defensive actions during combat as you aren't concerned about taking injury or avoiding pain.\n\n- Hand to hand attacks with Martial Arts or Melee skills get a +2 to hit and +4 to damage.\n\n- Target Number for other COOL Essence checks increase by 1 while berserk.\n\n- You may attempt to break from berserk once per turn with a COOL Essence Check (Target 9, Threshold 3).\n\n- If you are about to attack an ally, you may make COOL Essence Check (Target 9, Threshold 2) to stop yourself. On a successful check you stop the attack but you're still berserk."
    },
    {
      "id": "blood-lust",
      "name": "Blood Lust",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "Everyone bleeds. Not everyone stops to watch.\n\nThe sight of blood is intoxicating. When you witness blood there is a wave of euphoria that is disorienting and suspends your sense of your surroundings briefly.\n\nSanity is reduced by 5%.\n\nThe first time blood is drawn during an encounter, roll a Sanity Check.\n\n- If successful: Blood Lust is negated until your next encounter\n\n- If the check fails: For the rest of the encounter, Combat Sense Checks fail automatically on a natural 2 or 3 on the die due to the distraction. Rolling a 1 is still a botch."
    },
    {
      "id": "combat-paralysis",
      "name": "Combat Paralysis",
      "pointsGranted": 8,
      "maxRank": 1,
      "description": "Everyone's fast until it's real.\n\nYou do not roll initiative. You act last in every combat round. During the first round of combat, you cannot prepare actions; your body hasn’t caught up to the fight yet."
    },
    {
      "id": "coward",
      "name": "Coward",
      "pointsGranted": 12,
      "maxRank": 1,
      "description": "Courage is a check. This one has a target number.\n\nIn violent, dangerous, or threatening circumstances you have to resist the urge to run in a panic. This threat doesn't even need to be one that actively targets you.\n\nAt the start of combat make a COOL Essence Check (Target 9, Threshold 2) to keep from running in panic:\n\n- If Successful: you remain calm for the rest of the encounter.\n\n- If the Essence check fails: you run in terror, attempting to escape the situation. You cannot take any combat actions and if enemies are in range, they are allowed a single attack against you. You may use non-combat skills to aid in your escape attempts during this time. You may attempt to calm yourself at the end of your turn with a COOL Essence Check (Target 9, Threshold 2)."
    },
    {
      "id": "cursed",
      "picks": [
        {
          "id": "detail",
          "label": "Work out the curse, and how it lifts, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Cursed",
      "pointsGranted": 5,
      "maxRank": 3,
      "description": "Curses don't expire. They mature.\n\nSomething supernatural marked you, and the mark took. Every curse is different, work out its exact effects with your GM. They range from cosmetic to life-altering: a disfigurement you can’t hide, or pain that flares every time you move and answers to no drug or spell. Each rank makes the curse more powerful and harder to conceal.\n\nSome curses can be lifted. If yours can, the method is tied to your history: A ritual of high complexity, a debt repaid, the death of whoever spoke your name. Decide with your GM whether this release exists and what it costs."
    },
    {
      "id": "cyber-allergy",
      "name": "Cyber Allergy",
      "pointsGranted": 12,
      "maxRank": 1,
      "description": "The body is hardware. Yours voids the warranty.\n\nYour body rejects all cybernetics and nano-tech. Implants cause rampant illness until removed. Nanites fail automatically, triggering an allergic reaction in the body’s tissues."
    },
    {
      "id": "defect-flaw",
      "picks": [
        {
          "id": "skill",
          "label": "Skill it hurts",
          "type": "skill",
          "count": 1,
          "perRank": true,
          "distinct": true,
          "note": "Checks with the selected Skill suffer -2."
        },
        {
          "id": "detail",
          "label": "Name the defect, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Defect/Flaw",
      "pointsGranted": 2,
      "maxRank": 4,
      "description": "You have a specific flaw or defect that makes things more difficult for you. These can be things like being illiterate, suffering from dyslexia, or color blindness. Discuss what the defect is with your GM when you select this Disadvantage. Relevant skills this Disadvantage affects suffer a -2 penalty. Each Rank purchased for this Disadvantage applies to a different defect and skill(s).\n\nPossible defects could be:\n\n- Color Blindness (visual Awareness Checks)\n\n- Hard of hearing (audio Awareness Checks)\n\n- Uncontrollable Stutter (Persuasion Checks)\n\n- Shaky hands (Combat Skills like Handgun or Melee)\n\n- Vertigo (Acrobatics Checks)\n\n- Missing eye or lack of depth perception (combat skills using firearms or Pilot)"
    },
    {
      "id": "danger-magnet",
      "name": "Danger Magnet",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "Trouble has a type.\n\nThere is no shortage of threats in NYTE City. You attract the worst of them.\n\n- Mortal threats start 1 level higher than normal.\n\n- Each additional party member with Danger Magnet adds 1 more threat to the encounter."
    },
    {
      "id": "distractable",
      "name": "Distractable",
      "pointsGranted": 3,
      "maxRank": 1,
      "description": "You're easily distracted. With Awareness and Combat Sense Skill Checks you automatically fail if you roll a natural 2 or 3 on the die. Rolling a 1 is still a botch."
    },
    {
      "id": "dwarf",
      "name": "Dwarf",
      "pointsGranted": 5,
      "maxRank": 1,
      "description": "You're incredibly short. This affects certain physical attributes and skills.\n\n- BOD Max: 8\n\n- MOB Max: 3\n\n- Height Max: 3'6''\n\n- Easily Hidden: +3 Bonus to Stealth when trying to hide."
    },
    {
      "id": "enemies",
      "picks": [
        {
          "id": "detail",
          "label": "Name who wants you dead, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Enemies",
      "pointsGranted": 1,
      "maxRank": 4,
      "description": "Everyone in NYTE City is someone's problem. You're several.\n\nEnemies are anyone that will try to hurt, capture, or kill you at the earliest opportunity. It's possible you don't even know that you've made these enemies as well. They may have valid reasons, they may not. Doesn't matter. Each Rank in Enemies increases the power, number, or influence of the enemies you have.\n\n- Rank 1: An individual despises you. They may want to attack you but they're not always able to do this or may not have a lot of resources at their disposal.\n\n- Rank 2: A small group of people who know you and will likely commit to violence if they encounter you.\n\n- Rank 3: An enemy at the agency level like the police or a gang who are always searching for you.\n\n- Rank 4: A powerful authority like a corporation who uses their resources to try to find you and they don't care who they hurt to make sure they're successful."
    },
    {
      "id": "fanatic",
      "picks": [
        {
          "id": "detail",
          "label": "Name what you are fanatical about, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Fanatic",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "Fanaticism is a powerful obsession. This describes a psychological rigidity that is nearly impossible to break and is rigorously defended. You decide what the character is fanatical about and discuss it with the GM. It could be a religious belief, an ideal, or personal code of your own making that shapes the way you live your life. Whoever challenges your fanatical beliefs will likely be met with hostility or possibly even violence and it doesn't matter if this person is a friend or loved one.\n\n- Once per encounter, you may make a Sanity Check to stop yourself from overreacting.\n\n- Sanity is reduced by 15%.\n\n- Target Number of all EMP Essence Checks are increased by 1."
    },
    {
      "id": "faultlessly-honest",
      "name": "Faultlessly Honest",
      "pointsGranted": 10,
      "maxRank": 1,
      "description": "Lies are currency. You’re broke.\n\nAnytime you speak you will do your level best to speak the truth. Choosing not to speak is an answer as well. If you attempt to lie, make a MAG Essence check (Target 10, Threshold 3).\n\n- If successful: you can tell your lie, but your Sanity is reduced by 30% for the next 24 hours.\n\n- If the check fails: you cannot tell the lie."
    },
    {
      "id": "giant",
      "name": "Giant",
      "pointsGranted": 5,
      "maxRank": 1,
      "description": "You’re bigger than the city plans for. Doors, crowds, firing lines: none of them were measured with you in mind.\n\n- BOD Max: 11\n\n- REF Max: 5\n\n- MOB Max: 8\n\n- Minimum Height: 6'10''\n\n- Easy Target: Opponents gain +1 Accuracy against you with any attack, even when you’re behind cover.\n\n- Heavy Weight: Incoming Melee and Martial Arts damage you receive is reduced by 4 and you gain +2 Automatic Hits for any BOD Essence Checks when grappling smaller opponents."
    },
    {
      "id": "gullible",
      "name": "Gullible",
      "pointsGranted": 5,
      "maxRank": 1,
      "description": "Lies work on you. Any Intuition Skill Check to detect deceit fails automatically on a natural 2 or 3. A 1 is still a botch.\n\nThis Disadvantage doesn't apply if the lie being told is outrageously preposterous."
    },
    {
      "id": "hallucinations",
      "name": "Hallucinations",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "Hallucinations are sporadic and unpredictable. Your Sanity is reduced by 25%. Failed Sanity Checks adds a hallucination as a condition you suffer. While hallucinating:\n\n- Awareness and combat sense checks fail automatically\n\n- Telling friend from foe requires an EMP Essence Check Target 10, Threshold 1. Fail, and everyone looks the same.\n\nHallucinations last 1d4 rounds. What you see might even be pleasant. That was never the dangerous part."
    },
    {
      "id": "hemophiliac",
      "name": "Hemophiliac",
      "pointsGranted": 10,
      "maxRank": 1,
      "description": "NYTE City will make you bleed. This makes it count.\n\nAny damage that causes bleeding is potentially lethal because your blood doesn't clot. After taking damage, make a Medical Skill Check (Difficulty 18) to stop the bleeding. Succeed and the hemorrhaging stops, but you skip your next turn patching yourself together. Fail and you continue to bleed uncontrollably. You remain active for a number of rounds equal to your BOD before you pass out from blood loss. You may attempt to stop the hemorrhage at the end of each of your turns.\n\nUsing Nano-surgeons, SpeedHeal, or medical tech also stops the bleeding instead of a Medical Skill Check."
    },
    {
      "id": "minor-insanity",
      "picks": [
        {
          "id": "detail",
          "label": "Name the traits this expresses, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Minor Insanity",
      "pointsGranted": 1,
      "maxRank": 5,
      "description": "Your grip on the world has cracks in it. Each Rank reduces your Sanity by 5% and expresses a trait you carry: paranoia, a bad temper, compulsive lying, sadistic streaks, impulsiveness. Choose your traits with your GM.\n\nYou may spend IP during play to buy out this Disadvantage."
    },
    {
      "id": "monster-magnet",
      "name": "Monster Magnet",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "The supernatural doesn’t find everyone. It finds you.\n\nThe supernatural world is violent. You know this personally and end up on the business end of it more than most.\n\n- Supernatural threats start 1 level higher than normal.\n\n- Each additional party member with Monster magnet adds 1 more threat to the encounter."
    },
    {
      "id": "notorious",
      "picks": [
        {
          "id": "detail",
          "label": "Name what earned the reputation, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Notorious",
      "pointsGranted": 1,
      "maxRank": 3,
      "description": "Your name arrives before you do. It doesn’t say nice things.\n\nYou have a reputation, and it isn’t good. What earned it is between you and your GM.\n\nStrangers who know you only by reputation make everything harder:\n\n- Persuasion Checks are 1 Difficulty Level higher\n\n- Relevant MAG Essence Checks gain +1 Threshold\n\nEach Rank beyond the first adds another +1 to both effects.\n\nNotorious does not affect those who know you well or get to know you."
    },
    {
      "id": "pact",
      "picks": [
        {
          "id": "detail",
          "label": "Work out the pact, and its terms of release, with your GM",
          "type": "text",
          "gmApproval": true
        }
      ],
      "name": "Pact",
      "pointsGranted": 15,
      "maxRank": 1,
      "description": "Some deals get made before you know you’re at the table.\n\nThis is a nearly unbreakable bond with a supernatural being or a mystical oath you've taken. You were tricked or coerced into it. The terms force you against your own nature. Work out the details, and the conditions for release, with your GM. Once the conditions for release are met, you may spend IP to remove this Disadvantage.\n\nIf you choose to go against your pact you have the following consequences until you again follow your pact:\n\n- Lose the ability to use Luck.\n\n- All Essence checks have a +1 to Threshold."
    },
    {
      "id": "pain-sensitive",
      "name": "Pain Sensitive",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "Pain finds you faster. Your Pain Level is always 1 higher than normal.\n\nDoes not apply if you have no pain levels."
    },
    {
      "id": "passive",
      "name": "Passive",
      "pointsGranted": 4,
      "maxRank": 1,
      "description": "You will fight only if forced into it. At the start of combat, during initiative, make an EMP Essence check (Target 9, Threshold 2). On a failed check you will refuse to fight during combat. You may repeat this check at the end of each of your turns."
    },
    {
      "id": "poverty",
      "name": "Poverty",
      "pointsGranted": 4,
      "maxRank": 3,
      "description": "You have to constantly replenish your cash reserves. While you can survive off your universal income everything else is nearly out of reach.\n\n- You have at least Ç75,000 debt to a specific corporation/entity who will hassle you for payment.\n\n- The legal purchase of weapons, armor, and vehicles is prohibited until you have cleared the debt you owe.\n\n- You may still loot gear, or purchase gear from gray or black markets.\n\n- Half of the Çredits you receive from the work you do are automatically withdrawn and counted against your debt.\n\nEach Rank in Poverty raises your outstanding debts by Ç20,000 each."
    },
    {
      "id": "social-stigma",
      "name": "Social Stigma",
      "pointsGranted": 1,
      "maxRank": 1,
      "description": "People perceive you in a negative light. It could be the way you look, the way you dress, or the way you talk. Persuasion checks fail automatically on a natural 2 or 3. Rolling a 1 is still a botch."
    },
    {
      "id": "terminal-disease",
      "name": "Terminal Disease",
      "pointsGranted": 7,
      "maxRank": 1,
      "description": "Everyone in NYTE City is dying. You’ve got a schedule.\n\nThe disease is terminal. How much time you have left is a matter of when, not if. Maybe as little as six months from the start of play.\n\n- You are always at Pain Level 1. This stacks with Pain Level increases from lost Health Levels.\n\n- Physical Essence Checks (BOD, REF, MOB) have a +1 to Target number.\n\n- Unless you cure your illness, you will die within 5+1d4 months."
    },
    {
      "id": "unlucky",
      "name": "Unlucky",
      "pointsGranted": 5,
      "maxRank": 1,
      "description": "Luck point costs are increased.\n\n- Boosts cost 3 points (up from 2)\n\n- Explode costs 4 points (up from 3)",
      "grants": [
        { "type": "luckCost", "spendId": "boost", "delta": 1 },
        { "type": "luckCost", "spendId": "explode", "delta": 1 }
      ]
    },
    {
      "id": "weak-willed",
      "name": "Weak Willed",
      "pointsGranted": 6,
      "maxRank": 1,
      "description": "WILL Essence checks have a +1 to target number."
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
     (the archetype's `coreMechanic.disciplines`), "table" (free-entry
     columns, e.g. Augments), "grimoire" (book spells from `spells` plus
     your own in its columns, Decision 108), "reference" (read-only rules drawn
     from the data sections its `shows` names, Decision 110), "tracker" (e.g. Tolerance Load,
     max = a derived id; `counts: "down"` shows what's left of the max, and
     `resource` keeps the count on that resource's own tracker, like SFR), "text".

     DISCIPLINES (Decision 135): `cpPerRank` is what a rank costs at creation,
     `maxRankBy` a path to the cap and a discipline's `startingRankBy` a path to
     its starting rank. A path reads "campaignPowerScaling.<key>" from the
     current power level's row, or "powerLevel.<key>" from the power level,
     the same way `specialization.countBy` does. `campaignPowerScaling.focusStats`
     names the stats a `focusStatBonusRoll` may raise.
     The app renders whatever is declared. To give a new archetype custom sheet
     panels you describe them here as data; no app change (this is how the Biomech
     rewrite will add NCI tiers / augment slots). Effects that can't be modeled
     yet stay prose and display as reference.

     REVIEW (F7 - SFR per archetype): Werewolf SFR is defined (WILL x 3 + N
       w/ RoU, as `startingSFR` in its scaling table); Vampire Blood Pool is still TBD.
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
        "focusStats": [
          "INT",
          "COOL",
          "EMP"
        ],
        "byPowerLevel": {
          "street": {
            "focusStatBonusRoll": "1d4",
            "tolBonus": 0,
            "aberrations": 1,
            "evocationStartingRank": 1,
            "startingSpellsRoll": "1d4"
          },
          "heroic": {
            "focusStatBonusRoll": "2d4",
            "tolBonus": 1,
            "aberrations": 2,
            "evocationStartingRank": 2,
            "startingSpellsRoll": "2d4"
          },
          "shadows": {
            "focusStatBonusRoll": "3d4",
            "tolBonus": 2,
            "aberrations": 3,
            "evocationStartingRank": 3,
            "startingSpellsRoll": "3d4"
          },
          "wcd": {
            "focusStatBonusRoll": "4d4",
            "tolBonus": 5,
            "aberrations": 4,
            "evocationStartingRank": 4,
            "startingSpellsRoll": "4d4"
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
            "description": "With this Aberration you can see the resonance a spell leaves, even if you have no other sight.",
            "benefit": "Gain +2 for any Occult Check when analyzing magic; what you see is only visible to you."
          },
          {
            "id": "aethereal-link",
            "name": "Aethereal Link",
            "description": "You're linked to the cosmos in a way that is utterly different from most. When animals are close you are able to understand them at a telepathic level.",
            "benefit": "Hear the thoughts of animals around you within meters equal to your WILL. With a successful WILL Essence Check (TN 9 TH 1), communicate telepathically with a single animal in range while you maintain concentration."
          },
          {
            "id": "resonant-whispers",
            "name": "Resonant Whispers",
            "description": "Magic is reactive to some people. When they touch things, it allows them to hear the whispers of magic within.",
            "benefit": "Gain +3 to any Occult check to discern the properties of any talisman or artifact. Requires physical contact for at least one minute; the effect has audible and visual side effects everyone can see/hear."
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
        "description": "Channeling the flow of Aether through your body. Every spell is a Spellcraft roll: Discipline rank sets the d10 pool, dice meeting the Target Number (TN) are Hits, and any 1 is a Dud. Net Hits measured against the spell's Threshold (TH) decide the outcome. If Duds exceed Hits, the Aether ruptures back on the caster and Tolerance (TOL) drops by the difference. At 0 TOL the Arcanist is Exhausted and cannot cast until TOL recovers above zero (one hour of rest restores 1 point); a Rupture that would push TOL below zero is a Cascade. Your Grimoire, under Loadout & Powers, holds the Known spells you take from the book. The Magic reference on the Archetype tab holds the Spellcraft roll, the spell tiers, the Cascade and the Aberrations.",
        "disciplines": {
          "cpPerRank": 6,
          "maxRankBy": "powerLevel.maxPowerRank",
          "list": [
            {
              "id": "evocation",
              "name": "Evocation",
              "startingRankBy": "campaignPowerScaling.evocationStartingRank",
              "description": "The fastest, most dangerous form of spellcraft. Draws Aether directly into expression, shaping Glyphs in the moment, under pressure. Immediate, volatile, and the most likely to turn on the caster."
            },
            {
              "id": "enchantment",
              "name": "Enchantment",
              "description": "Preparation made permanent, or near enough. Weaves Aether into a physical material in advance, producing a Talisman that carries the spell until activation."
            },
            {
              "id": "alchemy",
              "name": "Alchemy",
              "description": "The longest horizon of the three. Days of ritual and rare materials produce an Artifact -- a suspended spell chain given physical form, durable enough to outlast the session."
            }
          ]
        },
        "panels": [
          {
            "id": "disciplines",
            "type": "rankedList",
            "title": "Disciplines"
          },
          {
            "id": "grimoire",
            "type": "grimoire",
            "title": "Grimoire",
            "columns": [
              "Spell Name",
              "Discipline",
              "TN",
              "TH",
              "Effect",
              "Overflow",
              "Notes"
            ]
          },
          {
            "id": "tol-spent",
            "type": "tracker",
            "title": "TOL Spent",
            "max": "TOL",
            "note": "Every Rupture spends TOL equal to its degree: Duds minus Hits.",
            "atMax": "Exhausted. No Spellcraft until TOL is back above zero. An hour's rest restores 1.",
            "overMax": "cascade"
          },
          {
            "id": "magic-reference",
            "type": "reference",
            "title": "Magic reference",
            "shows": [
              "spellcraftRules",
              "domains",
              "spellTiers",
              "enchantmentMaterialCategories",
              "cascadeTable",
              "aberrationTable",
              "aberrations"
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
        "flagNote": "F32: Arcanist Powers and Growth & Milestones sections are empty in the WIP. Arcanist Major Milestones exist in REF_CRB (e.g., Aetheric Potency) - extract on request."
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
      "primaryStatsNote": "Varies by profession Subtype (see requires.stats per subtype).",
      "summary": "The quintessential human. Focusing on adaptability, Professionals make a living working in NYTE City and have become experts at surviving. They bring skills, techniques and Tweaks to situations that expect a mundane human; Professionals teach them otherwise.",
      "gameplayStyle": "Professionals thrive on preparation and precision. Where others rely on supernatural gifts or tech, you rely on training, foresight, and execution. You excel in skill-driven play, turning planning, equipment, and expertise into decisive advantages.",
      "lore": "No bloodline. No implants rewriting their nervous system. No covenant with forces older than language. Just a person who decided that wasn't going to be enough of a reason to lose. They are not the most powerful thing in any room. They are frequently the most dangerous.",
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
            "requires": { "stats": {
              "BOD": 6,
              "REF": 8
            } },
            "focusedSkills": { "ids": ["acrobatics", "combat-sense", "security", "stealth"], "choose": { "count": 2, "category": "combat" } },
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
            "requires": { "stats": {
              "REF": 5,
              "MOB": 7,
              "BOD": 8
            } },
            "focusedSkills": { "ids": ["athletics", "combat-sense", "intimidation", "investigation", "survival"] },
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
            "requires": { "stats": {
              "INT": 7,
              "MAG": 7
            } },
            "focusedSkills": { "ids": ["awareness", "combat-sense", "streetwise", "basic-tech"] },
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
            "requires": { "stats": {
              "INT": 9,
              "COOL": 7
            } },
            "focusedSkills": { "ids": [], "all": { "throughRank": 4 } },
            "tweak": {
              "name": "Master of None",
              "description": "Real mastery comes from understanding all your options and using what you have available to the best of your ability.",
              "benefits": [
                "Once per encounter, apply a +1d4 kicker die to a number of skills up to your INT bonus. Once assigned, the bonus can't be reassigned for the remainder of that encounter.",
                "All skills are treated as Focused Skills and may be improved at 3 x current rank up to rank 4. At Rank 5 and above, the standard cost of 5 x current rank returns."
              ]
            },
            "flagged": true,
            "flagNote": "F33. Master of None: 'All skills are treated as Focused Skills and may be improved at a rate of 3 x current skill rank up to rank 4.' Unclear whether 'treated as Focused' also gives every skill the Focused Skill Max Bonus at creation (a Heroic Jack could start all 36 skills at 7), and whether Skill Paragon's 'a focused skill from your chosen Profession' can be any skill for a Jack. Stub: the price only, through rank 4 (Ken, 2026-09-24: 4 to 5 is normal cost); no cap bonus. Confirm with Deighton.",
            "playerNote": "Every skill advances at the Focused price up to rank 4. Whether it also raises every skill's starting cap is still being settled. For now it doesn't."
          },
          {
            "id": "mercenary",
            "name": "Mercenary",
            "description": "People who sell their talent for the craft of combat to the highest bidder. An abundance of training and mental conditioning makes them a good commodity.",
            "requires": { "stats": {
              "BOD": 6,
              "REF": 7
            } },
            "focusedSkills": { "ids": ["athletics", "awareness", "combat-sense", "handguns"], "choose": { "count": 1, "category": "combat" } },
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
            "requires": { "stats": {
              "INT": 7,
              "BOD": 5,
              "EMP": 7
            } },
            "focusedSkills": { "ids": ["athletics", "combat-sense", "intuition", "occult-lore", "stealth", "survival", "tracking"] },
            "tweak": {
              "name": "Hunter's Calling",
              "description": "Knowledge and instinct honed against the things that hunt in the dark.",
              "benefits": [
                "When facing a supernatural enemy, gain a +1d6 kicker die to combat checks against those targets. This applies to Occult Lore and Tracking skills as well when hunting your quarry.",
                "Opposed or Extended WILL Essence Checks used to defend against psychic, magical, or supernatural attacks have Automatic Hits equal to your EMP bonus."
              ]
            }
          },
          {
            "id": "true-warrior",
            "name": "True Warrior",
            "description": "A life spent in practice and training. The body isn't just physical, but spiritual: True Warriors draw upon their own life force, Chi, to perform incredible feats.",
            "requires": { "stats": {
              "BOD": 8,
              "REF": 7
            } },
            "focusedSkills": { "ids": ["acrobatics", "combat-sense", "intuition", "martial-arts", "occult-lore"] },
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
            },
            "grants": [{ "type": "naturalArmor", "id": "iron-shirt", "name": "Iron Shirt",
                         "stat": "BOD", "plus": 1, "while": "while active" }]
          },
          {
            "id": "wheelman",
            "name": "Wheelman",
            "description": "A calling to live on the edge of the world with nothing but skill and adrenaline - and a kinship with machines that can push any vehicle beyond normal limits.",
            "requires": { "stats": {
              "BOD": 6,
              "REF": 9
            } },
            "focusedSkills": { "ids": ["athletics", "awareness", "basic-tech", "combat-sense", "pilot", "deception"] },
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
            "type": "focusedSkills",
            "title": "Focused Skills"
          },
          {
            "id": "tweak",
            "type": "specializationText",
            "field": "tweak",
            "title": "Tweak"
          }
        ]
      },
      "powers": [],
      "powersNote": "Powers section marked TBD in WIP.",
      "vulnerabilities": [],
      "growth": {
        "minorMilestones": "shared",
        "majorMilestones": "general"
      }
    },
    // REVIEW (F13): `canPurchaseAdvantages:false` below is ASSUMED from the
    // Werewolf supernatural baseline; confirm with D. (also noted in data field).
    {
      "id": "vampire",
      "name": "Vampire",
      "status": "tbd",
      "flagged": true,
      "flagNote": "F7, F13: WIP contains narrative only - no Campaign Power Scaling, Baseline Traits, Specialization (Bloodline), Core Mechanic, or Powers yet.",
      "primaryStats": [
        "BOD",
        "REF",
        "MOB"
      ],
      "summary": "As old as civilization itself. Vampires have had centuries to accumulate power, influence, and everything that comes with both. Vampires can be part of many different houses, each with their own strengths, resources, allies, and enemies.",
      "gameplayStyle": "Vampires navigate hunger, power, and eternity in equal measure. You walk a different version of NYTE City - one shaped by blood, secrecy, and influence. Your abilities are potent and intoxicating, but indulgence always carries consequences.",
      "lore": "In NYTE City, Vampires thrive in the shadows, concealed by the chaos of urban decay. While they remain hidden from public knowledge, Vampires are not hiding. They are waiting. The Unseen Court, a secretive governing body, ensures their kind stays in the shadows while exerting influence over corporations, criminal syndicates, and political figures. You are undead. You consume blood to survive. Sunlight kills you - and NYTE City, to its credit, never fully sees the sun. Whatever path you choose, feeding is not optional.",
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
      "flagNote": "F7: Trueborn origin is partially complete (powers list trails off: Moonlit Vitality, Ancestral Wisdom, Spirit Pack, Ancestral Dominance are name-only). Other Origins (Unblooded, Forge Fang) referenced in lore but not defined.",
      "primaryStats": [
        "BOD",
        "REF",
        "MOB"
      ],
      "summary": "Lycanthropy is both a curse and a gift: immense strength, savage instinct, and the weight of a tribe and lineage older than the city. Werewolves can shift into their beast form when words stop working and something more permanent is required.",
      "gameplayStyle": "Werewolves live between restraint and release. Bound to a tribe and driven by instinct, you navigate loyalty, territory, and transformation. When the beast emerges, subtlety fades and raw power takes over - but that power always demands something in return.",
      "lore": "For as long as there have been people, there have been wolves in the shadows - protectors not from mankind, but for mankind, against the things that lurk beyond the Veil. They are the knife in the dark, the last line of defense against things that humanity cannot, or should not, know about. The beast is not a separate creature. It is the same person, with different priorities.",
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
            "startingSFR": { "stat": "WILL", "times": 3, "plus": 5 },
            "rou": 3
          },
          "heroic": {
            "statBonusRoll": "1d4+1",
            "startingSFR": { "stat": "WILL", "times": 3, "plus": 10 },
            "rou": 5
          },
          "shadows": {
            "statBonusRoll": "1d4+2",
            "startingSFR": { "stat": "WILL", "times": 3, "plus": 15 },
            "rou": 7
          },
          "wcd": {
            "statBonusRoll": "1d4+3",
            "startingSFR": { "stat": "WILL", "times": 3, "plus": 20 },
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
            "grants": [{ "type": "naturalArmor", "id": "resilient-spirit", "name": "Resilient Spirit",
                         "resAgainst": ["magical"], "while": "under a waning moon" }],
            "additionalPowers": [
              { "name": "Moonlit Vitality" },
              { "name": "Ancestral Wisdom" },
              { "name": "Spirit Pack" },
              { "name": "Ancestral Dominance" }
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
            "max": "startingSFR",
            "counts": "down",
            "resource": "sfr",
            "note": "Counts spend against a computed pool — RoU caps a single turn."
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
     Decision 13). `rules` holds the cadence as numbers (Minor at 5/15/25...,
     Major at 10/20/30...); every "5, 15, 25..." a player reads is written
     from them (Decisions 67, 135), so the notes don't repeat them. `minorShared` is the pool everyone draws from (no duplicates
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
      "minorFirstAt": 5,
      "minorEvery": 10,
      "majorFirstAt": 10,
      "majorEvery": 10,
      "minorNote": "All characters share the same pool; may not duplicate until each Minor Milestone has been selected.",
      "majorNote": "Taken only once each, in any order, subject to prerequisites. Divided into General (open to all) and Archetype (limited to that Archetype).",
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
              ]
            ]
          },
          // F11, closed by Decision 113: 041 now reads "Intuition skill at
          // least Rank 1". It had said "Intuition Advantage", which no entry is.
          "skills": {
            "all": [
              [
                "intuition",
                1
              ]
            ]
          }
        },
        "benefit": "When making a Combat Sense Skill Check, you may Take 6."
      },
      {
        "id": "hardcore-parkour",
        "name": "Hardcore Parkour",
        "flavor": "You can do incredible things on foot that most can't.",
        "prerequisites": {
          "majorCount": 1,
          "skills": {
            "all": [
              [
                "acrobatics",
                4
              ]
            ]
          },
          "advantages": {
            "all": [
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
        "repeatable": "Can be selected up to two times.",
        "grants": [{ "type": "naturalArmor", "amount": 5 }]
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
     Stat raise = `statIncreaseCost.perPoint` x the CURRENT value, so it
     scales as the stat grows (Decision 135). Skill raise = `perRank` x current rank, Focused
     skills `focusedPerRank` x current rank (Decision 134: numbers the engine
     reads, not formula text). `rankCap` caps skills/powers at 10 via IP. WILL and TOL are
     in `cannotRaiseDirectly` -- they only move via their input stats or manual
     adjustments. IPE = IP-purchased enhancement, tracked per target on the sheet.
     Learning a NEW skill after creation (rank 0 -> 1) is a flat
     `skillIncreaseCost.newSkill` -- the formula would price it at zero. At
     creation the same step costs 1 Skill Point, which is why a point in any
     skill you expect to want is worth it (it also switches on Synergy).
     Design-team ruling 2026-09-22, closed F14 (Decision 97). */
  /* APP COPY -- player-facing strings the app generates for a *state*, as
     opposed to prose that belongs to a rule. Rewriting the app's voice is a
     data edit: nothing here requires touching code (Decision 71).

     These follow docs/VOICE-APP.md. Two rules do the remembering for you:
       - Maintainer text NEVER renders. `flagNote` is for you and Deighton;
         `playerNote` is the only thing a player can see. A test enforces it.
       - "Not finished" is a STATE, not a sentence. Set `flagged` or a
         `status` and the app says the right thing on its own.

     Say what isn't settled and hand the table its authority. Never name a
     phase, a flag id, a field path, or a person. The app makes no promises
     about its own future. */
  "appCopy": {
    "unsettledLabel": "Not settled yet",
    "unsettledRule": "This rule is still being written. Until it is, it's your GM's call.",
    "houseRuleLabel": "How this works",
    "statusLabel": {
      "draft": "in progress",
      "tbd": "not written yet"
    },
    "archetypeUnwritten": "{name}'s rules aren't finished yet. You can build one — your GM fills the gaps.",
    "specializationUnwritten": "The {label} options aren't written yet. Your character file remembers that.",
    "applyFromText": "Apply these from their text.",
    "ranksAdvanceInPlay": "Ranks advance through play."
  },
  "ip": {
    "perSession": 10,
    "statIncreaseCost": {
      "perPoint": 10,
      "example": "REF 6 to 7 costs 60 IP; 9 to 10 costs 90 IP."
    },
    "skillIncreaseCost": {
      "perRank": 5,
      "focusedPerRank": 3,
      "newSkill": 25
    },
    "rankCap": 10,
    "statCapNote": "Stats are generally capped at 10 for Humans but may be increased via magical or mechanical enhancements, items, etc.",
    "cannotRaiseDirectly": [
      "WILL",
      "TOL"
    ],
    "ipeNote": "Track IP Enhancement (IPE) per stat/skill/advantage/power on the character sheet."
  },
  /* GEAR -- weapons, ammunition and armor, merged from the CRB v4 equipment
     chapter (`docs/reference/crb/Gear.md`, mirrored 2026-09-04, re-confirmed
     2026-09-12). Batch "Weapons, Ammo & Armor" (2026-09). Same designer-
     fillable philosophy as skills/advantages: a new weapon or armor entry
     needs zero app changes.

     Tags and Features are stored as the exact strings the book prints
     (including any "(Xm)" parameter, e.g. "Area (5m)") rather than forced
     into a fixed id set -- several tags are parametric per-weapon and
     collapsing them into a shared catalog id is an engine-batch decision,
     not a data-transcription one. `weaponTagGlossary`/`weaponFeatureGlossary`
     give the base-name definition for display; look up by stripping any
     "(...)" suffix. A few tags appear on weapon tables (Suppression, Blast,
     Anti-Materiel, and "Reach" as a tag distinct from the Reach column) with
     no formal definition anywhere in the source chapter -- carried here with
     `flagged: true` rather than inventing a rule the CRB doesn't state. */
  "weaponTagGlossary": [
    { "id": "AP", "description": "Armor Piercing. The weapon or round bypasses the target's RES entirely. PROT still rolls -- AP does not make armor irrelevant; it makes the flat damage reduction irrelevant." },
    { "id": "Area", "description": "The weapon affects all targets within the listed radius of the point of impact rather than a single target. One attack roll affects everyone in range. Does not benefit from ACC bonuses." },
    { "id": "Bleeding", "description": "The weapon causes the Bleeding condition on a successful hit." },
    { "id": "Burning", "description": "The weapon sets the target on fire: ongoing damage each round until extinguished or the source is removed. Stacks with Energy damage when both are present." },
    { "id": "Conceal", "description": "Can be concealed on the person without detection by visual inspection or standard security checks. Specialized scanning or a successful Perception check against a defined threshold may reveal it." },
    { "id": "Concussive", "description": "Causes the Disoriented condition across its area of effect. Deals no damage. Affects all targets in range including allies." },
    { "id": "Disarming", "description": "Can perform a Disarm maneuver instead of dealing damage. Declare before the attack roll; a hit knocks the target's weapon free, automatically. Choose damage or disarm, not both." },
    { "id": "Disintegration", "description": "On a killing blow, the target leaves no recoverable remains. The damage itself is not necessarily greater -- the permanence of the outcome is." },
    { "id": "EMP", "description": "Disrupts electronic systems and cybernetic implants on hit. Minimal against standard targets; against heavily augmented targets or electronics, the EMP effect triggers separately from the damage." },
    { "id": "Incendiary", "description": "Sets the impact area on fire, causing Burning to all targets in the affected zone until extinguished." },
    { "id": "Knockdown", "description": "Can knock a target prone instead of dealing damage. Declare before the attack roll; a hit knocks the target down, automatically. Choose damage or knockdown, not both." },
    { "id": "Mounted", "description": "Requires a bipod, hardpoint, or vehicle mount for effective use. Firing without one: BOD Essence Check, success fires at -4 ACC, failure means the weapon is uncontrollable." },
    { "id": "No Recoil", "description": "Produces no recoil on discharge. The ACC bonus applies to both Single and Burst fire, not just Single." },
    { "id": "Non-lethal", "description": "Designed for incapacitation rather than harm. Descriptor only -- the weapon's damage value (or lack of one) determines the mechanical effect." },
    { "id": "Payload", "description": "The weapon's effect is determined by the equipped arrowhead or bolt type rather than the platform itself." },
    { "id": "Siege", "description": "Deals Massive damage, to vehicles and structures and to people alike." },
    { "id": "Silent", "description": "Produces no ballistic or acoustic signature detectable by standard means. Firing from hidden does not automatically reveal the attacker; the ambush bonus applies every round they remain undetected." },
    { "id": "Smoke", "description": "Creates an obscurement cloud blocking line of sight within its area for a GM-determined number of rounds." },
    { "id": "Spread", "description": "Discharges across a cone, affecting multiple targets with one roll. Treated as an Area attack; no ACC bonus." },
    { "id": "Stunning", "description": "Causes the Stunned/Shocked condition on a successful hit." },
    { "id": "UV Burst (Undead)", "description": "Emits a burst of ultraviolet radiation dealing Withering damage specifically to undead and vampiric targets. Non-supernatural targets in range are unaffected by the UV component." },
    { "id": "Unstable", "description": "Does not behave predictably. Roll 1d4 to determine the actual effect when used." },
    { "id": "Volatile", "description": "Experimental or hybrid systems carry a risk of malfunction. On a botched attack roll, roll on the Volatile Misfire table (1: no effect; 2-3: jam, one Action to clear; 4: misfire, 5 damage ignoring armor, then jams)." },
    { "id": "Wither Cloud (Lycanthropes)", "description": "Creates a zone of particulate matter converting all damage dealt to lycanthropes and their kindred within the area into Withering damage for the duration. Non-supernatural targets are unaffected by the cloud itself." },
    { "id": "Withering", "description": "Damage of this type cannot be regenerated supernaturally -- it must heal at the natural rate regardless of the target's normal recovery. The damage amount is not necessarily greater; the permanence is." },
    { "id": "Suppression", "flagged": true, "flagNote": "F28: Appears on the Titan and Ironwall heavy weapons. No formal rule is given anywhere in the CRB v4 equipment chapter -- confirm with Deighton before the engine batch treats it as more than flavor.", "description": "Found on heavy weapons built for sustained fire.", "playerNote": "The book doesn't say what Suppression does in a fight yet. Until it does, your GM rules on it." },
    { "id": "Blast", "flagged": true, "flagNote": "F29: Appears (with a radius parameter) on several heavy/beam weapons alongside or instead of Area/Siege. The equipment chapter never states how Blast differs mechanically from Area or Siege -- confirm with Deighton before the engine batch treats it as more than flavor.", "description": "An explosive burst with a radius, printed beside or instead of Area and Siege.", "playerNote": "The book doesn't say yet how Blast differs from Area or Siege. Until it does, your GM rules on it." },
    { "id": "Anti-Materiel", "flagged": true, "flagNote": "F30: Appears on the VR-50 'Verdict'. The vehicle-combat rules (same chapter) say weapons with the Anti-Materiel, Siege, or Blast tags deal full damage to vehicles, but no rule defines an Anti-Materiel effect against personal targets -- confirm with Deighton.", "description": "Deals full damage to vehicles (per the vehicle-combat rules); no separate personal-combat effect is defined yet.", "playerNote": "What it does to a person isn't written yet. Your GM rules on it." },
    { "id": "Reach", "flagged": true, "flagNote": "F31: Appears as a weapon Tag on the Razorwhip and Orion MW-1 'Filament', distinct from the Reach column both weapons already carry. The equipment chapter never explains what the tag adds beyond the column value -- confirm with Deighton.", "description": "The weapon reaches as far as its Reach column says.", "playerNote": "What the tag adds beyond that number isn't written yet. Your GM rules on it." }
  ],
  "weaponFeatureGlossary": [
    { "id": "Bipod Mount", "description": "Integrated bipod for stable firing from prone or braced. Satisfies the Mounted tag's requirement without a separate mount." },
    { "id": "Conceal", "description": "Factory-engineered for concealment -- slim profile, reduced signature -- distinct from a weapon that merely happens to be small." },
    { "id": "Scope", "description": "Factory-fitted precision optic providing a targeting bonus at long range; the specific bonus is defined by the scope type installed." },
    { "id": "SMART Link", "description": "Integrates with the SMART Link neural interface. Operators with the implant gain the full targeting benefit; operators without gain nothing." },
    { "id": "Suppressor", "description": "Factory-fitted suppressor granting the Silent tag. Purpose-built for the specific weapon and generally more effective than the aftermarket Silencer mod." },
    { "id": "Vehicle Mount", "description": "Requires a vehicle hardpoint or dedicated mount system; satisfies the Mounted tag only when properly installed on a compatible vehicle." }
  ],
  /* Mods (W16, Decision 120). A weapon's catalog `mods` is its slot count,
     fixed at purchase (Gear). The machine fields are what the engine reads;
     `description` is what a player reads, and says the same thing:
       grantsTags   tags the weapon gains once it's installed
       aimedAcc     ACC on aimed shots, shown apart from Single's ACC
       aimedAt      when that aimed ACC applies (Scope: Long or Extreme only)
       notWith      mods whose aimed ACC this one doesn't stack with
       damageBonus  added to every hit (Angel Mod, which needs Angel Rounds)
       onlyFor      the weapon categories (and single weapons) it fits
       notFor       the categories it can't go on
     The CRB prices none of them, so installing one is free here and the
     player logs what the gunsmith charged under Credits. */
  "weaponModGlossary": [
    { "id": "Silencer", "slots": 1, "grantsTags": ["Silent"], "notFor": { "categories": ["shotguns", "heavyWeapons"] }, "description": "Grants the Silent tag. Subsonic fire only -- not for shotguns or heavy weapons, and requires subsonic ammunition. Anyone within 6m may make a Combat Sense check to locate the source." },
    { "id": "Laser Sight", "slots": 1, "aimedAcc": 1, "description": "+1 ACC on aimed shots, stacking with other accuracy bonuses. Green lasers can cause Disoriented on direct unprotected eye contact." },
    { "id": "Holo Sight", "slots": 1, "aimedAcc": 1, "description": "+1 ACC on aimed shots, stacking with other accuracy bonuses. Does not stack with SMART Targeting. Displays magazine count in the sight picture." },
    { "id": "Scope", "slots": 1, "aimedAcc": 2, "aimedAt": "at Long or Extreme range", "notWith": ["Laser Sight", "Holo Sight"], "onlyFor": { "categories": ["urbanRifles", "sniperRifles"], "weapons": ["ads-tc1-strix"] }, "flagged": true, "flagNote": "F26. Gear says a Scope is 'compatible with rifles and the ADS TC-1 Strix only'. The ammunition table files shotgun shells under 'Rifle (shotgun)', so it's unclear whether a shotgun counts as a rifle for the Scope. Stub: urban combat rifles and sniper rifles only, not shotguns. Confirm with Deighton.", "playerNote": "Whether a Scope fits a shotgun is still being settled. For now it goes on rifles and the Strix.", "description": "+2 ACC on aimed shots at Long or Extreme range only; no benefit closer. Does not stack with Holo Sight or Laser Sight. Compatible with rifles and the ADS TC-1 Strix only." },
    { "id": "Flashlight", "slots": 1, "description": "Eliminates darkness penalties for shooting and movement. The active light reveals position -- no hiding in darkness while it's on." },
    { "id": "Biometrics", "slots": 2, "description": "Registers the weapon to a single authorized user via biometric data at installation. Anyone else attempting to fire it cannot." },
    { "id": "Angel Mod", "slots": 2, "damageBonus": 4, "grantsTags": ["AP", "Burning", "Agonized"], "onlyFor": { "categories": ["handguns", "smgs", "urbanRifles", "sniperRifles"] }, "flagged": true, "flagNote": "F26. The Angel Mod fires Angel Rounds only, and the ammunition table lists Angel Rounds for 'Handgun, Rifle, SMG'. So it fits handguns, SMGs and rifles; whether shotguns count as rifles is the same question as the Scope's. Stub: not shotguns. Confirm with Deighton.", "playerNote": "Whether an Angel Mod fits a shotgun is still being settled. For now it goes on handguns, SMGs and rifles.", "description": "Plasma-coated projectile system requiring a powered magazine and Angel Rounds. Grants +4 DMG, AP, Burning, and Agonized on every hit. On a botched attack roll, roll 1d100: 50 or below jams, 51+ destroys the weapon. Ammunition/cleaning/magazine costs 5x standard. Requires specialist installation." }
  ],

  /* Rate of fire and the magazine (W16, Decision 120). 053: "Ammunition is
     spent by mode" -- Single 1 round, Burst 3, Full Auto 10. A weapon's
     `capacity` ("15+1", "100 (belt)", "10 bursts") is read for its leading
     number plus any chambered "+N"; one the engine can't read isn't tracked. */
  "weaponRules": {
    "rofModes": [
      { "id": "S", "name": "Single", "rounds": 1 },
      { "id": "B", "name": "Burst", "rounds": 3 },
      { "id": "F", "name": "Full Auto", "rounds": 10 }
    ],
    "reloadNote": "Reloading is a Fast Action: a fresh magazine, a grenade off the belt, an arrow from the quiver.",
    "modNote": "Mod slots are fixed at purchase. Removing a mod frees its slot, but may damage the mod."
  },


  /* The catalog's own section headings, in the book's order -- what the
     Loadout picker groups by (Decision 100). A weapon's `category` is one of
     these ids; a new category is a row here, not an app change. */
  "weaponCategories": [
    { "id": "melee", "name": "Melee" },
    { "id": "martialArts", "name": "Martial Arts" },
    { "id": "handguns", "name": "Handguns" },
    { "id": "smgs", "name": "Submachine Guns" },
    { "id": "grenades", "name": "Grenades" },
    { "id": "urbanRifles", "name": "Urban Combat Rifles" },
    { "id": "shotguns", "name": "Shotguns" },
    { "id": "sniperRifles", "name": "Sniper Rifles" },
    { "id": "heavyWeapons", "name": "Heavy Weapons" },
    { "id": "beamSidearms", "name": "Beam Sidearms" },
    { "id": "beamLongarms", "name": "Beam Longarms" },
    { "id": "beamSpecialist", "name": "Beam Specialist" },
    { "id": "beamHeavy", "name": "Beam Heavy" },
    { "id": "archery", "name": "Archery" }
  ],

  "weapons": [
    { "id": "combat-knife", "name": "Combat Knife", "category": "melee", "skill": "melee", "damage": "BOD+3", "style": "Blade", "reach": "1m", "damageType": "Normal", "availability": "Common", "cost": 100, "tags": ["Conceal"], "flavorLine": "No frills, no tech, no modifications -- just a sharp edge." },
    { "id": "shock-knucks", "name": "Shock Knucks", "category": "melee", "skill": "melee", "damage": "BOD+4", "style": "Blunt", "reach": "1m", "damageType": "Electric", "availability": "Common", "cost": 350, "tags": ["Stunning"], "flavorLine": "A taser you can punch someone with." },
    { "id": "autobaton", "name": "Autobaton", "category": "melee", "skill": "melee", "damage": "BOD+6", "style": "Blunt", "reach": "2m", "parry": "+1", "damageType": "Normal", "availability": "Uncommon", "cost": 800, "tags": ["Conceal"], "flavorLine": "An extendable security baton that deploys in under a second." },
    { "id": "razorwhip", "name": "Razorwhip", "category": "melee", "skill": "melee", "damage": "BOD+6", "style": "Blade", "reach": "1m", "damageType": "Normal", "availability": "Rare", "cost": 1600, "tags": ["AP", "Reach"], "flavorLine": "A length of monomolecular-edged cable on a reinforced grip." },
    { "id": "crusher", "name": "Crusher", "category": "melee", "skill": "melee", "damage": "BOD+8", "style": "Blunt", "reach": "1m", "parry": "+1", "damageType": "Electric", "availability": "Rare", "cost": 2800, "tags": ["Stunning"], "flavorLine": "An industrial vibration driver with an integrated electric discharge. Hits like a hydraulic press." },
    { "id": "orion-mw1-filament", "name": "Orion MW-1 \"Filament\"", "category": "melee", "skill": "melee", "damage": "BOD+10", "style": "Blade", "reach": "2m", "damageType": "Energy", "availability": "Exotic", "cost": 12000, "tags": ["AP", "Reach"], "flavorLine": "A single monowire filament on a powered reel, nearly invisible in motion." },

    { "id": "carbon-fiber-bo-staff", "name": "Carbon Fiber Bo Staff", "category": "martialArts", "skill": "martial-arts", "damage": "BOD+4", "style": "Blunt", "reach": "2m", "parry": "+1", "damageType": "Normal", "availability": "Common", "cost": 250, "tags": ["Knockdown", "Reach"], "features": ["2H"], "flavorLine": "Lightweight, durable, and unassuming until it isn't." },
    { "id": "kusarigama", "name": "Kusarigama", "category": "martialArts", "skill": "martial-arts", "damage": "BOD+5", "style": "Blade/Blunt", "reach": "2m", "parry": "+1", "damageType": "Normal", "availability": "Uncommon", "cost": 900, "tags": ["Disarming", "Reach"], "features": ["2H"], "flavorLine": "A weighted chain attached to a short-bladed weapon; centuries-old design that still works." },
    { "id": "tekko-kagi", "name": "Tekko-Kagi", "category": "martialArts", "skill": "martial-arts", "damage": "BOD+6", "style": "Blade", "reach": "1m", "parry": "+1", "damageType": "Normal", "availability": "Uncommon", "cost": 1800, "tags": ["AP", "Conceal"], "features": ["Paired"], "flavorLine": "A strapped hand fitting extending into raking blades along the dorsal hand." },
    { "id": "vibro-sai", "name": "Vibro Sai", "category": "martialArts", "skill": "martial-arts", "damage": "BOD+6", "style": "Blade", "reach": "1m", "parry": "+2", "damageType": "Electric", "availability": "Rare", "cost": 3200, "tags": ["AP"], "features": ["Paired"], "flavorLine": "A three-pronged weapon with a micro-vibration generator built to trap, deflect, and penetrate." },
    { "id": "shock-eskrima-sticks", "name": "Shock Eskrima Sticks", "category": "martialArts", "skill": "martial-arts", "damage": "BOD+6", "style": "Blunt", "reach": "1m", "parry": "+1", "damageType": "Electric", "availability": "Rare", "cost": 3000, "tags": ["Stunning"], "features": ["Paired"], "flavorLine": "Paired hardwood-composite sticks with integrated charge cells along the striking surface." },
    { "id": "bdf-koen", "name": "BDF Kōen", "category": "martialArts", "skill": "martial-arts", "damage": "BOD+8", "style": "Blade", "reach": "1m", "parry": "+2", "damageType": "Energy", "availability": "Exotic", "cost": 16000, "tags": ["AP", "Burning"], "flavorLine": "Kōen: crimson flame. A traditionally-proportioned blade with a plasma-sheathed edge." },

    { "id": "cheapshot", "name": "\"Cheapshot\"", "category": "handguns", "skill": "handguns", "damage": 5, "acc": 0, "range": "Low", "rof": "S", "capacity": "6+1", "mods": 0, "availability": "Common", "cost": 150, "tags": [], "flavorLine": "Not a gun so much as a category." },
    { "id": "ads-lp9-viper", "name": "ADS LP-9 \"Viper\"", "category": "handguns", "skill": "handguns", "damage": 6, "acc": 2, "range": "Low", "rof": "S/B", "capacity": "15+1", "mods": 2, "availability": "Common", "cost": 1200, "tags": [], "features": ["Conceal"], "flavorLine": "Sleek, lightweight, and sized for a jacket pocket without printing." },
    { "id": "vs4-ironside", "name": "VS-4 \"Ironside\"", "category": "handguns", "skill": "handguns", "damage": 7, "acc": 1, "range": "Low", "rof": "S/B", "capacity": "12+1", "mods": 2, "availability": "Common", "cost": 1800, "tags": [], "flavorLine": "Vanguard doesn't make elegant weapons; they make weapons that work." },
    { "id": "ap7-sentry", "name": "AP-7 \"Sentry\"", "category": "handguns", "skill": "handguns", "damage": 6, "acc": 3, "range": "Low", "rof": "S/B", "capacity": "17+1", "mods": 3, "availability": "Uncommon", "cost": 3500, "tags": [], "features": ["SMART Link"], "flavorLine": "AI-assisted targeting compensates for movement, tremor, and interference." },
    { "id": "hk5-breach", "name": "HK-5 \"Breach\"", "category": "handguns", "skill": "handguns", "damage": 8, "acc": 0, "range": "Low", "rof": "S/B", "capacity": "10+1", "mods": 2, "availability": "Uncommon", "cost": 2400, "tags": [], "flavorLine": "It is not pretty. It hits harder than anything else at this price." },
    { "id": "bdf-oni", "name": "BDF Oni", "category": "handguns", "skill": "handguns", "damage": 9, "acc": 1, "range": "Low", "rof": "S/B", "capacity": "10+1", "mods": 2, "availability": "Rare", "cost": 7500, "tags": ["AP"], "flavorLine": "Engraved at the slide, balanced to its owner's grip, chambered for armor-penetrating rounds as standard." },

    { "id": "chatter", "name": "\"Chatter\"", "category": "smgs", "skill": "smgs", "damage": 5, "acc": 0, "range": "Medium", "rof": "S/B/F", "capacity": "25+1", "mods": 0, "availability": "Common", "cost": 300, "tags": [], "flavorLine": "Spray it in the right direction and hope the other person has somewhere to be." },
    { "id": "ads-cs4-whisper", "name": "ADS CS-4 \"Whisper\"", "category": "smgs", "skill": "smgs", "damage": 5, "acc": 2, "range": "Medium", "rof": "S/B", "capacity": "30+1", "mods": 2, "availability": "Uncommon", "cost": 2200, "tags": [], "features": ["Suppressor"], "flavorLine": "Built for covert operations and VIP protection where noise is its own problem." },
    { "id": "ts7-bulldog", "name": "TS-7 \"Bulldog\"", "category": "smgs", "skill": "smgs", "damage": 6, "acc": 1, "range": "Medium", "rof": "S/B/F", "capacity": "30+1", "mods": 1, "availability": "Common", "cost": 1600, "tags": [], "flavorLine": "Front-line hardware for people who use it every day." },
    { "id": "hs3-phantom", "name": "HS-3 \"Phantom\"", "category": "smgs", "skill": "smgs", "damage": 7, "acc": 1, "range": "Medium", "rof": "S/B/F", "capacity": "25+1", "mods": 1, "availability": "Uncommon", "cost": 3200, "tags": ["Volatile"], "flavorLine": "\"An experimental fusion of ballistic and directed-energy discharge.\"" },
    { "id": "vs12-rampart", "name": "VS-12 \"Rampart\"", "category": "smgs", "skill": "smgs", "damage": 7, "acc": 0, "range": "Medium", "rof": "S/B/F", "capacity": "40+1", "mods": 1, "availability": "Uncommon", "cost": 2400, "tags": [], "flavorLine": "A squad support tool. The drum magazine keeps it running through sustained fire." },
    { "id": "ads-sr1-specter", "name": "ADS SR-1 \"Specter\"", "category": "smgs", "skill": "smgs", "damage": 6, "acc": 2, "range": "Medium", "rof": "S/B/F", "capacity": "30+1", "mods": 2, "availability": "Rare", "cost": 6000, "tags": [], "features": ["Suppressor"], "flavorLine": "Suppressed, accurate, and fully controllable on full-auto." },

    { "id": "fg1-thunderclap", "name": "FG-1 \"Thunderclap\"", "category": "grenades", "skill": "melee", "damage": 10, "radius": "5m", "availability": "Uncommon", "cost": 400, "notes": "Frag", "flavorLine": "Hammerlock's standard fragmentation grenade -- the benchmark other frags are measured against." },
    { "id": "sg2-shockwave", "name": "SG-2 \"Shockwave\"", "category": "grenades", "skill": "melee", "radius": "10m", "availability": "Common", "cost": 200, "notes": "Stun, Non-lethal", "flavorLine": "Non-lethal concussive grenade for incapacitation and crowd control." },
    { "id": "eg3-blackout", "name": "EG-3 \"Blackout\"", "category": "grenades", "skill": "melee", "radius": "5m", "availability": "Uncommon", "cost": 600, "notes": "EMP", "flavorLine": "Precision-engineered to disable electronics and cybernetics without indiscriminate structural damage." },
    { "id": "vs3-curtain", "name": "VS-3 \"Curtain\"", "category": "grenades", "skill": "melee", "radius": "10m", "availability": "Common", "cost": 150, "notes": "Smoke", "flavorLine": "A ten-meter obscurement cloud that lasts long enough to matter." },
    { "id": "ig7-cinder", "name": "IG-7 \"Cinder\"", "category": "grenades", "skill": "melee", "damage": "6/round", "radius": "5m", "availability": "Rare", "cost": 800, "notes": "Incendiary, Burning", "flavorLine": "Creates a sustained burn zone for area denial. Hammerlock recommends against indoor use." },
    { "id": "junk-bomb", "name": "\"Junk Bomb\"", "category": "grenades", "skill": "melee", "damage": "Varies", "radius": "Varies", "availability": "Common", "cost": 75, "notes": "Unstable -- roll 1d4 (1 Frag DMG8/5m, 2 Stun 10m non-lethal, 3 Smoke 10m, 4 Dud)", "flavorLine": "Somebody's best guess at a grenade, assembled from optimism and scavenged casings." },
    { "id": "star-dust-grenade", "name": "Star Dust Grenade", "category": "grenades", "skill": "melee", "damage": "1/round", "radius": "5m cloud", "availability": "By Practice", "cost": 600, "tags": ["Withering"], "notes": "Anti-Regen -- disperses a silver-laced cloud making regeneration impossible for 1d4+1 minutes", "flavorLine": "Developed by those who hunt lycanthropes and their kindred." },
    { "id": "sunburst-grenade", "name": "Sunburst Grenade", "category": "grenades", "skill": "melee", "radius": "10m", "availability": "By Practice", "cost": 500, "tags": ["Withering", "Stunning"], "notes": "Withering (Undead) -- a modified flashbang; the concussive effect hits everyone in range regardless of supernatural status", "flavorLine": "A concentrated burst of UV radiation alongside a standard concussive discharge." },

    { "id": "vr8-sentinel", "name": "VR-8 \"Sentinel\"", "category": "urbanRifles", "skill": "rifles", "damage": 7, "acc": 1, "range": "Long", "rof": "S/B/F", "capacity": "30+1", "mods": 1, "damageType": "Ballistic", "availability": "Common", "cost": 2800, "tags": [], "flavorLine": "What front-line professionals carry when they expect a long field assignment." },
    { "id": "ar9x-guardian", "name": "AR-9X \"Guardian\"", "category": "urbanRifles", "skill": "rifles", "damage": 7, "acc": 2, "range": "Long", "rof": "S/B/F", "capacity": "30+1", "mods": 1, "damageType": "Ballistic", "availability": "Uncommon", "cost": 4500, "tags": [], "features": ["SMART Link"], "flavorLine": "AI targeting compensation for marksman precision without giving up full-auto." },

    { "id": "the-preacher", "name": "\"The Preacher\"", "category": "shotguns", "skill": "rifles", "damage": 8, "acc": 0, "range": "Low", "rof": "S", "capacity": "2", "mods": 0, "damageType": "Ballistic", "availability": "Common", "cost": 400, "tags": ["Spread"], "features": ["Conceal"], "flavorLine": "A sawed-off shotgun. No ACC bonus, because at that distance ACC is a formality." },
    { "id": "sg88-siege-breaker", "name": "SG-88 \"Siege Breaker\"", "category": "shotguns", "skill": "rifles", "damage": 9, "acc": 1, "range": "Medium", "rof": "S/B", "capacity": "8+1", "mods": 2, "damageType": "Ballistic", "availability": "Uncommon", "cost": 3200, "tags": ["Spread"], "flavorLine": "Semi-automatic with burst capability. Will breach most doors and whoever's behind them." },

    { "id": "bdf-tora", "name": "BDF Tora", "category": "sniperRifles", "skill": "rifles", "damage": 9, "acc": 5, "range": "Long", "rof": "S", "capacity": "10+1", "mods": 1, "damageType": "Ballistic", "availability": "Rare", "cost": 11000, "tags": [], "features": ["Scope"], "flavorLine": "A marksman rifle built around a tradition of marksmanship. Single shot only, by design." },
    { "id": "bdf-ryu", "name": "BDF Ryū", "category": "sniperRifles", "skill": "rifles", "damage": 10, "acc": 3, "range": "Extreme", "rof": "S", "capacity": "5+1", "mods": 0, "damageType": "Ballistic", "availability": "Exotic", "cost": 20000, "tags": [], "features": ["Scope"], "flavorLine": "Exists at a distance most weapons can't reach and most operators can't fully use." },
    { "id": "vr50-verdict", "name": "VR-50 \"Verdict\"", "category": "sniperRifles", "skill": "rifles", "damage": 12, "acc": 2, "range": "Extreme", "rof": "S", "capacity": "3+1", "mods": 1, "damageType": "Ballistic", "availability": "Rare", "cost": 14000, "tags": ["Anti-Materiel"], "features": ["Bipod Mount", "Scope"], "flavorLine": "Not a sniper rifle -- an anti-materiel rifle. Built to destroy things, not just people." },

    { "id": "vlw6-titan", "name": "VLW-6 \"Titan\"", "category": "heavyWeapons", "skill": "heavy-weapons", "damage": 7, "acc": 0, "range": "Long", "rof": "S/B/F", "capacity": "100 (belt)", "mods": 1, "damageType": "Ballistic", "availability": "Uncommon", "cost": 3500, "tags": ["Suppression"], "features": ["Bipod Mount"], "notes": "Two-Handed", "flavorLine": "Belt-fed, bipod-equipped, built for sustained suppressive fire." },
    { "id": "vhw12-ironwall", "name": "VHW-12 \"Ironwall\"", "category": "heavyWeapons", "skill": "heavy-weapons", "damage": 9, "acc": 0, "range": "Long", "rof": "S/B/F", "capacity": "200 (belt)", "mods": 1, "damageType": "Ballistic", "availability": "Rare", "cost": 9500, "tags": ["Suppression"], "features": ["Vehicle Mount"], "notes": "Two-Handed; requires a proper mount, not just a bipod", "flavorLine": "Larger caliber, higher damage, a 200-round belt that turns a position into a problem." },
    { "id": "hgl4-anvil", "name": "HGL-4 \"Anvil\"", "category": "heavyWeapons", "skill": "heavy-weapons", "damage": 9, "acc": 1, "range": "Medium", "rof": "S", "capacity": "6", "mods": 1, "damageType": "Ballistic", "availability": "Rare", "cost": 7000, "tags": ["Area (5m)", "Blast"], "notes": "Two-Handed; six-round revolving grenade launcher, ammunition sold in four varieties", "flavorLine": "Area denial and indirect fire -- aim at the vicinity, let the blast radius handle the rest." },
    { "id": "hrl1-thunderhead", "name": "HRL-1 \"Thunderhead\"", "category": "heavyWeapons", "skill": "heavy-weapons", "damage": 15, "acc": 0, "range": "Long", "rof": "S", "capacity": "1", "mods": 0, "availability": "Exotic", "cost": 15000, "tags": ["Blast (10m)", "Siege"], "notes": "Two-Handed; one round, then a full action to reload", "flavorLine": "Single shot, shoulder-fired, built for targets that believe cover will protect them." },
    { "id": "hft3-hellmouth", "name": "HFT-3 \"Hellmouth\"", "category": "heavyWeapons", "skill": "heavy-weapons", "damage": "6/round", "acc": 0, "range": "Low", "rof": "Continuous", "capacity": "10 bursts", "mods": 0, "damageType": "Burning", "availability": "Rare", "cost": 6000, "tags": ["Burning", "Area (cone)"], "notes": "Two-Handed; ongoing damage every round until the target is no longer burning", "flavorLine": "Ten bursts of sustained burning discharge in a forward cone." },
    { "id": "hxc1-absolute", "name": "HXC-1 \"Absolute\"", "category": "heavyWeapons", "skill": "heavy-weapons", "damage": 20, "acc": 0, "range": "Medium", "rof": "S", "capacity": "1", "mods": 0, "availability": "By Contract", "cost": "By Contract", "tags": ["Blast (15m)", "Siege"], "features": ["Vehicle Mount"], "notes": "Two-Handed; a man-portable siege weapon", "flavorLine": "There is no diplomatic way to describe what the Absolute does." },

    { "id": "ads-le4-falcon", "name": "ADS LE-4 \"Falcon\"", "category": "beamSidearms", "skill": "beam-weapons", "damage": 5, "acc": 2, "range": "Medium", "rof": "S/B", "capacity": "20", "mods": 2, "damageType": "Energy", "availability": "Uncommon", "cost": 2500, "tags": ["No Recoil"], "flavorLine": "Compact laser sidearm: no recoil, no muzzle flash, no ballistic signature." },

    { "id": "ads-ls7-whisper-e", "name": "ADS LS-7 \"Whisper-E\"", "category": "beamLongarms", "skill": "beam-weapons", "damage": 6, "acc": 1, "range": "Medium", "rof": "S/B/F", "capacity": "30", "mods": 1, "damageType": "Energy", "availability": "Uncommon", "cost": 3200, "tags": ["No Recoil"], "flavorLine": "The Falcon's platform extended into an SMG form factor." },
    { "id": "orion-pc6-inferno", "name": "Orion PC-6 \"Inferno\"", "category": "beamLongarms", "skill": "beam-weapons", "damage": 8, "acc": 0, "range": "Long", "rof": "S/B", "capacity": "15", "mods": 1, "damageType": "Energy", "availability": "Uncommon", "cost": 4500, "tags": ["Burning", "Volatile"], "flavorLine": "A plasma discharge that keeps burning after the initial hit." },
    { "id": "orion-pb2-oblivion", "name": "Orion PB-2 \"Oblivion\"", "category": "beamLongarms", "skill": "beam-weapons", "damage": 10, "acc": 2, "range": "Long", "rof": "S", "capacity": "5", "mods": 0, "damageType": "Energy", "availability": "Rare", "cost": 11000, "tags": ["Disintegration", "Volatile"], "flavorLine": "A focused particle beam that disrupts matter at a molecular level on contact." },

    { "id": "argus-er3-nullifier", "name": "Argus ER-3 \"Nullifier\"", "category": "beamSpecialist", "skill": "beam-weapons", "damage": 4, "acc": 1, "range": "Long", "rof": "S/B", "capacity": "10", "mods": 2, "damageType": "Energy", "availability": "Uncommon", "cost": 3800, "tags": ["EMP"], "features": ["SMART Link"], "flavorLine": "Against an unaugmented target, underwhelming. Against a heavily cybered operative, decisive." },

    { "id": "hammerlock-pc1-sundown", "name": "Hammerlock PC-1 \"Sundown\"", "category": "beamHeavy", "skill": "beam-weapons", "damage": 12, "acc": 0, "range": "Medium", "rof": "S", "capacity": "1", "mods": 0, "damageType": "Energy", "availability": "By Contract", "cost": "By Contract", "tags": ["Area (5m)", "Blast", "Siege"], "features": ["Vehicle Mount Required"], "flavorLine": "What it would take to make directed energy weapons worse, in the best possible way." },

    { "id": "urban-recurve-bow", "name": "Urban Recurve Bow", "category": "archery", "skill": "archery", "damage": 6, "acc": 1, "range": "Medium", "rof": "S", "mods": 2, "availability": "Common", "cost": 400, "tags": ["Silent", "Payload"], "flavorLine": "A takedown recurve bow collapsible into a configuration that fits a gear bag." },
    { "id": "bdf-yumi", "name": "BDF Yumi", "category": "archery", "skill": "archery", "damage": 8, "acc": 2, "range": "Long", "rof": "S", "mods": 1, "availability": "Rare", "cost": 6000, "tags": ["Silent", "Payload"], "flavorLine": "A traditional longbow reinterpreted in carbon fiber, hand-fitted to its owner's draw length." },
    { "id": "ads-tc1-strix", "name": "ADS TC-1 \"Strix\"", "category": "archery", "skill": "archery", "damage": 7, "acc": 2, "range": "Medium", "rof": "S/B", "capacity": "6", "mods": 2, "availability": "Uncommon", "cost": 2800, "tags": ["Silent", "Payload"], "features": ["Conceal"], "flavorLine": "A magazine-fed tactical crossbow with a folding stock and repeating bolt mechanism." }
  ],

  /* ARMOR -- PROT is a die the player rolls physically (per Decision 11, the
     app never rolls dice), RES is a flat reduction, INT is a depleting
     resource. `armorRules` documents the mechanic as reference text/formulas,
     the way `ip.statIncreaseCost.formula` documents IP math, rather than the
     engine executing any of it -- that computation lands with the engine
     batch. Head/Hand armor doesn't roll PROT or track INT at all; it grants a
     named `feature` instead (see `armorFeatureGlossary`). */
  "armorRules": {
    "protNote": "Roll the armor's PROT die and subtract the result from incoming damage before it reaches you. PROT applies to all damage types.",
    "resNote": "A flat reduction applied when the armor's type matches the incoming attack. Base armor is Kinetic -- RES applies to Blade, Blunt and Ballistic damage, not Energy or Magical, unless upgraded with Ablative Plating or Warding.",
    "integrityNote": "A resource, not a fixed stat. After any encounter where hits were taken, roll a die by encounter difficulty and subtract from the armor's INT pool.",
    "integrityLossByDifficulty": { "easy": "1d4", "medium": "1d6", "hard": "1d8", "legendary": "1d10" },
    "compromisedNote": "At 0 INT the armor is Compromised: PROT still rolls, but RES no longer applies until repaired.",
    "repairNote": "A Field Repair Kit restores 1d6 INT with roughly an hour of work. Armor with the Rapid Repair feature restores INT as an Action instead.",
    /* Read by Engine.armorState()/resolveHit() (combat plan Session 3,
       Decision 99). Base armor is Kinetic; an upgrade's `resAgainst` extends
       RES to another class, `integrityBonus` raises max INT per install.
       Coverage says which body parts a piece protects -- a hit anywhere else
       bypasses it entirely (Gear, Armor Properties). A custom piece with no
       `coverage` is treated as "light": all body armor covers the torso
       (Decision 98, CQ7). */
    "baseResAgainst": ["kinetic"],
    "coverageLocations": {
      "light":  ["torso"],
      "medium": ["torso", "right-arm", "left-arm"],
      "full":   ["torso", "right-arm", "left-arm", "right-leg", "left-leg"]
    },
    "defaultCoverage": "light",
    "defaultHitLocation": "torso",
    "soakedIntegrityLoss": 1,
    "soakedNote": "A hit the armor stops completely still costs it 1 Integrity.",
    "scrapNote": "Armor driven to 0 Integrity by Massive damage is scrap. It can't be repaired.",
    /* Loadout & recovery (combat plan Session 4, Decision 100). Upgrades take
       one mod slot each and need the armor's quality to be at least the
       upgrade's `minQuality`, ranked by `qualityOrder`; an upgrade marked
       `repeatable` can go in more than one slot. The Field Repair Kit's die
       and the wear dice above are what the player rolls -- the app checks
       the number fits the die and never rolls it. */
    "qualityOrder": ["Low", "Mid", "High"],
    "slotNames": { "body": "Body armor", "head": "Head", "hand": "Hands" },
    "coverageNames": { "light": "Light coverage (torso)", "medium": "Medium coverage (torso, arms)", "full": "Full coverage (torso, arms, legs)" },
    "repairKitDie": "1d6",
    "repairKitNote": "A Field Repair Kit restores 1d6 Integrity with about an hour of work. 5 uses to a kit.",
    "armorerNote": "An armorer or a base restores it completely. Time varies by quality.",
    "wearNote": "Anyone who took a hit rolls once for wear after the fight, whether the armor or your body took it. Your GM names the die."
  },
  /* NATURAL ARMOR (Decision 104) -- the armor a body has without wearing any.
     Sources are `grants` of type "naturalArmor" on an advantage (`perRank`),
     a Major Milestone (`amount`, once per time taken) or a specialization
     option. A grant with `while` is conditional: shown, never summed, and the
     hit panel asks whether it's on. `stat` + `plus` reads a stat's modifier
     (Iron Shirt: BOD bonus + 1); `resAgainst` extends the classes it answers
     (Resilient Spirit: Warding). Read by Engine.naturalArmor()/resolveHit(). */
  "naturalArmorRules": {
    "flagged": true,
    "flagNote": "F25 -- the CRB grants Natural Armor in four places but never says how it applies to a hit. Only 'unaffected by Armor Piercing' (Thick Skin) and 'treated as Warding' (Waning Moon) are stated. Stubbed: a flat reduction after PROT and RES, on every body part, Kinetic only (like base RES) unless Warding extends it, ignores AP, skipped by Massive; sources stack.",
    "playerNote": "How natural armor stops a hit is still being settled. For now it takes a flat amount off Blade, Blunt and Ballistic damage anywhere on the body, after your armor, and armor-piercing doesn't get past it. Massive damage ignores it.",
    "resAgainst": ["kinetic"],
    "ignoresAp": true,
    "text": "Toughness you don't take off at night. It stops damage after your worn armor does, wherever the hit lands."
  },
  "armorFeatureGlossary": [
    { "id": "Concealable", "description": "Thin and lightweight enough to wear discreetly beneath a hoodie or blazer without printing. Standard visual security checks don't detect it; specialized scanning or a Perception check against a threshold may." },
    { "id": "Dampening", "description": "Engineered to reduce sensor detection -- disperses heat signature, reduces optical reflection, dampens sound. +1 to Stealth against sensor-based detection. One Dampening feature covers one detection type (Thermal/Optical/Sound), specified at manufacture." },
    { "id": "Integrated Comms", "description": "A throat-mic-and-earpiece communications system built into the armor, encrypted by default at the armor's quality tier." },
    { "id": "Magnetic Stow Point", "description": "High-strength magnetic mounting points for hands-free storage of metallic objects. Items stored this way can be drawn as a free action." },
    { "id": "Rapid Repair", "description": "Modular panels can be swapped in the field. A Field Repair Kit on armor with this feature is an Action rather than requiring extended downtime." },
    { "id": "Self-Healing", "afterEncounter": { "checkDie": "1d4", "succeedsOn": 3, "restoresDie": "1d4" }, "description": "After each encounter, roll 1d4 -- on a 3 or higher the armor regains 1d4 INT without a repair kit or armorer, up to its maximum." },
    { "id": "Headshot Defense", "redirect": { "from": "head", "to": "torso" }, "description": "Called shots to the head are treated as hits to the torso for damage purposes; the body armor (if any) still applies normally." },
    { "id": "Gas / Sonic / Dazzle Immunity", "description": "The sealed environment of the helmet provides complete immunity to atmospheric effects, sonic disruption, and visual dazzle weapons." },
    { "id": "Augmentable Senses", "description": "The helmet's sensor suite can be configured for infrared, ultraviolet, or thermal imaging; switching modes is a free action." },
    { "id": "Elemental Immunity", "description": "Full immunity to the glove's damage type for exposures under six seconds; sustained exposure beyond six seconds reduces to 50% damage reduction. Rated for the hands only." }
  ],
  "armorUpgradeGlossary": [
    { "id": "Ablative Plating", "minQuality": "Mid", "resAgainst": "energy", "description": "Grants the armor's full RES bonus against Energy damage in addition to its standard Kinetic application." },
    { "id": "EMP Shielding", "description": "Grants +10% EMP resistance. Reduces cascade failure risk for characters with significant cyberware when hit by EMP sources." },
    { "id": "HUDsync", "description": "Paired with a HUDsync-compatible helmet, displays real-time armor status, weapon systems, and linked device information in the visor." },
    { "id": "Resistance", "repeatable": true, "description": "Specialized lining granting 50% damage reduction against a specified environmental type (Thermal / Electric / Freezing). Each installation covers one type; multiple can be installed in separate slots.",
      "flagged": true, "flagNote": "F23 -- where the 50% reduction sits against PROT and RES is unstated. The hit resolver does not apply it; it reminds the player instead.",
      "playerNote": "The hit calculator doesn't take this lining's 50% off for you yet. Work it out with your GM and adjust the damage by hand." },
    { "id": "Tri-Weave", "minQuality": "Mid", "integrityBonus": 10, "repeatable": true, "description": "Grants +10 INT to the armor's integrity pool. Can be installed multiple times in separate slots for cumulative effect." },
    { "id": "Warding", "minQuality": "Mid", "resAgainst": "magical", "availability": "By Practice", "description": "Extends the armor's RES bonus to magical damage. Requires finding a practitioner willing to perform the work; cannot be bought with Çredits alone." }
  ],

  "armor": [
    { "id": "reinforced-denim-vest", "name": "Reinforced Denim Vest", "slot": "body", "coverage": "light", "prot": "1d4", "res": 4, "integrity": 10, "quality": "Low", "material": "Medium", "availability": "Common", "mods": 0, "cost": 150, "flavorLine": "Denim with ballistic padding stitched between lining and shell. Looks like a work vest because it mostly is one." },
    { "id": "heavy-denim-vest", "name": "Heavy Denim Vest", "slot": "body", "coverage": "light", "prot": "1d4", "res": 6, "integrity": 10, "quality": "Low", "material": "Heavy", "availability": "Common", "mods": 0, "cost": 175, "flavorLine": "The armor of people who can't afford to look like they're wearing armor." },
    { "id": "kevlar-vest", "name": "Kevlar Vest", "slot": "body", "coverage": "light", "prot": "1d6", "res": 2, "integrity": 20, "quality": "Mid", "material": "Light", "availability": "Common", "mods": 1, "cost": 500, "flavorLine": "Stops most handgun rounds at close range and takes the edge off everything else." },
    { "id": "urban-tactics-vest", "name": "Urban Tactics Vest", "slot": "body", "coverage": "light", "prot": "1d6", "res": 2, "integrity": 20, "quality": "Mid", "material": "Light", "availability": "Uncommon", "mods": 2, "cost": 600, "flavorLine": "A modular soft armor vest with a MOLLE-compatible exterior and two upgrade slots." },
    { "id": "kevlar-reinforced-leather-vest", "name": "Kevlar Reinforced Leather Vest", "slot": "body", "coverage": "light", "prot": "1d6", "res": 4, "integrity": 20, "quality": "Mid", "material": "Medium", "availability": "Common", "mods": 1, "cost": 600, "flavorLine": "Leather over a kevlar substrate: the impact resistance of the synthetic, the cut resistance of the leather." },
    { "id": "hd-cf200-tactical-vest", "name": "HD CF 200 Tactical Vest", "slot": "body", "coverage": "light", "prot": "1d6", "res": 4, "integrity": 20, "quality": "Mid", "material": "Medium", "availability": "Rare", "mods": 3, "cost": 900, "flavorLine": "Carbon fiber plating over a kevlar backing, in a low-profile carrier." },
    { "id": "darksun-elite-undershirt", "name": "DarkSun Elite Undershirt", "slot": "body", "coverage": "light", "prot": "1d8", "res": 2, "integrity": 30, "quality": "High", "material": "Light", "availability": "Uncommon", "mods": 3, "cost": 1400, "preInstalledFeatures": ["Concealable"], "flavorLine": "High quality protection that looks like nothing at all." },
    { "id": "specops-vest", "name": "SpecOps Vest", "slot": "body", "coverage": "light", "prot": "1d8", "res": 6, "integrity": 30, "quality": "High", "material": "Heavy", "availability": "Uncommon", "mods": 3, "cost": 1800, "preInstalledFeatures": ["Rapid Repair"], "flavorLine": "Military-grade hard plate carrier. Not subtle, not light, and not designed to be either." },

    { "id": "denim-jacket", "name": "Denim Jacket", "slot": "body", "coverage": "medium", "prot": "1d4", "res": 2, "integrity": 10, "quality": "Low", "material": "Light", "availability": "Common", "mods": 0, "cost": 125, "flavorLine": "A denim jacket is a denim jacket. Nobody looks twice." },
    { "id": "leather-jacket", "name": "Leather Jacket", "slot": "body", "coverage": "medium", "prot": "1d4", "res": 2, "integrity": 10, "quality": "Low", "material": "Light", "availability": "Uncommon", "mods": 1, "cost": 175, "flavorLine": "Real leather over a synthetic impact layer -- gets better with wear." },
    { "id": "road-warriors-jacket", "name": "Road Warrior's Jacket", "slot": "body", "coverage": "medium", "prot": "1d4", "res": 6, "integrity": 10, "quality": "Low", "material": "Heavy", "availability": "Uncommon", "mods": 1, "cost": 300, "flavorLine": "Originally for motorcycle riders, repurposed by anyone who spends time being thrown against walls." },
    { "id": "darksun-streetweave", "name": "DarkSun Streetweave", "slot": "body", "coverage": "medium", "prot": "1d6", "res": 2, "integrity": 20, "quality": "Mid", "material": "Light", "availability": "Rare", "mods": 3, "cost": 1000, "preInstalledFeatures": ["Concealable"], "flavorLine": "Sits at the intersection of street fashion and serious protection." },
    { "id": "ranger-protection-armor", "name": "Ranger Protection Armor", "slot": "body", "coverage": "medium", "prot": "1d6", "res": 6, "integrity": 20, "quality": "Mid", "material": "Heavy", "availability": "Uncommon", "mods": 2, "cost": 1000, "flavorLine": "A working jacket that happens to work in the city -- field work, perimeter duty, extended operations." },
    { "id": "darksun-jb6-sleekwear", "name": "DarkSun JB-6 Sleekwear", "slot": "body", "coverage": "medium", "prot": "1d6", "res": 6, "integrity": 20, "quality": "Mid", "material": "Heavy", "availability": "Rare", "mods": 3, "cost": 1200, "preInstalledFeatures": ["Concealable"], "flavorLine": "Heavy protective fiber in a cut that reads as fashion rather than tactical." },
    { "id": "plasteel-weave-jacket", "name": "Plasteel Weave Jacket", "slot": "body", "coverage": "medium", "prot": "1d8", "res": 4, "integrity": 30, "quality": "High", "material": "Medium", "availability": "Uncommon", "mods": 3, "cost": 1800, "preInstalledFeatures": ["Tri-Weave"], "flavorLine": "What you can wear into a business meeting and still feel protected leaving it." },
    { "id": "darksun-nightshade-armor", "name": "DarkSun Nightshade Armor", "slot": "body", "coverage": "medium", "prot": "1d8", "res": 4, "integrity": 30, "quality": "High", "material": "Medium", "availability": "Rare", "mods": 4, "cost": 2200, "preInstalledFeatures": ["Concealable", "Dampening"], "flavorLine": "Passes every visual inspection and most electronic ones." },

    { "id": "motorcycle-leathers", "name": "Motorcycle Leathers", "slot": "body", "coverage": "full", "prot": "1d4", "res": 4, "integrity": 10, "quality": "Low", "material": "Medium", "availability": "Uncommon", "mods": 1, "cost": 275, "flavorLine": "Built around the assumption that the wearer would eventually hit something at speed." },
    { "id": "ganglords-trench", "name": "Ganglord's Trench", "slot": "body", "coverage": "full", "prot": "1d4", "res": 6, "integrity": 10, "quality": "Low", "material": "Heavy", "availability": "Uncommon", "mods": 1, "cost": 300, "flavorLine": "The silhouette is distinctive and the protection is real. That's often the point." },
    { "id": "recon-unit-set", "name": "Recon Unit Set", "slot": "body", "coverage": "full", "prot": "1d6", "res": 2, "integrity": 20, "quality": "Mid", "material": "Light", "availability": "Uncommon", "mods": 2, "cost": 900, "flavorLine": "Built for operators who need to move quickly across difficult terrain while staying protected." },
    { "id": "security-rig", "name": "Security Rig", "slot": "body", "coverage": "full", "prot": "1d6", "res": 4, "integrity": 20, "quality": "Mid", "material": "Medium", "availability": "Common", "mods": 1, "cost": 900, "flavorLine": "Recognizable, professional-looking, protective enough for most security work." },
    { "id": "reinforced-merc-duster", "name": "Reinforced Merc Duster", "slot": "body", "coverage": "full", "prot": "1d6", "res": 4, "integrity": 20, "quality": "Mid", "material": "Medium", "availability": "Uncommon", "mods": 2, "cost": 1000, "flavorLine": "Full coverage without looking like a tactical rig -- the reinforcement is underneath." },
    { "id": "guardian-suit", "name": "Guardian Suit", "slot": "body", "coverage": "full", "prot": "1d6", "res": 6, "integrity": 20, "quality": "Mid", "material": "Heavy", "availability": "Common", "mods": 1, "cost": 1000, "flavorLine": "For sustained use in hostile environments -- the job description includes armed opposition." },
    { "id": "bdf-viper-stealth-suit", "name": "BDF Viper Stealth Suit", "slot": "body", "coverage": "full", "prot": "1d8", "res": 2, "integrity": 30, "quality": "High", "material": "Light", "availability": "Rare", "mods": 4, "cost": 3200, "preInstalledFeatures": ["Concealable", "Dampening"], "flavorLine": "What the Ronin wears when the job requires moving through the city undetected." },
    { "id": "hd-recon-stealth-armor", "name": "HD Recon Stealth Armor", "slot": "body", "coverage": "full", "prot": "1d8", "res": 4, "integrity": 30, "quality": "High", "material": "Medium", "availability": "Rare", "mods": 4, "cost": 3500, "preInstalledFeatures": ["Dampening", "Integrated Comms"], "flavorLine": "Sensor-dampened, communication-integrated, built for extended reconnaissance." },
    { "id": "hammerlock-reaper-overcoat", "name": "Hammerlock Reaper Overcoat", "slot": "body", "coverage": "full", "prot": "1d8", "res": 6, "integrity": 30, "quality": "High", "material": "Heavy", "availability": "Rare", "mods": 4, "cost": 4000, "preInstalledFeatures": ["Self-Healing", "Magnetic Stow Point"], "flavorLine": "Built for operators who expect heavy contact and intend to walk away from it." },

    { "id": "motorcycle-helmet", "name": "Motorcycle Helmet", "slot": "head", "quality": "Low", "material": "Light", "availability": "Common", "cost": 150, "feature": "Headshot Defense", "flavorLine": "Costs less than a decent meal out. The visor scratches easily." },
    { "id": "ballistic-nylon-helmet", "name": "Ballistic Nylon Helmet", "slot": "head", "quality": "Mid", "material": "Medium", "availability": "Common", "cost": 400, "feature": "Headshot Defense", "flavorLine": "Worn by security contractors who've decided head protection is worth the visibility cost." },
    { "id": "m88a2-enhanced-helmet", "name": "M-88A2 Enhanced Helmet", "slot": "head", "quality": "Mid", "material": "Heavy", "availability": "Uncommon", "cost": 700, "feature": "Headshot Defense", "flavorLine": "Military surplus in origin, still military-grade in performance." },
    { "id": "sentinel-vanguard-helmet", "name": "Sentinel Vanguard Helmet", "slot": "head", "quality": "High", "material": "Light", "availability": "Uncommon", "cost": 2000, "feature": "Gas / Sonic / Dazzle Immunity", "flavorLine": "A sealed tactical helmet for operators who expect the environment itself to be weaponized." },
    { "id": "ghostsuit-helmet", "name": "Ghostsuit Helmet", "slot": "head", "quality": "High", "material": "Exotic", "availability": "Rare", "cost": 3500, "feature": "Augmentable Senses", "notes": "IR / UV / Thermal imaging built into the visor", "flavorLine": "The world looks different through a Ghostsuit -- sometimes literally." },
    { "id": "hacking-visor", "name": "Hacking Visor", "slot": "head", "quality": "Custom", "material": "Exotic", "availability": "By Contract", "cost": null, "notes": "+5 to electronic interface and hacking checks", "flavorLine": "Not available through standard channels. The people who use these know how to find them." },

    { "id": "infernoshield-gloves", "name": "InfernoShield Gloves", "slot": "hand", "quality": "Mid", "material": "Heavy", "availability": "Uncommon", "cost": 600, "feature": "Elemental Immunity", "notes": "Heat immunity (<6 sec), 50% damage reduction (>6 sec)", "flavorLine": "Rated for brief contact with high-temperature surfaces." },
    { "id": "zapgrip-gloves", "name": "ZapGrip Gloves", "slot": "hand", "quality": "Mid", "material": "Heavy", "availability": "Uncommon", "cost": 600, "feature": "Elemental Immunity", "notes": "Electric immunity (<6 sec), 50% damage reduction (>6 sec)", "flavorLine": "Faraday-woven gloves providing electrical isolation for brief contact with live systems." },
    { "id": "chemguard-gloves", "name": "ChemGuard Gloves", "slot": "hand", "quality": "Mid", "material": "Heavy", "availability": "Uncommon", "cost": 600, "feature": "Elemental Immunity", "notes": "Acid immunity (<6 sec), 50% damage reduction (>6 sec)", "flavorLine": "Acid-resistant composite gloves rated for brief immersion in corrosive substances." },
    { "id": "hacking-gloves", "name": "Hacking Gloves", "slot": "hand", "quality": "High", "material": "Exotic", "availability": "Rare", "cost": 2500, "notes": "+2 to electronic interface and hacking checks", "flavorLine": "Embedded sensor arrays and haptic feedback enhance interaction with electronic systems." },
    { "id": "smartlink-gloves", "name": "SMARTLink Gloves", "slot": "hand", "quality": "High", "material": "Exotic", "availability": "Rare", "cost": 2800, "notes": "+2 ACC when using SMARTLink-compatible weapons", "flavorLine": "Extends a weapon's SMARTLink targeting system through the grip." },
    { "id": "precisiongrip-gloves", "name": "PrecisionGrip Gloves", "slot": "hand", "quality": "High", "material": "Exotic", "availability": "Rare", "cost": 2500, "notes": "+2 to precision skill checks", "flavorLine": "High-sensitivity haptic gloves for surgery, lockpicking, or any margin measured in millimeters." }
  ],

  /* EQUIPMENT (W17 + W27, Decision 121) -- everything carried that isn't a
     weapon or armor: Gear's Equipment chapter (Tech & Communications, Field
     & Recovery, Tools & Field Gear, Clothing) and the Magic chapter's Tools
     of the Trade (raw materials, ritual supplies, inscription blanks and
     inscribed objects). Transcribed from the two chapters' own tables;
     Transportation, Food & Drink, Lodging and Magic's Services are paid for
     rather than carried, so they're logged under Credits instead.
       cost        a number when the book prices it; null ("Varies", "1,500Ç+")
                   can be added but not bought, and `costText` says what it said
       pack/unit   how many one purchase adds (a strip of 5 doses, a deck of 5)
       consumable  used up: stacks as a count, and "Use one" takes one off
       charges     an inscribed Talisman's charges (3 Once-Living, 5 Durable);
                   `startsEmpty` when the book sells it empty
       spell       the Book of Known Spells id it holds, when the book has it;
                   `spellName` is the name the shop prints either way */
  "equipmentCategories": [
    { "id": "tech", "name": "Tech & Communications", "book": "Gear" },
    { "id": "medical", "name": "Field & Recovery", "book": "Gear" },
    { "id": "tools", "name": "Tools & Field Gear", "book": "Gear" },
    { "id": "clothing", "name": "Clothing", "book": "Gear" },
    { "id": "ammo", "name": "Ammo", "book": "Gear", "note": "Rounds, cells and arrowheads. Each fits the weapons its notes name." },
    { "id": "materials", "name": "Raw Materials", "book": "Magic" },
    { "id": "ritual", "name": "Ritual Supplies", "book": "Magic", "note": "Not mechanically required for Enchantment or Alchemy. They support the workspace." },
    { "id": "blanks", "name": "Inscription Blanks", "book": "Magic", "note": "Any of these can be a Talisman base. Material decides charges and recharging." },
    { "id": "singleUse", "name": "Single-Use Talismans", "book": "Magic", "note": "Degradable material. One charge, destroyed on use." },
    { "id": "charged", "name": "Charged Talismans", "book": "Magic", "note": "Once-Living material. Three charges, recharged by an Arcanist at 1 TOL each after re-inscription." },
    { "id": "durable", "name": "Durable Talismans", "book": "Magic", "note": "Inorganic material. Five charges, recharged with TOL alone." },
    { "id": "wards", "name": "Wards and Traps", "book": "Magic", "note": "Placed rather than carried. Proximity triggers, set at inscription." },
    { "id": "artifacts", "name": "Artifacts", "book": "Magic", "note": "Artifacts cannot be jammed, shorted, or traced, and an EMP that takes down a crew's tech leaves them working." }
  ],
  "equipment": [
    { "id": "slate", "name": "Slate", "category": "tech", "availability": "Common", "cost": 250, "notes": "Handheld PC and commlink", "flavorLine": "The standard mobile device of NYTE City: part handheld PC, part commlink, part everything else." },
    { "id": "monocle", "name": "Monocle", "category": "tech", "availability": "Common", "cost": 375, "notes": "Retractable AR lens", "flavorLine": "A retractable lens worn over one eye providing video conferencing, augmented reality overlays, and heads-up data display." },
    { "id": "commlink", "name": "CommLINK", "category": "tech", "availability": "Common", "cost": 95, "notes": "Standard field radio link", "flavorLine": "A standard radio link for field operations: straightforward, reliable, and unencrypted." },
    { "id": "mc-radio", "name": "MC-Radio", "category": "tech", "availability": "Common", "cost": 520, "notes": "Small radio transceiver", "flavorLine": "A small handheld radio transceiver for basic communication over moderate distances." },
    { "id": "smart-brace", "name": "SMART Brace", "category": "tech", "availability": "Common", "cost": null, "costText": "Varies", "notes": "Wrist-mounted comms platform", "flavorLine": "A wrist-mounted computer and communications platform running on SMART Link protocol." },
    { "id": "subvocal-commlink", "name": "Subvocal CommLINK", "category": "tech", "availability": "Uncommon", "cost": 385, "notes": "Short range encrypted, throat-mounted", "flavorLine": "A throat-mounted encrypted radio link that picks up subvocalizations rather than audible voice." },
    { "id": "smart-link", "name": "SMART Link", "category": "tech", "availability": "Uncommon", "cost": 150, "notes": "Neural-device interface", "flavorLine": "A neural interface that connects the user to SMART-compatible devices and weapons, enabling full SMART Targeting integration and high-tier tech interactions." },
    { "id": "smart-deck-i", "name": "SMART Deck I", "category": "tech", "availability": "Common", "cost": 800, "notes": "Entry LINK/terminal rig, +1 Interface", "flavorLine": "The entry-level terminal intrusion rig." },
    { "id": "smart-deck-ii", "name": "SMART Deck II", "category": "tech", "availability": "Uncommon", "cost": 2200, "notes": "Professional LINK/terminal rig, +2 Interface", "flavorLine": "A professional-grade intrusion platform running more sophisticated programs and handling higher-security terminal environments." },
    { "id": "smart-deck-iii", "name": "SMART Deck III", "category": "tech", "availability": "Rare", "cost": 5500, "notes": "Specialist LINK/terminal rig, +3 Interface", "flavorLine": "Specialist hardware for serious terminal intrusion." },
    { "id": "nanotech-disguise-kit", "name": "Nanotech Disguise Kit", "category": "tech", "availability": "Rare", "cost": 2800, "consumable": true, "notes": "Single use, 1 hour, full body", "flavorLine": "A single-use aerosol applicator containing nanoscale surface-alteration agents that restructure the appearance of skin, hair, and clothing across the full body." },
    { "id": "energy-shield-cartridge", "name": "Energy Shield Cartridge", "category": "tech", "availability": "Rare", "cost": 1800, "consumable": true, "notes": "Single use, SMART Brace required", "flavorLine": "A single-use cartridge that slots into a SMART Brace and auto-triggers against incoming ballistic or kinetic attacks." },
    { "id": "silver-card", "name": "Silver Card", "category": "medical", "availability": "Common", "cost": 800, "consumable": true, "action": "Fast", "notes": "Emergency medical beacon — 5 minute response", "flavorLine": "Healthcare that fits in your wallet." },
    { "id": "nanomed-kit", "name": "Nanomed Kit", "category": "medical", "availability": "Uncommon", "cost": 4500, "consumable": true, "action": "Fast", "notes": "Clears Conditions, stabilizes, regenerates for BOD rounds", "flavorLine": "A pressurized injector loaded with targeted nanites." },
    { "id": "quickstitch", "name": "Quickstitch", "category": "medical", "availability": "Common", "cost": 1500, "costText": "1,500Ç / strip of 5", "pack": 5, "unit": "dose", "consumable": true, "action": "Fast", "notes": "+2 Health Levels for the scene, 1 comes back out", "flavorLine": "A pressurized shot of adrenaline and coagulant, sold in strips of five." },
    { "id": "slowstitch", "name": "Slowstitch", "category": "medical", "availability": "Common", "cost": 1000, "costText": "1,000Ç / strip of 5", "pack": 5, "unit": "dose", "consumable": true, "action": "Fast", "notes": "+1 Health Level per dose, an hour owed per dose", "flavorLine": "A regenerative compound sold in strips of five." },
    { "id": "speed-heal", "name": "Speed Heal", "category": "medical", "availability": "Common", "cost": 2100, "costText": "2,100Ç / dose", "pack": 1, "unit": "dose", "consumable": true, "action": "Fast", "notes": "2× healing rate for 24 hours", "flavorLine": "Healthcare in a syringe." },
    { "id": "anodyne-hush", "name": "Anodyne \"Hush\"", "category": "medical", "availability": "Common", "cost": 250, "consumable": true, "action": "Fast", "notes": "−1 Pain Level for 1d4 rounds", "flavorLine": "A fast-acting nerve block." },
    { "id": "veloxin-12-red", "name": "Veloxin-12 \"Red\"", "category": "medical", "availability": "Rare", "cost": 900, "consumable": true, "action": "Fast", "notes": "+3 REF Skill Checks, then −3" },
    { "id": "somatrex-8-green", "name": "Somatrex-8 \"Green\"", "category": "medical", "availability": "Uncommon", "cost": 600, "consumable": true, "action": "Fast", "notes": "+3 BOD Skill Checks, then −3" },
    { "id": "cerebryx-5-blue", "name": "Cerebryx-5 \"Blue\"", "category": "medical", "availability": "Uncommon", "cost": 600, "consumable": true, "action": "Fast", "notes": "+3 INT Skill Checks, then −3" },
    { "id": "aurexa-3-yellow", "name": "Aurexa-3 \"Yellow\"", "category": "medical", "availability": "Uncommon", "cost": 600, "consumable": true, "action": "Fast", "notes": "+3 MAG Skill Checks, then −3" },
    { "id": "detoxifier-dt", "name": "Detoxifier \"DT\"", "category": "medical", "availability": "Uncommon", "cost": 400, "consumable": true, "action": "Fast", "notes": "Flushes everything, causes Agonized", "flavorLine": "A combined chelating agent and diuretic that strips foreign substances out of the bloodstream." },
    { "id": "mindscape-visor", "name": "Mindscape Visor", "category": "medical", "availability": "Common", "cost": 650, "action": "1 hour", "notes": "Doubles SAN recovery rate", "flavorLine": "A full-immersion VR meditation visor that plays therapeutic environments calibrated to accelerate psychological recovery." },
    { "id": "field-repair-kit", "name": "Field Repair Kit", "category": "medical", "availability": "Common", "cost": 300, "pack": 5, "unit": "use", "consumable": true, "action": "1 hour", "notes": "Restores 1d6 armor INT", "flavorLine": "A compact tool kit for emergency armor maintenance in the field." },
    { "id": "cybernetics-maintenance-kit", "name": "Cybernetics Maintenance Kit", "category": "medical", "availability": "Uncommon", "cost": 1200, "action": "Downtime", "notes": "+5 Cybertech, reduces rejection", "flavorLine": "A specialist toolkit for the upkeep and field repair of cybernetic implants." },
    { "id": "weapons-maintenance-kit", "name": "Weapons Maintenance Kit", "category": "medical", "availability": "Common", "cost": 200, "action": "Downtime", "notes": "+1 ACC after cleaning", "flavorLine": "Cleaning tools, lubricants, and replacement components for keeping firearms and other weapons performing at specification." },
    { "id": "multitool", "name": "Multitool", "category": "tools", "availability": "Common", "cost": 85, "notes": "General purpose field tool", "flavorLine": "A compact folding tool covering the most common field requirements: blade, pliers, screwdrivers, wire cutters, and a handful of other implements that become essential at unpredictable moments." },
    { "id": "crowbar", "name": "Crowbar", "category": "tools", "availability": "Common", "cost": 45, "notes": "Mechanical entry, improvised weapon", "flavorLine": "A length of hardened steel that opens doors, breaks locks, pries panels, and functions as a serviceable melee weapon when nothing else is available." },
    { "id": "cutting-torch", "name": "Cutting Torch", "category": "tools", "availability": "Common", "cost": 320, "notes": "Heavy entry, cuts locks and hinges", "flavorLine": "A compact plasma cutting tool for when a crowbar isn't sufficient — reinforced doors, locked hinges, security panels, and anything else that requires removing material rather than moving it." },
    { "id": "grappling-hook", "name": "Grappling Hook", "category": "tools", "availability": "Common", "cost": 180, "notes": "Vertical access, rooftop entry", "flavorLine": "A compact pneumatic launcher and hook system for gaining vertical access to structures." },
    { "id": "climbing-gear", "name": "Climbing Gear", "category": "tools", "availability": "Common", "cost": 450, "notes": "Extended vertical operations", "flavorLine": "Harness, rope, ascenders, and the supporting equipment for extended vertical operations — building exteriors, cliff faces, elevator shafts, and any environment where you need to move vertically over distance and do it reliably." },
    { "id": "rappelling-kit", "name": "Rappelling Kit", "category": "tools", "availability": "Common", "cost": 275, "notes": "Controlled descent", "flavorLine": "Harness, descender, and rope system for controlled descent from height." },
    { "id": "street-clothes", "name": "Street Clothes", "category": "clothing", "availability": "Common", "cost": 271, "notes": "Durable everyday wear", "flavorLine": "Good clothes that are durable and common in most stores." },
    { "id": "work-uniform", "name": "Work Uniform", "category": "clothing", "availability": "Common", "cost": 440, "notes": "Professional non-corporate", "flavorLine": "Professional clothing for people whose job requires them to look put-together without being in a suit." },
    { "id": "tactical", "name": "Tactical", "category": "clothing", "availability": "Common", "cost": 280, "notes": "Operator underlayer", "flavorLine": "Purpose-built clothing for rough situations: abrasion-resistant, moisture-wicking, and designed to be worn under armor without bunching or compromising fit." },
    { "id": "suit-low-quality", "name": "Suit (Low Quality)", "category": "clothing", "availability": "Common", "cost": 550, "notes": "Entry professional wear", "flavorLine": "A standard suit for business wear." },
    { "id": "suit-high-quality", "name": "Suit (High Quality)", "category": "clothing", "availability": "Uncommon", "cost": 1500, "notes": "Corporate status wear", "flavorLine": "The ideological high fashion of the corporate oligarch." },
    { "id": "accessories-base", "name": "Accessories (Base)", "category": "clothing", "availability": "Common", "cost": 225, "notes": "Standard jewelry and eyewear", "flavorLine": "Baseline quality accessories — jewelry, sunglasses, and other finishing pieces that complete an outfit without calling attention to themselves." },
    { "id": "accessories-good", "name": "Accessories (Good)", "category": "clothing", "availability": "Common", "cost": 600, "notes": "Flashy statement pieces", "flavorLine": "Flashy jewelry and fashionwear that make a statement." },
    { "id": "accessories-lavish", "name": "Accessories (Lavish)", "category": "clothing", "availability": "Uncommon", "cost": 1200, "notes": "Luxury status accessories", "flavorLine": "Luxurious jewelry and accessories used by the wealthy." },
    { "id": "handgun-rounds", "name": "Handgun Rounds", "category": "ammo", "availability": "Common", "cost": 15, "costText": "15Ç / mag", "pack": 1, "unit": "mag", "consumable": true, "notes": "Fits Handgun.", "flavorLine": "If you carry a handgun, you carry these." },
    { "id": "smg-rounds", "name": "SMG Rounds", "category": "ammo", "availability": "Common", "cost": 20, "costText": "20Ç / mag", "pack": 1, "unit": "mag", "consumable": true, "notes": "Fits SMG.", "flavorLine": "Higher-velocity pistol-caliber rounds for the shorter barrels of submachine guns." },
    { "id": "rifle-rounds", "name": "Rifle Rounds", "category": "ammo", "availability": "Common", "cost": 20, "costText": "20Ç / mag", "pack": 1, "unit": "mag", "consumable": true, "notes": "Fits Rifle.", "flavorLine": "The round that most of NYTE City's serious work gets done with." },
    { "id": "shotgun-shells", "name": "Shotgun Shells", "category": "ammo", "availability": "Common", "cost": 15, "costText": "15Ç / box of 10", "pack": 10, "unit": "shell", "consumable": true, "tags": ["Spread"], "notes": "Fits Rifle (shotgun).", "flavorLine": "Shot or slug -- your call. It hurts either way." },
    { "id": "heavy-rounds", "name": "Heavy Rounds", "category": "ammo", "availability": "Common", "cost": 50, "costText": "50Ç / mag", "pack": 1, "unit": "mag", "consumable": true, "notes": "Fits Heavy. Belt-fed weapons carry substantial loads -- treat as unlimited for standard encounters, resupply between operations.", "flavorLine": "Belt-fed and bulk-purchased for sustained operations, not individual engagements." },
    { "id": "power-cell", "name": "Power Cell", "category": "ammo", "availability": "Uncommon", "cost": 50, "costText": "50Ç / cell", "pack": 1, "unit": "cell", "consumable": true, "notes": "Fits Beam, Archery (Strix). Not interchangeable with ballistic ammunition.", "flavorLine": "Rechargeable energy cells powering beam weapons and the Strix's firing mechanism." },
    { "id": "silver-rounds", "name": "Silver Rounds", "category": "ammo", "availability": "By Practice", "cost": null, "costText": "3× standard", "pack": 1, "unit": "mag", "consumable": true, "tags": ["Withering (Lycanthropes)"], "notes": "Fits Handgun, Rifle, Heavy. Standard ballistic damage against unaugmented targets; Withering against lycanthropes and kindred.", "flavorLine": "The silver content doesn't make them hit harder -- it makes the wounds stop healing." },
    { "id": "holy-points", "name": "Holy Points", "category": "ammo", "availability": "By Practice", "cost": null, "costText": "4× standard", "pack": 1, "unit": "mag", "consumable": true, "tags": ["Withering (Unholy)"], "notes": "Fits Handgun. Hollow point notched with an isometric cross, blessed by clergy. Withering against supernaturals aligned against the faith.", "flavorLine": "Against the right target, the blessing stays in the wound." },
    { "id": "angel-rounds", "name": "Angel Rounds", "category": "ammo", "availability": "Rare", "cost": null, "costText": "5× standard", "pack": 1, "unit": "mag", "consumable": true, "tags": ["+4 DMG", "AP", "Burning", "Agonized"], "notes": "Fits Handgun, Rifle, SMG. Required for the Angel Mod. Cannot be used without it installed.", "flavorLine": "Plasma-coated high-grade alloy projectile." },
    { "id": "standard-broadhead", "name": "Standard Broadhead", "category": "ammo", "availability": "Common", "cost": 50, "costText": "50Ç / 12", "pack": 12, "unit": "arrow", "consumable": true, "notes": "Arrowhead. Base weapon DMG." },
    { "id": "armor-piercing-arrowhead", "name": "Armor Piercing", "category": "ammo", "availability": "Uncommon", "cost": 150, "costText": "150Ç / 6", "pack": 6, "unit": "arrow", "consumable": true, "tags": ["AP"], "notes": "Arrowhead. Base weapon DMG." },
    { "id": "barbed-tip", "name": "Barbed Tip", "category": "ammo", "availability": "Uncommon", "cost": 100, "costText": "100Ç / 6", "pack": 6, "unit": "arrow", "consumable": true, "tags": ["Bleeding"], "notes": "Arrowhead. Base weapon DMG.", "flavorLine": "A hooked arrowhead that catches and tears on impact. The wound doesn't close cleanly." },
    { "id": "explosive-tip", "name": "Explosive Tip", "category": "ammo", "availability": "Rare", "cost": 200, "costText": "200Ç / 3", "pack": 3, "unit": "arrow", "consumable": true, "tags": ["Blast"], "notes": "Arrowhead. Base DMG +2, 1m blast." },
    { "id": "emp-tip", "name": "EMP Tip", "category": "ammo", "availability": "Uncommon", "cost": 180, "costText": "180Ç / 3", "pack": 3, "unit": "arrow", "consumable": true, "tags": ["EMP"], "notes": "Arrowhead. DMG 2, electronics disruption." },
    { "id": "incendiary-arrowhead", "name": "Incendiary", "category": "ammo", "availability": "Uncommon", "cost": 120, "costText": "120Ç / 6", "pack": 6, "unit": "arrow", "consumable": true, "tags": ["Burning"], "notes": "Arrowhead. Base weapon DMG." },
    { "id": "poison-tip", "name": "Poison Tip", "category": "ammo", "availability": "Rare", "cost": 400, "costText": "400Ç / 3", "pack": 3, "unit": "arrow", "consumable": true, "tags": ["Condition (specify: Poison / Sedative / Paralytic)"], "notes": "Arrowhead. Base weapon DMG.", "flavorLine": "A hollow-tipped arrowhead with a sealed payload chamber; specify the payload at purchase." },
    { "id": "silver-tipped-arrowhead", "name": "Silver-Tipped", "category": "ammo", "availability": "By Practice", "cost": 300, "costText": "300Ç / 6", "pack": 6, "unit": "arrow", "consumable": true, "tags": ["Withering (Lycanthropes)"], "notes": "Arrowhead. Base weapon DMG." },
    { "id": "iron-cored-arrowhead", "name": "Iron-Cored", "category": "ammo", "availability": "By Practice", "cost": 300, "costText": "300Ç / 6", "pack": 6, "unit": "arrow", "consumable": true, "tags": ["Withering (Fae / Spirits)"], "notes": "Arrowhead. Base weapon DMG." },
    { "id": "consecrated-arrowhead", "name": "Consecrated", "category": "ammo", "availability": "By Practice", "cost": 250, "costText": "250Ç / 6", "pack": 6, "unit": "arrow", "consumable": true, "tags": ["Withering (Undead / Demonic)"], "notes": "Arrowhead. Base weapon DMG." },
    { "id": "void-touched-arrowhead", "name": "Void-Touched", "category": "ammo", "availability": "By Practice", "cost": null, "costText": "No listed price", "pack": 1, "unit": "arrow", "consumable": true, "tags": ["Withering (All Supernaturals)"], "notes": "Arrowhead. Base DMG -2.", "flavorLine": "The only arrowhead effective against the full range of supernatural targets, at the cost of reduced physical impact." },
    { "id": "paper-sheet-standard", "name": "Paper (sheet, standard)", "category": "materials", "availability": "Common", "cost": 5, "costText": "5Ç / 10", "pack": 10, "unit": "sheet", "consumable": true, "notes": "Degradable. Works for any single-charge inscription." },
    { "id": "cloth-square-standard", "name": "Cloth (square, standard)", "category": "materials", "availability": "Common", "cost": 10, "costText": "10Ç / 10", "pack": 10, "unit": "square", "consumable": true, "notes": "Degradable. Flexible — can be worn or wrapped." },
    { "id": "wood-blank-small", "name": "Wood blank (small)", "category": "materials", "availability": "Common", "cost": 15, "consumable": true, "notes": "Once-Living. 3 charges. Coins, discs, small carvings." },
    { "id": "bone-blank-small", "name": "Bone blank (small)", "category": "materials", "availability": "Uncommon", "cost": 30, "consumable": true, "notes": "Once-Living. 3 charges. Carved and smoothed for inscription." },
    { "id": "stone-blank-small", "name": "Stone blank (small)", "category": "materials", "availability": "Uncommon", "cost": 40, "consumable": true, "notes": "Inorganic Durable. 5 charges. Uncut or rough-finished." },
    { "id": "metal-blank-small", "name": "Metal blank (small)", "category": "materials", "availability": "Uncommon", "cost": 60, "consumable": true, "notes": "Inorganic Durable. 5 charges. Coin-sized, smooth face." },
    { "id": "glass-blank-small", "name": "Glass blank (small)", "category": "materials", "availability": "Uncommon", "cost": 75, "consumable": true, "notes": "Inorganic Durable. 5 charges. Requires care in handling." },
    { "id": "crystal-blank-standard", "name": "Crystal blank (standard)", "category": "materials", "availability": "Rare", "cost": 250, "consumable": true, "notes": "Inorganic Durable. 5 charges. Basic cut, adequate retention." },
    { "id": "crystal-blank-precision-cut", "name": "Crystal blank (precision cut)", "category": "materials", "availability": "Rare", "cost": 900, "consumable": true, "notes": "Inorganic Durable. 5 charges. Required for Superior-tier Alchemy." },
    { "id": "specialist-or-rare-material", "name": "Specialist or rare material", "category": "materials", "availability": "Goblin Market / Referral", "cost": null, "costText": "1,500Ç+", "consumable": true, "notes": "Some commissions require sourcing as part of the job." },
    { "id": "salt-ritual-grade-1kg", "name": "Salt (ritual grade, 1kg)", "category": "ritual", "availability": "Common", "cost": 8, "consumable": true, "notes": "Used for geometric patterns, workspace boundaries." },
    { "id": "incense-standard", "name": "Incense (standard)", "category": "ritual", "availability": "Common", "cost": 10, "consumable": true, "notes": "Assorted. Common in occult retail." },
    { "id": "chalk-colored-set", "name": "Chalk (colored set)", "category": "ritual", "availability": "Common", "cost": 12, "consumable": true, "notes": "Floor and surface patterns. Washes clean." },
    { "id": "candles-pack-of-12", "name": "Candles (pack of 12)", "category": "ritual", "availability": "Common", "cost": 15, "pack": 12, "unit": "candle", "consumable": true, "notes": "Standard. Color matters to some practitioners, not to the Aether." },
    { "id": "inscription-ink-standard", "name": "Inscription ink (standard)", "category": "ritual", "availability": "Common", "cost": 25, "consumable": true, "notes": "Works on paper and cloth." },
    { "id": "incense-specialist-blend", "name": "Incense (specialist blend)", "category": "ritual", "availability": "Uncommon", "cost": 45, "consumable": true, "notes": "Specific scent profiles associated with specific Domains." },
    { "id": "ritual-candles-specialty", "name": "Ritual candles (specialty)", "category": "ritual", "availability": "Uncommon", "cost": 60, "consumable": true, "notes": "Beeswax, hand-poured, longer burn. Preferred for extended rituals." },
    { "id": "workbench-lamp-magnifying", "name": "Workbench lamp (magnifying)", "category": "ritual", "availability": "Common", "cost": 85, "notes": "For fine inscription work." },
    { "id": "inscription-ink-etching-grade", "name": "Inscription ink (etching grade)", "category": "ritual", "availability": "Uncommon", "cost": 90, "consumable": true, "notes": "For metal and stone. Requires etching tool." },
    { "id": "ritual-basin", "name": "Ritual basin", "category": "ritual", "availability": "Uncommon", "cost": 120, "notes": "Ceramic or metal. Used for water, oil, or symbolic materials." },
    { "id": "portable-ritual-mat", "name": "Portable ritual mat", "category": "ritual", "availability": "Uncommon", "cost": 200, "notes": "Fabric with pre-printed geometric patterns. Rolls up for transport." },
    { "id": "etching-tool-set", "name": "Etching tool set", "category": "ritual", "availability": "Uncommon", "cost": 350, "notes": "For inscribing metal, stone, glass, crystal." },
    { "id": "geometric-inlay-kit", "name": "Geometric inlay kit", "category": "ritual", "availability": "Rare", "cost": 800, "notes": "Copper wire and setting tools. For permanent workspace installation." },
    { "id": "paper-talisman-folded-set-of-10", "name": "Paper talisman (folded, set of 10)", "category": "blanks", "material": "Degradable", "availability": "Common", "cost": 20, "pack": 10, "unit": "talisman", "consumable": true, "notes": "Pre-folded for throwing or contact trigger. Single charge each." },
    { "id": "charm-wood-set-of-3", "name": "Charm (wood, set of 3)", "category": "blanks", "material": "Once-Living", "availability": "Common", "cost": 45, "pack": 3, "unit": "charm", "consumable": true, "notes": "Small carved blanks. Necklace, bracelet, or loose carry." },
    { "id": "charm-bone-set-of-3", "name": "Charm (bone, set of 3)", "category": "blanks", "material": "Once-Living", "availability": "Uncommon", "cost": 100, "pack": 3, "unit": "charm", "consumable": true, "notes": "As wood charm." },
    { "id": "charm-crystal-single", "name": "Charm (crystal, single)", "category": "blanks", "material": "Inorganic Durable", "availability": "Rare", "cost": 400, "consumable": true, "notes": "Single precision stone on a mount." },
    { "id": "coin-blank-metal", "name": "Coin blank (metal)", "category": "blanks", "material": "Inorganic Durable", "availability": "Common", "cost": 25, "consumable": true, "notes": "Smooth-faced coin. Easily carried, easily palmed." },
    { "id": "medallion-metal-large", "name": "Medallion (metal, large)", "category": "blanks", "material": "Inorganic Durable", "availability": "Uncommon", "cost": 150, "consumable": true, "notes": "Larger inscription surface. Worn or carried." },
    { "id": "ring-blank-metal", "name": "Ring blank (metal)", "category": "blanks", "material": "Inorganic Durable", "availability": "Uncommon", "cost": 120, "consumable": true, "notes": "Smooth inner band for inscription." },
    { "id": "ring-blank-crystal-set", "name": "Ring blank (crystal-set)", "category": "blanks", "material": "Inorganic Durable", "availability": "Rare", "cost": 550, "consumable": true, "notes": "Metal band with mounted stone." },
    { "id": "wand-wood", "name": "Wand (wood)", "category": "blanks", "material": "Once-Living", "availability": "Common", "cost": 80, "consumable": true, "notes": "Standard length. Smooth finish, inscription-ready surface." },
    { "id": "wand-bone", "name": "Wand (bone)", "category": "blanks", "material": "Once-Living", "availability": "Uncommon", "cost": 180, "consumable": true, "notes": "As wand (wood). Unsettling to some. Effective to all." },
    { "id": "wand-metal", "name": "Wand (metal)", "category": "blanks", "material": "Inorganic Durable", "availability": "Rare", "cost": 450, "consumable": true, "notes": "Cast or machined. High-end finish." },
    { "id": "wand-crystal-tipped", "name": "Wand (crystal-tipped)", "category": "blanks", "material": "Inorganic Durable", "availability": "Rare", "cost": 1200, "consumable": true, "notes": "Metal shaft, crystal focus point. Superior-tier capable." },
    { "id": "staff-wood", "name": "Staff (wood)", "category": "blanks", "material": "Once-Living", "availability": "Uncommon", "cost": 250, "consumable": true, "notes": "Full length. Higher surface area allows complex inscription." },
    { "id": "staff-metal-shod", "name": "Staff (metal-shod)", "category": "blanks", "material": "Inorganic Durable", "availability": "Rare", "cost": 700, "consumable": true, "notes": "Wood shaft with inscribable metal fittings at head and base." },
    { "id": "athame", "name": "Athame", "category": "blanks", "material": "Inorganic Durable", "availability": "Uncommon", "cost": 300, "consumable": true, "notes": "Ritual knife. Double-edged, inscription-ready blade." },
    { "id": "blink-card", "name": "Blink card", "category": "singleUse", "spell": "blink", "spellName": "Blink", "availability": "Rare", "cost": 150, "consumable": true, "notes": "One crossing." },
    { "id": "dart-cards-deck-of-5", "name": "Dart cards (deck of 5)", "category": "singleUse", "spell": "dart", "spellName": "Dart", "availability": "Uncommon", "cost": 200, "pack": 5, "unit": "card", "consumable": true, "notes": "Thrown — Melee attack, releases on impact." },
    { "id": "field-suture-patch", "name": "Field Suture patch", "category": "singleUse", "spell": "mend-flesh", "spellName": "Mend Flesh", "availability": "Uncommon", "cost": 250, "consumable": true, "notes": "Press to the wound." },
    { "id": "everlight-slip", "name": "Everlight slip", "category": "singleUse", "spell": "everlight", "spellName": "Everlight", "availability": "Common", "cost": 40, "pack": 10, "unit": "slip", "consumable": true, "notes": "Sold in strips of ten." },
    { "id": "ward-card", "name": "Ward card", "category": "singleUse", "spell": "shield", "spellName": "Shield", "availability": "Uncommon", "cost": 75, "consumable": true, "notes": "Tap to activate." },
    { "id": "everlight-pendant", "name": "Everlight pendant", "category": "charged", "spell": "everlight", "spellName": "Everlight", "availability": "Common", "cost": 300, "charges": 3, "notes": "The most common inscription in the city." },
    { "id": "steadying-cord", "name": "Steadying cord", "category": "charged", "spell": "soothe", "spellName": "Soothe", "availability": "Common", "cost": 350, "charges": 3, "notes": "Knotted leather at the wrist. For whoever needs it most." },
    { "id": "lucky-dice", "name": "Lucky dice", "category": "charged", "spell": "luck-of-the-bold", "spellName": "Luck of the Bold", "availability": "Uncommon", "cost": 400, "charges": 3, "notes": "A pair of knucklebones. Roll them, then roll yours." },
    { "id": "shield-charm", "name": "Shield charm", "category": "charged", "spell": "shield", "spellName": "Shield", "availability": "Uncommon", "cost": 450, "charges": 3, "notes": "Carved wood on a cord. Fast Action to tap." },
    { "id": "featherfall-charm", "name": "Featherfall charm", "category": "charged", "spell": "feather-fall", "spellName": "Feather Fall", "availability": "Uncommon", "cost": 550, "charges": 3, "notes": "A single feather, sealed. Three descents." },
    { "id": "tracer-cord", "name": "Tracer cord", "category": "charged", "spell": "tracer", "spellName": "Tracer", "availability": "Uncommon", "cost": 700, "charges": 3, "notes": "Braided leather. Slip it onto something and follow." },
    { "id": "facemask-visor", "name": "Facemask visor", "category": "charged", "spell": "facemask", "spellName": "Facemask", "availability": "Rare", "cost": 900, "charges": 3, "notes": "Tap and wear another face." },
    { "id": "sure-grip-wrap", "name": "Sure Grip wrap", "category": "durable", "spell": "sure-grip", "spellName": "Sure Grip", "availability": "Uncommon", "cost": 800, "charges": 5, "notes": "Fits any weapon grip." },
    { "id": "bulwark-rune", "name": "Bulwark rune", "category": "durable", "spell": "shield", "spellName": "Shield", "availability": "Rare", "cost": 1200, "charges": 5, "notes": "Stone inlay for armor. Triggers on a hit." },
    { "id": "blink-boots", "name": "Blink boots", "category": "durable", "spell": "blink", "spellName": "Blink", "availability": "Rare", "cost": 1400, "charges": 5, "notes": "Click your heels." },
    { "id": "truestrike-sight", "name": "Truestrike sight", "category": "durable", "spell": "sure-hand", "spellName": "Sure Hand", "availability": "Rare", "cost": 1600, "charges": 5, "notes": "Fixed to a weapon." },
    { "id": "embersight-visor", "name": "Embersight visor", "category": "durable", "spell": "ember-sight", "spellName": "Ember Sight", "availability": "Rare", "cost": 1800, "charges": 5, "notes": "Nothing a scanner finds." },
    { "id": "second-wind-charm", "name": "Second Wind charm", "category": "durable", "spell": "second-wind", "spellName": "Second Wind", "availability": "By Practice", "cost": 2200, "charges": 5, "startsEmpty": true, "notes": "Sold empty." },
    { "id": "turning-rune", "name": "Turning rune", "category": "durable", "spell": "turning-rune", "spellName": "Turning Rune", "availability": "By Practice", "cost": 3000, "charges": 5, "notes": "Armor inlay. Triggers on a hit." },
    { "id": "watchward", "name": "Watchward", "category": "wards", "spell": "watchward", "spellName": "Watchward", "availability": "Uncommon", "cost": 600, "notes": "Silent alert, any distance." },
    { "id": "frost-trap", "name": "Frost Trap", "category": "wards", "spell": "frost-trap", "spellName": "Frost Trap", "availability": "Rare", "cost": 800 },
    { "id": "lightning-trap", "name": "Lightning Trap", "category": "wards", "spell": "lightning-trap", "spellName": "Lightning Trap", "availability": "Rare", "cost": 800 },
    { "id": "quiet-ward", "name": "Quiet Ward", "category": "wards", "spell": "hush", "spellName": "Hush", "availability": "Uncommon", "cost": 900, "notes": "Inscribed for a room rather than a moment." },
    { "id": "spike-trap", "name": "Spike Trap", "category": "wards", "spell": "spike-trap", "spellName": "Spike Trap", "availability": "Rare", "cost": 1500 },
    { "id": "threshold-ward", "name": "Threshold Ward", "category": "wards", "spell": "threshold-ward", "spellName": "Threshold Ward", "availability": "By Practice", "cost": 2400, "notes": "Target type named at inscription." },
    { "id": "stasis-trap", "name": "Stasis Trap", "category": "wards", "spell": "stasis-trap", "spellName": "Stasis Trap", "availability": "By Practice", "cost": 3000 },
    { "id": "spikefield", "name": "Spikefield", "category": "wards", "spell": "spikefield", "spellName": "Spikefield", "availability": "By Practice", "cost": 4500 },
    { "id": "everlight-lamp", "name": "Everlight lamp", "category": "artifacts", "spell": "everlight", "spellName": "Everlight", "availability": "Rare", "cost": 3500, "notes": "Ready every night, forever." },
    { "id": "hearthstone-artifact", "name": "Hearthstone (Artifact)", "category": "artifacts", "spell": "hearthstone", "spellName": "Hearthstone", "availability": "Rare", "cost": 4000, "notes": "A room that is never cold again." },
    { "id": "watchward-stone", "name": "Watchward stone", "category": "artifacts", "spell": "watchward", "spellName": "Watchward", "availability": "Rare", "cost": 5500, "notes": "Set in a doorframe. Never needs resetting." },
    { "id": "quietwalk-soles", "name": "Quietwalk soles", "category": "artifacts", "spell": "hush", "spellName": "Hush", "availability": "By Practice", "cost": 6000, "notes": "Your footsteps stop arriving. Always on." },
    { "id": "stillglass-lenses", "name": "Stillglass lenses", "category": "artifacts", "spell": "ember-sight", "spellName": "Ember Sight", "availability": "By Practice", "cost": 6000, "notes": "Thermal sight, all day. Reads as sunglasses." },
    { "id": "tracer-ring", "name": "Tracer ring", "category": "artifacts", "spell": "tracer", "spellName": "Tracer", "availability": "By Practice", "cost": 6000, "notes": "Marks one target a day, holds until dawn." },
    { "id": "wardbreaker-rod", "name": "Wardbreaker rod", "category": "artifacts", "spell": "counterspell", "spellName": "Counterspell", "availability": "By Practice", "cost": 9000, "notes": "One counter per day. Works for anyone." },
    { "id": "grave-iron-blade", "name": "Grave-iron blade", "category": "artifacts", "spell": "consecrate", "spellName": "Consecrate", "availability": "By Contract", "cost": null, "costText": "Varies", "notes": "Deals Withering (Holy) damage to things that shrug off ordinary steel." },
    { "id": "blink-boots-artifact", "name": "Blink boots", "category": "artifacts", "spell": "blink", "spellName": "Blink", "availability": "By Practice", "cost": 12000, "notes": "Five crossings, recovered by morning." },
    { "id": "ferrymans-coin", "name": "Ferryman's coin", "category": "artifacts", "spell": "tether", "spellName": "Tether", "availability": "By Contract", "cost": 30000, "notes": "Stabilizes one Dying person outright. Recovers after a month." }
  ],

  /* CONDITIONS -- one entry per row of the Conditions table in
     `054_Conditions_and_Recovery.md`, plus Dying (054 treats it as a Condition
     in prose and recovery but gives it no table row -- plan CQ9, a CRB doc fix).
     Gear's older Conditions table disagrees with 054 in five places (plan CQ8);
     054 is the one this follows. `effect`/`recovery` are display text; `short`
     is the chip label. The engine computes ONLY the structured hooks below, and
     everything else stays text on the chip (Decision 95):
       painLevels        adds to Pain Level before the 0-3 clamp (Agonized)
       rollPenalty       flat, applied to every Skill Check total and nothing
                         else; different ones stack to `penaltyStacking.cap`
       rollPenaltyWhen   conditional -- shown beside the totals, never summed
       attackDefense     shown on the Combat lines, never summed (the CRB
                         states it for attack/defense, not every check)
       helpless          "any attack roll of 2 or better hits" banner
       ongoing           { hp, per } fixed, or { source: true } entered at Turn
                         Reset -- ticked by Engine.resolveReset (Decision 100)
       location          needs a body part from `bodyLocations` -- Injured and
                         Maimed only (Decision 98)
       counter           { max, label, atMax } -- Dying's Death Marks
     Adding a condition is a data edit with zero app changes. */
  "conditionRules": {
    "noStacking": "You have it or you don't. A Condition doesn't stack with itself, but different Conditions stack with each other.",
    "helpless": "Helpless — you can't move or react. Any attack roll of 2 or better hits you.",
    "painClamp": "Pain Level never goes below 0 or above 3.",
    "rollPenalty": {
      "text": "A Condition's penalty comes off Skill Checks only. It doesn't cost Essence dice or Breaker percentage."
    },
    "penaltyStacking": {
      "cap": -8,
      "text": "Different Conditions stack. All the penalties on one roll together (Conditions, range, cover, visibility) never go past -8."
    }
  },
  "bodyLocations": [
    { "id": "head",      "name": "Head" },
    { "id": "torso",     "name": "Torso" },
    { "id": "right-arm", "name": "Right Arm" },
    { "id": "left-arm",  "name": "Left Arm" },
    { "id": "right-leg", "name": "Right Leg" },
    { "id": "left-leg",  "name": "Left Leg" }
  ],

  /* DAMAGE -- what a hit is made of, read by Engine.resolveHit() (combat plan
     Session 3, Decision 99). `damageTypes` are Gear's six types plus Magical
     (the one the RES rules name); `resClass` decides whether RES answers --
     base armor is Kinetic, Ablative Plating adds Energy, Warding adds Magical.
     `inflicts` are the Conditions a type CAN cause (offered in the hit
     dialog, never forced); `always` are the ones Gear says it always causes
     (pre-ticked, still the player's call). Electric and Burning have no stated
     RES class (F23) and are stubbed as Energy. `damageCategories` is Gear's
     Regular/Withering/Massive, and each says how it resolves:
     `bypassesArmor` (skip PROT/RES, strip Integrity, remove Health Levels by
     `damageRules.massive`), `recordsWithering` (what gets through can't
     regenerate), `inflicts` (Conditions the category adds to the type's --
     Injured/Maimed only on Massive, CQ5). `damageRules` holds 053/054's
     Massive, Shock, At Zero and Dying numbers. */
  "damageTypes": [
    { "id": "blade",     "name": "Blade",     "resClass": "kinetic", "inflicts": ["bleeding"] },
    { "id": "blunt",     "name": "Blunt",     "resClass": "kinetic", "inflicts": ["stunned", "disoriented", "unconscious"] },
    { "id": "ballistic", "name": "Ballistic", "resClass": "kinetic", "inflicts": ["bleeding"] },
    { "id": "electric",  "name": "Electric",  "resClass": "energy",  "inflicts": ["stunned", "shocked", "paralyzed"],
      "flagged": true, "flagNote": "F23 -- the CRB names Kinetic RES (Blade/Blunt/Ballistic) and Energy/Magical via upgrades, but never says which Electric falls under. Stubbed as Energy: no RES without Ablative Plating.",
      "playerNote": "Whether armor's RES stops Electric damage is still being settled. For now it counts as Energy, so only Ablative Plating lets RES answer it." },
    { "id": "energy",    "name": "Energy",    "resClass": "energy",  "inflicts": ["agonized"] },
    { "id": "burning",   "name": "Burning",   "resClass": "energy",  "inflicts": ["agonized", "burning"], "always": ["agonized", "burning"],
      "flagged": true, "flagNote": "F23 -- as Electric: no stated RES class for Burning. Stubbed as Energy (no RES without Ablative Plating).",
      "playerNote": "Whether armor's RES stops fire is still being settled. For now it counts as Energy, so only Ablative Plating lets RES answer it." },
    { "id": "magical",   "name": "Magical",   "resClass": "magical", "inflicts": [] }
  ],
  "damageCategories": [
    { "id": "regular",   "name": "Regular",   "text": "The everyday kind. Armor answers, and what gets through heals the usual ways." },
    { "id": "withering", "name": "Withering", "recordsWithering": true, "text": "Armor answers as normal. What gets through won't regenerate. It heals only with rest and medicine, once you're clear of the source." },
    { "id": "massive",   "name": "Massive",   "bypassesArmor": true, "inflicts": ["injured", "maimed"],
      "text": "Siege weapons, vehicle guns, big explosives. Skips PROT and RES, strips Integrity equal to the damage, and takes Health Levels away outright." }
  ],
  "damageRules": {
    "massive": {
      "damagePerLevel": 10,
      "extraLevelWhenArmorGone": 1,
      "text": "Massive strips Integrity equal to the damage and removes 1 Health Level per 10 points of it, plus one more if the armor ends at 0 or there was none. Those Levels are gone, not emptied. Rest and chems don't bring them back. It takes Focused Healing and a replacement: a prosthetic, or something stranger."
    },
    "shock": {
      "fractionOfMaxLevels": 0.5,
      "check": "BOD Essence Check TN 8 TH 2",
      "onFail": ["unconscious", "prone"],
      "text": "That hit took half your Health Levels or more. Fail and you're Unconscious and Prone until the start of your next turn."
    },
    "atZero": {
      "check": "WILL Essence Check TN 8 TH 2",
      "onPass": ["unconscious", "prone"],
      "onFail": ["dying"],
      "text": "Your last Health Level is gone. Pain doesn't apply to this check. Pass and you're Unconscious and Prone. Fail and you're Dying.",
      "freePass": { "advantage": "nine-lives", "text": "Nine Lives can pass this check for you without a roll." }
    },
    "whileDying": {
      "condition": "dying",
      "text": "Damage while Dying is an automatic Death Mark.",
      "resetCheck": "WILL Essence Check TN 8 TH 2",
      "resetText": "You're Dying. Make the check at every Reset, and Pain doesn't apply to it. Fail and it's a Death Mark. Pass and you've bought the round, nothing more.",
      "flagged": true,
      "flagNote": "F24 -- 054 says any damage while Dying is 'an automatic failure and a mark', and that ongoing damage ticking is 'another mark'. At a Reset where Bleeding or Burning ticks, is that one mark (the check fails automatically) or the check plus a mark per source? Stubbed: each ticking source is one mark and stands in for the check, which isn't asked.",
      "playerNote": "How ongoing damage and the Dying check add up at a Reset is still being settled. For now each source that ticks is one Death Mark, and it takes the place of the check."
    }
  },

  /* RECOVERY -- Natural and Focused Healing from 055 Downtime and 054's
     "Getting Back on your Feet" (combat plan Session 4, Decision 100). The
     app never rolls and never decides a GM's call: Natural Healing proposes
     BOD per day and the player can change the number (the GM may halve it for
     pushing on); Focused Healing takes what the care restored. `clears` are
     the Conditions Focused Healing ends (055 says Injured needs it; 054's
     table also allows a week of downtime -- plan CQ13, a CRB doc fix). Massive levels come back only
     here, and only with a replacement (Decision 98, CQ6). */
  "recoveryRules": {
    "naturalHealing": {
      "stat": "BOD",
      "speedHealMultiplier": 2,
      "text": "With food, shelter and real rest, you recover HP equal to your BOD each day. Push on instead of resting and your GM may halve that.",
      "speedHealText": "Speed Heal doubles it for 24 hours."
    },
    "focusedHealing": {
      "clears": ["injured"],
      "text": "Med kits, chems, nanites, or real care in a clinic. How much comes back depends on the care. It also clears Injured.",
      "massiveText": "A Health Level lost to Massive damage comes back with Focused Healing and a replacement: a prosthetic, or something stranger."
    },
    /* 054 "With Çredits" is the master list (Decision 105, CQ12): Gear's
       entry leaves out Paralyzed. Regeneration is 1 HP every `dose` rounds
       for `roundsStat` rounds, so dose n proposes floor(BOD / n) HP. */
    "nanomed": {
      "clears": ["agonized", "bleeding", "paralyzed", "poisoned"],
      "endsDying": true,
      "roundsStat": "BOD",
      "text": "Nanites in the bloodstream. It clears Agonized, Bleeding, Paralyzed and Poisoned, stabilizes the Dying, and regenerates 1 HP a round for BOD rounds.",
      "doseText": "Another kit inside a day still clears and stabilizes, but regenerates slower: 1 HP every two rounds for the second, every three for the third."
    }
  },
  "conditions": [
    { "id": "agonized", "name": "Agonized", "short": "+1 Pain Level",
      "effect": "Operate at 1 Pain Level higher, to a max of Pain Level 3.",
      "recovery": "Medical (Difficulty 15) or a Nanomed Kit.",
      "painLevels": 1 },
    { "id": "bleeding", "name": "Bleeding", "short": "-1 HP each round",
      "effect": "-1 HP per round.",
      "recovery": "BOD Essence TN 8 TH 1, Medical (Difficulty 15), or a Nanomed Kit.",
      "ongoing": { "hp": 1, "per": "round" } },
    { "id": "blinded", "name": "Blinded", "short": "can't see · -5 attack/defense",
      "effect": "Can't see. Autofail any check requiring sight. Attack/Defense at -5.",
      "recovery": "BOD Essence TN 8 TH 1, or end of scene if temporary.",
      "attackDefense": -5 },
    { "id": "burning", "name": "Burning", "short": "damage each round · -1 to rolls",
      "effect": "Ongoing damage based on the source. -1 to all rolls.",
      "recovery": "Remove the source, then treat as Bleeding.",
      "rollPenalty": -1, "ongoing": { "source": true, "per": "round" } },
    { "id": "deafened", "name": "Deafened", "short": "can't hear",
      "effect": "Can't hear. Autofail any check requiring hearing. Can't hear instructions or comms.",
      "recovery": "BOD Essence TN 8 TH 1, or end of scene if temporary." },
    { "id": "desynced", "name": "DeSynced", "short": "cyberware offline",
      "effect": "Cybernetic systems in a body part (limbs, head, torso) aren't talking, or are offline. Note which.",
      "recovery": "TECH Essence TN 8 TH 2, or 1d4 rounds for a system reboot." },
    { "id": "disarmed", "name": "Disarmed", "short": "weapon dropped",
      "effect": "You aren't holding your weapon and can't use it.",
      "recovery": "Recover the weapon, spending a Move, Fast, or Standard action." },
    { "id": "disoriented", "name": "Disoriented", "short": "-1 to rolls",
      "effect": "-1 to all rolls.",
      "recovery": "BOD Essence TN 8 TH 1, or end of scene if temporary.",
      "rollPenalty": -1 },
    { "id": "frightened", "name": "Frightened", "short": "-1 near the source",
      "effect": "-1 to all rolls while the source is present. Can't willingly move toward the source.",
      "recovery": "Remove the source, or WILL Essence TN 8 TH 2 with the source present.",
      "rollPenaltyWhen": { "amount": -1, "when": "while the source is present" } },
    { "id": "grappled", "name": "Grappled", "short": "-5 to fine movement",
      "effect": "-5 to anything requiring sophisticated movement.",
      "recovery": "Remove the source, or a BOD or REF Essence Check opposed by the grappler (your choice)." },
    { "id": "injured", "name": "Injured", "short": "out of action",
      "effect": "This body part is damaged and doesn't work.",
      "recovery": "Focused Healing, or 1 week of downtime.",
      "location": true },
    { "id": "maimed", "name": "Maimed", "short": "gone",
      "effect": "This body part is gone.",
      "recovery": "Buy or build a replacement.",
      "location": true },
    { "id": "paralyzed", "name": "Paralyzed", "short": "helpless",
      "effect": "Helpless.",
      "recovery": "Remove the source, or a Nanomed Kit.",
      "helpless": true },
    { "id": "poisoned", "name": "Poisoned", "short": "per the poison",
      "effect": "Inflicts a Condition based on the specific poison. Note which one.",
      "recovery": "BOD Essence TN 8 TH 2-4 (depending on the poison), an antidote, or a Nanomed Kit." },
    { "id": "prone", "name": "Prone", "short": "half move · -3 attack/defense",
      "effect": "Movement halved. Attack/Defense at -3.",
      "recovery": "Spend a Move to stand.",
      "attackDefense": -3 },
    { "id": "restrained", "name": "Restrained", "short": "can't move · -5 · no Dodge",
      "effect": "Movement reduced to 0. -5 to all Actions. Cannot Dodge.",
      "recovery": "Remove the source, or BOD or REF Essence TN 8 TH 2 (your choice).",
      "attackDefense": -5 },
    { "id": "shocked", "name": "Shocked", "short": "damage each round · -1 to rolls",
      "effect": "Ongoing damage based on the source. -1 to all rolls.",
      "recovery": "Remove the source, then treat as Bleeding.",
      "rollPenalty": -1, "ongoing": { "source": true, "per": "round" } },
    { "id": "stunned", "name": "Stunned", "short": "helpless",
      "effect": "Helpless.",
      "recovery": "BOD Essence TN 8 TH 2.",
      "helpless": true },
    { "id": "unconscious", "name": "Unconscious", "short": "helpless",
      "effect": "Helpless.",
      "recovery": "Depends on what put you down. From a Shock Check, it ends at the start of your next turn. At zero Health Levels, you're down until you regain health.",
      "helpless": true },
    { "id": "dying", "name": "Dying", "short": "helpless · Death Marks",
      "effect": "Helpless. Make a WILL Essence Check TN 8 TH 2 at every Reset, and Pain doesn't apply to it. A failure, or any damage you take, is a Death Mark. Three Death Marks and you die.",
      "recovery": "Medical (Difficulty 20) or a Nanomed Kit ends it. Death Marks clear when you're no longer Dying.",
      "helpless": true, "counter": { "max": 3, "label": "Death Marks", "atMax": "Three Death Marks. You're dead, and your options are seriously limited." } }
  ],

  /* MAGIC -- merged from the CRB v4 Magic chapter (docs/reference/crb/Magic.md),
     the archetype-INDEPENDENT half only (Decision 93). `domains` is the Glyph
     taxonomy; `spells` is the full Known-spell catalog (id + tier + domain +
     glyph + TN/TH/range/type/target/effect/duration/defending/overflow/tags);
     `spellTiers` documents the TN/TH per tier; `spellcraftRules` documents the roll, the five
     outcomes, Concentration, Sovereign Soul, Charging and the Known/Mastered
     progression as reference text -- the same role `armorRules` plays, since
     per Decision 11 the app never rolls dice and nothing here executes. Origins
     (Book/Blood/Bound) are deliberately NOT here: they're the Arcanist subtype
     question, still blocked on the archetype four-way comparison (STATE.md §3).
     The book's own dashes become `--` and `-` here. Counterspell and Silence
     are kept although the 2026-09-24 book dropped them: Magic still describes
     Counterspell, the Wardbreaker rod casts it, and a Grimoire may hold either
     (ids are immutable). Silence's Overflow keeps its old `[X]` for that
     reason. The book's Inscribed Spells sit in their real tier with a
     `disciplines` list, and `th` is the tier's: an Enchantment or Alchemy
     form's TH and time are `enchantmentTimeTable`'s row (Decision 136). */
  "domains": [
    { "id": "elements", "name": "Elements", "glyphs": ["Fire", "Lightning", "Water", "Air", "Earth"],
      "description": "Raw natural force -- energy in its most immediate forms: heat, current, pressure, flow, impact. Element spells tend toward direct effects: damage, environmental change, area control. The most legible spells to cast, and the most legible to defend against." },
    { "id": "force", "name": "Force", "glyphs": ["Shockwave", "Gravity", "Barrier", "Telekinesis", "Distortion"],
      "description": "The manipulation of objects through time and space. Force spells move things -- toward, away, together, apart, or not at all, or not yet. The Domain of leverage." },
    { "id": "matter", "name": "Matter", "glyphs": ["Stone", "Metal", "Wood", "Glass", "Flesh"],
      "description": "Physical substances and their properties -- hardening, softening, shaping, or transforming specific materials. Applied to Flesh, this is where healing lives." },
    { "id": "mind", "name": "Mind", "glyphs": ["Fear", "Compulsion", "Illusion", "Insight", "Memory"],
      "description": "Cognition and perception. Mind spells operate on what a target believes, remembers, or experiences, and leave no physical trace -- though the target almost always knows something happened." },
    { "id": "soul", "name": "Soul", "glyphs": ["Decay", "Wrath", "Vitality", "Spirit", "Binding"],
      "description": "Vital essence and spiritual energy. Soul spells work on the force that animates living things -- accelerating it, diminishing it, or redirecting it." }
  ],
  "spellTiers": [
    { "id": "cantrip", "name": "Cantrip", "tn": 7, "th": 1, "description": "The most reliable tier. A single net Hit is enough; the lower TN means more dice land, so a small pool still Manifests consistently." },
    { "id": "standard", "name": "Standard", "tn": 8, "th": 2, "description": "The working core of any Arcanist's practice -- roughly half of all Known spells sit here. Two net Hits is achievable with a moderate pool, but Duds start to matter." },
    { "id": "advanced", "name": "Advanced", "tn": 8, "th": 3, "description": "Die pool size genuinely changes outcomes. Three net Hits rewards Arcanists who have invested in Discipline rank; a small pool attempting this tier is gambling." },
    { "id": "superior", "name": "Superior", "tn": 8, "th": 4, "description": "The ceiling of Evocation. Four net Hits leaves a narrow margin even with a strong pool; the risk of Rupture never fully disappears here." }
  ],
  "spellTagGlossary": [
    { "id": "AOE", "description": "Affects an area rather than specific targets." },
    { "id": "DoT", "description": "Damage over multiple rounds." },
    { "id": "EMP", "description": "Interacts with electronics and cyberware." },
    { "id": "Fire", "description": "Can ignite flammable material." },
    { "id": "Cold", "description": "Can freeze liquids and make surfaces treacherous." },
    { "id": "Concentration", "description": "Held rather than released; dice equal to the spell's Threshold are set aside for as long as it's held." },
    { "id": "Ench.", "description": "No Evocation form -- exists only as a Talisman." },
    { "id": "Alch.", "description": "No Evocation form -- exists only as an Artifact, a permanent working that spends no charges." },
    { "id": "AP", "description": "Armor Piercing, as the weapon tag: the spell bypasses the target's RES entirely. PROT still rolls." }
  ],
  "spellcraftRules": {
    "rollNote": "Assemble a d10 pool: Evocation rank for a live cast, Evocation + Enchantment rank when inscribing a Talisman, Evocation + Alchemy rank when inscribing an Artifact. Dice meeting or exceeding the spell's TN are Hits; a 1 is a Dud. A 10 is always a Hit and explodes -- roll and add another d10, which can explode again. Duds cancel Hits; what remains is net Hits, measured against the spell's TH.",
    "outcomes": {
      "overflow": "Net Hits exceed TH. The spell works and produces an additional effect: +1x per net Hit above TH, plus +1x per explosion. Known spells define what each x-tier produces; most list 1x and 2x+, and the 2x+ line applies at every tier above it -- at 4x, a spell that increases damage by ½ SP has increased it four times. Improvised Overflow is GM-determined.",
      "manifest": "Net Hits equal TH exactly. The spell works as intended -- no bonus, no shortfall.",
      "fizzle": "Net Hits fall short of TH and Duds don't exceed Hits. The Aether disperses. Nothing happens and nothing is owed.",
      "rupture": "Duds exceed Hits. TOL decreases by the degree of the Rupture (Duds minus Hits). A Rupture while formalizing a spell also sets its progress back by 1 successful cast.",
      "cascade": "A Rupture pushes TOL below zero. The Aether doesn't just fail, it breaks. Roll on the Cascade Table: 1d10 plus the Rupture's degree."
    },
    "exhaustion": "TOL reaching zero is the Exhausted condition, not a separate tracked resource. An Exhausted Arcanist cannot make Spellcraft rolls until TOL is above zero again. One hour of rest restores 1 TOL; full restoration takes as many hours as maximum TOL.",
    "charging": { "standardAction": true, "tnReductionPerTurn": 1, "maxTurns": 3, "floorTN": 5,
      "breakCheck": "Damage that lands forces a WILL Essence check (TN 8, TH 2); fail and the gathered Aether disperses, along with everything spent on it. Defending (Dodge/Parry/Scramble) leaves the charge intact. A successful Counterspell disperses it as well." },
    "concentration": "A held spell sets aside dice equal to its Threshold from the Arcanist's pool, unavailable for any Essence roll while held. Can be released at any time, and ends automatically if the Arcanist falls unconscious.",
    "sovereignSoul": { "note": "Any spell reaching into another person's body has to contend with the person inside it -- healing, transmutation, alteration, binding. Defined by the target being a living person, not by what the spell tries to do to them.",
      "willingConscious": "No modifier", "unconsciousAlly": "+1 TH", "unwilling": "+3 TH" },
    "spellPower": { "discipline": "evocation", "stat": "WILL",
      "text": "Spell Power is Evocation rank + WILL. Effects that say \"SP\" or \"½ SP\" read it." },
    "spellAttack": { "discipline": "evocation", "stats": ["REF", "WILL"],
      "text": "Spell Attack is Evocation rank + REF + WILL, the scores themselves and not their bonuses. Offensive spells aimed at a target roll it against the target's defenses." },
    "startingSpells": { "countFrom": "TOL", "discipline": "evocation",
      "text": "A new Arcanist starts with TOL + the power level's roll of Known spells from the book. At creation, a spell's TH can't be higher than your Evocation rank. After that, you can learn any spell." },
    "castingPool": { "discipline": "evocation",
      "beyond": "Beyond your pool. Only an exploding 10 reaches this TH." },
    "mastery": { "ipPerTH": 30, "thReduction": 1,
      "text": "Mastering a Known spell costs 30 IP × its TH, and takes 1 off its TH for good. A Mastered TH 1 spell needs no roll at all." },
    "forms": { "disciplines": ["evocation", "enchantment", "alchemy"],
      "text": "The same spell can exist as an Evocation, a Talisman or an Artifact: cast live, inscribed with Enchantment, or made permanent with Alchemy. A spell that lists its own disciplines exists only in those forms, at the Threshold and time the Enchantment table gives its tier." },
    "castingRequiresVoice": "Shaping Aether requires the caster's voice, not necessarily volume. Gagged, silenced, underwater, or in a vacuum, the Aether does not answer.",
    "progression": {
      "improvised": "No fixed formula. The Arcanist describes the intended effect in terms of available Glyphs; the GM sets TN and TH from complexity (roughly +1 TH per Glyph chained) and determines any Overflow. Cannot exceed the ceiling set by WILL.",
      "known": "Formalizes after 10 x TH successful casts of the same Improvised spell, gaining a fixed TN, TH and defined Overflow. A Rupture during casting sets progress back by 1 successful cast. A spell learned from a teacher or copied from another grimoire starts Known.",
      "mastered": "Costs 30 IP x TH of the spell. Once Mastered, TH is reduced by 1. A Mastered TH 0 spell requires no roll at all -- it can't Rupture or Overflow, and it survives Exhaustion, since a roll was never required."
    },
    "teaching": {
      "taught": "The original Arcanist walks the student through their notation: 1 hour per Threshold, both present, no roll. The spell becomes Known.",
      "copiedCold": "From a library find or someone else's grimoire: 1 hour per Threshold working through the notation, then a Spellcraft roll (Evocation rank only) against the spell's own TN/TH. Manifest: the spell is Known. Fizzle: the hours are gone, try again. Rupture: the entry looks correct and isn't -- found out on the next cast. (Book Arcanists get a free second attempt on a Fizzle via Between the Lines -- archetype content, not encoded here.)"
    }
  },
  /* Cascade and Aberrations (Decision 106) -- merged from Magic.md's Cascade
     Table and Aberration Table and Appendix_Aberrations.md's three lists,
     2026-09-23. Rows are ranges on a physical roll the player enters; the
     engine looks them up (`Engine.cascade`) and never rolls (Decision 11).
     `cascadeTable` starts at 3 on purpose: casting needs TOL above zero, so a
     Rupture that drives it below zero is degree 2 or more, and 1d10 + 2 can't
     come in under 3. `max: null` is open-ended (12+).
     `aberrations` are the Cascade's list, NOT the Arcanist's creation-time
     Unique Aberrations -- those are the archetype's `specialization.options`
     and a different list. `as` names the Advantage or Disadvantage an entry
     works like, as the CRB prints it; it's display text, not a grant. Once the character has an
     Aberration (`trackers.aberrations`, Decision 110), `painLevels` adds to
     Pain like a Condition and `adjust` moves a derived stat after its own
     floor, down to `aberrationRules.adjustFloor`. */
  "cascadeTable": {
    "die": "1d10",
    "rollNote": "Roll 1d10 and add the degree of the Rupture that caused it. The worse the failure, the worse the result.",
    "rows": [
      { "min": 3, "max": 4, "id": "cosmetic-mutation", "name": "Cosmetic Mutation", "effect": "A visible change — markings, glowing eyes, an altered voice. Lasts until TOL is fully restored." },
      { "min": 5, "max": 6, "id": "backlash", "name": "Backlash", "effect": "Spirit damage equal to your Spell Power." },
      { "min": 7, "max": 8, "id": "temporary-aberration", "name": "Temporary Aberration", "aberration": "temporary", "effect": "Roll on the Aberration table. Lasts 8 hours." },
      { "min": 9, "max": 11, "id": "permanent-aberration", "name": "Permanent Aberration", "aberration": "permanent", "effect": "Roll on the Aberration table; treat a Good result as Neutral. Removed only by quest or ritual." },
      { "min": 12, "max": null, "id": "burned-out", "name": "Burned Out", "effect": "You cannot cast until a significant quest or ritual restores your connection to the Aether." }
    ]
  },
  "aberrationTable": {
    "die": "1d10",
    "note": "The GM chooses the specific Aberration from the rolled category.",
    "rows": [
      { "min": 1, "max": 3, "temporary": "good", "permanent": "neutral" },
      { "min": 4, "max": 7, "temporary": "neutral", "permanent": "neutral" },
      { "min": 8, "max": 10, "temporary": "bad", "permanent": "bad" }
    ]
  },
  "aberrationCategories": [
    { "id": "good", "name": "Good" },
    { "id": "neutral", "name": "Neutral" },
    { "id": "bad", "name": "Bad" }
  ],
  "aberrationRules": {
    "intro": "The Aether leaves marks. Good, Neutral, and Bad describe mechanical tendency rather than moral weight. An Aberration is simply the shape the Aether decided to leave behind.",
    "temporary": "A Temporary Aberration lasts 8 hours.",
    "permanent": "Permanent Aberrations cannot be removed with IP. Only a quest, ritual, or other significant event will undo one.",
    "noStacking": "An Aberration doesn't stack with itself. You have it or you don't.",
    "adjustFloor": 0,
    "adjustNote": "Drained can take maximum TOL below 1, never below 0. Current TOL doesn't move when it comes or goes: you rest the rest back."
  },
  "aberrations": [
    {"id": "aether-reservoir", "name": "Aether Reservoir", "category": "good", "description": "Once per day, recover 2 TOL at any time."},
    {"id": "animal-ken", "name": "Animal Ken", "category": "good", "as": "Animal Ken Advantage", "description": "Your attunement extends to all living creatures. Animals sense no threat from you and are instinctively non-hostile. MAG Essence checks to calm, befriend, or interact with animals use TN 6."},
    {"id": "aura-sight", "name": "Aura Sight", "category": "good", "as": "Aura Sight Advantage", "description": "The Aether flowing through living beings has become visible to you. You perceive the energy fields of living beings within WILL meters, through solid objects and walls. An aura shows power level, mood, and overall health."},
    {"id": "clean-blood", "name": "Clean Blood", "category": "good", "description": "+1 die to resist Poisoned. Ordinary toxins and intoxicants have no effect on you."},
    {"id": "danger-sense", "name": "Danger Sense", "category": "good", "as": "Danger Sense Advantage, Rank 3", "description": "The Aether whispers before danger arrives. You sense threat at distances up to 500 meters — direction without detail, presence without identity."},
    {"id": "echolocation", "name": "Echolocation", "category": "good", "description": "Your body emits involuntary Aetheric pulses during moments of focus, returning as awareness of the space around you. Within 9 meters, you detect the presence, size, and shape of objects and creatures regardless of visibility. Suppressed when you cannot make sound."},
    {"id": "eidetic-memory", "name": "Eidetic Memory", "category": "good", "as": "Eidetic Memory Advantage", "description": "Your recall has permanently sharpened. INT Essence checks for memory recall succeed automatically. Suppressed while incapacitated, suffering a head injury, or under the influence of drugs or toxins."},
    {"id": "electrocytes", "name": "Electrocytes", "category": "good", "description": "Charged nerve cells line your spine, generating a low electrical field. You passively sense electrically active objects and creatures within 3 meters. As a Standard Action, you can discharge it: ½ Spell Power Elemental damage to everything within 2 meters, and augmented targets must make a TECH Essence check or be DeSynced."},
    {"id": "inactive-camouflage", "name": "Inactive Camouflage", "category": "good", "description": "Photoreceptors have developed across your skin. While completely still, a REF Essence check, TN 8 TH 2, renders you visually transparent. Clothing and equipment are unaffected. Any movement ends the effect."},
    {"id": "magnetic-grip", "name": "Magnetic Grip", "category": "good", "description": "Your hands and feet cling to metal. You climb metal surfaces at full movement, and metal objects in your grip cannot be Disarmed."},
    {"id": "night-eyes", "name": "Night Eyes", "category": "good", "description": "Treat Dark visibility as Dim, and Blind as Dark."},
    {"id": "quick-clot", "name": "Quick Clot", "category": "good", "description": "Your blood closes wounds almost as fast as they open. Bleeding ends on its own at the next Reset."},
    {"id": "steady-heart", "name": "Steady Heart", "category": "good", "description": "Mundane sources cannot make you Frightened."},
    {"id": "sure-step", "name": "Sure Step", "category": "good", "description": "Difficult Terrain costs you no extra movement, and does not hinder your Scramble."},
    {"id": "warded-flesh", "name": "Warded Flesh", "category": "good", "description": "+1 die on any defender check against a spell."},
    {"id": "bioluminescence", "name": "Bioluminescence", "category": "neutral", "description": "A soft glow emanates from part of your body. Roll 1d4 for its trigger: 1 — during or after spellcasting; 2 — at will; 3 — in darkness only; 4 — under emotional or physical stress. The color reflects your bond with the Aether, agreed with the GM. It cannot be suppressed once triggered."},
    {"id": "dense-frame", "name": "Dense Frame", "category": "neutral", "description": "Your body has grown impossibly heavy. +2 dice to resist being pushed, shoved, or knocked Prone. You sink in water and cannot swim."},
    {"id": "elemental-blood", "name": "Elemental Blood", "category": "neutral", "description": "Your blood has taken on an elemental quality. Roll 1d3: 1 — Fire, 2 — Cold, 3 — Lightning. Halve damage you take from that element. Anyone who strikes you unarmed or in melee takes ½ Spell Power Elemental damage."},
    {"id": "fast-metabolism", "name": "Fast Metabolism", "category": "neutral", "description": "Your cellular processes have accelerated. You heal twice as fast from rest and recover from conditions more quickly. Toxins and drugs — helpful ones included — run their course in half the time."},
    {"id": "fine-bristles", "name": "Fine Bristles", "category": "neutral", "description": "Thousands of near-invisible hairs register changes in airflow, pressure, and vibration. Within 3 meters, you detect movement and presence regardless of visibility."},
    {"id": "heterochromia", "name": "Heterochromia", "category": "neutral", "description": "Your eyes have become mismatched in color. Entirely cosmetic, but immediately recognizable to anyone who knows the signs."},
    {"id": "light-frame", "name": "Light Frame", "category": "neutral", "description": "Your body has grown impossibly light. Falls deal half damage. Pushes, shoves, and concussive force move you twice as far."},
    {"id": "medium", "name": "Medium", "category": "neutral", "as": "Medium Advantage", "description": "Your sensitivity has extended beyond the physical. You can perceive and, with effort, communicate with spirits and entities behind the veil. This draws the attention of things that notice such openness."},
    {"id": "mimetic-skin", "name": "Mimetic Skin", "category": "neutral", "description": "Chromatophores across your skin continuously shift to match nearby surfaces. Always active and cannot be suppressed. +3 to Stealth when not wearing heavy armor. This is ambient blending, not the active transparency of Inactive Camouflage."},
    {"id": "nocturnal", "name": "Nocturnal", "category": "neutral", "description": "Your rhythms have permanently shifted toward the dark. +1 to all checks in Dim or Dark visibility, −1 to all checks in Bright."},
    {"id": "ozone-trail", "name": "Ozone Trail", "category": "neutral", "description": "You carry a scent — ozone, incense, turned earth, something unplaceable. Anyone who has met you recognizes it, and anything that tracks by scent follows you easily."},
    {"id": "static-charge", "name": "Static Charge", "category": "neutral", "description": "Your touch shorts simple, non-hardened electronics, deliberately or not. Handling your own unshielded gear risks it."},
    {"id": "thought-projection", "name": "Thought Projection", "category": "neutral", "description": "Your surface thoughts broadcast involuntarily to Aetherically sensitive beings nearby. You cannot control what leaks, and you don't know what has."},
    {"id": "unreflected", "name": "Unreflected", "category": "neutral", "description": "Cameras, mirrors, and recordings capture you badly — blurred, delayed, or absent. You are nearly impossible to identify from footage. People who watch you in a mirror find it deeply unsettling."},
    {"id": "voltivorous", "name": "Voltivorous", "category": "neutral", "description": "Your body now draws on electrical current. Electrical damage heals you for half its amount instead of harming you. Go a day without absorbing at least 5 points of it, and you recover no TOL until you have."},
    {"id": "beacon", "name": "Beacon", "category": "bad", "as": "Monster Magnet Disadvantage", "description": "You radiate Aether like a lit window. Spirits, supernatural creatures, and other practitioners can sense you at a distance and find you without trying."},
    {"id": "drained", "name": "Drained", "category": "bad", "adjust": {"TOL": -2}, "description": "Your maximum TOL is reduced by 2."},
    {"id": "glossolalia", "name": "Glossolalia", "category": "bad", "description": "Your speech has fractured. Sound still comes out — words, sentences — but none of it is comprehensible, even to you. Written communication still works. So does Evocation, but whenever Duds appear in an Evocation roll, even on a successful cast, the GM decides how the Aether misread your intent. The effect is adjacent to what you attempted, but not quite it."},
    {"id": "hemophiliac", "name": "Hemophiliac", "category": "bad", "as": "Hemophiliac Disadvantage", "description": "Your blood no longer clots properly. Every wound keeps bleeding until treated."},
    {"id": "marked", "name": "Marked", "category": "bad", "description": "A visible sign of Aetheric exposure — scarring, discoloration, a pattern beneath the skin — that no makeup, clothing, or disguise fully hides. Anyone familiar with the signs knows what you are. −2 to Deception and Disguise to pass as ordinary. In a city where nobody practices openly, this is a problem."},
    {"id": "paranoia", "name": "Paranoia", "category": "bad", "as": "Minor Insanity Disadvantage — Paranoia", "description": "Your sensitivity to the Aether has become indistinguishable from threat perception. You are always on edge, and trust comes hard. Something is always watching — and eventually, that may be correct."},
    {"id": "phantom-pain", "name": "Phantom Pain", "category": "bad", "painLevels": 1, "description": "You permanently operate at one Pain Level higher than your Health Levels indicate."},
    {"id": "slow-tide", "name": "Slow Tide", "category": "bad", "description": "TOL recovers at 1 point per 2 hours of rest rather than per hour."},
    {"id": "tremor", "name": "Tremor", "category": "bad", "description": "A fine, constant shake has settled into your hands. −1 die on Enchantment and Alchemy rolls."}
  ],
  "enchantmentMaterialCategories": [
    { "id": "degradable", "name": "Degradable", "examples": ["Paper", "Cloth"], "charges": 1,
      "onUse": "Destroyed. Nothing remains.", "onRupture": "Destroyed.", "recharging": "Not applicable -- fast to produce and cheap to replace." },
    { "id": "once-living", "name": "Once-Living", "examples": ["Wood", "Bone", "Leather"], "charges": 3,
      "onDepletion": "Becomes inert. Inscription remains visible but is magically exhausted. Object survives.",
      "onRupture": "Inscription corrupted. Object survives but must be re-inscribed before next use or recharge.",
      "recharging": "Must be re-inscribed before every recharge cycle. After re-inscription, 1 TOL per charge restored (TOL cannot be spent below 0)." },
    { "id": "inorganic-durable", "name": "Inorganic Durable", "examples": ["Stone", "Metal", "Glass", "Crystal"], "charges": 5,
      "onDepletion": "Becomes inert. Inscription remains visible and magically intact. Object survives.",
      "onRupture": "Inscription corrupted. Object survives but must be re-inscribed before recharging.",
      "recharging": "No re-inscription required after normal depletion -- 1 TOL per charge restored (TOL cannot be spent below 0). After a Rupture, re-inscription is required first." }
  ],
  "enchantmentTimeTable": [
    { "tier": "cantrip", "th": { "evocation": 1, "enchantment": 3, "alchemy": 6 }, "minTime": { "enchantment": "3 hours", "alchemy": "6 days" } },
    { "tier": "standard", "th": { "evocation": 2, "enchantment": 4, "alchemy": 7 }, "minTime": { "enchantment": "4 hours", "alchemy": "7 days" } },
    { "tier": "advanced", "th": { "evocation": 3, "enchantment": 5, "alchemy": 8 }, "minTime": { "enchantment": "5 hours", "alchemy": "8 days" } },
    { "tier": "superior", "th": { "evocation": 4, "enchantment": 6, "alchemy": 9 }, "minTime": { "enchantment": "6 hours", "alchemy": "9 days" } }
  ],
  "enchantmentExtendedTime": {
    "note": "Each additional hour (Enchantment) or day (Alchemy) beyond the minimum reduces the final Spellcraft TH by 1, before the roll is made, capped by Discipline rank. Enchantment TH never drops below 2; Alchemy TH never drops below 5. Time spent beyond the cap confers no further benefit.",
    "reductionCapByRank": { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 }
  },

  "spells": [
    { "id": "dart", "name": "Dart", "tier": "cantrip", "domain": "elements", "glyph": "Fire", "tn": 7, "th": 1, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person or object", "effect": "½ SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Full Spell Power damage.", "2x+": "Full Spell Power damage, and the target is Burning." }, "tags": ["Fire"], "flavorLine": "A focused mote of incendiary energy hurled at a single target. The first spell most Arcanists learn to throw, and the one they keep throwing." },
    { "id": "gust", "name": "Gust", "tier": "cantrip", "domain": "elements", "glyph": "Air", "tn": 7, "th": 1, "range": "Short", "spellType": "utility", "target": "1 person or object", "effect": "Push 1-2m", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Push distance increases by 2m.", "2x+": "Push distance increases by 2m, and the target is Prone." }, "flavorLine": "A short burst of wind directed at a target or object. No damage unless the environment makes the push dangerous -- which, in NYTE City, it often is." },
    { "id": "kindle", "name": "Kindle", "tier": "cantrip", "domain": "elements", "glyph": "Fire", "tn": 7, "th": 1, "range": "Close", "spellType": "utility", "target": "1 small combustible object", "effect": "Ignites the target", "duration": "Instant", "defending": "None", "overflow": { "1x": "Ignites moderately resistant materials.", "2x+": "Ignites multiple objects at once, or ignition is instantaneous rather than gradual." }, "tags": ["Fire"], "flavorLine": "A focused burst of heat, enough to catch paper, dry cloth, or spilled fuel. What it does to what it touches is a separate matter." },
    { "id": "sparks", "name": "Sparks", "tier": "cantrip", "domain": "elements", "glyph": "Fire", "tn": 7, "th": 1, "range": "Close", "spellType": "offensive", "damageType": "elemental", "target": "1 person, or flammable objects in range", "effect": "1 Damage, and flammables ignite", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "½ Spell Power damage, or a significantly wider area ignited.", "2x+": "½ Spell Power damage, and the target is Burning." }, "tags": ["Fire"], "flavorLine": "A shower of sparks radiating outward. Enough to startle, not enough to matter unless something else catches." },
    { "id": "tremor", "name": "Tremor", "tier": "cantrip", "domain": "elements", "glyph": "Earth", "tn": 7, "th": 1, "range": "Short", "spellType": "utility", "target": "An area of ground or a single surface", "effect": "Destabilizes footing and loose objects", "duration": "1 round", "defending": "Scramble", "overflow": { "1x": "Affected area increases by 2m.", "2x+": "Affected area increases, and targets are Prone." }, "tags": ["AOE"], "flavorLine": "A focused vibration driven into a surface. Enough to startle, unbalance, or dislodge something poorly secured." },
    { "id": "zap", "name": "Zap", "tier": "cantrip", "domain": "elements", "glyph": "Lightning", "tn": 7, "th": 1, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person or electronic device", "effect": "½ SP Damage, or shorts simple electronics", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Full Spell Power damage.", "2x+": "Full Spell Power damage, and cybernetic targets may be DeSynced." }, "tags": ["EMP"], "flavorLine": "A focused arc of electrical energy. The caster chooses at time of casting whether to hurt someone or break something." },
    { "id": "everlight", "name": "Everlight", "tier": "cantrip", "domain": "elements", "glyph": "Fire", "tn": 8, "th": 1, "spellType": "utility", "disciplines": ["enchantment"], "target": "The Talisman", "effect": "Sheds light as a lamp out to 10m, raising Dark to Dim and Dim to Bright", "duration": "WILL hours", "defending": "None", "overflow": { "1x": "Brighter, or the color is the bearer's to choose.", "2x+": "Both, and the light can be dimmed to nothing and back without spending another charge." }, "tags": ["Ench."], "flavorLine": "The most common inscription in NYTE City, and the one nobody looks at twice." },
    { "id": "hearthstone", "name": "Hearthstone", "tier": "cantrip", "domain": "elements", "glyph": ["Fire", "Air"], "tn": 8, "th": 1, "spellType": "utility", "disciplines": ["enchantment"], "target": "An enclosed space up to 10m across", "effect": "The space holds a comfortable temperature and stays dry, regardless of what it is doing outside", "duration": "WILL hours", "defending": "None", "overflow": { "1x": "The space may be larger, or the air is filtered clean as well.", "2x+": "Both." }, "tags": ["AOE", "Ench."], "flavorLine": "A stone in the corner and the room stops being a problem. Squats and safehouses across the Zones run on these." },
    { "id": "push", "name": "Push", "tier": "cantrip", "domain": "force", "glyph": "Telekinesis", "tn": 7, "th": 1, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person or object", "effect": "Shove 2m", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Distance increases by 2m.", "2x+": "Distance increases by 2m, and the target is Prone." }, "flavorLine": "Raw kinetic force exerted against a person, object, or door. No damage unless they hit something on the way." },
    { "id": "shield", "name": "Shield", "tier": "cantrip", "domain": "force", "glyph": "Barrier", "tn": 7, "th": 1, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Absorbs SP damage of any type for 1 round", "duration": "1 round", "defending": "None", "overflow": { "1x": "Absorbed damage increases by ½ SP.", "2x+": "Absorbed damage increases by ½ SP, and the barrier holds an additional round." }, "flavorLine": "A barrier of shaped Aether. The most reliable defensive spell in the Force Domain, and the one most Arcanists master first." },
    { "id": "snatch", "name": "Snatch", "tier": "cantrip", "domain": "force", "glyph": "Telekinesis", "tn": 7, "th": 1, "range": "Short", "spellType": "utility", "target": "1 object of 5 lbs. or less", "effect": "Object is pulled to the caster", "duration": "Instant", "defending": "BOD Essence, if held", "overflow": { "1x": "Weight limit increases by 5 lbs.", "2x+": "Weight limit increases, or two objects are pulled at once." }, "flavorLine": "Pulls a small object through the air and into the caster's hand. Useful for weapons, keys, and anything that has ended up somewhere inconvenient." },
    { "id": "sure-grip", "name": "Sure Grip", "tier": "cantrip", "domain": "force", "glyph": "Telekinesis", "tn": 8, "th": 1, "range": "Contact", "spellType": "utility", "disciplines": ["enchantment"], "target": "The bearer, when the object would leave their hand", "effect": "The Disarmed condition is negated", "duration": "Until triggered", "defending": "None", "overflow": { "1x": "The object also returns to hand if already dropped, within 2m.", "2x+": "Returns from any distance within Short range." }, "tags": ["Ench."], "flavorLine": "The weapon decides it is staying." },
    { "id": "crystal-shield", "name": "Crystal Shield", "tier": "cantrip", "domain": "matter", "glyph": "Glass", "tn": 7, "th": 1, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Absorbs SP damage of any type for 1 round", "duration": "1 round", "defending": "None", "overflow": { "1x": "Absorbed damage increases by ½ SP.", "2x+": "Absorbed damage increases, and shards deal ½ SP damage to adjacent attackers when the barrier breaks." }, "flavorLine": "A crystalline barrier, visible and physical, that shatters loudly when it fails." },
    { "id": "thorn-snare", "name": "Thorn Snare", "tier": "cantrip", "domain": "matter", "glyph": "Wood", "tn": 7, "th": 1, "range": "5m radius", "spellType": "utility", "target": "All targets in the area", "effect": "Area becomes Difficult Terrain", "duration": "Until cleared", "defending": "Scramble", "overflow": { "1x": "Radius increases by 2m, or duration extends by 1 round.", "2x+": "Radius increases, and targets who fail are Restrained." }, "tags": ["AOE"], "flavorLine": "Forces growth from whatever organic material is present -- roots through concrete, vines from a planter, something that was not there a moment ago." },
    { "id": "glasswalk", "name": "Glasswalk", "tier": "cantrip", "domain": "matter", "glyph": ["Glass", "Insight"], "tn": 7, "th": 1, "range": "Touch", "spellType": "utility", "target": "One surface you are touching", "effect": "You see through it as though it were glass", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Thickness you can see through increases by 1m.", "2x+": "Thickness increases, and you hear through it as well." }, "tags": ["Concentration"], "flavorLine": "Put your hand on a wall and it stops being opaque. Only for you, and only while you are touching it." },
    { "id": "glimmer", "name": "Glimmer", "tier": "cantrip", "domain": "mind", "glyph": "Illusion", "tn": 7, "th": 1, "range": "Short", "spellType": "utility", "target": "1 person", "effect": "−1 to the target's next action", "duration": "1 round", "defending": "INT Essence", "overflow": { "1x": "A second target is affected.", "2x+": "A second target, and the penalty increases by 1." }, "flavorLine": "A flash of light at the edge of a target's vision -- bright enough to pull focus, brief enough to deny." },
    { "id": "hush", "name": "Hush", "tier": "cantrip", "domain": "mind", "glyph": "Illusion", "tn": 7, "th": 1, "range": "5m radius", "spellType": "utility", "target": "An area", "effect": "+1 to Stealth within the area for 1 round", "duration": "1 round", "defending": "None", "overflow": { "1x": "Radius increases by 2m, or duration by 1 round.", "2x+": "Both, or silence rather than dampening." }, "tags": ["AOE"], "flavorLine": "Sound dampened to almost nothing. Does not create silence. Creates deniability." },
    { "id": "sense", "name": "Sense", "tier": "cantrip", "domain": "mind", "glyph": "Insight", "tn": 7, "th": 1, "range": "Self", "spellType": "utility", "target": "Self", "effect": "Detect one of: active magic, movement, or hostile intent", "duration": "1 round", "defending": "None", "overflow": { "1x": "Duration increases by 1 round, or range by one band.", "2x+": "Two categories detected at once." }, "flavorLine": "Heightened awareness for the space of a breath." },
    { "id": "true-sight", "name": "True Sight", "tier": "cantrip", "domain": "mind", "glyph": "Insight", "tn": 7, "th": 1, "range": "Self", "spellType": "utility", "target": "Self", "effect": "Reveals hidden creatures, disguises, and invisibility", "duration": "WILL minutes", "defending": "Contested against the concealing effect", "overflow": { "1x": "Range increases by one band, or duration by 1 round.", "2x+": "Both, or extends to an additional sense." }, "flavorLine": "Perception sharpened past whatever is being used to obscure it." },
    { "id": "veil-of-shadows", "name": "Veil of Shadows", "tier": "cantrip", "domain": "mind", "glyph": "Illusion", "tn": 7, "th": 1, "range": "Self / Touch", "spellType": "utility", "target": "Self or 1 ally within reach", "effect": "Target counts as Dark to observers, and gains +1 to Stealth", "duration": "Concentration", "defending": "INT Essence to notice", "overflow": { "1x": "Duration extends by 1 round.", "2x+": "Duration extends, or a second target is covered." }, "flavorLine": "Ambient shadow drawn close. Not invisibility -- something better suited to a city with this many corners." },
    { "id": "borrowed-tongue", "name": "Borrowed Tongue", "tier": "cantrip", "domain": "mind", "glyph": ["Memory", "Air"], "tn": 7, "th": 1, "range": "Short", "spellType": "utility", "target": "Self", "effect": "Understand and speak one language being spoken within range", "duration": "WILL minutes", "defending": "None", "overflow": { "1x": "Duration doubles.", "2x+": "Duration doubles, and written forms of the language are legible too." }, "flavorLine": "You do not learn the language. You borrow the shape of it from whoever is speaking and give it back when they stop." },
    { "id": "watchward", "name": "Watchward", "tier": "cantrip", "domain": "mind", "glyph": "Insight", "tn": 8, "th": 1, "range": "Proximity", "spellType": "utility", "disciplines": ["enchantment"], "target": "Designated target type crossing the warded line", "effect": "The inscriber is alerted silently, at any distance on the same plane", "duration": "Until triggered", "defending": "None", "overflow": { "1x": "The alert carries direction and rough distance.", "2x+": "Direction and distance, and a sense of how many crossed." }, "tags": ["Ench."], "flavorLine": "You will know. Not where you are, not what you are doing -- you will simply know, the way you know someone is standing behind you." },
    { "id": "luck-of-the-bold", "name": "Luck of the Bold", "tier": "cantrip", "domain": "soul", "glyph": "Vitality", "tn": 7, "th": 1, "range": "Self", "spellType": "utility", "target": "Self", "effect": "Bonus to next action equal to net Hits, used within 1 round", "duration": "1 round", "defending": "None", "overflow": { "1x": "Bonus increases by 1.", "2x+": "Bonus increases, and the window extends by one action." }, "flavorLine": "A surge of certainty ahead of a moment that needs it." },
    { "id": "soothe", "name": "Soothe", "tier": "cantrip", "domain": "soul", "glyph": "Vitality", "tn": 7, "th": 1, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Negates fear-based penalties", "duration": "WILL minutes", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "Duration extends by 1 round.", "2x+": "Duration extends, and a second target is affected." }, "flavorLine": "Slows the heart rate, clears the adrenaline fog, takes the edge off whatever they just saw." },
    { "id": "mend", "name": "Mend", "tier": "cantrip", "domain": "soul", "glyph": "Decay", "tn": 7, "th": 1, "range": "Touch", "spellType": "utility", "target": "1 broken non-magical object", "effect": "The object is whole again", "duration": "Permanent", "defending": "None", "overflow": { "1x": "Repairs something substantially larger or more complex.", "2x+": "Repairs something that was in several pieces, or restores ½ SP Integrity to a damaged item." }, "flavorLine": "Decay run backwards. The object was whole once and the Aether remembers it, which is most of the work." },

    { "id": "aero-scythe", "name": "Aero Scythe", "tier": "standard", "domain": "elements", "glyph": "Air", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person or object", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, and the target is Bleeding." }, "flavorLine": "A blade of compressed air. The trajectory is flat and fast -- nothing visible until it arrives." },
    { "id": "blazing-fury", "name": "Blazing Fury", "tier": "standard", "domain": "elements", "glyph": "Fire", "tn": 8, "th": 2, "range": "5m radius", "spellType": "offensive", "damageType": "elemental", "target": "All targets in the area", "effect": "½ SP Damage each round the spell is held", "duration": "Concentration", "defending": "Scramble, each round", "overflow": { "1x": "Radius increases by 2m.", "2x+": "Radius increases, and targets who fail are Burning." }, "tags": ["AOE", "Fire", "Concentration"], "flavorLine": "The air around a point ignites, engulfing everything in it while the Arcanist holds the shape." },
    { "id": "elemental-battery", "name": "Elemental Battery", "tier": "standard", "domain": "elements", "glyph": ["Fire", "Water", "Lightning"], "tn": 8, "th": 2, "range": "Self", "spellType": "defensive", "target": "Self", "effect": "Absorbs up to SP Elemental damage; discharges on the caster's next attack", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Capacity increases by 1.", "2x+": "Capacity increases, and the charge can be released as its own attack rather than riding an existing one." }, "tags": ["Concentration"], "flavorLine": "Elemental force caught and held rather than dispersed. Fire taken is fire returned." },
    { "id": "firebolt", "name": "Firebolt", "tier": "standard", "domain": "elements", "glyph": "Fire", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person or object", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, and the target is Burning." }, "tags": ["Fire"], "flavorLine": "The workhorse of the Fire Glyph -- straightforward, reliable, and exactly as dangerous as the die pool makes it." },
    { "id": "fog-shroud", "name": "Fog Shroud", "tier": "standard", "domain": "elements", "glyph": "Water", "tn": 8, "th": 2, "range": "10m radius", "spellType": "utility", "target": "An area", "effect": "Area counts as Dark; line of sight across it is broken", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Radius increases by 2m.", "2x+": "Radius increases, and the area counts as Blind rather than Dark." }, "tags": ["AOE", "Concentration"], "flavorLine": "Ambient moisture condensed into a bank of fog thick enough to lose a firefight in." },
    { "id": "frostbite", "name": "Frostbite", "tier": "standard", "domain": "elements", "glyph": "Water", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person", "effect": "½ SP Damage, and the target's Movement is halved", "duration": "Until shaken off -- BOD Essence at Reset", "defending": "Dodge", "overflow": { "1x": "Full Spell Power damage.", "2x+": "Full Spell Power damage, and the target is Restrained." }, "tags": ["Cold"], "flavorLine": "A sharp chill across exposed skin, joints, extremities." },
    { "id": "hydro-push", "name": "Hydro Push", "tier": "standard", "domain": "elements", "glyph": "Water", "tn": 8, "th": 2, "range": "5m cone", "spellType": "utility", "target": "All targets in the cone", "effect": "Push 1-2m; extinguishes small fires", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Push distance increases by 2m.", "2x+": "Push distance increases, and targets are Prone." }, "tags": ["AOE"], "flavorLine": "A directed wave. Good for crowd control, better for making a mess of a room that needed one." },
    { "id": "ice-spear", "name": "Ice Spear", "tier": "standard", "domain": "elements", "glyph": "Water", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person or object", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, and the target is Restrained." }, "tags": ["Cold"], "flavorLine": "A lance of solid ice formed and hurled in one motion. It shatters on impact, which is loud and hard to explain." },
    { "id": "ignite", "name": "Ignite", "tier": "standard", "domain": "elements", "glyph": "Fire", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person or object", "effect": "Target is Burning until extinguished", "duration": "Until extinguished", "defending": "Dodge", "overflow": { "1x": "Burning severity increases by one step.", "2x+": "Burning severity increases, and the fire spreads to an adjacent target." }, "tags": ["Fire", "DoT"], "flavorLine": "Sets a target alight and leaves them to deal with it." },
    { "id": "inferno-burst", "name": "Inferno Burst", "tier": "standard", "domain": "elements", "glyph": "Fire", "tn": 8, "th": 2, "range": "5m radius", "spellType": "offensive", "damageType": "elemental", "target": "All targets in the area", "effect": "SP Damage", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Radius increases by 2m.", "2x+": "Radius increases, and targets who fail are Burning." }, "tags": ["AOE", "Fire"], "flavorLine": "A sudden detonation of heat radiating outward. Fire does not distinguish allies." },
    { "id": "lightning-bolt", "name": "Lightning Bolt", "tier": "standard", "domain": "elements", "glyph": "Lightning", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person or object", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP, and the target is Shocked.", "2x+": "Damage increases, the target is Shocked, and cybernetic targets may be DeSynced." }, "tags": ["EMP"], "flavorLine": "A direct bolt of electrical energy. In a city wired end to end, this spell has a way of finding more than it was aimed at." },
    { "id": "lightning-trap", "name": "Lightning Trap", "tier": "standard", "domain": "elements", "glyph": "Lightning", "tn": 8, "th": 2, "range": "Proximity", "spellType": "offensive", "damageType": "elemental", "disciplines": ["enchantment"], "target": "Designated target type entering range", "effect": "SP Damage on trigger", "duration": "Until triggered", "defending": "Scramble", "overflow": { "1x": "Damage increases by ½ SP, or area increases by 2m.", "2x+": "Both, and targets who fail are Shocked." }, "tags": ["EMP", "Ench."], "flavorLine": "A discharge waiting in an object for someone to come too close." },
    { "id": "quake", "name": "Quake", "tier": "standard", "domain": "elements", "glyph": "Earth", "tn": 8, "th": 2, "range": "10m radius", "spellType": "utility", "target": "All targets in the area", "effect": "Targets are Prone; loose structures may collapse", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Radius increases by 2m.", "2x+": "Radius increases, and the broken ground becomes Difficult Terrain." }, "tags": ["AOE"], "flavorLine": "A localized tremor, enough to destabilize structures and put people on the floor." },
    { "id": "shock", "name": "Shock", "tier": "standard", "domain": "elements", "glyph": "Lightning", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person or electronic device", "effect": "SP Damage, or disrupts hardened electronics", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP, and the target is Shocked.", "2x+": "Damage increases, and cybernetic targets may be DeSynced." }, "tags": ["EMP"], "flavorLine": "A sharper, more focused jolt than Zap." },
    { "id": "spark-trap", "name": "Spark Trap", "tier": "standard", "domain": "elements", "glyph": "Lightning", "tn": 8, "th": 2, "range": "Proximity", "spellType": "offensive", "damageType": "elemental", "disciplines": ["enchantment"], "target": "Designated target type entering range", "effect": "½ SP Damage on trigger", "duration": "Until triggered", "defending": "Scramble", "overflow": { "1x": "Additional triggers, or area increases by 2m.", "2x+": "Targets who fail are Shocked or DeSynced." }, "tags": ["EMP", "Ench."], "flavorLine": "A disorienting discharge set into an object. Less damage than its sibling, more confusion." },
    { "id": "static-burst", "name": "Static Burst", "tier": "standard", "domain": "elements", "glyph": "Lightning", "tn": 8, "th": 2, "range": "5m radius", "spellType": "offensive", "damageType": "elemental", "target": "Electronics and cyberware in the area", "effect": "½ SP Damage to electronics and cyberware", "duration": "Instant", "defending": "TECH Essence", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, and cybernetic targets are Shocked." }, "tags": ["AOE", "EMP"], "flavorLine": "An electromagnetic pulse radiating outward. Unaugmented targets feel nothing. Shielded housings take nothing either." },
    { "id": "tidal-surge", "name": "Tidal Surge", "tier": "standard", "domain": "elements", "glyph": "Water", "tn": 8, "th": 2, "range": "Short", "spellType": "utility", "target": "All targets in the area", "effect": "Push 1-2m; extinguishes fires and moves loose objects", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Push distance or area increases by 2m.", "2x+": "Both, and targets are Prone." }, "tags": ["AOE"], "flavorLine": "A wave surging outward. No direct damage -- the utility is the point." },
    { "id": "water-breathing", "name": "Water Breathing", "tier": "standard", "domain": "elements", "glyph": "Water", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 willing person within reach", "effect": "Target breathes underwater", "duration": "WILL hours", "defending": "None", "overflow": { "1x": "Duration doubles.", "2x+": "Duration extends, and a second target is affected." }, "flavorLine": "No combat application whatsoever, and occasionally the only thing that matters." },
    { "id": "wind-walker", "name": "Wind Walker", "tier": "standard", "domain": "elements", "glyph": "Air", "tn": 8, "th": 2, "range": "Self", "spellType": "utility", "target": "Self", "effect": "MOB increases by 1, and +1 to Dodge", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Duration extends by 1 round.", "2x+": "MOB and Dodge bonuses each increase by 1." }, "tags": ["Concentration"], "flavorLine": "Moving air wrapped close, lightening the step and sharpening the reaction." },
    { "id": "frost-trap", "name": "Frost Trap", "tier": "standard", "domain": "elements", "glyph": "Water", "tn": 8, "th": 2, "range": "Proximity", "spellType": "offensive", "damageType": "elemental", "disciplines": ["enchantment"], "target": "Designated target type entering the area", "effect": "½ SP Damage, and targets are Restrained", "duration": "Until triggered", "defending": "Scramble", "overflow": { "1x": "Area increases by 2m.", "2x+": "Area increases, and the ground remains Difficult Terrain for 1 round after." }, "tags": ["AOE", "Cold", "Ench."], "flavorLine": "Cold laid into the floor, waiting. It does not hurt much. It does not need to." },
    { "id": "arc-lash", "name": "Arc Lash", "tier": "standard", "domain": "force", "glyph": "Shockwave", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "aether", "target": "1 person or object", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage or range increases by 1.", "2x+": "Damage increases, and the target is Disarmed." }, "flavorLine": "A whip of raw Aether. Leaves a mark that does not look like anything conventional made it." },
    { "id": "crush", "name": "Crush", "tier": "standard", "domain": "force", "glyph": "Telekinesis", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage or knockback increases by 1.", "2x+": "Damage increases, and the target is Prone." }, "flavorLine": "A nearby object seized and slammed home at speed. What is available shapes what the damage looks like afterward." },
    { "id": "feather-fall", "name": "Feather Fall", "tier": "standard", "domain": "force", "glyph": "Gravity", "tn": 8, "th": 2, "range": "Short", "spellType": "utility", "target": "1 falling person or object", "effect": "Negates falling damage and the Prone that follows", "duration": "Instant", "defending": "None", "overflow": { "1x": "Radius extends to cover additional falling targets.", "2x+": "Radius extends, and duration covers a longer descent." }, "flavorLine": "A descent slowed to survivable speed. Can be cast on someone else mid-fall, which is a specific kind of rescue and requires seeing it happen." },
    { "id": "force-armor", "name": "Force Armor", "tier": "standard", "domain": "force", "glyph": "Barrier", "tn": 8, "th": 2, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Absorbs SP + net Hits damage of any type for 1 round", "duration": "1 round", "defending": "None", "overflow": { "1x": "Absorbed damage increases by ½ SP.", "2x+": "Absorbed damage increases, and the barrier holds an additional round." }, "flavorLine": "A layered barrier that scales with the quality of the cast rather than a flat value." },
    { "id": "force-burst", "name": "Force Burst", "tier": "standard", "domain": "force", "glyph": "Shockwave", "tn": 8, "th": 2, "range": "3m radius", "spellType": "offensive", "damageType": "physical", "target": "All targets in the area", "effect": "SP Damage, or push all targets outward", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Radius increases by 2m.", "2x+": "Radius increases, and targets are Prone." }, "tags": ["AOE"], "flavorLine": "Concussive energy radiating outward from the caster." },
    { "id": "kinetic-ward", "name": "Kinetic Ward", "tier": "standard", "domain": "force", "glyph": "Barrier", "tn": 8, "th": 2, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Absorbs SP × 2 Physical damage for 1 round", "duration": "1 round", "defending": "None", "overflow": { "1x": "Absorbed damage increases by ½ SP.", "2x+": "Absorbed damage increases, and the ward holds an additional round." }, "flavorLine": "A barrier tuned against impact and nothing else. The Arcanist who knows a firefight is coming reaches for this instead of Shield." },
    { "id": "repel", "name": "Repel", "tier": "standard", "domain": "force", "glyph": "Shockwave", "tn": 8, "th": 2, "range": "5m cone", "spellType": "utility", "target": "All targets in the cone", "effect": "Push 1-2m", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Push distance increases by 2m.", "2x+": "Push distance increases, and targets are Disoriented." }, "tags": ["AOE"], "flavorLine": "A concussive blast that shoves targets back and rattles them badly." },
    { "id": "spatial-warp", "name": "Spatial Warp", "tier": "standard", "domain": "force", "glyph": "Distortion", "tn": 8, "th": 2, "range": "Short", "spellType": "utility", "target": "An area or 1 projectile in flight", "effect": "Alters movement or trajectory; effects negotiated with the GM", "duration": "Concentration", "defending": "Dodge, where applicable", "overflow": { "1x": "Affected area or complexity increases.", "2x+": "Both, or duration extends by 1 round." }, "tags": ["Concentration"], "flavorLine": "Local space bent to alter how things move through it. A corridor made longer, a doorway made harder to reach than it looks." },
    { "id": "blink", "name": "Blink", "tier": "standard", "domain": "force", "glyph": "Distortion", "tn": 8, "th": 2, "range": "Short", "spellType": "utility", "target": "Self", "effect": "Teleport to any point within Short range that you can see", "duration": "Instant", "defending": "None", "overflow": { "1x": "Range extends by one band.", "2x+": "Range extends, and you may bring one willing person you are touching." }, "flavorLine": "Space folds briefly and you are standing somewhere else. The gap between is not a place, and nobody who has been through it can describe it." },
    { "id": "leaden", "name": "Leaden", "tier": "standard", "domain": "force", "glyph": ["Gravity", "Decay"], "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "target": "1 person", "effect": "Target loses their Fast Action each turn", "duration": "Until shaken off -- BOD Essence at Reset", "defending": "BOD Essence", "overflow": { "1x": "A second target is affected.", "2x+": "A second target, and the ground beneath them is Difficult Terrain." }, "flavorLine": "Everything they do costs more than it should. Their arms are heavier. So is the air." },
    { "id": "modify-weight", "name": "Modify Weight", "tier": "standard", "domain": "force", "glyph": "Gravity", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 unworn object you can touch", "effect": "Object's weight increases or decreases by 50%", "duration": "WILL hours", "defending": "None", "overflow": { "1x": "A further 50% in the same direction.", "2x+": "A further 50% per tier." }, "flavorLine": "Weight is a negotiation. Most objects have never been asked. Held is not worn -- a rifle in someone's hands is a valid target, and the first thing most Arcanists do with this spell is make one too heavy to aim." },
    { "id": "earthen-shield", "name": "Earthen Shield", "tier": "standard", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 2, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Grants Heavy Cover; Integrity SP × 2", "duration": "Until destroyed", "defending": "None", "overflow": { "1x": "Integrity increases by ½ SP.", "2x+": "Integrity increases, and the barrier covers an additional target." }, "flavorLine": "Hardened earth or concrete pulled up into a wall. Leaves debris behind when it drops." },
    { "id": "facemask", "name": "Facemask", "tier": "standard", "domain": "matter", "glyph": "Flesh", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Alter facial features -- human, or a supernatural type you have seen firsthand. +1 TH to appear as a specific person.", "duration": "Concentration", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "Realism improves, or the change holds without Concentration.", "2x+": "Both, and gestures and vocal patterns are mimicked as well." }, "tags": ["Concentration"], "flavorLine": "The face is genuinely different, not disguised. Fools cameras, fools people, does not fool gait analysis or a TAG scan." },
    { "id": "iron-lance", "name": "Iron Lance", "tier": "standard", "domain": "matter", "glyph": "Metal", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person or object", "effect": "SP Damage, armor piercing", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Range or armor penetration increases by 1.", "2x+": "Both, and the target is Bleeding." }, "tags": ["AP"], "flavorLine": "A lance of solid metal formed and driven home." },
    { "id": "mend-flesh", "name": "Mend Flesh", "tier": "standard", "domain": "matter", "glyph": "Flesh", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Restores 1d SP Health Levels", "duration": "Instant", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "Healing increases by ½ SP.", "2x+": "Healing increases, and the target resists damage for 1 round." }, "flavorLine": "Tissue knitted back together. Sovereign Soul applies." },
    { "id": "staunch", "name": "Staunch", "tier": "standard", "domain": "matter", "glyph": "Flesh", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Ends Bleeding, Burning, or Shocked", "duration": "Instant", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "A second ongoing condition ends.", "2x+": "All ongoing damage conditions end, and ½ SP Health Levels are restored." }, "flavorLine": "Seals what is open and smothers what is burning. Handles what the source left behind, not the source. Sovereign Soul applies." },
    { "id": "stone-lash", "name": "Stone Lash", "tier": "standard", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person or object", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Knockback added, or a second minor target struck.", "2x+": "Damage increases, and the target is Prone." }, "flavorLine": "Loose debris animated and whipped outward. Requires debris to be present, which in most of NYTE City is not a constraint." },
    { "id": "stone-skin", "name": "Stone Skin", "tier": "standard", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 2, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Absorbs SP damage of any type for 1 round", "duration": "1 round", "defending": "None", "overflow": { "1x": "Absorbed damage increases by ½ SP.", "2x+": "Absorbed damage increases, and the effect holds an additional round." }, "flavorLine": "Skin hardened to the density of stone. Movement is unaffected, which is the part that takes practice." },
    { "id": "stone-spike", "name": "Stone Spike", "tier": "standard", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP, or knockback added.", "2x+": "Damage increases, and the target is Restrained -- the spike pins rather than pierces clean." }, "flavorLine": "A jagged spike driven up through the ground. Requires the target to be standing on something the spell can work with." },
    { "id": "sure-hand", "name": "Sure Hand", "tier": "standard", "domain": "matter", "glyph": ["Flesh", "Insight"], "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 willing person within reach", "effect": "+1 die on their next Skill Check or attack", "duration": "1 round", "defending": "None", "overflow": { "1x": "The bonus increases by 1.", "2x+": "The bonus increases by 1, and applies to their next two actions." }, "flavorLine": "The hesitation goes out of them. Whatever they were about to do, they do it like they have done it a thousand times." },
    { "id": "command", "name": "Command", "tier": "standard", "domain": "mind", "glyph": "Compulsion", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "spirit", "target": "1 person", "effect": "Target performs one simple action on their next turn", "duration": "1 round", "defending": "WILL Essence", "overflow": { "1x": "A second action is forced, or complexity increases.", "2x+": "Duration extends, and a second target is affected." }, "flavorLine": "Single word, single action, no complexity. The target knows it happened." },
    { "id": "dread-pulse", "name": "Dread Pulse", "tier": "standard", "domain": "mind", "glyph": "Fear", "tn": 8, "th": 2, "range": "5m radius", "spellType": "offensive", "damageType": "spirit", "target": "All targets in the area", "effect": "Targets take a −1 penalty while in the area", "duration": "Concentration", "defending": "WILL Essence", "overflow": { "1x": "Radius increases by 2m, or duration by 1 round.", "2x+": "Radius increases, and targets are Frightened." }, "tags": ["AOE"], "flavorLine": "Psychic terror radiating outward. A wrongness nobody can source and a strong urge to be elsewhere." },
    { "id": "flashbang", "name": "Flashbang", "tier": "standard", "domain": "mind", "glyph": "Fear", "tn": 8, "th": 2, "range": "5m radius", "spellType": "offensive", "target": "An area", "effect": "Area counts as Blind for 1 round", "duration": "1 round", "defending": "Scramble", "overflow": { "1x": "Duration increases by 1 round, or radius by 2m.", "2x+": "Duration increases, and targets who fail are Blinded." }, "tags": ["AOE"], "flavorLine": "Functionally identical to the ordnance it is named after, minus the ordnance." },
    { "id": "mind-nudge", "name": "Mind Nudge", "tier": "standard", "domain": "mind", "glyph": "Compulsion", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "spirit", "target": "1 person", "effect": "Name a course the target is already on. Push, and they commit -- +2 to Social checks that move them further along it. Hold, and they falter -- −2 to any action that continues it.", "duration": "Until shaken off -- WILL Essence at Reset", "defending": "WILL Essence", "overflow": { "1x": "A second target is affected.", "2x+": "A second target, and the target acts on the nudge rather than merely leaning toward it." }, "flavorLine": "They were already going somewhere. A nudge with it means they arrive sooner and commit harder than they meant to. A nudge against it means they hesitate at exactly the wrong moment. Either way, the path was theirs. You only leaned on it." },
    { "id": "rewrite-memory", "name": "Rewrite Memory", "tier": "standard", "domain": "mind", "glyph": "Memory", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "damageType": "spirit", "target": "1 person within reach", "effect": "Alters a brief, recent memory", "duration": "Permanent", "defending": "WILL Essence", "overflow": { "1x": "Clarity of the implanted memory improves, or the window altered extends.", "2x+": "Both, or corroborating detail is implanted alongside it." }, "flavorLine": "A few minutes rewritten, a face swapped out. It holds under casual recall and frays under pressure. The target almost always knows something happened, even when they cannot say what. Sovereign Soul applies." },
    { "id": "fumble", "name": "Fumble", "tier": "standard", "domain": "mind", "glyph": ["Compulsion", "Telekinesis"], "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "target": "1 person", "effect": "Target is Disarmed", "duration": "Instant", "defending": "REF Essence", "overflow": { "1x": "The dropped item lands 2m away.", "2x+": "The item lands away from them, and the target is Prone reaching for it." }, "flavorLine": "Their grip decides, briefly, that it belongs to someone else." },
    { "id": "cleanse", "name": "Cleanse", "tier": "standard", "domain": "soul", "glyph": "Vitality", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Removes Bleeding, Blinded, Deafened, Disoriented, Frightened, or Poisoned", "duration": "Instant", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "A second condition is removed.", "2x+": "A second condition is removed, and the target resists reacquiring it this scene." }, "flavorLine": "An affliction drawn out and dispersed. Does not reach what the body has already accepted as permanent. Sovereign Soul applies." },
    { "id": "counterspell", "name": "Counterspell", "tier": "standard", "domain": "soul", "glyph": "Decay", "tn": 8, "th": null, "range": "Short", "spellType": "utility", "target": "1 creature charging a spell, within line of sight", "effect": "If successful, the spell is dispersed and the caster loses their progress.","defending": "Opposed Spellcraft (Evocation) check", "overflow": null, "notes": "Has no Threshold and no Overflow.", "flavorLine": "You attempt to unravel the Aether another caster is still gathering. Nothing about a charged spell wants to hold together, and you're helping to rip it apart." },
    { "id": "decay-burst", "name": "Decay Burst", "tier": "standard", "domain": "soul", "glyph": "Decay", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "spirit", "target": "1 person's worn or carried gear", "effect": "Strips SP Integrity from armor or equipment", "duration": "Until repaired", "defending": "BOD Essence", "overflow": { "1x": "Integrity stripped increases by ½ SP, or a second item is affected.", "2x+": "Both, or the affected item is destroyed outright." }, "flavorLine": "Decay accelerated through cloth, plate, and casing alike. The Aether does not respect material science." },
    { "id": "soul-anchor", "name": "Soul Anchor", "tier": "standard", "domain": "soul", "glyph": "Binding", "tn": 8, "th": 2, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Prevents astral travel, possession, or departure at death", "duration": "WILL hours", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "Duration extends significantly.", "2x+": "Duration extends, and a second anchor point is established." }, "flavorLine": "A significant working with significant implications, and one that should be entered into deliberately. Sovereign Soul applies." },
    { "id": "spirit-ward", "name": "Spirit Ward", "tier": "standard", "domain": "soul", "glyph": "Spirit", "tn": 8, "th": 2, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Absorbs SP × 2 Spirit damage; resists possession and compulsion", "duration": "1 round", "defending": "None", "overflow": { "1x": "Absorbed damage increases by ½ SP.", "2x+": "Absorbed damage increases, and the ward holds an additional round." }, "flavorLine": "A spirit anchored against intrusion. Does not stop physical harm. Stops the other thing." },
    { "id": "wither", "name": "Wither", "tier": "standard", "domain": "soul", "glyph": "Decay", "tn": 8, "th": 2, "range": "Short", "spellType": "offensive", "damageType": "spirit", "target": "1 person", "effect": "SP Damage", "duration": "Instant", "defending": "BOD Essence", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, and the target is Agonized." }, "flavorLine": "Vitality drawn straight out. The damage does not look like an injury. It looks like time." },
    { "id": "wrathful-smite", "name": "Wrathful Smite", "tier": "standard", "domain": "soul", "glyph": "Wrath", "tn": 8, "th": 2, "range": "Touch", "spellType": "offensive", "damageType": "spirit", "target": "1 weapon or the caster's own hands", "effect": "Adds SP Damage to the next successful attack", "duration": "Until your next attack", "defending": "None to imbue; the attack resolves normally", "overflow": { "1x": "Bonus damage increases by ½ SP.", "2x+": "Bonus damage increases, and the target is Agonized." }, "flavorLine": "Spiritual fury poured into a weapon. The energy discharges on contact whether the strike lands well or badly." },
    { "id": "tracer", "name": "Tracer", "tier": "standard", "domain": "soul", "glyph": ["Spirit", "Insight"], "tn": 8, "th": 2, "range": "Short", "spellType": "utility", "target": "1 person or object", "effect": "You sense the target's direction and rough distance", "duration": "WILL hours", "defending": "WILL Essence", "overflow": { "1x": "Duration doubles.", "2x+": "Duration doubles, and you sense whether the target is moving, still, or in distress." }, "flavorLine": "A thread tied to something that doesn't know it's carrying it." },
    { "id": "warding-elemental", "name": "Warding — Elemental", "tier": "standard", "domain": "soul", "glyph": ["Binding", "Barrier"], "tn": 8, "th": 2, "spellType": "defensive", "disciplines": ["alchemy"], "target": "One suit of armor, Mid quality or better", "effect": "The armor's RES applies to Elemental damage. Occupies one mod slot.", "duration": "Permanent", "defending": "None", "overflow": { "1x": "RES against Elemental damage increases by 1.", "2x+": "RES against Elemental damage increases by 2." }, "tags": ["Alch."], "flavorLine": "Armor stops what it was made to stop. The Aether was never on that list. Warding does not add protection so much as widen the definition of what the armor considers its business." },

    { "id": "chain-lightning", "name": "Chain Lightning", "tier": "advanced", "domain": "elements", "glyph": "Lightning", "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "1 person, then additional targets within 2m of the last", "effect": "SP Damage to each target struck", "duration": "Instant", "defending": "Dodge on the initial target; Scramble for each arc", "overflow": { "1x": "Arcs to one additional target.", "2x": "Arcs to two additional targets, and all targets hit are Shocked.", "3x": "Arcs to three additional targets, and cybernetic targets may be DeSynced." }, "tags": ["AOE", "EMP"], "flavorLine": "A bolt that strikes and then keeps going. Bringing more dice to this roll is not just about landing it. It is about how many people it reaches when it does." },
    { "id": "fireball", "name": "Fireball", "tier": "advanced", "domain": "elements", "glyph": "Fire", "tn": 8, "th": 3, "range": "3m radius", "spellType": "offensive", "damageType": "elemental", "target": "All targets in the area", "effect": "SP Damage", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Radius increases by 2m.", "2x+": "Radius increases, and targets who fail are Burning." }, "tags": ["AOE", "Fire"], "flavorLine": "A ball of flame thrown to a point and detonating on arrival. The radius is unforgiving and fire does not distinguish allies." },
    { "id": "frost-wall", "name": "Frost Wall", "tier": "advanced", "domain": "elements", "glyph": "Water", "tn": 8, "th": 3, "range": "Short", "spellType": "defensive", "target": "A line up to 5m long", "effect": "Grants Full Cover; Integrity SP × 2", "duration": "Until destroyed", "defending": "None", "overflow": { "1x": "Length or Integrity increases by ½ SP.", "2x+": "Both, and the wall shatters outward when destroyed, dealing ½ SP Damage within 2m." }, "tags": ["Cold"], "flavorLine": "A wall of ice raised along a line. Blocks line of sight and movement until destroyed or melted." },
    { "id": "ice-spike", "name": "Ice Spike", "tier": "advanced", "domain": "elements", "glyph": "Water", "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, and the target is Restrained and Agonized." }, "tags": ["Cold"], "flavorLine": "The same damage as Ice Spear in a narrower, faster delivery, and it holds the target in place far more effectively." },
    { "id": "aegis", "name": "Aegis", "tier": "advanced", "domain": "force", "glyph": ["Barrier", "Distortion"], "tn": 8, "th": 3, "range": "Self / Touch", "spellType": "defensive", "target": "Self or 1 ally within reach", "effect": "Absorbs SP × 2 damage of any type", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Absorbed damage increases by ½ SP.", "2x+": "Absorbed damage increases, and the barrier holds an additional round." }, "tags": ["Concentration"], "flavorLine": "The expensive answer to not knowing what is coming." },
    { "id": "arc-beam", "name": "Arc Beam", "tier": "advanced", "domain": "force", "glyph": "Shockwave", "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "damageType": "aether", "target": "All targets in a line", "effect": "SP Damage per round held", "duration": "Concentration", "defending": "Dodge, each round", "overflow": { "1x": "Beam length or damage per round increases by 1.", "2x+": "Both, and targets are Agonized." }, "tags": ["Concentration"], "flavorLine": "A beam of Aether sustained across rounds for as long as the Arcanist can hold it." },
    { "id": "telekinetic-shove", "name": "Telekinetic Shove", "tier": "advanced", "domain": "force", "glyph": "Telekinesis", "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "All targets in a line", "effect": "Shove 1-3m; SP Damage on collision", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Shove distance increases by 2m, or additional targets are caught.", "2x+": "Distance increases, and targets are Prone." }, "tags": ["AOE"], "flavorLine": "A wall of kinetic force driven down a line. Anything that hits something solid on the way takes the worse end of it." },
    { "id": "doorway", "name": "Doorway", "tier": "advanced", "domain": "force", "glyph": ["Distortion", "Glass"], "tn": 8, "th": 3, "range": "Close", "spellType": "utility", "target": "One surface up to 1m thick", "effect": "A passage opens; anyone may use it", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Thickness increases by 1m.", "2x+": "Thickness increases, and the passage can be closed early at will." }, "tags": ["Concentration"], "flavorLine": "A passage opened through a wall, a floor, a locked shutter. It is not a hole. The material is still there, and closes behind you as though nothing happened." },
    { "id": "stasis-trap", "name": "Stasis Trap", "tier": "advanced", "domain": "force", "glyph": ["Distortion", "Barrier"], "tn": 8, "th": 3, "range": "Proximity", "spellType": "offensive", "disciplines": ["enchantment"], "target": "Designated target type entering the area", "effect": "Target is held immobile and cannot act. They take no damage and deal none.", "duration": "Until shaken off -- BOD Essence at Reset", "defending": "REF Essence", "overflow": { "1x": "A second target can be held.", "2x+": "A second target, and the field muffles sound -- nobody inside can call for help." }, "tags": ["Ench."], "flavorLine": "Space closes around them. Nothing touches them, nothing hurts them, and they are not going anywhere." },
    { "id": "threshold-ward", "name": "Threshold Ward", "tier": "advanced", "domain": "force", "glyph": ["Barrier", "Binding"], "tn": 8, "th": 3, "range": "Proximity", "spellType": "defensive", "disciplines": ["enchantment"], "target": "A doorway, window, or opening up to 3m wide", "effect": "The designated target type cannot pass. Everyone else walks through unaware.", "duration": "Until triggered", "defending": "BOD Essence to force through, taking ½ SP Damage on success", "overflow": { "1x": "The opening warded may be larger, or a second target type named.", "2x+": "Both, and forcing through alerts the inscriber." }, "tags": ["Ench."], "flavorLine": "A door that is still a door, unless you are the thing it was made to keep out." },
    { "id": "boulder-slam", "name": "Boulder Slam", "tier": "advanced", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person", "effect": "SP Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage or knockback increases by 1.", "2x+": "Damage increases, and the target is Prone and Injured." }, "flavorLine": "A chunk of masonry, a vehicle panel, a section of wall. Requires something suitable to be present." },
    { "id": "knit-bone", "name": "Knit Bone", "tier": "advanced", "domain": "matter", "glyph": "Flesh", "tn": 8, "th": 3, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Removes the Injured condition", "duration": "Instant", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "½ SP Health Levels are restored alongside the repair.", "2x+": "All Injured conditions are repaired, and ½ SP Health Levels are restored." }, "flavorLine": "The fracture, the torn nerve, the joint that stopped answering. Takes the place of a week of downtime. Sovereign Soul applies." },
    { "id": "spike-trap", "name": "Spike Trap", "tier": "advanced", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 3, "range": "Proximity", "spellType": "offensive", "damageType": "physical", "disciplines": ["enchantment"], "target": "Designated target type entering the area", "effect": "SP Damage on trigger", "duration": "Until triggered", "defending": "Scramble", "overflow": { "1x": "Area increases by 2m.", "2x+": "Area increases, and targets who fail are Restrained." }, "tags": ["AOE", "Ench."], "flavorLine": "Stone spikes waiting under the floor. The shaping takes longer than a live cast allows, which is why nobody has ever thrown one." },
    { "id": "ironhide", "name": "Ironhide", "tier": "advanced", "domain": "matter", "glyph": ["Stone", "Vitality"], "tn": 8, "th": 3, "range": "Touch", "spellType": "defensive", "target": "1 person's worn armor", "effect": "Armor gains SP Integrity", "duration": "Scene", "defending": "None", "overflow": { "1x": "Integrity bonus increases by ½ SP.", "2x+": "Integrity increases, and armor lost to damage is restored at the end of the scene." }, "flavorLine": "Their armor remembers being stone. It holds together longer than it has any right to." },
    { "id": "quicken", "name": "Quicken", "tier": "advanced", "domain": "matter", "glyph": ["Flesh", "Telekinesis"], "tn": 8, "th": 3, "range": "Touch", "spellType": "utility", "target": "1 willing person within reach", "effect": "Target gains one additional Fast Action on their next turn", "duration": "1 round", "defending": "Sovereign Soul applies if unwilling", "overflow": { "1x": "A second target is affected.", "2x+": "A second target, and each gains +1 MOB on that turn." }, "flavorLine": "The body moves the way it does in the half-second before you decide to move it. Most people find it unpleasant. Nobody turns it down twice." },
    { "id": "unmake", "name": "Unmake", "tier": "advanced", "domain": "matter", "glyph": ["Metal", "Decay"], "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "target": "1 weapon, tool, or piece of equipment", "effect": "Target item's Integrity is reduced to 0 and it stops functioning", "duration": "Until repaired", "defending": "REF Essence to keep it clear", "overflow": { "1x": "A second item is affected.", "2x+": "A second item, and the first is destroyed outright." }, "flavorLine": "Metal remembers being ore. It takes very little to remind it." },
    { "id": "turning-rune", "name": "Turning Rune", "tier": "advanced", "domain": "matter", "glyph": ["Metal", "Distortion"], "tn": 8, "th": 3, "range": "Contact", "spellType": "defensive", "disciplines": ["enchantment"], "target": "The wearer, when struck", "effect": "The attack is redirected and misses entirely", "duration": "Until triggered", "defending": "None", "overflow": { "1x": "The redirected attack strikes a target within 2m of the wearer.", "2x+": "It strikes the attacker." }, "tags": ["Ench."], "flavorLine": "The round does not stop. It arrives somewhere else." },
    { "id": "blinding-flash", "name": "Blinding Flash", "tier": "advanced", "domain": "mind", "glyph": "Fear", "tn": 8, "th": 3, "range": "10m radius", "spellType": "offensive", "target": "An area", "effect": "Area counts as Blind for 1 round", "duration": "1 round", "defending": "Scramble", "overflow": { "1x": "Duration increases by 1 round, or radius by 2m.", "2x+": "Duration increases, and targets who fail are Blinded and Disoriented." }, "tags": ["AOE"], "flavorLine": "Brighter, broader, and harder to look away from than Flashbang." },
    { "id": "confuse", "name": "Confuse", "tier": "advanced", "domain": "mind", "glyph": "Compulsion", "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "damageType": "spirit", "target": "1 person", "effect": "Target's perception of their surroundings is distorted for 1-2 rounds", "duration": "Until shaken off -- WILL Essence at Reset", "defending": "WILL Essence", "overflow": { "1x": "Duration extends by 1 round.", "2x+": "Duration extends, the target is Disoriented, and may act against their own interests." }, "flavorLine": "Directions invert, faces shift, the floor stops being reliable. The target acts on what they believe they are seeing." },
    { "id": "ember-sight", "name": "Ember Sight", "tier": "advanced", "domain": "mind", "glyph": "Insight", "tn": 8, "th": 3, "range": "Self", "spellType": "utility", "target": "Self", "effect": "Heat sources resolve through darkness, smoke, and thin barriers", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Duration increases by 1 round, or range by one band.", "2x+": "Both, and residual heat can be tracked for WILL minutes after a target has left." }, "tags": ["Concentration"], "flavorLine": "Vision pushed into the infrared. Does not see through walls -- sees through the things people use to hide behind them." },
    { "id": "mirror-image", "name": "Mirror Image", "tier": "advanced", "domain": "mind", "glyph": "Illusion", "tn": 8, "th": 3, "range": "Self", "spellType": "defensive", "target": "Self", "effect": "1-3 illusory duplicates; attacks may strike a duplicate instead", "duration": "Concentration", "defending": "INT Essence to identify the original", "overflow": { "1x": "One additional duplicate.", "2x+": "Additional duplicates, and they act independently for 1 round." }, "tags": ["Concentration"], "flavorLine": "Duplicates moving in imperfect synchrony with the original. Each one dissipates when hit." },
    { "id": "invisicloak", "name": "Invisicloak", "tier": "advanced", "domain": "mind", "glyph": ["Illusion", "Barrier"], "tn": 8, "th": 3, "range": "Close", "spellType": "utility", "target": "An area, centered on a point within reach", "effect": "A dome of up to 3m radius, placed where it is cast. Anything inside is invisible from outside; vision from inside is unaffected", "duration": "Concentration", "defending": "INT Essence to notice the seam", "overflow": { "1x": "Extend the dome by up to 2m.", "2x+": "Extend the dome, and it moves with the caster rather than staying where it was placed." }, "tags": ["AOE", "Concentration"], "flavorLine": "A dome of shaped air that does not carry light out of itself. From outside there is nothing. From inside, everything is exactly where you left it." },
    { "id": "purge", "name": "Purge", "tier": "advanced", "domain": "soul", "glyph": "Vitality", "tn": 8, "th": 3, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Removes Agonized, Paralyzed, Restrained, Stunned, or DeSync", "duration": "Instant", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "A second condition is removed.", "2x+": "All conditions from the Cleanse list are removed as well." }, "flavorLine": "A harder working than Cleanse, reaching what has set deeper. The Aether does not heal these so much as refuse them. Sovereign Soul applies." },
    { "id": "silence", "name": "Silence", "tier": "advanced", "domain": "soul", "glyph": "Binding", "tn": 8, "th": 3, "range": "Short", "spellType": "offensive", "target": "1 person", "effect": "Target cannot speak or make vocal sound. They cannot cast.", "defending": "BOD Essence", "overflow": { "1x": "Duration extends by [X] rounds.", "2x+": "Duration extends, and the target is Disoriented." }, "tags": ["Concentration"], "flavorLine": "The vocal cords stop answering. Breath still moves, the jaw still works, and nothing at all comes out. It stops them from speaking. It does not stop them from shooting you." },
    { "id": "tether", "name": "Tether", "tier": "advanced", "domain": "soul", "glyph": "Binding", "tn": 8, "th": 3, "range": "Touch", "spellType": "utility", "target": "1 Dying person within reach", "effect": "Next Death check is an automatic success", "duration": "Until the next Reset", "defending": "None", "overflow": { "1x": "The automatic success covers the next two Resets.", "2x+": "Two Resets are covered, and the target stabilizes, ending Dying." }, "notes": "Cannot be cast twice on the same target in a scene -- the Aether will hold a thread, but it will not hold it twice.", "flavorLine": "It does not stabilize them and does not wake them. It buys one round. Sovereign Soul applies." },
    { "id": "consecrate", "name": "Consecrate", "tier": "advanced", "domain": "soul", "glyph": ["Spirit", "Wrath"], "tn": 8, "th": 3, "range": "Touch", "spellType": "utility", "target": "1 weapon, or the caster's own hands", "effect": "The weapon gains the Withering (Holy) tag on the next successful attack. Holy affects vampires and things like them; werewolves, Arcanists, cyborgs and ordinary people feel nothing.", "duration": "Until your next attack", "defending": "None", "overflow": { "1x": "The tag applies to attacks for 1 round.", "2x+": "The tag applies for 2 rounds." }, "flavorLine": "Some things do not care about steel. They care about this." },
    { "id": "second-wind", "name": "Second Wind", "tier": "advanced", "domain": "soul", "glyph": ["Vitality", "Binding"], "tn": 8, "th": 3, "spellType": "utility", "disciplines": ["enchantment"], "target": "The bearer", "effect": "Washes away 1 point of accumulated strain, restoring 1 TOL", "duration": "Until triggered", "defending": "None", "overflow": { "1x": "Restores 2 TOL.", "2x+": "Restores 3 TOL." }, "tags": ["Ench."], "flavorLine": "Tolerance does not travel well, but it can be set down somewhere and picked up later. This is storage, not generation -- charging costs the usual 1 TOL per charge, so nobody profits by filling and emptying one. What it buys is timing, and generosity: the Arcanist who fills it need not be the one who uses it." },
    { "id": "consecration", "name": "Consecration", "tier": "advanced", "domain": "soul", "glyph": ["Spirit", "Wrath"], "tn": 8, "th": 3, "spellType": "utility", "disciplines": ["alchemy"], "target": "One weapon", "effect": "The weapon permanently gains the Withering (Holy) tag. Holy affects vampires and things like them; werewolves, Arcanists, cyborgs and ordinary people feel nothing.", "duration": "Permanent", "defending": "None", "overflow": { "1x": "Also functions against things that would normally ignore the tag.", "2x+": "The weapon is visibly marked, and things that should fear it do." }, "tags": ["Alch."], "flavorLine": "The weapon was always going to cut this way. Consecration does not add anything; it settles an argument the blade was already having." },
    { "id": "warding-spirit", "name": "Warding — Spirit", "tier": "advanced", "domain": "soul", "glyph": ["Binding", "Barrier"], "tn": 8, "th": 3, "spellType": "defensive", "disciplines": ["alchemy"], "target": "One suit of armor, Mid quality or better", "effect": "The armor's RES applies to Spirit damage. Occupies one mod slot.", "duration": "Permanent", "defending": "None", "overflow": { "1x": "RES against Spirit damage increases by 1.", "2x+": "RES against Spirit damage increases by 2." }, "tags": ["Alch."], "flavorLine": "The same working, pitched at something harder to argue with." },

    { "id": "focused-lightning", "name": "Focused Lightning", "tier": "superior", "domain": "elements", "glyph": "Lightning", "tn": 8, "th": 4, "range": "Short", "spellType": "offensive", "damageType": "elemental", "target": "All targets in a line", "effect": "SP × 2 Damage", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Line length extends by 2m.", "2x+": "Line extends, and all targets hit are Shocked and Stunned." }, "tags": ["AOE"], "flavorLine": "At this scale the spell is pure force rather than arc discharge, and the EMP tag is absent. What it hits, it hits hard." },
    { "id": "frost-spire", "name": "Frost Spire", "tier": "superior", "domain": "elements", "glyph": "Water", "tn": 8, "th": 4, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "Whatever occupies the target point", "effect": "SP × 2 Damage", "duration": "Instant -- the spire remains until destroyed", "defending": "Scramble to move clear before emergence", "overflow": { "1x": "Damage or spire size increases by 1.", "2x+": "Damage increases, the target is Restrained, and the spire shatters when destroyed for ½ SP within 2m." }, "tags": ["Cold"], "flavorLine": "A pillar of ice erupting from the ground. It remains afterward as a physical obstacle until destroyed or melted." },
    { "id": "ice-barrage", "name": "Ice Barrage", "tier": "superior", "domain": "elements", "glyph": "Water", "tn": 8, "th": 4, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "Designated targets, chosen at time of casting", "effect": "SP Damage distributed as the caster chooses", "duration": "Instant", "defending": "Dodge, per target", "overflow": { "1x": "2 additional projectiles, or damage per projectile increases.", "2x": "Additional projectiles, and targets are Restrained.", "3x": "Additional projectiles, and targets are Restrained and Bleeding." }, "tags": ["Cold"], "flavorLine": "Shards driven simultaneously at everyone the caster has decided is a problem." },
    { "id": "inferno", "name": "Inferno", "tier": "superior", "domain": "elements", "glyph": "Fire", "tn": 8, "th": 4, "range": "5m radius", "spellType": "offensive", "damageType": "elemental", "target": "All targets in the area", "effect": "SP × 2 Damage", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Radius increases by 2m.", "2x+": "Radius increases, and targets who fail are Burning and Agonized." }, "tags": ["AOE", "Fire"], "flavorLine": "A roaring column of flame. Structures burn. Cover burns. The caster should have a plan for what the room looks like afterward." },
    { "id": "aether-lance", "name": "Aether Lance", "tier": "superior", "domain": "force", "glyph": "Shockwave", "tn": 8, "th": 4, "range": "Short", "spellType": "offensive", "damageType": "aether", "target": "1 person or object", "effect": "SP × 2 Damage; ignores armor and barriers", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, a second target in line is struck, and both are Agonized." }, "flavorLine": "A spear of pure Aether that passes through barriers as though they were not there. Armor offers no protection either. This is not an impact." },
    { "id": "gravity-crush", "name": "Gravity Crush", "tier": "superior", "domain": "force", "glyph": "Gravity", "tn": 8, "th": 4, "range": "10m radius", "spellType": "offensive", "damageType": "physical", "target": "All targets in the area", "effect": "SP Damage, and targets are driven Prone", "duration": "Instant", "defending": "Scramble", "overflow": { "1x": "Radius or damage increases by ½ SP.", "2x+": "Both, and targets are Restrained and Agonized." }, "tags": ["AOE"], "flavorLine": "Local gravity multiplied. Loose objects become part of the problem." },
    { "id": "phase-shift", "name": "Phase Shift", "tier": "superior", "domain": "force", "glyph": "Distortion", "tn": 8, "th": 4, "range": "Self", "spellType": "utility", "target": "Self", "effect": "Intangible -- passes through solids, immune to physical harm, cannot affect anything material", "duration": "Concentration", "defending": "None", "overflow": { "1x": "Duration extends by 1 round.", "2x+": "Duration extends, and one additional person can be carried through." }, "tags": ["Concentration"], "flavorLine": "Briefly outside physical reality. The re-entry is not always clean." },
    { "id": "telekinetic-barrage", "name": "Telekinetic Barrage", "tier": "superior", "domain": "force", "glyph": "Telekinesis", "tn": 8, "th": 4, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person", "effect": "SP Damage across multiple impacts", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "2 additional strikes, or damage per strike increases.", "2x+": "Additional strikes, and the target is Prone and Bleeding." }, "flavorLine": "Debris, furniture, loose fittings -- whatever the room is willing to give up, delivered at speed." },
    { "id": "borrowed-time", "name": "Borrowed Time", "tier": "superior", "domain": "force", "glyph": "Distortion", "tn": 8, "th": 4, "range": "Touch", "spellType": "utility", "target": "1 willing person within reach", "effect": "Once before the Duration ends, the target may reroll any one check", "duration": "Scene", "defending": "None", "overflow": { "1x": "The reroll may be used twice.", "2x+": "Twice, and the target chooses which result stands on each." }, "flavorLine": "A moment set aside and handed back when it is needed. The Aether does not care that it has already happened." },
    { "id": "boulder-crush", "name": "Boulder Crush", "tier": "superior", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 4, "range": "Short", "spellType": "offensive", "damageType": "physical", "target": "1 person", "effect": "SP × 2 Damage", "duration": "Instant", "defending": "Dodge", "overflow": { "1x": "Damage increases by ½ SP.", "2x+": "Damage increases, the target is Prone and Injured, and nearby structure may collapse." }, "flavorLine": "Something genuinely large, lifted and brought down. Leaves the room substantially changed." },
    { "id": "spikefield", "name": "Spikefield", "tier": "superior", "domain": "matter", "glyph": "Stone", "tn": 8, "th": 4, "range": "Proximity", "spellType": "offensive", "damageType": "physical", "disciplines": ["enchantment"], "target": "Designated target type entering the area", "effect": "SP Damage on trigger", "duration": "Until triggered", "defending": "Scramble", "overflow": { "1x": "Area or spike count increases.", "2x+": "Targets who fail are Restrained and Bleeding." }, "tags": ["AOE", "Ench."], "flavorLine": "A wide array of spikes set into the ground and left to wait. The most expensive thing an Enchanter can leave in a hallway." },
    { "id": "blinding-nova", "name": "Blinding Nova", "tier": "superior", "domain": "mind", "glyph": "Fear", "tn": 8, "th": 4, "range": "15m radius", "spellType": "offensive", "target": "An area", "effect": "Area counts as Blind for 1 round", "duration": "1 round", "defending": "Scramble", "overflow": { "1x": "Radius increases by 2m, or duration by 1 round.", "2x+": "Both, targets who fail are Blinded, and optical cyberware may be DeSynced." }, "tags": ["AOE"], "flavorLine": "Light intense enough to overwhelm across a wide radius. Anyone with optical augmentation takes it worse." },
    { "id": "dominate-mind", "name": "Dominate Mind", "tier": "superior", "domain": "mind", "glyph": "Compulsion", "tn": 8, "th": 4, "range": "Short", "spellType": "offensive", "damageType": "spirit", "target": "1 person", "effect": "Caster controls the target's action for 1 round", "duration": "1 round", "defending": "WILL Essence", "overflow": { "1x": "Duration extends by 1 round.", "2x+": "Duration extends, a complex or multi-part action can be forced, and the target is Stunned on release." }, "flavorLine": "They know it happened, they remember it happening, and they were present for all of it. This is not a subtle working and it is not forgiven. Sovereign Soul applies." },
    { "id": "return", "name": "Return", "tier": "superior", "domain": "soul", "glyph": "Vitality", "tn": 8, "th": 4, "range": "Touch", "spellType": "utility", "target": "1 person within reach", "effect": "Restores SP × 2 Health Levels and ends Dying", "duration": "Instant", "defending": "WILL Essence, if unwilling", "overflow": { "1x": "½ SP additional Health Levels, and one condition is removed.", "2x+": "Full Health Level restoration, and all conditions from the Cleanse list are removed." }, "flavorLine": "The most powerful healing available through Evocation, and still not a resurrection. The target has to be alive when it lands. Sovereign Soul applies." },
    { "id": "vigil", "name": "Vigil", "tier": "superior", "domain": "soul", "glyph": "Binding", "tn": 8, "th": 4, "range": "Touch", "spellType": "utility", "target": "1 body dead within WILL minutes", "effect": "Holds the soul in place and arrests decay", "duration": "Concentration", "defending": "None", "overflow": { "1x": "The ward persists WILL minutes after concentration ends.", "2x+": "The ward persists WILL hours after concentration ends, and the body is protected from further harm." }, "tags": ["Concentration"], "flavorLine": "Held, not cast and forgotten. The Arcanist is carrying something, and everything else they do is harder for it. Letting go is always available, and always a decision someone has to say out loud." },
    { "id": "warding-aether", "name": "Warding — Aether", "tier": "superior", "domain": "soul", "glyph": ["Binding", "Barrier"], "tn": 8, "th": 4, "spellType": "defensive", "disciplines": ["alchemy"], "target": "One suit of armor, Mid quality or better", "effect": "The armor's RES applies to Aether damage. Occupies one mod slot.", "duration": "Permanent", "defending": "None", "overflow": { "1x": "RES against Aether damage increases by 1.", "2x+": "RES against Aether damage increases by 2." }, "tags": ["Alch."], "flavorLine": "Raw Aether goes through armor, barriers, and most of what anyone puts between themselves and it. This is the exception, and there is no other." }
  ],

  /* CREATION FLOW -- the ordered wizard steps and the rules for leftover CP.
     `steps` is the 8-step sequence the wizard renders (label + optional note).
     `boostRules.cpCostPerPoint` is what one Boost of a stat or skill costs from
     leftover Character Points (F2, closed by Decision 97). The rest of the
     boost rules are the engine's, not settings: any one target is boosted at
     most the power level's `maxBoost` times (Decision 3), the stat cap and
     Max Skill Rank still bound it, and LUCK is bought on its own line, so the
     cap never touches it. Fields that restated those were deleted (Decision 135;
     Decision 64 is the precedent). Reorder/relabel steps freely; keep
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
      "cpCostPerPoint": 1
    }
  }
};
