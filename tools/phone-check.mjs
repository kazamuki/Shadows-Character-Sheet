/**
 * Shadows Character Sheet — does the sheet fit the screen? (audit R12)
 *
 * jsdom has no layout, so nothing in `npm test` can see a header that eats a
 * third of a phone (B19) or a table that pushes the page sideways. This opens
 * the built single file from file:// in a real Chromium, the way a player
 * would, with a locked character, and on Home and every sheet tab at each
 * width measures:
 *   - the sticky header's height once scrolled, against a share of the screen;
 *   - horizontal overflow, which should be none;
 *   - on the sheet, whether the character's name fits in the header. The
 *     test name is short, so an ellipsis means the header gave it no room;
 *   - controls smaller than a finger: under 24px anywhere (WCAG 2.2, 2.5.8),
 *     under 44px on the touch phone, counting an invisible ::after hit area;
 *   - text under 11px (W43). Collapsed <details> are opened to look inside.
 *
 * Outside `npm test` on purpose: it needs a browser, and CI doesn't install
 * one. playwright-core (a devDependency) drives whichever Chromium is here:
 * $PHONE_CHECK_BROWSER (a path) if set, Playwright's own if installed (the
 * cloud image has it), otherwise installed Chrome or Edge.
 *
 * Usage:  npm run phone-check                  exit 1 if any width is over budget
 *         npm run phone-check -- some.html     check that built file instead
 *
 * B19 is open, so the phone width fails today by design: S6 of the audit plan
 * makes it pass. Tablets are where play is expected (AQ10).
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { buildHtml } from "./build.mjs";
import { loadEngine } from "../tests/harness.mjs";

// The share of the screen's height the pinned header may take, once scrolled.
const HEADER_MAX_SHARE = 0.2;
const LONG = "a long name";
const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet, portrait", width: 768, height: 1024 },
  { name: "tablet, landscape", width: 1024, height: 768 },
  { name: "phone, touch", width: 390, height: 844, touch: true },
];

function lockedCharacter() {
  const { Engine, D } = loadEngine();
  const ch = Engine.newCharacter();
  ch.identity.name = "Phone Check";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  ch.creation.locked = true;
  return JSON.parse(JSON.stringify(ch));   // out of the engine's vm realm
}

async function launch() {
  const tries = process.env.PHONE_CHECK_BROWSER
    ? [{ executablePath: process.env.PHONE_CHECK_BROWSER }]
    : [{}, { channel: "chrome" }, { channel: "msedge" }];
  const failures = [];
  for (const opts of tries) {
    try { return await chromium.launch(opts); }
    catch (e) { failures.push(`${JSON.stringify(opts)}: ${e.message.split("\n")[0]}`); }
  }
  throw new Error(`no Chromium to drive. Set PHONE_CHECK_BROWSER to one, or run \`npx playwright-core install chromium\`.\n  ${failures.join("\n  ")}`);
}

const dir = mkdtempSync(join(tmpdir(), "shadows-phone-"));
const file = join(dir, "shadows-character-sheet.html");
writeFileSync(file, process.argv[2] ? readFileSync(process.argv[2], "utf8") : buildHtml());
const seed = JSON.stringify({ ch: lockedCharacter(), section: "main" });

const browser = await launch();
const rows = [];
try {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w.width, height: w.height },
      hasTouch: !!w.touch, isMobile: !!w.touch });
    await ctx.addInitScript(s => { try { if (!localStorage.getItem("shadows.active.v1")) localStorage.setItem("shadows.active.v1", s); } catch (e) {} }, seed);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    const measure = async screen => {
      const m = await page.evaluate(floor => {
        // Small controls and small text (W43). Collapsed sections are opened
        // so a palette isn't missed, then closed again.
        const shut = [...document.querySelectorAll("details:not([open])")];
        shut.forEach(d => { d.open = true; });
        const shown = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[hidden]"); };
        const label = el => `${el.tagName.toLowerCase()}${el.classList.length ? "." + [...el.classList].join(".") : ""}`;
        const small = new Set(), tiny = new Set();
        for (const el of document.querySelectorAll("button, a[href], summary, select, input:not([type=hidden])")) {
          if (!shown(el)) continue;
          const r = (el.matches("input[type=checkbox], input[type=radio]") && el.closest("label") || el).getBoundingClientRect();
          let w = r.width, h = r.height;
          const a = getComputedStyle(el, "::after");
          if (a.content !== "none" && a.position === "absolute") { w = Math.max(w, parseFloat(a.width) || 0); h = Math.max(h, parseFloat(a.height) || 0); }
          if (Math.min(w, h) < floor - 0.5) small.add(`${label(el)} ${Math.round(w)}x${Math.round(h)}`);
        }
        const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (tw.nextNode()) {
          const el = tw.currentNode.parentElement;
          if (!tw.currentNode.textContent.trim() || !el || !shown(el) || el.closest("#printSheet")) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 11) tiny.add(`${label(el)} ${fs}px`);
        }
        shut.forEach(d => { d.open = false; });
        window.scrollTo(0, document.documentElement.scrollHeight);
        const h = document.querySelector("header.top").getBoundingClientRect();
        const de = document.documentElement;
        const brand = document.querySelector("header.top .brand");
        return { header: Math.round(h.bottom > 0 ? h.height : 0), overflow: de.scrollWidth - de.clientWidth,
          nameCut: brand.scrollWidth > brand.clientWidth, small: [...small], tiny: [...tiny] };
      }, w.touch ? 44 : 24);
      const share = m.header / w.height;
      rows.push({ width: w.name, screen, header: `${m.header}px (${Math.round(share * 100)}%)`,
        overflow: m.overflow ? `${m.overflow}px` : "none",
        name: screen === "home" ? "" : m.nameCut ? "cut" : "fits",
        targets: m.small.length ? m.small.join(", ") : "ok",
        text: m.tiny.length ? m.tiny.join(", ") : "ok",
        ok: share <= HEADER_MAX_SHARE && m.overflow <= 0 && (!mustFit(screen) || !m.nameCut) && !m.small.length && !m.tiny.length });
    };
    const mustFit = screen => screen !== "home" && screen !== LONG;
    await page.goto(pathToFileURL(file).href);
    await measure("home");
    await page.click("[data-open]");
    await page.waitForSelector("#topnav [data-sec]");
    const tabs = await page.$$eval("#topnav [data-sec]", bs => bs.map(b => b.dataset.sec));
    for (const sec of tabs) {
      await page.click(`#topnav [data-sec="${sec}"]`);
      await measure(sec);
    }
    // A long name is cut short, never allowed to push the page wider.
    await page.evaluate(n => { document.getElementById("brandctx").textContent = n; }, "Maximilian Aurelius Blackwood-Ravenscroft III");
    await measure(LONG);
    if (errors.length) rows.push({ width: w.name, screen: "(page errors)", header: errors.join("; "), overflow: "", ok: false });
    await ctx.close();
  }
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(`Header budget: ${HEADER_MAX_SHARE * 100}% of the screen's height, pinned after scrolling. Overflow budget: none. On the sheet, the name should fit.`);
console.log(`Controls: 24px or more, 44px on the touch phone. Text: 11px or more.\n`);
console.table(rows.map(r => ({ ...r, ok: r.ok ? "ok" : "OVER" })));
const bad = rows.filter(r => !r.ok);
const byWidth = [...new Set(bad.map(r => r.width))];
console.log(bad.length ? `\nOver budget at: ${byWidth.join(", ")}.` : "\nEvery width fits.");
process.exit(bad.length ? 1 : 0);
