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
  for (const s of ["alive", "dead", "missing"]) assert.ok(sample.cast.some(c => c.status === s), `a ${s} member`);
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
  for (const c of sample.clocks) if (c.on && !factions.has(c.on.id)) bad.push(`clock ${c.name}: no faction`);
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
