<!-- MIRROR — do not edit here. See docs/reference/crb/README.md for source, refresh instructions, and why this file is kept. Pulled 2026-09-04. -->

# Conditions and Recovery

Damage takes Health Levels, and enough damage kills you. But that which doesn’t kill you outright might still ruin your day.

A Condition is a state that changes what you can do, and most of what actually stops a character in NYTE City is a Condition rather than a gunshot. You can be at full health and still unable to stand up.

## How Conditions Work

- **You have it or you don’t.** A Condition doesn’t stack with itself. Two people laying into you with an HFT-3 Hellmouth still counts as one *Burning*. If a grenade is tossed your way, there’s nothing stopping you from being *Blinded* and *Disoriented* while also *Burning*, however.

- **They arrive from damage, hazards, and Combat Maneuvers.** A blade opens you up, an electrical current locks you down, or a martial artist rings your bell and plants you on the ground.

- **They clear on their own terms.** Some end with an **Essence Check** during the **Reset** phase, while others end when you’re clear of the situation. Some require intervention from an ally and others from a hospital.

- **Helpless is as good as dead.** Several Conditions have the *Helpless* effect, during which you can’t move or react in any way. Any attack roll of 2 or better is a guaranteed hit.

## Conditions

<table>
<colgroup>
<col style="width: 19%" />
<col style="width: 43%" />
<col style="width: 37%" />
</colgroup>
<thead>
<tr>
<th>Condition</th>
<th>Effect</th>
<th>Recovery</th>
</tr>
</thead>
<tbody>
<tr>
<td>Agonized</td>
<td>Operate at 1 Pain Level higher, to a max PL 3</td>
<td>Medical (Difficulty 15) or Nanomed Kit</td>
</tr>
<tr>
<td>Bleeding</td>
<td>-1 HP per round</td>
<td>BOD Essence TN 8 TH 1, Medical (Difficulty 15), or Nanomed kit</td>
</tr>
<tr>
<td>Blinded</td>
<td>Can’t see. Autofail any check requiring sight.<br />
Attack/Defense at -5 penalty.</td>
<td>BOD Essence TN 8 TH 1, or end of scene (temp)</td>
</tr>
<tr>
<td>Burning</td>
<td>Ongoing damage based on source<br />
-1 to all rolls</td>
<td>Source removed, then treat as Bleeding</td>
</tr>
<tr>
<td>Deafened</td>
<td>Can’t hear. Autofail any check requiring hearing. Can’t hear instructions or comms.</td>
<td>BOD Essence TN 8 TH 1, or end of scene (temp)</td>
</tr>
<tr>
<td>DeSynced</td>
<td>Cybernetic systems aren’t talking or are offline for a body part (limbs, head, torso)</td>
<td>TECH Essence TN 8 TH 2, or 1d4 rounds for system reboot</td>
</tr>
<tr>
<td>Disarmed</td>
<td>You aren’t holding your weapon and cannot use it.</td>
<td>Recover the weapon, spending Move, Fast, or Standard to do so.</td>
</tr>
<tr>
<td>Disoriented</td>
<td>-1 to all rolls</td>
<td>BOD Essence TN 8 TH 1, or end of scene (temp)</td>
</tr>
<tr>
<td>Frightened</td>
<td>-1 to all rolls while source is present.<br />
Can’t willingly move toward source.</td>
<td>Source removed, or WILL essence TN 8 TH 2 with source present</td>
</tr>
<tr>
<td>Grappled</td>
<td>-5 to anything requiring sophisticated movement</td>
<td>Source removed, or BOD/REF opposed essence against grappler (escapee’s choice)</td>
</tr>
<tr>
<td>Injured</td>
<td>Body part is damaged and not functional</td>
<td>Focused Healing or 1 week downtime</td>
</tr>
<tr>
<td>Maimed</td>
<td>Body part is gone</td>
<td>Purchasing or creating a replacement</td>
</tr>
<tr>
<td>Paralyzed</td>
<td>Helpless</td>
<td>Source removed or Nanomed kit</td>
</tr>
<tr>
<td>Poisoned</td>
<td>Inflicts condition based on specific poison</td>
<td>BOD Essence TN 8 TH 2-4 (depending on poison), antidote, or Nanomed kit</td>
</tr>
<tr>
<td>Prone</td>
<td>Movement halved, Attack/Defense at -3 penalty.</td>
<td>Move spent to Stand</td>
</tr>
<tr>
<td>Restrained</td>
<td>Movement reduced to 0, -5 to all Actions, cannot Dodge</td>
<td>Source removed, or BOD/REF Essence TN 8 TH 2 (escapee’s choice)</td>
</tr>
<tr>
<td>Shocked</td>
<td>Ongoing damage based on source<br />
-1 to all rolls</td>
<td>Source removed, then treat as Bleeding</td>
</tr>
<tr>
<td>Stunned</td>
<td>Helpless</td>
<td>BOD Essence TN 8 TH 2</td>
</tr>
<tr>
<td>Unconscious</td>
<td>Helpless</td>
<td>Varies by source — see <em>Going Down</em></td>
</tr>
</tbody>
</table>

## Pain

Not only will enough damage kill you, but it will hurt the whole time you’re dying. As your Health Levels deplete you gain Pain Levels, and certain situations can inflict Pain as well. These adjustments are cumulative, and the total never falls below 0 or climbs above 3.

| Pain Level | Health Levels lost | What it feels like |
|----|----|----|
| 0 | 0–1 | Shock and adrenaline. Surface wounds. |
| 1 | 2 or more | Deep bruising, bleeding, movement compromised |
| 2 | 5 or more | Fractures, internal damage, failing strength |
| 3 | 8 or more | Catastrophic injury. Survival is uncertain. |

Each Pain Level has a cumulative effect:

- -1 to Skill Checks

- -1 die from Essence Check pools

- -5% on Breaker Checks

Essence Check pools never drop below 1, and Breaker Checks never drop below 10%

A high BOD character on Pain Level 3 will experience -3 penalty to Skill Checks, -3 die from their Essence Checks, and -15% on Breaker Checks. However, even low BOD characters can suffer incredible Pain through different conditions, disadvantages, or other means.

## Going Down

Health Levels empty and Pain takes its cut, and for most of a fight that’s all that happens. Armor and cover do their jobs and attacks slowly grind away at you.

Then something breaks through.

### Shock

A single hit that takes half your Health Levels or more is too much for the body to handle at once. Make a **BOD Essence Check TN 8 TH 2**.

- **Pass** and you’re still standing, like the badass you are

- **Fail** and you’re **Unconscious** and **Prone** until the start of your next turn

The next round matters. Unconscious means you’re helpless, and helpless means anyone can drop you with a 2 or better on the die. Plenty of people have survived the first hit but not the second.

If a hit drops you to zero Health Levels, regardless of where you were before, you skip the Shock check entirely. You’ve got bigger problems to deal with.

### At Zero

When your last Health Level empties, make an immediate **WILL Essence Check TN 8 TH 2** — and again every time you take damage until you’ve regained health. Pain penalties do not apply to these checks.

- **Pass** and you’re Unconscious and Prone. Out of the fight, but not out of the world.

- **Fail** and you’re **Dying**.

The *9 Lives* advantage gives you a free pass on this check without rolling, but only up to 9 times in your lifetime. It doesn’t keep you on your feet, but it keeps you from bleeding out on someone’s floor.

### Dying

Once you’re Dying, make a **WILL Essence Check TN 8 TH 2** at every Reset phase until you’ve regained health. Pain penalties do not apply to these checks.

- **Success** buys you the round, and nothing more. You don’t stabilize and you don’t wake up unless something or someone intervenes.

- **Failure** is a mark against you. After three Death Marks against you, you die.

  - Any damage you take while Dying is an automatic failure and a mark against you. An unconscious body on the floor doesn’t get to dodge bullets.

  - Ongoing damage from Burning, Bleeding, or other situations will continue to tick while you’re dying. Each time you take damage, that’s another mark against you.

  - Accumulated Death Marks reset when you are no longer Dying

> **Callout: Death**
>
> Once three Death Marks accumulate against you while Dying, you are dead, and your options are seriously limited.
>
> \* You can hope you impressed some sort of higher (or lower) power enough that they want to intervene and bring you back in some capacity.
>
> \* Those with some form of Regeneration may find an opportunity to continue, after enough time and in the right conditions.
>
> \* Depending on how you died, some less-than-ethical corporations are happy to harvest your brain and test it out in a new body or rig
>
> \* You can flip to the Character Creation section, grab some dice and start rolling.

## Getting Back on your Feet

You might be down but you’re not out. If someone can get to you, there is a chance for survival.

### With Skill

The Medical skill can be used as a Standard action to clear one Condition or stabilize a dying character, one per check:

- **Stop the Bleeding** — Standard Action — Medical Skill, Difficulty 15

> This is the easiest way for anyone to help you stop from succumbing to your injuries. This is a **Standard** action that ends the Bleeding condition. Even an untrained member of your crew can do this. This does not restore any health.

- **Treat the Agonized** — Standard Action — Medical Skill, Difficulty 15

> Nerve blocks, pressure, and field anesthetic. This is a **Standard** action that ends the Agonized condition, which is usually what’s left after resolving something worse. This does not restore any health.

- **Stabilize the Dying** — Standard Action — Medical Skill, Difficulty 20

> This stops an ally from their march toward Death. This is a **Standard** action that ends the Dying condition. While it is possible for an untrained person to do this, training is recommended. This does not restore any health.

### With Çredits

Those with the means can purchase more versatile and reliable healthcare options. Each has a financial and physical cost, explained more fully in the *Gear* section.

- **Use a Nanomed Kit** — Fast Action — No check

> Nanomed Kits are a literal lifesaver and are priced accordingly. They allow you to inject a bolus of nanites into the bloodstream of your downed companion. This is a **Fast** action that provides several immediate effects.

- Clear Agonized, Bleeding, Paralyzed, and Poisoned conditions.

- Stabilize the Dying

- Short term regeneration

Full description is found in the Gear section.

- **Inject a Battle Chem** — Fast Action — No check

> Battle Chems are the quick and dirty way to get someone back on their feet — like a shot of adrenaline (or better) to the heart. This is a **Fast** action that provides a short term but immediate effect.

- Quickstitch and Slowstitch provide immediate health, with a cost that comes once the dust settles.

- Anodyne reduces the effect of Pain for a short time

> Full descriptions are found in the Gear section.

### With Time

Nobody gets put back together in a firefight. Triage buys you the chance to walk out; everything after that runs on your body's schedule, or on someone else's clock if you can afford one.

- **Natural Healing** is what your body manages on its own, measured in days — or in rounds, if your body isn’t strictly human.

- **Focused Healing** is anything applied from the outside: med kits, chems, or professional treatment

Natural and Focused Healing are covered in more detail in Downtime.
