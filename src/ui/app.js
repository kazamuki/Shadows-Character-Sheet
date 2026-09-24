// App chrome, event wiring, and boot. Loaded last so every render function
// from shared.js / wizard.js / sheet.js already exists as a global.

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
const APP_VERSION = "0.24.0";

// ── Main render + events ─────────────────────────────────────────────
// Header chrome: brand context + the section tabs (which now live in the
// sticky header rather than inside the scrolling content).
function renderTopChrome(){
  const ctx=$("brandctx"), nav=$("topnav"), act=$("hdractions");
  if (!ctx || !nav) return;
  if (S.screen==="sheet"){
    ctx.textContent = (S.ch && S.ch.identity.name) ? S.ch.identity.name : "Unnamed";
    nav.innerHTML = tabButtonsHtml();
    nav.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{
      S.section=normSection(b.dataset.sec); window.scrollTo(0,0); update();
    });
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

function closeVitals(){
  S.vitalsOpen=false;
  const dr=$("vdrawer"), sc=$("vscrim");
  if (dr){ dr.classList.remove("open"); dr.setAttribute("aria-hidden","true"); }
  if (sc) sc.classList.remove("open");
}
function renderDrawer(){
  const dr=$("vdrawer"), sc=$("vscrim");
  if (!dr) return;
  if (S.screen==="sheet" && S.ch){
    dr.innerHTML = vitalsPanelHtml(S.ch);
    dr.classList.toggle("open", !!S.vitalsOpen);
    dr.setAttribute("aria-hidden", S.vitalsOpen?"false":"true");
    if (sc) sc.classList.toggle("open", !!S.vitalsOpen);
    dr.querySelectorAll("[data-vitals-close]").forEach(b=>b.onclick=closeVitals);
    if (sc) sc.onclick=closeVitals;
  } else {
    dr.innerHTML=""; closeVitals();
  }
}

function renderMain(){
  const app=$("app");
  if (app) app.classList.toggle("sheet-mode", S.screen==="sheet");
  renderTopChrome();
  if (S.screen==="home") return renderHome();
  if (S.screen==="sheet"){
    S.section = normSection(S.section);
    landedNow = S.landed || null; S.landed = null;     // W15: flash once
    const body = SHEET_RENDER[S.section] ? SHEET_RENDER[S.section]() : SHEET_RENDER.main();
    // Main carries its own condition strip; every other tab gets the vitals bar.
    const bar = S.section==="main" ? "" : sheetVitalsBar(S.ch);
    const banner = S.admin ? adminBannerHtml() : "";
    $("main").innerHTML = bar + banner + body;
    landedNow = null;
    renderDrawer();
    bindMain(); bindSheet();
    refreshPopover();
    return;
  }
  closeVitals(); closePopover(false);
  const st = STEPS[S.step];
  let h = stepHeader(st) + RENDER[st.id]();
  if (st.id!=="review") h += wizNav(st.id);
  $("main").innerHTML = h;
  bindMain();
}

function bindMain(){
  const main=$("main"), ch=S.ch;
  // navigation
  main.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{
    S.step = Math.max(0, Math.min(STEPS.length-1, S.step+Number(b.dataset.nav)));
    S.maxReached = Math.max(S.maxReached, S.step);
    window.scrollTo(0,0); update();
  });
  main.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>{ S={screen:"home",ch:null,step:0,maxReached:0}; renderHome(); });
  main.querySelectorAll("[data-importdismiss]").forEach(b=>b.onclick=()=>{ S.importIssues=[]; update(); });
  // selections
  main.querySelectorAll("[data-pl]").forEach(b=>b.onclick=()=>{ ch.creation.powerLevel=b.dataset.pl; update(); });
  main.querySelectorAll("[data-arch]").forEach(b=>b.onclick=()=>{
    if (ch.identity.archetype!==b.dataset.arch){
      ch.identity.archetype=b.dataset.arch;
      resetArchetypeChoices(ch);
    }
    update();
  });
  // One handler for every archetype's specialization (A3). Single-select
  // replaces; multi-select toggles. Over-picking is deliberately allowed —
  // validate() says "Too many", and an error you can read beats a click that
  // silently does nothing.
  main.querySelectorAll("[data-spec]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.spec, ac=ch.archetypeChoices;
    if (!Array.isArray(ac.specialization)) ac.specialization=[];
    const before = ac.specialization[0];
    if (Engine.specializationNeed(ch) <= 1) ac.specialization=[id];
    else {
      const i=ac.specialization.indexOf(id);
      if (i>=0) ac.specialization.splice(i,1); else ac.specialization.push(id);
    }
    // The Professional's focused-skill and natural-advantage pools hang off
    // the subtype, so changing it invalidates both — including the entries
    // natural advantages mirror into ch.advantages, which the old
    // single-select handler cleared on one side only.
    if (ac.specialization[0]!==before){
      ac.focusedSkillPicks=[]; ac.naturalAdvantages=[];
      ch.advantages=ch.advantages.filter(x=>x.notes!=="natural");
    }
    update();
  });
  // Pick controls. `data-sel` is "<kind>|<entryId>|<pickId>|<slot>"; the
  // engine owns distinctness and the slot cap, so a refusal comes back with a
  // reason and the control simply re-renders to what is actually stored.
  const applySel = (el, val) => {
    const [kind, entryId, pickId, slot] = el.dataset.sel.split("|");
    const r = Engine.setSelection(ch, kind, entryId, pickId, Number(slot), val);
    if (!r.ok && r.why) el.title = r.why;
    return r;
  };
  main.querySelectorAll("select[data-sel]").forEach(el=>el.onchange=()=>{ applySel(el, el.value); update(); });
  main.querySelectorAll("input[data-sel]").forEach(el=>el.oninput=()=>{
    applySel(el, el.value);
    update(false); refreshNav();
  });
  main.querySelectorAll("[data-fskill]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.fskill, list=ch.archetypeChoices.focusedSkillPicks;
    const i=list.indexOf(id); if(i>=0) list.splice(i,1); else list.push(id);
    update();
  });
  // steppers
  main.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{
    const [key,delta]=b.dataset.step.split("|").reduce((acc,part,i,arr)=>{
      if(i===arr.length-1) acc[1]=Number(part); else acc[0]=(acc[0]?acc[0]+"|":"")+part; return acc; },[null,0]);
    applyStep(key, delta); update();
  });
  // dice rolls — re-render main so pool-gated steppers enable, but keep focus on the input
  const rerenderKeepFocus = (selAttr, val) => {
    update(); // full re-render: steppers re-evaluate against the new pool
    const again = main.querySelector(`[${selAttr}]`);
    if (again){ again.focus(); try{ again.setSelectionRange(String(val).length, String(val).length); }catch(e){} }
  };
  main.querySelectorAll("[data-roll]").forEach(inp=>inp.oninput=()=>{
    const clean = inp.value.replace(/[^0-9]/g,"");
    if (clean !== inp.value) inp.value = clean;
    ch.creation.rolls[inp.dataset.roll] = clean===""?null:Math.max(0,Number(clean));
    rerenderKeepFocus(`data-roll="${inp.dataset.roll}"`, clean);
  });
  main.querySelectorAll("[data-archroll]").forEach(inp=>inp.oninput=()=>{
    const clean = inp.value.replace(/[^0-9]/g,"");
    if (clean !== inp.value) inp.value = clean;
    ch.archetypeChoices.rolls[inp.dataset.archroll] = clean===""?null:Math.max(0,Number(clean));
    rerenderKeepFocus(`data-archroll="${inp.dataset.archroll}"`, clean);
  });
  // Jump bars (W5, W22). The filter works on the rendered page, so typing
  // keeps focus; S.cpFilter carries it across the re-render a stepper causes.
  main.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>jumpTo(b.dataset.jump));
  const jf=main.querySelector("[data-jumpfilter]");
  if (jf){
    const run=()=>{ const r=applyPickFilter(main, jf.value), c=main.querySelector("[data-jumpcount]");
      if (c) c.textContent = r.active ? `${r.shown} of ${r.total}` : ""; };
    jf.oninput=()=>{ S.cpFilter=jf.value; run(); };
    run();
  }
  // The book's spell picker, a modal on the sheet and in the wizard (Decision 111)
  main.querySelectorAll("[data-spellpickopen]").forEach(b=>b.onclick=()=>openSpellPicker(b.dataset.spellpickopen));
  main.querySelectorAll("[data-startrm]").forEach(b=>b.onclick=()=>{ Engine.removeGrimoireRow(ch, Number(b.dataset.startrm)); update(); });
  // identity / history text
  main.querySelectorAll("[data-id]").forEach(inp=>inp.oninput=()=>{
    const k=inp.dataset.id;
    ch.identity[k] = inp.type==="number" ? (inp.value===""?null:Number(inp.value)) : inp.value;
    update(false); refreshNav();
  });
  // export / lock
  main.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>exportChar());
  main.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{
    // Locking puts this character in the live-sheet slot. If a different
    // character is saved there, ask first (B18).
    const saved=(loadActive()||{}).ch;
    const locking=()=>{
      ch.creation.locked=true;
      S.ch=Engine.migrate(Engine.buildExport(ch));
      exportChar(); clearDraft();
      S.screen="sheet"; S.section="main";
      window.scrollTo(0,0); update();
    };
    guardReplace(saved, ch, { title:`Replace ${charName(saved)}'s sheet?`,
      lead:`Locking <b>${esc(charName(ch))}</b> makes it the sheet this browser keeps, in place of <b>${esc(charName(saved))}</b>.`,
      go:"Lock and replace" }, locking);
  });
}

// ── The spell picker (Decisions 108, 111) ────────────────────────────
// One modal for the sheet and the wizard. On the sheet each add or link is
// one commit() with its undo toast; in the wizard a pick is a creation input,
// like a stepper, and goes through Engine.addStartingSpell's gate. The page
// behind re-renders on every change, and the modal refreshes its own results.
const spellName = id => (Engine.spellById(id)||{name:id}).name;
function linkSpellRow(ch, i){
  const line = Engine.grimoire(ch).lines[i];
  if (!line || !line.match) return;
  commit("grimoire", `Linked to the book: ${line.match.name}`, ()=>{ Engine.linkSpell(ch, i); });
}
function openSpellPicker(mode){
  const ch = S.ch, M = spellPickMode[mode];
  if (!ch || !M) return;
  openModal({ title: M.title, html: spellPickerHtml(ch, mode), foot: pickerFootHtml(), returnTo: `[data-spellpickopen="${mode}"]`,
    bind: body => {
      const results = body.querySelector("[data-spellresults]"), status = body.querySelector("[data-spellstatus]");
      const refresh = () => { results.innerHTML = spellResultsHtml(S.ch, mode); status.innerHTML = M.status(S.ch); };
      body.querySelector("[data-spellq]").oninput = e => { S.spellPick.q = e.target.value; refresh(); };
      body.querySelectorAll("[data-spellf]").forEach(sel=>sel.onchange=()=>{ S.spellPick[sel.dataset.spellf] = sel.value; refresh(); });
      // W23: a click anywhere on a row is its button's click. The button stays
      // for the keyboard and a screen reader; a field or a link keeps its own.
      results.onclick = e => {
        let b = e.target.closest("button");
        if (!b){
          if (e.target.closest("input, select, textarea, a, label")) return;
          const tr = e.target.closest("tr"); b = tr && tr.querySelector("button");
        }
        if (!b || b.disabled) return;
        const d = b.dataset;
        if (d.spelllink!=null) linkSpellRow(ch, Number(d.spelllink));
        else if (d.spelladd) commit("grimoire", `Grimoire: ${spellName(d.spelladd)}`, ()=>{ Engine.addSpell(ch, d.spelladd); });
        else if (d.startadd){ Engine.addStartingSpell(ch, d.startadd); update(); }
        else if (d.startrm!=null){ Engine.removeGrimoireRow(ch, Number(d.startrm)); update(); }
        else return;
        refresh();
      };
    } });
}

// ── The catalog browser (W4) ─────────────────────────────────────────
// Add and Buy are each one commit() with its undo toast, and the modal stays
// open for the next pick, as the spell picker does. Buy is refused with the
// engine's reason (catalogLine's `buy`), which the row already shows.
function openCatalog(kind){
  const ch = S.ch; if (!ch || !["weapons","armor","gear"].includes(kind)) return;
  S.loPick = { kind, q:"", group:"", sort:"book", afford:false, open:null };
  openModal({ title: { armor:"The armor catalog", weapons:"The weapons catalog", gear:"The equipment catalog" }[kind], html: catalogPickerHtml(ch, kind),
    foot: pickerFootHtml(), returnTo: `[data-lobrowse="${kind}"]`, onClose: ()=>{ S.loPick=null; },
    bind: body => {
      const results = body.querySelector("[data-catresults]"), status = body.querySelector("[data-catstatus]");
      const refresh = () => { if (!S.loPick) return; results.innerHTML = catalogResultsHtml(S.ch, kind); status.innerHTML = catalogStatusHtml(S.ch, kind); };
      body.querySelector("[data-catq]").oninput = e => { S.loPick.q = e.target.value; refresh(); };
      body.querySelectorAll("[data-catf]").forEach(sel=>sel.onchange=()=>{ S.loPick[sel.dataset.catf] = sel.value; refresh(); });
      body.querySelector("[data-catafford]").onchange = e => { S.loPick.afford = e.target.checked; refresh(); };
      results.onclick = e => {
        const b = e.target.closest("button");
        if (!b){                                          // the row itself: its details
          const tr = e.target.closest("[data-catrow]"); if (!tr) return;
          S.loPick.open = S.loPick.open===tr.dataset.catrow ? null : tr.dataset.catrow; refresh(); return;
        }
        if (b.disabled) return;
        const buy = b.dataset.catbuy!=null, id = buy ? b.dataset.catbuy : b.dataset.catadd;
        if (!id) return;
        const pre = Engine.addLoadout(clone(ch), kind, id, { buy });
        if (!pre.ok){ alert(pre.why); return; }
        const n = pre.added>1 ? ` ×${pre.added}` : "";
        commit("loadout", buy ? `Bought ${pre.name}${n} (−${pre.paid}Ç)` : `Added ${pre.name}${n}`, ()=>{ Engine.addLoadout(ch, kind, id, { buy }); });
        refresh();
      };
    } });
}

// ── The Aberration picker (Decision 115) ─────────────────────────────
// One pick, then it closes: the pick is one commit() with its undo toast. From
// a Cascade the entry's note says so, which the player can rewrite.
function openAberrationPicker(mode){
  const ch = S.ch; if (!ch) return;
  const fromCascade = mode==="cascade";
  S.abPick = { q:"", permanence:"temporary" };
  openModal({ title: fromCascade ? "What the Cascade left" : "Add an Aberration", html: aberrationPickerHtml(ch),
    foot: `<span class="modal-note">${fromCascade?"Pick the one your GM names.":"Pick one your GM ruled you have."}</span><button class="btn" data-modalclose>Cancel</button>`,
    returnTo: `[data-abpickopen="${mode}"]`, onClose: ()=>{ S.abPick=null; },
    bind: body => {
      const results = body.querySelector("[data-abresults]");
      const refresh = () => { results.innerHTML = aberrationResultsHtml(S.ch); };
      body.querySelector("[data-abq]").oninput = e => { S.abPick.q = e.target.value; refresh(); };
      body.querySelectorAll("[data-abperm]").forEach(b=>b.onclick=()=>{
        S.abPick.permanence = b.dataset.abperm;
        body.querySelectorAll("[data-abperm]").forEach(x=>{ const on = x===b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
        body.querySelector("[data-abstatus]").textContent = abPermNote(b.dataset.abperm);
      });
      results.onclick = e => {
        const b = e.target.closest("[data-abpick]");
        if (!b || b.disabled || !S.abPick) return;
        const entry = { id: b.dataset.abpick, permanence: S.abPick.permanence };
        if (fromCascade) entry.note = `Cascade, ${new Date().toISOString().slice(0,10)}`;
        const r = Engine.recordAberration(clone(ch), entry);      // validate without mutating
        if (!r.ok){ alert(r.why); return; }
        commit("aberration", `${fromCascade?"Cascade":"Aberration"}: ${r.name} (${entry.permanence})`, ()=>{ Engine.recordAberration(ch, entry); });
        closeModal();
      };
    } });
}

// ── Take a hit (Decision 99; a modal since W6) ───────────────────────
// The form lives in S.hit until Apply, which is one commit(), so the hit, its
// armor wear and its Conditions undo together. Each change redraws the modal
// and puts focus back on the control that changed; Cancel, ×, Esc and the
// backdrop all drop the form. A number redraws as it's typed, not on
// `change`, which fires on blur: a redraw then would replace Apply between
// the press and the click that was meant for it.
function openHitModal(returnTo){
  const ch=S.ch; if (!ch) return;
  if (S.act){ S.act=null; renderMain(); }
  S.hit=Object.assign(newHitForm(), { owner: ch });
  const p=hitModalParts(ch);
  openModal({ title: "Take a hit", html: p.body, foot: p.foot, returnTo: typeof returnTo==="string" ? returnTo : "[data-hitopen]",
    onClose: ()=>{ S.hit=null; }, bind: bindHitModal });
}
function bindHitModal(body, foot){
  const ch=S.ch;
  const redraw = key => {
    if (!S.hit) return;
    const p=hitModalParts(ch);
    body.innerHTML=p.body; foot.innerHTML=p.foot;
    bindHitModal(body, foot);
    const again = key && body.querySelector(`[${key}]`);
    if (again){ again.focus(); try{ again.setSelectionRange(again.value.length, again.value.length); }catch(e){} }
  };
  const sel = (el, attr) => `${attr}="${el.getAttribute(attr)}"`;
  body.querySelectorAll("[data-hit]").forEach(el=>el[el.getAttribute("inputmode")==="numeric"?"oninput":"onchange"]=()=>{
    if (!S.hit) return;
    if (el.getAttribute("inputmode")==="numeric") el.value=el.value.replace(/[^0-9]/g,"");
    S.hit[el.dataset.hit] = el.type==="checkbox" ? el.checked : el.value;
    redraw(sel(el, "data-hit"));
  });
  body.querySelectorAll("[data-hitcond]").forEach(el=>el.onchange=()=>{
    if (!S.hit) return; S.hit.conds[el.dataset.hitcond]=el.checked; redraw(sel(el, "data-hitcond"));
  });
  body.querySelectorAll("[data-hitnat]").forEach(el=>el.onchange=()=>{
    if (!S.hit) return; S.hit.nat[el.dataset.hitnat]=el.checked; redraw(sel(el, "data-hitnat"));
  });
  foot.querySelectorAll("[data-hitcancel]").forEach(b=>b.onclick=closeModal);
  foot.querySelectorAll("[data-hitapply]").forEach(b=>b.onclick=()=>{
    const st=S.hit; if (!st) return;
    const input=hitInput(st), r=Engine.resolveHit(ch, input);
    if (hitPending(st, r)) return;          // the footer already says why
    const choices=hitChoices(st, r);
    S.hit=null;
    commit("damage", hitLabel(r), ()=>{ Engine.applyHit(ch, input, choices); });
    closeModal();
  });
}

// ── The vitals' own controls (W2/W3) ─────────────────────────────────
// Damage's stepper, Take a hit, Conditions, SAN, LUCK and Çredits, bound to
// whatever root draws them: Trackers, or a vitals popover. One binder, so a
// popover's Hurt 5 is Trackers' Hurt 5 — the same commit(), the same audit
// label, the same undo — never a second code path.
function bindVitalControls(root){
  const ch=S.ch; if (!ch) return;
  const num = el => el && el.value!=="" ? Number(el.value) : null;
  // Damage. Withering is the part of `damage` that can't regenerate, so it
  // can never be more than the damage itself — a hand edit down trims it.
  const setDamage = v => { ch.trackers.damage=v;
    ch.trackers.witheringDamage=Math.min(v, Math.max(0, Number(ch.trackers.witheringDamage)||0)); };
  root.querySelectorAll("[data-dmg]").forEach(b=>b.onclick=()=>{
    const d=Number(b.dataset.dmg);
    commit("damage", `${d>0?"Hurt":"Heal"} ${Math.abs(d)}`, ()=>{ setDamage(Math.max(0,(ch.trackers.damage||0)+d)); });
  });
  const ds=root.querySelector("[data-dmgset]");
  if (ds) ds.onchange=()=>{ const v=Math.max(0,Number(ds.value)||0); commit("damage", `Set damage → ${v}`, ()=>{ setDamage(v); }); };
  root.querySelectorAll("[data-dmgheal]").forEach(b=>b.onclick=()=>commit("damage","Heal all",()=>{ setDamage(0); }));
  root.querySelectorAll("[data-hitopen]").forEach(b=>b.onclick=openHitModal);

  // Conditions (Decision 95) — the engine owns the no-duplicates rule; the
  // body-part picker only shows for a Condition that needs one.
  const condLabel = e => { const d=Engine.conditionById(e&&e.id), l=Engine.locationById(e&&e.location);
    return (d?d.name:String(e&&e.id))+(l?` (${l.name})`:""); };
  // W14: a palette chip adds in one click (the undo toast makes that safe);
  // a body-part Condition asks where first, through the same Add.
  const addCond = (id, location) => {
    const r=Engine.addCondition(clone(ch), {id, location});     // validate without mutating
    if (!r.ok){ alert(r.why); return; }
    S.condPick=null;
    commit("condition", `Condition: ${condLabel({id, location})}`, ()=>{ Engine.addCondition(ch, {id, location}); });
  };
  root.querySelectorAll("[data-condpalette]").forEach(d=>d.ontoggle=()=>{ S.condPalette=d.open; });
  root.querySelectorAll("[data-condquick]").forEach(b=>b.onclick=()=>{
    const def=Engine.conditionById(b.dataset.condquick); if (!def) return;
    if (def.location){ S.condPick=def.id; renderMain(); return; }
    addCond(def.id);
  });
  root.querySelectorAll("[data-condpickcancel]").forEach(b=>b.onclick=()=>{ S.condPick=null; renderMain(); });
  root.querySelectorAll("[data-condadd]").forEach(b=>b.onclick=()=>{
    const location=(b.parentNode.querySelector("[data-condadd-loc]")||{}).value;
    if (!location){ alert("Pick the body part."); return; }
    addCond(b.dataset.condadd, location);
  });
  root.querySelectorAll("[data-condinfo]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.condinfo); S.condInfo = S.condInfo===i ? null : i; renderMain();
  });
  root.querySelectorAll("[data-condrm]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.condrm), e=ch.trackers.conditions[i];
    S.condInfo=null;                                   // indexes shift once one goes
    commit("condition", `Cleared: ${condLabel(e)}`, ()=>{ Engine.removeCondition(ch, i); });
  });
  root.querySelectorAll("[data-condmarks]").forEach(b=>b.onclick=()=>{
    const [i,n]=b.dataset.condmarks.split("|").map(Number), e=ch.trackers.conditions[i];
    const d=Engine.conditionById(e&&e.id);
    commit("condition", `${d&&d.counter?d.counter.label:"Marks"} → ${n}`, ()=>{ Engine.setConditionMarks(ch, i, n); });
  });
  root.querySelectorAll("[data-condnote]").forEach(inp=>inp.onchange=()=>{
    const i=Number(inp.dataset.condnote), e=ch.trackers.conditions[i];
    if (!e) return;
    commit("condition", `Note on ${condLabel(e)}`, ()=>{ if (inp.value) e.note=inp.value; else delete e.note; });
  });

  // SAN
  root.querySelectorAll("[data-san]").forEach(b=>b.onclick=()=>{
    const d=Number(b.dataset.san);
    commit("san", `SAN loss ${d>0?"+":""}${d}`, ()=>{ ch.trackers.san.loss=Math.max(0,(ch.trackers.san.loss||0)+d); });
  });
  const ss=root.querySelector("[data-sanset]");
  if (ss) ss.onchange=()=>{ const v=Math.max(0,Number(ss.value)||0); commit("san", `Set SAN loss → ${v}`, ()=>{ ch.trackers.san.loss=v; }); };

  // LUCK
  root.querySelectorAll("[data-luckspend]").forEach(b=>b.onclick=()=>{
    const cost=Number(b.dataset.luckspend);
    if (Engine.luckState(ch).current>=cost) commit("luck", `LUCK spent −${cost}`, ()=>{ ch.trackers.luck.spent+=cost; });
  });
  root.querySelectorAll("[data-luckregain]").forEach(b=>b.onclick=()=>{
    if ((ch.trackers.luck.spent||0)>0) commit("luck","LUCK regained +1",()=>{ ch.trackers.luck.spent=Math.max(0,ch.trackers.luck.spent-1); });
  });

  // Çredits
  root.querySelectorAll("[data-cr]").forEach(b=>b.onclick=()=>{
    const amt=num(root.querySelector("[data-cramt]"));
    const note=(root.querySelector("[data-crnote]")||{}).value||"";
    if (amt==null || !amt) return;
    const signed=Math.abs(amt)*Number(b.dataset.cr);
    commit("credits", `Çredits ${signed>0?"+":""}${signed}${note?` (${note})`:""}`, ()=>{ Engine.addCredits(ch, signed, note); });
  });

}

// W2/W3: a vital's popover, from its pill or its card on Main. The body is
// Trackers' own controls, bound by the same binder; Take a hit closes the
// popover and opens the hit modal, whose focus comes back to the vital.
function openVitalPopover(key){
  openPopover({ key, render: ()=>S.ch ? vitalPopover(S.ch, key) : null, bind: body=>{
    bindVitalControls(body);
    body.querySelectorAll("[data-pophit]").forEach(b=>b.onclick=()=>{
      closePopover(true); openHitModal(`[data-vpop="${key}"]`);
    });
    body.querySelectorAll("[data-popgo]").forEach(b=>b.onclick=()=>{
      closePopover(false); S.section=normSection(b.dataset.popgo); window.scrollTo(0,0); update();
    });
  } });
}

// ── Phase 3: sheet event wiring ─────────────────────────────────────
function bindSheet(){
  const main=$("main"), ch=S.ch;
  // Vitals flyout (the bar's "Vitals" toggle on non-Main tabs)
  main.querySelectorAll("[data-vitals-toggle]").forEach(b=>b.onclick=()=>{
    S.vitalsOpen=!S.vitalsOpen;
    const dr=$("vdrawer"), sc=$("vscrim");
    if (dr){ dr.classList.toggle("open", S.vitalsOpen); dr.setAttribute("aria-hidden", S.vitalsOpen?"false":"true"); }
    if (sc) sc.classList.toggle("open", S.vitalsOpen);
  });
  main.querySelectorAll("[data-vpop]").forEach(b=>b.onclick=()=>openVitalPopover(b.dataset.vpop));
  // Skill description toggles (no full re-render — flip the hidden detail row)
  main.querySelectorAll("[data-skilldesc]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.skilldesc; S.openSkills=S.openSkills||new Set();
    const open=!S.openSkills.has(id);
    if (open) S.openSkills.add(id); else S.openSkills.delete(id);
    const row=main.querySelector('[data-descrow="'+id+'"]');
    if (row) row.hidden=!open;
    b.setAttribute("aria-expanded", open?"true":"false");
  });
  const num = el => el && el.value!=="" ? Number(el.value) : null;
  const lite = () => { update(false); };   // save + rails, keep focus in inputs

  // Derived (TOL/WILL) derivation toggles — flip the hidden line, no re-render
  main.querySelectorAll("[data-derivdesc]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.derivdesc; S.openDerived=S.openDerived||new Set();
    const open=!S.openDerived.has(id);
    if (open) S.openDerived.add(id); else S.openDerived.delete(id);
    const row=main.querySelector('[data-derivrow="'+id+'"]');
    if (row) row.hidden=!open;
    b.setAttribute("aria-expanded", open?"true":"false");
  });

  // ── Activity Log: last-in-first-out undo (NOT itself logged) ──────────
  main.querySelectorAll("[data-undolast]").forEach(b=>b.onclick=()=>{
    const r=Engine.undoLastAction(ch); if(!r.ok){ alert(r.why); return; } update();
  });
  main.querySelectorAll("[data-admin-clearlog]").forEach(b=>b.onclick=()=>{
    if (confirm("Clear the activity log? This removes history only (no character values change) and cannot be undone.")){ ch.audit=[]; update(); }
  });
  // Admin banner controls
  main.querySelectorAll("[data-admin-open]").forEach(b=>b.onclick=()=>{ S.section="admin"; window.scrollTo(0,0); update(); });
  main.querySelectorAll("[data-admin-exit]").forEach(b=>b.onclick=()=>{ S.admin=false; if(S.section==="admin") S.section="main"; window.scrollTo(0,0); update(); });

  bindVitalControls(main);

  // Turn Reset, Rest, Focused Healing, After the fight (Decision 100): one
  // form in S.act, one commit() on Apply, the same as a hit.
  main.querySelectorAll("[data-actopen]").forEach(b=>b.onclick=()=>{ S.hit=null; S.act=Object.assign(newActForm(b.dataset.actopen), { owner: ch }); renderMain(); });
  main.querySelectorAll("[data-actcancel]").forEach(b=>b.onclick=()=>{ S.act=null; renderMain(); });
  main.querySelectorAll("[data-act]").forEach(el=>el.onchange=()=>{
    const st=S.act; if (!st) return;
    const k=el.dataset.act, v=el.type==="checkbox" ? el.checked : el.value;
    if (k.startsWith("src:")) st.sources[k.slice(4)]=v;
    else if (k.startsWith("clear:")) st.clear[k.slice(6)]=v;
    else {
      st[k]=v;
      if (st.kind==="rest" && (k==="days" || k==="speed")) st.hp="";     // re-propose BOD × days
      if (st.kind==="nanomed" && k==="dose") st.hp="";                   // re-propose BOD / dose
      if (k==="shCheck") st.shRoll="";
    }
    renderMain();
  });
  main.querySelectorAll("[data-actapply]").forEach(b=>b.onclick=()=>{
    const st=S.act; if (!st) return;
    const input=actInput(ch, st), plural=(n,w)=>`${n} ${w}${n===1?"":"s"}`;
    if (st.kind==="reset"){
      const r=Engine.resolveReset(ch, input);
      if (!r.ok){ alert(r.why); return; }
      if (r.prompts.atZero && !st.atZero){ alert("Mark the check at zero as passed or failed first."); return; }
      if (r.prompts.dyingCheck && !st.dyingCheck){ alert("Mark the Dying check as passed or failed first."); return; }
      const marks = r.marks + (r.prompts.dyingCheck && st.dyingCheck==="fail" ? 1 : 0);
      const bits=[r.total?`${r.total} damage`:"", marks?plural(marks,"Death Mark"):"", r.prompts.dyingCheck&&st.dyingCheck==="pass"?"held on":""].filter(Boolean);
      S.act=null;
      commit("damage", `Turn Reset: ${bits.join(", ")||"nothing ticked"}`, ()=>{ Engine.applyReset(ch, input, { atZero:st.atZero, dyingCheck:st.dyingCheck }); });
    } else if (st.kind==="rest" || st.kind==="focused" || st.kind==="nanomed"){
      const r=Engine.heal(clone(ch), input);
      if (!r.ok){ alert(r.why); return; }
      const bits=[r.healed?`+${r.healed} HP`:"", r.restored?`${plural(r.restored,"Massive level")} restored`:"",
        ...r.cleared.map(e=>{ const d=Engine.conditionById(e.id), l=Engine.locationById(e.location); return `cleared ${d?d.name:e.id}${l?` (${l.name})`:""}`; })].filter(Boolean);
      const label = st.kind==="rest" ? `Rested ${plural(input.days,"day")}${st.speed?" on Speed Heal":""}`
                  : st.kind==="nanomed" ? "Nanomed Kit" : "Focused Healing";
      // W17: the kit or the dose comes out of your gear in the same action.
      const gearId = st.kind==="nanomed" ? "nanomed-kit" : st.kind==="rest" && st.speed ? "speed-heal" : null;
      const carried = gearId && st.fromGear!==false && Engine.carriedGear(ch, gearId);
      S.act=null;
      commit("damage", `${label}: ${bits.join(", ")}${carried?", one from your gear":""}`, ()=>{
        Engine.heal(ch, input);
        if (carried) Engine.useGear(ch, carried.index, 1);
      });
    } else if (st.kind==="wear"){
      const w=Engine.armorState(ch).worn; if (!w) return;
      const r=Engine.armorWear(clone(ch), w.index, input);
      if (!r.ok){ alert(r.why); return; }
      S.act=null;
      commit("loadout", `Armor wear (${r.die}): ${r.name} −${r.lost} Integrity${r.selfHeal&&r.selfHeal.healed?`, +${r.selfHeal.healed} ${r.selfHeal.feature}`:""}`,
        ()=>{ Engine.armorWear(ch, w.index, input); });
    }
  });

  // Generic archetype trackers (SFR / panel trackers)
  main.querySelectorAll("[data-trk]").forEach(b=>b.onclick=()=>{
    const [pid,d]=b.dataset.trk.split("|"), delta=Number(d);
    commit("tracker", `${pid.toUpperCase()} ${delta>0?"+":""}${delta}`, ()=>{
      if (pid==="sfr") ch.trackers.sfr.spent=Math.max(0,(ch.trackers.sfr.spent||0)+delta);
      else { const e=ch.trackers.panel[pid]||(ch.trackers.panel[pid]={value:0}); e.value=Math.max(0,(e.value||0)+delta); }
    });
  });
  // Aberrations on the character (Decision 110); adding one, from a Cascade
  // or by hand, is the picker modal (Decision 115).
  const abName = i => { const a=Engine.aberrationState(ch).active.find(x=>x.index===i); return a ? a.name : "Aberration"; };
  main.querySelectorAll("[data-abpickopen]").forEach(b=>b.onclick=()=>openAberrationPicker(b.dataset.abpickopen));
  main.querySelectorAll("[data-abrm]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.abrm), e=ch.trackers.aberrations[i], nm=abName(i);
    commit("aberration", `${e&&e.permanence==="permanent"?"Removed":"Cleared"}: ${nm}`, ()=>{ Engine.removeAberration(ch, i); });
  });
  main.querySelectorAll("[data-abnote]").forEach(inp=>inp.onchange=()=>{
    const i=Number(inp.dataset.abnote), e=ch.trackers.aberrations[i];
    if (!e) return;
    commit("aberration", `Note on ${abName(i)}`, ()=>{ if (inp.value) e.note=inp.value; else delete e.note; });
  });
  main.querySelectorAll("[data-trkmax]").forEach(inp=>inp.onchange=()=>{
    const pid=inp.dataset.trkmax, mx=inp.value===""?null:Math.max(0,Number(inp.value));
    commit("tracker", `${pid.toUpperCase()} max → ${mx==null?"—":mx}`, ()=>{
      const e=ch.trackers.panel[pid]||(ch.trackers.panel[pid]={value:0}); e.max=mx;
    });
  });

  // Manual adjustments
  main.querySelectorAll("[data-adjadd]").forEach(b=>b.onclick=()=>{
    const target=(main.querySelector("[data-adjtarget]")||{}).value;
    const amt=num(main.querySelector("[data-adjamt]"));
    const note=(main.querySelector("[data-adjnote]")||{}).value||"";
    if (!target || amt==null || !amt) return;
    commit("adjustment", `Adjust ${target} ${amt>0?"+":""}${Math.trunc(amt)}${note?` (${note})`:""}`, ()=>{
      ch.trackers.adjustments.push({target, amount:Math.trunc(amt), note, date:new Date().toISOString()});
    });
  });
  main.querySelectorAll("[data-adjdel]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.adjdel), a2=ch.trackers.adjustments[i]||{};
    commit("adjustment", `Remove adjustment ${esc(a2.target||"")}`, ()=>{ ch.trackers.adjustments.splice(i,1); });
  });

  // IP
  main.querySelectorAll("[data-ipbuy]").forEach(b=>b.onclick=()=>{
    const [type,id]=b.dataset.ipbuy.split("|");
    const c=Engine.ipCost(ch,type,id);
    const nm = type==="stat" ? id : (Engine.skillById(id)||{name:id}).name;
    const label = c.ok ? `IP: ${nm} ${c.from}→${c.to} (−${c.cost})` : `IP spend: ${nm}`;
    commit("ip", label, ()=>{ const r=Engine.spendIP(ch,type,id,""); if(!r.ok) alert(r.why); });
  });
  main.querySelectorAll("[data-ipgrant]").forEach(b=>b.onclick=()=>{
    const amt=num(main.querySelector("[data-ipamt]"));
    const note=(main.querySelector("[data-ipnote]")||{}).value||"";
    const pre=Engine.grantIP(clone(ch), amt, note);   // validate without mutating
    if (!pre.ok){ alert(pre.why); return; }
    commit("ip", `IP grant +${Math.floor(amt)}${note?` (${note})`:""}`, ()=>{ Engine.grantIP(ch, amt, note); });
  });

  // Milestones
  main.querySelectorAll("[data-mp]").forEach(b=>b.onclick=()=>{
    const d=Number(b.dataset.mp);
    commit("milestone", `Manual MP ${d>0?"+":""}${d}`, ()=>{ ch.progression.milestonePoints=Math.max(0,(ch.progression.milestonePoints||0)+d); });
  });
  main.querySelectorAll("[data-takeminor]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.takeminor;
    if (id==="improved"){ S.askImproved=true; update(); return; }
    const nm=(D.milestones.minorShared.find(m=>m.id===id)||{name:id}).name;
    commit("milestone", `Take Minor: ${nm}`, ()=>{ const r=Engine.takeMilestone(ch,"minor",id); if(!r.ok) alert(r.why); });
  });
  main.querySelectorAll("[data-improvok]").forEach(b=>b.onclick=()=>{
    const roll=num(main.querySelector("[data-improvroll]"));
    const pre=Engine.takeMilestone(clone(ch),"minor","improved");
    if (!pre.ok){ alert(pre.why); S.askImproved=false; update(); return; }
    commit("milestone", `Take Minor: Improved${roll?` (+${roll} IP)`:""}`, ()=>{
      Engine.takeMilestone(ch,"minor","improved");
      if (roll) Engine.grantIP(ch, roll, "Improved milestone (2d10+15)");
    });
    S.askImproved=false; update();
  });
  main.querySelectorAll("[data-improvcancel]").forEach(b=>b.onclick=()=>{ S.askImproved=false; update(); });
  main.querySelectorAll("[data-takemajor]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.takemajor;
    if (b.dataset.gm==="1" && !confirm("This Milestone has prerequisites the table adjudicates (see gold chips). Has your GM signed off?")) return;
    const nm=((D.milestones.majorGeneral||[]).find(m=>m.id===id)||{name:id}).name;
    commit("milestone", `Take Major: ${nm}`, ()=>{ const r=Engine.takeMilestone(ch,"major",id); if(!r.ok) alert(r.why); });
  });
  main.querySelectorAll("[data-delminor]").forEach(b=>b.onclick=()=>{
    if (!confirm("Remove this Minor Milestone from the record?")) return;
    const i=Number(b.dataset.delminor), t=(ch.progression.milestones.minor[i]||{});
    const nm=(D.milestones.minorShared.find(m=>m.id===t.id)||{name:t.id||""}).name;
    commit("milestone", `Remove Minor: ${nm}`, ()=>{ Engine.untakeMilestone(ch,"minor",i); });
  });
  main.querySelectorAll("[data-delmajor]").forEach(b=>b.onclick=()=>{
    if (!confirm("Remove this Major Milestone from the record?")) return;
    const i=Number(b.dataset.delmajor), t=(ch.progression.milestones.major[i]||{});
    const nm=((D.milestones.majorGeneral||[]).find(m=>m.id===t.id)||{name:t.id||""}).name;
    commit("milestone", `Remove Major: ${nm}`, ()=>{ Engine.untakeMilestone(ch,"major",i); });
  });

  // Sessions
  main.querySelectorAll("[data-seslog]").forEach(b=>b.onclick=()=>{
    const title=(main.querySelector("[data-sestitle]")||{}).value||"";
    commit("session", `Log session${title?`: ${title}`:""}`, ()=>{
      Engine.logSession(ch, {
        date:(main.querySelector("[data-sesdate]")||{}).value,
        title,
        ipEarned:num(main.querySelector("[data-sesip]")) ?? D.ip.perSession,
        milestonePoint:(main.querySelector("[data-sesmp]")||{checked:true}).checked,
        notes:(main.querySelector("[data-sesnotes]")||{}).value
      });
    });
    window.scrollTo(0,0);
  });
  main.querySelectorAll("[data-sesdel]").forEach(b=>b.onclick=()=>{
    if (!confirm("Delete this session? Its IP and Milestone Point come off the totals — spent IP may go negative.")) return;
    const i=Number(b.dataset.sesdel), s=ch.sessions[i]||{};
    commit("session", `Delete session${s.title?`: ${s.title}`:""}`, ()=>{ ch.sessions.splice(i,1); });
  });

  // Editable tables (weapons / gear / panel tables)
  // Grimoire (Decision 108). Adding, linking, removing and Mastering are each
  // one commit(); notes are keystrokes, like the table cells.
  main.querySelectorAll("[data-spelllink]").forEach(b=>b.onclick=()=>linkSpellRow(ch, Number(b.dataset.spelllink)));
  main.querySelectorAll("[data-spellrm]").forEach(b=>b.onclick=()=>{
    const i = Number(b.dataset.spellrm), line = Engine.grimoire(ch).lines[i];
    const label = line && (line.name || line.spellId || (line.row && Object.values(line.row).find(v=>typeof v==="string" && v))) || "a row";
    commit("grimoire", `Grimoire: removed ${label}`, ()=>{ Engine.removeGrimoireRow(ch, i); });
  });
  main.querySelectorAll("[data-spellown]").forEach(b=>b.onclick=()=>{
    const p = Engine.archPanels(ch).find(x=>x.type==="grimoire"); if (!p) return;
    commit("grimoire", "Grimoire: your own spell", ()=>{ panelRows(ch, p.id).push({ custom:true }); });
  });
  main.querySelectorAll("[data-spellnote]").forEach(inp=>inp.oninput=()=>{
    const p = Engine.archPanels(ch).find(x=>x.type==="grimoire"), r = p && panelRows(ch, p.id)[Number(inp.dataset.spellnote)];
    if (r) { r.notes = inp.value; lite(); }
  });
  main.querySelectorAll("[data-spellmaster]").forEach(b=>b.onclick=()=>{
    const id = b.dataset.spellmaster, c = Engine.ipCost(ch, "spell", id);
    if (!c.ok){ alert(c.why); return; }
    if (Engine.ipState(ch).available < c.cost){ alert(`Not enough IP (need ${c.cost}).`); return; }
    commit("ip", `Mastered ${spellName(id)} (−${c.cost} IP)`, ()=>{ Engine.spendIP(ch, "spell", id); });
  });
  main.querySelectorAll("[data-rowadd]").forEach(b=>b.onclick=()=>{
    const key=b.dataset.rowadd;
    commit("loadout", `Add ${key} row`, ()=>{ panelRows(ch, key).push(key==="gear" ? { custom:true } : {}); });
  });
  main.querySelectorAll("[data-rowdel]").forEach(b=>b.onclick=()=>{
    const [key,i]=b.dataset.rowdel.split("|");
    commit("loadout", `Remove ${key} row`, ()=>{ panelRows(ch, key).splice(Number(i),1); });
  });
  main.querySelectorAll("[data-cell]").forEach(inp=>inp.oninput=()=>{   // text: not audited (keystrokes)
    const [key,i,col]=inp.dataset.cell.split("|");
    const rows=panelRows(ch, key);
    if (rows[Number(i)]) rows[Number(i)][col]=inp.value;
    lite();
  });

  // Loadout: weapons and armor (Decision 100). Notes are keystrokes like the
  // table cells; everything that changes a number is one commit().
  const loName = (kind, i) => kind==="weapons" ? ((Engine.weaponLine(ch,i)||{}).name||"weapon")
                            : kind==="gear" ? ((Engine.gearLine(ch,i)||{}).name||"gear")
                                               : ((Engine.armorState(ch).pieces.find(p=>p.index===i)||{}).name||"armor");
  // Gear (Decision 121): Use one, +1, a charge, Recharged — each one commit().
  main.querySelectorAll("[data-gearuse]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.gearuse), pre=Engine.useGear(clone(ch), i, 1);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `Used ${pre.name} (${pre.left} left)`, ()=>{ Engine.useGear(ch, i, 1); });
  });
  main.querySelectorAll("[data-gearplus]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.gearplus), pre=Engine.useGear(clone(ch), i, -1);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `${pre.name} +1 (${pre.left})`, ()=>{ Engine.useGear(ch, i, -1); });
  });
  main.querySelectorAll("[data-gearcharge]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.gearcharge), pre=Engine.useCharge(clone(ch), i);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `${pre.name}: a charge used (${pre.left}/${pre.max})`, ()=>{ Engine.useCharge(ch, i); });
  });
  main.querySelectorAll("[data-gearrecharge]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.gearrecharge), pre=Engine.rechargeGear(clone(ch), i);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `${pre.name}: recharged (${pre.max}/${pre.max})`, ()=>{ Engine.rechargeGear(ch, i); });
  });
  main.querySelectorAll("[data-lobrowse]").forEach(b=>b.onclick=()=>openCatalog(b.dataset.lobrowse));
  main.querySelectorAll("[data-locustom]").forEach(b=>b.onclick=()=>{
    const kind=b.dataset.locustom;
    commit("loadout", `Added custom ${kind==="armor"?"armor":"weapon"}`, ()=>{ Engine.addCustomLoadout(ch, kind); });
  });
  main.querySelectorAll("[data-lorm]").forEach(b=>b.onclick=()=>{
    const [kind,i]=b.dataset.lorm.split("|"), n=loName(kind, Number(i));
    commit("loadout", `Removed ${n}`, ()=>{ Engine.removeLoadout(ch, kind, Number(i)); });
  });
  main.querySelectorAll("[data-lonote]").forEach(inp=>inp.oninput=()=>{
    const [kind,i]=inp.dataset.lonote.split("|"), e=(ch[kind]||[])[Number(i)];
    if (e) e.notes=inp.value;
    lite();
  });
  main.querySelectorAll("[data-worn]").forEach(cb=>cb.onchange=()=>{
    const i=Number(cb.dataset.worn), n=loName("armor", i);
    commit("loadout", `${cb.checked?"Put on":"Took off"} ${n}`, ()=>{ Engine.setWorn(ch, i, cb.checked); });
  });
  main.querySelectorAll("[data-armorfield]").forEach(el=>el.onchange=()=>{
    const [i,k]=el.dataset.armorfield.split("|"), e=ch.armor[Number(i)];
    if (!e) return;
    const v = el.type==="number" ? Math.max(0, Math.floor(Number(el.value)||0)) : el.value;
    commit("loadout", `${e.name||"Custom armor"}: ${k} → ${v===""?"—":v}`, ()=>{ e[k]=v; });
  });
  // W16: mods and the magazine (Decision 120), each one commit(). Firing and
  // Reload are bound on Main as well as Loadout, where a weapon line is drawn.
  main.querySelectorAll("[data-wmodadd]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.wmodadd), id=(main.querySelector(`[data-wmodpick="${i}"]`)||{}).value;
    const pre=Engine.addWeaponMod(clone(ch), i, id);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `Installed ${id} on ${loName("weapons", i)}`, ()=>{ Engine.addWeaponMod(ch, i, id); });
  });
  main.querySelectorAll("[data-wmodrm]").forEach(b=>b.onclick=()=>{
    const [i,at]=b.dataset.wmodrm.split("|").map(Number), id=((ch.weapons[i]||{}).mods||[])[at];
    commit("loadout", `Removed ${id} from ${loName("weapons", i)}`, ()=>{ Engine.removeWeaponMod(ch, i, at); });
  });
  main.querySelectorAll("[data-fire]").forEach(b=>b.onclick=()=>{
    const [i,mode]=b.dataset.fire.split("|"), idx=Number(i);
    const pre=Engine.fireWeapon(clone(ch), idx, mode);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `${pre.name||"Weapon"}: ${pre.mode||"fired"} −${pre.spent} (${pre.left}/${pre.max} left)`, ()=>{ Engine.fireWeapon(ch, idx, mode); });
  });
  main.querySelectorAll("[data-reload]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.reload), pre=Engine.reloadWeapon(clone(ch), i);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `Reloaded ${pre.name||"weapon"} (${pre.max})`, ()=>{ Engine.reloadWeapon(ch, i); });
  });
  main.querySelectorAll("[data-upgadd]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.upgadd), id=(main.querySelector(`[data-upgpick="${i}"]`)||{}).value;
    const pre=Engine.addUpgrade(clone(ch), i, id);
    if (!pre.ok){ alert(pre.why); return; }
    commit("loadout", `Installed ${id} in ${loName("armor", i)}`, ()=>{ Engine.addUpgrade(ch, i, id); });
  });
  main.querySelectorAll("[data-upgrm]").forEach(b=>b.onclick=()=>{
    const [i,at]=b.dataset.upgrm.split("|").map(Number), id=((ch.armor[i]||{}).upgrades||[])[at];
    commit("loadout", `Removed ${id} from ${loName("armor", i)}`, ()=>{ Engine.removeUpgrade(ch, i, at); });
  });
  const repair = full => b => b.onclick=()=>{
    const i=Number(full?b.dataset.repairfull:b.dataset.repairkit);
    const input = full ? { full:true } : { roll:(main.querySelector(`[data-repairroll="${i}"]`)||{}).value };
    const pre=Engine.repairArmor(clone(ch), i, input);
    if (!pre.ok){ alert(pre.why); return; }
    const kit = !full && Engine.carriedGear(ch, "field-repair-kit");   // W17: a use off the kit you carry
    commit("loadout", `${full?"Armorer":"Field Repair Kit"}: ${pre.name} +${pre.restored} Integrity${kit?`, ${kit.qty-1} kit use${kit.qty===2?"":"s"} left`:""}`, ()=>{
      Engine.repairArmor(ch, i, input);
      if (kit) Engine.useGear(ch, kit.index, 1);
    });
  };
  main.querySelectorAll("[data-repairkit]").forEach(repair(false));
  main.querySelectorAll("[data-repairfull]").forEach(repair(true));

  // Form toggle (e.g. Werewolf Human/Werewolf)
  main.querySelectorAll("[data-ptoggle]").forEach(b=>b.onclick=()=>{
    const [pid,opt]=b.dataset.ptoggle.split("|");
    commit("loadout", `${pid}: ${opt}`, ()=>{ ch.panelData[pid]=opt; });
  });

  // ── Admin: free edits (each logged via commit) ───────────────────────
  main.querySelectorAll("[data-admin-id]").forEach(inp=>inp.onchange=()=>{   // change, not input → one entry
    const k=inp.dataset.adminId;
    const v = inp.type==="number" ? (inp.value===""?null:Number(inp.value)) : inp.value;
    if (ch.identity[k]===v) return;
    commit("admin", `Admin: ${k} → ${v===null||v===""?"—":String(v).slice(0,40)}`, ()=>{ ch.identity[k]=v; });
  });
  main.querySelectorAll("[data-admin-pl]").forEach(sel=>sel.onchange=()=>{
    const v=sel.value; if (ch.creation.powerLevel===v) return;
    const nm=(D.powerLevels.find(p=>p.id===v)||{name:v}).name;
    commit("admin", `Admin: power level → ${nm}`, ()=>{ ch.creation.powerLevel=v; });
  });
  main.querySelectorAll("[data-admin-arch]").forEach(sel=>sel.onchange=()=>{
    const v=sel.value||null; if (ch.identity.archetype===v) return;
    if (!confirm("Change archetype? This clears all archetype-specific choices (focus/stat-bonus allocations, specialization, disciplines, natural advantages). It's logged, so a single undo restores everything.")){ sel.value=ch.identity.archetype||""; return; }
    const nm = v ? (D.archetypes.find(a=>a.id===v)||{name:v}).name : "none";
    commit("admin", `Admin: archetype → ${nm}`, ()=>{
      ch.identity.archetype=v;
      resetArchetypeChoices(ch);
    });
  });
  main.querySelectorAll("[data-admin-stat]").forEach(b=>b.onclick=()=>{
    const [id,field,d]=b.dataset.adminStat.split("|"), delta=Number(d);
    commit("admin", `Admin: ${id} ${field} ${delta>0?"+":""}${delta}`, ()=>{ ch.stats[id][field]=Math.max(0,(ch.stats[id][field]||0)+delta); });
  });
  main.querySelectorAll("[data-admin-skill]").forEach(b=>b.onclick=()=>{
    const [id,field,d]=b.dataset.adminSkill.split("|"), nm=(Engine.skillById(id)||{name:id}).name;
    if (field==="remove"){ commit("admin", `Admin: remove skill ${nm}`, ()=>{ delete ch.skills[id]; }); return; }
    const delta=Number(d);
    commit("admin", `Admin: ${nm} ${field} ${delta>0?"+":""}${delta}`, ()=>{
      if (!ch.skills[id]) ch.skills[id]={rank:0,ipe:0};
      ch.skills[id][field]=Math.max(0,(ch.skills[id][field]||0)+delta);
    });
  });
  main.querySelectorAll("[data-admin-addskill-go]").forEach(b=>b.onclick=()=>{
    const id=(main.querySelector("[data-admin-addskill]")||{}).value; if(!id) return;
    const nm=(Engine.skillById(id)||{name:id}).name;
    commit("admin", `Admin: add skill ${nm} @1`, ()=>{ if(!ch.skills[id]) ch.skills[id]={rank:1,ipe:0}; });
  });
  main.querySelectorAll("[data-admin-adv]").forEach(b=>b.onclick=()=>{
    // The row's position when the page drew it; commit() re-renders after
    // every change, so it can't go stale under the click (B16).
    const [at,op]=b.dataset.adminAdv.split("|"), row=ch.advantages[Number(at)];
    if (!row) return;
    const nm=(Engine.advById(row.id)||{name:row.id}).name;
    const find=()=>ch.advantages.includes(row) ? row : null;
    if (op==="x"){ commit("admin", `Admin: remove advantage ${nm}`, ()=>{ ch.advantages=ch.advantages.filter(a=>a!==find()); }); return; }
    const delta=Number(op);
    commit("admin", `Admin: ${nm} rank ${delta>0?"+":""}${delta}`, ()=>{
      const e=find(); if(!e) return; e.rank=Math.max(0,e.rank+delta);
      if (e.rank===0) ch.advantages=ch.advantages.filter(a=>a!==e);
    });
  });
  main.querySelectorAll("[data-admin-addadv-go]").forEach(b=>b.onclick=()=>{
    const id=(main.querySelector("[data-admin-addadv]")||{}).value; if(!id) return;
    const nm=(Engine.advById(id)||{name:id}).name;
    commit("admin", `Admin: add advantage ${nm}`, ()=>{ if(!ch.advantages.some(a=>a.id===id&&a.notes!=="natural")) ch.advantages.push({id, rank:1, notes:""}); });
  });
  main.querySelectorAll("[data-admin-dis]").forEach(b=>b.onclick=()=>{
    const [at,op]=b.dataset.adminDis.split("|"), row=ch.disadvantages[Number(at)];
    if (!row) return;
    const nm=(Engine.disById(row.id)||{name:row.id}).name;
    const find=()=>ch.disadvantages.includes(row) ? row : null;
    if (op==="x"){ commit("admin", `Admin: remove disadvantage ${nm}`, ()=>{ ch.disadvantages=ch.disadvantages.filter(d=>d!==find()); }); return; }
    const delta=Number(op);
    commit("admin", `Admin: ${nm} rank ${delta>0?"+":""}${delta}`, ()=>{
      const e=find(); if(!e) return; e.rank=Math.max(0,e.rank+delta);
      if (e.rank===0) ch.disadvantages=ch.disadvantages.filter(d=>d!==e);
    });
  });
  main.querySelectorAll("[data-admin-adddis-go]").forEach(b=>b.onclick=()=>{
    const id=(main.querySelector("[data-admin-adddis]")||{}).value; if(!id) return;
    const nm=(Engine.disById(id)||{name:id}).name;
    commit("admin", `Admin: add disadvantage ${nm}`, ()=>{ if(!ch.disadvantages.some(d=>d.id===id)) ch.disadvantages.push({id, rank:1, notes:""}); });
  });
  main.querySelectorAll("[data-admin-luck]").forEach(b=>b.onclick=()=>{
    const d=Number(b.dataset.adminLuck);
    commit("admin", `Admin: LUCK bonus ${d>0?"+":""}${d}`, ()=>{ ch.trackers.luck.bonus=Math.max(0,(ch.trackers.luck.bonus||0)+d); });
  });

  // Notes
  const nt=main.querySelector("[data-notes]");
  if (nt) nt.oninput=()=>{ ch.notes=nt.value; lite(); };
}

function refreshNav(){
  // re-evaluate Continue button + issue list without nuking input focus
  const st=STEPS[S.step]; if(!st) return;
  const nav=document.querySelector(".wiznav"); if(!nav) return;
  const issues=Engine.validate(st.id,S.ch);
  const btn=nav.querySelector('[data-nav="1"]');
  if(btn) btn.disabled=issues.some(i=>i.level==="error");
  const ul=document.querySelector(".issues"); if(ul) ul.remove();
  nav.insertAdjacentHTML("afterend", issuesHtml(issues));
  const lock=nav.querySelector("[data-lock]");
  if(lock) lock.disabled=issues.some(i=>i.level==="error");
}

function applyStep(key, delta){
  const ch=S.ch, [kind,...rest]=key.split("|"), id=rest.join("|");
  if (kind==="stat"){
    const v=ch.stats[id].base+delta;
    const pool=Engine.statPool(ch);
    if (v<D.statRules.base || v>D.statRules.max) return;
    if (delta>0 && pool.total!=null && Engine.statSpent(ch)>=pool.total-0) {/* allow; validation guards */}
    ch.stats[id].base=v;
  }
  if (kind==="skill"){
    const cur=ch.skills[id]?ch.skills[id].rank:0, v=cur+delta;
    const pl=Engine.powerLevel(ch);
    if (v<0||v>pl.maxSkillRank) return;
    if (v===0) delete ch.skills[id];
    else {
      const prev = ch.skills[id] || {};
      ch.skills[id] = Object.assign({}, prev, {rank:v, ipe:prev.ipe||0});
      Engine.trimSelections(ch,"skill",id);
    }
  }
  if (kind==="focus"){
    const cur=ch.archetypeChoices.focusAllocation[id]||0, v=cur+delta;
    if (v<0) return; ch.archetypeChoices.focusAllocation[id]=v;
    if (v===0) delete ch.archetypeChoices.focusAllocation[id];
  }
  if (kind==="wwbonus"){
    const cur=ch.archetypeChoices.statBonusAllocation[id]||0, v=cur+delta;
    if (v<0) return; ch.archetypeChoices.statBonusAllocation[id]=v;
    if (v===0) delete ch.archetypeChoices.statBonusAllocation[id];
  }
  if (kind==="natadv"){
    const list=ch.archetypeChoices.naturalAdvantages;
    let e=list.find(n=>n.id===id);
    if (!e && delta>0){ e={id, rank:0}; list.push(e); }
    if (!e) return;
    e.rank=Math.max(0,e.rank+delta);
    if (e.rank===0) ch.archetypeChoices.naturalAdvantages=list.filter(n=>n!==e);
    // Mirror into advantages with notes:"natural". The mirror is rebuilt from
    // the ledger each time, so any `selections` the row was carrying have to
    // be carried across — dropping them would silently wipe a player's picks
    // on every rank change.
    const keep = new Map(ch.advantages.filter(x=>x.notes==="natural" && x.selections)
                                      .map(x=>[x.id, x.selections]));
    ch.advantages=ch.advantages.filter(x=>x.notes!=="natural")
      .concat(ch.archetypeChoices.naturalAdvantages.map(n=>{
        const row={id:n.id, rank:n.rank, notes:"natural"};
        if (keep.has(n.id)) row.selections=keep.get(n.id);
        return row;
      }));
    Engine.trimSelections(ch,"advantage",id);
  }
  if (kind==="adv"){
    let e=ch.advantages.find(x=>x.id===id && x.notes!=="natural");
    if (!e && delta>0){ e={id, rank:0, notes:""}; ch.advantages.push(e); }
    if (!e) return;
    e.rank=Math.max(0,e.rank+delta);
    if (e.rank===0) ch.advantages=ch.advantages.filter(x=>x!==e);
    else Engine.trimSelections(ch,"advantage",id);
  }
  if (kind==="disadv"){
    let e=ch.disadvantages.find(x=>x.id===id);
    if (!e && delta>0){ e={id, rank:0, notes:""}; ch.disadvantages.push(e); }
    if (!e) return;
    e.rank=Math.max(0,e.rank+delta);
    if (e.rank===0) ch.disadvantages=ch.disadvantages.filter(x=>x!==e);
    else Engine.trimSelections(ch,"disadvantage",id);
  }
  if (kind==="luck"){ ch.trackers.luck.bonus=Math.max(0, ch.trackers.luck.bonus+delta); }
  if (kind==="disc"){
    const cur=ch.archetypeChoices.disciplines[id]||0, v=cur+delta;
    if (v<0) return; ch.archetypeChoices.disciplines[id]=v;
    if (v===0) delete ch.archetypeChoices.disciplines[id];
  }
  if (kind==="boost"){ const [type,tid]=[rest[0],rest.slice(1).join("|")]; Engine.addBoost(ch,type,tid,delta); }
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

function exportChar(){ exportCharacter(S.ch); }
// Any character, not only the open one: the replace guard exports the saved
// character it's about to overwrite (B18).
function exportCharacter(ch){
  const c=Engine.buildExport(ch);
  const name=(c.identity.name||"character").trim().replace(/[^\w\- ]+/g,"").replace(/\s+/g,"_")||"character";
  const blob=new Blob([JSON.stringify(c,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=name+".shadows.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
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
  renderFooter();
  wireThemeToggle();
  // The sticky header wraps on a narrow screen, so a sticky jump bar (W22)
  // reads its real height rather than --header-h.
  const hdr=document.querySelector("header.top");
  if (hdr){
    const setH=()=>document.documentElement.style.setProperty("--hdr-live", hdr.offsetHeight+"px");
    setH();
    if (window.ResizeObserver) new ResizeObserver(setH).observe(hdr);
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
