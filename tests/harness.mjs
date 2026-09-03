/**
 * Shared test harness.
 *
 * Tests run against the BUILT single-file artifact (tools/build.mjs), because
 * that is what ships and because inlining reproduces a browser's blocking
 * script order exactly. If the split sources are wrong, the build is wrong,
 * and every test here fails loudly.
 */
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { buildHtml, ROOT } from "../tools/build.mjs";

/**
 * Boot the whole app (data + icons + engine + UI) in jsdom.
 * `storage` seeds localStorage *before* the scripts run, so resume paths
 * (draft / active sheet) can be exercised.
 */
export function boot({ storage = null } = {}) {
  const errors = [];
  const skipped = [];
  // jsdom has no layout, so scrollTo/scrollIntoView raise "Not implemented".
  // Those are environment gaps, not app faults — parked, not counted.
  const record = msg => (/^Not implemented:/.test(msg) ? skipped : errors).push(msg);
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => record(e.message));
  vc.on("error", (...a) => record(a.join(" ")));

  const dom = new JSDOM(buildHtml(), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://shadows.test/",
    virtualConsole: vc,
    beforeParse(win) {
      if (storage) for (const [k, v] of Object.entries(storage)) {
        win.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
      }
    },
  });
  const { window } = dom;
  return {
    dom, window,
    doc: window.document,
    // `const Engine` is a script-scoped lexical binding, not a window property.
    Engine: window.eval("typeof Engine !== 'undefined' ? Engine : null"),
    D: window.SHADOWS_DATA,
    errors, skipped,
    $: sel => window.document.querySelector(sel),
    $$: sel => [...window.document.querySelectorAll(sel)],
    click(sel) {
      const el = window.document.querySelector(sel);
      if (!el) throw new Error(`click: no element for ${sel}`);
      el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      return el;
    },
    text: () => window.document.body.textContent,
  };
}

/**
 * Load ONLY the engine — no DOM, no UI. Proves the engine stayed pure:
 * if engine.js ever touches `document`, this throws.
 *
 * REALM WARNING. The engine and the data run inside a `vm` context, so every
 * object they return carries THAT realm's prototypes. `assert.deepEqual` is
 * strict here and compares prototypes, so an array from the engine never
 * matches a literal `[]` written in the test file — you get "not equal" with
 * two identical-looking values and no visible difference. Spread engine arrays
 * into local ones (`[...engineArray]`) on BOTH sides of a deepEqual, or assert
 * on `.length` instead.
 */
export function loadEngine() {
  const data = readFileSync(join(ROOT, "src/data/shadows-data.js"), "utf8");
  const engine = readFileSync(join(ROOT, "src/engine/engine.js"), "utf8");
  const sandbox = { window: {}, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(data, sandbox, { filename: "shadows-data.js" });
  vm.runInContext(engine + "\n;globalThis.__engine = Engine;", sandbox, { filename: "engine.js" });
  return { Engine: sandbox.__engine, D: sandbox.window.SHADOWS_DATA };
}
