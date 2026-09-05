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
const APP_VERSION = "0.8.0";

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
    const body = SHEET_RENDER[S.section] ? SHEET_RENDER[S.section]() : SHEET_RENDER.main();
    // Main carries its own condition strip; every other tab gets the vitals bar.
    const bar = S.section==="main" ? "" : sheetVitalsBar(S.ch);
    const banner = S.admin ? adminBannerHtml() : "";
    $("main").innerHTML = bar + banner + body;
    renderDrawer();
    bindMain(); bindSheet();
    return;
  }
  closeVitals();
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
  // identity / history text
  main.querySelectorAll("[data-id]").forEach(inp=>inp.oninput=()=>{
    const k=inp.dataset.id;
    ch.identity[k] = inp.type==="number" ? (inp.value===""?null:Number(inp.value)) : inp.value;
    update(false); refreshNav();
  });
  // export / lock
  main.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>exportChar());
  main.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{
    ch.creation.locked=true;
    S.ch=Engine.migrate(Engine.buildExport(ch));
    exportChar(); clearDraft();
    S.screen="sheet"; S.section="main";
    window.scrollTo(0,0); update();
  });
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

  // Damage
  main.querySelectorAll("[data-dmg]").forEach(b=>b.onclick=()=>{
    const d=Number(b.dataset.dmg);
    commit("damage", `Damage ${d>0?"+":""}${d}`, ()=>{ ch.trackers.damage=Math.max(0,(ch.trackers.damage||0)+d); });
  });
  const ds=main.querySelector("[data-dmgset]");
  if (ds) ds.onchange=()=>{ const v=Math.max(0,Number(ds.value)||0); commit("damage", `Set damage → ${v}`, ()=>{ ch.trackers.damage=v; }); };
  main.querySelectorAll("[data-dmgheal]").forEach(b=>b.onclick=()=>commit("damage","Heal all",()=>{ ch.trackers.damage=0; }));

  // SAN
  main.querySelectorAll("[data-san]").forEach(b=>b.onclick=()=>{
    const d=Number(b.dataset.san);
    commit("san", `SAN loss ${d>0?"+":""}${d}`, ()=>{ ch.trackers.san.loss=Math.max(0,(ch.trackers.san.loss||0)+d); });
  });
  const ss=main.querySelector("[data-sanset]");
  if (ss) ss.onchange=()=>{ const v=Math.max(0,Number(ss.value)||0); commit("san", `Set SAN loss → ${v}`, ()=>{ ch.trackers.san.loss=v; }); };

  // LUCK
  main.querySelectorAll("[data-luckspend]").forEach(b=>b.onclick=()=>{
    const cost=Number(b.dataset.luckspend);
    if (Engine.luckState(ch).current>=cost) commit("luck", `LUCK spent −${cost}`, ()=>{ ch.trackers.luck.spent+=cost; });
  });
  main.querySelectorAll("[data-luckregain]").forEach(b=>b.onclick=()=>{
    if ((ch.trackers.luck.spent||0)>0) commit("luck","LUCK regained +1",()=>{ ch.trackers.luck.spent=Math.max(0,ch.trackers.luck.spent-1); });
  });

  // Generic archetype trackers (SFR / Exhaustion / panel trackers)
  main.querySelectorAll("[data-trk]").forEach(b=>b.onclick=()=>{
    const [pid,d]=b.dataset.trk.split("|"), delta=Number(d);
    commit("tracker", `${pid.toUpperCase()} ${delta>0?"+":""}${delta}`, ()=>{
      if (pid==="sfr") ch.trackers.sfr.spent=Math.max(0,(ch.trackers.sfr.spent||0)+delta);
      else if (pid==="exhaustion") ch.trackers.exhaustion=Math.max(0,(ch.trackers.exhaustion||0)+delta);
      else { const e=ch.trackers.panel[pid]||(ch.trackers.panel[pid]={value:0}); e.value=Math.max(0,(e.value||0)+delta); }
    });
  });
  main.querySelectorAll("[data-trkmax]").forEach(inp=>inp.onchange=()=>{
    const pid=inp.dataset.trkmax, mx=inp.value===""?null:Math.max(0,Number(inp.value));
    commit("tracker", `${pid.toUpperCase()} max → ${mx==null?"—":mx}`, ()=>{
      const e=ch.trackers.panel[pid]||(ch.trackers.panel[pid]={value:0}); e.max=mx;
    });
  });

  // Çredits
  main.querySelectorAll("[data-cr]").forEach(b=>b.onclick=()=>{
    const amt=num(main.querySelector("[data-cramt]"));
    const note=(main.querySelector("[data-crnote]")||{}).value||"";
    if (amt==null || !amt) return;
    const signed=Math.abs(amt)*Number(b.dataset.cr);
    commit("credits", `Çredits ${signed>0?"+":""}${signed}${note?` (${note})`:""}`, ()=>{ Engine.addCredits(ch, signed, note); });
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
  main.querySelectorAll("[data-rowadd]").forEach(b=>b.onclick=()=>{
    const key=b.dataset.rowadd;
    commit("loadout", `Add ${key} row`, ()=>{ panelRows(ch, key).push({}); });
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
    const [id,notes,op]=b.dataset.adminAdv.split("|"), nm=(Engine.advById(id)||{name:id}).name;
    const find=()=>ch.advantages.find(a=>a.id===id && (a.notes||"")===(notes||""));
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
    const [id,op]=b.dataset.adminDis.split("|"), nm=(Engine.disById(id)||{name:id}).name;
    const find=()=>ch.disadvantages.find(d=>d.id===id);
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

function exportChar(){
  const c=Engine.buildExport(S.ch);
  const name=(c.identity.name||"character").trim().replace(/[^\w\- ]+/g,"").replace(/\s+/g,"_")||"character";
  const blob=new Blob([JSON.stringify(c,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=name+".shadows.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

// ── Footer (registry / version chrome, collapsible) ──────────────────
const FOOTER_KEY = "shadows.footer";
function footerCollapsed(){ try{ return localStorage.getItem(FOOTER_KEY)!=="open"; }catch(e){ return true; } }
function renderFooter(){
  const f=$("footer"); if (!f) return;
  const collapsed = footerCollapsed();
  f.classList.toggle("collapsed", collapsed);
  f.innerHTML = `<span class="fmeta">NYTE CITY REGISTRY · GET DANGEROUS GAMES · app <b>${esc(APP_VERSION)}</b> · data <b>${esc(D.meta.gamedataVersion)}</b> · ${esc(D.meta.rulesetVersion)}</span>
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
  renderFooter();
  const closeMenu=()=>{ const m=$("hdrmenu"); if (m && !m.hidden){ m.hidden=true; const a=$("hdractions"), kb=a&&a.querySelector("[data-menu-toggle]"); if(kb) kb.setAttribute("aria-expanded","false"); } };
  document.addEventListener("keydown", e=>{
    if (e.key==="Escape"){ const dr=$("vdrawer"); if (dr && dr.classList.contains("open")) closeVitals(); closeMenu(); }
  });
  document.addEventListener("click", e=>{ const a=$("hdractions"); if (a && !a.contains(e.target)) closeMenu(); });
  renderHome();
}
boot();
/*UI-END*/
