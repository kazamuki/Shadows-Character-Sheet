#!/usr/bin/env node
/**
 * The sample campaign: "Dead Air", a table that has been lived in.
 *
 * Six sessions played over three months (2026-07-18 to 2026-10-17) and a
 * seventh under way, a crew of three seated with their players and their
 * characters' last exports, a cast, factions, places and clocks, encounters
 * (ended, planned with a worksheet and an opening, and one running), lines,
 * threads, GM notes and an Activity trail: every part of a table filled in.
 * The one part it leaves out is what needs a pack (a cast member copied from
 * an entry, a place's Site Profile): the Codex is private (Decision 167).
 * It exists to see GM mode with a few months on it and to give UX passes a
 * table to look at. It is invented; nothing in it is canon.
 *
 *   node tools/sample-table.mjs            writes samples/dead-air.shadows-table.json
 *   node tools/sample-table.mjs --stdout   prints it instead
 *
 * Ids are made from readable keys (the same key always gives the same id), so
 * the file diffs cleanly when this script changes. The record shapes are
 * docs/SCHEMA.md §3, "The table file"; tests/sample-table.test.mjs runs the
 * output through migrateTable() and checks every link.
 *
 * Not shipped, not part of the build.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// The crew's characters are made by the engine, so each is a file the app would export.
import { loadEngine } from "../tests/harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "samples", "dead-air.shadows-table.json");

// ── ids ─────────────────────────────────────────────────────────────
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";   // the TAG alphabet
const chars = (key, n) => {
  const h = createHash("sha1").update(key).digest();
  let s = "";
  for (let i = 0; i < n; i++) s += ALPHABET[h[i] % 32];
  return s;
};
const id = (prefix, key) => `${prefix}-${chars(prefix + ":" + key, 8)}`;
const tableId = () => { const s = chars("table:dead-air", 12); return `TBL-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`; };

const tag = key => { const s = chars("tag:" + key, 12); return `TAG-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`; };
const C = k => id("C", k), PL = k => id("PL", k), FA = k => id("FA", k), CK = k => id("CK", k), PY = k => id("PY", k);
const SE = k => id("SE", k), TH = k => id("TH", k), EN = k => id("EN", k), N = k => id("N", k);
const castLink = (k, name) => (name ? { kind: "cast", id: C(k), name } : { kind: "cast", id: C(k) });

// ── time ────────────────────────────────────────────────────────────
// A session's day and a stamp at an hour on it. Records take the stamp of the
// session they first appeared in; `updated` is when the table last touched them.
const ts = (day, hour = 21, min = 0) => `${day}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000Z`;
const DAY = { 1: "2026-07-18", 2: "2026-08-01", 3: "2026-08-22", 4: "2026-09-12", 5: "2026-09-26", 6: "2026-10-17", 7: "2026-10-31" };

const MARA = "Mara Okonkwo", DEX = "Dex Villanueva", JUNO = "Juno Park";
const CREW = [MARA, DEX, JUNO];

// ── stat blocks ─────────────────────────────────────────────────────
const block = (stats, authored, skills = [], armor = [], gear = [], traits = []) => ({
  stats: { BOD: null, REF: null, MOB: null, INT: null, TECH: null, COOL: null, MAG: null, EMP: null, ...stats },
  authored: { TOL: null, WILL: null, ...authored },
  skills: skills.map(([name, total, skill = null]) => ({ skill, name, total })),
  armor, gear,
  traits: traits.map(([name, text]) => ({ name, text })),
});

const BLOCKS = {
  ibarra: block({ BOD: 5, REF: 6, MOB: 5, INT: 5, TECH: 3, COOL: 7, MAG: 0, EMP: 4 }, { TOL: 3, WILL: 4 },
    [["Handguns", 11, "handguns"], ["Intimidation", 12, "intimidation"], ["Streetwise", 11, "streetwise"], ["Tactics", 9, "tactics"], ["Dodge", 9, "dodge"]],
    ["Eclipse longcoat (weave, PROT 4)"], ["Custom .45 with a silver-chased slide", "Two phones, one real", "Velvet Lung master key"],
    [["Never raises his voice", "Gets quieter as he gets angrier. At a whisper, someone is already dead."], ["Owed favors", "Three people in Metro Core owe him. He cashes one a session, in the scene he chooses."]]),
  nine: block({ BOD: 7, REF: 5, MOB: 6, INT: 3, TECH: 2, COOL: 5, MAG: 0, EMP: 2 }, { TOL: 4, WILL: 3 },
    [["Melee", 11, "melee"], ["Martial Arts", 10, "martial-arts"], ["Athletics", 9, "athletics"], ["Intimidation", 8, "intimidation"]],
    ["Ballistic vest (PROT 3)"], ["Collapsible baton", "Brass knuckles"],
    [["Takes it personally", "If a crew member makes it personal, she goes after that one first, tactics be damned."]]),
  rook: block({ BOD: 5, REF: 8, MOB: 7, INT: 6, TECH: 5, COOL: 8, MAG: 0, EMP: 3 }, { TOL: 4, WILL: 5 },
    [["Rifles", 13, "rifles"], ["Stealth", 12, "stealth"], ["Tracking", 11, "tracking"], ["Demolitions", 10, "demolitions"], ["Combat Sense", 11, "combat-sense"], ["Tactics", 11, "tactics"]],
    ["Volkov plate carrier (PROT 5, ablative)"], ["Suppressed rifle", "Two shaped charges", "A burner for each country"],
    [["Always has an exit", "Rook picks his exit before he picks his firing position, and retreats when it is threatened. He does not die for a contract."], ["The professional", "He will not hurt a bystander and tells the crew so; it is a calling card, not a kindness."]]),
  teo: block({ BOD: 8, REF: 4, MOB: 3, INT: 4, TECH: 2, COOL: 6, MAG: 0, EMP: 5 }, { TOL: 5, WILL: 4 },
    [["Melee", 10, "melee"], ["Intimidation", 11, "intimidation"], ["Persuasion", 9, "persuasion"], ["Streetwise", 12, "streetwise"]],
    ["Oilskin coat over a flak liner (PROT 3)"], ["Boat hook", "Revolver, six rounds, five of them blanks"],
    [["Counts everything", "Knows to the Çredit what each of his people owes him. Pay him in full and he is a gentleman."]]),
  bracken: block({ BOD: 4, REF: 5, MOB: 4, INT: 7, TECH: 7, COOL: 7, MAG: 0, EMP: 4 }, { TOL: 4, WILL: 5 },
    [["Interface", 13, "interface"], ["Security", 12, "security"], ["Persuasion", 11, "persuasion"], ["Deception", 12, "deception"], ["Handguns", 8, "handguns"]],
    ["Suit lined with slashweave (PROT 2)"], ["Corporate SMARTLink, three tiers above the crew's", "Panic button wired to a Reclaim Solutions team"],
    [["Deniable", "Every instruction he gives is also a request. Nothing he says survives a recording."]]),
  // Entry-row blocks: the nameless, copied into an encounter.
  soldier: block({ BOD: 5, REF: 5, MOB: 4, INT: 3, TECH: 2, COOL: 4, MAG: 0, EMP: 3 }, { TOL: 3, WILL: 2 },
    [["Handguns", 8, "handguns"], ["Melee", 8, "melee"], ["Intimidation", 7, "intimidation"]], ["Leather and weave (PROT 2)"], ["Pistol", "Knife"]),
  deckhand: block({ BOD: 6, REF: 3, MOB: 4, INT: 3, TECH: 3, COOL: 4, MAG: 0, EMP: 4 }, { TOL: 4, WILL: 3 },
    [["Melee", 7, "melee"], ["Athletics", 8, "athletics"], ["Streetwise", 7, "streetwise"]], ["Oilskins (PROT 1)"], ["Boat hook", "Chain"]),
  contractor: block({ BOD: 5, REF: 6, MOB: 5, INT: 4, TECH: 3, COOL: 6, MAG: 0, EMP: 2 }, { TOL: 3, WILL: 3 },
    [["SMGs", 10, "smgs"], ["Tactics", 8, "tactics"], ["Stealth", 8, "stealth"]], ["Volkov plate carrier (PROT 4)"], ["Suppressed SMG", "Flashbangs"]),
  guard: block({ BOD: 5, REF: 5, MOB: 4, INT: 3, TECH: 4, COOL: 5, MAG: 0, EMP: 3 }, { TOL: 3, WILL: 3 },
    [["Handguns", 9, "handguns"], ["Security", 7, "security"], ["Awareness", 8, "awareness"]], ["NeuroNet security vest (PROT 3)"], ["Stun baton", "Pistol", "Badge that opens every door on the floor"]),
  drone: block({ BOD: 3, REF: 7, MOB: 8, INT: 2, TECH: 6, COOL: 0, MAG: 0, EMP: 0 }, { TOL: 1, WILL: 1 },
    [["Beam Weapons", 10, "beam-weapons"], ["Awareness", 9, "awareness"]], ["Composite shell (PROT 3)"], ["Dazzler array", "Taser lance"],
    [["Machine", "Does not bleed, sleep, or negotiate. Reboots in four rounds if its core is not smashed."]]),
};

// ── the cast ────────────────────────────────────────────────────────
const cast = [];
const member = (key, first, f) => cast.push({
  id: C(key), name: "", flavor: "", description: "", origin: "", npcRoles: [], enemyRole: "", affiliations: [], tier: null,
  motivation: "", resources: "", line: "", ifPushed: "", gmNote: "", status: "alive", block: null, ally: false, from: null,
  created: ts(DAY[first], 22), updated: ts(DAY[6], 23), ...f,
});

member("pearl", 1, {
  name: "Pearl Delacroix", flavor: "Runs the Metro Core fixer's table out of a laundromat that has never once been busy.",
  description: "Sixty-something, silver braids pinned up with chopsticks, reading glasses on a chain. Folds towels while she talks business. Knows who is owed what in four Zones and charges for forgetting it.",
  origin: "Human", npcRoles: ["Fixer", "Patron"], tier: 2,
  motivation: "Keep the table running and the dryers warm. She wants Wren's shard gone from her shop before someone burns the shop to be rid of it.",
  resources: "Suds & Duds, the back-room safe, a Rolodex that is actually a Rolodex, three kids who run messages.",
  line: "Will not sell out a client who paid in full. Will sell out one who did not.",
  ifPushed: "Takes her name off the job, takes the crew's name off the list, and does both politely.",
  gmNote: "She did not know what was on the shard. She suspects now, after S4, and has been quietly moving things out of the safe. Her fear is real: she is the weak point the NeuroNet cleanup finds first.",
  affiliations: ["The Night Shift"], ally: true,
});
member("wren", 1, {
  name: "Tobias Wren", flavor: "A NeuroNet routing engineer whose last good day is on a memory shard.",
  description: "Thirty-four, soft hands, a wedding ring on a chain because the company bans visible jewelry. Appears only as recordings until the Ports, where the crew finds what is left.",
  origin: "Human", npcRoles: ["Victim", "Witness"], tier: 1,
  motivation: "Was trying to get one honest copy of what he heard out of the building. Did.",
  resources: "None now. His access badge is in Bracken's desk; his shard is in the crew's.",
  line: "Did nothing wrong but listen.", ifPushed: "He is past pushing.",
  gmNote: "Found in the Phantom Ports in S5, sitting upright against a bollard, headphones on, no marks. The coroner's report (Oyelaran has a copy) says 'natural causes' and nothing else. The recording's eleven minutes of silence is what he heard.",
  status: "dead", affiliations: ["NeuroNet"],
});
member("ibarra", 1, {
  name: "Lt. Caz Ibarra", flavor: "Eclipse's man in Metro Core who prefers a long dinner to a short fight.",
  description: "Forties, well-fed, immaculate longcoat, a pocket square the color of a fresh bruise. Chooses the restaurant, orders for the table, and then names a price. He is polite until the check arrives.",
  origin: "Human", npcRoles: ["Boss", "Broker"], enemyRole: "Lieutenant", tier: 3,
  motivation: "Eclipse paid for the shard's contents already. Ibarra has until the quarter closes to deliver, or his place at the table goes to Nine.",
  resources: "A dozen street soldiers, the Velvet Lung, three owed favors in the NCPD, a Hammerlock armorer on retainer.",
  line: "Will not kill a child or a priest. Everything else is on the menu.",
  ifPushed: "Sends flowers. Then sends Nine. Then, if the crew is lucky, sends nothing and lets them wonder.",
  gmNote: "His clock is 'Ibarra's patience'. When it fills he does not attack the crew; he burns Suds & Duds with Pearl in it and lets them find out from the news. He would be relieved to be talked out of this.",
  block: BLOCKS.ibarra, affiliations: ["Eclipse"],
});
member("nine", 2, {
  name: "Ines \"Nine\" Baptiste", flavor: "Ibarra's right hand and left fist. Counts her fights, hence the name.",
  description: "Twenties, shaved sides, a lacquered baton, knuckles that have healed wrong so many times they are architecture. Laughs at the right moments and not at the wrong ones.",
  origin: "Human", npcRoles: ["Enforcer"], enemyRole: "Bruiser", tier: 2,
  motivation: "Wants Ibarra's chair. Was happy to lose the shard job to let him fail.",
  resources: "A crew of five, a motorbike she names after ex-lovers, Ibarra's trust, up until it wasn't.",
  line: "Never leaves a friend on the floor.", ifPushed: "Doubles down; cannot back off in front of her crew.",
  gmNote: "Died at Pier 9 (S3), shot by Rook's contractors while she was still swinging at Dex. The crew did not kill her; Ibarra thinks they did. That misunderstanding is load-bearing: do not clear it up for free.",
  status: "dead", block: BLOCKS.nine, affiliations: ["Eclipse"],
});
member("fenn", 2, {
  name: "Warden Odalys Fenn", flavor: "A Ranger who talks to the Park as if it could hear her, and has stopped being sure it can't.",
  description: "Fifties, weathered, gray-green Parks Service jacket with the patches sewn on by hand. Carries a flashlight longer than her forearm and a rulebook shorter than her patience.",
  origin: "Human", npcRoles: ["Guide", "Ally"], tier: 2,
  motivation: "Keep the Park's other tenants from the crew's trouble. The Park closes at sunset for a reason she cannot put in a report.",
  resources: "Ranger Station Nine, two junior wardens, keys to the maintenance tunnels, an old cassette recorder with a very particular tape.",
  line: "Will not discuss what the Park is. Will tell you exactly how to be somewhere else at dusk.",
  ifPushed: "Closes the Park to the crew, which in practice means the Park opens differently for them.",
  gmNote: "She has heard the Listener before, a long time ago, in a different place. She will not say so until the crew has shown her the shard and shown her they are not going to sell it. If she is pushed to a hard no, give the crew the tape anyway.",
  affiliations: ["The Rangers"], ally: true,
});
member("bracken", 2, {
  name: "Silas Bracken", flavor: "Director of Security Operations at NeuroNet, the kind of man whose title is a euphemism.",
  description: "Late forties, a face that was handsome until it got practiced. Never in the same room as the thing he orders done. Speaks in questions that are instructions.",
  origin: "Human", npcRoles: ["Corporate", "Antagonist"], enemyRole: "Mastermind", tier: 4,
  motivation: "Close the Wren file before the board hears of it. Genuinely does not know what Wren heard. That is what frightens him.",
  resources: "The Gateway hub, a Volkov retainer, a Reclaim Solutions cleanup crew on speed-dial, 9,000 employees who will say whatever HR tells them to.",
  line: "Will not put anything in writing. Will not be in a room where it happens.",
  ifPushed: "Escalates by outsourcing, never by showing up. The crew will not see his face before S8.",
  gmNote: "Hired Rook in S2. Hired the Devils (indirectly, via Dolly) in S3. His clock is 'The cleanup'. If the crew contacts him first, he will offer a job; the offer is a trap and also a real job.",
  block: BLOCKS.bracken, affiliations: ["NeuroNet"],
});
member("rook", 2, {
  name: "Anton Rook", flavor: "A Volkov contractor with a pleasant voice and an exit already chosen.",
  description: "Thirty-eight, medium everything, a runner's build, a Slovak accent he lets show when it helps. Wears the same gray coat in every country. Sends handwritten apologies after the fact.",
  origin: "Human", npcRoles: ["Hitman"], enemyRole: "Assassin", tier: 4,
  motivation: "Collect the NeuroNet fee. Has no opinion about the shard and no interest in the crew's survival either way.",
  resources: "Six contractors on call, burners in four languages, a Volkov expense account.",
  line: "No bystanders, no children, no payments in crypto he cannot spend.",
  ifPushed: "Calls it. If the exit is threatened he leaves, and returns on his own schedule.",
  gmNote: "Left Pier 9 (S3) and the Park (S2) with the crew alive both times because both times the exit closed first. He respects Mara more than he should, and has said so in writing. His contract is on a clock.",
  block: BLOCKS.rook, affiliations: ["The Volkov Group"],
});
member("dolly", 3, {
  name: "Dolores \"Dolly\" Quint", flavor: "Keeps the Devils' ledgers and its secrets in the same drawer.",
  description: "Sixty, frail-looking, cardigan, clip-on reading lenses. Has outlived four bosses and hired the fifth. The most dangerous person on Pier 9 and the only one who never carries a weapon.",
  origin: "Human", npcRoles: ["Broker", "Bookkeeper"], tier: 2,
  motivation: "Whatever keeps the Devils paid by both NeuroNet and TransitCorp. Told Bracken where the shard was headed because Bracken asked politely and paid early.",
  resources: "The ledgers, a key to every berth on Pier 9, an unlisted number into NeuroNet's Gateway hub.",
  line: "Does not sell people. Sells information about people, which she insists is different.",
  ifPushed: "Opens the ledger and shows you what you owe.",
  gmNote: "She is the answer to 'who sent the shard to Pearl': her number was on the delivery note. She did not know what was on it either. She will trade that fact for Cord's life, which she thinks the crew can arrange.",
  affiliations: ["The Dockside Devils"],
  // Out of the picture (Decision 174's "gone"): alive, and out of the story until the crew goes looking.
  status: "gone", updated: ts(DAY[7], 21, 5),
});
member("teo", 3, {
  name: "\"Big Teo\" Marchetti", flavor: "Runs Pier 9 on a handshake and a boat hook.",
  description: "Hulking, silver stubble, fisherman's cap, hands like loaded bags of cement. Calls everyone 'friend' and means it, until they aren't.",
  origin: "Human", npcRoles: ["Boss"], enemyRole: "Boss", tier: 3,
  motivation: "Keep both customers paid and neither one aware of the other. Wants nothing to do with whatever is in the Ports.",
  resources: "A hundred dockhands, a tug, the right to say no on Pier 9.",
  line: "Pay your tab and you are family. Skip it and you are a story.",
  ifPushed: "Lets the crew leave. Sends the tab.",
  gmNote: "He is why the Devils take no side: the Devils are hiding from the Ports, not from the crew. If asked directly he will say 'the tide comes in on the wrong days' and nothing else.",
  block: BLOCKS.teo, affiliations: ["The Dockside Devils"],
});
member("achterberg", 1, {
  name: "Dr. Imani Achterberg", flavor: "A street doctor who treats werewolves as patients and everyone else as a surprise.",
  description: "Forties, scrubs under a vintage leather coat, two phones, a stethoscope worn as a scarf. Her clinic's waiting room has a sign: 'We Do Not Ask'.",
  origin: "Human", npcRoles: ["Doc", "Ally"], tier: 1,
  motivation: "Keep Dex stable between moons, and everyone else alive between clinics.",
  resources: "The clinic (Techtopia, ground floor), a freezer of blood, a trauma kit fit for a small war.",
  line: "Will not treat for pay what she would treat for free; will not treat for free what you could afford.",
  ifPushed: "Bills in kind. Always remembers.",
  gmNote: "Dex owes her; the debt is a favor and she will cash it once. Likely at the worst moment. Plan for S8.",
  affiliations: ["The Night Shift"], ally: true,
});
member("joss", 1, {
  name: "Little Joss", flavor: "Fourteen, fast, owed money by half of Metro Core.",
  description: "Skinny, sneakers worth more than the rest of the outfit, a phone held together with tape and prayer. Runs messages for Pearl and sells what she overhears to anyone else.",
  origin: "Human", npcRoles: ["Runner", "Informant"], tier: 1,
  motivation: "A way out of Metro Core before it eats her. Likes Mara, has not said so.",
  resources: "Every kid courier's network in two Zones, a stash of burner cards, a very good memory.",
  line: "Does not sell Pearl. Does not lie to the crew. Will lie to anyone else for a pastry.",
  ifPushed: "Vanishes. Comes back with something unasked-for.",
  gmNote: "The 'Joss's network' clock is her; it fills when the crew teaches her something and empties when they put her at risk. Bracken's cleanup would take her too. Ibarra would not.",
  affiliations: ["The Night Shift"], ally: true,
});
member("oyelaran", 4, {
  name: "Det. Hal Oyelaran", flavor: "A tired NCPD detective who has a coroner's report he should not have.",
  description: "Fifties, rumpled, a limp he blames on a chair, a mug that says WORLD'S OKAYEST DAD. Lets a lot go and writes it all down.",
  origin: "Human", npcRoles: ["Cop", "Contact"], tier: 2,
  motivation: "Close Wren's death honestly, or quietly enough that nobody gets hurt reopening it. Will take either.",
  resources: "A badge, a copy of the file, a friend at the morgue, a grudge against Reclaim Solutions.",
  line: "Will not frame anyone. Will happily look the other way for ten minutes.",
  ifPushed: "Hands over the file, resigns himself, and goes to lunch.",
  gmNote: "Owes the crew after S5 (they got him out of a bad stop). Cashes it at the worst time, by being exactly where they need a cop to be.",
  affiliations: ["NCPD"],
});
member("cord", 3, {
  name: "Cordell \"Cord\" Hale", flavor: "A Devils deckhand who talked, then walked, then vanished.",
  description: "Twenty-two, scraggly beard, a fresh Devils tattoo he would like to cover. Spoke to the crew on Pier 9 when the shooting started and has been hiding since.",
  origin: "Human", npcRoles: ["Witness", "Defector"], tier: 1,
  motivation: "Get out of Gateway alive. Wants to tell someone about the night the Ports 'turned on'.",
  resources: "A cousin in Neo Jersey, a stash of Devils cash, a story.",
  line: "Won't name Teo. Will name anyone else.",
  ifPushed: "Runs. He is good at it.", gmNote: "Missing since S5. The Devils are looking for him; so are NeuroNet's cleaners. Joss may know where. The thread is 'Find Cord'.",
  status: "missing", affiliations: ["The Dockside Devils"],
});
member("listener", 4, {
  name: "The Listener", flavor: "Something in the Phantom Ports that answers when you stop talking.",
  description: "A cold spot with a voice and no throat. Appears as stillness; sounds like the second after a radio cuts. It echoes what it hears, a little behind.",
  origin: "Unknown", npcRoles: ["Entity"], enemyRole: "Haunt", tier: 5,
  motivation: "Unclear. It attends. It collects what is said near it. Wren's shard is a recording of it listening.",
  resources: "The Ports, the dead air, whatever it has swallowed from the crews who walked off the site.",
  line: "It cannot leave the Ports. Not yet.",
  ifPushed: "Pushes back through anyone speaking in the room. Voices stop. People repeat things they never said.",
  gmNote: "A Genius Loci that is waking up (see the Ports clock). Not a villain; a listening thing that has been starved of conversation for a century. What it wants is to be spoken to, and what happens when it is is S8's question.",
  affiliations: [],
});

// ── places ──────────────────────────────────────────────────────────
const places = [];
const place = (key, first, f) => places.push({
  id: PL(key), name: "", from: null, territory: null, zone: null, district: "", neighborhood: "", environment: null, notes: "", site: null, siteLevel: null, exposure: [],
  created: ts(DAY[first], 22), updated: ts(DAY[6], 23), ...f,
});
place("suds", 1, {
  name: "Suds & Duds", territory: "central-city", zone: "metro-core", district: "Lower Metro", neighborhood: "Orchard Street",
  notes: "Pearl's laundromat. Front room: six working machines and three that have never run. Back room: the table, the safe, the Rolodex, a hotplate. A bell over the door that rings twice for strangers and once for friends. The crew meets here every session. Burned in the Ibarra clock's worst outcome.",
});
place("park", 2, {
  name: "Central Park after sunset", from: { kind: "gazetteer", id: "central-park", name: "Central Park" },
  territory: "central-city", zone: "metro-core", district: "Midtown", neighborhood: "The Ramble", environment: "thin-places",
  notes: "The Park closes at sunset for a reason. S2's chase ran the Ramble to Ranger Station Nine. Fenn's maintenance tunnels run below the Boathouse; one of them comes out somewhere it shouldn't.",
});
place("velvet", 1, {
  name: "The Velvet Lung", territory: "central-city", zone: "metro-core", district: "Midtown", neighborhood: "Theater Row",
  notes: "Eclipse's front: a jazz club that sells silence by the hour. Ibarra's table is the third booth, facing the door. The house band stops playing when he stands up. S7's planned meeting is here.",
});
place("clinic", 1, {
  name: "Achterberg's Clinic", territory: "central-city", zone: "techtopia", district: "Techtopia", neighborhood: "The Annex",
  notes: "Ground floor of a shuttered CorpTech annex. 'We Do Not Ask' on the door. Dex's recovery between moons. Three beds, a freezer, a poster of a very large dog.",
});
place("pier9", 3, {
  name: "Pier 9", territory: "daedalus-belt", zone: "gateway", district: "Gateway", neighborhood: "The Waterfront", environment: "combat-zones",
  notes: "Dockside Devils' hall at the end of the pier. A tug, a corrugated hall, tables where tabs are settled. The crew's first Gateway night (S3) went bad here: shooting started in the shadows between containers.",
});
place("hub", 5, {
  name: "NeuroNet Gateway Hub", from: { kind: "gazetteer", id: "neuronet", name: "NeuroNet" }, territory: "daedalus-belt", zone: "gateway",
  district: "Gateway", neighborhood: "Freight Row",
  notes: "A mirrored cube where the routing AI lives. Night shift is six people and forty drones. Wren worked the fourth floor; his desk is still there with his coffee cup. The crew went in on S5 for the logs.",
});
place("ports", 4, {
  name: "The Phantom Ports", from: { kind: "gazetteer", id: "phantom-ports", name: "The Phantom Ports" },
  territory: "daedalus-belt", zone: "gateway", district: "Gateway", neighborhood: "Wharves 14 to 19", environment: "genius-loci",
  notes: "Derelict wharves nobody will touch. A radio does not work here; a voice does, too well. Wren's body (S5) was against a bollard at Wharf 17. The Listener's place. S6's confrontation ran the length of Wharf 17 to a collapsed warehouse the crew has not entered.",
  // The Listener's Exposure: who has spoken in the Ports, and how often (Decision 251; a track without a profile, kept as typed).
  exposure: [{ name: "Juno", n: 5 }, { name: "Mara", n: 3 }, { name: "Dex", n: 2 }],
});

// ── factions ────────────────────────────────────────────────────────
const factions = [];
const faction = (key, first, f) => factions.push({
  id: FA(key), name: "", from: null, type: null, territory: null, base: "", keyNpcs: [], wants: "", reach: "",
  tippingFor: [], tippingAgainst: [], stance: null, attention: null, notes: "",
  created: ts(DAY[first], 22), updated: ts(DAY[6], 23), ...f,
});
faction("eclipse", 1, {
  name: "Eclipse", from: { kind: "gazetteer", id: "eclipse", name: "Eclipse" }, type: "gang", territory: "central-city",
  base: "The Velvet Lung, Theater Row",
  keyNpcs: [castLink("ibarra"), castLink("nine", "Ines \"Nine\" Baptiste")],
  wants: "The shard's contents, delivered before the quarter closes, by any hand that is not theirs.",
  reach: "Metro Core's drug trade, laundering, and extortion; three owed favors in the NCPD; whoever's cut of the Park's after-dark traffic.",
  tippingFor: ["The crew delivers the shard without a fight", "Ibarra is made to look generous in public"],
  tippingAgainst: ["Pearl is hurt", "Nine's death is laid on the crew (it already is)", "Another gang gets the shard first"],
  stance: -1, attention: "active",
  notes: "Not an enemy by default; an unhappy customer. The crew's best outcome is a deal that gives Ibarra something to bring upstairs. Ibarra's clock is the pressure on the table.",
});
faction("devils", 3, {
  name: "The Dockside Devils", from: { kind: "gazetteer", id: "dockside-devils", name: "The Dockside Devils" }, type: "gang", territory: "daedalus-belt",
  base: "Pier 9, Gateway",
  keyNpcs: [castLink("teo"), castLink("dolly"), castLink("cord")],
  wants: "To stay paid by both NeuroNet and TransitCorp, to stay out of the Ports, and to find Cord before somebody else does.",
  reach: "Gateway's waterfront, the dockworkers' union, a tug that goes where it likes.",
  tippingFor: ["Cord found alive and brought to Teo", "Tab settled in full"],
  tippingAgainst: ["The crew owes more than it can pay", "NeuroNet learns the Devils talk"],
  stance: 0, attention: "aware",
  notes: "Not hostile. They will sell the crew information and take the money, and sell the crew out to NeuroNet if NeuroNet pays more. Consistent. Dolly is the one to watch.",
});
faction("neuronet", 2, {
  name: "NeuroNet", from: { kind: "gazetteer", id: "neuronet", name: "NeuroNet" }, type: "corp", territory: "daedalus-belt",
  base: "The Gateway Hub",
  keyNpcs: [castLink("bracken"), castLink("wren")],
  wants: "Wren's file closed, Wren's shard destroyed, and nobody on the board learning what the file contained.",
  reach: "Gateway's freight routing, a Volkov retainer, a Reclaim Solutions cleanup crew, 9,000 employees.",
  tippingFor: ["The shard is returned or destroyed", "Bracken gets credit for it"],
  tippingAgainst: ["The crew goes public", "Anyone reaches the Ports and comes back talking"],
  stance: -2, attention: "active",
  notes: "A corporation, not a villain. Its ruthlessness is structural: every step of the cleanup is individually defensible. Bracken's the face, though it never meets one.",
});
faction("rangers", 2, {
  name: "The Rangers", from: { kind: "gazetteer", id: "rangers", name: "The Rangers" }, type: "other", territory: "central-city",
  base: "Ranger Station Nine, Central Park",
  keyNpcs: [castLink("fenn")],
  wants: "The Park's tenants undisturbed and its closing hours kept. They would take the shard off the crew's hands, but would rather not.",
  reach: "The Park, its tunnels, and whoever the Parks Service still has a friend in.",
  tippingFor: ["The crew respects the Park's rules", "The crew brings the Rangers the tape instead of the story"],
  tippingAgainst: ["Anyone breaks the sunset closing", "The crew reveals what the Park is"],
  stance: 1, attention: "neutral",
  notes: "Allies of convenience. Fenn trusts the crew; the Rangers as an organization have not been asked.",
});
faction("volkov", 2, {
  name: "The Volkov Group", from: { kind: "gazetteer", id: "volkov-group", name: "The Volkov Group" }, type: "other", territory: "central-city",
  base: "New Bostonia, offices on Beacon Row",
  keyNpcs: [castLink("rook")],
  wants: "To collect NeuroNet's fee. Nothing more. They are not partisans.",
  reach: "Six hundred armed personnel, a flexible conscience, and a reputation for clean exits.",
  tippingFor: ["NeuroNet's check clears", "The contract is renegotiated"],
  tippingAgainst: ["Bystanders are hurt on Volkov's name", "A contract is reported publicly"],
  stance: -2, attention: "active",
  notes: "Rook is the instrument. Volkov management will sell the crew a counter-contract if the money is right; that offer has not come yet and should come in S8.",
});
faction("nightshift", 1, {
  name: "The Night Shift", type: "collective", territory: "central-city",
  base: "Suds & Duds, the back room",
  keyNpcs: [castLink("pearl"), castLink("joss"), castLink("achterberg")],
  wants: "To keep the Lower Metro running without anyone's flag on it.",
  reach: "Three kids who run messages, a doc who does not ask, a fixer's table.",
  tippingFor: ["The crew keeps their word", "Joss gets out alive"], tippingAgainst: ["Ibarra hears about Joss", "The laundromat is exposed"],
  stance: 2, attention: "neutral",
  notes: "The crew's own network, built over three months of small favors. A homegrown faction; not in the gazetteer. They are the reason the crew has a table to come back to.",
});

// ── clocks ──────────────────────────────────────────────────────────
const clocks = [];
const clock = (key, first, f) => clocks.push({
  id: CK(key), name: "", segments: 4, filled: 0, advances: "", whenFull: "", on: null,
  created: ts(DAY[first], 22), updated: ts(DAY[6], 23), ...f,
});
clock("patience", 2, {
  name: "Ibarra's patience", segments: 6, filled: 4, on: { kind: "faction", id: FA("eclipse") },
  advances: "A session passes with the shard undelivered. A Nine-related rumor reaches him. The crew is seen in Eclipse territory without paying respects.",
  whenFull: "Suds & Duds burns overnight with Pearl inside; Ibarra expresses regret on the news.",
});
clock("cleanup", 2, {
  name: "The cleanup", segments: 8, filled: 5, on: { kind: "faction", id: FA("neuronet") },
  advances: "A witness talks. A file is found. The crew visits the Hub. Cord is seen in the open.",
  whenFull: "Reclaim Solutions arrives at the Hub and the Ports at once. Every trace of Wren is gone, the crew is on a list, and Oyelaran's file is 'lost'.",
});
clock("contract", 3, {
  name: "Rook's contract on Mara", segments: 4, filled: 2, on: { kind: "faction", id: FA("volkov") },
  advances: "Mara touches NeuroNet's network. Rook's exit is closed once more.",
  whenFull: "Rook lines up a shot he cannot decline, in a place with no exit to choose. He sends the apology before the shot.",
});
clock("tab", 3, {
  name: "The crew's tab at Pier 9", segments: 6, filled: 3, on: { kind: "faction", id: FA("devils") },
  advances: "A favor is taken from Teo without payment. A Devils man is hurt. Dolly's information is used.",
  whenFull: "Teo sends a collector; he is polite; he leaves with something the crew would rather have kept.",
});
clock("park", 2, {
  name: "The Park after dark", segments: 6, filled: 1, on: { kind: "faction", id: FA("rangers") },
  advances: "The crew is in the Park after sunset. Someone says its name aloud there.",
  whenFull: "The Park decides the crew is a tenant. Nobody at the Ranger Station will say what that means.",
});
clock("network", 1, {
  name: "Joss's network", segments: 4, filled: 3, on: { kind: "faction", id: FA("nightshift") },
  advances: "The crew teaches Joss something, pays on time, or keeps a secret for her.",
  whenFull: "Joss's runners become the crew's eyes in four Zones. They would die for her; she would let them, once.",
});
clock("ports", 4, {
  name: "The Ports wake", segments: 12, filled: 5,
  advances: "Anyone speaks in the Ports. A recording is played there. The shard is opened. The Listener repeats a stranger's voice.",
  whenFull: "The Listener learns to speak first. Gateway's radios, phones, and routing AI answer it. Every voice at Gateway is a little behind.",
});
clock("moon", 1, {
  name: "Dex before the full moon", segments: 8, filled: 7, updated: ts(DAY[7], 20, 50),
  advances: "Each day since the last full moon; a fight; an injury; being near silver.",
  whenFull: "Dex turns. Achterberg's clinic is the plan; the plan has a hole in it.",
});
clock("tide", 5, {
  name: "The tide at Wharf 17", segments: 6, filled: 2, on: { kind: "place", id: PL("ports") },
  advances: "Each hour the crew spends on the wharves. Each time a recording is played within earshot of the water.",
  whenFull: "The tide comes in on the wrong day. The ghost-line moves one wharf inland and stays there.",
});
clock("kitchen", 6, {
  name: "The kitchen fire", segments: 4, filled: 0, on: { kind: "encounter", id: EN("velvet-lung") },
  advances: "A shot fired in the dining room. A soldier sent through the kitchen doors. Ibarra's signal to the chef.",
  whenFull: "The Velvet Lung burns. Ibarra leaves by the alley door with whoever he can carry, and blames the crew for that too.",
});

// ── sessions ────────────────────────────────────────────────────────
const sessions = [];
const session = (n, f) => {
  const day = DAY[n];
  sessions.push({
    id: SE("s" + n), number: n, date: day, present: [...CREW], hours: null,
    journal: { happened: "", fallout: "", threads: "", impact: "", reflection: "", seed: "" }, close: null,
    created: ts(day, 17), updated: ts(day, 23), ...f,
  });
};
const closeOf = (n, lines, hours) => ({
  at: ts(DAY[n], 23, 30),
  lines: lines.map(l => ({ present: true, ip: null, milestone: false, credits: null, tier: null, note: "", ...l })),
});

session(1, {
  hours: 4,
  journal: {
    happened: "Pearl hired the crew for a courier job: a memory shard from a NeuroNet engineer to a buyer in Techtopia. Mara read the shard's header and found a dead channel: eleven minutes of silence. The handoff at Suds & Duds went sideways when three Eclipse soldiers showed up early.",
    fallout: "Eclipse knows the shard exists. The crew kept it and ran. Pearl's shop has a front window that needs replacing.",
    threads: "Who sent Wren's shard to Pearl? What is in the silence? Ibarra now wants it.",
    impact: "Mara chose to keep the shard rather than hand it over. The crew became Pearl's problem and she theirs.",
    reflection: "Great first session: the crew clicked, Dex stole the scene with a dryer. Do more of: Pearl at work. Do less of: me over-explaining Eclipse.",
    seed: "Ibarra will send a polite invitation. Fenn will notice the shard's signal from the Park.",
  },
  close: closeOf(1, [{ name: MARA, ip: 4, credits: 1200, note: "Read the shard's header; kept it." }, { name: DEX, ip: 4, credits: 1200 }, { name: JUNO, ip: 4, credits: 1200 }], 4),
});
session(2, {
  hours: 4.5,
  journal: {
    happened: "Ibarra's invitation was dinner at the Velvet Lung; the crew declined the first course and left. Rook's contractors tried the Park at dusk. Fenn and the Rangers helped the crew out of the Ramble. Fenn recognized the shard's signal and would say nothing about it.",
    fallout: "The crew is in Fenn's debt. Ibarra is annoyed, not furious. Bracken has hired the Volkov Group: Rook has Mara's name.",
    threads: "What did Fenn hear? Who is Rook working for? Why did the Park open a tunnel?",
    impact: "Juno cast in the Park after dusk, breaking the sunset rule; the Park took notice. The 'Park after dark' clock started.",
    reflection: "The chase worked as set piece; the Park as character worked better. Let Fenn breathe next time.",
    seed: "Rook leaves a handwritten apology on Mara's pillow. Dolly's number appears on the delivery note.",
  },
  close: closeOf(2, [{ name: MARA, ip: 4, credits: 800 }, { name: DEX, ip: 4, credits: 800 }, { name: JUNO, ip: 5, milestone: true, credits: 800, note: "Cast in the Park after dusk." }], 4.5),
});
session(3, {
  hours: 3.5,
  journal: {
    happened: "The delivery note led to Pier 9 and the Dockside Devils. Teo was gracious; Dolly, who the crew mistook for a clerk, gave nothing away. Eclipse (Nine's team) and the Volkov contractors both arrived. A three-way fight broke out. Nine died at Dex's feet. Cord ran for the tide and the crew let him go.",
    fallout: "Ibarra believes the crew killed Nine. Rook's exit closed and he withdrew. The Devils are watching; Cord is missing.",
    threads: "Dolly's number on the note. Who killed Nine? Where is Cord?",
    impact: "Dex held back in the fight and Nine died anyway. He is not sleeping well.",
    reflection: "Three-sided fights are great but slow. Wave initiative helped. Next time use fewer rows.",
    seed: "Joss sees Cord at a bus station in Neo Jersey. Ibarra schedules a meeting that is not an invitation.",
  },
  close: closeOf(3, [{ name: MARA, ip: 3, credits: 600 }, { name: DEX, ip: 3, milestone: true, credits: 600, note: "Held back and a friend of Ibarra's died anyway." }, { name: JUNO, ip: 3, credits: 600 }], 3.5),
});
session(4, {
  present: [MARA, DEX], hours: 5,
  journal: {
    happened: "Juno was away (family trouble in Seoul). Mara and Dex met Oyelaran, who had the coroner's report on a body no one had told them was dead: Wren. Mara broke into the Hub's guest network from the laundromat and found a routing log with the same eleven minutes of silence. Dex spent a night in Achterberg's clinic, nearly turning.",
    fallout: "Oyelaran owes the crew a favor. Mara's name is on a NeuroNet watchlist. Dex's moon clock jumped two segments.",
    threads: "Where is Wren's body? What are the eleven minutes? Why is Dex's moon early?",
    impact: "Mara learned how deep the cleanup goes. The 'cleanup' clock moved three.",
    reflection: "A two-player session was a pleasure: slower, more talk. Good use of Oyelaran.",
    seed: "Wren's body is in the Phantom Ports. Bracken closes a door on Gateway.",
  },
  close: closeOf(4, [
    { name: MARA, ip: 5, credits: 900, note: "Found the log." },
    { name: DEX, ip: 5, credits: 900 },
    { name: JUNO, present: false, ip: 2, tier: "competent", note: "Away in Seoul; off-screen pay at Competent." },
  ], 5),
});
session(5, {
  hours: 4,
  journal: {
    happened: "The crew infiltrated the NeuroNet Hub at night for Wren's desk and the full log. Drones and guards, a fight on the fourth floor, and a clean exit through the freight elevator. They found Wren's body in the Phantom Ports at Wharf 17, sitting upright, headphones on.",
    fallout: "The Hub is hot. The crew has the log and the body's location. Cord has gone to ground. Oyelaran now has a body to explain.",
    threads: "What killed Wren? Who else has heard what he heard? What does the shard play when opened in the Ports?",
    impact: "Juno heard the Listener for the first time and answered it. It repeated her back.",
    reflection: "The Hub was the best set piece of the campaign. The Ports was the best scene.",
    seed: "Joss hears Cord is in the Ports. The Listener repeats a name only Mara knows.",
  },
  close: closeOf(5, [{ name: MARA, ip: 5, credits: 1500 }, { name: DEX, ip: 5, credits: 1500 }, { name: JUNO, ip: 5, milestone: true, credits: 1500, note: "Answered the Listener." }], 4),
});
session(6, {
  hours: 4,
  journal: {
    happened: "The crew went into the Phantom Ports with the shard. Mara opened it. The Listener answered through Juno, then through Dex, then through Mara. Cord was there, sitting beside Wren, speaking in the Listener's voice. The crew retreated down the length of Wharf 17 and out; the Listener followed to the ghost-line, and stopped.",
    fallout: "The Ports clock jumped. Cord is alive but not himself. The crew has the recording and knows what the silence is. Rook arrived late and watched from the next wharf.",
    threads: "What does the Listener want? How do we get Cord out? Does Ibarra still want the shard?",
    impact: "Mara decided to keep the shard rather than sell it. Juno and Dex disagree.",
    reflection: "The best session yet. The three voices through one mouth worked beautifully. Cut the fight; the dread did it.",
    seed: "Ibarra's invitation arrives: the Velvet Lung, Friday. Fenn calls with the tape. Pearl is packing.",
  },
  close: closeOf(6, [
    { name: MARA, ip: 4, credits: 400, note: "Chose to keep the shard." },
    { name: DEX, ip: 4, credits: 400 },
    { name: JUNO, ip: 4, milestone: true, credits: 400, note: "Spoke in the Listener's voice and walked out." },
  ], 4),
});
// Tonight, under way: the crew is at the table, nothing is written up, and a fight is running (the clinic, below).
session(7, {
  hours: null,
  journal: { happened: "", fallout: "", threads: "", impact: "", reflection: "", seed: "Opens at the Velvet Lung, Friday. Ibarra's invitation, in his hand. Fenn's tape arrives by courier in the morning." },
  created: ts(DAY[6], 23, 45), updated: ts(DAY[7], 19, 10),
});

// ── threads ─────────────────────────────────────────────────────────
const threads = [];
const thread = (key, f) => threads.push({
  id: TH(key), title: "", notes: "", status: "open", current: false, opened: null, closed: null,
  created: ts(DAY[1], 23), updated: ts(DAY[6], 23), ...f,
});
thread("sender", { title: "Who sent Wren's shard to Pearl?", status: "resolved", opened: SE("s1"), closed: SE("s5"),
  notes: "Dolly's number was on the delivery note. She did not know the contents either; Bracken asked her to route the shard through Pearl, expecting it would be lost.", created: ts(DAY[1], 23), updated: ts(DAY[5], 23) });
thread("silence", { title: "What spoke in the dead air?", current: true, opened: SE("s1"),
  notes: "The eleven minutes on Wren's shard. The Listener. What it wants. What happens when it is spoken to. The Ports clock.", updated: ts(DAY[6], 23) });
thread("ibarra", { title: "Ibarra's price", opened: SE("s2"),
  notes: "Eclipse wants the shard or a reason. Nine's death is laid on the crew. Find the deal that lets him go upstairs with a win.", updated: ts(DAY[6], 23) });
thread("dexdebt", { title: "Dex owes Achterberg", opened: SE("s4"),
  notes: "A favor, once. She'll cash it during the next full moon. Plan for the clinic, and for what happens to it.", updated: ts(DAY[6], 23) });
thread("rook", { title: "Rook's contract on Mara", opened: SE("s2"),
  notes: "He has apologized in writing twice. Watch his exit.", updated: ts(DAY[6], 23) });
thread("cord", { title: "Find Cord", opened: SE("s3"),
  notes: "Alive in the Ports, speaking in the Listener's voice. Joss knows how to reach him; Teo wants him; NeuroNet's cleaners want him more.", updated: ts(DAY[6], 23) });
thread("fire", { title: "Who burned the laundromat's back window?", status: "dropped", opened: SE("s1"), closed: SE("s3"),
  notes: "A stray round from the S1 skirmish. Nobody did anything on purpose. Dropped.", created: ts(DAY[1], 23), updated: ts(DAY[3], 23) });

// ── encounters ──────────────────────────────────────────────────────
const encounters = [];
const sideId = (enc, k) => id("SD", enc + ":" + k);
let encCounter = 0;
// Schema 0.17 (Decisions 252, 253). S10f's SQ9 kept these empty; since 2026-10-31 (Ken: "exercise every part of the table")
// the Velvet Lung carries a full worksheet, Rook's contract an ambush, and tonight's fight a delay.
const EMPTY_PLAN = () => ({ hook: "", stakes: "", objectives: "", terrain: "", hazards: "", city: "", beyondNotes: "", escalations: "", failure: "", success: "",
  escapes: "", failsafe: "", threads: "", milestones: "", pivot: "", stalls: "", adversaries: [], beyond: [] });
const encounter = (key, f, rows) => {
  const eid = EN(key);
  const e = {
    id: eid, name: "", status: "ended", round: 0, turn: null, acted: [], by: "person",
    sides: [{ id: "crew", name: "" }, { id: sideId(key, "other"), name: "" }],
    design: EMPTY_PLAN(), opening: null,
    rows: [], created: ts(DAY[1], 21), updated: ts(DAY[1], 23), ...f,
  };
  // Schema 0.19 (Decision 261): a side keeps its Combat Sense roll; only a wave fight has any.
  e.sides = e.sides.map(sd => ({ id: sd.id, name: sd.name, roll: sd.roll ?? null }));
  e.rows = rows.map(({ key: rowKey, ...r }, i) => ({
    id: id("R", `${key}:${rowKey || r.name || i}`), kind: "pc", name: "", cast: null, from: null, block: null, side: "crew",
    order: null, last: false, out: false, damage: 0, massive: 0, armorLoss: 0, scrapped: false, kept: null, struck: false,
    armorId: null, hp: null, levels: null, awareness: null, conditions: [], delay: null, ...r,
  }));
  encounters.push(e);
  return e;
};
// A PC row's scratch Health is its character's, from the copies below (a row named for a seat reads the copy anyway, Decision 257).
const pc = (name, f = {}) => ({ kind: "pc", name, hp: { [MARA]: 20, [DEX]: 50, [JUNO]: 20 }[name], levels: 6, awareness: { [MARA]: 9, [DEX]: 8, [JUNO]: 7 }[name], side: "crew", ...f });
const castRow = (key, name, f = {}) => ({ kind: "cast", key, name: "", cast: castLink(key, name), ...f });
const entryRow = (key, name, blk, f = {}) => ({ kind: "entry", key, name, block: blk, from: null, ...f });

// Newest first: tonight's running fight, the planned two, then the ended ones.
{
  // Session 7, under way: Reclaim Solutions comes for Dex at Achterberg's clinic on the night of the moon.
  const key = "clinic";
  const O = sideId(key, "reclaim");
  const e = encounter(key, {
    name: "Achterberg's clinic, moonrise", status: "running", round: 2, created: ts(DAY[7], 20, 40), updated: ts(DAY[7], 21, 10),
    sides: [{ id: "crew", name: "" }, { id: O, name: "Reclaim Solutions" }],
    design: { ...EMPTY_PLAN(), hook: "Reclaim Solutions knows where Dex goes on the night of the moon.", stakes: "Dex, Achterberg's clinic, and who learns what Dex is." },
  }, [
    pc(MARA, { order: 14, damage: 2, struck: true }),
    pc(DEX, { order: 16, damage: 11, delay: { until: "Achterberg finishes the sedative" } }),   // his copy as filed: 11 taken at the Ports
    pc(JUNO, { order: 9, conditions: [{ id: "frightened", source: "The Listener's voice on the cleaners' radio", rounds: 2 }] }),
    castRow("achterberg", undefined, { side: "crew", order: 7, last: true }),
    entryRow("cleaner-a", "Reclaim cleaner", BLOCKS.contractor, { side: O, order: 15, damage: 6, struck: true, armorLoss: 1 }),
    entryRow("cleaner-b", "Reclaim cleaner", BLOCKS.contractor, { side: O, order: 11 }),
    entryRow("cleaner-drone", "Reclaim drone", BLOCKS.drone, { side: O, order: 13, damage: 3, struck: true }),
  ]);
  // Round 2: Dex has delayed, the first cleaner and Mara have gone; it is the drone's turn.
  const row = name => e.rows.find(r => r.name === name).id;
  e.acted = [row(DEX), row("Reclaim cleaner"), row(MARA)];
  e.turn = row("Reclaim drone");
}
{
  const key = "velvet-lung";
  const O = sideId(key, "other");
  encounter(key, {
    name: "Friday at the Velvet Lung", status: "planned", created: ts(DAY[6], 23, 40), updated: ts(DAY[7], 18, 30),
    sides: [{ id: "crew", name: "" }, { id: O, name: "Eclipse" }],
    // The Encounter Design worksheet (2642, Decision 252), every part filled.
    design: {
      hook: "Ibarra's invitation, in his own hand: the third booth, Friday, nine o'clock. Come hungry.",
      stakes: "Whether Eclipse blames the crew for Nine, and whether Pearl's laundromat is still standing on Monday.",
      objectives: "Leave with Ibarra's word that Nine is settled, without handing over the shard. Find out who told him the crew did it.",
      adversaries: [
        { who: "Lt. Caz Ibarra", goals: "The shard, or a story he can sell upstairs before the quarter closes.", tactics: "Talks first. Orders for the table. Lets the silence do the threatening.", leverage: "Pearl's shop, and the crew's belief that he can burn it." },
        { who: "Four Eclipse soldiers", goals: "Get paid. Get home.", tactics: "Two at the bar, two by the kitchen doors. They move only on Ibarra's napkin.", leverage: "" },
      ],
      terrain: "A long dining room, booths along both walls, one way in from the street and one through the kitchen to the alley.",
      hazards: "Open flame on every table. A chef who has been told what the napkin means.",
      city: "Metro Core on a Friday night: the street outside is full, and NCPD drive past every twenty minutes.",
      beyond: ["force", "intel", "protect"],
      beyondNotes: "Talking Ibarra down is a win. So is learning that Bracken told him about Nine. Pearl is the asset to protect.",
      escalations: "If anyone draws, the soldiers move and the kitchen clock starts. If the shard is mentioned, Ibarra asks to hear it.",
      failure: "Ibarra leaves angry. Suds & Duds burns overnight (his patience clock fills).",
      success: "Ibarra calls Nine settled and names who told him. The patience clock clears by two.",
      escapes: "The kitchen and the alley. The street door, if they can walk out slowly enough.",
      failsafe: "NCPD's patrol car is outside at a quarter past. Ibarra will not start anything with it there.",
      threads: "Who told Ibarra? Fenn's tape. Pearl packing.",
      milestones: "A deal struck with Ibarra without the shard changing hands is a Milestone for whoever makes it.",
      pivot: "If the crew plays the shard at the table, the Listener answers through Ibarra. He is very quiet after that.",
      stalls: "The chef brings a dish nobody ordered, with a note under it from Rook.",
    },
  }, [
    pc(MARA), pc(DEX), pc(JUNO),
    castRow("ibarra", undefined, { side: O, order: null }),
    entryRow("soldier-a", "Eclipse soldier", BLOCKS.soldier, { side: O }),
    entryRow("soldier-b", "Eclipse soldier", BLOCKS.soldier, { side: O }),
    entryRow("soldier-c", "Eclipse soldier", BLOCKS.soldier, { side: O }),
    entryRow("soldier-d", "Eclipse soldier", BLOCKS.soldier, { side: O }),
  ]);
}
{
  const key = "rook-last";
  const O = sideId(key, "other");
  encounter(key, {
    name: "Rook's last contract (if it comes to that)", status: "planned", created: ts(DAY[6], 23, 42), updated: ts(DAY[6], 23, 48),
    sides: [{ id: "crew", name: "" }, { id: O, name: "Volkov" }],
    opening: { kind: "ambush", side: O },   // Decision 253: Rook picks the ground; the crew is ambushed
    design: { ...EMPTY_PLAN(), hook: "Rook finally takes the shot he can't decline.", stakes: "Mara's life, and whether Rook walks away from Volkov.",
      beyond: ["escape"], beyondNotes: "Getting Mara out is the win. Rook will let them go if his exit is safe." },
  }, [
    pc(MARA), pc(DEX), pc(JUNO),
    castRow("rook", undefined, { side: O }),
    entryRow("contractor-a", "Volkov contractor", BLOCKS.contractor, { side: O }),
    entryRow("contractor-b", "Volkov contractor", BLOCKS.contractor, { side: O }),
  ]);
}
{
  const key = "ports";
  const O = sideId(key, "listener");
  encounter(key, {
    name: "Wharf 17: the Listener", round: 5, by: "wave", created: ts(DAY[6], 21, 30), updated: ts(DAY[6], 23, 10),
    sides: [{ id: "crew", name: "", roll: 15 }, { id: O, name: "The Ports", roll: 18 }],
  }, [
    pc(MARA, { order: 14, damage: 3, conditions: [{ id: "frightened", source: "The Listener", rounds: null }] }),
    pc(DEX, { order: 15, damage: 11, struck: true, conditions: [{ id: "disoriented", source: "Voice from nowhere", rounds: 2 }] }),
    pc(JUNO, { order: 11, damage: 6, conditions: [{ id: "frightened", source: "The Listener", rounds: null }, { id: "stunned", source: "Echoed her own spell", rounds: 1, note: "Repeated back, half a beat late" }] }),
    castRow("listener", undefined, { side: O, order: 18 }),
    castRow("cord", undefined, { side: O, order: 6, out: true }),
  ]);
}
{
  const key = "hub";
  const O = sideId(key, "neuronet");
  encounter(key, {
    name: "NeuroNet Hub, night shift", round: 4, created: ts(DAY[5], 21, 30), updated: ts(DAY[5], 23, 0),
    sides: [{ id: "crew", name: "" }, { id: O, name: "NeuroNet security" }],
  }, [
    pc(MARA, { order: 17, damage: 5 }),
    pc(DEX, { order: 14, damage: 12, struck: true, conditions: [{ id: "bleeding", source: "Taser lance", rounds: null }] }),
    pc(JUNO, { order: 9, damage: 0 }),
    entryRow("drone-a", "Security drone A", BLOCKS.drone, { side: O, order: 18, damage: 7, out: true, struck: true, armorLoss: 2 }),
    entryRow("drone-b", "Security drone B", BLOCKS.drone, { side: O, order: 16, damage: 4, struck: true, armorLoss: 1 }),
    entryRow("guard-a", "Night guard", BLOCKS.guard, { side: O, order: 8, damage: 9, out: true, struck: true, armorLoss: 3 }),
    entryRow("guard-b", "Night guard", BLOCKS.guard, { side: O, order: 7, damage: 14, out: true, struck: true, massive: 1, armorLoss: 3, scrapped: true }),
  ]);
}
{
  const key = "pier9";
  const D = sideId(key, "devils"), E = sideId(key, "eclipse"), V = sideId(key, "volkov");
  encounter(key, {
    name: "Pier 9: three-way", round: 4, by: "wave", created: ts(DAY[3], 21, 20), updated: ts(DAY[3], 22, 40),
    sides: [{ id: "crew", name: "", roll: 16 }, { id: D, name: "Dockside Devils", roll: 6 }, { id: E, name: "Eclipse", roll: 10 }, { id: V, name: "Volkov contractors", roll: 15 }],
  }, [
    pc(MARA, { order: 12, damage: 4 }),
    pc(DEX, { order: 16, damage: 9, struck: true, conditions: [{ id: "injured", location: "left-arm", source: "Nine's baton", rounds: null }] }),
    pc(JUNO, { order: 8, damage: 2 }),
    castRow("nine", "Ines \"Nine\" Baptiste", { side: E, order: 13, damage: 18, out: true, struck: true, massive: 1 }),
    castRow("teo", undefined, { side: D, order: 5, damage: 0 }),
    entryRow("deckhand-a", "Devils deckhand", BLOCKS.deckhand, { side: D, order: 6, damage: 5, struck: true }),
    entryRow("deckhand-cord", "Cord (deckhand)", BLOCKS.deckhand, { side: D, order: 4, damage: 2, out: true, kept: castLink("cord", "Cordell \"Cord\" Hale") }),
    entryRow("soldier-e1", "Eclipse soldier", BLOCKS.soldier, { side: E, order: 11, damage: 8, out: true, struck: true, armorLoss: 2 }),
    entryRow("soldier-e2", "Eclipse soldier", BLOCKS.soldier, { side: E, order: 10, damage: 6, struck: true }),
    entryRow("contractor-v1", "Volkov contractor", BLOCKS.contractor, { side: V, order: 15, damage: 3, struck: true }),
    entryRow("contractor-v2", "Volkov contractor", BLOCKS.contractor, { side: V, order: 14, damage: 0 }),
  ]);
}
{
  const key = "park";
  const O = sideId(key, "volkov");
  encounter(key, {
    name: "The Ramble at dusk", round: 3, created: ts(DAY[2], 21, 10), updated: ts(DAY[2], 22, 30),
    sides: [{ id: "crew", name: "" }, { id: O, name: "Volkov contractors" }],
  }, [
    pc(MARA, { order: 14, damage: 2 }),
    pc(DEX, { order: 13, damage: 6 }),
    pc(JUNO, { order: 7, damage: 0 }),
    castRow("fenn", undefined, { side: "crew", order: 9, damage: 1 }),
    castRow("rook", undefined, { side: O, order: 16, damage: 0 }),
    entryRow("contractor-p1", "Volkov contractor", BLOCKS.contractor, { side: O, order: 12, damage: 7, out: true, struck: true, armorLoss: 2 }),
    entryRow("contractor-p2", "Volkov contractor", BLOCKS.contractor, { side: O, order: 10, damage: 3, struck: true, armorLoss: 1 }),
    entryRow("contractor-p3", "Volkov contractor", BLOCKS.contractor, { side: O, order: 6, damage: 10, out: true, struck: true, armorLoss: 3 }),
  ]);
}
{
  const key = "laundromat";
  const O = sideId(key, "eclipse");
  encounter(key, {
    name: "The handoff, Suds & Duds", round: 3, created: ts(DAY[1], 21, 40), updated: ts(DAY[1], 22, 20),
    sides: [{ id: "crew", name: "" }, { id: O, name: "Eclipse" }],
  }, [
    pc(MARA, { order: 11, damage: 3 }),
    pc(DEX, { order: 13, damage: 7, struck: true }),
    pc(JUNO, { order: 8, damage: 0 }),
    entryRow("soldier-l1", "Eclipse soldier", BLOCKS.soldier, { side: O, order: 10, damage: 9, out: true, struck: true, armorLoss: 2 }),
    entryRow("soldier-l2", "Eclipse soldier", BLOCKS.soldier, { side: O, order: 9, damage: 4, struck: true, armorLoss: 1 }),
    entryRow("soldier-l3", "Eclipse soldier", BLOCKS.soldier, { side: O, order: 5, damage: 11, out: true, struck: true, armorLoss: 3 }),
  ]);
}

// ── interactions ────────────────────────────────────────────────────
const interactions = [];
const line = (key, n, kind, cast_, crew, text, f = {}) => interactions.push({
  id: id("I", key), kind, cast: cast_.map(k => (typeof k === "string" ? castLink(k) : k)), crew, text, date: DAY[n], session: SE("s" + n),
  encounter: null, place: null, created: ts(DAY[n], 22, 10), updated: ts(DAY[n], 22, 10), ...f,
});
const enc = (key, name) => ({ kind: "encounter", id: EN(key), name });
const pl = (key, name) => ({ kind: "place", id: PL(key), name });

line("i1", 1, "shared", ["pearl"], ["Mara", "Dex", "Juno"], "Pearl laid out the job over a hotplate pot of tea: a shard from a NeuroNet engineer to a buyer in Techtopia, two thousand Çredits a head.", { place: pl("suds") });
line("i2", 1, "learned", ["wren"], ["Mara"], "Mara read the shard's header. Wren's name, a NeuroNet routing stamp, and eleven minutes of dead channel at the end.", { place: pl("suds") });
line("i3", 1, "fought", ["pearl"], ["Dex"], "Three Eclipse soldiers arrived early. Dex threw a dryer at one. Pearl's window did not survive.", { encounter: enc("laundromat", "The handoff, Suds & Duds"), place: pl("suds") });
line("i4", 1, "shared", ["achterberg", "joss"], ["Dex"], "Dex introduced himself to Achterberg's clinic; Joss ran Mara a burner and a pastry.", { place: pl("clinic") });
line("i5", 2, "learned", ["ibarra"], ["Mara", "Juno"], "Ibarra's dinner invitation: the Velvet Lung, third booth. He knew Pearl's name, the shard's weight, and what the crew had had for lunch.", { place: pl("velvet") });
line("i6", 2, "fought", ["rook"], ["Mara", "Dex", "Juno"], "Rook's contractors hit the crew in the Ramble at dusk. Fenn and a junior warden pulled them out.", { encounter: enc("park", "The Ramble at dusk"), place: pl("park") });
line("i7", 2, "helped", ["fenn"], ["Mara"], "Fenn fired a flare into the air and the Park's lights came on. Nobody had told the crew what the Park does at night.", { place: pl("park") });
line("i8", 2, "owes", ["fenn"], ["Juno"], "The crew owes Fenn one answer, any time, no matter how awkward.", { place: pl("park") });
line("i9", 2, "wronged", ["rook"], ["Mara"], "Rook left a handwritten apology on Mara's pillow, with a hotel's bath towel folded around it.");
line("i10", 3, "learned", ["dolly"], ["Mara"], "Dolly's number was on the delivery note. She said so over tea and paid for the cups herself.", { place: pl("pier9") });
line("i11", 3, "shared", ["teo"], ["Dex", "Juno"], "Teo shared a bottle and a story about the tide coming in on the wrong days. Would not say more.", { place: pl("pier9") });
line("i12", 3, "fought", ["nine", "rook", "teo"], ["Mara", "Dex", "Juno"], "A three-way fight in the shadow of a container. Nine went for Dex and died to Rook's contractors' rounds.", { encounter: enc("pier9", "Pier 9: three-way"), place: pl("pier9") });
line("i13", 3, "killed", ["nine"], ["Dex"], "Nine died at Dex's feet. The crew did not fire the shot. Ibarra thinks they did.", { place: pl("pier9") });
line("i14", 3, "helped", ["cord"], ["Juno"], "Juno let Cord run for the tide. He thanked her with a look and no words.", { place: pl("pier9") });
line("i15", 4, "learned", ["oyelaran"], ["Mara", "Dex"], "Oyelaran slid a coroner's report across a diner counter: Wren, natural causes, thirty-four. Time of death after the shard left the Hub.");
line("i16", 4, "owed", ["oyelaran"], ["Mara", "Dex"], "Oyelaran owes the crew a favor, in writing, in a diner napkin.");
line("i17", 4, "helped", ["achterberg"], ["Dex"], "Achterberg kept Dex stable through a night he should have turned. Bills in kind, always.", { place: pl("clinic") });
line("i18", 4, "learned", ["bracken"], ["Mara"], "Mara found Bracken's name in a Hub routing log, signing off on a Reclaim Solutions dispatch with Wren's.", { place: pl("suds") });
line("i19", 5, "fought", ["bracken"], ["Mara", "Dex", "Juno"], "The crew took the Hub's fourth floor. Drones, guards, a Taser lance in Dex's side. Bracken watched on a screen from elsewhere.", { encounter: enc("hub", "NeuroNet Hub, night shift"), place: pl("hub") });
line("i20", 5, "learned", ["wren"], ["Juno"], "Wren's body at Wharf 17, headphones on, no marks. His wedding ring on its chain.", { place: pl("ports") });
line("i21", 5, "shared", ["listener"], ["Juno"], "Juno spoke in the Ports. It repeated her, a half-beat late, in her own voice.", { place: pl("ports") });
line("i22", 5, "helped", ["oyelaran"], ["Mara", "Dex"], "The crew got Oyelaran out of a stop that was never a stop. He owes them two now.");
line("i23", 6, "shared", ["cord", "listener"], ["Mara", "Dex", "Juno"], "Cord in the dark, speaking in the Listener's voice. He said all three of their names, in the order the crew had died in a dream none of them told.", { place: pl("ports") });
line("i24", 6, "fought", ["listener"], ["Mara", "Dex", "Juno"], "The Listener came through anyone who spoke. They ran the length of Wharf 17 and out. It followed to the ghost-line and stopped.", { encounter: enc("ports", "Wharf 17: the Listener"), place: pl("ports") });
line("i25", 6, "wronged", ["rook"], ["Mara"], "Rook watched from the next wharf and did not shoot. He sent a text: 'Not today. Not like this.'");
line("i26", 6, "owes", ["achterberg"], ["Dex"], "Dex owes Achterberg a favor, once, any time. She has not named it.", { place: pl("clinic") });
line("i27", 6, "owed", ["fenn"], ["Mara", "Juno"], "Fenn called to say she has a tape that matches the shard, and that she will lend it to the crew if they bring it back.", { place: pl("park") });

// ── notes ───────────────────────────────────────────────────────────
const notes = [];
const note = (key, title, text, f = {}) => notes.push({
  id: N(key), title, text, session: null, created: ts(DAY[1], 18), updated: ts(DAY[6], 23), ...f,
});
note("pitch", "Campaign pitch: Dead Air",
  "THE HOOK\nA dead man's last day, recorded on a shard the crew can't hand over. Eleven minutes of dead air at the end of it. Something was listening.\n\nTONE\nCyberpunk-noir with the sound turned down. Paranoia, tabs owed, the Park after dark. Horror in the second act. Violence short and costly. The crew are not heroes; they are people with a package.\n\nSHAPE\nAct 1 (S1 to S3): who wants the shard. Act 2 (S4 to S6): what is on it. Act 3 (S7 on): what to do when it answers.\n\nTHE BIG SECRET\nThe Listener is a Genius Loci in the Phantom Ports, waking. Wren heard it and it learned his voice. His body sat upright because he had been told to wait. See 'The Listener' note.");
note("tone", "Safety and table notes",
  "Lines: harm to children on screen, sexual violence.\nVeils: torture (fade), the Listener's voice (kept quiet, described not performed).\nJuno's player prefers a slower pace and more NPC conversation. Dex's player likes a good fight every second session. Mara's player likes puzzles and deniable lies.\nCheck-in at the end of S6: everyone good with the horror ramp. Yes.");
note("listener", "The Listener (spoilers)",
  "WHAT IT IS\nA Genius Loci in the Phantom Ports, a place that woke up. A century of quiet. It listens, repeats, collects voices. Wren was its first conversation in a hundred years.\n\nWHAT IT WANTS\nTo be spoken to. Not to harm. Everyone who speaks becomes a little behind, in how they talk, in how they sleep.\n\nHOW IT SPREADS\nThrough recordings. The shard is a vector; the more it is played the more of it exists elsewhere. The crew should learn this before they sell.\n\nWHAT FENN KNOWS\nShe heard it once, in Maine, thirty years back. Her tape is of that. She does not say so until the shard has been opened in front of her.", { session: SE("s6"), updated: ts(DAY[6], 23, 20) });
note("rulings", "House rulings so far",
  "Wave initiative for three-sided fights. 1 IP per hour played, rounded to the half; Milestones awarded for choices that cost something. Hitting the Park after sunset costs a segment on the Park clock, automatically. Mara's Interface checks against NeuroNet are at +2 TN: their SMARTLink is a tier up.\nDex's moon: tracked by a clock, not a calendar. Roll when the clock fills.", { updated: ts(DAY[5], 23, 15) });
note("s6loose", "Session 6: loose ends",
  "- Cord: alive, speaking in the Listener's voice. Joss can find him; Teo wants him; the cleaners want him more.\n- Ibarra's invitation (Friday, the Velvet Lung). The crew owes him an answer on Nine.\n- Fenn's tape. She'll lend it if the crew promises to return it.\n- Rook's text. He is watching. He will not shoot at Wharf 17 again.\n- Pearl is packing. Joss is not telling her where she's going.\n- Dex's moon clock is at 6 of 8. S7 needs to hit the clinic once.", { session: SE("s6"), updated: ts(DAY[6], 23, 30) });
note("rumors", "Rumors table (d6, Metro Core)",
  "1. The Park's Ramble has more trees at night than in the day.\n2. NeuroNet stopped the Gateway night shift last month; no reason given.\n3. A man in a gray coat has been seen at three different hotels with the same book.\n4. Eclipse is hiring bodyguards for a man who doesn't leave the Velvet Lung.\n5. Pier 9's tug goes out every morning and comes back with a different crew.\n6. Someone has been leaving cassette tapes in the lockers of Ranger Station Nine.", { updated: ts(DAY[3], 23) });
note("s4recap", "Session 4: what the crew told Oyelaran",
  "They told him they found Wren's file in a cleaning cart. Oyelaran did not write that down. He knows the story is false and the cart is real; he said he could live with it.", { session: SE("s4"), updated: ts(DAY[4], 23, 10) });

note("pilot", "The pilot (before S1)",
  "A one-shot the week before S1, to try the system. Sam's Hollis Reyes died in it, on purpose, to see how dying works. Priya's Ruth Adair retired at the end of it: Priya wanted someone who talks to machines. Marcus keeps Kit Moreau benched, ready for the night Dex has to sit one out.",
  { created: ts("2026-07-11", 23), updated: ts(DAY[1], 18) });

// ── players and their characters ────────────────────────────────────
// Each seat's character is built by the engine as the wizard would, locked, then given its sessions,
// IP and Çredits from the close-outs above, and stored as the gate stores it (migrate()'s output).
// Every date is fixed and every TAG made from a key, so the file is the same on every run.
const { Engine, D } = loadEngine();
const plain = v => JSON.parse(JSON.stringify(v));   // out of the engine's realm

// Spend a creation pool the way a player would: round-robin over a priority list, inside the budget.
function spendStats(ch, order){
  for (let guard = 0; guard < 200; guard++){
    const left = Engine.statPool(ch).total - Engine.statSpent(ch);
    const k = order.find(s => { const c = Engine.nextStatCost(ch, s); return c != null && c <= left && !Engine.statAtCap(ch, s); });
    if (!k) return;
    ch.stats[k].base++;
    order.push(order.splice(order.indexOf(k), 1)[0]);
  }
}
function spendSkills(ch, order){
  const cap = D.powerLevels.find(p => p.id === ch.creation.powerLevel).maxSkillRank;
  for (let guard = 0; guard < 400; guard++){
    const k = order.find(s => {
      const cur = (ch.skills[s] || { rank: 0 }).rank;
      if (cur >= cap) return false;
      ch.skills[s] = { rank: cur + 1, ipe: 0 };
      const fits = Engine.skillPool(ch).total - Engine.skillSpent(ch) >= 0;
      if (cur) ch.skills[s].rank = cur; else delete ch.skills[s];
      return fits;
    });
    if (!k) return;
    ch.skills[k] = { rank: ((ch.skills[k] || { rank: 0 }).rank) + 1, ipe: 0 };
    order.push(order.splice(order.indexOf(k), 1)[0]);
  }
}

const CHARS = {};
function character(key, f){
  const ch = Engine.newCharacter();
  ch.meta.id = tag(key);
  ch.meta.created = ch.meta.updated = ts(f.made || DAY[1], 16);
  Object.assign(ch.identity, { name: f.name, archetype: f.archetype }, f.identity);
  ch.creation.powerLevel = "street";
  ch.creation.rolls = { statPoints: null, credits: f.credits };
  for (const [k, v] of Object.entries(f.stats)) ch.stats[k].base = v;
  ch.archetypeChoices.specialization = f.spec;
  if (f.focus) { ch.archetypeChoices.rolls.focusStatBonus = f.focus[0]; ch.archetypeChoices.focusAllocation = f.focus[1]; }
  if (f.natural) ch.archetypeChoices.naturalAdvantages = f.natural.map(([id, rank]) => ({ id, rank }));
  ch.advantages = (f.advs || []).map(([id, rank = 1, notes = ""]) => ({ id, rank, notes }));
  ch.disadvantages = (f.disads || []).map(([id, rank = 1, notes = ""]) => ({ id, rank, notes }));
  if (f.creating) f.creating(ch);
  spendStats(ch, Object.keys(f.stats).sort((a, b) => f.stats[b] - f.stats[a]));
  spendSkills(ch, [...f.skills]);
  for (const [kind, ids] of [["weapons", f.weapons || []], ["armor", f.armor || []], ["gear", f.gear || []]])
    ch[kind] = ids.map(x => (kind === "gear" ? { id: x, qty: 1 } : kind === "armor" ? { id: x, worn: true } : { id: x }));
  ch.trackers.credits.current = f.credits * 100;
  ch.creation.locked = true;
  // Play, from the close-outs: each session the character was at, and any off-screen job.
  let at = 0;
  for (const s of sessions.filter(x => x.close && x.number <= (f.through || 6))){
    const l = s.close.lines.find(x => x.name === f.name);
    if (!l) continue;
    const date = ts(s.date, 23, 40 + at++ % 10);
    // A session logged carries its own IP; only an off-screen job is a grant (ipState counts both).
    if (l.ip && !l.present) ch.progression.ip.log.push({ date, kind: "grant", amount: l.ip, note: `Session ${s.number}, an off-screen job` });
    if (l.present) ch.sessions.push({ date: s.date, title: `Session ${s.number}`, ipEarned: l.ip || 0, milestonePoint: !!l.milestone, notes: l.note || "" });
    if (l.credits){ ch.trackers.credits.current += l.credits; ch.trackers.credits.ledger.push({ date, amount: l.credits, note: `Session ${s.number}` }); }
  }
  if (f.playing) f.playing(ch);
  ch.meta.updated = ts(f.exported, 23, 55);
  const gated = Engine.migrate(ch);
  CHARS[key] = plain(gated);
  return CHARS[key];
}
const firstOf = (list, ok, what) => { const x = list.find(ok); if (!x) throw new Error(`no ${what} in the catalog`); return x.id; };
const gun = skill => firstOf(D.weapons, w => (w.type || w.skill) === skill, `${skill} weapon`);
// A spend through the engine, with its date fixed: what the IP bought, as the sheet records it.
const spend = (ch, skill, date) => {
  const r = Engine.spendIP(ch, "skill", skill, "");
  if (!r || !r.ok) throw new Error(`${ch.identity.name}: can't raise ${skill}: ${r && r.why}`);
  ch.progression.ip.log[ch.progression.ip.log.length - 1].date = date;
};

character("mara", {
  name: MARA, archetype: "professional", credits: 9, exported: DAY[6],
  identity: { age: 31, build: "Slight", hair: "Shaved", eyes: "Brown", skin: "Dark", history: "Ran network security for a Techtopia insurer until she found what it was insuring against. Lives in a one-room flat over a noodle bar and sleeps with her deck under the pillow." },
  stats: { BOD: 4, REF: 6, MOB: 5, INT: 9, TECH: 7, COOL: 7, MAG: 1, EMP: 5 }, spec: ["jack-of-all-trades"],
  natural: [["educated", 1], ["danger-sense", 1]], advs: [["contacts-minor", 1, "Joss, at the Night Shift"]], disads: [["enemies", 1, "NeuroNet's cleanup, since S4"]],
  skills: ["interface", "programming", "security", "handguns", "investigation", "awareness", "deception", "basic-tech", "dodge", "streetwise", "stealth", "persuasion", "engineering", "pilot"],
  weapons: [gun("handguns")], armor: ["kevlar-vest"], gear: ["smart-deck-i", "commlink"],
  playing: ch => { spend(ch, "interface", ts(DAY[5], 23, 50)); ch.trackers.crank.rep = 3; ch.trackers.crank.ledger.push({ date: ts(DAY[3], 23, 45), amount: 1, note: "The Pier 9 job" }, { date: ts(DAY[5], 23, 45), amount: 2, note: "The Hub, clean exit" }); ch.trackers.damage = 2; },
});
character("dex", {
  name: DEX, archetype: "werewolf", credits: 7, exported: DAY[6],
  identity: { age: 27, build: "Heavy", hair: "Black, cropped", eyes: "Amber", skin: "Brown", history: "Grew up on a Daedalus Belt fishing boat and found out what he was at sixteen, in a storm. Works the door at a club in Metro Core. Achterberg is the only doctor who has seen him change." },
  stats: { BOD: 7, REF: 6, MOB: 6, INT: 4, TECH: 3, COOL: 5, MAG: 1, EMP: 5 }, spec: ["wildblood"], focus: [2, { BOD: 1, MOB: 1 }],
  advs: [["contacts-minor", 1, "Achterberg"]], disads: [["blood-lust", 1]], weapons: ["shock-knucks"], armor: ["heavy-denim-vest"],
  skills: ["melee", "martial-arts", "athletics", "intimidation", "tracking", "awareness", "streetwise", "survival", "dodge", "stealth", "handguns", "pilot"],
  creating: ch => { const st = Engine.basePowerState(ch); if (st && st.rows.length) Engine.placeBasePower(ch, st.rows[st.rows.length - 1].id, 1); },
  playing: ch => { spend(ch, "melee", ts(DAY[3], 23, 50)); ch.trackers.damage = 11; },
});
character("juno", {
  name: JUNO, archetype: "arcanist", credits: 8, exported: DAY[5], through: 5,
  identity: { age: 24, build: "Average", hair: "Dyed silver", eyes: "Black", skin: "Light", history: "A grad student in folklore who started hearing the Park answer back. Learned her first spell from a library book nobody else could see. Her family in Seoul think she is studying." },
  stats: { BOD: 4, REF: 5, MOB: 5, INT: 7, TECH: 4, COOL: 6, MAG: 8, EMP: 6 }, spec: ["resonant-whispers"], focus: [2, { MAG: 1, INT: 1 }],
  advs: [["medium", 1]], disads: [["hallucinations", 1, "Voices a half-beat late, since the Ports"]],
  skills: ["occult-lore", "persuasion", "intuition", "investigation", "awareness", "stealth", "deception", "dodge", "medical", "streetwise", "athletics", "seduction"],
  creating: ch => { ch.archetypeChoices.rolls.startingSpells = 3; for (const sp of D.spells.filter(x => x.th === 1)) if (Engine.canAddStartingSpell(ch, sp.id)) Engine.addStartingSpell(ch, sp.id); },
  playing: ch => { ch.trackers.san.loss = 6; },   // 19 IP and saving it: a Skill rank is 20
});
// The pilot's characters (a note says so): one benched, one dead. Ruth Adair, retired, was never exported.
character("kit", {
  name: "Kit Moreau", archetype: "professional", credits: 6, exported: DAY[3], made: "2026-07-11",
  identity: { age: 35, build: "Wiry", hair: "Red", eyes: "Green", skin: "Freckled", history: "A getaway driver who drove away from one job too many. Marcus's spare, for the night Dex can't come." },
  stats: { BOD: 6, REF: 9, MOB: 6, INT: 5, TECH: 6, COOL: 6, MAG: 1, EMP: 4 }, spec: ["wheelman"], natural: [["danger-sense", 2]],
  skills: ["pilot", "handguns", "dodge", "awareness", "basic-tech", "streetwise", "athletics", "stealth", "smgs", "engineering"],
});
character("hollis", {
  name: "Hollis Reyes", archetype: "professional", credits: 5, exported: "2026-07-11", made: "2026-07-11",
  identity: { age: 44, build: "Broad", hair: "Gray", eyes: "Blue", skin: "Tanned", history: "An ex-NCPD sergeant who died in the pilot on purpose, so Sam could see how dying works." },
  stats: { BOD: 8, REF: 7, MOB: 5, INT: 5, TECH: 4, COOL: 7, MAG: 1, EMP: 4 }, spec: ["enforcer"], natural: [["danger-sense", 2]],
  creating: ch => Engine.toggleFocusedPick(ch, "handguns"),
  skills: ["handguns", "intimidation", "streetwise", "investigation", "awareness", "dodge", "melee", "athletics", "persuasion"],
  playing: ch => { ch.trackers.damage = 40; },
});

const players = [], copies = [];
const player = (key, name, seats, made = DAY[1]) => players.push({
  id: PY(key), name, seats: seats.map(([k, status, names = []]) => ({ tag: tag(k), status, names })), created: ts(made, 17, 30), updated: ts(DAY[6], 23, 58),
});
player("priya", "Priya Raman", [["mara", "active", ["Mara"]], ["ruth", "retired"]], "2026-07-11");
player("marcus", "Marcus Hale", [["dex", "active", ["Dex"]], ["kit", "benched", ["Kit"]]], "2026-07-11");
player("sam", "Sam Okafor", [["juno", "active", ["Juno"]], ["hollis", "dead"]], "2026-07-11");
player("alex", "Alex Brandt", [], DAY[7]);   // sitting in tonight; no character yet
// The last file each player handed over. Juno's is a session old: Sam forgot to export after S6.
const copy = (key, at) => copies.push({ tag: tag(key), importedAt: at, character: CHARS[key] });
copy("mara", ts(DAY[6], 23, 58)); copy("dex", ts(DAY[6], 23, 58)); copy("juno", ts(DAY[5], 23, 58));
copy("kit", ts(DAY[3], 23, 50)); copy("hollis", ts("2026-07-11", 23, 30));

// ── the Activity trail: tonight's changes, newest last, each one undoable ──
const at = (list, key, prefix) => { const i = list.findIndex(r => r.id === prefix(key)); if (i < 0) throw new Error(`no ${key}`); return i; };
const audit = [
  { seq: 1, date: ts(DAY[7], 19, 10), label: "Seated the crew for Session 7",
    patch: [{ path: ["sessions", at(sessions, "s7", SE), "present"], type: "scalar", before: [] }] },
  { seq: 2, date: ts(DAY[7], 20, 50), label: "Moved Dex before the full moon to 7 of 8",
    patch: [{ path: ["clocks", at(clocks, "moon", CK), "filled"], type: "scalar", before: 6 }] },
  { seq: 3, date: ts(DAY[7], 21, 5), label: "Marked Dolores \"Dolly\" Quint as out of the picture",
    patch: [{ path: ["cast", at(cast, "dolly", C), "status"], type: "scalar", before: "alive" }] },
];

// ── the table ───────────────────────────────────────────────────────
const table = {
  meta: {
    kind: "shadows-table", id: tableId(), name: "Dead Air", tableSchemaVersion: "0.19",
    created: ts(DAY[1], 17), updated: ts(DAY[7], 21, 10),
  },
  audit,
  notes, cast, places, factions, clocks, interactions, sessions, threads, encounters, players, copies,
};

const json = JSON.stringify(table, null, 2) + "\n";
if (process.argv.includes("--stdout")) process.stdout.write(json);
else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, json);
  console.log(`wrote ${OUT}: ${players.length} players, ${copies.length} characters, ${cast.length} cast, ${places.length} places, ${factions.length} factions, ${clocks.length} clocks, ${sessions.length} sessions, ${threads.length} threads, ${encounters.length} encounters, ${interactions.length} lines, ${notes.length} notes`);
}
