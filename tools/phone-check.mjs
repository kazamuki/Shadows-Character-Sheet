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
import { syntheticPack } from "../tests/packfixture.mjs";

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
  ch.meta.id = "TAG-AAAA-BBBB-CCCC";   // drawn at random otherwise, and it wraps differently from one run to the next
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

// S18 (L9): the frame fixture. The boxes of the header, the rail, `main`, the vitals column and `main`'s direct
// children on Home, every wizard step and every sheet tab, recorded before the table got its own frame. A table's
// rules are scoped to `.table-mode`, so any difference here is a rule that reached a screen it shouldn't.
// `npm run phone-check -- --record-fixture` rewrites it; do that only when a screen is meant to move.
const FIXTURE_FILE = new URL("./frame-fixture.json", import.meta.url);
const FIXTURE_SIZES = [
  { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1300, height: 900 }, { width: 1980, height: 1080 },
];
const args = process.argv.slice(2);
const RECORD = args.includes("--record-fixture");
const builtFile = args.find(a => !a.startsWith("--"));

const frameBoxes = () => {
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(n => Math.round(n * 10) / 10); };
  window.scrollTo(0, 0);
  const out = { header: r(document.querySelector("header.top")), rail: r(document.querySelector("nav.ledger")),
    main: r(document.querySelector("main")), vitals: r(document.querySelector("aside.vitals")), children: [] };
  // Every box under `main`, folded to a hash: a card, a field or a line of prose that moves changes it, which the
  // direct children alone would not show (a list's cards sit inside one section whose box stays the same).
  let h = 2166136261, n = 0;
  for (const el of document.querySelectorAll("main *")) {
    const b = el.getBoundingClientRect();
    if (!b.width && !b.height) continue;
    const t = `${el.tagName}.${el.getAttribute("class") || ""}|${Math.round(b.x * 10)}|${Math.round(b.y * 10)}|${Math.round(b.width * 10)}|${Math.round(b.height * 10)}`;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    n++;
  }
  out.deep = `${n} boxes, ${h.toString(16)}`;
  [...document.querySelector("main").children].forEach((el, i) => out.children.push(`${i} ${el.tagName.toLowerCase()}${el.classList.length ? "." + [...el.classList].join(".") : ""} ${r(el).join(",")}`));
  return out;
};

// A transition caught half-way (Main's Health bar) would move a box between two runs of the same code.
const STILL = () => document.addEventListener("DOMContentLoaded", () => {
  const st = document.createElement("style"); st.textContent = "*,*::before,*::after{transition:none!important;animation:none!important}"; document.head.appendChild(st);
});

// Let a press settle (fonts, a redraw's second frame) before the boxes are read, so two runs of the same code agree.
const snap = async page => { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await page.waitForTimeout(120); return page.evaluate(frameBoxes); };

async function recordFrames(browser, file, seed) {
  const frames = {};
  for (const z of FIXTURE_SIZES) {
    for (const pinned of [false, true]) {
      if (pinned && z.width < 1300) continue;
      const c = await browser.newContext({ viewport: { width: z.width, height: z.height } });
      await c.addInitScript(STILL);
      await c.addInitScript(([s, pin]) => { try {
        if (!localStorage.getItem("shadows.active.v1")) localStorage.setItem("shadows.active.v1", s);
        if (pin) localStorage.setItem("shadows.ui.vitalsPinned", "pinned");
      } catch (e) {} }, [seed, pinned]);
      const page = await c.newPage();
      const at = name => `${name} @${z.width}${pinned ? " pinned" : ""}`;
      await page.goto(pathToFileURL(file).href);
      if (!pinned) frames[at("home")] = await snap(page);
      await page.click("[data-open]");
      await page.waitForSelector("#topnav [data-sec]");
      const tabs = await page.$$eval("#topnav [data-sec]", bs => bs.map(b => b.dataset.sec));
      for (const sec of tabs) {
        await page.click(`#topnav [data-sec="${sec}"]`);
        frames[at(`sheet: ${sec}`)] = await snap(page);
      }
      await c.close();
    }
    // The wizard: a new character driven as a player would, then every step, then Expert's four.
    const c = await browser.newContext({ viewport: { width: z.width, height: z.height } });
      await c.addInitScript(STILL);
    const page = await c.newPage();
    await page.goto(pathToFileURL(file).href);
    await page.click("#btn-new");
    await page.click("[data-pl]");
    await page.click('button:has-text("Continue")');
    await page.fill('[data-id="name"]', "Mara Voss");
    await page.click('button:has-text("Continue")');
    await page.waitForSelector("[data-stat-floor]");
    // The tag is drawn at random and wraps differently at a phone's width, so every run pins the same one.
    await page.evaluate(() => { S.maxReached = STEPS.length - 1; S.ch.meta.id = "TAG-AAAA-BBBB-CCCC"; });
    const ids = await page.evaluate(() => STEPS.map(s => s.id));
    const goStep = id => page.evaluate(i => { S.step = STEPS.findIndex(s => s.id === i); update(); }, id);
    const expertSteps = await page.evaluate(() => EXPERT_STEPS);
    for (const id of ids) {
      await goStep(id);
      if (id === "archetype") { await page.click('[data-arch="professional"]'); await page.click('[data-spec="cleaner"]'); }
      frames[`wizard: ${id} @${z.width}`] = await snap(page);
    }
    await goStep("stats");
    await page.click("header [data-expert]");
    for (const id of expertSteps) { await goStep(id); frames[`wizard: ${id}, Expert @${z.width}`] = await snap(page); }
    await c.close();
  }
  return frames;
}

// S18: a GM table's screens. A table is switched off for players (Decision 173), so `shadows.feature.gm` is the feature's own
// switch. The table is the sample, Dead Air, with a player and a seat (Dez) added and a pack in the Threats tab; the
// encounter is made in the page, with Dez in it and the Hit panel open on his row, as S3d left it. Each screen is measured
// at four widths: `main`'s box, anything past the right edge outside a sideways scroller, the widest field, textarea,
// prose block and card, the cards a row, the encounter's rows, and the header and the bar together.
const TABLE_WIDTHS = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1300, height: 900 }, { width: 1980, height: 1080 }, { width: 390, height: 844, touch: true }];
const FIELD_MAX = 36 * 16, AREA_MAX = 48 * 16, CARD_MIN = 20 * 16, CARD_MAX = 36 * 16, ENC_MAX = 64 * 16, BAR_MAX = 48;
const CARDS_A_ROW = { 390: 1, 768: 2, 1300: 3, 1980: 4 };
const DEZ_TAG = "TAG-EEEE-EEEE-EEEE";

function tableSeed() {
  const { Engine } = loadEngine();
  const t = Engine.migrateTable(JSON.parse(readFileSync(new URL("../samples/dead-air.shadows-table.json", import.meta.url), "utf8")));
  const ch = lockedCharacter("professional");
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.identity.name = "Dez"; ch.meta.id = DEZ_TAG; ch.meta.updated = "2026-10-02T10:00:00.000Z";
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  if (!Engine.importSeat(t, pid, ch).ok) throw new Error("the seed seat didn't import");
  t.audit = [];
  const pack = syntheticPack();
  return JSON.parse(JSON.stringify({ char: ch, table: { table: t, section: "sessions", changed: "2026-10-05T10:00:00.000Z", exported: null },
    packKey: "shadows.pack.v1." + pack.meta.id, pack: { pack: Engine.migratePack(pack), imported: "2026-10-05T10:00:00.000Z" } }));
}

const tableMeasure = () => {
  const de = document.documentElement, main = document.querySelector("main"), mb = main.getBoundingClientRect();
  // 75ch is the width of 75 zeros in the block's own font, so it is measured inside each block.
  const chOf = el => { const pr = document.createElement("span"); pr.style.cssText = "display:block;width:75ch;height:0;position:absolute;visibility:hidden"; el.appendChild(pr);
    const w = pr.getBoundingClientRect().width; pr.remove(); return w; };
  const inScroller = el => { for (let e = el.parentElement; e && e !== main; e = e.parentElement) { const o = getComputedStyle(e).overflowX; if (o === "auto" || o === "scroll") return true; } return false; };
  const box = el => el.getBoundingClientRect();
  const shown = el => { const r = box(el); return r.width > 0 && r.height > 0; };
  let over = 0;
  for (const el of main.querySelectorAll("*")) if (shown(el) && box(el).right > de.clientWidth + 0.5 && !inScroller(el)) over++;
  const widest = els => Math.round(Math.max(0, ...[...els].filter(shown).map(e => box(e).width)));
  const fields = main.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=hidden]):not([type=number]), select");
  const prose = [...main.querySelectorAll("p, dd, .step-note")].filter(e => !e.closest(".ro-sheet, .enc-row, .tbl-bar, .enc-bar"));
  const lis = [...main.querySelectorAll(".roster-list > li")].filter(shown);
  // Cards a row: the most on one row of any one list (Encounters draws two lists, a short one first).
  const perRow = Math.max(0, ...[...main.querySelectorAll(".roster-list")].map(ul => { const k = [...ul.children].filter(shown); return k.length ? k.filter(l => Math.round(box(l).top) === Math.round(box(k[0]).top)).length : 0; }));
  const rows = [...main.querySelectorAll(".enc-rows > li")].filter(shown);
  const bar = main.querySelector(".tbl-bar, .enc-bar");
  const hdr = document.querySelector("header.top");
  const on = sel => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== "none"; };
  const worst = prose.filter(shown).map(e => ({ w: box(e).width, ch: chOf(e) })).sort((a, b) => b.w / b.ch - a.w / a.ch)[0] || { w: 0, ch: 0 };
  return { x: Math.round(mb.x), w: Math.round(mb.width), over, ch75: Math.round(worst.ch),
    field: widest(fields), area: widest(main.querySelectorAll("textarea")), prose: Math.round(worst.w),
    cards: lis.length, perRow,
    cardMin: lis.length ? Math.round(Math.min(...lis.map(l => box(l).width))) : 0, cardMax: widest(lis),
    enc: widest(rows), encCols: new Set(rows.map(r => Math.round(box(r).left))).size,
    barCut: !!bar && bar.scrollWidth > bar.clientWidth + 1 && !bar.classList.contains("more-r"),
    bar: bar ? Math.round(box(bar).height) : 0, barKind: bar ? bar.className.split(" ")[0] : "",
    header: Math.round(hdr.getBoundingClientRect().height), scrollW: de.scrollWidth - de.clientWidth,
    rail: on("nav.ledger"), vitals: on("aside.vitals") };
};

async function tableScreens(browser, file, rows, numbers) {
  const seed = tableSeed();
  for (const z of TABLE_WIDTHS) {
    const c = await browser.newContext({ viewport: { width: z.width, height: z.height }, hasTouch: !!z.touch, isMobile: !!z.touch });
    await c.addInitScript(([s, pk, pack]) => { try {
      localStorage.setItem("shadows.feature.gm", "on");
      if (!localStorage.getItem("shadows.table.v1." + s.table.meta.id)) {
        localStorage.setItem("shadows.table.v1." + s.table.meta.id, JSON.stringify(s));
        localStorage.setItem(pk, JSON.stringify(pack));
      }
    } catch (e) {} }, [seed.table, seed.packKey, seed.pack]);
    const page = await c.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(pathToFileURL(file).href);
    await page.click("[data-topen]");
    const screens = [];
    const walk = async (name, act, opts = {}) => {
      try {
        await act();
        screens.push({ name, m: await page.evaluate(tableMeasure), ...opts });
      } catch (e) { rows.push({ width: `table ${z.width}${z.touch ? " touch" : ""}`, screen: name, layout: `could not reach it: ${e.message.split("\n")[0]}`, ok: false }); }
    };
    const tab = id => () => page.click(`[data-tsec="${id}"]`);
    const click = sel => () => page.click(sel);
    const then = (...fs) => async () => { for (const f of fs) await f(); };
    await walk("sessions", tab("sessions"), { list: true });
    await walk("a session", click("[data-sopen]"), { bar: true });
    // The first sessions are closed already; the close-out's page is a session that isn't.
    await walk("the close-out", async () => {
      await page.click('[data-tsec="sessions"]');
      const n = await page.locator("[data-sopen]").count();
      for (let i = 0; i < n; i++) {
        await page.locator("[data-sopen]").nth(i).click();
        if (await page.locator("[data-co-open]").count()) break;
        await page.click("[data-sback]");
      }
      await page.click("[data-co-open]");
    }, { bar: true });
    await walk("players", tab("players"));
    await walk("the read-only sheet", click("[data-seat]"), { bar: true });
    await walk("a seat's page", click("[data-roseat]"), { bar: true });
    await walk("cast", tab("cast"), { list: true });
    await walk("a member", click("[data-copen]"), { bar: true });
    await walk("city", tab("city"), { list: true });
    await walk("a place", click("[data-popen]"), { bar: true });
    await walk("a faction", then(tab("city"), click('[data-cityview="factions"]'), click("[data-fcardopen]")), { bar: true });
    await walk("threats", tab("threats"), { list: true });
    await walk("a threat", click("[data-tentry]"), { bar: true });
    await walk("a threat group", then(tab("threats"), click('[data-tview="group"]'), click("[data-tgroup]")), { bar: true });
    await walk("encounters", tab("encounters"), { list: true });
    await walk("an encounter with the Hit panel open", then(
      () => page.fill("[data-enc-name]", "Docks"), click("[data-enc-new]"),
      () => page.fill("[data-enc-pcname]", "Dez"), click("[data-enc-addpc]"), click("[data-ehit]")), { bar: true, enc: true });
    await walk("reference", tab("reference"));
    await walk("notes", tab("notes"));
    for (const s of screens) {
      const m = s.m, bad = [];
      if (m.rail || m.vitals) bad.push("a rail or vitals column is drawn");
      if (m.over) bad.push(`${m.over} elements past the right edge`);
      if (m.scrollW > 0) bad.push(`the page scrolls sideways by ${m.scrollW}px`);
      if (m.field > FIELD_MAX + 0.5) bad.push(`a field ${m.field}px`);
      if (m.area > AREA_MAX + 0.5) bad.push(`a textarea ${m.area}px`);
      if (m.prose > m.ch75 + 1) bad.push(`prose ${m.prose}px, 75ch is ${m.ch75}px`);
      if (s.list && m.cards >= CARDS_A_ROW[z.width] && m.perRow < CARDS_A_ROW[z.width]) bad.push(`${m.perRow} cards a row, ${CARDS_A_ROW[z.width]} wanted`);
      if (m.cards && z.width > 390 && (m.cardMin < CARD_MIN - 1 || m.cardMax > CARD_MAX + 1)) bad.push(`cards ${m.cardMin}-${m.cardMax}px`);
      if (s.enc && (m.enc > ENC_MAX + 1 || m.encCols !== 1)) bad.push(`rows ${m.enc}px in ${m.encCols} columns`);
      if (s.bar && !m.bar) bad.push("no bar");
      if (m.barCut) bad.push("the bar scrolls sideways with no fade (no more-r)");
      if (m.barKind === "tbl-bar" && m.bar > (z.touch ? 56 : BAR_MAX)) bad.push(`the bar is ${m.bar}px`);
      if (m.bar && z.width <= 390 && (m.header + m.bar) / z.height > HEADER_MAX_SHARE) bad.push(`header + bar ${Math.round((m.header + m.bar) / z.height * 100)}%`);
      numbers.push({ w: z.width + (z.touch ? " touch" : ""), screen: s.name, main: `${m.x}+${m.w}`, over: m.over, field: m.field, area: m.area, prose: `${m.prose}/${m.ch75}`,
        cards: m.cards ? `${m.perRow}/row ${m.cardMin}-${m.cardMax}` : "", enc: m.enc ? `${m.enc}px` : "", bar: m.bar ? `${m.barKind} ${m.bar}px` : "", header: m.header });
      rows.push({ width: `table ${z.width}${z.touch ? " touch" : ""}`, screen: s.name, layout: bad.length ? bad.join("; ") : "ok", ok: !bad.length });
    }
    if (errors.length) rows.push({ width: `table ${z.width}`, screen: "(page errors)", layout: errors.join("; "), ok: false });
    await c.close();
  }
}

// L2: the read-only sheet lays out as the player's own sheet of the same file. L8: from 1280px a member's stat block is a
// panel on the right that stays put under the bar; below that it is the last block of the page.
async function tableExtras(browser, file, rows, numbers) {
  const seed = tableSeed();
  const cols = () => (document.querySelector(".main-grid") ? getComputedStyle(document.querySelector(".main-grid")).gridTemplateColumns.split(" ").map(parseFloat) : []);
  // The widest field, textarea and prose block: a measure written into the read-only sheet would cap one of them.
  // The read-only sheet sits in .ro-sheet under the table's own bar and title; the player's sheet is all of main.
  const widest = root => {
    const w = sel => Math.round(Math.max(0, ...[...document.querySelectorAll(sel.split(",").map(x => root + " " + x.trim()).join(","))].filter(e => e.getBoundingClientRect().height > 0).map(e => e.getBoundingClientRect().width)));
    return [w("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select"), w("textarea"), w("p, dd")];
  };
  const TABS = ["main", "skills", "character", "trackers", "progression", "sessions", "loadout", "notes"];
  const ctx = async (z, init) => { const c = await browser.newContext({ viewport: { width: z.width, height: z.height } }); await c.addInitScript(init.fn, init.arg); return c; };
  for (const z of TABLE_WIDTHS.filter(z => z.width >= 1300)) {
    const tableInit = { fn: ([s, pk, pack]) => { try { localStorage.setItem("shadows.feature.gm", "on");
      localStorage.setItem("shadows.table.v1." + s.table.meta.id, JSON.stringify(s)); localStorage.setItem(pk, JSON.stringify(pack)); } catch (e) {} }, arg: [seed.table, seed.packKey, seed.pack] };
    const t = await ctx(z, tableInit), tp = await t.newPage();
    await tp.goto(pathToFileURL(file).href); await tp.click("[data-topen]"); await tp.click('[data-tsec="players"]'); await tp.click("[data-seat]");
    await tp.waitForSelector(".main-grid");
    const ro = await tp.evaluate(cols);
    const roWide = {};
    for (const id of TABS) { await tp.click(`[data-rotab="${id}"]`); roWide[id] = await tp.evaluate(widest, ".ro-sheet"); }
    const seedChar = JSON.stringify({ ch: seed.char, section: "main" });
    await t.close();
    // The player's own sheet of the same file: the copy the seat holds, opened from Home.
    const own = await ctx(z, { fn: s => { try { localStorage.setItem("shadows.active.v1", s); } catch (e) {} }, arg: seedChar });
    const op = await own.newPage();
    await op.goto(pathToFileURL(file).href); await op.click("[data-open]"); await op.waitForSelector(".main-grid");
    const mine = await op.evaluate(cols);
    const ownWide = {};
    for (const id of TABS) { await op.click(`#topnav [data-sec="${id}"]`); ownWide[id] = await op.evaluate(widest, "main"); }
    const wideDiff = TABS.filter(id => roWide[id].some((x, i) => Math.abs(x - ownWide[id][i]) > 1));
    await own.close();
    const same = ro.length > 0 && ro.length === mine.length && ro.every((w, i) => Math.abs(w - mine[i]) <= 1) && !wideDiff.length;
    rows.push({ width: `table ${z.width}`, screen: "the read-only sheet's Main against the player's own", layout: same ? "ok" : `read-only ${ro.join("+")}, own ${mine.join("+")}${wideDiff.map(id => `; ${id}: widest field, textarea, prose ${roWide[id].join("/")} against ${ownWide[id].join("/")}`).join("")}`, ok: same });
    numbers.push({ w: z.width, screen: "L2 .main-grid columns", main: `read-only ${ro.map(Math.round).join("+")}`, over: "", field: "", area: "", prose: "", cards: `own ${mine.map(Math.round).join("+")}`, enc: "", bar: "", header: "" });
  }
  for (const z of [{ width: 1279, height: 900 }, { width: 1300, height: 900 }, { width: 1980, height: 1080 }]) {
    const c = await browser.newContext({ viewport: { width: z.width, height: z.height } });
    await c.addInitScript(([s, pk, pack]) => { try { localStorage.setItem("shadows.feature.gm", "on");
      localStorage.setItem("shadows.table.v1." + s.table.meta.id, JSON.stringify(s)); localStorage.setItem(pk, JSON.stringify(pack)); } catch (e) {} }, [seed.table, seed.packKey, seed.pack]);
    const page = await c.newPage();
    await page.goto(pathToFileURL(file).href); await page.click("[data-topen]"); await page.click('[data-tsec="cast"]'); await page.click("[data-copen]");
    const at = () => page.evaluate(() => { const pn = document.querySelector(".cast-panel"), bar = document.querySelector(".tbl-bar"), r = pn.getBoundingClientRect(), b = bar.getBoundingClientRect(), t = document.querySelector("[data-ctitle]").getBoundingClientRect();
      return { x: Math.round(r.x), w: Math.round(r.width), top: Math.round(r.top), barBottom: Math.round(b.bottom), titleTop: Math.round(t.top), statusUnderName: document.querySelector("[data-ctitle]").nextElementSibling.matches(".cast-status") }; });
    const before = await at();
    await page.evaluate(() => window.scrollTo(0, 1000));
    const after = await at();
    const docked = z.width >= 1280;
    const bad = [];
    if (!before.statusUnderName) bad.push("the status isn't under the name");
    if (docked) {
      if (before.w < 352 || before.w > 448) bad.push(`the panel is ${before.w}px`);
      if (before.x < z.width / 2) bad.push(`the panel is at x ${before.x}, not on the right`);
      if (after.top < after.barBottom - 1 || after.top > after.barBottom + 60) bad.push(`after 1000px it is at y ${after.top}, the bar ends at ${after.barBottom}`);
    } else if (before.x > 40 || after.top >= 0 && after.top < after.barBottom) bad.push(`below 1280px it should sit at the bottom of the page, not beside it (x ${before.x})`);
    rows.push({ width: `table ${z.width}`, screen: "a member's stat block panel (L8)", layout: bad.length ? bad.join("; ") : "ok", ok: !bad.length });
    numbers.push({ w: z.width, screen: "L8 stat block", main: `x ${before.x}, ${before.w}px wide`, over: "", field: "", area: "", prose: "", cards: `top ${before.top} -> ${after.top} after 1000px, bar ends ${after.barBottom}`, enc: "", bar: "", header: "" });
    await c.close();
  }
}

// S19 (Decision 259): the keys, in a real browser. jsdom inserts no text on a keydown and has no scroll position, so these
// three are here and not in npm test. B1: F and J open their boxes empty (no typed letter), and still type in a field.
// B2: closing a box a key opened doesn't move the page, at 844x390 where the header un-sticks and at 1300x900. B3: Ctrl+F
// opens nothing of ours. Every number goes in keyNumbers, for the PR.
const keyNumbers = [];
async function tableKeys(browser, file, rows) {
  const seed = tableSeed();
  const init = ([s, pk, pack]) => { try { localStorage.setItem("shadows.feature.gm", "on");
    localStorage.setItem("shadows.table.v1." + s.table.meta.id, JSON.stringify(s)); localStorage.setItem(pk, JSON.stringify(pack)); } catch (e) {} };
  const open = async (z, tab = "cast") => {
    const c = await browser.newContext({ viewport: { width: z.width, height: z.height } });
    await c.addInitScript(init, [seed.table, seed.packKey, seed.pack]);
    const p = await c.newPage(); const errors = []; p.on("pageerror", e => errors.push(e.message));
    await p.goto(pathToFileURL(file).href); await p.click("[data-topen]"); await p.click(`[data-tsec="${tab}"]`);
    return [c, p, errors];
  };
  const blur = p => p.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); window.scrollTo(0, 0); });
  const modal = p => p.evaluate(() => !!document.querySelector("dialog.modal[open]"));
  const row = (screen, bad, said) => rows.push({ width: "table keys", screen, layout: bad.length ? bad.join("; ") : said, ok: !bad.length });
  // B1
  {
    const [c, p, errors] = await open({ width: 1300, height: 900 }), bad = [];
    await blur(p); await p.keyboard.press("f");
    const f = await p.evaluate(() => ({ open: !!document.querySelector("dialog.modal[open]"), q: document.querySelector("[data-findq]")?.value, onq: document.activeElement === document.querySelector("[data-findq]") }));
    if (!f.open || f.q !== "" || !f.onq) bad.push(`F: open ${f.open}, field value ${JSON.stringify(f.q)}, focused ${f.onq}`);
    await p.keyboard.press("Escape"); await blur(p);
    await p.keyboard.press("j"); await p.keyboard.type("draft"); await p.keyboard.press("Escape"); await blur(p);
    await p.keyboard.press("j");
    const j = await p.evaluate(() => ({ open: !!document.querySelector("dialog.modal[open]"), v: document.querySelector("[data-jottext]")?.value, on: document.activeElement === document.querySelector("[data-jottext]") }));
    if (!j.open || j.v !== "draft" || !j.on) bad.push(`J: open ${j.open}, box value ${JSON.stringify(j.v)}, focused ${j.on}`);
    await p.keyboard.press("Escape");
    await p.focus("[data-cadd-name]"); await p.keyboard.press("f");
    const t = await p.evaluate(() => ({ open: !!document.querySelector("dialog.modal[open]"), v: document.querySelector("[data-cadd-name]").value }));
    if (t.open || t.v !== "f") bad.push(`typing: open ${t.open}, field value ${JSON.stringify(t.v)}`);
    if (errors.length) bad.push(errors.join("; "));
    row("B1: F, J, and typing a letter in a field", bad, `F field ${JSON.stringify(f.q)}; J box ${JSON.stringify(j.v)}; Name field after f ${JSON.stringify(t.v)}, no box`);
    await c.close();
  }
  // B2, at the short screen: the header un-sticks, so the Find button is at the top of the page.
  {
    const [c, p] = await open({ width: 844, height: 390 }), bad = [];
    await p.click("[data-copen]");
    await p.evaluate(() => { const pad = document.createElement("div"); pad.id = "keys-pad"; pad.style.height = "3000px"; document.querySelector("main").appendChild(pad); });
    await p.evaluate(() => window.scrollTo(0, 1500));
    await blur(p); await p.evaluate(() => window.scrollTo(0, 1500));
    const before = await p.evaluate(() => Math.round(window.scrollY));
    await p.keyboard.press("f"); await p.keyboard.press("Escape");
    const after = await p.evaluate(() => ({ y: Math.round(window.scrollY), on: document.activeElement === document.querySelector("[data-tfind]") }));
    if (Math.abs(after.y - before) > 1 || !after.on) bad.push(`844x390: scrollY ${before} -> ${after.y}, focus on Find ${after.on}`);
    row("B2: Esc after F, at 844x390", bad, `scrollY ${before} -> ${after.y}, focus on Find`);
    keyNumbers.push({ check: "B2 844x390", before, after: after.y, focus: after.on ? "[data-tfind]" : "elsewhere" });
    await c.close();
  }
  // B2 at 1300x900: a card button in view.
  {
    const [c, p] = await open({ width: 1300, height: 900 }), bad = [];
    await p.evaluate(() => { const pad = document.createElement("div"); pad.style.height = "3000px"; document.querySelector("main").appendChild(pad); });
    await p.evaluate(() => { const b = document.querySelector("[data-copen]"); b.focus({ preventScroll: true }); window.scrollTo(0, 120); });
    const before = await p.evaluate(() => Math.round(window.scrollY));
    await p.keyboard.press("f"); await p.keyboard.press("Escape");
    const after = await p.evaluate(() => ({ y: Math.round(window.scrollY), on: document.activeElement === document.querySelector("[data-copen]") }));
    if (Math.abs(after.y - before) > 1 || !after.on) bad.push(`1300x900: scrollY ${before} -> ${after.y}, focus back on the card ${after.on}`);
    row("B2: Esc after F from a card, at 1300x900", bad, `scrollY ${before} -> ${after.y}, focus on the card`);
    keyNumbers.push({ check: "B2 1300x900", before, after: after.y, focus: after.on ? "[data-copen]" : "elsewhere" });
    await c.close();
  }
  // B4: ⋮ → Keys, then Esc: the clicked menu item is hidden by then, so focus must come back to ⋮.
  {
    const [c, p] = await open({ width: 1300, height: 900 }), bad = [];
    for (const [item, name] of [["[data-tkeys]", "Keys"], ["[data-tactivity]", "Activity"], ["#hdrmenu [data-whatsnew]", "What's new"]]) {
      await p.click("[data-menu-toggle]"); await p.click(item); await p.keyboard.press("Escape");
      const on = await p.evaluate(() => !!document.activeElement.hasAttribute && document.activeElement.hasAttribute("data-menu-toggle"));
      if (!on) bad.push(`focus isn't on ⋮ after closing ${name}`);
    }
    row("B4: Esc after ⋮ → Keys, Activity and What's new lands on ⋮", bad, "focus on ⋮ each time");
    await c.close();
  }
  // B3
  {
    const [c, p] = await open({ width: 1300, height: 900 }), bad = [];
    await blur(p);
    for (const k of ["Control+f", "Control+j", "Alt+f"]) { await p.keyboard.press(k); if (await modal(p)) bad.push(k + " opened a box"); }
    row("B3: Ctrl+F, Ctrl+J and Alt+F open nothing of ours", bad, "no box");
    await c.close();
  }
}

const dir = mkdtempSync(join(tmpdir(), "shadows-phone-"));
const file = join(dir, "shadows-character-sheet.html");
writeFileSync(file, builtFile ? readFileSync(builtFile, "utf8") : buildHtml());
const seed = JSON.stringify({ ch: lockedCharacter("arcanist", 0, ["long-lived"], true), section: "main" });
// A Major unlocks at 10 Milestone Points; the Professional's list has the longest prerequisites.
const majorSeed = JSON.stringify({ ch: lockedCharacter("professional", 10), section: "main" });
const MAJOR = "progression: a Major";

const browser = await launch();
const rows = [], tableNumbers = [];
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
  // S18: a table's screens, at four widths.
  if (!RECORD) { await tableScreens(browser, file, rows, tableNumbers); await tableExtras(browser, file, rows, tableNumbers); await tableKeys(browser, file, rows); }
  // S18 (L9): the frame fixture, recorded or diffed.
  const frames = await recordFrames(browser, file, seed);
  if (RECORD) {
    writeFileSync(FIXTURE_FILE, JSON.stringify(frames, null, 1) + "\n");
    console.log(`Recorded ${Object.keys(frames).length} frames to tools/frame-fixture.json.`);
  } else {
    const was = JSON.parse(readFileSync(FIXTURE_FILE, "utf8"));
    const diffs = [];
    for (const k of new Set([...Object.keys(was), ...Object.keys(frames)])) {
      const a = JSON.stringify(was[k] ?? null), b = JSON.stringify(frames[k] ?? null);
      if (a !== b) diffs.push(k);
    }
    rows.push({ width: "all", screen: `frame fixture (${Object.keys(was).length} frames)`,
      layout: diffs.length ? `${diffs.length} differ: ${diffs.slice(0, 8).join("; ")}` : "no difference", ok: !diffs.length });
  }
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(`Header budget: ${HEADER_MAX_SHARE * 100}% of the screen's height, pinned after scrolling. Overflow budget: none. On the sheet, the name should fit.`);
console.log(`Controls: 24px or more, 44px on the touch phone. Text: 11px or more.`);
console.log(`Fold: on a phone, Main's Health card within ${HP_MAX_SHARE * 100}% of the screen's height; the vitals bar and a sheet's jump bar one row.\n`);
console.table(rows.map(r => ({ ...r, ok: r.ok ? "ok" : "OVER" })));
if (tableNumbers.length) {
  console.log("\nA table's screens (main as x+width; fields and textareas the widest px; prose the widest px against 75ch; cards a row and their widths):");
  console.table(tableNumbers);
}
if (keyNumbers.length) { console.log("\nThe keys (Decision 259), scrollY before and after Esc:"); console.table(keyNumbers); }
const bad = rows.filter(r => !r.ok);
for (const r of bad.filter(r => String(r.width).startsWith("table "))) console.log(`${r.width} | ${r.screen} | ${r.layout}`);
const byWidth = [...new Set(bad.map(r => r.width))];
console.log(bad.length ? `\nOver budget at: ${byWidth.join(", ")}.` : "\nEvery width fits.");
process.exit(bad.length ? 1 : 0);
