/**
 * The characters the Character tab's layout is checked on (P16): one per Origin
 * and Bloodline, an Arcanist with one Aberration and with two, a Professional,
 * and a written-in archetype with one trait. Shared by the jsdom smoke tests
 * (which pin the markup) and tools/phone-check.mjs (which measures it).
 * Each holds six Advantages and three Disadvantages, so Advantages beside Disadvantages has cards
 * to lay out. Specializations and those are read from the data, never from a hand list.
 */
import { loadEngine } from "./harness.mjs";

/** @returns {{name: string, ch: object}[]} locked characters, out of the engine's vm realm. */
export function characterFixtures() {
  const { Engine, D } = loadEngine();
  const optionIds = id => D.archetypes.find(a => a.id === id).specialization.options.map(o => o.id);
  const make = (archetype, powerLevel, specialization) => {
    const ch = Engine.newCharacter();
    ch.identity.name = "Layout Check";
    ch.identity.archetype = archetype;
    ch.creation.powerLevel = powerLevel || D.powerLevels[0].id;
    ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
    for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
    if (specialization) ch.archetypeChoices.specialization = specialization;
    ch.advantages = D.advantages.slice(0, 6).map(a => ({ id: a.id, rank: 1, notes: "" }));
    ch.disadvantages = D.disadvantages.slice(0, 3).map(d => ({ id: d.id, rank: 1, notes: "" }));
    ch.creation.locked = true;
    return ch;
  };
  const out = [];
  const add = (name, ch) => out.push({ name, ch: JSON.parse(JSON.stringify(ch)) });
  for (const id of ["werewolf", "vampire"]) for (const o of optionIds(id)) add(`${id}/${o}`, make(id, "heroic", [o]));
  const aberrations = optionIds("arcanist");
  for (const n of [1, 2]) add(`arcanist/${n} aberration${n > 1 ? "s" : ""}`, make("arcanist", null, aberrations.slice(0, n)));
  add("professional/" + optionIds("professional")[0], make("professional", null, [optionIds("professional")[0]]));
  const custom = make(D.archetypes.find(a => a.writeIn).id);
  Object.assign(custom.archetypeChoices.writeIn, { name: "Changeling", description: "Stolen as a child.",
    classification: "other", classificationText: "Fae", mechanics: ["sfr"],
    traits: [{ name: "Glamour", description: "Looks like whoever you expect." }], vulnerabilities: [] });
  add("custom/one trait", custom);
  return out;
}
