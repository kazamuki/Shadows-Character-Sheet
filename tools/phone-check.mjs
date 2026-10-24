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
 *   - text under 11px (W43). Collapsed <details> are opened to look inside;
 *   - the wizard (P4): a new, named character on its Stats step, the longest
 *     header the wizard has, with its Home button held to the same finger size;
 *   - Expert mode (P13, P19): the Stats, Archetype, Skills and Character Points steps, folded, with the
 *     header holding both its buttons, and the sticky bar on Skills and Points within a
 *     share of the screen. A Character tab card with three tags at the narrowest width;
 *   - the fold (W45): the vitals bar and a sheet's jump bar on one row, and
 *     on a phone Main's Health card within a share of the screen;
 *   - the Character tab's layout (P16, Decision 246): for ten characters, at 1600px, 1100px, 1300px with the
 *     vitals pinned, and a phone: every section's heading at one x, every card on a track line, a lone card
 *     two tracks wide (or the row, at one track), the core mechanic and Disadvantages on the third line at
 *     four tracks, cards on a row one height, and no sideways scroll;
 *   - Progression with a Major Milestone unlocked, on a Professional, whose
 *     prerequisite chips are the longest (a chip naming three advantages
 *     pushed a phone 30px sideways, found 2026-10-16).
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
import { characterFixtures } from "../tests/character-fixtures.mjs";

// The share of the screen's height the pinned header may take, once scrolled.
const HEADER_MAX_SHARE = 0.2;
// W45: on a phone, how far down Main's Health card may start, as a share of the screen's
// height, so HP is read without scrolling past a heading block.
const HP_MAX_SHARE = 0.3;
// P13: the sticky bar on the Skills and Points steps may take this share of the screen's height.
const BAR_MAX_SHARE = 0.34;
const LONG = "a long name";
// P16: the Character tab's widths. `pinned` seeds the vitals panel pinned, which takes its columns back.
const LAYOUT_WIDTHS = [
  { name: "1600px", width: 1600, height: 1000 },
  { name: "1100px", width: 1100, height: 900 },
  { name: "1300px, vitals pinned", width: 1300, height: 900, pinned: true },
  { name: "390px", width: 390, height: 844 },
];
const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet, portrait", width: 768, height: 1024 },
  { name: "tablet, landscape", width: 1024, height: 768 },
  { name: "phone, touch", width: 390, height: 844, touch: true },
];

function lockedCharacter(archetype = "arcanist", milestonePoints = 0, held = [], skillTraits = false) {
  const { Engine, D } = loadEngine();
  const ch = Engine.newCharacter();
  ch.identity.name = "Phone Check";
  ch.identity.archetype = archetype;
  ch.progression.milestonePoints = milestonePoints;
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  // Long-Lived at rank 3 carries three Milestone tags: the card with the most.
  ch.advantages = held.map(id => ({ id, rank: 3, notes: "" }));
  // P19: the Skills with the most lines under their names. Basic Tech holds three Take X (Common Sense, Machindo,
  // Lightning Calculator), Awareness and Combat Sense a die-face mark each, Medical a kicker.
  if (skillTraits) {
    for (const id of ["basic-tech", "awareness", "combat-sense", "investigation", "medical", "stealth"]) ch.skills[id] = { rank: 3, ipe: 0 };
    ch.advantages.push({ id: "common-sense", rank: 2, notes: "", selections: { skill: ["basic-tech", "awareness"] } },
      { id: "machindo", rank: 1, notes: "" }, { id: "lightning-calculator", rank: 1, notes: "" }, { id: "field-medic", rank: 1, notes: "" },
      { id: "ghost-step", rank: 1, notes: "" }, { id: "night-vision", rank: 1, notes: "" });
    ch.disadvantages.push({ id: "distractable", rank: 1, notes: "" }, { id: "dwarf", rank: 1, notes: "" });
    // P21: Combat Sense with a Take X that names a kicker (Quick Study + Hyper Vigilance), and Nocturnal's line above the table.
    ch.advantages.push({ id: "hyper-vigilance", rank: 1, notes: "" });
    ch.progression.milestones.major.push({ id: "quick-study", date: "2026-10-21" });
    ch.trackers.aberrations.push({ id: "night-eyes", permanence: "permanent" }, { id: "nocturnal", permanence: "permanent" });
  }
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
const seed = JSON.stringify({ ch: lockedCharacter("arcanist", 0, ["long-lived"], true), section: "main" });
// A Major unlocks at 10 Milestone Points; the Professional's list has the longest prerequisites.
const majorSeed = JSON.stringify({ ch: lockedCharacter("professional", 10), section: "main" });
const MAJOR = "progression: a Major";

const browser = await launch();
const rows = [];
try {
  for (const w of WIDTHS) {
    const errors = [];
    const open = async s => {
      const c = await browser.newContext({ viewport: { width: w.width, height: w.height },
        hasTouch: !!w.touch, isMobile: !!w.touch });
      await c.addInitScript(s => { try { if (!localStorage.getItem("shadows.active.v1")) localStorage.setItem("shadows.active.v1", s); } catch (e) {} }, s);
      const p = await c.newPage();
      p.on("pageerror", e => errors.push(e.message));
      return [c, p];
    };
    let [ctx, page] = await open(seed);
    // `scope` limits the controls and text counted to what P13 added: an unfinished character's wizard has
    // older findings of its own (the issues link, the second-look callout), which are not this row's.
    const measure = async (screen, scope = null) => {
      const m = await page.evaluate(([floor, scope]) => {
        // Small controls and small text (W43). Collapsed sections are opened
        // so a palette isn't missed, then closed again.
        const shut = [...document.querySelectorAll("details:not([open])")];
        shut.forEach(d => { d.open = true; });
        const shown = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[hidden]") && (!scope || !!el.closest(scope)); };
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
        // W45: the vitals bar and a sheet's jump bar are one row each, and
        // Main's Health card starts near the top. Measured from the top.
        window.scrollTo(0, 0);
        const lines = sel => new Set([...document.querySelectorAll(sel)].filter(shown).map(e => Math.round(e.getBoundingClientRect().top))).size;
        const hp = document.querySelector("#main .cond-grid");
        const sticky = document.querySelector("#main .jumpbar.sticky");
        const bars = { vbar: lines("#main .vbar .vpill"), jump: lines("#main .jumpbar:not(.sticky) .jump"),
          hp: hp ? Math.round(hp.getBoundingClientRect().top) : null, sticky: sticky ? Math.round(sticky.getBoundingClientRect().height) : null };
        window.scrollTo(0, document.documentElement.scrollHeight);
        const h = document.querySelector("header.top").getBoundingClientRect();
        const de = document.documentElement;
        const brand = document.querySelector("header.top .brand");
        return { header: Math.round(h.bottom > 0 ? h.height : 0), overflow: de.scrollWidth - de.clientWidth,
          nameCut: brand.scrollWidth > brand.clientWidth, small: [...small], tiny: [...tiny], bars };
      }, [w.touch ? 44 : 24, scope]);
      const share = m.header / w.height;
      const b = m.bars, rowsOk = b.vbar <= 1 && b.jump <= 1 && (b.sticky == null || b.sticky <= w.height * BAR_MAX_SHARE), hpOk = b.hp == null || w.width >= 640 || b.hp <= w.height * HP_MAX_SHARE;
      rows.push({ width: w.name, screen, header: `${m.header}px (${Math.round(share * 100)}%)`,
        overflow: m.overflow ? `${m.overflow}px` : "none",
        name: screen === "home" ? "" : m.nameCut ? "cut" : "fits",
        targets: m.small.length ? m.small.join(", ") : "ok",
        text: m.tiny.length ? m.tiny.join(", ") : "ok",
        fold: [b.hp != null ? `HP ${b.hp}px (${Math.round(b.hp / w.height * 100)}%)` : "",
          b.vbar > 1 ? `vitals ${b.vbar} rows` : "", b.jump > 1 ? `jump ${b.jump} rows` : "", b.sticky != null ? `bar ${b.sticky}px (${Math.round(b.sticky / w.height * 100)}%)` : ""].filter(Boolean).join(", ") || "ok",
        ok: rowsOk && hpOk && share <= HEADER_MAX_SHARE && m.overflow <= 0 && (!mustFit(screen) || !m.nameCut) && !m.small.length && !m.tiny.length });
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
    // A Character tab card with three tags (P18 asked for it, and the fixture held no Advantage).
    await page.click('#topnav [data-sec="character"]');
    await measure("character: a card with three tags");
    // A long name is cut short, never allowed to push the page wider.
    await page.evaluate(n => { document.getElementById("brandctx").textContent = n; }, "Maximilian Aurelius Blackwood-Ravenscroft III");
    await measure(LONG);
    // P20b (Decision 236): Take a hit with the "Melee or Martial Arts" box a Scrapper and a Giant are asked, and a head hit that doubles.
    await page.evaluate(() => { S.ch.advantages.push({ id: "scrapper", rank: 1, notes: "" }); S.ch.disadvantages.push({ id: "giant", rank: 1, notes: "" }); update(); });
    await page.click('#topnav [data-sec="trackers"]');
    await page.click("[data-hitopen]");
    await page.waitForSelector('#modal [data-hit="melee"]');
    await page.selectOption('#modal [data-hit="location"]', "head");
    await page.fill('#modal [data-hit="damage"]', "6");
    await measure("take a hit: the Melee or Martial Arts box", "[data-hitpanel]");
    await page.keyboard.press("Escape");
    // The wizard, driven through the UI as a player would (the app has no test path in):
    // a new character, a power level, a name, and Continue to the Stats step.
    await page.goto(pathToFileURL(file).href);
    await page.click("#btn-new");
    await page.click("[data-pl]");
    await page.click("button:has-text(\"Continue\")");
    await page.fill('[data-id="name"]', "Mara Voss");   // short enough to fit beside both header buttons
    await page.click("button:has-text(\"Continue\")");
    await page.waitForSelector("[data-stat-floor]");
    await measure("wizard: stats");
    // P19 (Decision 234): Expert mode folds Stats too, and the toggle is in the header on every step.
    await page.click("header [data-expert]");
    await measure("wizard: stats, Expert mode", "header.top, .alloc-row .name, .skill-q");
    // P20a (Decision 235): a Dwarf past its cap says so on the Stats step ("Max 3 (Dwarf).") and on its card on the Points step.
    await page.evaluate(() => { S.ch.disadvantages.push({ id: "dwarf", rank: 1, notes: "" }); S.ch.stats.MOB.base = 5; update(); });
    await measure("wizard: stats, Dwarf held, Expert mode", "header.top, .alloc-row .name, .stat-max");
    await page.click("header [data-expert]");
    // P13: Expert mode on the three steps it changes. Steps are reached as the player would reach
    // them; the toggle is pressed once, in the header, and stays on across them.
    await page.evaluate(() => { S.maxReached = STEPS.length - 1; });
    const goStep = async id => { await page.evaluate(i => { S.step = i; update(); }, await page.evaluate(i => STEPS.findIndex(s => s.id === i), id)); };
    await goStep("archetype");
    await page.click('[data-arch="professional"]');
    await page.click('[data-spec="cleaner"]');
    await page.click("header [data-expert]");
    const NEW = "header.top, .jumpbar, .skill-q, .card-fold, .effects";
    await measure("wizard: archetype, Expert mode", NEW);
    await goStep("skills");
    await measure("wizard: skills, Expert mode", NEW);
    await goStep("character-points");
    await measure("wizard: points, Expert mode", NEW);
    await measure("wizard: points, a cap passed (Dwarf, MOB 5)", ".effects, .etag.over");
    await page.click("header [data-expert]");                 // off, so the next run starts as a new player
    await page.click("header [data-home]");
    await page.waitForSelector("#btn-new");
    await ctx.close();
    // Progression with a Major to pick: its list opens, prerequisite chips and all.
    [ctx, page] = await open(majorSeed);
    await page.goto(pathToFileURL(file).href);
    await page.click("[data-open]");
    await page.click('#topnav [data-sec="progression"]');
    await page.waitForSelector("[data-majorcard]");
    await measure(MAJOR);
    if (errors.length) rows.push({ width: w.name, screen: "(page errors)", header: errors.join("; "), overflow: "", ok: false });
    await ctx.close();
  }
  // P16 (Decision 246): the Character tab's layout. jsdom has no layout, so this is where it's held.
  for (const w of LAYOUT_WIDTHS) {
    for (const f of characterFixtures()) {
      const c = await browser.newContext({ viewport: { width: w.width, height: w.height } });
      await c.addInitScript(([ch, pinned]) => { try {
        localStorage.setItem("shadows.active.v1", ch);
        if (pinned) localStorage.setItem("shadows.ui.vitalsPinned", "pinned");
      } catch (e) {} }, [JSON.stringify({ ch: f.ch, section: "character" }), !!w.pinned]);
      const page = await c.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.goto(pathToFileURL(file).href);
      await page.click("[data-open]");
      await page.waitForSelector("#main .arch-flow");
      const m = await page.evaluate(() => {
        const T = 1, GAP = 20, bad = [];
        const near = (a, b) => Math.abs(a - b) <= T;
        const left = el => el.getBoundingClientRect().left;
        const parts = [...document.querySelectorAll("#main .arch-flow > .arch-part")];
        const x0 = left(parts[0].querySelector(".sect"));
        // (a) every section heading, and Advantages, starts at the first part's x.
        const heads = [...parts.map(p => p.querySelector(".sect")), document.querySelector("#main .trait-col .sect")];
        for (const h of heads) if (!near(left(h), x0)) bad.push(`(a) "${h.textContent.trim()}" starts at ${Math.round(left(h) - x0)}px, not 0`);
        let tracks4 = null;
        for (const p of parts) {
          const name = p.querySelector(".sect").textContent.trim();
          // The part's tracks, from the grid itself: their left edges, and the width of one.
          const sizes = getComputedStyle(p).gridTemplateColumns.split(" ").map(parseFloat);
          const lines = []; let at = left(p);
          for (const sz of sizes) { lines.push(at); at += sz + GAP; }
          if (!tracks4 && sizes.length === 4) tracks4 = lines;
          // (b) every card starts on a track line.
          for (const card of p.querySelectorAll(":scope > .pick, :scope > table.ref"))
            if (!lines.some(l => near(l, left(card)))) bad.push(`(b) a card in ${name} starts off the track lines (${Math.round(left(card) - x0)}px)`);
          // (f) cards on one row are one height (Ken's layout pass: even rows).
          const rows = new Map();
          for (const card of p.querySelectorAll(":scope > .pick")) { const t = Math.round(card.getBoundingClientRect().top); rows.set(t, [...(rows.get(t) || []), card.getBoundingClientRect().height]); }
          for (const hs of rows.values()) if (Math.max(...hs) - Math.min(...hs) > T) bad.push(`(f) a row in ${name} has cards of ${Math.round(Math.min(...hs))} to ${Math.round(Math.max(...hs))}px`);
          // (c) a lone card is two tracks and a gap wide, or the whole row at one track.
          for (const card of p.querySelectorAll(":scope > .solo")) {
            const want = sizes.length >= 2 ? 2 * sizes[0] + GAP : sizes[0];
            if (!near(card.getBoundingClientRect().width, want)) bad.push(`(c) the lone card in ${name} is ${Math.round(card.getBoundingClientRect().width)}px, not ${Math.round(want)}`);
          }
        }
        // (d) at four tracks, the core mechanic and Disadvantages start on the third line.
        const core = document.querySelector("#main .arch-top-part:nth-child(2) .sect");
        const dis = document.querySelectorAll("#main .trait-col .sect")[1];
        if (tracks4 && getComputedStyle(document.querySelector("#main .trait-cols")).gridTemplateColumns.split(" ").length === 2)
          for (const [what, el] of [["the core mechanic", core], ["Disadvantages", dis]])
            if (el && !near(left(el), tracks4[2])) bad.push(`(d) ${what} starts at ${Math.round(left(el))}px, the third line is ${Math.round(tracks4[2])}px`);
        // (b, continued) beside each other, Advantages' and Disadvantages' cards are the same four tracks.
        if (tracks4 && getComputedStyle(document.querySelector("#main .trait-cols")).gridTemplateColumns.split(" ").length === 2)
          for (const card of document.querySelectorAll("#main .trait-grid > .pick"))
            if (!tracks4.some(l => near(l, left(card)))) bad.push(`(b) a trait card starts off the track lines (${Math.round(left(card) - x0)}px)`);
        // (e) no sideways scroll.
        const de = document.documentElement;
        if (de.scrollWidth - de.clientWidth > 0) bad.push(`(e) the page scrolls sideways by ${de.scrollWidth - de.clientWidth}px`);
        return bad;
      });
      rows.push({ width: w.name, screen: `layout: ${f.name}`, layout: m.length ? m.join("; ") : "ok",
        ok: !m.length && !errors.length });
      if (errors.length) rows.push({ width: w.name, screen: "(page errors)", layout: errors.join("; "), ok: false });
      await c.close();
    }
  }
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(`Header budget: ${HEADER_MAX_SHARE * 100}% of the screen's height, pinned after scrolling. Overflow budget: none. On the sheet, the name should fit.`);
console.log(`Controls: 24px or more, 44px on the touch phone. Text: 11px or more.`);
console.log(`Fold: on a phone, Main's Health card within ${HP_MAX_SHARE * 100}% of the screen's height; the vitals bar and a sheet's jump bar one row.\n`);
console.table(rows.map(r => ({ ...r, ok: r.ok ? "ok" : "OVER" })));
const bad = rows.filter(r => !r.ok);
const byWidth = [...new Set(bad.map(r => r.width))];
console.log(bad.length ? `\nOver budget at: ${byWidth.join(", ")}.` : "\nEvery width fits.");
process.exit(bad.length ? 1 : 0);
