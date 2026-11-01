// L5 8's snapshot: every catalog weapon's carried weaponLine and every catalog armor piece from armorState, for
// stats 3, 5 and 8. Captured on main's engine into tests/l5-lines.json before any L5 change; the test compares the
// branch against it. Deleted with the fixture at close-out (the order's step 9).
export function l5Snapshot(Engine, D) {
  const plain = x => JSON.parse(JSON.stringify(x));
  const out = {};
  for (const base of [3, 5, 8]) {
    const ch = Engine.newCharacter();
    ch.identity.archetype = "professional";
    ch.creation.powerLevel = D.powerLevels[0].id;
    for (const id of Object.keys(ch.stats)) ch.stats[id].base = base;
    ch.creation.locked = true;
    ch.skills.handguns = { rank: 3, ipe: 0 };
    D.weapons.forEach(w => ch.weapons.push({ id: w.id, notes: "", mods: [], roundsSpent: 0 }));
    D.armor.forEach(a => ch.armor.push({ id: a.id, integrityLoss: 0, notes: "", worn: false, scrapped: false, upgrades: [] }));
    const weapons = D.weapons.map((w, i) => plain(Engine.weaponLine(ch, i)));
    const armor = {};
    for (const worn of [false, true]) {
      ch.armor.forEach(a => { a.worn = worn; });
      armor[worn ? "worn" : "carried"] = plain(Engine.armorState(ch).pieces);
    }
    out["stats" + base] = { weapons, armor };
  }
  return out;
}
