/**
 * A synthetic pack for the tests of Decisions 180–182. Nothing in it is the
 * Codex's: the names are made up for the test and say nothing about the book.
 * The entries are deliberately not in A–Z order, so a sort shows.
 */
export const PACK_ID = "PK-ABCD2345";

export function syntheticPack(over = {}) {
  const p = {
    meta: { kind: "shadows-pack", id: PACK_ID, name: "Test Pack", packSchemaVersion: "0.1",
            contentVersion: "v2 (test)", created: "2026-10-01T10:00:00.000Z", updated: "2026-10-02T10:00:00.000Z" },
    origins: [{ id: "dock", name: "Dock", text: "Works the water." }, { id: "spire", name: "Spire", text: "Lives high." }],
    npcRoles: [{ id: "gatherer", name: "Gatherer", text: "Collects things." }, { id: "lookout", name: "Lookout", text: "Watches." }],
    enemyRoles: [{ id: "bruiser", name: "Bruiser", tier: 1, text: "Hits first." }],
    tiers: [{ id: 1, name: "Slight", text: "Slight." }, { id: 2, name: "Middling", text: "Middling." }],
    entries: [
      { id: "wren", kind: "threat", ref: "Entry 02", name: "Wren", flavor: "Quick and quiet.", description: "A rooftop runner.",
        motivation: "", resources: "", line: "", ifPushed: "", gmNote: "Wren flees at half Health.",
        origin: "spire", npcRoles: ["lookout"], enemyRole: "bruiser", tier: 2,
        block: { stats: { BOD: 5, REF: 7 }, authored: { TOL: 3, WILL: 4 }, skills: [{ name: "Climb", total: 6, skill: null }],
                 armor: ["Test Jacket"], gear: ["Grapnel"], traits: [{ name: "Light", text: "Never falls far." }] } },
      { id: "gull", kind: "threat", ref: "Entry 01", name: "Gull", flavor: "Loud and mean.", description: "A dockside heavy.",
        motivation: "", resources: "", line: "", ifPushed: "", gmNote: "",
        origin: "dock", npcRoles: [], enemyRole: "bruiser", tier: 1,
        block: { stats: { BOD: 8, REF: 4 }, authored: { TOL: 5, WILL: 2 }, skills: [], armor: [], gear: [], traits: [] } },
      { id: "moss", kind: "npc", ref: "Person 01", name: "Moss", flavor: "Sells what you need.", description: "A middleman.",
        motivation: "Quiet money.", resources: "A boat.", line: "Never the kids.", ifPushed: "Sells you out.", gmNote: "",
        origin: "dock", npcRoles: ["gatherer", "lookout"], enemyRole: null, tier: null,
        block: { stats: { BOD: 3 }, authored: { TOL: 1, WILL: 6 }, skills: [], armor: [], gear: [], traits: [] } },
    ],
    groups: [
      { id: "pier-watch", ref: "Group 01", name: "Pier Watch", origin: "dock",
        members: [{ entry: "gull", count: 3 }, { entry: "wren", count: 1 }],
        situation: "They guard the pier at night.", tactics: "Gull leads, Wren scouts." },
    ],
  };
  return Object.assign(p, over);
}
