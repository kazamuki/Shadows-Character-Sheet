/**
 * The sample campaign (tools/sample-table.mjs → samples/dead-air.shadows-table.json).
 *
 * It is a fixture for looking at GM mode with months on it, so the one thing
 * that matters is that the app reads it as written: the gate keeps every
 * record and rewrites nothing, and every link in it lands on something. A
 * change to the table's shape that the sample doesn't follow fails here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "./harness.mjs";
import { ROOT } from "../tools/build.mjs";

const { Engine, D } = loadEngine();
const file = join(ROOT, "samples", "dead-air.shadows-table.json");
const sample = JSON.parse(readFileSync(file, "utf8"));
// Compared as JSON with sorted keys: the engine runs in its own VM realm (deepEqual would see two prototypes)
// and the gate builds its keys in its own order.
const canon = v => JSON.stringify(v, (k, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);
const gated = Engine.migrateTable(sample);

test("the committed sample is what the builder makes", () => {
  const made = execFileSync(process.execPath, [join(ROOT, "tools", "sample-table.mjs"), "--stdout"], { encoding: "utf8" });
  assert.equal(made, readFileSync(file, "utf8"), "run: node tools/sample-table.mjs");
});

test("the gate keeps the sample exactly as written", () => {
  assert.equal(Engine.fileKind(sample), "table");
  assert.equal(Engine.tableCheck(sample).length, 0);
  assert.equal(gated.meta.tableSchemaVersion, sample.meta.tableSchemaVersion);
  assert.equal(canon(gated), canon(sample), "migrateTable() changed the sample: a field is missing, a value was coerced, or an id was replaced");
});

test("the sample is lived in: every kind of record is there, filled", () => {
  const n = k => sample[k].length;
  assert.ok(n("sessions") >= 6, "at least six sessions");
  assert.ok(sample.sessions.filter(s => s.close).length >= 5, "five closed-out sessions");
  assert.ok(sample.sessions.some(s => !s.close), "a session still to play");
  assert.ok(n("cast") >= 10 && n("places") >= 5 && n("factions") >= 4 && n("clocks") >= 5, "a cast, places, factions, clocks");
  assert.ok(sample.encounters.some(e => e.status === "ended") && sample.encounters.some(e => e.status === "planned"), "ended and planned encounters");
  assert.ok(sample.encounters.some(e => e.by === "wave") && sample.encounters.some(e => e.sides.length > 2), "wave and many-sided encounters");
  for (const s of ["alive", "dead", "missing", "gone"]) assert.ok(sample.cast.some(c => c.status === s), `a ${s} member`);
  assert.ok(sample.cast.some(c => c.block) && sample.cast.some(c => c.ally), "a stat block and an ally");
  for (const k of ["open", "resolved", "dropped"]) assert.ok(sample.threads.some(t => t.status === k), `a ${k} thread`);
  assert.equal(sample.threads.filter(t => t.current).length, 1, "one current thread");
  for (const k of Engine.INTERACTION_KINDS || ["shared", "learned", "helped", "wronged", "killed", "owes", "owed", "fought"])
    assert.ok(sample.interactions.some(i => i.kind === k), `a ${k} line`);
  assert.ok(sample.notes.some(x => x.session) && sample.notes.some(x => !x.session), "notes in and out of sessions");
});

test("no text field in the sample is left empty on a played record", () => {
  const blank = [];
  for (const c of sample.cast) for (const k of ["name", "flavor", "description", "origin", "motivation", "resources", "line", "ifPushed", "gmNote"])
    if (!c[k]) blank.push(`cast ${c.name}.${k}`);
  for (const f of sample.factions) for (const k of ["name", "base", "wants", "reach", "notes"]) if (!f[k]) blank.push(`faction ${f.name}.${k}`);
  for (const p of sample.places) for (const k of ["name", "notes"]) if (!p[k]) blank.push(`place ${p.name}.${k}`);
  for (const c of sample.clocks) for (const k of ["name", "advances", "whenFull"]) if (!c[k]) blank.push(`clock ${c.name}.${k}`);
  for (const s of sample.sessions.filter(x => x.close)) for (const k of Object.keys(s.journal)) if (!s.journal[k]) blank.push(`session ${s.number}.${k}`);
  assert.deepEqual(blank, []);
});

test("every link in the sample lands on something", () => {
  const ids = k => new Set(sample[k].map(r => r.id));
  const cast = ids("cast"), places = ids("places"), factions = ids("factions"), sessions = ids("sessions"), encs = ids("encounters");
  const bad = [];
  const castOk = (l, where) => { if (!cast.has(l.id)) bad.push(`${where}: no cast ${l.id}`); };
  for (const f of sample.factions) for (const l of f.keyNpcs) castOk(l, `faction ${f.name}`);
  const owners = { faction: factions, place: places, encounter: encs };
  for (const c of sample.clocks) if (c.on && !(owners[c.on.kind] && owners[c.on.kind].has(c.on.id))) bad.push(`clock ${c.name}: no ${c.on.kind}`);
  for (const i of sample.interactions) {
    for (const l of i.cast) castOk(l, `line ${i.id}`);
    if (i.session && !sessions.has(i.session)) bad.push(`line ${i.id}: no session`);
    if (i.encounter && !encs.has(i.encounter.id)) bad.push(`line ${i.id}: no encounter`);
    if (i.place && !places.has(i.place.id)) bad.push(`line ${i.id}: no place`);
  }
  for (const e of sample.encounters) for (const r of e.rows) {
    if (r.cast) castOk(r.cast, `encounter ${e.name}`);
    if (r.kept) castOk(r.kept, `encounter ${e.name} kept`);
    if (!e.sides.some(s => s.id === r.side)) bad.push(`encounter ${e.name}: row ${r.name} on no side`);
  }
  for (const n of sample.notes) if (n.session && !sessions.has(n.session)) bad.push(`note ${n.title}: no session`);
  for (const t of sample.threads) for (const k of ["opened", "closed"]) if (t[k] && !sessions.has(t[k])) bad.push(`thread ${t.title}.${k}`);
  assert.deepEqual(bad, []);
});

test("names are consistent: crew in sessions, close-outs and rows; affiliations name a faction", () => {
  const crew = new Set(sample.sessions[0].present);
  const bad = [];
  for (const s of sample.sessions) {
    for (const p of s.present) if (!crew.has(p)) bad.push(`session ${s.number} present: ${p}`);
    for (const l of s.close ? s.close.lines : []) if (!crew.has(l.name)) bad.push(`session ${s.number} close: ${l.name}`);
    if (s.close) for (const p of s.present) if (!s.close.lines.some(l => l.name === p && l.present)) bad.push(`session ${s.number}: ${p} present but not in the close-out`);
  }
  for (const e of sample.encounters) for (const r of e.rows) if (r.kind === "pc" && !crew.has(r.name)) bad.push(`encounter ${e.name}: ${r.name}`);
  const factionNames = new Set(sample.factions.map(f => f.name));
  const outside = new Set(["NCPD"]);   // an affiliation can be plain text; only these two are meant to be
  for (const c of sample.cast) for (const a of c.affiliations) if (!factionNames.has(a) && !outside.has(a)) bad.push(`${c.name}: affiliation ${a} is no faction`);
  assert.deepEqual(bad, []);
});

test("the sample's gazetteer ids exist in this version's data", () => {
  const entries = new Set(D.gazetteer.entries.map(e => e.id));
  const envs = new Set(D.gazetteer.environments.map(e => e.id));
  const bad = [];
  for (const p of sample.places) {
    for (const k of ["territory", "zone"]) if (p[k] && !entries.has(p[k])) bad.push(`place ${p.name}.${k}: ${p[k]}`);
    if (p.environment && !envs.has(p.environment)) bad.push(`place ${p.name}.environment`);
    if (p.from && !entries.has(p.from.id)) bad.push(`place ${p.name}.from`);
  }
  for (const f of sample.factions) {
    if (f.territory && !entries.has(f.territory)) bad.push(`faction ${f.name}.territory`);
    if (f.from && !entries.has(f.from.id)) bad.push(`faction ${f.name}.from`);
  }
  assert.deepEqual(bad, []);
});

// ── what the sample added for seats, a running fight and Activity ───────────

test("the crew is seated: players, every seat status, and the characters' last exports", () => {
  const seats = sample.players.flatMap(p => p.seats);
  for (const st of ["active", "benched", "retired", "dead"]) assert.ok(seats.some(s => s.status === st), `a ${st} seat`);
  assert.ok(sample.players.some(p => !p.seats.length), "a player with no character yet");
  assert.ok(seats.some(s => !sample.copies.some(c => c.tag === s.tag)), "a seat with no copy");
  const steps = D.creationFlow.steps.map(s => s.id);
  for (const c of sample.copies) {
    assert.ok(seats.some(s => s.tag === c.tag), `copy ${c.tag} has no seat`);
    assert.equal(c.character.meta.id, c.tag);
    assert.ok(c.character.creation.locked, `${c.character.identity.name} isn't locked`);
    const errs = steps.flatMap(s => [...Engine.validate(s, c.character)].filter(i => i.level === "error").map(i => `${s}: ${i.msg}`));
    assert.equal(errs.length, 0, `${c.character.identity.name} fails the wizard's checks: ${errs.join(" | ")}`);
  }
  for (const s of seats.filter(x => x.status === "active")) assert.ok(sample.copies.some(c => c.tag === s.tag), `active seat ${s.tag} has no copy`);
});

test("every name the crew is typed under reads as their seat", () => {
  const crew = sample.players.flatMap(p => p.seats).filter(s => s.status === "active").map(s => s.tag);
  const typed = new Set();
  for (const s of sample.sessions) { s.present.forEach(n => typed.add(n)); (s.close ? s.close.lines : []).forEach(l => typed.add(l.name)); }
  for (const i of sample.interactions) i.crew.forEach(n => typed.add(n));
  for (const e of sample.encounters) for (const r of e.rows) if (r.kind === "pc") typed.add(r.name);
  for (const p of sample.places) p.exposure.forEach(x => typed.add(x.name));
  const bad = [...typed].filter(n => !crew.includes(Engine.seatFor(gated, n)));   // seatFor gives the seat's TAG, or null
  assert.deepEqual(bad, []);
});

test("tonight's session is under way: a running fight, and the planned ones' worksheet and opening", () => {
  const running = sample.encounters.filter(e => e.status === "running");
  assert.equal(running.length, 1, "one running encounter");
  const r = running[0], rows = new Set(r.rows.map(x => x.id));
  assert.ok(r.round >= 1 && rows.has(r.turn), "its round and whose turn");
  assert.ok(r.acted.length && r.acted.every(id => rows.has(id)) && !r.acted.includes(r.turn), "who has acted");
  assert.ok(r.rows.some(x => x.delay && x.delay.until) && r.rows.some(x => x.last), "a delay and a row that goes last");
  assert.ok(sample.sessions.some(s => !s.close && s.present.length), "the session it's in has the crew at the table");
  const filled = sample.encounters.find(e => Object.entries(e.design).every(([, v]) => (Array.isArray(v) ? v.length : v)));
  assert.ok(filled, "a planned encounter with every part of its worksheet filled");
  assert.ok(sample.encounters.some(e => e.status === "planned" && e.opening && e.sides.some(s => s.id === e.opening.side)), "a planned opening");
  for (const k of ["faction", "place", "encounter"]) assert.ok(sample.clocks.some(c => c.on && c.on.kind === k), `a clock on a ${k}`);
  assert.ok(sample.places.some(p => p.exposure.length), "a place with an Exposure track");
});

test("the Activity trail undoes, newest first, back to where tonight started", () => {
  assert.ok(sample.audit.length >= 3, "an Activity trail");
  assert.equal(gated.audit.length, sample.audit.length, "the gate dropped an entry: a path lands on no record");
  // Each entry is a real change: the value it would put back isn't the one there now.
  for (const entry of sample.audit) for (const op of entry.patch)
    assert.notEqual(canon(op.path.reduce((x, k) => (x == null ? x : x[k]), sample)), canon(op.before), `${entry.label} changes nothing`);
  const t = JSON.parse(JSON.stringify(gated));
  for (const entry of [...sample.audit].reverse()) {
    const r = Engine.undoTableAction(t);
    assert.ok(r.ok, `undo ${entry.label}: ${r.why}`);
    for (const op of entry.patch) assert.equal(canon(op.path.reduce((x, k) => x[k], t)), canon(op.before), `${entry.label} didn't restore ${op.path.join(".")}`);
  }
  assert.equal(t.audit.length, 0);
  assert.equal(Engine.tableCheck(t).length, 0);
});
