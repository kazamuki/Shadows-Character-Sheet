// App chrome, the render router, export, and boot. Loaded last so every
// render and bind function from shared.js / wizard.js / sheet.js already
// exists as a global. Each screen's binders sit beside its renderers (A12).

// THE APP VERSION. Single source of truth — `package.json` mirrors it and
// `tests/docs.test.mjs` fails the build if the two drift, or if `STATE.md`
// disagrees. It renders in the footer so Ken and Claude can confirm they are
// looking at the same build before debugging anything.
//
// Bump it when a PLAYER can see a difference (Decision 75):
//   patch — a visible fix, nothing new
//   minor — a capability a player can use that wasn't there before
//   major — existing character files or the workflow break
// The other three versions have their own triggers; see CLAUDE.md.
const APP_VERSION = "0.36.0";

// ── Main render + events ─────────────────────────────────────────────
// Header chrome: brand context + the section tabs (which now live in the
// sticky header rather than inside the scrolling content).
function renderTopChrome(){
  const ctx=$("brandctx"), nav=$("topnav"), act=$("hdractions");
  // The window's title names the character on the sheet (W60). It's also the
  // file name a browser suggests when the sheet is printed to PDF.
  const name = S.ch && String(S.ch.identity.name||"").trim();
  document.title = S.screen==="sheet" ? `${name||"Unnamed"} — Shadows` : "Shadows — Character Intake";
  if (!ctx || !nav) return;
  if (S.screen==="sheet"){
    ctx.textContent = (S.ch && S.ch.identity.name) ? S.ch.identity.name : "Unnamed";
    nav.innerHTML = tabButtonsHtml();
    nav.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{
      S.section=normSection(b.dataset.sec); window.scrollTo(0,0); update();
    });
    showActiveTab(nav);
    if (act){
      act.innerHTML = `<button class="kebab" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Sheet actions">⋮</button>
        <div class="hdr-menu" id="hdrmenu" hidden>
          <button data-admin="1">${S.admin?"Exit admin mode":"Admin mode (free edit)"}</button>
          <button data-export="1">Export .shadows.json</button>
          <button data-print="1">Print sheet</button>
          <button data-whatsnew="1">What's new</button>
          <button data-home="1">Home</button>
        </div>`;
      const menu=$("hdrmenu"), kb=act.querySelector("[data-menu-toggle]");
      kb.onclick=(e)=>{ e.stopPropagation(); const willOpen=menu.hidden; menu.hidden=!willOpen; kb.setAttribute("aria-expanded", willOpen?"true":"false"); };
      act.querySelectorAll("[data-admin]").forEach(b=>b.onclick=()=>{
        menu.hidden=true; S.admin=!S.admin;
        if (S.admin) S.section="admin"; else if (S.section==="admin") S.section="main";
        window.scrollTo(0,0); update();
      });
      act.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>{ menu.hidden=true; exportChar(); });
      act.querySelectorAll("[data-print]").forEach(b=>b.onclick=()=>{ menu.hidden=true; printSheet(S.ch); });
      act.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>{ S={screen:"home",ch:null,step:0,maxReached:0,section:"main",admin:false}; renderHome(); });
    }
  } else if (S.screen==="wizard"){
    ctx.textContent = (S.ch && S.ch.identity.name) ? S.ch.identity.name : "Character Intake";
    nav.innerHTML = ""; if (act) act.innerHTML = "";
  } else {
    ctx.textContent = "Character Intake"; nav.innerHTML = ""; if (act) act.innerHTML = "";
  }
}

// The tab row scrolls sideways where it doesn't fit (Decision 140): keep the
// active tab in view, and fade whichever edge has more tabs past it.
function tabRowFades(nav){
  const max=nav.scrollWidth-nav.clientWidth;
  nav.classList.toggle("more-l", max>1 && nav.scrollLeft>1);
  nav.classList.toggle("more-r", max>1 && nav.scrollLeft<max-1);
}
function showActiveTab(nav){
  const a=nav.querySelector(".tab.active");
  if (a){
    const n=nav.getBoundingClientRect(), r=a.getBoundingClientRect(), room=48;
    if (r.left<n.left+room) nav.scrollLeft-=n.left+room-r.left;
    else if (r.right>n.right-room) nav.scrollLeft+=r.right-(n.right-room);
  }
  tabRowFades(nav);
}

// Pinned vitals (Decision 160): a preference of this browser, not of the
// character. The body class lays the panel beside the sheet, and the CSS only
// honours it from 1280px; narrower, the bar and the flyout come back.
const PIN_KEY = "shadows.ui.vitalsPinned", PIN_MEDIA = "(min-width:1280px)";
function vitalsPinned(){ try{ return localStorage.getItem(PIN_KEY)==="pinned"; }catch(e){ return false; } }
function pinRoom(){ return !!(window.matchMedia && window.matchMedia(PIN_MEDIA).matches); }
function setVitalsPinned(on){
  try{ localStorage.setItem(PIN_KEY, on?"pinned":"unpinned"); }catch(e){}
  closePopover(false); closeVitals(); renderDrawer();
}
function closeVitals(){
  const was=S.vitalsOpen;
  S.vitalsOpen=false;
  const dr=$("vdrawer"), sc=$("vscrim");
  if (dr){ dr.classList.remove("open"); dr.setAttribute("aria-hidden","true"); }
  if (sc) sc.classList.remove("open");
  // The wizard's flyout hands focus back to the Vitals pill that opened it.
  if (was && S.screen==="wizard"){ const t=document.querySelector("#vitals [data-wiz-vitals]"); if (t) t.focus(); }
}
function renderDrawer(){
  const dr=$("vdrawer"), sc=$("vscrim");
  if (!dr) return;
  const pinned = S.screen==="sheet" && !!S.ch && vitalsPinned();
  document.body.classList.toggle("vitals-pinned", pinned);
  if (S.screen==="sheet" && S.ch){
    // W47: Pin keeps its place as Unpin; an Unpin that closes the panel hands
    // focus to whatever opens it again.
    keepPlace(dr, ()=>{
      dr.innerHTML = vitalsPanelHtml(S.ch);
      dr.classList.toggle("open", !!S.vitalsOpen);
      dr.setAttribute("aria-hidden", S.vitalsOpen || (pinned && pinRoom()) ? "false" : "true");
    }, ["#main [data-vitals-toggle]", "#main [data-vpop]"]);
    if (sc) sc.classList.toggle("open", !!S.vitalsOpen);
    dr.querySelectorAll("[data-vitals-close]").forEach(b=>b.onclick=closeVitals);
    dr.querySelectorAll("[data-vitals-pin]").forEach(b=>b.onclick=()=>setVitalsPinned(!vitalsPinned()));
    dr.querySelectorAll("[data-vpop]").forEach(b=>b.onclick=()=>openVitalPopover(b.dataset.vpop, "#vdrawer"));
    if (sc) sc.onclick=closeVitals;
  } else if (S.screen==="wizard" && S.ch && S.vitalsOpen){
    // The wizard's rail, in the same flyout, from the narrow screen's
    // Vitals pill (Decision 161). No pin: wide enough to pin, the rail shows.
    dr.innerHTML = `<div class="dhead"><h2>Vitals</h2>
      <button class="dclose" data-vitals-close aria-label="Close vitals">✕</button></div>` + wizardRailHtml(S.ch);
    dr.classList.add("open"); dr.setAttribute("aria-hidden","false");
    if (sc){ sc.classList.add("open"); sc.onclick=closeVitals; }
    const x=dr.querySelector("[data-vitals-close]"); x.onclick=closeVitals; x.focus();
  } else {
    dr.innerHTML=""; closeVitals();
  }
}

// W47: a render that redraws the view it replaced keeps the keyboard's place
// (keepPlace, shared.js). A move to another tab, step or character doesn't:
// the step title, the lock's h1 and a modal set focus on purpose.
let lastView=null;
function sameView(){
  const v={ screen:S.screen, section:S.section, step:S.step, ch:S.ch, admin:S.admin };
  const same=!!lastView && Object.keys(v).every(k=>v[k]===lastView[k]);
  lastView=v;
  return same;
}
function renderMain(){
  const app=$("app");
  if (app) app.classList.toggle("sheet-mode", S.screen==="sheet");
  keepPlace(document.querySelector("header.top"), renderTopChrome, ["[data-menu-toggle]"]);
  const same=sameView(), main=$("main");
  const fill = html => same ? keepPlace(main, ()=>{ main.innerHTML=html; }) : (main.innerHTML=html);
  if (S.screen==="home") return renderHome();
  if (S.screen==="sheet"){
    S.section = normSection(S.section);
    landedNow = S.landed || null; S.landed = null;     // W15: flash once
    issuedNow = !!S.issued; S.issued = false;          // W46: the TAG prints once
    const body = SHEET_RENDER[S.section] ? SHEET_RENDER[S.section]() : SHEET_RENDER.main();
    // Main carries its own condition strip; every other tab gets the vitals bar.
    const bar = S.section==="main" ? "" : sheetVitalsBar(S.ch);
    const banner = S.admin ? adminBannerHtml() : "";
    fill(bar + banner + body);
    landedNow = null; issuedNow = false;
    renderDrawer();
    bindMain(); bindSheet();
    refreshPopover();
    return;
  }
  closeVitals(); closePopover(false);
  const st = STEPS[S.step];
  let h = stepHeader(st) + RENDER[st.id]();
  if (st.id!=="review") h += wizNav(st.id);
  fill(h);
  bindMain();
}

// Populates the print-only container (hidden on screen, styled by print.css)
// and hands off to the browser's native print dialog. `ch` is optional — pass
// none for the blank fillable template, reachable from Home with no character
// loaded at all.
function printSheet(ch){
  const el=$("printSheet"); if (!el) return;
  el.innerHTML = renderPrintView(ch);
  window.print();
}

function exportChar(){ return exportCharacter(S.ch); }
// Any character, not only the open one: the replace guard exports the saved
// character it's about to overwrite (B18).
function exportCharacter(ch){
  const c=Engine.buildExport(ch);
  markExported(intakeOf(c));
  const name=(c.identity.name||"character").trim().replace(/[^\w\- ]+/g,"").replace(/\s+/g,"_")||"character";
  const blob=new Blob([JSON.stringify(c,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=name+".shadows.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  return a.download;
}

// ── Light/dark theme toggle (Decision 90) ─────────────────────────────
// theme-init.js already applied any stored choice before first paint; this
// just wires the button. The button is static markup in index.html (never
// wiped by renderTopChrome's per-screen re-renders), so a one-time listener
// is enough — no re-wiring on route change, unlike every other header button.
const THEME_KEY = "shadows.theme";
function wireThemeToggle(){
  const btn=$("themeToggle"); if (!btn) return;
  const current=()=>document.documentElement.getAttribute("data-theme")==="light" ? "light" : "dark";
  const sync=()=>btn.setAttribute("aria-pressed", current()==="light" ? "true" : "false");
  sync();
  btn.onclick=()=>{
    const next = current()==="light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    sync();
  };
}

// ── What's new (Decision 123) ────────────────────────────────────────
// The release notes, generated from CHANGELOG.md into SHADOWS_CHANGELOG by
// tools/changelog.mjs. SEEN_KEY holds the last version this browser was shown;
// a returning player on a newer build gets one quiet line on the home screen,
// never a window they have to close. A browser with no mark but other
// shadows.* keys used the app before the mark existed, so it counts as
// returning. One with nothing at all is a first visit: it's marked and told
// nothing.
const SEEN_KEY = "shadows.seenVersion";
let whatsNewFrom = null;   // null: nothing new · "": new, from before the mark · "x.y.z": new since then
function cmpVer(a, b){
  const x=String(a).split(".").map(Number), y=String(b).split(".").map(Number);
  for (let i=0;i<3;i++){ const d=(x[i]||0)-(y[i]||0); if (d) return d<0?-1:1; }
  return 0;
}
function initWhatsNew(){
  try{
    const seen=localStorage.getItem(SEEN_KEY);
    if (seen){ if (cmpVer(seen, APP_VERSION)<0) whatsNewFrom=seen; return; }
    for (let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if (k && k.indexOf("shadows.")===0){ whatsNewFrom=""; return; }
    }
    localStorage.setItem(SEEN_KEY, APP_VERSION);
  }catch(e){}
}
function markWhatsNewSeen(){
  whatsNewFrom=null;
  try{ localStorage.setItem(SEEN_KEY, APP_VERSION); }catch(e){}
  const slot=$("homenews"); if (slot) slot.innerHTML=whatsNewHomeHtml();
}
// The markdown marks the changelog keeps: **bold**, *emphasis*, `code`.
function changelogInline(s){
  return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
const CL_MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function changelogDate(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||""); if (!m) return "";
  return `${CL_MONTHS[+m[2]-1]} ${+m[3]}, ${m[1]}`;
}
function whatsNewHtml(){
  const rels=Array.isArray(window.SHADOWS_CHANGELOG) ? window.SHADOWS_CHANGELOG : [];
  if (!rels.length) return `<p class="step-note">No release notes in this copy.</p>`;
  // New since the last visit: everything past the mark, or just the latest
  // when the visit predates the mark and there's nothing to measure from.
  const isNew = (r, i) => whatsNewFrom===null ? false
    : whatsNewFrom==="" ? i===0 : cmpVer(r.version, whatsNewFrom)>0 && cmpVer(r.version, APP_VERSION)<=0;
  const anyNew = rels.some(isNew);
  return `<div class="whatsnew">${rels.map((r,i)=>{
    const fresh=isNew(r,i), open=fresh || (!anyNew && i===0);
    return `<details class="wn-rel"${open?" open":""}>
      <summary><span class="wn-ver">${esc(r.version)}</span>${r.date?`<span class="wn-date">${esc(changelogDate(r.date))}</span>`:""}${fresh?`<span class="wn-new">New</span>`:""}</summary>
      ${(r.intro||[]).map(p=>`<p class="wn-intro">${changelogInline(p)}</p>`).join("")}
      ${(r.items||[]).length?`<ul>${r.items.map(t=>`<li>${changelogInline(t)}</li>`).join("")}</ul>`:""}
    </details>`;
  }).join("")}</div>`;
}
function openWhatsNew(){
  openModal({ title: "What's new", html: whatsNewHtml(), returnTo: "[data-whatsnew]" });
  markWhatsNewSeen();
}
function whatsNewHomeHtml(){
  if (whatsNewFrom!==null) return `<div class="wn-note" role="status"><span>Updated to <b>${esc(APP_VERSION)}</b>.</span>
      <button class="btn sm" data-whatsnew>See what changed</button>
      <button class="wn-x" data-whatsnew-dismiss aria-label="Dismiss">×</button></div>`;
  return `<button class="wn-link" data-whatsnew>What's new in ${esc(APP_VERSION)}</button>`;
}

// ── Footer (registry / version chrome, collapsible) ──────────────────
const FOOTER_KEY = "shadows.footer";
function footerCollapsed(){ try{ return localStorage.getItem(FOOTER_KEY)!=="open"; }catch(e){ return true; } }
function renderFooter(){
  const f=$("footer"); if (!f) return;
  const collapsed = footerCollapsed();
  f.classList.toggle("collapsed", collapsed);
  f.innerHTML = `<span class="fmeta">NYTE CITY REGISTRY · GET DANGEROUS GAMES · app <b>${esc(APP_VERSION)}</b> <button class="flink" data-whatsnew>What's new</button> · data <b>${esc(D.meta.gamedataVersion)}</b> · ${esc(D.meta.rulesetVersion)}</span>
    <button class="ftoggle" data-ftoggle>${collapsed?"GDG ▴":"Hide ▾"}</button>`;
  f.querySelector("[data-ftoggle]").onclick=()=>{
    const nowCollapsed = !f.classList.contains("collapsed");
    f.classList.toggle("collapsed", nowCollapsed);
    try{ localStorage.setItem(FOOTER_KEY, nowCollapsed?"closed":"open"); }catch(e){}
    f.querySelector("[data-ftoggle]").textContent = nowCollapsed?"GDG ▴":"Hide ▾";
  };
}

// ── Boot ─────────────────────────────────────────────────────────────
function boot(){
  if (!window.SHADOWS_DATA){
    $("main").innerHTML = `<div class="home-hero"><h1>No game data</h1>
      <p>Place <span style="font-family:var(--mono)">shadows-data.js</span> next to this file and reload.</p></div>`;
    return;
  }
  initWhatsNew();
  migrateLegacySlots();
  // Crossing 1280px moves a pinned panel in or out of the page.
  if (window.matchMedia){ const mq=window.matchMedia(PIN_MEDIA), re=()=>{ if (S.screen==="sheet") renderDrawer(); };
    if (mq.addEventListener) mq.addEventListener("change", re); else if (mq.addListener) mq.addListener(re); }
  renderFooter();
  wireThemeToggle();
  // The sticky header is two rows on the sheet and one elsewhere, so a
  // sticky jump bar (W22) reads its real height rather than --header-h.
  const hdr=document.querySelector("header.top"), nav=$("topnav");
  if (hdr){
    const setH=()=>{ document.documentElement.style.setProperty("--hdr-live", hdr.offsetHeight+"px"); if (nav) tabRowFades(nav); };
    setH();
    if (window.ResizeObserver) new ResizeObserver(setH).observe(hdr);
  }
  // The wizard's narrow rail line and the fixed footer are measured the same
  // way: step 7's jump bar sticks under the line, and Back/Continue sit clear
  // of the footer (Decision 161).
  [["vitals","--vstrip-live"],["footer","--ftr-live"]].forEach(([id,prop])=>{
    const el=$(id); if (!el) return;
    const set=()=>document.documentElement.style.setProperty(prop, el.offsetHeight+"px");
    set();
    if (window.ResizeObserver) new ResizeObserver(set).observe(el);
  });
  // A plain mouse wheel scrolls the tab row sideways, until it can't.
  if (nav){
    nav.addEventListener("scroll", ()=>tabRowFades(nav), { passive:true });
    nav.addEventListener("wheel", e=>{
      if (Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return;
      const was=nav.scrollLeft; nav.scrollLeft+=e.deltaY;
      if (nav.scrollLeft!==was) e.preventDefault();
    }, { passive:false });
  }
  const closeMenu=()=>{ const m=$("hdrmenu"); if (m && !m.hidden){ m.hidden=true; const a=$("hdractions"), kb=a&&a.querySelector("[data-menu-toggle]"); if(kb) kb.setAttribute("aria-expanded","false"); } };
  document.addEventListener("keydown", e=>{
    if (e.key==="Escape"){ const dr=$("vdrawer"); if (dr && dr.classList.contains("open")) closeVitals(); closeMenu(); }
  });
  document.addEventListener("click", e=>{ const a=$("hdractions"); if (a && !a.contains(e.target)) closeMenu(); });
  // What's new opens from the home screen, the sheet's menu and the footer.
  document.addEventListener("click", e=>{
    const t=e.target.closest && e.target.closest("[data-whatsnew],[data-whatsnew-dismiss]"); if (!t) return;
    closeMenu();
    if (t.hasAttribute("data-whatsnew")) openWhatsNew(); else markWhatsNewSeen();
  });
  renderHome();
}
boot();
/*UI-END*/
