/**
 * Z1: the TAG's barcode is a real Code 128 (Decision 320).
 *
 * The bars were decoration until a decoder could verify them. This file is that decoder's condition:
 * `@zxing/library` shares none of our code, so a typo in the engine's pattern table can't cancel out.
 * The library is a dev dependency, used here and nowhere in src/ (constraint 2, and the no-import guard).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { loadEngine } from "./harness.mjs";

const { Engine } = loadEngine();
const require = createRequire(import.meta.url);
const Z = require("@zxing/library");

const SAMPLE = "TAG-WEDP-2K7Z-YA82";
const sum = a => a.reduce((x, y) => x + y, 0);
const str = a => a.join("");

// Rasterise the runs: `unit` px a unit, `h` px tall, a white margin of `quiet` units each side, dark on light.
function raster(runs, { unit = 3, h = 40, quiet = 10, invert = false } = {}) {
  const w = (sum(runs) + 2 * quiet) * unit, px = new Uint8ClampedArray(w * h).fill(255);
  let x = quiet * unit;
  runs.forEach((r, i) => {
    if (i % 2 === 0) for (let y = 0; y < h; y++) px.fill(0, y * w + x, y * w + x + r * unit);
    x += r * unit;
  });
  if (invert) for (let i = 0; i < px.length; i++) px[i] = 255 - px[i];
  return { px, w, h };
}
function decode({ px, w, h }) {
  const src = new Z.RGBLuminanceSource(px, w, h);
  const reader = new Z.MultiFormatReader();
  reader.setHints(new Map([[Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.CODE_128]], [Z.DecodeHintType.TRY_HARDER, true]]));
  return reader.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(src))).getText();
}

test("Z1 1: the pattern table is Code 128's", () => {
  // Every symbol is reached through code128Runs: a one-character text gives the start, that character, its checksum and the stop.
  const symbols = new Map();                       // pattern → what it was reached as
  const note = (p, as) => { assert.ok(!symbols.has(p), `${as} repeats ${symbols.get(p)}: ${p}`); symbols.set(p, as); };
  const start = Engine.code128Runs(" ").slice(0, 6);
  note(str(start), "start B");
  assert.equal(sum(start), 11);
  for (let v = 0; v < 95; v++) {
    const r = Engine.code128Runs(String.fromCharCode(32 + v)), p = r.slice(6, 12);
    assert.equal(sum(p), 11, `value ${v} doesn't sum to 11`);
    note(str(p), `value ${v}`);
  }
  // The checksum's symbol takes every value 0..102; two characters reach all of them.
  const seen = new Set();
  for (let a = 0; a < 95 && seen.size < 103; a++) for (let b = 0; b < 95; b++) {
    const t = String.fromCharCode(32 + a, 32 + b), r = Engine.code128Runs(t), chk = (104 + a + 2 * b) % 103;
    if (seen.has(chk)) continue;
    seen.add(chk);
    const p = str(r.slice(18, 24));
    assert.equal(sum(r.slice(18, 24)), 11, `checksum value ${chk} doesn't sum to 11`);
    if (chk >= 95) note(p, `checksum value ${chk}`);   // 1..94 are already counted as characters
    else assert.equal(p, str(Engine.code128Runs(String.fromCharCode(32 + chk)).slice(6, 12)), `checksum value ${chk} isn't character ${chk}'s pattern`);
  }
  assert.equal(seen.size, 103, "the checksum didn't reach every value");
  const stop = Engine.code128Runs(" ").slice(-7);
  assert.equal(str(stop), "2331112"); assert.equal(sum(stop), 13);
  assert.equal(symbols.size, 1 + 95 + 8, "a symbol went uncounted");   // start, 0..94, and the checksum values 95..102
});

test("Z1 2: a one-letter text", () => {
  // start B 104, "A" = 33, checksum (104 + 33) % 103 = 34, stop.
  assert.deepEqual([...Engine.code128Runs("A")], [2,1,1,2,1,4, 1,1,1,3,2,3, 1,3,1,1,2,3, 2,3,3,1,1,1,2]);
  assert.equal(sum(Engine.code128Runs("A")), 46);
});

test("Z1 3: the sample TAG", () => {
  const b = Engine.tagBars(SAMPLE);
  assert.equal(b.text, "WEDP2K7ZYA82");
  assert.equal(b.modules, 167);
  assert.equal(str(b.runs), "2112143113211321131123133131212232111123313121313123113121131113233112222232113131212331112");
  assert.equal(b.runs.length, 91);
  assert.equal(str(b.runs.slice(78, 84)), "313121", "the checksum's runs (value 48)");
  assert.equal(str(b.runs.slice(0, 6)), "211214");
  assert.equal(str(b.runs.slice(-7)), "2331112");
  // A hand check: the weighted sum plus 104 is 2829, and 2829 mod 103 = 48.
  let s = 104; [...b.text].forEach((c, i) => { s += (c.charCodeAt(0) - 32) * (i + 1); });
  assert.equal(s, 2829); assert.equal(s % 103, 48);
});

test("Z1 4: a decoder reads it back, and not the other way round", () => {
  const ids = [SAMPLE];
  for (let i = 0; i < 50; i++) ids.push(Engine.newCharacter().meta.id);
  for (const id of ids) {
    const b = Engine.tagBars(id);
    assert.equal(b.modules, 167);
    assert.equal(decode(raster(b.runs)), b.text, `${id} didn't read back`);
  }
  // The reason for the button: light bars on a dark ground don't read.
  const b = Engine.tagBars(SAMPLE);
  assert.throws(() => decode(raster(b.runs, { invert: true })), "the inverted bars read, so the Scan button has no job");
});

test("Z1 5: a bad id is no barcode", () => {
  for (const bad of ["", null, undefined, 5, {}, "TAG-", "TAG-WEDP-2K7Z-YA8", "NCR-WEDP-2K7Z-YA82", "TAG-wedp-2k7z-ya82", "<script>", [], true])
    assert.equal(Engine.tagBars(bad), null, `tagBars(${JSON.stringify(bad)})`);
  for (const bad of ["é", "", 7, null, undefined, {}, "a\u007f", "a\nb"])
    assert.equal(Engine.code128Runs(bad), null, `code128Runs(${JSON.stringify(bad)})`);
});

test("Z1 11: every word the Scan button says is read, and the engine's table is the only one", async () => {
  const { readFileSync } = await import("node:fs");
  const { D } = loadEngine();
  const ui = readFileSync(new URL("../src/ui/shared.js", import.meta.url), "utf8");
  for (const k of Object.keys(D.appCopy.tagScan)) assert.match(ui, new RegExp("\\bT\\." + k + "\\b"), `appCopy.tagScan.${k} isn't read by the UI`);
  for (const f of ["src/ui/shared.js", "src/ui/sheet.js", "src/ui/wizard.js", "src/ui/gm.js", "src/ui/app.js"])
    assert.doesNotMatch(readFileSync(new URL("../" + f, import.meta.url), "utf8"), /zxing|2331112/, `${f} carries the decoder or a pattern table`);
});

test("Z1 12: the print header's bars take none of the screen's patch padding, and keep their size", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/styles/print.css", import.meta.url), "utf8");
  const rule = /#printSheet \.p-head \.p-intake svg\{([^}]*)\}/.exec(css);
  assert.ok(rule, "the print header's bars lost their rule");
  assert.match(rule[1], /padding:\s*0/); assert.match(rule[1], /margin:\s*0/);
  assert.match(rule[1], /height:\s*10pt/); assert.match(rule[1], /width:\s*83\.5pt/);
  assert.doesNotMatch(css, /intake-flip/, "the print sheet styles a button");
});
