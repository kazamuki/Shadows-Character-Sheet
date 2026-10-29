// GM mode's interface (Decisions 170–173): a GM's table, its storage in the
// browser, its screen and Home's door to it. A classic script sharing the
// global scope with shared.js, wizard.js and sheet.js (Decisions 86, 172); its
// engine is the Tables section of engine.js. Everything here sits behind the
// feature switch (Decision 173): featureOn("gm").
//
// The three places the other UI files call in: update() saves the open table
// (saveTable), renderMain() draws the table screen (renderTable, and
// renderTableChrome for the header), and Home draws its table list and routes
// an imported table or pack (gmTablesHtml, gmDoorHtml, bindGmHome, gmImportFile).

const GM_NOT_A_FILE = "That file isn't a character, a table or a pack.";

// ── Storage: one key per table, beside the roster's (Decision 171) ─────
// An entry is { table, section, changed, exported }, by the roster's rules:
// `changed` moves only forward and only when the table really differs, and
// `exported` is the `changed` it had when it last went to a file. Guarded
// throughout: the app works without storage.
const TABLE_PREFIX = "shadows.table.v1.";
const tableKey = id => TABLE_PREFIX + id;
let lastTableSaved = null;   // { id, json, changed, exported }: the open table as last written
function readTableEntry(key){
  try{
    const r=localStorage.getItem(key), v=r && JSON.parse(r);
    return v && typeof v==="object" && v.table && typeof v.table==="object" ? v : null;
  }catch(e){ return null; }
}
function savedTable(id){ return Engine.isTableId(id) ? readTableEntry(tableKey(id)) : null; }
function writeTableEntry(id, table, section, changed, exported){
  localStorage.setItem(tableKey(id), JSON.stringify({ table, section:section||TABLE_SECTIONS[0].id, changed, exported:exported||null }));
}
function saveTable(){
  const t=S.table, id=t && t.meta && t.meta.id; if (!Engine.isTableId(id)) return;
  const json=JSON.stringify(t);
  if (!lastTableSaved || lastTableSaved.id!==id){
    const e=savedTable(id);
    lastTableSaved={ id, json:e?JSON.stringify(e.table):null, changed:e&&e.changed, exported:e&&e.exported };
  }
  let changed=lastTableSaved.changed;
  if (json!==lastTableSaved.json || !changed){
    const was=Date.parse(changed); let n=Date.now();
    if (Number.isFinite(was) && n<=was) n=was+1;
    changed=new Date(n).toISOString();
  }
  try{
    writeTableEntry(id, t, S.tsection, changed, lastTableSaved.exported);
    lastTableSaved.json=json; lastTableSaved.changed=changed; saveFailed=false;
  }catch(e){ saveFailed=true; }
}
// Called on every export: the file now holds what's stored.
function markTableExported(id){
  const e=savedTable(id); if (!e) return;
  e.exported=e.changed;
  try{ localStorage.setItem(tableKey(id), JSON.stringify(e)); }catch(err){}
  if (lastTableSaved && lastTableSaved.id===id) lastTableSaved.exported=e.exported;
}
function removeTable(id){
  try{ localStorage.removeItem(tableKey(id)); }catch(e){}
  if (lastTableSaved && lastTableSaved.id===id) lastTableSaved=null;
}
// Every saved table, the most recently changed first.
function tableEntries(){
  const out=[];
  try{
    for (let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if (!k || k.indexOf(TABLE_PREFIX)!==0 || !Engine.isTableId(k.slice(TABLE_PREFIX.length))) continue;
      const e=readTableEntry(k); if (e) out.push(Object.assign(e, { id:k.slice(TABLE_PREFIX.length) }));
    }
  }catch(e){}
  const t = e => { const n=Date.parse(e.changed); return Number.isFinite(n) ? n : 0; };
  return out.sort((a,b)=>t(b)-t(a));
}
const tableUnexported = e => !e.exported || e.exported!==e.changed;

// Every change to the open table goes through here: run it, record it, stamp it, save it.
// `redraw` false keeps the keyboard where it is while a GM types. `label` names a press whose
// words the diff can't (Decision 212); it is read before the writer runs where the writer has
// already run, so a few call sites compute it first.
//
// The record is a diff against `tableBase`, the table as it stood after the last record or undo,
// not against a copy taken here: most Encounters presses call their Engine writer first and
// tableChange(()=>{}) after, so a copy taken now would miss the change.
let tableBase = null;   // { table, copy }
const tableCopy = t => clone(Object.assign({}, t, { audit:undefined }));
function rebaseTable(){ tableBase = S.table ? { table:S.table, copy:tableCopy(S.table) } : null; }
// Typing is an `input` event on a field; a press that happens while a field still has focus isn't.
function typingNow(){
  const ev=lastEvent, el=ev && ev.target;
  if (!ev || ev.type!=="input" || !el || !el.tagName) return false;
  const m=$("main");
  return !!m && m.contains(el) && (el.tagName==="TEXTAREA" || (el.tagName==="INPUT" && !/^(checkbox|radio|button|submit|reset|range|color|file)$/.test(el.type)));
}
function tableChange(fn, redraw=true, label){
  const t=S.table;
  fn();
  const typing=typingNow();
  let r=null;
  if (tableBase && tableBase.table===t) r=Engine.recordTableAction(t, tableBase.copy, label, undefined, { fold:typing });
  rebaseTable();
  t.meta.updated=new Date().toISOString();
  update(redraw);
  // A press shows its Undo; typing shows nothing, and a fold is the same entry.
  if (r && r.ok && !r.folded && !typing) paintTableToast(r.entry.label, t, r.entry, true);
}
// Take back the newest entry if it is `entry` on `table`. Returns its label, or null if it isn't
// the newest any more (a leftover toast, 107's rule). Used by the toast and by Activity.
function undoTableEntry(table, entry){
  if (S.table!==table || !entry) return null;
  const log=table.audit||[];
  if (log[log.length-1]!==entry) return null;
  const r=Engine.undoTableAction(table);
  if (!r.ok) return null;
  rebaseTable();
  table.meta.updated=new Date().toISOString();
  // Drafts over rows that may have moved close; a draft whose record is gone goes with it.
  S.encDmg=null; S.encHit=null; S.encCond=null; S.encReset=null; S.encWrap=null;
  if (S.closeOut && !table.sessions.some(x=>x.id===S.closeOut.id)) S.closeOut=null;
  if (S.intAdd && S.castOpen && !table.cast.some(x=>x.id===S.castOpen)) S.intAdd=null;
  update();
  return entry.label;
}
const tableName = (t, none="Untitled table") => String((t && t.meta && t.meta.name) || "").trim() || none;
function openTable(t, section){
  lastTableSaved=null; untouched=null;
  S={ screen:"table", ch:null, step:0, maxReached:0, section:"main", admin:false, table:t, tsection:TABLE_SECTIONS.some(s=>s.id===section) ? section : TABLE_SECTIONS[0].id };
  rebaseTable();
  update();
}
function exportTable(t){
  const c=Engine.migrateTable(clone(t));
  markTableExported(c.meta.id);
  const name=String(c.meta.name||"").trim().replace(/[^\w\- ]+/g,"").replace(/\s+/g,"_")||"table";
  const blob=new Blob([JSON.stringify(c,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=name+".shadows-table.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  return a.download;
}

// ── A file that would put an older copy over a newer saved one ─────────
// Worded as the character one is (guardReplace); a newer copy replaces
// silently. Copied, not shared: the roster's functions stay as they are.
function tableSupersedes(incoming, saved){
  if (!saved) return true;
  const a=Date.parse(incoming.meta.updated), b=Date.parse(saved.meta.updated);
  return Number.isFinite(a) && Number.isFinite(b) && a>=b;
}
function guardReplaceTable(saved, incoming, proceed){
  saved = saved && Engine.migrateTable(clone(saved));
  if (tableSupersedes(incoming, saved)){ proceed(); return; }
  const who=esc(tableName(saved));
  openModal({ title:`Open an older copy of ${tableName(saved)}?`,
    html:`<p>This file is an older copy of <b>${who}</b> than the one saved in this browser. Opening it puts it in place of the newer one.</p>
      <p class="step-note">Anything about <b>${who}</b> that you haven't exported is lost.</p>`,
    foot:`<button class="btn" data-replaceexport>Export ${who} first</button>
      <button class="btn primary" data-replacego>Open the older copy</button>
      <button class="btn" data-modalclose>Cancel</button>`,
    bind(body, foot){
      foot.querySelector("[data-replaceexport]").onclick=()=>{ exportTable(saved); closeModal(); proceed(); };
      foot.querySelector("[data-replacego]").onclick=()=>{ closeModal(); proceed(); };
    } });
}
// Home's one Import hands a table or a pack here, already known to be one
// (Decision 181): the third call-in point, widened.
function gmImportFile(raw, kind){
  if (kind==="pack") gmImportPack(raw); else gmImportTable(raw);
}
function gmImportTable(raw){
  const t=Engine.migrateTable(raw), id=t.meta.id;
  guardReplaceTable((savedTable(id)||{}).table, t, ()=>{
    openTable(t);
    markTableExported(id);   // the file just opened holds what's now saved
    const w=Engine.tableCheck(t); if (w.length) notice(w[0]);
  });
}

// ── Home: the door and the list ────────────────────────────────────────
function gmTableCardHtml(e){
  const t=Engine.migrateTable(clone(e.table)), id=esc(e.id), n=t.notes.length;
  const bits=[`Table`, `${n} note${n===1?"":"s"}`, whenText(e.changed)?"changed "+whenText(e.changed):""].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card" data-tcard="${id}">
    <div class="roster-top"><b class="roster-name">${esc(tableName(t))}</b></div>
    <div class="roster-meta">${bits}</div>
    ${tableUnexported(e)?`<div class="roster-unexported">Changes not exported yet</div>`:""}
    <div class="roster-actions">
      <button class="btn primary sm" data-topen="${id}">Open</button>
      <button class="btn sm" data-texport="${id}">Export</button>
      <button class="btn sm" data-tremove="${id}">Remove</button>
    </div></li>`;
}
// Switched off, both of these are empty and Home is as it was.
function gmTablesHtml(tables){
  return gmTableListHtml(tables) + gmPacksHtml();
}
function gmTableListHtml(tables){
  if (!featureOn("gm") || !tables.length) return "";
  return `<section class="roster tables" aria-labelledby="tables-h">
      <h2 id="tables-h" class="roster-h">Your tables</h2>
      <ul class="roster-list">${tables.map(gmTableCardHtml).join("")}</ul>
      <p class="step-note">Tables stay in this browser until you remove them, but it isn't a backup. The exported <span style="font-family:var(--mono)">.shadows-table.json</span> is the copy that lasts.</p>
    </section>`;
}
function gmDoorHtml(){
  if (!featureOn("gm")) return "";
  return `<p class="step-note" style="margin-top:8px">Running the game? <button class="btn sm" id="btn-run-table">Run a table</button></p>`;
}
function gmTableEntries(){ return featureOn("gm") ? tableEntries() : []; }

// One field, one primary button: Run a table and Rename share it. Enter does
// what the button does; Esc and Cancel change nothing.
function openNameModal({ title, value, yes, then }){
  openModal({ title,
    html:`<label class="field"><span>Table name</span>
      <input type="text" id="tbl-name" value="${esc(value||"")}" placeholder="Tuesday nights" autocomplete="off"></label>`,
    foot:`<button class="btn" data-modalclose>Cancel</button><button class="btn primary" data-nameyes>${esc(yes)}</button>`,
    bind(body, foot){
      const input=body.querySelector("#tbl-name"), go=()=>{ const v=input.value; closeModal(); then(v); };
      foot.querySelector("[data-nameyes]").onclick=go;
      input.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); go(); } });
      input.select();
    } });
}
function askRemoveTable(e){
  const t=Engine.migrateTable(clone(e.table)), who=esc(tableName(t));
  const risk = !e.exported ? `This browser holds the only copy of <b>${who}</b>. Once it's removed, it's gone.`
    : tableUnexported(e) ? `<b>${who}</b> has changes you haven't exported. Once it's removed, they're gone.`
    : `Your exported file of <b>${who}</b> isn't touched. Import it to bring the table back.`;
  openModal({ title:`Remove ${tableName(t)}?`,
    html:`<p>This removes <b>${who}</b> from this browser.</p><p class="step-note">${risk}</p>`,
    foot:`<button class="btn" data-modalclose>Cancel</button>
      <button class="btn" data-removeexport>Export, then remove</button>
      <button class="btn danger" data-removego>Remove</button>`,
    bind(body, foot){
      const go=()=>{ closeModal(); removeTable(e.id); renderHome(); };
      foot.querySelector("[data-removeexport]").onclick=()=>{ exportTable(t); go(); };
      foot.querySelector("[data-removego]").onclick=go;
      foot.querySelector("[data-modalclose]").focus();
    } });
}
function bindGmHome(tables){
  if (!featureOn("gm")) return;
  const main=$("main"), byId = id => tables.find(e=>e.id===id);
  bindPacksHome(main);
  const run=$("btn-run-table");
  if (run) run.onclick=()=>openNameModal({ title:"Run a table", yes:"Create", then:name=>{ openTable(Engine.newTable(name)); const b=document.querySelector("[data-snew]"); if (b) b.focus(); } });
  const open = e => e && openTable(Engine.migrateTable(clone(e.table)), e.section);
  main.querySelectorAll("[data-topen]").forEach(b=>b.onclick=()=>open(byId(b.dataset.topen)));
  main.querySelectorAll("[data-texport]").forEach(b=>b.onclick=()=>{ exportTable(byId(b.dataset.texport).table); renderHome(); });
  main.querySelectorAll("[data-tremove]").forEach(b=>b.onclick=()=>askRemoveTable(byId(b.dataset.tremove)));
  // A tap anywhere on a card opens it; its buttons keep their own.
  main.querySelectorAll("[data-tcard]").forEach(li=>li.onclick=ev=>{ if (!ev.target.closest("button")) open(byId(li.dataset.tcard)); });
}

// ── The table screen ───────────────────────────────────────────────────
// Sessions is first: a table opens on it (Decision 204), and reopens where it was left (171).
const TABLE_SECTIONS = [{ id:"sessions", label:"Sessions", ui:"tab_sessions" }, { id:"cast", label:"Cast", ui:"tab_archetype" }, { id:"city", label:"City", ui:"tab_traits" }, { id:"threats", label:"Threats", ui:"tab_loadout" }, { id:"encounters", label:"Encounters", ui:"tab_trackers" }, { id:"reference", label:"Reference", ui:"tab_skills" }, { id:"notes", label:"Notes", ui:"tab_notes" }];
// A twin of the sheet's tabButtonsHtml, with its own attribute, so the
// sheet's [data-sec] binder never sees these.
function tableTabButtonsHtml(){
  return TABLE_SECTIONS.map(sec=>{
    const cls=["tab", sec.id===S.tsection?"active":""].join(" ");
    const ico=sec.ui ? `<span class="tico">${uiIcon(sec.ui)}</span>` : "";
    return `<button class="${cls}" data-tsec="${sec.id}">${ico}${esc(sec.label)}</button>`;
  }).join("");
}
function renderTableChrome(){
  const ctx=$("brandctx"), nav=$("topnav"), act=$("hdractions"), t=S.table;
  document.title = `${tableName(t)} — Shadows`;
  if (!ctx || !nav) return;
  ctx.textContent = tableName(t);
  nav.innerHTML = tableTabButtonsHtml();
  // The tab you're on also takes you back from a member's page to the list.
  nav.querySelectorAll("[data-tsec]").forEach(b=>b.onclick=()=>{ S.tsection=b.dataset.tsec; S.backFromLine=null; S.placeRoute=null; S.factionRoute=null; S.clockEdit=null; S.backCity=null; if (S.tsection==="city"){ S.placeOpen=null; S.factionOpen=null; } if (S.tsection==="sessions") S.sessOpen=null; if (S.tsection==="cast"){ S.castOpen=null; S.backEnc=null; S.backSess=false; S.backClose=false; S.backCity=null; } if (S.tsection==="threats"){ S.threatOpen=null; S.threatGroup=null; S.threatMember=null; S.threatEnc=null; } window.scrollTo(0,0); update(); });
  showActiveTab(nav);
  if (!act) return;
  act.innerHTML = `<button type="button" class="hdr-act" data-tfind>Find</button><button type="button" class="hdr-act" data-tjot>Jot</button>
    <button class="kebab" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Table actions">⋮</button>
    <div class="hdr-menu" id="hdrmenu" hidden>
      <button data-trename="1">Rename</button>
      <button data-texport-open="1">Export .shadows-table.json</button>
      <button data-tactivity="1">Activity</button>
      <button data-whatsnew="1">What's new</button>
      <button data-thome="1">Home</button>
    </div>`;
  act.querySelector("[data-tfind]").onclick=openFind;
  act.querySelector("[data-tjot]").onclick=openJot;
  const menu=$("hdrmenu"), kb=act.querySelector("[data-menu-toggle]");
  kb.onclick=e=>{ e.stopPropagation(); const willOpen=menu.hidden; menu.hidden=!willOpen; kb.setAttribute("aria-expanded", willOpen?"true":"false"); };
  act.querySelector("[data-trename]").onclick=()=>{ menu.hidden=true; kb.setAttribute("aria-expanded","false");
    openNameModal({ title:"Rename table", value:t.meta.name, yes:"Save", then:name=>{ tableChange(()=>{ t.meta.name=name; }); const k=document.querySelector("[data-menu-toggle]"); if (k) k.focus(); } }); };
  act.querySelector("[data-texport-open]").onclick=()=>{ menu.hidden=true; exportTable(S.table); };
  act.querySelector("[data-tactivity]").onclick=()=>{ menu.hidden=true; kb.setAttribute("aria-expanded","false"); openActivity(); };
  act.querySelector("[data-thome]").onclick=()=>{ lastTableSaved=null; goHome(); };
}
function noteCardHtml(n){
  const id=esc(n.id);
  return `<div class="tbl-note" data-note="${id}">
    <label class="field"><span>Title</span><input type="text" data-ntitle="${id}" value="${esc(n.title)}" placeholder="Untitled note" autocomplete="off"></label>
    <label class="field"><span>Note</span><textarea data-ntext="${id}" placeholder="Leads, debts, names to remember.">${esc(n.text)}</textarea></label>
    <label class="field"><span>Session</span><select data-nsess="${id}"><option value="">None</option>${Engine.sessionList(S.table).map(s=>`<option value="${esc(s.id)}"${s.id===n.session ? " selected" : ""}>${esc(Engine.sessionTitle(s))}${s.date ? ` · ${esc(dayText(s.date))}` : ""}</option>`).join("")}</select></label>
    <button class="btn sm danger" data-ndel="${id}">Delete</button></div>`;
}
function notesTabHtml(t){
  return `<p><button class="btn primary" data-tnew>New note</button></p>
    ${t.notes.length ? t.notes.map(noteCardHtml).join("")
      : `<p class="step-note">Nothing on file yet. What you write here stays with the table and goes wherever its file goes.</p>`}`;
}
function renderTable(){
  // Only reachable with the switch on: with it off, Home draws instead.
  if (!featureOn("gm") || !S.table){ S=homeState(); return renderHome(); }
  closeVitals(); renderDrawer(); closePopover(false);
  if (!TABLE_SECTIONS.some(s=>s.id===S.tsection)) S.tsection=TABLE_SECTIONS[0].id;
  const t=S.table, main=$("main");
  const made=Date.parse(t.meta.created);
  const failed = saveFailed ? `<div class="import-issues" role="alert">${issuesHtml([{level:"error", msg:"This browser couldn't save your last change. Export the table now so nothing is lost."}])}</div>` : "";
  packsNow();   // a fresh read of the browser's packs on every full draw
  const threatPage = S.tsection==="threats" && threatPageNow();
  const encPage = S.tsection==="encounters" && encOpenNow();
  const sessPage = S.tsection==="sessions" && sessOpenNow();
  const placePage = cityPageNow(), factionPage = placePage ? null : factionPageNow();
  const onPage = (S.tsection==="cast" && castOpenMember()) || threatPage || encPage || sessPage || placePage || factionPage;
  const head = onPage ? "" :
    `<h1 class="step-title tbl-title">${esc(tableName(t))}</h1>
    <p class="step-note">Table${Number.isFinite(made)?` · created ${esc(new Date(made).toLocaleDateString())}`:""}</p>`;
  const body = S.tsection==="sessions" ? (sessPage ? (closeSheetNow(sessPage) ? closeSheetHtml(sessPage) : sessionPageHtml(sessPage)) : sessionsTabHtml(t))
    : S.tsection==="cast" ? (onPage ? castPageHtml(onPage) : castTabHtml(t))
    : S.tsection==="city" ? (placePage ? placePageHtml(placePage) : factionPage ? factionPageHtml(factionPage) : cityTabHtml(t))
    : S.tsection==="threats" ? (threatPage ? threatPage.html : threatsTabHtml(t)) : S.tsection==="encounters" ? encountersTabHtml(t) : S.tsection==="reference" ? referenceTabHtml() : notesTabHtml(t);
  // A redraw a press causes keeps the keyboard's place (Decision 164).
  keepPlace(main, ()=>{ main.innerHTML = failed + head + body; bindTable(); }, ["[data-cadd-name]", "[data-padd-name]", "[data-fadd-name]", "[data-tnew]", "[data-tsearch]", "[data-pslot]", "[data-enc-new]", "[data-thadd]", "[data-snew]", "[data-jumpfilter]"]);
}
function bindTable(){
  const main=$("main");
  main.onclick=main.onchange=main.oninput=main.onsubmit=main.onkeydown=null;   // the Encounters tab delegates; no other tab does
  if (main.querySelector("[data-tnew]")) bindNotes(main);
  else if (S.tsection==="sessions") bindSessions(main);
  else if (S.tsection==="cast") bindCast(main);
  else if (S.tsection==="city") bindCity(main);
  else if (S.tsection==="threats") bindThreats(main);
  else if (S.tsection==="encounters") bindEncounters(main);
  else if (S.tsection==="reference") bindReference(main);
}
function bindNotes(main){
  const titleOf = id => main.querySelector(`[data-ntitle="${id}"]`);
  // Saved on `input`, not `change`: a GM who types and goes Home at once
  // would otherwise lose the last words. No redraw while typing.
  main.querySelectorAll("[data-ntitle]").forEach(el=>el.oninput=()=>{
    tableChange(()=>Engine.editTableNote(S.table, el.dataset.ntitle, { title:el.value }), false); });
  main.querySelectorAll("[data-ntext]").forEach(el=>el.oninput=()=>{
    tableChange(()=>Engine.editTableNote(S.table, el.dataset.ntext, { text:el.value }), false); });
  main.querySelectorAll("[data-nsess]").forEach(el=>el.onchange=()=>{
    tableChange(()=>Engine.editTableNote(S.table, el.dataset.nsess, { session:el.value || null }), false); });
  main.querySelector("[data-tnew]").onclick=()=>{
    let id; tableChange(()=>{ id=Engine.addTableNote(S.table, { title:"", text:"" }).id; });
    const el=titleOf(id); if (el) el.focus();
  };
  main.querySelectorAll("[data-ndel]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.ndel, at=S.table.notes.findIndex(n=>n.id===id);
    askFirst({ title:"Delete this note?", text:"It isn't kept anywhere else unless you've exported the table.", yes:"Delete",
      then(){
        tableChange(()=>Engine.removeTableNote(S.table, id));
        const next=S.table.notes[at], el=next && $("main").querySelector(`[data-ntitle="${next.id}"]`) || $("main").querySelector("[data-tnew]");
        if (el) el.focus();
      } });
  });
}

// ── Activity (Decision 212) ────────────────────────────────────────────
// ⋮ → Activity: the table's log, newest first, with an Undo for the newest and a guarded Clear.
// A modal like Find's, not a tab. The page behind redraws after each Undo.
const activityTime = iso => {
  const d=new Date(iso); if (!Number.isFinite(d.getTime())) return "";
  const time=d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  return d.toDateString()===new Date().toDateString() ? time : `${d.toLocaleDateString([], { month:"short", day:"numeric" })}, ${time}`;
};
function activityHtml(){
  const log=S.table.audit||[];
  if (!log.length) return `<p class="step-note">Nothing to undo yet. Every change you make to this table shows here.</p>`;
  const newest=log[log.length-1];
  return `<p><button type="button" class="btn primary" data-act-undo>Undo: ${esc(newest.label)}</button></p>
    <ol class="act-list">${log.slice().reverse().map(e=>`<li><span class="act-label">${esc(e.label)}</span> <span class="act-time">${esc(activityTime(e.date))}</span></li>`).join("")}</ol>
    <p class="step-note">${log.length} action${log.length===1 ? "" : "s"} kept; the oldest go after 500.</p>
    <p><button type="button" class="btn danger" data-act-clear>Clear activity</button></p>`;
}
function openActivity(){
  openModal({ title:"Activity", returnTo:"[data-menu-toggle]", html:`<div data-act>${activityHtml()}</div>`,
    bind(body){
      const draw=()=>{
        body.querySelector("[data-act]").innerHTML=activityHtml();
        const u=body.querySelector("[data-act-undo]"), c=body.querySelector("[data-act-clear]");
        if (u) u.onclick=()=>{
          const log=S.table.audit||[], label=undoTableEntry(S.table, log[log.length-1]);
          if (label===null) return;
          draw(); showTableDone(label);
          takeFocus(body.querySelector("[data-act-undo]") || document.getElementById("modal-title"), true);
        };
        if (c) c.onclick=()=>askFirst({ title:"Clear this table's activity?", text:"You won't be able to undo anything before now.", yes:"Clear activity",
          then(){ tableChange(()=>Engine.clearTableActivity(S.table), false); openActivity(); takeFocus(document.getElementById("modal-title"), true); } });
      };
      draw();
      // Focus: Undo if there is one, else the close button (openModal's own rule picks the first field).
      const first=body.querySelector("[data-act-undo]"); if (first) first.focus();
    } });
}

// ── Find and Jot (Decision 208) ────────────────────────────────────────
// Both live in the header, so they work from any page of a table, a running encounter
// included. Find is Engine.tableSearch, computed on every keystroke and stored nowhere;
// S.findQ is the search as typed, S.jotDraft an unsaved jot, and both go with the table.
// The field is never redrawn while typing: the results below it are.
const FIND_KINDS = [["cast", "Cast"], ["session", "Sessions"], ["interaction", "Lines"], ["thread", "Threads"], ["note", "Notes"], ["encounter", "Encounters"], ["place", "Places"], ["faction", "Factions"], ["clock", "Clocks"]];
const findFieldLabel = f => f.indexOf("journal.")===0 ? (JOURNAL.find(j=>"journal."+j[0]===f) || [0, f])[1] : f;
const findSnipHtml = s => `${esc(s.before)}<mark>${esc(s.hit)}</mark>${esc(s.after)}`;
function findResultsHtml(q){
  if (String(q||"").trim().length < 2) return "";
  const hits=Engine.tableSearch(S.table, q);
  if (!hits.length) return `<p class="step-note">Nothing on the table matches.</p>`;
  return FIND_KINDS.map(([kind, label])=>{
    const of=hits.filter(h=>h.kind===kind);
    return of.length ? `<h3 class="find-h">${esc(label)} <span class="find-n">${of.length}</span></h3><ul class="find-list">${of.map(h=>
      `<li><button type="button" class="find-hit" data-fkind="${esc(h.kind)}" data-fid="${esc(h.id)}"><span class="find-title">${esc(h.title)}</span>
        <span class="find-field">${esc(findFieldLabel(h.field))}</span> <span class="find-snip">${findSnipHtml(h.snip)}</span></button></li>`).join("")}</ul>` : "";
  }).join("");
}
function openFind(){
  openModal({ title:"Find on this table", returnTo:"[data-tfind]",
    html:`<label class="field"><span>Search</span><input type="search" data-findq value="${esc(S.findQ||"")}" placeholder="Names, places, anything you wrote" autocomplete="off"></label>
      <p class="sr-only" data-findcount role="status" aria-live="polite"></p>
      <div data-findres>${findResultsHtml(S.findQ)}</div>`,
    bind(body){
      const q=body.querySelector("[data-findq]"), res=body.querySelector("[data-findres]");
      const count=body.querySelector("[data-findcount]");
      const redraw=()=>{ res.innerHTML=findResultsHtml(q.value); const n=res.querySelectorAll("[data-fkind]").length;
        count.textContent = q.value.trim().length<2 ? "" : n ? `${n} found` : "Nothing on the table matches."; };
      q.oninput=()=>{ S.findQ=q.value; redraw(); };
      res.onclick=ev=>{ const b=ev.target.closest("[data-fkind]"); if (!b) return; const kind=b.dataset.fkind, id=b.dataset.fid; closeModal(); openFound(kind, id); };
    } });
}
// A hit opens its record and lands on its title (Decision 164: focus never falls to <body>).
function openFound(kind, id){
  S.backFromLine=null; S.placeRoute=null; S.factionRoute=null; S.backCity=null;
  const t=S.table, main=()=>$("main");
  const land=sel=>{ const el=main().querySelector(sel); if (el){ takeFocus(el, true); if (el.scrollIntoView) el.scrollIntoView({ block:"center" }); } return el; };
  const toMember=cid=>{ S.tsection="cast"; S.castOpen=cid; S.castView="cast"; S.backEnc=null; S.backSess=false; S.backClose=false; S.backCity=null; S.castFrom=null; S.intAdd=null; };
  const toSession=sid=>{ S.tsection="sessions"; S.sessOpen=sid; if (S.closeOut) S.closeOut.view=false; };
  window.scrollTo(0,0);
  if (kind==="cast"){ toMember(id); update(); land("[data-ctitle]"); }
  else if (kind==="session"){ toSession(id); update(); land("h1"); }
  else if (kind==="interaction"){
    const x=(t.interactions||[]).find(i=>i.id===id); if (!x) return;
    const live=(x.cast||[]).find(l=>l && (t.cast||[]).some(n=>n.id===l.id));
    if (x.session && (t.sessions||[]).some(s=>s.id===x.session)){ toSession(x.session); update(); land(attrSel("data-sline", id)) || land("h1"); }
    else if (live){ toMember(live.id); update(); land(attrSel("data-int", id)) || land("[data-ctitle]"); }
    else { S.tsection="cast"; S.castOpen=null; S.castView="crew"; update(); land("h1, h2"); }
  }
  else if (kind==="thread"){ S.tsection="sessions"; S.sessOpen=null; renderTableChrome(); showThread(id); }
  else if (kind==="note") openNote(id);
  else if (kind==="place"){ S.tsection="city"; S.placeOpen=id; S.factionOpen=null; S.cityView="places"; update(); land("[data-ptitle]"); }
  else if (kind==="faction"){ S.tsection="city"; S.factionOpen=id; S.placeOpen=null; S.cityView="factions"; update(); land("[data-ftitle]"); }
  else if (kind==="clock"){
    const c=(t.clocks||[]).find(x=>x && x.id===id), on=c && c.on, owner=on && (on.kind==="faction" || on.kind==="place" || on.kind==="encounter") ? on.id : null;
    if (!owner) return;
    if (on.kind==="encounter"){
      S.tsection="encounters"; S.encOpen=owner; S.encWrap=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; S.encDelay=null; S.encPick=false; S.encQ=""; S.encCodex=false; S.encCodexQ="";
      update(); land(attrSel("data-clock", id) + " [data-clockname]") || land("[data-enc-h]") || land("[data-enc-title]") || land("h1");
      return;
    }
    S.tsection="city"; S.cityView=on.kind==="place" ? "places" : "factions";
    S.factionOpen=on.kind==="faction" ? owner : null; S.placeOpen=on.kind==="place" ? owner : null; update();
    land(attrSel("data-clock", id) + " [data-clockname]") || land(on.kind==="place" ? "[data-ptitle]" : "[data-ftitle]");
  }
  else if (kind==="encounter"){
    S.tsection="encounters"; S.encOpen=id; S.encWrap=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; S.encPick=false; S.encQ=""; S.encCodex=false; S.encCodexQ="";
    update(); land("[data-enc-h]") || land("[data-esrc], [data-efinish]:not([disabled]), [data-enext]") || land("[data-enc-title]") || land("h1");
  }
}
// The Notes tab with one note's card in view and its Note field focused.
function openNote(id){
  S.tsection="notes"; window.scrollTo(0,0); update();
  const el=$("main").querySelector(attrSel("data-ntext", id)); if (el){ el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block:"center" }); }
}
// Where a jot would go today, said before it is saved (Decision 203's rule, read for the line).
function jotWhere(){
  const today=Engine.sessionList(S.table).filter(s=>s.date===localDay());
  return today.length===1 ? `Goes with ${Engine.sessionTitle(today[0])}.`
    : today.length ? "Goes on the table's notes. More than one session is dated today."
    : "Goes on the table's notes. No session is dated today.";
}
function openJot(){
  openModal({ title:"Jot it down", returnTo:"[data-tjot]",
    html:`<label class="field"><span>Jot</span><textarea data-jottext rows="5" autofocus placeholder="A name, a debt, a line to keep.">${esc(S.jotDraft||"")}</textarea></label>
      <p class="step-note" data-jotwhy role="alert"></p>
      <p class="step-note">${esc(jotWhere())}</p>`,
    foot:`<button type="button" class="btn primary" data-jotsave>Save</button> <button type="button" class="btn" data-modalclose>Cancel</button>`,
    bind(body, foot){
      const ta=body.querySelector("[data-jottext]"), why=body.querySelector("[data-jotwhy]");
      ta.oninput=()=>{ S.jotDraft=ta.value; why.textContent=""; };
      const save=()=>{
        const text=ta.value;
        // Nothing written, nothing saved: tableChange would stamp the table as changed.
        if (!text.trim()){ why.textContent="Write something first."; ta.focus(); return; }
        let r; tableChange(()=>{ r=Engine.addTableNote(S.table, { text, date:localDay(), jot:true }); }, false);
        if (!r.ok){ why.textContent=r.why; ta.focus(); return; }
        S.jotDraft="";
        const note=S.table.notes.find(n=>n.id===r.id);
        closeModal();
        // The page under the jot stays as it was, unless it is the list the jot lands in.
        if (S.tsection==="notes" || (S.tsection==="sessions" && note && S.sessOpen && S.sessOpen===note.session)) renderTable();
        notice("Jotted.");
        const j=document.querySelector("[data-tjot]"); if (j) j.focus();
      };
      foot.querySelector("[data-jotsave]").onclick=save;
      ta.onkeydown=ev=>{ if (ev.key==="Enter" && (ev.ctrlKey || ev.metaKey)){ ev.preventDefault(); save(); } };
    } });
}

// ── The Reference (Decision 207) ───────────────────────────────────────
// Everything a GM looks up, on one page that reads the data and the slotted packs on every
// draw and stores nothing. State is on S: S.refQ, the search as typed. The field is never
// redrawn while typing: the panels and the chips below it are. The chips wrap, all in
// view at every width (Decision 209).
const refItemHtml = i => {
  const sep = !i.term || !i.text ? "" : /[.!?]$/.test(i.term) ? " " : " — ";
  return `<li>${i.term ? `<b>${esc(i.term)}</b>` : ""}${sep}${esc(i.text)}${i.more.map(m=>`<span class="ref-more">${esc(m)}</span>`).join("")}</li>`;
};
function refPartHtml(p, panelTitle){
  const label = p.title || panelTitle;
  const table = p.rows.length || p.columns.length ? `<div class="ref-frame" role="region" tabindex="0" aria-label="${esc(label)}"><table class="ref">
      ${p.columns.length ? `<thead><tr>${p.columns.map(c=>`<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>` : ""}
      <tbody>${p.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : "";
  return `<div class="ref-part">${p.title ? `<h3 class="ref-sub">${esc(p.title)}</h3>` : ""}${p.text ? `<p class="ref-text">${esc(p.text)}</p>` : ""}${table}${
    p.footText ? `<p class="ref-foot">${esc(p.footText)}</p>` : ""}${p.items.length ? `<ul class="ref-items">${p.items.map(refItemHtml).join("")}</ul>` : ""}</div>`;
}
function refPanelsHtml(view){
  if (!view.length)
    return `<p class="step-note">Nothing in the reference matches.</p><p><button class="btn sm" data-refclear>Clear the search</button></p>`;
  return view.map(p=>{
    const none = !p.parts.length;
    const body = !none ? p.parts.map(x=>refPartHtml(x, p.title)).join("")
      : `<p class="step-note">${packsMemo.length>1 ? "The slotted packs have no tiers, roles, origins or traits." : packsMemo.length ? "The slotted pack has no tiers, roles, origins or traits." : "Slot a pack on the Threats tab, and its tiers, roles, origins and traits show here."}</p>`;
    return `<section class="ref-panel"><h2 class="ref-h" id="gr-${esc(p.id)}" tabindex="-1">${esc(p.title)}</h2>${body}</section>`;
  }).join("");
}
const refChipsHtml = view => view.map(p=>`<button class="jump" data-jump="gr-${esc(p.id)}">${esc(p.title)}</button>`).join("");
function referenceTabHtml(){
  const view=Engine.gmReference(packsMemo, { q:S.refQ||"" });
  return `${jumpBarHtml(view.map(p=>({ id:`gr-${p.id}`, label:p.title })), { sticky:true, wrap:true, filter:{ value:S.refQ||"", placeholder:"Search the reference" } })}
    <div data-refpanels>${refPanelsHtml(view)}</div>`;
}
function redrawReference(main){
  const view=Engine.gmReference(packsMemo, { q:S.refQ||"" });
  main.querySelector("[data-refpanels]").innerHTML=refPanelsHtml(view);
  main.querySelector(".jump-row").innerHTML=refChipsHtml(view);
  const n=main.querySelector("[data-jumpcount]"); if (n) n.textContent=(S.refQ||"").trim() ? `${view.length} ${view.length===1 ? "panel" : "panels"}` : "";
  bindReferenceBody(main);
}
function bindReferenceBody(main){
  main.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>jumpTo(b.dataset.jump));
  const clear=main.querySelector("[data-refclear]");
  if (clear) clear.onclick=()=>{ S.refQ=""; const q=main.querySelector("[data-jumpfilter]"); q.value=""; redrawReference(main); q.focus(); };
}
function bindReference(main){
  const q=main.querySelector("[data-jumpfilter]");
  q.oninput=()=>{ S.refQ=q.value; redrawReference(main); };
  bindReferenceBody(main);
}

// ── The cast (Decisions 174–176) ───────────────────────────────────────
// State is on S, so it goes with the open table and no further: S.castOpen
// (a member's id, or null for the list), S.castQ and S.castStatus (the filters).
const CAST_STATUS_LABELS = { alive:"Alive", dead:"Dead", missing:"Missing", gone:"Out of the picture" };
const CAST_FILTER_STATUSES = ["inplay","alive","all","dead","missing","gone"];
const castStatusLabel = s => s==="all" ? "All" : s==="inplay" ? "In play" : CAST_STATUS_LABELS[s] || "Alive";
// The affiliation filter names what the cast has: one that has since left it filters nothing.
const castAffNow = () => { const w=String(S.castAff||"").toLowerCase(); return w && Engine.castAffiliations(S.table).find(a=>a.toLowerCase()===w) || ""; };
const castFilterNow = () => ({ q:S.castQ||"", status:S.castStatus||"inplay", affiliation:castAffNow() });
// The eight kinds, read from the crew's side (Decisions 177, 193), in the order they're pressed.
const INTERACTION_KINDS = [["shared","Told them"], ["learned","Learned from them"], ["helped","Helped them"], ["wronged","Wronged them"],
  ["killed","Killed them"], ["owes","Owes them"], ["owed","They owe"], ["fought","Fought them"]];
const splitList = (v, re) => String(v).split(re).map(s=>s.trim()).filter(Boolean);
// The add row's draft: kept while the page is open, so three lines in a scene are three Enters.
const intAdd = () => S.intAdd || (S.intAdd={ kind:null, crew:"", date:localDay(), what:"", where:"" });
// Where (Decision 243): the table's places by title, and none. A line whose place was removed shows its kept name, struck, until it is changed.
function whereSelectHtml(attr, x){
  const places=Engine.placeList(S.table, {}), cur=x && x.place && typeof x.place==="object" ? x.place : null;
  const mine=cur ? cur.id : ((x && x.where) || "");
  const live=places.some(p=>p.id===mine);
  const gone=cur && !live ? `<option value="~gone" selected>${esc(Engine.linkName(S.table, cur).name)} (removed)</option>` : "";
  return `<label class="field"><span>Where</span><select ${attr}>${gone}<option value=""${!live && !gone ? " selected" : ""}>Nowhere in particular</option>${places.map(p=>
    `<option value="${esc(p.id)}"${p.id===mine && live ? " selected" : ""}>${esc(Engine.placeTitle(S.table, p))}</option>`).join("")}</select></label>`;
}
const kindToggleHtml = (attr, current, label, prefix="") => `<div class="form-toggle int-kinds" role="group" aria-label="${esc(label)}">${INTERACTION_KINDS.map(([k,name])=>
  `<button type="button" ${attr}="${esc(prefix+k)}" class="${k===current?"on":""}" aria-pressed="${k===current}">${esc(name)}</button>`).join("")}</div>`;
function castOpenMember(){ return S.castOpen ? S.table.cast.find(n=>n.id===S.castOpen) || null : null; }
const numAttr = v => typeof v==="number" && Number.isFinite(v) ? v : "";
const castSigned = n => n===0 ? "0" : signed(n);   // sheet.js's, with a zero
const hasNumber = b => Engine.blockHasNumber(b);

function castCardHtml(n){
  const id=esc(n.id);
  const bits=[ n.affiliations.length ? n.affiliations.join(" / ") : "", n.origin, n.npcRoles.length ? n.npcRoles.join(" / ") : "", n.enemyRole ? `Enemy: ${n.enemyRole}` : "",
    n.tier!==null ? `Tier ${n.tier}` : "", n.status!=="alive" ? castStatusLabel(n.status) : "", hasNumber(n.block) ? "Stat block" : ""
  ].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card cast-card" data-ccard="${id}" data-status="${esc(n.status)}">
    <button class="cast-open" data-copen="${id}">${esc(n.name.trim() || "Unnamed")}</button>
    ${n.flavor ? `<div class="cast-line">${esc(n.flavor)}</div>` : ""}
    ${bits ? `<div class="roster-meta cast-meta">${bits}</div>` : ""}</li>`;
}
function castListHtml(t){
  if (S.castView==="crew") return crewViewHtml(t);
  if (!t.cast.length) return `<p class="step-note">Nobody yet. The city fills up fast.</p>`;
  const list=Engine.castFilter(t, castFilterNow());
  if (!list.length) return `<p class="step-note">No one matches.</p><p><button class="btn sm" data-cclear>Clear the filter</button></p>`;
  return `<ul class="roster-list">${list.map(castCardHtml).join("")}</ul>`;
}
// A line as the engine's sentence (Decision 241). The engine builds the parts; this only joins them.
// o.where is the prefix of a name's data-cwhere (Back lands on it), o.own a member shown as plain text
// on their own page, o.ownPlace a place shown as plain text on its own page (Decision 243), and o.plain drops every button (the open line's live sentence, the wrap-up's preview).
const goneHtml = name => `<s>${esc(name)}</s><span class="vh">, removed</span>`;
function sentenceHtml(t, x, o={}){
  let ci=0;
  return Engine.interactionSentence(t, x).parts.map(p=>{
    if (p.kind==="text") return esc(p.text);
    if (p.kind==="day") return `<span class="int-date">${esc(dayText(p.date))}</span>`;
    if (p.kind==="cast"){
      const i=ci++;
      if (o.plain) return esc(p.name);
      if (p.gone) return goneHtml(p.name);
      if (p.id===o.own) return esc(p.name);
      return `<button class="cast-open int-who" data-copen="${esc(p.id)}"${o.where ? ` data-cwhere="${esc(o.where+"|"+i)}"` : ""}>${esc(p.name)}</button>`;
    }
    if (o.plain) return esc(p.name);
    if (p.kind==="place")
      return p.gone ? goneHtml(p.name) : p.id===o.ownPlace ? esc(p.name)
        : `<button class="cast-open int-who int-place" data-popenline="${esc(x.id)}|${esc(p.id)}${o.where ? "|"+esc(o.where) : ""}">${esc(p.name)}</button>`;
    return p.gone ? goneHtml(p.name)
      : `<button class="cast-open int-who int-fight" data-eopenline="${esc(x.id)}|${esc(p.id)}${o.where ? "|"+esc(o.where) : ""}">${esc(p.name)}</button>`;
  }).join("");
}
// Who knows what (Decision 179): the same records, by crew name.
function crewViewHtml(t){
  const groups=Engine.crewView(t, { q:S.castQ||"" });
  if (!groups.length) return S.castQ && String(S.castQ).trim() ? `<p class="step-note">No one matches.</p>` : `<p class="step-note">Nothing between the crew and anyone yet.</p>`;
  return groups.map(g=>`<section class="crew-group"><h2 class="cast-h crew-name">${esc(g.name || "No one named")}</h2><ul class="int-list">${g.interactions.map(x=>{
    return `<li class="int-line">${sentenceHtml(t, x, { where:`${g.name.trim().toLowerCase()}|${x.id}` })}</li>`; }).join("")}</ul></section>`).join("");
}
// A day as the GM's locale shows it. Built from its parts, so it is the day it says in any zone.
function dayText(day){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(day||""); if (!m) return "";
  return new Date(+m[1], +m[2]-1, +m[3]).toLocaleDateString();
}
function castTabHtml(t){
  const f=castFilterNow(), crew=S.castView==="crew", affs=Engine.castAffiliations(t);
  const view=[["cast","The cast"],["crew","Who knows what"]];
  return `<div class="form-toggle cast-view" role="group" aria-label="View">${view.map(([k,name])=>
      `<button type="button" data-cview="${k}" class="${(k==="crew")===crew?"on":""}" aria-pressed="${(k==="crew")===crew}">${esc(name)}</button>`).join("")}</div>
    ${crew ? "" : `<div class="cast-add">
      <label class="field"><span>Name</span><input type="text" data-cadd-name placeholder="Who did they meet?" autocomplete="off"></label>
      <label class="field"><span>Who they are</span><input type="text" data-cadd-line placeholder="One line: who they are" autocomplete="off"></label>
      <button class="btn primary" data-cadd>Add</button></div>`}
    <div class="cast-filters">
      <label class="field"><span>Search</span><input type="search" data-csearch placeholder="${crew?"Search who knows what":"Search the cast"}" autocomplete="off" value="${esc(f.q)}"></label>
      ${crew ? "" : `<label class="field"><span>Show</span><select data-cstatus>${CAST_FILTER_STATUSES.map(s=>`<option value="${s}"${s===f.status?" selected":""}>${esc(castStatusLabel(s))}</option>`).join("")}</select></label>
      <label class="field"><span>Affiliation</span><select data-caff><option value="">Any</option>${affs.map(a=>`<option value="${esc(a)}"${a===f.affiliation?" selected":""}>${esc(a)}</option>`).join("")}</select></label>`}
    </div>
    <div data-castlist>${castListHtml(t)}</div>`;
}

// ── A member's page ──
const castText = (n, key, label, ph, area, list) => `<label class="field"><span>${esc(label)}</span>${area
  ? `<textarea data-cf="${key}" placeholder="${esc(ph||"")}">${esc(n[key])}</textarea>`
  : `<input type="text" data-cf="${key}" value="${esc(n[key])}" placeholder="${esc(ph||"")}" autocomplete="off"${list ? ` list="${list}"` : ""}>`}</label>`;
const PACK_KINDS = [["universal","Universal"], ["origin","Origin"], ["signature","Signature"]];
const packKindLabel = k => (PACK_KINDS.find(x=>x[0]===k) || [])[1] || "";
const foldName = v => String(v||"").trim().toLowerCase();
function castStatBlockHtml(n){
  const packs=packsMemo.length, hasTraits=packs && Engine.packTraits(packsMemo, {}).length>0;
  const b=n.block || {}, st=b.stats||{}, au=b.authored||{};
  const num = (attr, v, label) => `<input type="number" step="1" inputmode="numeric" ${attr} value="${numAttr(v)}" aria-label="${esc(label)}">`;
  const stats = D.stats.map(s=>`<div class="cast-stat"><span class="cast-stat-id">${esc(s.id)}</span>${num(`data-cstat="${esc(s.id)}"`, st[s.id], s.name||s.id)}<span class="cast-fig" data-cbonus="${esc(s.id)}"></span>${packs ? `<span class="cast-fig cast-mod" data-cmod="${esc(s.id)}"></span>` : ""}</div>`).join("");
  const authored = D.derived.filter(d=>d.type==="sumOfModifiers").map(d=>`<div class="cast-stat"><span class="cast-stat-id">${esc(d.id)}</span>${num(`data-cauth="${esc(d.id)}"`, au[d.id], d.name||d.id)}<span class="cast-fig" data-cformula="${esc(d.id)}"></span></div>`).join("");
  const skills = (b.skills||[]).map((k,i)=>`<div class="cast-row" data-cskill="${i}">
      <input type="text" data-cskname="${i}" value="${esc(k.name)}" placeholder="Skill" aria-label="Skill name" autocomplete="off">
      <input type="number" step="1" inputmode="numeric" data-csktotal="${i}" value="${numAttr(k.total)}" aria-label="Total" class="cast-total">
      <button class="btn sm danger" data-cskdel="${i}" aria-label="Remove skill">Remove</button></div>`).join("");
  const lines = (key, label) => `<div class="cast-lines"><span class="cast-sub">${esc(label)}</span>${(b[key]||[]).map((l,i)=>`<div class="cast-row" data-cline="${key}|${i}">
      <input type="text" data-clinev="${key}|${i}" value="${esc(l)}" aria-label="${esc(label)} line" autocomplete="off">
      <button class="btn sm danger" data-clinedel="${key}|${i}" aria-label="Remove line">Remove</button></div>`).join("")}
      <button class="btn sm" data-clineadd="${key}">Add a line</button></div>`;
  const traits = (b.traits||[]).map((k,i)=>`<div class="cast-trait" data-ctrait="${i}">
      <input type="text" data-ctname="${i}" value="${esc(k.name)}" placeholder="Trait" aria-label="Trait name" autocomplete="off">
      <textarea data-cttext="${i}" aria-label="Trait text" placeholder="What it does.">${esc(k.text)}</textarea>
      <button class="btn sm danger" data-ctdel="${i}">Remove</button></div>`).join("");
  return `<h2 class="cast-h">Stat block</h2>
    <p class="cast-health" data-chealth-row hidden>Health <b data-chealth></b></p>
    ${packs ? `<p class="cast-guide" data-cmodnote hidden></p><p class="cast-guide" data-cstatguide hidden></p>` : ""}
    <div class="cast-stats">${stats}${authored}</div>
    <div class="cast-lines"><span class="cast-sub">Skills</span>${skills}<button class="btn sm" data-cskadd>Add a skill</button></div>
    ${lines("armor","Armor")}${lines("gear","Gear")}
    <div class="cast-lines"><span class="cast-sub">Traits</span>${packs ? `<p class="cast-guide" data-ctcount hidden></p><p class="cast-guide" data-ctguide hidden></p>` : ""}${traits}
      <button class="btn sm" data-ctadd>Add a trait</button>${hasTraits ? ` <button class="btn sm" data-ctpick>Add from a pack</button>` : ""}</div>`;
}
// What passed between this member and the crew (Decisions 177–179, 241): each line reads as its sentence;
// Edit opens one at a time (S.intEdit), with its fields in the add row's order.
const intEditId = n => { if (S.intEditOf!==n.id) S.intEdit=null; return S.intEdit; };
const sentTag = x => { const sess=sessionById(x.session); return sess ? `<span class="int-session">${esc(Engine.sessionTitle(sess))}</span>` : ""; };
function interactionRowHtml(x, n){
  const id=esc(x.id), tag=sentTag(x);
  if (intEditId(n)!==x.id)
    return `<li class="int-line" data-int="${id}"><span class="int-sentence">${sentenceHtml(S.table, x, { own:n.id })}</span> ${tag}
      <button type="button" class="btn sm int-edit" data-iedit="${id}" aria-label="Edit this line">Edit</button></li>`;
  return `<li class="int-row" data-int="${id}">
    <p class="int-sentence" data-isent="${id}">${sentenceHtml(S.table, x, { plain:true })} ${tag}</p>
    <div class="int-fields">
      <label class="field"><span>Crew</span><input type="text" data-icrew="${id}" list="crew-names" value="${esc(x.crew.join(", "))}" placeholder="Crew" autocomplete="off"></label>
    </div>
    ${kindToggleHtml("data-ikind", x.kind, "What kind", x.id+"|")}
    <div class="int-fields">
      <label class="field"><span>What</span><textarea rows="2" data-itext="${id}" placeholder="What passed between them">${esc(x.text)}</textarea></label>
      <label class="field"><span>When</span><input type="date" data-idate="${id}" value="${esc(x.date||"")}"></label>
      ${whereSelectHtml(`data-iwhere="${id}"`, x)}</div>
    <p class="int-actions"><button type="button" class="btn sm danger" data-idel="${id}">Delete</button>
      <button type="button" class="btn sm primary" data-idone="${id}">Done</button></p></li>`;
}
function castInteractionsHtml(n){
  const a=intAdd(), rows=Engine.interactionsFor(S.table, n.id);
  const names=Engine.crewView(S.table, {}).map(g=>g.name);
  return `<h2 class="cast-h">Between them and the crew</h2>
    <datalist id="crew-names">${names.map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
    <div class="int-add">
      <div class="int-fields">
        <label class="field"><span>Crew</span><input type="text" data-iacrew list="crew-names" value="${esc(a.crew)}" placeholder="Who from the crew" autocomplete="off"></label></div>
      ${kindToggleHtml("data-iakind", a.kind, "What kind")}
      <div class="int-fields">
        <label class="field"><span>What</span><input type="text" data-iwhat value="${esc(a.what||"")}" placeholder="What passed between them" autocomplete="off"></label>
        <label class="field"><span>When</span><input type="date" data-iadate value="${esc(a.date||"")}"></label>
        ${whereSelectHtml("data-iawhere", { where:a.where })}
        <button class="btn primary" data-iadd>Add</button></div></div>
    <ul class="int-list" data-intlist>${rows.map(x=>interactionRowHtml(x, n)).join("")}</ul>`;
}
// The pack's names for the fields the GM types (Decision 184): a list to pick from, and the roles as toggles.
function castRolesHtml(n){
  const roles=Engine.packChoices(packsMemo).npcRoles;
  return roles.length ? `<div class="form-toggle cast-roles" role="group" aria-label="Roles in the pack">${roles.map(r=>
    `<button type="button" data-crole="${esc(r)}" aria-pressed="false">${esc(r)}</button>`).join("")}</div>` : "";
}
const datalistHtml = (id, names) => names.length ? `<datalist id="${id}">${names.map(x=>`<option value="${esc(x)}"></option>`).join("")}</datalist>` : "";
function castPageHtml(n){
  const c=Engine.packChoices(packsMemo), packs=packsMemo.length, back=encBackTitle() || (S.backClose && S.closeOut ? "the close-out" : S.backSess ? (sessOpenNow() ? Engine.sessionTitle(sessOpenNow()) : "sessions") : cityBackTitle());
  return `<p><button class="btn sm" data-cback>${back ? `Back to ${esc(back)}` : "Back to the cast"}</button>${encAddBtnHtml("data-cenc", "")}</p>
    <h1 class="step-title tbl-title cast-title" data-ctitle>${esc(n.name.trim() || "Unnamed")}</h1>
    ${castFromHtml(n)}
    ${castText(n,"name","Name","Who did they meet?")}
    ${castText(n,"flavor","Who they are","One line: who they are")}
    ${castText(n,"description","Description","What you'd see.",true)}
    <div class="cast-codex">
      ${castText(n,"origin","Origin","",false,c.origins.length ? "cast-origins" : "")}${datalistHtml("cast-origins", c.origins)}
      <div><label class="field"><span>NPC roles</span><input type="text" data-cf="npcRoles" value="${esc(n.npcRoles.join(" / "))}" placeholder="Separate with / or ," autocomplete="off"></label>${castRolesHtml(n)}</div>
      ${castText(n,"enemyRole","Enemy role","",false,c.enemyRoles.length ? "cast-enemies" : "")}${datalistHtml("cast-enemies", c.enemyRoles)}
      <div><label class="field"><span>Tier</span><input type="number" step="1" min="1" inputmode="numeric" data-cf="tier" value="${numAttr(n.tier)}"></label>${packs ? `<p class="cast-guide" data-ctier hidden></p>` : ""}</div>
      <div class="field cast-ally"><span>In a fight</span><div class="form-toggle" role="group" aria-label="In a fight"><button type="button" data-cally class="${n.ally?"on":""}" aria-pressed="${n.ally}">Fights with the crew</button></div></div>
      <label class="field"><span>Status</span><select data-cf="status">${["alive","dead","missing","gone"].map(s=>`<option value="${s}"${s===n.status?" selected":""}>${esc(castStatusLabel(s))}</option>`).join("")}</select></label>
    </div>
    ${castText(n,"motivation","What they want","",true)}
    ${castText(n,"resources","What they've got","",true)}
    ${castText(n,"line","Their line","Where they stop.",true)}
    ${castText(n,"ifPushed","If pushed","What happens when they are.",true)}
    ${castText(n,"gmNote","GM note","Yours alone.",true)}
    <label class="field"><span>Affiliations</span><input type="text" data-cf="affiliations" value="${esc(n.affiliations.join(" / "))}" placeholder="Who they answer to" autocomplete="off"></label>
    ${castKeyToHtml(n)}
    ${castInteractionsHtml(n)}
    ${castStatBlockHtml(n)}
    <p class="cast-delete"><button class="btn danger" data-cdel>Delete</button></p>`;
}

// ── Binding ──
function bindCast(main){
  const m=castOpenMember();
  if (m) bindCastPage(main, m); else bindCastList(main);
}
function redrawCastList(){
  const box=$("main").querySelector("[data-castlist]"); if (!box) return;
  box.innerHTML=castListHtml(S.table);
  bindCastCards($("main"));
}
// A fight's name in a sentence opens that encounter and remembers where it was pressed, so Back returns
// there, on the link (Decision 241). The route is cleared when the GM leaves the encounter any other way.
function bindFightLinks(main){
  bindPlaceLinks(main);
  main.querySelectorAll("[data-eopenline]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    const [line, enc]=b.dataset.eopenline.split("|"), key=b.dataset.eopenline;
    if (!encList().some(e=>e.id===enc)) return;
    S.backFromLine={ line, enc, key, tsection:S.tsection, castOpen:S.castOpen, castView:S.castView, castFrom:S.castFrom, backEnc:S.backEnc, backSess:S.backSess,
      backClose:S.backClose, backCity:S.backCity, placeOpen:S.placeOpen, placeRoute:S.placeRoute, sessOpen:S.sessOpen, castQ:S.castQ, closeView:S.closeOut ? S.closeOut.view : false };
    S.intEdit=null; S.tsection="encounters"; S.encOpen=enc; S.encWrap=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; S.encPick=false; S.encQ=""; S.encCodex=false; S.encCodexQ="";
    window.scrollTo(0,0); update();
    const h=$("main").querySelector("[data-enc-h]"); if (h) takeFocus(h, true);
  });
}
// Where the fight's Back goes, if the GM came from a line: the page as it was.
function backFromLineNow(){
  const r=S.backFromLine;
  return r && r.enc===S.encOpen ? r : null;
}
function backFromLineTitle(){ return routeTitle(backFromLineNow()); }
// The page a saved route returns to, in words (Decisions 241, 243).
function routeTitle(r){
  if (!r) return "";
  if (r.tsection==="city" && r.placeOpen){ const p=placeRecords().find(x=>x.id===r.placeOpen); return p ? Engine.placeTitle(S.table, p) : "the crew's places"; }
  if (r.tsection==="sessions" && r.sessOpen){ const s=(S.table.sessions||[]).find(x=>x.id===r.sessOpen); return s ? Engine.sessionTitle(s) : "sessions"; }
  if (r.castOpen){ const n=S.table.cast.find(x=>x.id===r.castOpen); return n ? (n.name.trim() || "Unnamed") : "the cast"; }
  return "Who knows what";
}
function bindCastCards(main){
  bindFightLinks(main);
  // A member opened from Who knows what remembers which name it was, so Back lands on it.
  const open = (id, from) => { S.castOpen=id; S.backEnc=null; S.backSess=false; S.backClose=false; S.backCity=null; S.castFrom=from||null; S.intAdd=null; window.scrollTo(0,0); update(); const el=$("main").querySelector("[data-cback]"); if (el) el.focus(); };
  main.querySelectorAll("[data-copen]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    open(b.dataset.copen, b.dataset.cwhere ? attrSel("data-cwhere", b.dataset.cwhere) : null); });
  main.querySelectorAll("[data-ccard]").forEach(li=>li.onclick=ev=>{ if (!ev.target.closest("button")) open(li.dataset.ccard); });
  const clear=main.querySelector("[data-cclear]");
  if (clear) clear.onclick=()=>{ S.castQ=""; S.castStatus="all"; S.castAff="";
    const q=main.querySelector("[data-csearch]"), s=main.querySelector("[data-cstatus]"), a=main.querySelector("[data-caff]");
    if (q) q.value=""; if (s) s.value="all"; if (a) a.value=""; redrawCastList(); if (q) q.focus(); };
}
function bindCastList(main){
  const nameEl=main.querySelector("[data-cadd-name]"), lineEl=main.querySelector("[data-cadd-line]");
  const add=()=>{
    const name=nameEl.value; if (!name.trim()) return;
    let id; tableChange(()=>{ id=Engine.addCastMember(S.table, { name, line:lineEl.value }).id; });
    // A new member the filters would hide is shown anyway: clear them.
    if (!Engine.castFilter(S.table, castFilterNow()).some(n=>n.id===id)){ S.castQ=""; S.castStatus="inplay"; S.castAff=""; renderTable(); }
    const el=$("main").querySelector("[data-cadd-name]"); if (el) el.focus();
  };
  if (nameEl){
    main.querySelector("[data-cadd]").onclick=add;
    for (const el of [nameEl, lineEl]) el.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); add(); } });
  }
  main.querySelector("[data-csearch]").oninput=ev=>{ S.castQ=ev.target.value; redrawCastList(); };
  const st=main.querySelector("[data-cstatus]"), af=main.querySelector("[data-caff]");
  if (st) st.onchange=()=>{ S.castStatus=st.value; redrawCastList(); };
  if (af) af.onchange=()=>{ S.castAff=af.value; redrawCastList(); };
  main.querySelectorAll("[data-cview]").forEach(b=>b.onclick=()=>{
    S.castView=b.dataset.cview; renderTable();
    const el=$("main").querySelector(`[data-cview="${S.castView}"]`); if (el) el.focus(); });
  bindCastCards(main);
}
// The figures beside the fields: worked out from the block, never stored.
function castFigures(main, n){
  const r=Engine.npc(n.block);
  main.querySelectorAll("[data-cbonus]").forEach(el=>{ const s=r.stats[el.dataset.cbonus]; el.textContent = s && s.mod!==null ? castSigned(s.mod) : ""; });
  main.querySelectorAll("[data-cformula]").forEach(el=>{ const a=r.authored[el.dataset.cformula]; el.textContent = a && a.formula!==null ? `formula ${a.formula}` : ""; });
  const row=main.querySelector("[data-chealth-row]");
  if (row){
    row.hidden = !r.health;
    if (r.health) main.querySelector("[data-chealth]").textContent = `${r.health.total} (${r.health.levels} Health Level${r.health.levels===1?"":"s"})`;
  }
}
// What the slotted packs say about what's typed, beside it (Decision 184). Rewritten in place like
// castFigures, on every input: never a redraw, so the caret stays. Nothing here is stored, and
// nothing is a warning: the tier's words are the book's, and the GM overrides them as the story needs.
function castGuide(main, n){
  if (!packsMemo.length) return;
  const m=Engine.castPackMatch(packsMemo, n), set=(sel, html)=>{ const el=main.querySelector(sel); if (el){ el.innerHTML=html; el.hidden=!html; } };
  const mods=m.origin ? m.origin.rec.modifiers || {} : {}, who=m.origin ? m.origin.rec.name.trim() || "Origin" : "";
  main.querySelectorAll("[data-cmod]").forEach(el=>{ const v=mods[el.dataset.cmod]; el.textContent = v ? `${who} ${castSigned(v)}` : ""; });
  const have=new Set((Array.isArray(n.npcRoles) ? n.npcRoles : []).map(foldName));
  main.querySelectorAll("[data-crole]").forEach(b=>{ const on=have.has(foldName(b.dataset.crole)); b.setAttribute("aria-pressed", String(on)); b.classList.toggle("on", on); });
  const t=m.tier, tn=t ? t.rec.id : null, guide=(key)=>t && String(t.rec[key]||"").trim() ? `Tier ${tn}: ${esc(t.rec[key])}` : "";
  const e=m.enemyRole, usual=e && e.rec.tier!==null && e.rec.tier!==n.tier ? e.rec.name.trim() || "Enemy role" : "";
  set("[data-ctier]", [ t && packChipHtml(t.pack, "tiers", t.rec, t.rec.name.trim() || `Tier ${tn}`),
    usual && `${/^[aeiou]/i.test(usual) ? "An" : "A"} ${esc(usual)} is usually Tier ${e.rec.tier}` ].filter(Boolean).join(" · "));
  // A Use copy's numbers are the book's, which already include its origin: say so while the origin is still its entry's.
  const from=n.from, src=from && from.kind==="entry" ? Engine.packEntry(packsMemo, from.pack, from.id) : null;
  const same=src && m.origin && src.origin && m.origin.pack.meta.id===from.pack && m.origin.rec.id===src.origin.id && Object.keys(mods).length>0;
  set("[data-cmodnote]", same ? `The book's stats for ${esc(src.entry.name.trim() || String(from.name||"").trim() || "Unnamed")} already include ${esc(who)}'s modifiers.` : "");
  set("[data-cstatguide]", guide("statGuide"));
  set("[data-ctguide]", guide("traitGuide"));
  const c=m.counts, bits=PACK_KINDS.map(([k,name])=>c[k] ? `${c[k]} ${name}` : "").concat(c.written ? `${c.written} written` : "").filter(Boolean);
  set("[data-ctcount]", c.total ? `${c.total} trait${c.total===1 ? "" : "s"}: ${bits.join(" · ")}` : "");
}
// The glossary picker: every slotted pack's traits, by search, kind and origin (Decision 185).
// Its filters sit on S for as long as the table is open. `add` gets the chosen trait.
function traitFilterNow(){
  const origins=Engine.packChoices(packsMemo).traitOrigins, w=foldName(S.traitOrigin);
  return { q:S.traitQ||"", kind:PACK_KINDS.some(k=>k[0]===S.traitKind) ? S.traitKind : "", origin:w && origins.find(o=>foldName(o)===w) || "" };
}
function traitRowHtml({ pack, trait }, multi){
  const o=pack.origins.find(x=>x.id===trait.origin);
  const meta=[ packKindLabel(trait.kind), o && o.name, multi ? packName(pack) : "" ].filter(Boolean).map(esc).join(" · ");
  const name=trait.name.trim() || "Unnamed";
  return `<li class="trait-pick"><div class="trait-pick-head"><b>${esc(name)}</b>${meta ? ` <span class="roster-meta">${meta}</span>` : ""}</div>
    ${trait.text.trim() ? `<p class="threat-text">${esc(trait.text)}</p>` : ""}
    <button class="btn sm" data-tpadd="${esc(`${pack.meta.id}|${trait.id}`)}" aria-label="Add ${esc(name)}">Add</button></li>`;
}
function traitListHtml(){
  const f=traitFilterNow(), rows=Engine.packTraits(packsMemo, f), multi=packsMemo.length>1;
  if (!rows.length) return `<p class="step-note">Nothing matches.</p><p><button class="btn sm" data-tpclear>Clear the filters</button></p>`;
  return `<ul class="roster-list trait-picks">${rows.map(r=>traitRowHtml(r, multi)).join("")}</ul>`;
}
function traitPickerHtml(){
  const f=traitFilterNow(), c=Engine.packChoices(packsMemo);
  const sel = (attr, label, now, opts) => `<label class="field"><span>${esc(label)}</span><select ${attr}><option value="">Any</option>${opts.map(([v,name])=>
    `<option value="${esc(v)}"${v===now?" selected":""}>${esc(name)}</option>`).join("")}</select></label>`;
  return `<div class="threat-filters">
      <label class="field"><span>Search</span><input type="search" data-tpsearch placeholder="Search traits" autocomplete="off" value="${esc(f.q)}"></label>
      ${sel("data-tpkind","Kind", f.kind, PACK_KINDS)}${sel("data-tporigin","Origin", f.origin, c.traitOrigins.map(o=>[o,o]))}
    </div>
    <div data-tplist>${traitListHtml()}</div>`;
}
function openTraitPicker(add){
  openModal({ title:"Add a trait", html:traitPickerHtml(), returnTo:"[data-ctpick]", foot:`<button class="btn" data-modalclose>Cancel</button>`,
    bind(body){
      const box=body.querySelector("[data-tplist]");
      const draw=()=>{
        box.innerHTML=traitListHtml();
        box.querySelectorAll("[data-tpadd]").forEach(b=>b.onclick=()=>{
          const [pid, id]=b.dataset.tpadd.split("|"), hit=Engine.packTraits(packsMemo, {}).find(x=>x.pack.meta.id===pid && x.trait.id===id);
          if (hit) add({ name:hit.trait.name, text:hit.trait.text });
        });
        const clear=box.querySelector("[data-tpclear]");
        if (clear) clear.onclick=()=>{ S.traitQ=""; S.traitKind=""; S.traitOrigin="";
          for (const sel of ["[data-tpsearch]","[data-tpkind]","[data-tporigin]"]) body.querySelector(sel).value="";
          draw(); body.querySelector("[data-tpsearch]").focus(); };
      };
      const q=body.querySelector("[data-tpsearch]");
      q.oninput=()=>{ S.traitQ=q.value; draw(); };
      for (const [sel, key] of [["[data-tpkind]","traitKind"], ["[data-tporigin]","traitOrigin"]]) body.querySelector(sel).onchange=ev=>{ S[key]=ev.target.value; draw(); };
      draw();
    } });
}
// The add row keeps its kind, crew and date between entries (they're on S, so a
// redraw keeps them too); Enter in What adds. Only a Killed them goes back to none.
function bindInteractions(main, n){
  const id=n.id, a=intAdd(), whatEl=main.querySelector("[data-iwhat]");
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); };
  const found = xid => S.table.interactions.find(x=>x.id===xid);
  main.querySelectorAll("[data-iakind]").forEach(b=>b.onclick=()=>{
    a.kind = a.kind===b.dataset.iakind ? null : b.dataset.iakind;
    main.querySelectorAll("[data-iakind]").forEach(x=>{ const on=x.dataset.iakind===a.kind; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
  });
  const crewEl=main.querySelector("[data-iacrew]"), dateEl=main.querySelector("[data-iadate]");
  crewEl.oninput=()=>{ a.crew=crewEl.value; };
  crewEl.onchange=()=>{ a.crew=splitList(crewEl.value, /,/).join(", "); crewEl.value=a.crew; };
  dateEl.oninput=dateEl.onchange=()=>{ a.date=dateEl.value||null; };
  const whereEl=main.querySelector("[data-iawhere]");
  if (whereEl) whereEl.oninput=whereEl.onchange=()=>{ a.where=whereEl.value; };
  whatEl.addEventListener("input", ()=>{ a.what=whatEl.value; });
  const add=()=>{
    const text=whatEl.value;
    if (!a.kind && !text.trim()) return;
    let r; tableChange(()=>{ r=Engine.addInteraction(S.table, { kind:a.kind, cast:[id], crew:splitList(a.crew, /,/), text, date:a.date, place:a.where||null }); }, false);
    if (!r.ok) return;
    if (a.kind==="killed") a.kind=null;
    a.what="";
    renderTable(); focus("[data-iwhat]");
  };
  main.querySelector("[data-iadd]").onclick=add;
  whatEl.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); add(); } });
  // The rows are saved on input, with no redraw, so a GM who types and goes Home keeps the words.
  // The open line's sentence follows in place, so the fields keep their caret (Decision 241).
  const edit = (xid, f) => {
    tableChange(()=>Engine.editInteraction(S.table, xid, f), false);
    const sent=main.querySelector(attrSel("data-isent", xid)), cur=found(xid);
    if (sent && cur) sent.innerHTML=sentenceHtml(S.table, cur, { plain:true }) + (sentTag(cur) ? " " + sentTag(cur) : "");
  };
  main.querySelectorAll("[data-iedit]").forEach(b=>b.onclick=()=>{
    S.intEdit=b.dataset.iedit; S.intEditOf=id; renderTable(); focus(attrSel("data-icrew", b.dataset.iedit)); });
  main.querySelectorAll("[data-idone]").forEach(b=>b.onclick=()=>{
    S.intEdit=null; renderTable(); focus(attrSel("data-iedit", b.dataset.idone)); });
  bindCastCards(main);
  main.querySelectorAll("[data-ikind]").forEach(b=>b.onclick=()=>{
    const [xid, k]=b.dataset.ikind.split("|"), cur=found(xid); if (!cur) return;
    edit(xid, { kind: cur.kind===k ? null : k });
    renderTable(); focus(`[data-ikind="${xid}|${k}"]`);
  });
  main.querySelectorAll("[data-itext]").forEach(el=>el.oninput=()=>edit(el.dataset.itext, { text:el.value }));
  main.querySelectorAll("[data-iwhere]").forEach(el=>el.oninput=el.onchange=()=>{ if (el.value!=="~gone") edit(el.dataset.iwhere, { place:el.value || null }); });
  main.querySelectorAll("[data-icrew]").forEach(el=>{
    el.oninput=()=>edit(el.dataset.icrew, { crew:splitList(el.value, /,/) });
    el.onchange=()=>{ edit(el.dataset.icrew, { crew:splitList(el.value, /,/) }); const x=found(el.dataset.icrew); el.value = x ? x.crew.join(", ") : ""; };
  });
  main.querySelectorAll("[data-idate]").forEach(el=>{
    const save=()=>edit(el.dataset.idate, { date:el.value });
    el.oninput=save;
    el.onchange=()=>{ save(); const x=found(el.dataset.idate); el.value = x && x.date || ""; };
  });
  main.querySelectorAll("[data-idel]").forEach(b=>b.onclick=()=>{
    const xid=b.dataset.idel, order=Engine.interactionsFor(S.table, id), at=order.findIndex(x=>x.id===xid);
    askFirst({ title:"Delete this?", text:"It goes from the crew's view too.", yes:"Delete",
      then(){
        S.intEdit=null;
        tableChange(()=>Engine.removeInteraction(S.table, xid));
        const next=order[at+1], el=next && $("main").querySelector(attrSel("data-iedit", next.id)) || $("main").querySelector("[data-iwhat]");
        if (el) el.focus();
      } });
  });
}
function bindCastPage(main, n){
  const id=n.id, own=()=>castOpenMember();
  const edit = (key, v) => tableChange(()=>Engine.editCastMember(S.table, id, { [key]:v }), false);
  main.querySelectorAll("[data-cf]").forEach(el=>{
    const key=el.dataset.cf, list=key==="npcRoles" || key==="affiliations", fn=()=>{
      edit(key, list ? splitList(el.value, /[\/,]/) : el.value);
      castGuide(main, own());
      if (key==="name"){ const h=main.querySelector("[data-ctitle]"); if (h) h.textContent=el.value.trim() || "Unnamed"; }
    };
    el.addEventListener("input", fn); el.addEventListener("change", fn);
    // On blur a list shows what was stored: trimmed, empties dropped.
    if (key==="affiliations") el.addEventListener("change", ()=>{ el.value=own().affiliations.join(" / "); });
  });
  const ally=main.querySelector("[data-cally]");
  if (ally) ally.onclick=()=>{ const on=!own().ally; tableChange(()=>Engine.editCastMember(S.table, id, { ally:on }), false); ally.classList.toggle("on", on); ally.setAttribute("aria-pressed", String(on)); };
  bindInteractions(main, n);
  const fromBtn=main.querySelector("[data-tfrom]");
  if (fromBtn) fromBtn.onclick=()=>openThreat(fromBtn.dataset.tfrom, null, n.id);
  // A change to the block: `redraw` for a row added or removed, else the
  // fields keep their place and only the figures beside them are rewritten.
  const block = (fn, redraw) => tableChange(()=>{
    const cur=own(), b=cur.block ? JSON.parse(JSON.stringify(cur.block)) : { stats:{}, authored:{}, skills:[], armor:[], gear:[], traits:[] };
    fn(b); Engine.setCastBlock(S.table, id, b);
  }, redraw);
  const typed = (sel, fn) => main.querySelectorAll(sel).forEach(el=>el.oninput=()=>{ block(b=>fn(b, el), false); castFigures(main, own()); castGuide(main, own()); });
  const num = el => el.value.trim()==="" ? null : Number(el.value);
  typed("[data-cstat]", (b,el)=>{ b.stats[el.dataset.cstat]=num(el); });
  typed("[data-cauth]", (b,el)=>{ b.authored[el.dataset.cauth]=num(el); });
  typed("[data-cskname]", (b,el)=>{ const k=b.skills[+el.dataset.cskname]; if (!k) return; k.name=el.value;
    const want=el.value.trim().toLowerCase(), hit=want && D.skills.find(s=>String(s.name).toLowerCase()===want); k.skill=hit ? hit.id : null; });
  typed("[data-csktotal]", (b,el)=>{ const k=b.skills[+el.dataset.csktotal]; if (k) k.total=num(el); });
  typed("[data-clinev]", (b,el)=>{ const [key,i]=el.dataset.clinev.split("|"); if (b[key] && i in b[key]) b[key][+i]=el.value; });
  typed("[data-ctname]", (b,el)=>{ const k=b.traits[+el.dataset.ctname]; if (k) k.name=el.value; });
  typed("[data-cttext]", (b,el)=>{ const k=b.traits[+el.dataset.cttext]; if (k) k.text=el.value; });
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); };
  // Rows: a new one puts the keyboard in its first field, a removed one on
  // that list's Add button.
  const rows = (addSel, delAttr, list, fresh, firstSel, addFocus) => {
    const add=main.querySelector(addSel);
    add.onclick=()=>{ let at; block(b=>{ b[list].push(fresh()); at=b[list].length-1; }, true); focus(firstSel(at)); };
    main.querySelectorAll(`[${delAttr}]`).forEach(btn=>btn.onclick=()=>{ block(b=>{ b[list].splice(+btn.getAttribute(delAttr), 1); }, true); focus(addFocus); });
  };
  rows("[data-cskadd]", "data-cskdel", "skills", ()=>({ skill:null, name:"", total:null }), i=>`[data-cskname="${i}"]`, "[data-cskadd]");
  rows("[data-ctadd]", "data-ctdel", "traits", ()=>({ name:"", text:"" }), i=>`[data-ctname="${i}"]`, "[data-ctadd]");
  for (const key of ["armor","gear"]){
    main.querySelector(`[data-clineadd="${key}"]`).onclick=()=>{ let at; block(b=>{ b[key].push(""); at=b[key].length-1; }, true); focus(`[data-clinev="${key}|${at}"]`); };
    main.querySelectorAll(`[data-clinedel^="${key}|"]`).forEach(btn=>btn.onclick=()=>{
      const i=+btn.dataset.clinedel.split("|")[1]; block(b=>{ b[key].splice(i, 1); }, true); focus(`[data-clineadd="${key}"]`); });
  }
  // On blur or Enter a number field shows what was stored: blank if it was refused.
  const stored = el => { const m=own(), b=m.block||{};
    if (el.dataset.cf==="tier") return m.tier;
    if (el.dataset.cstat) return (b.stats||{})[el.dataset.cstat];
    if (el.dataset.cauth) return (b.authored||{})[el.dataset.cauth];
    const k=(b.skills||[])[+el.dataset.csktotal]; return k ? k.total : null; };
  main.querySelectorAll('input[type=number]').forEach(el=>el.addEventListener("change", ()=>{
    const v=stored(el); el.value = typeof v==="number" ? v : ""; castFigures(main, own()); }));
  castFigures(main, n);
  castGuide(main, n);
  // A role toggle edits the field's list: the pack's spelling in, or the matching entry out.
  main.querySelectorAll("[data-crole]").forEach(btn=>btn.onclick=()=>{
    const w=foldName(btn.dataset.crole), cur=own().npcRoles, has=cur.some(r=>foldName(r)===w);
    edit("npcRoles", has ? cur.filter(r=>foldName(r)!==w) : [...cur, btn.dataset.crole]);
    main.querySelector('[data-cf="npcRoles"]').value=own().npcRoles.join(" / ");
    castGuide(main, own());
  });
  const pick=main.querySelector("[data-ctpick]");
  if (pick) pick.onclick=()=>openTraitPicker(t=>{
    let at; closeModal();
    block(b=>{ b.traits.push({ name:t.name, text:t.text }); at=b.traits.length-1; }, true);
    focus(`[data-ctname="${at}"]`);
  });
  main.querySelectorAll("[data-fopen]").forEach(b=>b.onclick=()=>{
    const fid=b.dataset.fopen; if (!factionRecords().some(f=>f.id===fid)) return;
    openFactionPage(fid, memberRoute(b.dataset.fopen));
  });
  const addEnc=main.querySelector("[data-cenc]");
  if (addEnc) addEnc.onclick=()=>{
    encAddPress({ kind:"cast", id }, own().name.trim() || "Unnamed");
  };
  main.querySelector("[data-cback]").onclick=()=>{
    if (S.backEnc && encList().some(e=>e.id===S.backEnc)){
      S.encOpen=S.backEnc; S.backEnc=null; S.castOpen=null; S.tsection="encounters"; window.scrollTo(0,0); update();
      focus(attrSel("data-eopencast", id)) || focus("[data-enext]"); return;
    }
    if (S.backClose && S.closeOut){
      S.backClose=false; S.castOpen=null; S.intAdd=null; S.tsection="sessions"; S.closeOut.view=true; window.scrollTo(0,0); update();
      const el=$("main").querySelector(attrSel("data-co-open-cast", id)) || $("main").querySelector('[data-cosf="present"]'); if (el) el.focus();
      return;
    }
    if (S.backSess){
      const back=S.castFrom; S.backSess=false; S.castFrom=null; S.castOpen=null; S.intAdd=null; S.tsection="sessions"; window.scrollTo(0,0); update();
      const el=(back && $("main").querySelector(back)) || $("main").querySelector(S.sessOpen ? "[data-sback]" : "[data-snew]"); if (el) el.focus();
      return;
    }
    const cb=cityBackNow();
    if (cb){
      const back=S.castFrom;
      if (cb.kind==="faction"){ S.factionOpen=cb.id; S.placeOpen=null; S.cityView="factions"; } else { S.placeOpen=cb.id; S.factionOpen=null; }
      S.backCity=null; S.castFrom=null; S.castOpen=null; S.intAdd=null; S.tsection="city"; window.scrollTo(0,0); update();
      const el=(back && $("main").querySelector(back)) || $("main").querySelector(cb.kind==="faction" ? "[data-ftitle]" : "[data-ptitle]"); if (el) takeFocus(el, true);
      return;
    }
    S.backCity=null; S.backEnc=null;
    const from=S.castFrom;
    S.castOpen=null; S.castFrom=null; S.intAdd=null; window.scrollTo(0,0); update();
    // Back to Who knows what lands on the name that was pressed; to the list, on the card, or quick-add if the filter hides them.
    if (from) focus(from); else focus(`[data-copen="${id}"]`);
    if (document.activeElement===document.body) focus("[data-cadd-name]");
    if (document.activeElement===document.body) focus(`[data-cview="${S.castView==="crew"?"crew":"cast"}"]`);
  };
  main.querySelector("[data-cdel]").onclick=()=>{
    const order=Engine.castFilter(S.table, castFilterNow()), at=order.findIndex(x=>x.id===id);
    askFirst({ title:`Delete ${n.name.trim() || "Unnamed"}?`, text:"Their page goes with them. What they had to do with the crew stays, under their name.", yes:"Delete",
      then(){
        S.castOpen=null; S.castFrom=null; S.intAdd=null;
        tableChange(()=>Engine.removeCastMember(S.table, id));
        const crew=S.castView==="crew", next=!crew && order[at+1];
        const el=next && $("main").querySelector(`[data-copen="${next.id}"]`) || $("main").querySelector("[data-cadd-name]") || $("main").querySelector("[data-cview][aria-pressed=true]");
        if (el) el.focus();
      } });
  };
}

// ── The City tab (Decisions 242–243) ───────────────────────────────────
// Two views (S.cityView): the crew's places, which are the table's own records, and the city, which is the
// gazetteer read and searched. State is on S: S.placeOpen (a place's id, or null), S.placeQ and S.cityQ (the
// searches), S.placeRoute (where a place's Back goes: null for the list, { kind:"city", sel }, or the page a
// sentence was tapped on), S.backCity (a member opened from a place or faction page). A place's history is read from
// its lines every time and stored nowhere.
const CITY_VIEWS = [["places","The crew's places"], ["factions","Factions"], ["city","The city"]];
const placeRecords = () => Array.isArray(S.table.places) ? S.table.places.filter(p=>p && typeof p==="object") : [];
const cityPageNow = () => S.tsection==="city" && S.placeOpen ? placeRecords().find(p=>p.id===S.placeOpen) || null : null;
// The page a member was opened from, if it is still there: { kind, id, title }.
function cityBackNow(){
  const b=S.backCity; if (!b || typeof b!=="object") return null;
  if (b.kind==="place"){ const p=placeRecords().find(x=>x.id===b.id); return p ? { kind:"place", id:p.id, title:Engine.placeTitle(S.table, p) } : null; }
  if (b.kind==="faction"){ const f=factionRecords().find(x=>x.id===b.id); return f ? { kind:"faction", id:f.id, title:Engine.factionTitle(S.table, f) } : null; }
  return null;
}
const cityBackTitle = () => { const b=cityBackNow(); return b ? b.title : ""; };
const gazName = id => { const e=Engine.gazetteerEntry(id); return e ? String(e.name||"") : ""; };
function placeCardHtml(t, p){
  const n=Engine.placeLines(t, p.id).length;
  const bits=[[gazName(p.zone), gazName(p.territory)].filter(Boolean).join(" · "), p.district, p.neighborhood, gazName(p.environment),
    p.site && typeof p.site.name==="string" ? p.site.name : "", clockCountText(Engine.clocksOn(t, { kind:"place", id:p.id })),
    n ? `${n} ${n===1 ? "line" : "lines"}` : ""].filter(s=>String(s).trim()).map(esc).join(" · ");
  return `<li class="roster-card cast-card place-card" data-pcard="${esc(p.id)}"><button class="cast-open" data-popen="${esc(p.id)}">${esc(Engine.placeTitle(t, p))}</button>
    ${bits ? `<div class="roster-meta cast-meta">${bits}</div>` : ""}</li>`;
}
function placeListHtml(t){
  if (!placeRecords().length) return `<p class="step-note">No places yet. Add one, or find it in The city.</p>`;
  const list=Engine.placeList(t, { q:S.placeQ||"" });
  return list.length ? `<ul class="roster-list">${list.map(p=>placeCardHtml(t, p)).join("")}</ul>` : `<p class="step-note">No place matches.</p>`;
}
// A gazetteer entry: its name, the real-world place beside it, its line, and the button that makes it a place (SQ7).
function gazEntryHtml(e, tag){
  const mine=placeRecords().find(p=>p.from && p.from.id===e.id);
  const fmine=factionRecords().find(f=>f.from && f.from.id===e.id);
  const act=Engine.FACTION_FROM_KINDS.includes(e.kind) ? (fmine
      ? `<button type="button" class="btn sm" data-gfopen="${esc(e.id)}" aria-label="Open ${esc(e.name)}">Open</button>`
      : `<button type="button" class="btn sm" data-gfadd="${esc(e.id)}" aria-label="Add ${esc(e.name)} to the crew's factions">Add to the crew's factions</button>`)
    : !Engine.PLACE_FROM_KINDS.includes(e.kind) ? ""
    : mine ? `<button type="button" class="btn sm" data-gopen="${esc(e.id)}" aria-label="Open ${esc(e.name)}">Open</button>`
    : `<button type="button" class="btn sm" data-gadd="${esc(e.id)}" aria-label="Add ${esc(e.name)} to the crew's places">Add to the crew's places</button>`;
  return `<article class="city-entry" data-gentry="${esc(e.id)}"><${tag} class="city-name"${tag==="h2" ? ` id="gz-${esc(e.id)}" tabindex="-1"` : ""}>${esc(e.name)}${e.realWorld ? ` <span class="city-rw">${esc(e.realWorld)}</span>` : ""}</${tag}>
    <p class="city-sum">${esc(e.summary)}</p>${act}</article>`;
}
const GAZ_KIND_HEADS = [["zones","Notable Zones"], ["sites","Supernatural Sites"], ["businesses","Business Interests"], ["factions","Factions"]];
function cityChips(g){
  return [...g.territories.map(r=>({ id:`gz-${r.entry.id}`, label:r.entry.name })),
    ...(g.beyond.length ? [{ id:"gz-beyond", label:"Beyond NYTE City" }] : []),
    ...(g.powers.length ? [{ id:"gz-powers", label:"The powers" }] : []),
    ...(g.environments.length ? [{ id:"gz-ground", label:"Kinds of ground" }] : [])];
}
function cityPanelsHtml(g){
  if (!cityChips(g).length) return `<p class="step-note">Nothing in the city by that name.</p>`;
  const terr=g.territories.map(r=>`<section class="ref-panel city-terr">${gazEntryHtml(r.entry, "h2")}${GAZ_KIND_HEADS.filter(([k])=>r[k].length).map(([k, head])=>
    `<h3 class="ref-sub">${esc(head)}</h3>${r[k].map(e=>gazEntryHtml(e, "h4")).join("")}`).join("")}</section>`).join("");
  const beyond=g.beyond.length ? `<section class="ref-panel city-terr"><h2 class="ref-h" id="gz-beyond" tabindex="-1">Beyond NYTE City</h2>${g.beyond.map(e=>gazEntryHtml(e, "h4")).join("")}</section>` : "";
  const powers=g.powers.length ? `<section class="ref-panel city-terr"><h2 class="ref-h" id="gz-powers" tabindex="-1">The powers</h2>${g.powers.map(x=>
    `<h3 class="ref-sub">${esc(x.group)}</h3>${x.entries.map(e=>gazEntryHtml(e, "h4")).join("")}`).join("")}</section>` : "";
  const ground=g.environments.length ? `<section class="ref-panel city-terr"><h2 class="ref-h" id="gz-ground" tabindex="-1">Kinds of ground</h2>${g.environments.map(e=>gazEntryHtml(e, "h4")).join("")}</section>` : "";
  return terr + beyond + powers + ground;
}
function cityTabHtml(t){
  const view=S.cityView==="city" ? "city" : S.cityView==="factions" ? "factions" : "places";
  const toggle=`<div class="form-toggle cast-view" role="group" aria-label="View">${CITY_VIEWS.map(([k, name])=>
    `<button type="button" data-cityview="${k}" class="${k===view ? "on" : ""}" aria-pressed="${k===view}">${esc(name)}</button>`).join("")}</div>`;
  if (view==="city"){
    const g=Engine.gazetteer({ q:S.cityQ||"" });
    return `${toggle}${jumpBarHtml(cityChips(g), { sticky:true, wrap:true, filter:{ value:S.cityQ||"", placeholder:"Search the city" } })}
      <div data-citypanels>${cityPanelsHtml(g)}</div>`;
  }
  if (view==="factions") return `${toggle}${factionsViewHtml(t)}`;
  return `${toggle}<div class="cast-add">
      <label class="field"><span>Name</span><input type="text" data-padd-name placeholder="Where did they go?" autocomplete="off"></label>
      <button class="btn primary" data-padd>Add</button></div>
    <div class="cast-filters"><label class="field"><span>Search</span><input type="search" data-psearch placeholder="Search the crew's places" autocomplete="off" value="${esc(S.placeQ||"")}"></label></div>
    <div data-placelist>${placeListHtml(t)}</div>`;
}
const uniqueTyped = key => { const seen=new Map(); for (const p of placeRecords()){ const s=String(p[key]||"").trim(); if (s && !seen.has(s.toLowerCase())) seen.set(s.toLowerCase(), s); } return [...seen.values()]; };
function placeBackTitle(){
  const r=S.placeRoute;
  return !r ? "the crew's places" : r.kind==="city" ? "The city" : routeTitle(r) || "the crew's places";
}
// ── A place's Site Profile (Decisions 250–251) ──────────────────────────
// The profile is the pack's: it is read here every time and a place keeps only the link, the level a levels
// track was set to, and each character's Exposure. Its text is the book's and is drawn as text, never run.
const siteOwner = p => ({ kind:"place", id:p.id });
const siteValue = e => `${e.pack.meta.id}|${e.site.id}`;
// The select of every slotted pack's profiles, the place's own kind of ground first.
function siteSelectHtml(p, info){
  const list=Engine.siteProfiles(packsMemo);
  if (!list.length && !info.link) return `<p class="step-note" data-psite-none>Slot in a pack with site profiles to use one here.</p>`;
  const groups=[];
  for (const e of list){
    let g=groups.find(x=>x.cat===e.site.category);
    if (!g){ g={ cat:e.site.category, items:[] }; groups.push(g); }
    g.items.push(e);
  }
  groups.sort((a, b)=>(b.cat && b.cat===p.environment ? 1 : 0) - (a.cat && a.cat===p.environment ? 1 : 0));
  const picked=info.link ? `${info.link.pack}|${info.link.id}` : "";
  const opt=(v, name) => `<option value="${esc(v)}"${v===picked ? " selected" : ""}>${esc(name)}</option>`;
  const lost=info.link && !info.here ? opt(picked, String(info.link.name||"").trim() || "A site profile") : "";
  return `<div class="place-site"><label class="field"><span>Site profile</span><select data-psite><option value=""${picked ? "" : " selected"}>None</option>${lost}${groups.map(g=>{
    const items=g.items.map(e=>opt(siteValue(e), e.site.name)).join("");
    return g.cat ? `<optgroup label="${esc(gazName(g.cat) || g.cat)}">${items}</optgroup>` : items;
  }).join("")}</select></label>
    <button type="button" class="btn" data-psite-use disabled>Use</button></div>`;
}
// A part of the profile is an h3, beside the track's; a part of the track (What moves it, Marks here) is an h4 under it.
const siteText = (label, text, h="h3") => String(text||"").trim() ? `<${h} class="site-h">${esc(label)}</${h}><p class="site-text">${esc(text)}</p>` : "";
function siteLevelsHtml(track, info){
  const levels=Array.isArray(track.levels) ? track.levels.filter(l=>l && typeof l==="object") : [], on=info.level ? info.level.id : null;
  return `<div class="form-toggle int-kinds" role="group" aria-label="${esc(track.name || "Level")}">${levels.map(l=>
    `<button type="button" data-slevel="${esc(l.id)}" class="${l.id===on ? "on" : ""}" aria-pressed="${l.id===on}">${esc(l.name)}</button>`).join("")}</div>
    <p class="site-text" data-slevel-text>${esc(info.level ? info.level.text : "")}</p>
    <p class="step-note" data-slevel-stale${info.stale ? "" : " hidden"}>${info.stale ? `Last set to “${esc(info.stale)}”, which this pack doesn't have.` : ""}</p>`;
}
// A row's buttons say whose they are, the typed name or the row's number; typing a name renames them.
const exposureLabels = (name, i) => { const nm=String(name||"").trim() || `row ${i+1}`; return { eminus:`Take one off ${nm}`, eplus:`Add one to ${nm}`, edel:`Remove ${nm}` }; };
function exposureRowHtml(r, i){
  const L=exposureLabels(r.name, i);
  return `<li class="int-line exposure-row" data-erow="${i}">
    <input type="text" data-ename="${i}" list="exposure-names" value="${esc(r.name)}" placeholder="Who?" aria-label="Who, row ${i+1}" autocomplete="off">
    <span class="clock-btns"><button type="button" class="btn sm clock-step" data-eminus="${i}" aria-label="${esc(L.eminus)}"${r.n<=0 ? " disabled" : ""}>−</button>
      <span class="clock-count" data-ecount="${i}" role="status">${r.n}</span>
      <button type="button" class="btn sm clock-step" data-eplus="${i}" aria-label="${esc(L.eplus)}"${r.n>=99 ? " disabled" : ""}>+</button></span>
    <button type="button" class="btn sm" data-edel="${i}" aria-label="${esc(L.edel)}">Remove</button>
    <span class="exposure-step" data-estep="${i}">${r.step ? esc(r.step.text) : ""}</span></li>`;
}
function exposureRowsHtml(info){ return info.exposure.map(exposureRowHtml).join(""); }
function siteTrackHtml(p, site, info){
  const track=site.track && typeof site.track==="object" ? site.track : null;
  if (!track) return String(site.trackText||"").trim() ? `<h3 class="site-h3">Track</h3><p class="site-text">${esc(site.trackText)}</p>` : "";
  const head=`<h3 class="site-h3">${esc(track.name)}</h3>`;
  if (track.kind==="levels") return head + siteLevelsHtml(track, info) + siteText("What moves it", track.moves, "h4");
  if (track.kind==="table") return `<h3 class="site-h3">${esc(track.name)} · ${esc(track.die)}</h3><ul class="site-list">${(track.rows||[]).map(r=>
    `<li><strong>${esc(r.roll)}</strong> ${esc(r.text)}</li>`).join("")}</ul>`;
  const names=Engine.crewView(S.table, {}).map(g=>g.name);
  return head + (String(track.triggers||"").trim() ? `<p class="site-text">${esc(track.triggers)}</p>` : "")
    + datalistHtml("exposure-names", names)
    + `<ul class="int-list" data-erows>${exposureRowsHtml(info)}</ul>
    <p><button type="button" class="btn sm" data-eadd>Add someone</button></p>
    <ul class="site-list">${(track.steps||[]).map(s=>`<li><strong>${esc(s.at)}</strong> ${esc(s.text)}</li>`).join("")}</ul>`
    + siteText("Marks here", track.marks, "h4");
}
// The profile under the select, or the line that says its pack isn't slotted in.
function siteProfileHtml(p, info){
  if (!info.link) return "";
  const s=info.site;
  if (!s) return `<p class="step-note" data-psite-gone>${esc(String(info.link.name||"").trim() || "This site profile")} isn't in any pack slotted in.</p>`;
  return `<div class="site-profile" data-psite-profile>
    <h2 class="cast-h site-name">${esc(s.name)}</h2>
    <p class="roster-meta">${esc([gazName(s.category), s.canon].filter(x=>String(x||"").trim()).join(" · "))}</p>
    ${String(s.flavor||"").trim() ? `<p class="site-flavor"><em>${esc(s.flavor)}</em></p>` : ""}
    ${siteText("Presence", s.presence)}${siteText("Rules", s.rules)}
    ${(s.waysIn||[]).length ? `<h3 class="site-h">Ways in</h3><ul class="site-list">${s.waysIn.map(w=>`<li>${esc(w)}</li>`).join("")}</ul>` : ""}
    ${siteText("Layering", s.layering)}
    ${siteTrackHtml(p, s, info)}
    ${siteText("Who's already here", s.here)}${siteText("Resolution", s.resolution)}${siteText("GM note", s.gmNote)}</div>`;
}
function bindSiteProfile(main, id, own, focus){
  const packs=()=>packsMemo, info=()=>Engine.placeSite(S.table, packs(), own());
  const sel=main.querySelector("[data-psite]");
  // The select only chooses (an arrow key fires a change per option); Use commits, once, as a cast member takes a pack entry (182).
  const same=()=>{ const cur=info().link; return cur ? `${cur.pack}|${cur.id}` : ""; };
  const use=main.querySelector("[data-psite-use]");
  if (sel && use){
    sel.onchange=()=>{ use.disabled=sel.value===same(); };
    use.onclick=()=>{
      if (sel.value===same()) return;
      const ref=sel.value ? { pack:sel.value.split("|")[0], id:sel.value.split("|")[1] } : null;
      tableChange(()=>{ const r=Engine.setPlaceSite(S.table, id, packs(), ref); if (!r.ok) notice(r.why); });
      focus("[data-psite]");
    };
  }
  // A levels track: one level is always pressed; a tap sets it, and only that group and its text repaint.
  main.querySelectorAll("[data-slevel]").forEach(b=>b.onclick=()=>{
    const now=info();
    if (!now.level || b.dataset.slevel===now.level.id) return;
    tableChange(()=>Engine.editPlace(S.table, id, { siteLevel:b.dataset.slevel }), false);
    const cur=info();
    main.querySelectorAll("[data-slevel]").forEach(x=>{ const pressed=cur.level && x.dataset.slevel===cur.level.id; x.classList.toggle("on", !!pressed); x.setAttribute("aria-pressed", String(!!pressed)); });
    const txt=main.querySelector("[data-slevel-text]"); if (txt) txt.textContent=cur.level ? cur.level.text : "";
    const stale=main.querySelector("[data-slevel-stale]"); if (stale){ stale.hidden=true; stale.textContent=""; }
  });
  const box=main.querySelector("[data-erows]");
  if (!box) return;
  const rows=()=>own().exposure.map(r=>({ name:r.name, n:r.n }));
  const save=list=>tableChange(()=>Engine.editPlace(S.table, id, { exposure:list }), false);
  const paintRow=i=>{
    const r=info().exposure[i], li=box.querySelector(`[data-erow="${i}"]`); if (!r || !li) return;
    li.querySelector("[data-ecount]").textContent=r.n;
    li.querySelector("[data-estep]").textContent=r.step ? r.step.text : "";
    li.querySelector("[data-eminus]").disabled=r.n<=0;
    li.querySelector("[data-eplus]").disabled=r.n>=99;
  };
  const redraw=()=>{ box.innerHTML=exposureRowsHtml(info()); bindRows(); };
  const bindRows=()=>box.querySelectorAll("[data-erow]").forEach(li=>{
    const i=Number(li.dataset.erow), q=sel=>li.querySelector(sel);
    const step=d=>{ const list=rows(); if (!list[i]) return; list[i].n=Math.max(0, Math.min(99, list[i].n+d)); save(list); paintRow(i);
      const other=d>0 ? "[data-eminus]" : "[data-eplus]", same=d>0 ? "[data-eplus]" : "[data-eminus]"; if (q(same).disabled) q(other).focus(); };
    q("[data-eplus]").onclick=()=>step(1);
    q("[data-eminus]").onclick=()=>step(-1);
    const name=q("[data-ename]"), fn=()=>{ const list=rows(); if (!list[i]) return; list[i].name=name.value; save(list);
      for (const [k, label] of Object.entries(exposureLabels(name.value, i))) q(`[data-${k}]`).setAttribute("aria-label", label); };
    name.addEventListener("input", fn); name.addEventListener("change", fn);
    q("[data-edel]").onclick=()=>{
      const list=rows(); list.splice(i, 1); save(list); redraw();
      const next=box.querySelector(`[data-erow="${Math.min(i, list.length-1)}"] [data-ename]`);
      if (list.length && next) next.focus(); else focus("[data-eadd]");
    };
  });
  bindRows();
  main.querySelector("[data-eadd]").onclick=()=>{
    const list=[...rows(), { name:"", n:0 }]; save(list); redraw();
    const el=box.querySelector(`[data-erow="${list.length-1}"] [data-ename]`); if (el) el.focus();
  };
}
function placePageHtml(p){
  const t=S.table, id=esc(p.id), entry=Engine.gazetteerEntry(p.from && p.from.id), g=Engine.gazetteer({});
  const terr=g.territories.find(r=>r.entry.id===p.territory), zones=terr ? terr.zones : [];
  const opt=(value, name, on) => `<option value="${esc(value)}"${on ? " selected" : ""}>${esc(name)}</option>`;
  const unknownT=p.territory && !terr ? opt(p.territory, p.territory, true) : "";
  const unknownZ=p.zone && !zones.some(z=>z.id===p.zone) ? opt(p.zone, p.zone, true) : "";
  const lines=Engine.placeLines(t, p.id), met=Engine.placeMet(t, p.id), info=Engine.placeSite(t, packsMemo, p);
  return `<p><button class="btn sm" data-pback>Back to ${esc(placeBackTitle())}</button></p>
    <h1 class="step-title tbl-title cast-title" data-ptitle tabindex="-1">${esc(Engine.placeTitle(t, p))}</h1>
    <label class="field"><span>Name</span><input type="text" data-pf="name" value="${esc(p.name)}" placeholder="${esc(entry ? entry.name : p.from && p.from.name || "Where is it?")}" autocomplete="off"></label>
    <div class="cast-codex">
      <label class="field"><span>Territory</span><select data-pf="territory"><option value=""${!p.territory ? " selected" : ""}>None</option>${g.territories.map(r=>opt(r.entry.id, r.entry.name, r.entry.id===p.territory)).join("")}${unknownT}</select></label>
      <label class="field"><span>Zone</span><select data-pf="zone"><option value=""${!p.zone ? " selected" : ""}>None</option>${zones.map(z=>opt(z.id, z.name, z.id===p.zone)).join("")}${unknownZ}</select></label>
      <label class="field"><span>District</span><input type="text" data-pf="district" list="place-districts" value="${esc(p.district)}" autocomplete="off"></label>
      <label class="field"><span>Neighborhood</span><input type="text" data-pf="neighborhood" list="place-neighborhoods" value="${esc(p.neighborhood)}" autocomplete="off"></label>
    </div>
    ${datalistHtml("place-districts", uniqueTyped("district"))}${datalistHtml("place-neighborhoods", uniqueTyped("neighborhood"))}
    <div class="tag-choice place-ground"><span>Kind of ground</span><div class="form-toggle int-kinds" role="group" aria-label="Kind of ground">${g.environments.map(e=>
      `<button type="button" data-pground="${esc(e.id)}" class="${e.id===p.environment ? "on" : ""}" aria-pressed="${e.id===p.environment}">${esc(e.name)}</button>`).join("")}</div></div>
    ${siteSelectHtml(p, info)}
    ${siteProfileHtml(p, info)}
    <h2 class="cast-h">Clocks</h2>
    ${info.here && !info.site.clock && String(info.site.clockText||"").trim() ? `<p class="site-text">${esc(info.site.clockText)}</p>` : ""}
    ${clocksHtml(siteOwner(p))}
    <label class="field"><span>Notes</span><textarea data-pf="notes" placeholder="What the crew should remember about it.">${esc(p.notes)}</textarea></label>
    ${entry && entry.summary ? `<h2 class="cast-h">From the book</h2><p class="city-sum">${esc(entry.summary)}</p>` : ""}
    <h2 class="cast-h">What happened here</h2>
    ${lines.length ? `<ul class="int-list">${lines.map(x=>`<li class="int-line">${sentenceHtml(t, x, { where:`place|${x.id}`, ownPlace:p.id })}</li>`).join("")}</ul>`
      : `<p class="step-note">Nothing yet. Name this place as Where on a line.</p>`}
    <h2 class="cast-h">Met here</h2>
    ${met.length ? `<ul class="int-list">${met.map(m=>`<li class="int-line">${m.gone ? goneHtml(m.name)
      : `<button class="cast-open int-who" data-copen="${esc(m.id)}" data-cwhere="met|${esc(m.id)}">${esc(m.name)}</button>`}</li>`).join("")}</ul>`
      : `<p class="step-note">No one yet.</p>`}
    <p class="cast-delete"><button class="btn danger" data-pdel>Delete</button></p>`;
}
// A place in a sentence opens its page and remembers where it was pressed, so Back returns there, on the link (Decision 243).
// It is a second link of the fight's kind: keyed with the same `where`, so Back finds the copy that was tapped.
function bindPlaceLinks(main){
  main.querySelectorAll("[data-popenline]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    const key=b.dataset.popenline, pid=key.split("|")[1];
    if (!placeRecords().some(p=>p.id===pid)) return;
    S.placeRoute={ kind:"line", key, tsection:S.tsection, castOpen:S.castOpen, castView:S.castView, castFrom:S.castFrom, backEnc:S.backEnc, backSess:S.backSess,
      backClose:S.backClose, backCity:S.backCity, placeOpen:S.placeOpen, placeRoute:S.placeRoute, sessOpen:S.sessOpen, castQ:S.castQ, closeView:S.closeOut ? S.closeOut.view : false };
    S.intEdit=null; S.tsection="city"; S.placeOpen=pid; S.factionOpen=null; S.cityView="places";
    window.scrollTo(0,0); update();
    const h=$("main").querySelector("[data-ptitle]"); if (h) takeFocus(h, true);
  });
}
function placeBack(){
  const r=S.placeRoute, id=S.placeOpen, focus=sel=>{ const el=$("main").querySelector(sel); if (el) el.focus(); return !!el; };
  S.placeOpen=null; S.placeRoute=null; S.clockEdit=null;
  if (r && r.kind==="line"){
    Object.assign(S, { tsection:r.tsection, castOpen:r.castOpen, castView:r.castView, castFrom:r.castFrom, backEnc:r.backEnc, backSess:r.backSess, backClose:r.backClose,
      backCity:r.backCity||null, placeOpen:r.placeOpen||null, placeRoute:r.placeRoute||null, sessOpen:r.sessOpen, castQ:r.castQ });
    if (S.closeOut) S.closeOut.view=r.closeView;
    window.scrollTo(0,0); update();
    const link=$("main").querySelector(attrSel("data-popenline", r.key));
    if (link) link.focus(); else { const h=$("main").querySelector("h1"); if (h) takeFocus(h, true); }
    return;
  }
  S.tsection="city"; window.scrollTo(0,0);
  if (r && r.kind==="city"){ S.cityView="city"; update(); focus(r.sel) || focus('[data-cityview="city"]'); return; }
  S.cityView="places"; update();
  focus(attrSel("data-popen", id)) || focus("[data-padd-name]") || focus('[data-cityview="places"]');
}
function bindCity(main){
  const p=cityPageNow();
  if (p){ bindPlacePage(main, p); return; }
  const fp=factionPageNow();
  if (fp){ bindFactionPage(main, fp); return; }
  main.querySelectorAll("[data-cityview]").forEach(b=>b.onclick=()=>{
    S.cityView=b.dataset.cityview; renderTable(); const el=$("main").querySelector(`[data-cityview="${S.cityView}"]`); if (el) el.focus(); });
  if (S.cityView==="city") bindCityView(main); else if (S.cityView==="factions") bindFactionList(main); else bindPlaceList(main);
}
function openPlacePage(id, route){
  S.placeOpen=id; S.factionOpen=null; S.placeRoute=route||null; S.clockEdit=null; window.scrollTo(0,0); update();
  const h=$("main").querySelector("[data-ptitle]"); if (h) takeFocus(h, true);
}
function bindPlaceList(main){
  const nameEl=main.querySelector("[data-padd-name]");
  const add=()=>{
    const name=nameEl.value; if (!name.trim()) return;
    let id; tableChange(()=>{ id=Engine.addPlace(S.table, { name }).id; });
    // A new place the search would hide is shown anyway: clear it.
    if (!Engine.placeList(S.table, { q:S.placeQ||"" }).some(p=>p.id===id)){ S.placeQ=""; renderTable(); }
    const el=$("main").querySelector("[data-padd-name]"); if (el) el.focus();
  };
  main.querySelector("[data-padd]").onclick=add;
  nameEl.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); add(); } });
  main.querySelector("[data-psearch]").oninput=ev=>{ S.placeQ=ev.target.value; main.querySelector("[data-placelist]").innerHTML=placeListHtml(S.table); bindPlaceCards(main); };
  bindPlaceCards(main);
}
function bindPlaceCards(main){
  main.querySelectorAll("[data-popen]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); openPlacePage(b.dataset.popen, null); });
  main.querySelectorAll("[data-pcard]").forEach(li=>li.onclick=ev=>{ if (!ev.target.closest("button")) openPlacePage(li.dataset.pcard, null); });
}
function redrawCity(main){
  const g=Engine.gazetteer({ q:S.cityQ||"" });
  main.querySelector("[data-citypanels]").innerHTML=cityPanelsHtml(g);
  main.querySelector(".jump-row").innerHTML=cityChips(g).map(c=>`<button class="jump" data-jump="${esc(c.id)}">${esc(c.label)}</button>`).join("");
  // The entries shown, not the chips: one Territory can hold thirty of them.
  const k=main.querySelectorAll("[data-gentry]").length;
  const n=main.querySelector("[data-jumpcount]"); if (n) n.textContent=(S.cityQ||"").trim() ? `${k} ${k===1 ? "entry" : "entries"}` : "";
  bindCityBody(main);
}
function bindCityBody(main){
  main.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>jumpTo(b.dataset.jump));
  main.querySelectorAll("[data-gadd]").forEach(b=>b.onclick=()=>{
    const eid=b.dataset.gadd;
    tableChange(()=>{ Engine.addPlace(S.table, { from:eid }); }, false);
    redrawCity(main);
    const el=$("main").querySelector(attrSel("data-gopen", eid)); if (el) el.focus();
  });
  main.querySelectorAll("[data-gopen]").forEach(b=>b.onclick=()=>{
    const eid=b.dataset.gopen, p=placeRecords().find(x=>x.from && x.from.id===eid);
    if (p) openPlacePage(p.id, { kind:"city", sel:attrSel("data-gopen", eid) });
  });
  main.querySelectorAll("[data-gfadd]").forEach(b=>b.onclick=()=>{
    const eid=b.dataset.gfadd;
    tableChange(()=>{ Engine.addFaction(S.table, { from:eid }); }, false);
    redrawCity(main);
    const el=$("main").querySelector(attrSel("data-gfopen", eid)); if (el) el.focus();
  });
  main.querySelectorAll("[data-gfopen]").forEach(b=>b.onclick=()=>{
    const eid=b.dataset.gfopen, f=factionRecords().find(x=>x.from && x.from.id===eid);
    if (f) openFactionPage(f.id, { kind:"city", sel:attrSel("data-gfopen", eid) });
  });
}
function bindCityView(main){
  main.querySelector("[data-jumpfilter]").oninput=ev=>{ S.cityQ=ev.target.value; redrawCity(main); };
  bindCityBody(main);
}
function bindPlacePage(main, p){
  const id=p.id, own=()=>placeRecords().find(x=>x.id===id) || p;
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); };
  const edit = f => tableChange(()=>Engine.editPlace(S.table, id, f), false);
  main.querySelectorAll("[data-pf]").forEach(el=>{
    const key=el.dataset.pf, fn=()=>{
      const was=own()[key];
      edit({ [key]:el.value });
      if (key==="name"){ const h=main.querySelector("[data-ptitle]"); if (h) h.textContent=Engine.placeTitle(S.table, own()); }
      // A Territory change redraws the Zone select: it lists that Territory's zones, and may have lost the one chosen.
      if (key==="territory" && own()[key]!==was){ renderTable(); focus('[data-pf="territory"]'); }
    };
    el.addEventListener("input", fn); el.addEventListener("change", fn);
  });
  main.querySelectorAll("[data-pground]").forEach(b=>b.onclick=()=>{
    const gid=b.dataset.pground, on=own().environment===gid ? null : gid;
    edit({ environment:on });
    main.querySelectorAll("[data-pground]").forEach(x=>{ const pressed=x.dataset.pground===on; x.classList.toggle("on", pressed); x.setAttribute("aria-pressed", String(pressed)); });
  });
  bindSiteProfile(main, id, own, focus);
  bindClocks(main, siteOwner(p));
  bindFightLinks(main);
  main.querySelectorAll("[data-copen]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    S.tsection="cast"; S.castOpen=b.dataset.copen; S.backEnc=null; S.backSess=false; S.backClose=false; S.backCity={ kind:"place", id };
    S.castFrom=b.dataset.cwhere ? attrSel("data-cwhere", b.dataset.cwhere) : null; S.intAdd=null;
    window.scrollTo(0,0); update(); focus("[data-cback]"); });
  main.querySelector("[data-pback]").onclick=placeBack;
  main.querySelector("[data-pdel]").onclick=()=>{
    const title=Engine.placeTitle(S.table, own()), n=Engine.clocksOn(S.table, siteOwner(p)).length;
    askFirst({ title:`Delete ${title}?`, text:`Its page goes with it${n ? `, and its ${n} ${n===1 ? "clock" : "clocks"}` : ""}. Lines that named it keep its name, struck through.`, yes:"Delete",
      then(){
        S.placeOpen=null; S.placeRoute=null; S.clockEdit=null; S.cityView="places";
        tableChange(()=>Engine.removePlace(S.table, id));
        const el=$("main").querySelector("[data-padd-name]") || $("main").querySelector("[data-cityview][aria-pressed=true]"); if (el) el.focus();
      } });
  };
}

// ── Factions and clocks (Decisions 244–245) ─────────────────────────────
// The Factions view of the City tab, a faction's page and the clocks on it. State is on S: S.cityView
// "factions", S.factionOpen (a faction's id, or null), S.factionQ (the search), S.factionRoute (where its Back
// goes: null for the list, { kind:"city", sel }, or { kind:"member", ... } for the member's page it was opened
// from), S.clockEdit (the clock whose fields are open, view state only). Everything saves as typed, like a place.
// What is tied to a faction by affiliation is read from the cast every time and stored nowhere.
const FACTION_ATTENTION_LABELS = { neutral:"Neutral", aware:"Aware", active:"Active" };
// [step, the words on the button, the name a screen reader hears]: the book labels only the ends and the middle.
const FACTION_STANCE_STEPS = [[-2, "Hostile", "Hostile"], [-1, "", "One step toward Hostile"], [0, "Neutral", "Neutral"], [1, "", "One step toward Allied"], [2, "Allied", "Allied"]];
const stanceWord = s => s===-2 ? "Hostile" : s===0 ? "Neutral" : s===2 ? "Allied" : "";
const factionRecords = () => Array.isArray(S.table.factions) ? S.table.factions.filter(f=>f && typeof f==="object") : [];
const factionPageNow = () => S.tsection==="city" && S.factionOpen ? factionRecords().find(f=>f.id===S.factionOpen) || null : null;
const factionClocks = f => Engine.clocksOn(S.table, { kind:"faction", id:f.id });
function factionCardHtml(t, f){
  const bits=[Engine.FACTION_TYPE_LABELS[f.type], gazName(f.territory), stanceWord(f.stance), clockCountText(factionClocks(f))].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card cast-card place-card" data-fcard="${esc(f.id)}"><button class="cast-open" data-fcardopen="${esc(f.id)}">${esc(Engine.factionTitle(t, f))}</button>
    ${bits ? `<div class="roster-meta cast-meta">${bits}</div>` : ""}</li>`;
}
function factionListHtml(t){
  if (!factionRecords().length) return `<p class="step-note">No factions yet. Add one, or find it in The city.</p>`;
  const list=Engine.factionList(t, { q:S.factionQ||"" });
  return list.length ? `<ul class="roster-list">${list.map(f=>factionCardHtml(t, f)).join("")}</ul>` : `<p class="step-note">No faction matches.</p>`;
}
function factionsViewHtml(t){
  return `<div class="cast-add">
      <label class="field"><span>Name</span><input type="text" data-fadd-name placeholder="Who are they?" autocomplete="off"></label>
      <button class="btn primary" data-fadd>Add</button></div>
    <div class="cast-filters"><label class="field"><span>Search</span><input type="search" data-fsearch placeholder="Search the crew's factions" autocomplete="off" value="${esc(S.factionQ||"")}"></label></div>
    <div data-factionlist>${factionListHtml(t)}</div>`;
}
function factionBackTitle(){
  const r=S.factionRoute;
  return !r ? "Factions" : r.kind==="city" ? "The city" : routeTitle(r) || "Factions";
}
// A group of toggles, one pressed or none.
const factionToggleHtml = (attr, label, items, current) => `<div class="form-toggle int-kinds" role="group" aria-label="${esc(label)}">${items.map(([v, text, name])=>
  `<button type="button" ${attr}="${esc(v)}" class="${v===current ? "on" : ""}" aria-pressed="${v===current}"${name ? ` aria-label="${esc(name)}"` : ""}>${text ? esc(text) : `<span aria-hidden="true">·</span>`}</button>`).join("")}</div>`;
function factionKeysHtml(t, f){
  const keys=(Array.isArray(f.keyNpcs) ? f.keyNpcs : []).filter(l=>l && typeof l==="object");
  const listed=new Set(keys.map(l=>l.id));
  const cast=(t.cast||[]).filter(n=>n && !listed.has(n.id)).sort((a, b)=>String(a.name||"").toLowerCase().localeCompare(String(b.name||"").toLowerCase()));
  return `${keys.length ? `<ul class="int-list">${keys.map(l=>{ const r=Engine.linkName(t, l);
      return `<li class="int-line fac-key">${r.gone ? goneHtml(r.name) : `<button class="cast-open int-who" data-copen="${esc(l.id)}" data-cwhere="key|${esc(l.id)}">${esc(r.name)}</button>`}
        <button type="button" class="btn sm" data-fkeydel="${esc(l.id)}" aria-label="Remove ${esc(r.name)}">Remove</button></li>`; }).join("")}</ul>` : `<p class="step-note">No one yet.</p>`}
    <label class="field"><span>Add a key NPC</span><select data-fkeyadd><option value="">Pick someone</option>${cast.map(n=>`<option value="${esc(n.id)}">${esc(String(n.name||"").trim() || "Unnamed")}</option>`).join("")}</select></label>`;
}
function factionTipHtml(f, which){
  const list=which==="for" ? f.tippingFor : f.tippingAgainst, rows=Array.isArray(list) ? list : [];
  const name=which==="for" ? "For the crew" : "Against the crew";
  return `<h3 class="ref-sub">${name}</h3>${rows.length ? `<ul class="int-list">${rows.map((x, i)=>
      `<li class="int-line fac-tip"><input type="text" data-ftip="${which}|${i}" value="${esc(x)}" aria-label="${name}, line ${i+1}" autocomplete="off">
        <button type="button" class="btn sm" data-ftipdel="${which}|${i}" aria-label="Remove line ${i+1} of ${name}">Remove</button></li>`).join("")}</ul>` : ""}
    <p><button type="button" class="btn sm" data-ftipadd="${which}" aria-label="Add a line to ${name}">Add a line</button></p>`;
}
function clockHtml(c){
  const editing=S.clockEdit===c.id, full=c.filled>=c.segments, nm=String(c.name||"").trim() || "A clock";
  const fields=editing ? `<div class="cast-codex clock-fields">
      <label class="field"><span>Name</span><input type="text" data-kf="name" value="${esc(c.name)}" autocomplete="off"></label>
      <label class="field"><span>Segments</span><input type="number" step="1" min="2" max="12" inputmode="numeric" data-kf="segments" value="${esc(c.segments)}"></label>
    </div>
    <label class="field"><span>What advances it</span><textarea data-kf="advances">${esc(c.advances)}</textarea></label>
    <label class="field"><span>When it fills</span><textarea data-kf="whenFull">${esc(c.whenFull)}</textarea></label>
    <p class="clock-btns"><button type="button" class="btn danger" data-clkdel>Delete</button> <button type="button" class="btn" data-clkdone>Done</button></p>` : "";
  return `<div class="clock${full ? " full" : ""}" data-clock="${esc(c.id)}">
    <h3 class="clock-name" data-clockname tabindex="-1">${esc(nm)}</h3>
    <div class="clock-row"><div class="clock-boxes" aria-hidden="true">${clockBoxesHtml(c)}</div>
      <span class="clock-count" role="status">${c.filled} of ${c.segments}</span>
      <span class="clock-btns"><button type="button" class="btn sm clock-step" data-clkminus aria-label="Take one off ${esc(nm)}"${c.filled<=0 ? " disabled" : ""}>−</button>
      <button type="button" class="btn sm clock-step" data-clkplus aria-label="Add one to ${esc(nm)}"${full ? " disabled" : ""}>+</button>
      ${editing ? "" : `<button type="button" class="btn sm" data-clkedit aria-label="Edit ${esc(nm)}">Edit</button>`}</span></div>
    <p class="clock-full" data-clockfull${full ? "" : " hidden"}><strong>Full</strong>${c.whenFull.trim() ? ` · ${esc(c.whenFull)}` : ""}</p>
    ${fields}</div>`;
}
const clockBoxesHtml = c => Array.from({ length:c.segments }, (_, i)=>`<span class="clock-box${i<c.filled ? " on" : ""}"></span>`).join("");
// What a card says of an owner's clocks: "2 clocks · 1 full", or nothing. The faction's card and the place's are one rule.
function clockCountText(clocks){
  const full=clocks.filter(c=>c.filled>=c.segments).length;
  return clocks.length ? `${clocks.length} ${clocks.length===1 ? "clock" : "clocks"}${full ? ` · ${full} full` : ""}` : "";
}
// The clocks an owner has, `owner` being { kind, id }, and the press that adds one. One piece on every page that owns clocks.
// An ended encounter's clocks (252): the stored values as text, with no buttons, so it is never bound.
function clockReadHtml(c){
  const full=c.filled>=c.segments, nm=String(c.name||"").trim() || "A clock";
  return `<div class="clock${full ? " full" : ""}" data-clock="${esc(c.id)}">
    <h3 class="clock-name" data-clockname tabindex="-1">${esc(nm)}</h3>
    <div class="clock-row"><div class="clock-boxes" aria-hidden="true">${clockBoxesHtml(c)}</div><span class="clock-count">${c.filled} of ${c.segments}</span></div>
    ${full ? `<p class="clock-full"><strong>Full</strong>${c.whenFull.trim() ? ` · ${esc(c.whenFull)}` : ""}</p>` : ""}</div>`;
}
function clocksHtml(owner, opts){
  if (opts && opts.readOnly){
    const list=Engine.clocksOn(S.table, owner);
    return list.length ? `<div data-fclocks>${list.map(clockReadHtml).join("")}</div>` : "";
  }
  return `<div data-fclocks>${Engine.clocksOn(S.table, owner).map(clockHtml).join("")}</div>
    <p><button type="button" class="btn sm" data-clkadd>Add a clock</button></p>`;
}
function bindClocks(main, owner){
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); };
  const clockEdit = (cid, o) => tableChange(()=>Engine.editClock(S.table, cid, o), false);
  const clockOf = cid => Engine.clocksOn(S.table, owner).find(c=>c.id===cid);
  const paintClock = cid => {
    const c=clockOf(cid), root=main.querySelector(attrSel("data-clock", cid)); if (!c || !root) return;
    const full=c.filled>=c.segments;
    root.querySelector(".clock-boxes").innerHTML=clockBoxesHtml(c);
    root.querySelector(".clock-count").textContent=`${c.filled} of ${c.segments}`;
    root.querySelector("[data-clkminus]").disabled=c.filled<=0;
    root.querySelector("[data-clkplus]").disabled=full;
    root.classList.toggle("full", full);
    const msg=root.querySelector("[data-clockfull]");
    msg.hidden=!full;
    msg.innerHTML=`<strong>Full</strong>${c.whenFull.trim() ? ` · ${esc(c.whenFull)}` : ""}`;
  };
  const redrawClocks = () => { main.querySelector("[data-fclocks]").innerHTML=Engine.clocksOn(S.table, owner).map(clockHtml).join(""); bindAll(); };
  const bindAll = () => main.querySelectorAll("[data-clock]").forEach(root=>{
    const cid=root.dataset.clock, q = sel => root.querySelector(sel);
    q("[data-clkplus]").onclick=()=>{ const c=clockOf(cid); if (!c) return; clockEdit(cid, { filled:c.filled+1 }); paintClock(cid); if (q("[data-clkplus]").disabled) q("[data-clkminus]").focus(); };
    q("[data-clkminus]").onclick=()=>{ const c=clockOf(cid); if (!c) return; clockEdit(cid, { filled:c.filled-1 }); paintClock(cid); if (q("[data-clkminus]").disabled) q("[data-clkplus]").focus(); };
    const ed=q("[data-clkedit]");
    if (ed) ed.onclick=()=>{ S.clockEdit=cid; redrawClocks(); focus(`${attrSel("data-clock", cid)} [data-kf="name"]`); };
    root.querySelectorAll("[data-kf]").forEach(el=>{
      const key=el.dataset.kf, fn=ev=>{
        if (key==="segments"){
          // Typing "12" passes through "1": only a whole number from 2 to 12 is taken, while typing or on leaving the field.
          const n=Number(el.value.trim());
          if (!(el.value.trim()!=="" && Number.isInteger(n) && n>=2 && n<=12)){
            // Writes nothing: a refused number must not reset the clock. Leaving the field puts back what is stored.
            if (ev.type==="change"){ const c=clockOf(cid); if (c) el.value=c.segments; }
            return;
          }
        }
        clockEdit(cid, { [key]:el.value });
        if (key==="name"){ const c=clockOf(cid); root.querySelector("[data-clockname]").textContent=c && c.name.trim() || "A clock"; }
        if (key==="segments" || key==="whenFull") paintClock(cid);
        if (key==="segments" && ev.type==="change"){ const c=clockOf(cid); if (c) el.value=c.segments; }
      };
      el.addEventListener("input", fn); el.addEventListener("change", fn);
    });
    const done=q("[data-clkdone]");
    if (done) done.onclick=()=>{ S.clockEdit=null; redrawClocks(); focus(`${attrSel("data-clock", cid)} [data-clkedit]`); };
    const del=q("[data-clkdel]");
    if (del) del.onclick=()=>{ tableChange(()=>Engine.removeClock(S.table, cid), false); S.clockEdit=null; redrawClocks(); focus("[data-clkadd]"); };
  });
  bindAll();
  main.querySelector("[data-clkadd]").onclick=()=>{
    let cid; tableChange(()=>{ cid=Engine.addClock(S.table, { on:owner, name:"New clock", segments:4 }).id; }, false);
    S.clockEdit=cid; redrawClocks();
    const el=$("main").querySelector(`${attrSel("data-clock", cid)} [data-kf="name"]`); if (el){ el.focus(); el.select(); }
  };
}
function factionPageHtml(f){
  const t=S.table, entry=Engine.gazetteerEntry(f.from && f.from.id), g=Engine.gazetteer({});
  const opt=(value, name, on) => `<option value="${esc(value)}"${on ? " selected" : ""}>${esc(name)}</option>`;
  const terr=g.territories.find(r=>r.entry.id===f.territory);
  const unknownT=f.territory && !terr ? opt(f.territory, f.territory, true) : "";
  const tied=Engine.factionAffiliated(t, f.id), title=Engine.factionTitle(t, f);
  return `<p><button class="btn sm" data-fback>Back to ${esc(factionBackTitle())}</button></p>
    <h1 class="step-title tbl-title cast-title" data-ftitle tabindex="-1">${esc(title)}</h1>
    <label class="field"><span>Name</span><input type="text" data-ff="name" value="${esc(f.name)}" placeholder="${esc(entry ? entry.name : f.from && f.from.name || "Who are they?")}" autocomplete="off"></label>
    <div class="tag-choice"><span>Type</span><div data-ftypes>${factionToggleHtml("data-ftype", "Type", Engine.FACTION_TYPES.map(k=>[k, Engine.FACTION_TYPE_LABELS[k], ""]), f.type)}</div></div>
    <div class="cast-codex">
      <label class="field"><span>Territory</span><select data-ff="territory"><option value=""${!f.territory ? " selected" : ""}>None</option>${g.territories.map(r=>opt(r.entry.id, r.entry.name, r.entry.id===f.territory)).join("")}${unknownT}</select></label>
      <label class="field"><span>Base</span><input type="text" data-ff="base" value="${esc(f.base)}" autocomplete="off"></label>
    </div>
    <h2 class="cast-h">Key NPCs</h2>
    <div data-fkeys>${factionKeysHtml(t, f)}</div>
    <label class="field"><span>What they want</span><textarea data-ff="wants">${esc(f.wants)}</textarea></label>
    <label class="field"><span>Resources &amp; reach</span><textarea data-ff="reach">${esc(f.reach)}</textarea></label>
    <h2 class="cast-h">Tipping points</h2>
    <div data-ftipgroup="for">${factionTipHtml(f, "for")}</div>
    <div data-ftipgroup="against">${factionTipHtml(f, "against")}</div>
    <div class="tag-choice"><span>Stance</span><div data-fstances>${factionToggleHtml("data-fstance", "Stance", FACTION_STANCE_STEPS.map(([v, text, name])=>[String(v), text, name]), f.stance===null ? "" : String(f.stance))}</div></div>
    <div class="tag-choice"><span>Attention</span><div data-fattns>${factionToggleHtml("data-fattn", "Attention", Engine.FACTION_ATTENTION.map(k=>[k, FACTION_ATTENTION_LABELS[k], ""]), f.attention)}</div></div>
    <label class="field"><span>Notes</span><textarea data-ff="notes" placeholder="What the crew should remember about them.">${esc(f.notes)}</textarea></label>
    ${entry && entry.summary ? `<h2 class="cast-h">From the book</h2><p class="city-sum">${esc(entry.summary)}</p>` : ""}
    ${tied.length ? `<h2 class="cast-h">Tied by affiliation</h2><ul class="int-list">${tied.map(n=>
      `<li class="int-line"><button class="cast-open int-who" data-copen="${esc(n.id)}" data-cwhere="aff|${esc(n.id)}">${esc(String(n.name||"").trim() || "Unnamed")}</button></li>`).join("")}</ul>` : ""}
    <h2 class="cast-h">Clocks</h2>
    ${clocksHtml({ kind:"faction", id:f.id })}
    <p class="cast-delete"><button class="btn danger" data-fdel>Delete</button></p>`;
}
// Opened from a member's page: the page as it was, so Back returns there, on the link (Decision 244).
function memberRoute(key){
  return { kind:"member", key, tsection:S.tsection, castOpen:S.castOpen, castView:S.castView, castFrom:S.castFrom, backEnc:S.backEnc, backSess:S.backSess,
    backClose:S.backClose, backCity:S.backCity, placeOpen:S.placeOpen, placeRoute:S.placeRoute, sessOpen:S.sessOpen, castQ:S.castQ, closeView:S.closeOut ? S.closeOut.view : false,
    factionOpen:S.factionOpen, factionRoute:S.factionRoute, cityView:S.cityView };
}
function castKeyToHtml(n){
  const of=Engine.factionsKeyFor(S.table, n.id);
  return of.length ? `<h2 class="cast-h">Key to</h2><ul class="int-list">${of.map(f=>
    `<li class="int-line"><button class="cast-open int-who" data-fopen="${esc(f.id)}">${esc(Engine.factionTitle(S.table, f))}</button></li>`).join("")}</ul>` : "";
}
function openFactionPage(id, route){
  S.factionOpen=id; S.factionRoute=route||null; S.placeOpen=null; S.clockEdit=null; S.cityView="factions"; S.tsection="city";
  window.scrollTo(0,0); update();
  const h=$("main").querySelector("[data-ftitle]"); if (h) takeFocus(h, true);
}
function factionBack(){
  const r=S.factionRoute, id=S.factionOpen, focus=sel=>{ const el=$("main").querySelector(sel); if (el) el.focus(); return !!el; };
  S.factionOpen=null; S.factionRoute=null; S.clockEdit=null;
  if (r && r.kind==="member"){
    Object.assign(S, { tsection:r.tsection, castOpen:r.castOpen, castView:r.castView, castFrom:r.castFrom, backEnc:r.backEnc, backSess:r.backSess, backClose:r.backClose,
      backCity:r.backCity||null, placeOpen:r.placeOpen||null, placeRoute:r.placeRoute||null, sessOpen:r.sessOpen, castQ:r.castQ });
    S.factionOpen=r.factionOpen||null; S.factionRoute=r.factionRoute||null; if (r.cityView) S.cityView=r.cityView;
    if (S.closeOut) S.closeOut.view=r.closeView;
    window.scrollTo(0,0); update();
    const link=$("main").querySelector(attrSel("data-fopen", r.key));
    if (link) link.focus(); else { const h=$("main").querySelector("h1"); if (h) takeFocus(h, true); }
    return;
  }
  S.tsection="city"; window.scrollTo(0,0);
  if (r && r.kind==="city"){ S.cityView="city"; update(); focus(r.sel) || focus('[data-cityview="city"]'); return; }
  S.cityView="factions"; update();
  focus(attrSel("data-fcardopen", id)) || focus("[data-fadd-name]") || focus('[data-cityview="factions"]');
}
function bindFactionList(main){
  const nameEl=main.querySelector("[data-fadd-name]");
  const add=()=>{
    const name=nameEl.value; if (!name.trim()) return;
    let id; tableChange(()=>{ id=Engine.addFaction(S.table, { name }).id; });
    if (!Engine.factionList(S.table, { q:S.factionQ||"" }).some(f=>f.id===id)){ S.factionQ=""; renderTable(); }
    const el=$("main").querySelector("[data-fadd-name]"); if (el) el.focus();
  };
  main.querySelector("[data-fadd]").onclick=add;
  nameEl.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); add(); } });
  main.querySelector("[data-fsearch]").oninput=ev=>{ S.factionQ=ev.target.value; main.querySelector("[data-factionlist]").innerHTML=factionListHtml(S.table); bindFactionCards(main); };
  bindFactionCards(main);
}
function bindFactionCards(main){
  main.querySelectorAll("[data-fcardopen]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); openFactionPage(b.dataset.fcardopen, null); });
  main.querySelectorAll("[data-fcard]").forEach(li=>li.onclick=ev=>{ if (!ev.target.closest("button")) openFactionPage(li.dataset.fcard, null); });
}
function bindFactionPage(main, f){
  const id=f.id, own=()=>factionRecords().find(x=>x.id===id) || f;
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); };
  const edit = o => tableChange(()=>Engine.editFaction(S.table, id, o), false);
  main.querySelectorAll("[data-ff]").forEach(el=>{
    const key=el.dataset.ff, fn=()=>{
      edit({ [key]:el.value });
      if (key==="name"){ const h=main.querySelector("[data-ftitle]"); if (h) h.textContent=Engine.factionTitle(S.table, own()); }
    };
    el.addEventListener("input", fn); el.addEventListener("change", fn);
  });
  // A group of toggles: the pressed one is cleared by a second press; only that group repaints.
  const toggles = (attr, key, parse) => main.querySelectorAll(`[${attr}]`).forEach(b=>b.onclick=()=>{
    const v=parse(b.getAttribute(attr)), on=own()[key]===v ? null : v;
    edit({ [key]:on });
    main.querySelectorAll(`[${attr}]`).forEach(x=>{ const pressed=on!==null && parse(x.getAttribute(attr))===on; x.classList.toggle("on", pressed); x.setAttribute("aria-pressed", String(pressed)); });
  });
  toggles("data-ftype", "type", v=>v);
  toggles("data-fstance", "stance", v=>Number(v));
  toggles("data-fattn", "attention", v=>v);
  bindFightLinks(main);
  const bindKeys = () => {
    const box=main.querySelector("[data-fkeys]");
    box.querySelectorAll("[data-copen]").forEach(b=>b.onclick=ev=>openMember(ev, b));
    box.querySelectorAll("[data-fkeydel]").forEach(b=>b.onclick=()=>{ edit({ removeKey:b.dataset.fkeydel }); redrawKeys(); focus("[data-fkeyadd]"); });
    const sel=box.querySelector("[data-fkeyadd]");
    sel.addEventListener("change", ()=>{ if (!sel.value) return; edit({ addKey:sel.value }); redrawKeys(); focus("[data-fkeyadd]"); });
  };
  const redrawKeys = () => { main.querySelector("[data-fkeys]").innerHTML=factionKeysHtml(S.table, own()); bindKeys(); };
  const openMember = (ev, b) => { ev.stopPropagation();
    S.tsection="cast"; S.castOpen=b.dataset.copen; S.backEnc=null; S.backSess=false; S.backClose=false; S.backCity={ kind:"faction", id };
    S.castFrom=b.dataset.cwhere ? attrSel("data-cwhere", b.dataset.cwhere) : null; S.intAdd=null;
    window.scrollTo(0,0); update(); focus("[data-cback]"); };
  bindKeys();
  main.querySelectorAll(".int-list [data-copen]").forEach(b=>{ if (!b.closest("[data-fkeys]")) b.onclick=ev=>openMember(ev, b); });
  // Tipping points: typed lines, added and removed one at a time.
  const tipKey = which => which==="for" ? "tippingFor" : "tippingAgainst";
  const bindTips = which => {
    const box=main.querySelector(`[data-ftipgroup="${which}"]`);
    box.querySelectorAll("[data-ftip]").forEach(el=>{
      const i=+el.dataset.ftip.split("|")[1], fn=()=>{ const list=[...own()[tipKey(which)]]; list[i]=el.value; edit({ [tipKey(which)]:list }); };
      el.addEventListener("input", fn); el.addEventListener("change", fn);
    });
    box.querySelectorAll("[data-ftipdel]").forEach(b=>b.onclick=()=>{
      const i=+b.dataset.ftipdel.split("|")[1], list=[...own()[tipKey(which)]]; list.splice(i, 1);
      edit({ [tipKey(which)]:list }); redrawTips(which);
      focus(`[data-ftip="${which}|${Math.min(i, list.length-1)}"]`); if (!list.length) focus(`[data-ftipadd="${which}"]`);
    });
    box.querySelector("[data-ftipadd]").onclick=()=>{
      const list=[...own()[tipKey(which)], ""]; edit({ [tipKey(which)]:list }); redrawTips(which); focus(`[data-ftip="${which}|${list.length-1}"]`);
    };
  };
  const redrawTips = which => { main.querySelector(`[data-ftipgroup="${which}"]`).innerHTML=factionTipHtml(own(), which); bindTips(which); };
  bindTips("for"); bindTips("against");
  bindClocks(main, { kind:"faction", id });
  main.querySelector("[data-fback]").onclick=factionBack;
  main.querySelector("[data-fdel]").onclick=()=>{
    const title=Engine.factionTitle(S.table, own()), n=factionClocks(own()).length;
    askFirst({ title:`Delete ${title}?`, text:`Its page goes with it${n ? `, and its ${n} ${n===1 ? "clock" : "clocks"}` : ""}. Key NPCs stay in the cast.`, yes:"Delete",
      then(){
        S.factionOpen=null; S.factionRoute=null; S.clockEdit=null; S.cityView="factions";
        tableChange(()=>Engine.removeFaction(S.table, id));
        const el=$("main").querySelector("[data-fadd-name]") || $("main").querySelector("[data-cityview][aria-pressed=true]"); if (el) el.focus();
      } });
  };
}

// ── Sessions and threads (Decisions 203–204) ───────────────────────────
// State is on S: S.sessOpen (a session's id, or null for the tab), S.threadAdd
// (the add field's text), and which Threads rows have their More open. Every
// field saves as it's typed, like a note, with no draft kept anywhere else.
const JOURNAL = [
  ["happened", "What happened", "Major events · Key decisions made by the PCs"],
  ["fallout", "Consequences and fallout", "Immediate consequences · Unresolved outcomes · Who was affected? · Escalations in motion"],
  ["threads", "New threads", "Open hooks · Player interests · Questions raised"],
  ["impact", "Faction and city impact", "Faction shifts · City-level changes"],
  ["reflection", "Session close reflection", "What worked well? · What felt slow or unclear?"],
  ["seed", "Seed for next session", "Situation · Likely turning point · Possible escalation"]];
const THREAD_STATUS_LABELS = { open:"Open", resolved:"Resolved", dropped:"Dropped" };
function sessOpenNow(){ return S.sessOpen ? (S.table.sessions||[]).find(s=>s.id===S.sessOpen) || null : null; }
const threadTitle = h => String(h.title||"").trim() || "Untitled";
const sessionById = id => id ? (S.table.sessions||[]).find(s=>s.id===id) || null : null;
const hoursText = n => `${n} hour${n===1 ? "" : "s"}`;
// One line for a session: its number, day, who came and how long.
function sessionLine(s){
  return [ Engine.sessionTitle(s), s.date ? dayText(s.date) : "", (s.present||[]).join(", "), typeof s.hours==="number" ? hoursText(s.hours) : "" ].filter(Boolean).join(" · ");
}
// Every crew name the table knows, spelled as first written, for the Who was there field.
function sessionCrewNames(t){
  const seen=new Map(), add = n => { const k=String(n||"").trim(); if (k && !seen.has(k.toLowerCase())) seen.set(k.toLowerCase(), k); };
  Engine.crewView(t, {}).forEach(g=>add(g.name));
  (t.sessions||[]).forEach(s=>(s.present||[]).forEach(add));
  (t.encounters||[]).forEach(e=>(e.rows||[]).forEach(r=>{ if (r && r.kind==="pc") add(r.name); }));
  return [...seen.values()].sort((a, b)=>a.toLowerCase().localeCompare(b.toLowerCase()));
}
function nextSessionHtml(t){
  const n=Engine.nextSession(t);
  if (!(t.sessions||[]).length && !(t.threads||[]).length)
    return `<p class="step-note">Nothing yet. Start a session when you sit down to play, or add a thread you want to follow.</p>`;
  const open = h => `<button type="button" class="cast-open" data-thopen="${esc(h.id)}">${esc(threadTitle(h))}</button>`;
  if (!n.current && !n.open.length && !n.seed && !n.unbuilt.length)
    return `<p class="step-note">${n.last ? "Nothing open, and last session set nothing up." : "Nothing open yet."}</p>`;
  return `<div class="next-session">
    ${n.current ? `<p class="next-current"><span class="next-tag">Current</span> ${open(n.current)}</p>` : ""}
    ${n.open.length ? `<h3 class="next-h">Still open</h3><ul class="int-list next-list">${n.open.map(h=>`<li>${open(h)}</li>`).join("")}</ul>` : ""}
    ${n.seed ? `<h3 class="next-h">Last session set up</h3>
      <p><button type="button" class="cast-open" data-sopen="${esc(n.last.id)}">${esc(sessionLine(n.last))}</button></p>
      <p class="next-seed">${esc(n.seed)}</p>` : ""}
    ${n.unbuilt.length ? `<h3 class="next-h">Met last session, no stat block yet</h3><ul class="int-list next-list">${n.unbuilt.map(m=>
      `<li><button type="button" class="cast-open int-who" data-copen="${esc(m.id)}" data-cwhere="met|${esc(m.id)}">${esc(m.name.trim() || "Unnamed")}</button></li>`).join("")}</ul>` : ""}
  </div>`;
}
function threadRowHtml(h){
  const id=esc(h.id), open=h.status==="open", sessions=Engine.sessionList(S.table);
  const more=!!(S.threadMore && S.threadMore[h.id]);
  return `<li class="thread-row" data-thread="${id}">
    <div class="thread-main">
      <input type="text" data-thtitle="${id}" value="${esc(h.title)}" placeholder="Name the thread" aria-label="Thread title" autocomplete="off">
      ${open ? `<button type="button" class="btn sm thread-cur${h.current?" on":""}" data-thcur="${id}" aria-pressed="${h.current}">Current</button>` : ""}
      <select data-thstatus="${id}" aria-label="Status">${Object.keys(THREAD_STATUS_LABELS).map(k=>`<option value="${k}"${k===h.status?" selected":""}>${THREAD_STATUS_LABELS[k]}</option>`).join("")}</select>
      ${open ? "" : `<select data-thclosed="${id}" aria-label="Closed in"><option value="">Closed in…</option>${sessions.map(s=>
        `<option value="${esc(s.id)}"${s.id===h.closed?" selected":""}>${esc(sessionLine(s))}</option>`).join("")}</select>`}
    </div>
    <details class="thread-more" data-thmore="${id}"${more?" open":""}><summary>More</summary>
      <label class="field"><span>Notes</span><textarea data-thnotes="${id}" placeholder="What's known, who's involved.">${esc(h.notes)}</textarea></label>
      <button type="button" class="btn sm danger" data-thdel="${id}">Delete</button></details></li>`;
}
function threadsHtml(t){
  const all=Engine.threadList(t), open=all.filter(h=>h.status==="open"), shut=all.filter(h=>h.status!=="open");
  return `<h2 class="cast-h" tabindex="-1" data-threads-h>Threads</h2>
    <div class="cast-add thread-add">
      <label class="field"><span>New thread</span><input type="text" data-thadd value="${esc(S.threadAdd||"")}" placeholder="What's still open?" autocomplete="off"></label>
      <button type="button" class="btn primary" data-thadd-btn>Add</button></div>
    ${open.length ? `<ul class="int-list">${open.map(threadRowHtml).join("")}</ul>` : all.length ? "" : `<p class="step-note">No threads yet.</p>`}
    ${shut.length ? `<details class="thread-shut" data-thshut${S.threadsShut?" open":""}><summary>Closed (${shut.length})</summary><ul class="int-list">${shut.map(threadRowHtml).join("")}</ul></details>` : ""}`;
}
function sessionsTabHtml(t){
  const list=Engine.sessionList(t);
  return `<h2 class="cast-h" tabindex="-1">Next session</h2>${nextSessionHtml(t)}
    ${threadsHtml(t)}
    <h2 class="cast-h" tabindex="-1">Sessions</h2>
    ${coTotalsHtml(t)}
    <p><button type="button" class="btn primary" data-snew>New session</button></p>
    ${list.length ? `<ul class="roster-list sess-list">${list.map(s=>
      `<li class="sess-item"><button type="button" class="cast-open sess-open" data-sopen="${esc(s.id)}">${esc(sessionLine(s))}</button></li>`).join("")}</ul>`
      : `<p class="step-note">No sessions yet.</p>`}`;
}
function sessionInteractionHtml(t, x, offered){
  return `<li class="int-line" data-sline="${esc(x.id)}">${sentenceHtml(t, x, { where:`sess|${x.id}` })}${offered ? ` <button type="button" class="btn sm" data-sadd="${esc(x.id)}">Add to this session</button>` : ""}</li>`;
}
// What was jotted in this session (Decision 208): the text, then the title when it has one.
function jottedHtml(s){
  const jots=Engine.sessionNotes(S.table, s.id);
  return jots.length ? `<h2 class="cast-h">Jotted</h2><ul class="int-list">${jots.map(n=>{
    const text=n.text.trim(), title=n.title.trim();
    return `<li class="int-line"><button type="button" class="cast-open" data-jotopen="${esc(n.id)}">${esc(text || title || "Untitled note")}${text && title ? ` <span class="int-kind">${esc(title)}</span>` : ""}</button></li>`; }).join("")}</ul>` : "";
}
function sessionPageHtml(s){
  const t=S.table, id=esc(s.id), j=s.journal||{};
  const opened=(t.threads||[]).filter(h=>h.opened===s.id), closed=(t.threads||[]).filter(h=>h.closed===s.id && h.status!=="open");
  const lines=Engine.sessionInteractions(t, s.id), offered=Engine.sessionOffered(t, s.id);
  const threadsBlock = `<div class="sess-threads">
      ${opened.length ? `<ul class="int-list">${opened.map(h=>`<li><button type="button" class="cast-open" data-thopen="${esc(h.id)}">${esc(threadTitle(h))}</button></li>`).join("")}</ul>` : ""}
      <div class="cast-add"><label class="field"><span>Open a thread</span><input type="text" data-sthadd placeholder="What did this session leave open?" autocomplete="off"></label>
        <button type="button" class="btn" data-sthadd-btn>Open a thread</button></div>
      ${closed.length ? `<ul class="int-list">${closed.map(h=>`<li><span class="int-kind">${h.status==="dropped" ? "Dropped" : "Resolved"}</span> ${esc(threadTitle(h))}</li>`).join("")}</ul>` : ""}</div>`;
  return `<p><button type="button" class="btn sm" data-sback>Back to sessions</button></p>
    <h1 class="step-title tbl-title">${esc(Engine.sessionTitle(s))}</h1>
    <div class="sess-head">
      <label class="field"><span>Number</span><input type="number" step="1" min="0" inputmode="numeric" data-sf="number" value="${numAttr(s.number)}"></label>
      <label class="field"><span>Day</span><input type="date" data-sf="date" value="${esc(s.date||"")}"></label>
      <label class="field"><span>Who was there</span><input type="text" data-sf="present" list="sess-crew" value="${esc((s.present||[]).join(", "))}" placeholder="Names, separated by commas" autocomplete="off"></label>
      <label class="field"><span>Hours</span><input type="number" step="0.5" min="0" max="24" inputmode="decimal" data-sf="hours" value="${numAttr(s.hours)}"></label>
    </div>
    ${datalistHtml("sess-crew", sessionCrewNames(t))}
    ${JOURNAL.map(([k, label, hint])=>`<label class="field sess-part"><span>${esc(label)}</span><small class="field-hint">${esc(hint)}</small>
      <textarea data-sj="${k}">${esc(j[k]||"")}</textarea></label>${k==="threads" ? threadsBlock : ""}`).join("")}
    <h2 class="cast-h" tabindex="-1" data-sint-h>What passed between the crew and the cast</h2>
    ${lines.length ? `<ul class="int-list">${lines.map(x=>sessionInteractionHtml(t, x, false)).join("")}</ul>` : `<p class="step-note">Nothing yet.</p>`}
    ${offered.length ? `<h3 class="next-h">Also that day</h3><ul class="int-list" data-soffered>${offered.map(x=>sessionInteractionHtml(t, x, true)).join("")}</ul>` : ""}
    ${jottedHtml(s)}
    ${closeOutSectionHtml(s)}
    <p class="cast-delete"><button type="button" class="btn danger" data-sdel>Delete</button></p>`;
}
function bindSessions(main){
  main.querySelectorAll("[data-jotopen]").forEach(b=>b.onclick=()=>openNote(b.dataset.jotopen));
  const s=sessOpenNow();
  if (s && closeSheetNow(s)) bindCloseOut(main, s);
  else if (s) bindSessionPage(main, s);
  else bindSessionsTab(main);
}
// A Met-last-session name, a thread in Next session, a session in either: the shared taps.
function bindSessionOpeners(main){
  bindFightLinks(main);
  main.querySelectorAll("[data-sopen]").forEach(b=>b.onclick=()=>{
    S.sessOpen=b.dataset.sopen; if (S.closeOut) S.closeOut.view=false; window.scrollTo(0,0); update();
    const el=$("main").querySelector("[data-sback]"); if (el) el.focus(); });
  main.querySelectorAll("[data-copen]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    S.tsection="cast"; S.castOpen=b.dataset.copen; S.backEnc=null; S.backSess=true; S.backClose=false; S.backCity=null; S.castFrom=b.dataset.cwhere ? attrSel("data-cwhere", b.dataset.cwhere) : null; S.intAdd=null;
    window.scrollTo(0,0); update(); const el=$("main").querySelector("[data-cback]"); if (el) el.focus(); });
}
// Open a thread's row in Threads, its More open, and land on its title.
function showThread(id){
  const h=(S.table.threads||[]).find(x=>x.id===id); if (!h) return;
  (S.threadMore || (S.threadMore={}))[id]=true;
  if (h.status!=="open") S.threadsShut=true;
  S.sessOpen=null; window.scrollTo(0,0); renderTable();
  const el=$("main").querySelector(attrSel("data-thtitle", id)); if (el){ el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block:"center" }); }
}
function bindSessionsTab(main){
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); return !!el; };
  bindSessionOpeners(main);
  main.querySelectorAll("[data-thopen]").forEach(b=>b.onclick=()=>showThread(b.dataset.thopen));
  main.querySelector("[data-snew]").onclick=()=>{
    let r; tableChange(()=>{ r=Engine.addSession(S.table, {}); }, false);
    if (!r.ok){ notice(r.why); return; }
    S.sessOpen=r.id; window.scrollTo(0,0); update(); focus('[data-sf="number"]');
  };
  const addEl=main.querySelector("[data-thadd]");
  const add=()=>{
    let r; tableChange(()=>{ r=Engine.addThread(S.table, { title:addEl.value }); }, false);
    if (!r.ok){ notice(r.why); addEl.focus(); return; }
    S.threadAdd=""; renderTable(); focus("[data-thadd]");
  };
  addEl.addEventListener("input", ()=>{ S.threadAdd=addEl.value; });
  addEl.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); add(); } });
  main.querySelector("[data-thadd-btn]").onclick=add;
  const found = id => S.table.threads.find(h=>h.id===id);
  const edit = (id, f) => { let r; tableChange(()=>{ r=Engine.editThread(S.table, id, f); }, false); return r; };
  main.querySelectorAll("[data-thtitle]").forEach(el=>{
    const id=el.dataset.thtitle;
    el.addEventListener("input", ()=>{ edit(id, { title:el.value }); });
    // A blank title is refused: on blur the field shows what's stored.
    el.addEventListener("change", ()=>{ const r=edit(id, { title:el.value }); if (!r.ok) notice(r.why); const h=found(id); if (h) el.value=h.title; });
  });
  main.querySelectorAll("[data-thnotes]").forEach(el=>el.addEventListener("input", ()=>edit(el.dataset.thnotes, { notes:el.value })));
  main.querySelectorAll("[data-thmore]").forEach(d=>d.addEventListener("toggle", ()=>{ (S.threadMore || (S.threadMore={}))[d.dataset.thmore]=d.open; }));
  const shut=main.querySelector("[data-thshut]");
  if (shut) shut.addEventListener("toggle", ()=>{ S.threadsShut=shut.open; });
  main.querySelectorAll("[data-thcur]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.thcur, h=found(id); if (!h) return;
    const r=edit(id, { current:!h.current }); if (!r.ok) notice(r.why);
    renderTable(); focus(attrSel("data-thcur", id));
  });
  main.querySelectorAll("[data-thstatus]").forEach(sel=>sel.onchange=()=>{
    const id=sel.dataset.thstatus, r=edit(id, { status:sel.value }); if (!r.ok) notice(r.why);
    const h=found(id); if (h && h.status!=="open") S.threadsShut=true;
    renderTable(); focus(attrSel("data-thtitle", id));
  });
  main.querySelectorAll("[data-thclosed]").forEach(sel=>sel.onchange=()=>{
    const id=sel.dataset.thclosed; edit(id, { closed:sel.value });
    sel.value=(found(id)||{}).closed||"";
  });
  main.querySelectorAll("[data-thdel]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.thdel, h=found(id); if (!h) return;
    askFirst({ title:`Delete ${threadTitle(h)}?`, text:"It isn't kept anywhere else unless you've exported the table.", yes:"Delete",
      then(){ tableChange(()=>Engine.removeThread(S.table, id)); focus("[data-thadd]"); } });
  });
}
function bindSessionPage(main, s){
  const id=s.id, own=()=>sessOpenNow();
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); return !!el; };
  const edit = f => { let r; tableChange(()=>{ r=Engine.editSession(S.table, id, f); }, false); return r; };
  const title = () => { const h=main.querySelector(".tbl-title"); if (h && own()) h.textContent=Engine.sessionTitle(own()); };
  // Saved as typed. A refused number or hours changes nothing; on blur the field shows what's stored.
  main.querySelectorAll("[data-sf]").forEach(el=>{
    const key=el.dataset.sf, val = () => key==="present" ? splitList(el.value, /,/) : el.value;
    el.addEventListener("input", ()=>{ const r=edit({ [key]:val() }); if (r.ok && key==="number") title(); });
    el.addEventListener("change", ()=>{
      const r=edit({ [key]:val() }); if (!r.ok) notice(r.why);
      const cur=own(); if (!cur) return;
      el.value = key==="present" ? cur.present.join(", ") : key==="number" || key==="hours" ? numAttr(cur[key]) : (cur[key]||"");
      title();
    });
  });
  // The journal's boxes grow with what's written, so a long part reads without a scroll inside it.
  const grow = el => { el.style.height="auto"; el.style.height=(el.scrollHeight+el.offsetHeight-el.clientHeight)+"px"; };
  main.querySelectorAll("[data-sj]").forEach(el=>{ grow(el); el.addEventListener("input", ()=>{ edit({ journal:{ [el.dataset.sj]:el.value } }); grow(el); }); });
  main.querySelector("[data-sback]").onclick=()=>{
    S.sessOpen=null; window.scrollTo(0,0); update(); focus(".sess-open" + attrSel("data-sopen", id));
  };
  main.querySelectorAll("[data-thopen]").forEach(b=>b.onclick=()=>showThread(b.dataset.thopen));
  bindSessionOpeners(main);
  const thEl=main.querySelector("[data-sthadd]");
  const open=()=>{
    let r; tableChange(()=>{ r=Engine.addThread(S.table, { title:thEl.value, opened:id }); }, false);
    if (!r.ok){ notice(r.why); thEl.focus(); return; }
    renderTable(); focus("[data-sthadd]");
  };
  thEl.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); open(); } });
  main.querySelector("[data-sthadd-btn]").onclick=open;
  main.querySelectorAll("[data-sadd]").forEach(b=>b.onclick=()=>{
    const xid=b.dataset.sadd, order=Engine.sessionOffered(S.table, id), at=order.findIndex(x=>x.id===xid);
    let r; tableChange(()=>{ r=Engine.editInteraction(S.table, xid, { session:id }); }, false);
    if (!r.ok){ notice(r.why); return; }
    renderTable();
    // The next offer takes the place of the one added; with none left, the list's heading.
    const btns=$("main").querySelectorAll("[data-sadd]");
    if (btns.length) btns[Math.min(at, btns.length-1)].focus(); else focus("[data-sint-h]");
  });
  main.querySelector("[data-sdel]").onclick=()=>{
    askFirst({ title:`Delete ${Engine.sessionTitle(s)}?`, text:"Its threads and interactions stay; they just won't say which session they were in.", yes:"Delete",
      then(){ S.sessOpen=null; if (S.closeOut && S.closeOut.id===id) S.closeOut=null; tableChange(()=>Engine.removeSession(S.table, id)); focus("[data-snew]"); } });
  };
  bindCloseOutSection(main, s);
}

// ── The close-out (Decisions 205–206) ──────────────────────────────────
// The sheet edits a draft on S before it writes anything, as the encounter's
// wrap-up does (Decision 193), but Back keeps it: S.closeOut = { id, view,
// lines, typed, newcomers } until the log is written or the table closes.
// A line is { name, present, ip, milestone, credits, note } or, for someone
// away, { name, present:false, took, tier, credits, note }; numbers are the
// field's text. `typed` holds `<name>|<field>` for what the GM has typed, so
// a recompute of the hours leaves it be.
const coKey = name => String(name||"").trim().toLowerCase().replace(/[‘’ʼ]/g, "'");
const coTyped = (c, l, f) => !!c.typed[`${coKey(l.name)}|${f}`];
const coNum = v => typeof v==="number" && Number.isFinite(v) ? String(v) : "";
const coMoney = n => n.toLocaleString("en-US");
const coRange = r => r ? `${coMoney(r.min)}–${coMoney(r.max)}` : "";
const crankTiers = () => (((D.resources||{}).crank||{}).tiers)||[];
const crankTierName = id => (crankTiers().find(k=>k.id===id)||{}).name || "";
function closeSheetNow(s){ return !!(S.closeOut && S.closeOut.view && S.closeOut.id===s.id); }
// A new draft from the engine's proposal, or one from what was written.
function closeDraftNew(id, written){
  const d=Engine.closeOutDraft(S.table, id); if (!d) return null;
  const c={ id, view:true, lines:[], typed:{}, newcomers:d.newcomers.map(n=>n.id) };
  const done=new Map(written ? written.lines.map(l=>[coKey(l.name), l]) : []);
  for (const p of d.present){
    const w=done.get(coKey(p.name));
    c.lines.push(w && w.present ? { name:w.name, present:true, ip:coNum(w.ip), milestone:w.milestone, credits:coNum(w.credits), note:w.note }
      : { name:p.name, present:true, ip:coNum(p.ip), milestone:true, credits:"", note:"" });
  }
  for (const a of d.absent){
    const w=done.get(coKey(a.name));
    c.lines.push(w && !w.present ? { name:w.name, present:false, took:true, tier:w.tier||"", credits:coNum(w.credits), note:w.note }
      : { name:a.name, present:false, took:!written, tier:a.tier||"", credits:"", note:"" });
  }
  // What was written but can't be found again (a session since deleted) is kept as it was.
  if (written) for (const w of written.lines) if (!c.lines.some(l=>coKey(l.name)===coKey(w.name)))
    c.lines.push(w.present ? { name:w.name, present:true, ip:coNum(w.ip), milestone:w.milestone, credits:coNum(w.credits), note:w.note }
      : { name:w.name, present:false, took:true, tier:w.tier||"", credits:coNum(w.credits), note:w.note });
  // What was written stays as typed, but an IP that still matches the hours is the app's: changing Hours should move it.
  if (written){
    const mine=new Map(d.present.map(p=>[coKey(p.name), p.ip]));
    for (const l of c.lines){
      const k=coKey(l.name);
      for (const f of ["credits","note","tier"]) c.typed[`${k}|${f}`]=true;
      const worked=mine.get(k);
      if (!l.present || l.ip==="" || worked===undefined || worked===null || String(worked)!==l.ip) c.typed[`${k}|ip`]=true;
    }
  }
  return c;
}
// Who was there or Hours changed: rebuild the lists, keeping what the GM set.
function closeSync(){
  const c=S.closeOut, d=Engine.closeOutDraft(S.table, c.id); if (!d) return;
  // A name typed away mid-edit comes back with what the GM had set: lines that drop out wait in c.gone.
  // Carried by name and side: a name typed away is away for a moment (seen earlier), and must not take the present line's place.
  const side = l => `${coKey(l.name)}|${l.present ? "p" : "a"}`;
  const old=new Map([...Object.entries(c.gone||{}), ...c.lines.map(l=>[side(l), l])]), lines=[];
  for (const p of d.present){
    const o=old.get(`${coKey(p.name)}|p`);
    lines.push({ name:p.name, present:true, ip:o && coTyped(c, o, "ip") ? o.ip : coNum(p.ip),
      milestone:o ? o.milestone : true, credits:o ? o.credits : "", note:o ? o.note : "" });
  }
  for (const a of d.absent){
    const o=old.get(`${coKey(a.name)}|a`);
    lines.push({ name:a.name, present:false, took:o ? o.took : true, tier:o && coTyped(c, o, "tier") ? o.tier : (a.tier||""),
      credits:o ? o.credits : "", note:o ? o.note : "" });
  }
  for (const o of old.values()) if (!o.present && !lines.some(l=>side(l)===side(o)) && !d.present.some(p=>coKey(p.name)===coKey(o.name))) lines.push(o);
  c.gone=Object.fromEntries([...old].filter(([k])=>!lines.some(l=>side(l)===k)));
  c.lines=lines;
}
function coLogLine(l){
  const who=esc(l.name), note=l.note ? esc(l.note) : "";
  if (l.present){
    const head=(l.ip!==null || l.milestone) ? `log a session${l.ip!==null ? ` with <strong>${l.ip} IP</strong>` : ""}${l.milestone ? `${l.ip!==null ? " and" : " with"} the Milestone Point` : ""}` : "";
    const bits=[ head, l.credits!==null ? `+${coMoney(l.credits)} Çredits` : "" ].filter(Boolean).join("; ");
    return `${who}: ${[bits ? bits + "." : "", note].filter(Boolean).join(" ") || "nothing this time."}`;
  }
  const job=`an off-screen job${crankTierName(l.tier) ? `, ${esc(crankTierName(l.tier))}` : ""}`;
  return `${who} (away): no session to log; ${job}${l.credits!==null ? `; +${coMoney(l.credits)} Çredits` : ""}.${note ? ` ${note}` : ""}`;
}
function writtenDay(at){
  const d=new Date(at); if (typeof at!=="string" || isNaN(d)) return "";
  return d.toLocaleDateString(undefined, { day:"numeric", month:"short" });
}
function closeOutSectionHtml(s){
  const c=s.close, name=Number.isFinite(s.number) ? Engine.sessionTitle(s) : "this session";
  if (!c) return `<h2 class="cast-h" tabindex="-1" data-sco-h>Close-out</h2>
    <p><button type="button" class="btn primary" data-co-open>Close out ${esc(name)}</button></p>`;
  const day=writtenDay(c.at);
  return `<h2 class="cast-h" tabindex="-1" data-sco-h>Close-out</h2>
    <p class="step-note">${day ? `Written ${esc(day)}.` : "Written."}</p>
    ${c.lines.length ? `<ul class="int-list co-log">${c.lines.map(l=>`<li class="int-line">${coLogLine(l)}</li>`).join("")}</ul>` : `<p class="step-note">It said nothing.</p>`}
    <p><button type="button" class="btn" data-co-redo>Redo the close-out</button></p>`;
}
function coTotalsHtml(t){
  const totals=Engine.awardTotals(t);
  return totals.length ? `<p class="step-note co-totals">IP so far: ${totals.map(a=>`${esc(a.name)} ${a.ip}`).join(" · ")}</p>` : "";
}
function coIpRows(c){
  const rows=c.lines.map((l, i)=>[l, i]).filter(([l])=>l.present);
  const s=sessionById(c.id);
  return `<h2 class="cast-h" tabindex="-1" data-co-ip-h>Improvement Points</h2>
    <p class="field-hint">${esc(D.ip.perHour)} an hour, rounded up. Change any of it.</p>
    ${!rows.length ? `<p class="step-note">Add who was there to work out IP.</p>` : s && typeof s.hours!=="number" ? `<p class="step-note">Add the hours to work out IP.</p>` : ""}
    <ul class="int-list co-rows">${rows.map(([l, i])=>`<li class="co-row" data-co-row="${i}">
      <span class="co-name">${esc(l.name)}</span>
      <label class="field"><span>IP</span><input type="number" min="0" step="1" inputmode="numeric" data-co="ip" value="${esc(l.ip)}"></label>
      <label class="co-check"><input type="checkbox" data-co="milestone"${l.milestone ? " checked" : ""}> <span>Milestone Point</span></label>
      <label class="field"><span>Çredits</span><input type="number" min="0" step="1" inputmode="numeric" data-co="credits" value="${esc(l.credits)}"></label>
      <label class="field co-note"><span>Note</span><input type="text" data-co="note" value="${esc(l.note)}" autocomplete="off"></label></li>`).join("")}</ul>`;
}
function coAwayRows(c){
  const rows=c.lines.map((l, i)=>[l, i]).filter(([l])=>!l.present);
  if (!rows.length) return "";
  return `<h2 class="cast-h" tabindex="-1" data-co-away-h>Away tonight</h2>
    <ul class="int-list co-rows">${rows.map(([l, i])=>{
      const head=`<span class="co-name">${esc(l.name)}</span>
        <label class="co-check"><input type="checkbox" data-co="took"${l.took ? " checked" : ""}> <span>Took a job</span></label>`;
      if (!l.took) return `<li class="co-row co-folded" data-co-row="${i}">${head}</li>`;
      return `<li class="co-row" data-co-row="${i}">${head}
        <label class="field"><span>Tier</span><select data-co="tier">${l.tier ? "" : `<option value="" selected>Choose a tier</option>`}${crankTiers().map(k=>
          `<option value="${esc(k.id)}"${k.id===l.tier ? " selected" : ""}>${esc(k.name)}</option>`).join("")}</select></label>
        <span class="co-range">${l.tier && Engine.offScreenPay(l.tier) ? `Pays ${esc(coRange(Engine.offScreenPay(l.tier)))}` : ""}</span>
        <label class="field"><span>Çredits</span><input type="number" min="0" step="1" inputmode="numeric" data-co="credits" value="${esc(l.credits)}"></label>
        <label class="field co-note"><span>Note</span><input type="text" data-co="note" value="${esc(l.note)}" autocomplete="off"></label></li>`;
    }).join("")}</ul>`;
}
function coThreads(){
  const open=Engine.threadList(S.table).filter(h=>h.status==="open");
  return `<h2 class="cast-h" tabindex="-1" data-co-threads-h>Threads</h2>
    ${open.length ? `<ul class="int-list">${open.map(h=>{ const id=esc(h.id); return `<li class="thread-row" data-co-thread="${id}"><div class="thread-main">
      <span class="co-name">${esc(threadTitle(h))}</span>
      <button type="button" class="btn sm thread-cur${h.current?" on":""}" data-co-cur="${id}" aria-pressed="${h.current}">Current</button>
      <select data-co-status="${id}" aria-label="Status">${Object.keys(THREAD_STATUS_LABELS).map(k=>`<option value="${k}"${k===h.status?" selected":""}>${THREAD_STATUS_LABELS[k]}</option>`).join("")}</select></div></li>`; }).join("")}</ul>`
      : `<p class="step-note">No open threads.</p>`}`;
}
function coNewcomers(c){
  const members=c.newcomers.map(id=>(S.table.cast||[]).find(n=>n.id===id)).filter(Boolean);
  if (!members.length) return "";
  return `<h2 class="cast-h" tabindex="-1" data-co-new-h>Anyone new?</h2>
    <ul class="int-list">${members.map(n=>{ const id=esc(n.id); return `<li class="co-new" data-co-member="${id}">
      <button type="button" class="cast-open" data-co-open-cast="${id}">${esc(n.name.trim() || "Unnamed")}</button>
      <div class="co-new-fields">
      <label class="field"><span>What they want</span><input type="text" data-co-cf="motivation" value="${esc(n.motivation)}" autocomplete="off"></label>
      <label class="field"><span>What they've got</span><input type="text" data-co-cf="resources" value="${esc(n.resources)}" autocomplete="off"></label>
      <label class="field"><span>Their line</span><input type="text" data-co-cf="line" value="${esc(n.line)}" autocomplete="off"></label></div></li>`; }).join("")}</ul>`;
}
function coArcHtml(s){
  const a=Engine.arcDue(s.number), t=Engine.sessionTitle(s);
  return [a.minor ? "a Minor" : "", a.major ? "a Major" : ""].filter(Boolean).map(w=>
    `<p class="co-arc">${esc(t)}: ${w} Milestone comes due. Each player's sheet counts their own.</p>`).join("");
}
function coListsHtml(s){
  const c=S.closeOut;
  return `${coIpRows(c)}${coAwayRows(c)}${coArcHtml(s)}${coThreads()}${coNewcomers(c)}`;
}
function closeSheetHtml(s){
  const hasNumber=Number.isFinite(s.number), title=Engine.sessionTitle(s);
  return `<p><button type="button" class="btn sm" data-co-back>Back to ${hasNumber ? esc(title) : "the session"}</button></p>
    <h1 class="step-title tbl-title">Close out ${hasNumber ? esc(title) : "this session"}</h1>
    <div class="sess-head">
      <label class="field"><span>Who was there</span><input type="text" data-cosf="present" list="sess-crew" value="${esc((s.present||[]).join(", "))}" placeholder="Names, separated by commas" autocomplete="off"></label>
      <label class="field"><span>Hours</span><input type="number" step="0.5" min="0" max="24" inputmode="decimal" data-cosf="hours" value="${numAttr(s.hours)}"></label>
    </div>
    ${datalistHtml("sess-crew", sessionCrewNames(S.table))}
    <div data-co-lists>${coListsHtml(s)}</div>
    <p class="co-write"><button type="button" class="btn primary" data-co-write>Write the award log</button></p>`;
}
function bindCloseOut(main, s){
  const id=s.id, c=S.closeOut;
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); return !!el; };
  const box=main.querySelector("[data-co-lists]");
  const lineOf = el => c.lines[+el.closest("[data-co-row]").dataset.coRow];
  const drawLists = () => { box.innerHTML=coListsHtml(sessionById(id)||s); bindLists(); };
  const edit = f => { let r; tableChange(()=>{ r=Engine.editSession(S.table, id, f); }, false); return r; };
  const cur = () => sessionById(id) || s;
  main.querySelectorAll("[data-cosf]").forEach(el=>{
    const key=el.dataset.cosf, val = () => key==="present" ? splitList(el.value, /,/) : el.value;
    el.addEventListener("input", ()=>{
      const r=edit({ [key]:val() });
      if (r.ok){ closeSync(); drawLists(); }
    });
    el.addEventListener("change", ()=>{
      const r=edit({ [key]:val() }); if (!r.ok) notice(r.why);
      el.value = key==="present" ? cur().present.join(", ") : numAttr(cur().hours);
      closeSync(); drawLists();
    });
  });
  main.querySelector("[data-co-back]").onclick=()=>{
    c.view=false; window.scrollTo(0,0); update(); focus("[data-co-open]");
  };
  main.querySelector("[data-co-write]").onclick=()=>{
    const lines=c.lines.filter(l=>l.present || l.took).map(l=>l.present
      ? { name:l.name, present:true, ip:l.ip, milestone:l.milestone, credits:l.credits, note:l.note }
      : { name:l.name, present:false, ip:null, milestone:false, credits:l.credits, tier:l.tier, note:l.note });
    const sess=S.table.sessions.find(x=>x.id===id);
    let r; tableChange(()=>{ r=Engine.writeCloseOut(S.table, id, { lines }); }, false, `Closed out ${Engine.sessionTitle(sess)}`);
    if (!r.ok){
      notice(r.why);
      const at = r.field ? c.lines.findIndex(l=>l.name===r.name) : -1;
      const el = at>=0 && main.querySelector(`[data-co-row="${at}"] [data-co="${r.field}"]`);
      if (el) el.focus(); else focus('[data-cosf="present"]');
      return;
    }
    S.closeOut=null; window.scrollTo(0,0); update(); focus("[data-sco-h]");
  };
  function bindLists(){
    box.querySelectorAll("[data-co]").forEach(el=>{
      const f=el.dataset.co;
      if (f==="took"){
        el.onchange=()=>{ const l=lineOf(el); l.took=el.checked; drawLists(); focus(`[data-co-row="${c.lines.indexOf(l)}"] [data-co="took"]`); };
      } else if (f==="milestone"){
        el.onchange=()=>{ lineOf(el).milestone=el.checked; };
      } else if (f==="tier"){
        el.onchange=()=>{ const l=lineOf(el); l.tier=el.value; c.typed[`${coKey(l.name)}|tier`]=true; drawLists(); focus(`[data-co-row="${c.lines.indexOf(l)}"] [data-co="tier"]`); };
      } else {
        el.oninput=()=>{ const l=lineOf(el); l[f]=el.value; c.typed[`${coKey(l.name)}|${f}`]=true; };
      }
    });
    box.querySelectorAll("[data-co-cur]").forEach(b=>b.onclick=()=>{
      const tid=b.dataset.coCur, h=S.table.threads.find(x=>x.id===tid); if (!h) return;
      let r; tableChange(()=>{ r=Engine.editThread(S.table, tid, { current:!h.current }); }, false);
      if (!r.ok) notice(r.why);
      drawLists(); focus(attrSel("data-co-cur", tid));
    });
    box.querySelectorAll("[data-co-status]").forEach(sel=>sel.onchange=()=>{
      const tid=sel.dataset.coStatus, ids=[...box.querySelectorAll("[data-co-status]")].map(e=>e.dataset.coStatus), at=ids.indexOf(tid);
      let r; tableChange(()=>{ r=Engine.editThread(S.table, tid, { status:sel.value, closed:id }); }, false);
      if (!r.ok) notice(r.why);
      drawLists();
      // The thread leaves the list: focus goes to the one that took its place, else the heading.
      const left=[...box.querySelectorAll("[data-co-status]")];
      if (left.length && sel.value!=="open") left[Math.min(at, left.length-1)].focus();
      else if (!focus(attrSel("data-co-status", tid))) focus("[data-co-threads-h]");
    });
    box.querySelectorAll("[data-co-cf]").forEach(el=>el.oninput=()=>{
      const mid=el.closest("[data-co-member]").dataset.coMember;
      tableChange(()=>Engine.editCastMember(S.table, mid, { [el.dataset.coCf]:el.value }), false);
    });
    box.querySelectorAll("[data-co-open-cast]").forEach(b=>b.onclick=()=>{
      S.tsection="cast"; S.castOpen=b.dataset.coOpenCast; S.backEnc=null; S.backSess=false; S.backClose=true; S.castFrom=null; S.intAdd=null;
      window.scrollTo(0,0); update(); focus("[data-cback]");
    });
  }
  bindLists();
}
function bindCloseOutSection(main, s){
  const id=s.id, focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); return !!el; };
  const open=main.querySelector("[data-co-open]"), redo=main.querySelector("[data-co-redo]");
  const show = c => { S.closeOut=c; window.scrollTo(0,0); update(); focus('[data-cosf="present"]'); };
  if (open) open.onclick=()=>{
    if (S.closeOut && S.closeOut.id===id){
      // Resuming: the same lines, and a fresh look at who is new.
      const d=Engine.closeOutDraft(S.table, id);
      S.closeOut.view=true; S.closeOut.newcomers=d ? d.newcomers.map(n=>n.id) : [];
      closeSync(); show(S.closeOut); return;
    }
    show(closeDraftNew(id, null));
  };
  if (redo) redo.onclick=()=>{
    askFirst({ title:"Redo the close-out?", text:"You'll start from what's written; writing again replaces it.", yes:"Redo", danger:false,
      then(){ show(closeDraftNew(id, s.close)); } });
  };
}

// ── Packs: a book a GM slots in, one key each, outside every table ─────
// (Decisions 180–181.) An entry is { pack, imported }. Every table in the
// browser reads every pack here; no table file carries pack content. A pack
// in storage goes back through the gate on every read: a person could have
// edited it.
const PACK_PREFIX = "shadows.pack.v1.";
const packKey = id => PACK_PREFIX + id;
let packsMemo = [];   // the packs the last table draw read, in the order packEntries() gives
const packName = (p, none="Untitled pack") => String((p && p.meta && p.meta.name) || "").trim() || none;
function readPackEntry(key){
  try{
    const r=localStorage.getItem(key), v=r && JSON.parse(r);
    return v && typeof v==="object" && v.pack && typeof v.pack==="object" ? v : null;
  }catch(e){ return null; }
}
function savedPack(id){ return Engine.isPackId(id) ? readPackEntry(packKey(id)) : null; }
// Every slotted pack, by name.
function packEntries(){
  const out=[];
  try{
    for (let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if (!k || k.indexOf(PACK_PREFIX)!==0 || !Engine.isPackId(k.slice(PACK_PREFIX.length))) continue;
      const e=readPackEntry(k); if (!e) continue;
      const pack=Engine.migratePack(e.pack), id=k.slice(PACK_PREFIX.length);
      if (pack.meta.id===id) out.push({ id, pack, imported:e.imported });
    }
  }catch(e){}
  return out.sort((a,b)=>packName(a.pack).toLowerCase().localeCompare(packName(b.pack).toLowerCase()) || (a.id<b.id ? -1 : 1));
}
function removePack(id){ try{ localStorage.removeItem(packKey(id)); }catch(e){} }
function packsNow(){ packsMemo = featureOn("gm") ? packEntries().map(e=>e.pack) : []; return packsMemo; }

// The newer copy of a pack is the one with the later meta.updated, as a table's is.
function packSupersedes(incoming, saved){
  if (!saved) return true;
  const a=Date.parse(incoming.meta.updated), b=Date.parse(saved.meta.updated);
  return Number.isFinite(a) && Number.isFinite(b) && a>=b;
}
function gmImportPack(raw){
  const p=Engine.migratePack(raw), chk=Engine.packCheck(p);
  if (chk.refuse){ notice(chk.refuse); return; }
  const have=savedPack(p.meta.id), haveP=have && Engine.migratePack(have.pack);
  if (haveP && !packSupersedes(p, haveP)){
    openModal({ title:`Put an older copy of ${packName(haveP)} in place of the newer one?`,
      html:`<p>This file is older than the copy of <b>${esc(packName(haveP))}</b> slotted in here. Slotting it in puts it in place of the newer one.</p>`,
      foot:`<button class="btn" data-modalclose>Cancel</button><button class="btn primary" data-replacego>Put the older copy in place</button>`,
      bind(body, foot){
        foot.querySelector("[data-replacego]").onclick=()=>{ closeModal(); slotPack(p, chk.warnings); };
        foot.querySelector("[data-modalclose]").focus();
      } });
    return;
  }
  slotPack(p, chk.warnings);
}
// One setItem, so a pack that doesn't fit leaves what was there as it was.
function slotPack(p, warnings){
  try{ localStorage.setItem(packKey(p.meta.id), JSON.stringify({ pack:p, imported:new Date().toISOString() })); }
  catch(e){ notice("This browser is out of room for that pack."); return; }
  const n=p.entries.length;
  notice(`${packName(p)} slotted in: ${n} ${n===1?"entry":"entries"}.${warnings.length ? " "+warnings[0] : ""}`);
  if (S.screen==="table"){
    renderTable();
    const el=$("main").querySelector("[data-tsearch]"); if (el) el.focus();
  } else {
    renderHome();
    const el=$("main").querySelector(attrSel("data-pcard", p.meta.id)); if (el) el.focus();
  }
}
// The picker on the empty Threats tab: its own input, and only a pack goes through.
function bindPackPicker(main){
  const btn=main.querySelector("[data-pslot]"), input=main.querySelector("#pack-file"); if (!btn || !input) return;
  btn.onclick=()=>input.click();
  input.onchange=()=>{
    const f=input.files[0]; if (!f) return;
    const rd=new FileReader();
    rd.onload=()=>{
      let raw;
      try{ raw=JSON.parse(rd.result); }catch(err){ notice("That file isn't a pack."); return; }
      if (Engine.fileKind(raw)!=="pack"){ notice("That file isn't a pack."); return; }
      gmImportFile(raw, "pack");
    };
    rd.readAsText(f);
    input.value="";
  };
}

// ── Home: Your packs ──
function gmPackCardHtml(e){
  const p=e.pack, n=p.entries.length, id=esc(e.id);
  const bits=[ p.meta.contentVersion.trim() ? `version ${p.meta.contentVersion.trim()}` : "", `${n} ${n===1?"entry":"entries"}`,
    whenText(e.imported) ? "slotted in "+whenText(e.imported) : "" ].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card" data-pcard="${id}" tabindex="-1">
    <div class="roster-top"><b class="roster-name">${esc(packName(p))}</b></div>
    <div class="roster-meta">${bits}</div>
    <div class="roster-actions"><button class="btn sm" data-premove="${id}">Remove</button></div></li>`;
}
function gmPacksHtml(){
  if (!featureOn("gm")) return "";
  const list=packEntries(); if (!list.length) return "";
  return `<section class="roster packs" aria-labelledby="packs-h">
      <h2 id="packs-h" class="roster-h">Your packs</h2>
      <ul class="roster-list">${list.map(gmPackCardHtml).join("")}</ul>
      <p class="step-note">Packs stay in this browser until you remove them. The file you imported is the copy that lasts.</p>
    </section>`;
}
function askRemovePack(e){
  const order=packEntries().map(x=>x.id), at=order.indexOf(e.id);
  askFirst({ title:`Remove ${packName(e.pack)}?`, text:"Your tables keep everyone you've used from it. Import the file to bring it back.", yes:"Remove",
    then(){
      removePack(e.id); renderHome();
      const next=order[at+1], el=next && $("main").querySelector(attrSel("data-premove", next)) || $("btn-import");
      if (el) el.focus();
    } });
}
function bindPacksHome(main){
  const list=packEntries();
  main.querySelectorAll("[data-premove]").forEach(b=>b.onclick=()=>{ const e=list.find(x=>x.id===b.dataset.premove); if (e) askRemovePack(e); });
}

// ── The Threats tab (Decision 182) ─────────────────────────────────────
// State is on S, as the cast's is: S.threatView ("threat", "npc" or "group"),
// S.threatQ and the four filters, S.threatOpen ({ pack, id }: an entry's page)
// and S.threatGroup (a group's page, or the one an entry was opened from).
// Every focus target carries an entry, group or pack id, never a position.
const THREAT_VIEWS = [["threat","Threats"], ["npc","People"], ["group","Groups"]];
const THREAT_WORDS = { threat:"threats", npc:"people", group:"groups" };
const entryKey = (pack, id) => `${pack}|${id}`;
// A tip kind gm.js adds must be new: it may add one to shared.js's TIPS, never replace one (a test reads both files).
// What a pack says about one of its own words, as a tip (139). A word with no text says nothing.
TIPS.packrec = term => {
  const [pid, sec, id]=String(term).split("|");
  const pack=packsMemo.find(p=>p.meta.id===pid), list=pack && ["origins","npcRoles","enemyRoles","tiers"].includes(sec) ? pack[sec] : null;
  const r=list && list.find(x=>String(x.id)===id);   // a tier's id is a number
  return r && String(r.text||"").trim() ? { title:r.name.trim() || (sec==="tiers" ? `Tier ${id}` : "Unnamed"), text:r.text } : null;
};
function packChipHtml(pack, sec, rec, label){
  const term=`${pack.meta.id}|${sec}|${rec.id}`, shown=label || rec.name;
  return TIPS.packrec(term) ? `<button type="button" class="tag" data-tip="packrec" data-term="${esc(term)}">${esc(shown)}</button>`
    : `<span class="tag plain">${esc(shown)}</span>`;
}
function threatFilterNow(){
  const choices=Engine.packChoices(packsMemo);
  // A choice a pack no longer offers filters nothing.
  const keep = (v, list) => { const w=String(v||"").toLowerCase(); return w && list.find(a=>a.toLowerCase()===w) || ""; };
  const tier=Number(S.threatTier);
  return { choices, view:S.threatView==="npc" || S.threatView==="group" ? S.threatView : "threat", q:S.threatQ||"",
    origin:keep(S.threatOrigin, choices.origins), npcRole:keep(S.threatRole, choices.npcRoles), enemyRole:keep(S.threatEnemy, choices.enemyRoles),
    tier:choices.tiers.includes(tier) ? tier : null };
}
const threatFiltering = f => !!(f.q.trim() || (f.view!=="group" && (f.origin || f.npcRole || f.enemyRole || f.tier!==null)));
function entryMetaText(pack, entry, multi){
  const found=Engine.packEntry([pack], pack.meta.id, entry.id);
  return [ entry.ref, found.origin && found.origin.name, found.npcRoles.length && `NPC role: ${found.npcRoles.map(r=>r.name).join(" / ")}`, found.enemyRole && `Enemy: ${found.enemyRole.name}`,
    entry.tier!==null ? `Tier ${entry.tier}` : "", multi ? packName(pack) : "" ].filter(Boolean).map(esc).join(" · ");
}
function threatCardHtml({ pack, entry }, multi){
  const key=esc(entryKey(pack.meta.id, entry.id)), bits=entryMetaText(pack, entry, multi);
  return `<li class="roster-card cast-card" data-tcard="${key}">
    <button class="cast-open" data-tentry="${key}">${esc(entry.name.trim() || "Unnamed")}</button>
    ${bits ? `<div class="roster-meta cast-meta">${bits}</div>` : ""}
    <div class="card-actions"><button class="btn sm" data-tcardcast="${key}" aria-label="Add ${esc(entry.name.trim() || "Unnamed")} to the cast">Add to cast</button>${encAddBtnHtml(`data-tcardenc="${key}"`, entry.name.trim() || "Unnamed", " sm")}</div></li>`;
}
function threatGroupCardHtml({ pack, group, members }, multi){
  const key=esc(entryKey(pack.meta.id, group.id)), o=group.origin && pack.origins.find(x=>x.id===group.origin);
  const bits=[ group.ref, o && o.name, members.map(m=>`${m.count}× ${m.entry.name.trim() || "Unnamed"}`).join(" · "), multi ? packName(pack) : "" ].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card cast-card" data-tcard="${key}">
    <button class="cast-open" data-tgroup="${key}">${esc(group.name.trim() || "Unnamed")}</button>
    <div class="roster-meta cast-meta">${bits}</div>
    <div class="card-actions">${encAddBtnHtml(`data-tcardgrp="${key}"`, group.name.trim() || "Unnamed", " sm")}</div></li>`;
}
function threatListHtml(){
  const f=threatFilterNow(), multi=packsMemo.length>1;
  const rows = f.view==="group" ? Engine.packGroups(packsMemo, { q:f.q }) : Engine.packFilter(packsMemo, f);
  if (!rows.length){
    return threatFiltering(f)
      ? `<p class="step-note">Nothing matches.</p><p><button class="btn sm" data-tclear>Clear the filters</button></p>`
      : `<p class="step-note">Nothing in ${multi ? "these packs" : "this pack"} under ${esc(THREAT_WORDS[f.view])}.</p>`;
  }
  return `<ul class="roster-list">${rows.map(r=>f.view==="group" ? threatGroupCardHtml(r, multi) : threatCardHtml(r, multi)).join("")}</ul>`;
}
function threatsTabHtml(){
  if (!packsMemo.length){
    return `<p class="step-note">No pack slotted in. A pack is a file of threats your GM material came with.</p>
      <p><button class="btn primary" data-pslot>Slot in a pack</button>
      <input type="file" id="pack-file" accept=".json,.shadows-pack.json" hidden></p>`;
  }
  const f=threatFilterNow(), c=f.choices;
  const sel = (attr, label, now, opts, text=x=>x) => `<label class="field"><span>${esc(label)}</span><select ${attr}><option value="">Any</option>${opts.map(o=>
    `<option value="${esc(o)}"${String(o)===String(now)?" selected":""}>${esc(text(o))}</option>`).join("")}</select></label>`;
  return `<div class="form-toggle cast-view" role="group" aria-label="View">${THREAT_VIEWS.map(([k,name])=>
      `<button type="button" data-tview="${k}" class="${k===f.view?"on":""}" aria-pressed="${k===f.view}">${esc(name)}</button>`).join("")}</div>
    <div class="threat-filters">
      <label class="field"><span>Search</span><input type="search" data-tsearch placeholder="Search ${esc(THREAT_WORDS[f.view])}" autocomplete="off" value="${esc(f.q)}"></label>
      ${f.view==="group" ? "" : sel("data-torigin","Origin", f.origin, c.origins)
        + sel("data-trole","NPC role", f.npcRole, c.npcRoles) + sel("data-tenemy","Enemy role", f.enemyRole, c.enemyRoles)
        + sel("data-ttier","Tier", f.tier===null ? "" : f.tier, c.tiers, n=>`Tier ${n}`)}
    </div>
    <div data-threatlist>${threatListHtml()}</div>`;
}

// ── An entry's page: what the book prints, and nothing to edit ──
function readBlockHtml(block){
  if (!block) return "";
  const r=Engine.npc(block), b=block, rows=[];
  for (const s of D.stats){ const v=r.stats[s.id]; if (v.value!==null) rows.push([s.id, v.value, castSigned(v.mod)]); }
  for (const d of D.derived.filter(x=>x.type==="sumOfModifiers")){ const a=r.authored[d.id]; if (a && a.value!==null) rows.push([d.id, a.value, a.formula!==null ? `formula ${a.formula}` : ""]); }
  const stats=rows.map(([id, v, fig])=>`<div class="cast-stat"><span class="cast-stat-id">${esc(id)}</span><b class="threat-val">${esc(v)}</b><span class="cast-fig">${esc(fig)}</span></div>`).join("");
  const skills=b.skills.filter(k=>k.name.trim() || k.total!==null).map(k=>`<li>${esc(k.name.trim() || "Skill")}${k.total!==null ? " "+esc(k.total) : ""}</li>`).join("");
  const list=(label, items)=>{ const l=items.filter(x=>x.trim()); return l.length ? `<div class="cast-lines"><span class="cast-sub">${esc(label)}</span><ul class="threat-list">${l.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>` : ""; };
  const traits=b.traits.filter(k=>k.name.trim() || k.text.trim()).map(k=>`<li>${k.name.trim() ? `<b>${esc(k.name)}</b> ` : ""}${esc(k.text)}</li>`).join("");
  const health=r.health ? `<p class="cast-health">Health <b>${r.health.total}</b> (${r.health.levels} Health Level${r.health.levels===1?"":"s"})</p>` : "";
  if (!stats && !skills && !health && !traits && !b.armor.some(x=>x.trim()) && !b.gear.some(x=>x.trim())) return "";
  return `<h2 class="cast-h">Stat block</h2>${health}${stats ? `<div class="cast-stats">${stats}</div>` : ""}
    ${skills ? `<div class="cast-lines"><span class="cast-sub">Skills</span><ul class="threat-list">${skills}</ul></div>` : ""}
    ${list("Armor", b.armor)}${list("Gear", b.gear)}
    ${traits ? `<div class="cast-lines"><span class="cast-sub">Traits</span><ul class="threat-list">${traits}</ul></div>` : ""}`;
}
const threatText = (label, text) => String(text||"").trim() ? `<h2 class="cast-h">${esc(label)}</h2><p class="threat-text">${esc(text)}</p>` : "";
function entryPageHtml(found){
  const { pack, entry:e }=found, multi=packsMemo.length>1;
  const tier=e.tier!==null && (pack.tiers.find(t=>t.id===e.tier) || { id:e.tier, name:"" });
  const meta=[ e.ref.trim() && esc(e.ref), found.origin && packChipHtml(pack, "origins", found.origin),
    found.npcRoles.length && `NPC role: ${found.npcRoles.map(r=>packChipHtml(pack, "npcRoles", r)).join(" / ")}`,
    found.enemyRole && `Enemy: ${packChipHtml(pack, "enemyRoles", found.enemyRole)}`,
    tier && packChipHtml(pack, "tiers", tier, `Tier ${e.tier}`), multi && esc(packName(pack)) ].filter(Boolean).join(" · ");
  const member=S.threatMember && S.table.cast.find(n=>n.id===S.threatMember);
  const enc = S.threatEnc && encList().find(x=>x.id===S.threatEnc);
  const backText = enc ? `Back to ${esc(Engine.encounterTitle(enc))}` : member ? `Back to ${esc(member.name.trim() || "Unnamed")}` : S.threatGroup ? "Back to the group" : "Back to threats";
  return `<p><button class="btn sm" data-tback="entry">${backText}</button></p>
    <h1 class="step-title tbl-title cast-title" data-ttitle tabindex="-1">${esc(e.name.trim() || "Unnamed")}</h1>
    ${meta ? `<p class="roster-meta cast-meta">${meta}</p>` : ""}
    ${e.flavor.trim() ? `<p class="cast-line">${esc(e.flavor)}</p>` : ""}
    <p><button class="btn primary" data-tuse>Add to cast</button>${encAddBtnHtml("data-tenc", "")}</p>
    ${threatText("Description", e.description)}${threatText("What they want", e.motivation)}${threatText("What they've got", e.resources)}
    ${threatText("Their line", e.line)}${threatText("If pushed", e.ifPushed)}
    ${readBlockHtml(e.block)}
    ${threatText("GM note", e.gmNote)}`;
}
function groupPageHtml({ pack, group:g, members }){
  const o=g.origin && pack.origins.find(x=>x.id===g.origin);
  const meta=[ g.ref.trim() && esc(g.ref), o && packChipHtml(pack, "origins", o), packsMemo.length>1 && esc(packName(pack)) ].filter(Boolean).join(" · ");
  return `<p><button class="btn sm" data-tback="group">Back to threats</button>${encAddBtnHtml("data-tgrpenc", "")}</p>
    <h1 class="step-title tbl-title cast-title" data-ttitle tabindex="-1">${esc(g.name.trim() || "Unnamed")}</h1>
    ${meta ? `<p class="roster-meta cast-meta">${meta}</p>` : ""}
    ${members.length ? `<h2 class="cast-h">Who's in it</h2><ul class="threat-list threat-members">${members.map(m=>
      `<li>${m.count}× <button class="cast-open" data-tmember="${esc(entryKey(pack.meta.id, m.entry.id))}">${esc(m.entry.name.trim() || "Unnamed")}</button></li>`).join("")}</ul>` : ""}
    ${threatText("The situation", g.situation)}${threatText("Tactics", g.tactics)}`;
}
// The page to draw, if one is open and its record is still there: a pack
// removed in another tab leaves the list, not a page about nothing.
function threatPageNow(){
  const o=S.threatOpen;
  if (o){ const found=Engine.packEntry(packsMemo, o.pack, o.id); if (found) return { html:entryPageHtml(found) }; S.threatOpen=null; }
  const g=S.threatGroup;
  if (g){ const hit=Engine.packGroups(packsMemo, {}).find(x=>x.pack.meta.id===g.pack && x.group.id===g.id); if (hit) return { html:groupPageHtml(hit) }; S.threatGroup=null; }
  return null;
}
// An entry's page, from a card, a group's member or a cast member's From.
// `group` or `member` (a cast member's id) says where Back returns; any other way in clears both.
function openThreat(key, group, member, enc){
  const [pack, id]=String(key).split("|"), found=Engine.packEntry(packsMemo, pack, id); if (!found) return;
  S.tsection="threats"; S.threatOpen={ pack, id }; S.threatGroup=group||null; S.threatMember=member||null; S.threatEnc=enc||null; S.backEnc=null;
  if (!group) S.threatView = found.entry.kind==="npc" ? "npc" : "threat";
  window.scrollTo(0,0); update();
  const el=$("main").querySelector("[data-ttitle]"); if (el) el.focus();
}
// Under a member's title: where the copy came from, a button while the pack is here.
function castFromHtml(n){
  const l=Engine.entryLink(packsMemo, n.from); if (!l.packId) return "";
  const name=esc(l.name.trim() || "Unnamed");
  return `<p class="cast-from">From ${l.here ? `<button class="cast-open" data-tfrom="${esc(entryKey(l.packId, l.id))}">${name}</button>` : name}</p>`;
}

function redrawThreatList(){
  const box=$("main").querySelector("[data-threatlist]"); if (!box) return;
  box.innerHTML=threatListHtml();
  bindThreatCards($("main"));
}
function bindThreatCards(main){
  main.querySelectorAll("[data-tentry]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); openThreat(b.dataset.tentry); });
  main.querySelectorAll("[data-tgroup]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); openGroup(b.dataset.tgroup); });
  main.querySelectorAll("[data-tcard]").forEach(li=>li.onclick=ev=>{ if (ev.target.closest("button")) return;
    const b=li.querySelector("[data-tentry], [data-tgroup]"); if (b) b.click(); });
  main.querySelectorAll("[data-tcardcast]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    const [pack, id]=String(b.dataset.tcardcast).split("|"), found=Engine.packEntry(packsMemo, pack, id);
    if (!found){ notice("No such entry."); return; }
    const r=Engine.castFromEntry(S.table, found.pack, id); if (!r.ok){ notice(r.why); return; }
    tableChange(()=>{}, false); notice(`${found.entry.name.trim() || "Unnamed"} is in the cast.`); });
  main.querySelectorAll("[data-tcardenc]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    const [pack, id]=String(b.dataset.tcardenc).split("|"); encAddPress({ kind:"entry", pack, id }, b.dataset.encname); });
  main.querySelectorAll("[data-tcardgrp]").forEach(b=>b.onclick=ev=>{ ev.stopPropagation();
    const [pack, id]=String(b.dataset.tcardgrp).split("|"); encAddPress({ kind:"group", pack, id }, b.dataset.encname); });
  const clear=main.querySelector("[data-tclear]");
  if (clear) clear.onclick=()=>{ S.threatQ=""; S.threatOrigin=""; S.threatRole=""; S.threatEnemy=""; S.threatTier="";
    for (const sel of ["[data-tsearch]","[data-torigin]","[data-trole]","[data-tenemy]","[data-ttier]"]){ const el=main.querySelector(sel); if (el) el.value=""; }
    redrawThreatList(); const q=main.querySelector("[data-tsearch]"); if (q) q.focus(); };
}
function openGroup(key){
  const [pack, id]=String(key).split("|");
  if (!Engine.packGroups(packsMemo, {}).some(x=>x.pack.meta.id===pack && x.group.id===id)) return;
  S.threatGroup={ pack, id }; S.threatOpen=null; window.scrollTo(0,0); update();
  const el=$("main").querySelector("[data-ttitle]"); if (el) el.focus();
}
function bindThreats(main){
  bindPackPicker(main);
  const focusFirst = (...sels) => { for (const s of sels){ const el=$("main").querySelector(s); if (el){ el.focus(); if (document.activeElement===el) return; } } };
  const back=main.querySelector("[data-tback]");
  if (back){ bindThreatPage(main, back, focusFirst); return; }
  main.querySelectorAll("[data-tview]").forEach(b=>b.onclick=()=>{ S.threatView=b.dataset.tview; renderTable(); focusFirst(attrSel("data-tview", S.threatView)); });
  const q=main.querySelector("[data-tsearch]"); if (!q) return;
  q.oninput=()=>{ S.threatQ=q.value; redrawThreatList(); };
  for (const [sel, key] of [["[data-torigin]","threatOrigin"], ["[data-trole]","threatRole"], ["[data-tenemy]","threatEnemy"], ["[data-ttier]","threatTier"]]){
    const el=main.querySelector(sel); if (el) el.onchange=()=>{ S[key]=el.value; redrawThreatList(); };
  }
  bindThreatCards(main);
}
function bindThreatPage(main, back, focusFirst){
  const entry=S.threatOpen, group=S.threatGroup;
  back.onclick=()=>{
    if (S.threatEnc && encList().some(e=>e.id===S.threatEnc)){
      S.encOpen=S.threatEnc; S.threatEnc=null; S.threatOpen=null; S.threatGroup=null; S.tsection="encounters"; window.scrollTo(0,0); update();
      focusFirst(attrSel("data-eopenentry", entryKey(entry.pack, entry.id)), "[data-enext]"); return;
    }
    S.threatEnc=null;
    const member=entry && S.threatMember && S.table.cast.find(n=>n.id===S.threatMember);
    if (member){
      S.tsection="cast"; S.castOpen=member.id; S.castFrom=null; S.intAdd=null; S.threatOpen=null; S.threatMember=null;
      window.scrollTo(0,0); update(); focusFirst("[data-tfrom]", "[data-cback]"); return;
    }
    S.threatMember=null;
    if (entry && group){ S.threatOpen=null; window.scrollTo(0,0); update(); focusFirst(attrSel("data-tmember", entryKey(entry.pack, entry.id)), "[data-tback]"); return; }
    const key = entry ? entryKey(entry.pack, entry.id) : group ? entryKey(group.pack, group.id) : "";
    S.threatOpen=null; S.threatGroup=null; window.scrollTo(0,0); update();
    focusFirst(attrSel(entry ? "data-tentry" : "data-tgroup", key), "[data-tsearch]", "[data-tview]");
  };
  main.querySelectorAll("[data-tmember]").forEach(b=>b.onclick=()=>openThreat(b.dataset.tmember, group));
  const encBtn=main.querySelector("[data-tenc]"), grpBtn=main.querySelector("[data-tgrpenc]");
  // Add to the encounter open on the Encounters tab: one row (a group, all its members), a notice, and the page stays.
  if (encBtn) encBtn.onclick=()=>encAddPress({ kind:"entry", pack:entry.pack, id:entry.id }, "They");
  if (grpBtn) grpBtn.onclick=()=>{
    const hit=group && Engine.packGroups(packsMemo, {}).find(x=>x.pack.meta.id===group.pack && x.group.id===group.id);
    encAddPress({ kind:"group", pack:group && group.pack, id:group && group.id }, hit ? hit.group.name.trim() || "Unnamed" : "They");
  };
  const use=main.querySelector("[data-tuse]");
  if (use) use.onclick=()=>{
    const found=Engine.packEntry(packsMemo, entry.pack, entry.id); if (!found){ notice("No such entry."); return; }
    const r=Engine.castFromEntry(S.table, found.pack, entry.id); if (!r.ok){ notice(r.why); return; }
    tableChange(()=>{}, false);
    // The copy opens, in the cast, with its name selected: a Street Tough is Vinnie from here. A filter that would hide it is cleared.
    S.tsection="cast"; S.castOpen=r.id; S.castFrom=null; S.intAdd=null; S.castView="cast"; S.threatMember=null;
    if (!Engine.castFilter(S.table, castFilterNow()).some(n=>n.id===r.id)){ S.castQ=""; S.castStatus="inplay"; S.castAff=""; }
    window.scrollTo(0,0); update();
    const el=$("main").querySelector('[data-cf="name"]'); if (el){ el.focus(); el.select(); }
  };
}

// ── The Encounters tab (Decisions 188–190) ─────────────────────────────
// Who's in an encounter, whose turn it is, and every Condition on everyone. State is on S, so it
// goes with the open table and no further: S.encOpen (an encounter's id; it stays when the GM
// moves to Threats or Cast, where it comes first for their Add buttons), S.encPick and S.encQ (the cast
// picker), S.encCodex and S.encCodexQ (From the Codex), S.encDmg (a Take or Heal field open on a row), S.encHit (the Hit panel open on a row, with
// its fields and answers), S.encCond (the Add a Condition draft), S.encMore (rows whose More is open)
// S.encReset (the numbers and Keeps typed at a Reset) and S.encWrap (the wrap-up's draft, Decision 193). One of Take, Hit and the Condition form is
// open at a time.
// A rule the sheet names is a tap away, through the same tip (139): a Condition's, and a Pain Level's.
TIPS.condition = id => { const d=Engine.conditionById(id); return d && { title:d.name, text:d.effect, more:[d.recovery].filter(Boolean) }; };
// A trait's text on the active row (Decision 192): keyed row id | index in the block.
TIPS.enctrait = key => { const [row, i]=String(key).split("|"), e=encOpenNow(), v=e && Engine.encounterView(S.table, e.id, packsMemo).rows.find(x=>x.row.id===row),
  k=v && v.traits.find(x=>String(x.index)===i); return k && { title:k.name.trim() || "Trait", text:k.text }; };
// What Wave Initiative means (Decision 210): the book's words for it, in the table's.
TIPS.wave = () => ({ title:"Wave Initiative", text:"Everyone rolls Combat Sense. The side holding the best result acts first, everyone on it, in any order; then the side with the next best, and so on. The book runs a round “as individuals or as sides, in waves”." });
// The book's Surprise and Ambush (0530), a tap away from the Opening. The bonus and the Difficulty are the table's to apply.
const OPENING_LIMITS = "Surprise or Ambush is limited to once per encounter. Weapons with the Silent tag are an exception, so long as Stealth is not broken.";
TIPS.surprise = () => ({ title:"Surprise", text:"At least one attacker wins the check: the attackers' Stealth against the defenders' Awareness, made during Engagement.",
  more:["Attackers gain +1 to their first Attack roll.", "Surprised defenders are limited to Fast Actions on their first turn.", "No penalty to defense."], note:OPENING_LIMITS });
TIPS.ambush = () => ({ title:"Ambush", text:"Every attacker wins the check: the attackers' Stealth against the defenders' Awareness, made during Engagement.",
  more:["Attackers gain +3 to their first Attack roll.", "Ambushed defenders cannot act during the first round.", "Ambushed defenders cannot defend, and attacks are resolved against Difficulty 10."], note:OPENING_LIMITS });
TIPS.painlevel = lv => { const p=D.resources.healthLevels.painLevels.find(x=>String(x.level)===String(lv)); return p && { title:p.label, text:p.description }; };
const encList = () => Array.isArray(S.table.encounters) ? S.table.encounters : [];
function encOpenNow(){
  const e=S.encOpen && encList().find(x=>x.id===S.encOpen);
  if (!e) S.encOpen=null;
  return e || null;
}
// The encounter an Add to button means (Decision 211): the one open on the tab, else the running one,
// else the newest planned, else none (it then makes one). Computed on every draw, never stored.
const encTarget = () => Engine.encounterFor(S.table, S.encOpen);
// An Add to button always shows. `subject` names who it adds, for a screen reader, where a list holds many.
const encAddText = e => e ? `Add to ${Engine.encounterTitle(e)}` : "Add to a new encounter";
const encAddAria = (subject, e) => `Add ${subject} to ${e ? Engine.encounterTitle(e) : "a new encounter"}`;
function encAddBtnHtml(attr, subject, cls=""){
  const e=encTarget();
  return ` <button class="btn${cls}" data-encadd ${attr}${subject ? ` data-encname="${esc(subject)}" aria-label="${esc(encAddAria(subject, e))}"` : ""}>${esc(encAddText(e))}</button>`;
}
// After a press, every Add to button on the page names where the next one goes, in place.
function encRelabel(){
  const e=encTarget();
  $("main").querySelectorAll("[data-encadd]").forEach(b=>{
    b.textContent=encAddText(e);
    if (b.dataset.encname) b.setAttribute("aria-label", encAddAria(b.dataset.encname, e));
  });
}
// One press for every Add to button (Decision 211): the engine finds the encounter or makes one.
function encAddPress(src, name){
  const r=Engine.addToEncounter(S.table, S.encOpen, src, packsMemo);
  if (!r.ok){ notice(r.why); return; }
  tableChange(()=>{}, false);
  const enc=encList().find(x=>x.id===r.encId), title=enc ? Engine.encounterTitle(enc) : "the encounter", where=r.made ? `a new encounter, ${title}` : title;
  if (src.kind==="group") notice(`${name}: ${r.ids.length} added to ${where}.`);
  else { const row=enc && enc.rows.find(x=>x.id===r.ids[0]); notice(`${row ? row.name : name} is in ${where}.`); }
  encRelabel();
}
// Where Back goes from a member's page the encounter sent the GM to.
const encBackTitle = () => { const e=S.backEnc && encList().find(x=>x.id===S.backEnc); return e ? Engine.encounterTitle(e) : ""; };
const encRounds = n => `${n} round${n===1?"":"s"}`;
const encCount = n => n ? `${n} in it` : "Nobody yet";

function encListHtml(t){
  const all=encList(), by=s=>all.filter(e=>e.status===s);
  const clocksOf = e => clockCountText(Engine.clocksOn(t, { kind:"encounter", id:e.id }));
  const day = e => { const d=Date.parse(e.updated || e.created); return Number.isFinite(d) ? new Date(d).toLocaleDateString() : ""; };
  const card = (e, meta) => `<li class="roster-card cast-card" data-ecard="${esc(e.id)}">
    <button class="cast-open" data-enc-open="${esc(e.id)}">${esc(Engine.encounterTitle(e))}</button>
    <div class="roster-meta cast-meta">${esc(meta)}</div></li>`;
  const sect = (h, items) => items.length ? `<h2 class="cast-h">${h}</h2><ul class="roster-list">${items.join("")}</ul>` : "";
  return `<div class="cast-add">
      <label class="field"><span>Name</span><input type="text" data-enc-name placeholder="Warehouse job (optional)" autocomplete="off"></label>
      <button class="btn primary" data-enc-new>New encounter</button></div>
    ${all.length ? "" : `<p class="step-note">Nothing on the books.</p>`}
    ${sect("Running", by("running").map(e=>card(e, [`Round ${e.round}`, encCount(e.rows.length), clocksOf(e)].filter(Boolean).join(" · "))))}
    ${sect("Planned", by("planned").map(e=>card(e, [encCount(e.rows.length), clocksOf(e)].filter(Boolean).join(" · "))))}
    ${sect("Past encounters", by("ended").map(e=>card(e, [e.round ? encRounds(e.round) : "Not run", day(e), clocksOf(e)].filter(Boolean).join(" · "))))}`;
}

// ── A row ──
function encHealthHtml(v){
  const h=v.health, bits=[];
  if (h.total!==null) bits.push(h.down ? `<b class="enc-down">Down</b>${h.pastZero ? ` · ${h.pastZero} past zero` : ""}` : `HP ${h.left} / ${h.total}`);
  bits.push(`${h.taken} taken`);
  if (h.levels!==null) bits.push(`${h.levelsLeft} of ${h.levels} Health Levels`);
  if (h.pain) bits.push(`<button type="button" class="tag" data-tip="painlevel" data-term="${esc(h.pain.level)}">${esc(h.pain.label)}</button>`);
  return `<p class="enc-health">${bits.join(" · ")}</p>`;
}
function encCondHtml(v, c, ended){
  const id=esc(v.row.id), label=c.name + (c.locationName ? ` (${c.locationName})` : "");
  const name = c.def ? `<button type="button" class="tag" data-tip="condition" data-term="${esc(c.id)}">${esc(label)}</button>` : `<span class="tag plain">${esc(label)}</span>`;
  const marks = c.counter ? `<span class="enc-marks">${esc(c.counter.label)} ${c.marks}/${c.counter.max}${ended ? "" :
    ` <button class="btn sm" data-emarks="${id}|${c.index}|-1" aria-label="Fewer ${esc(c.counter.label)}">−</button><button class="btn sm" data-emarks="${id}|${c.index}|1" aria-label="More ${esc(c.counter.label)}">+</button>`}</span>` : "";
  return `<li class="cond-chip enc-cond">${name}
    ${c.rounds ? `<small>${esc(encRounds(c.rounds))}</small>` : ""}${c.source ? `<small class="enc-src">${esc(c.source)}</small>` : ""}
    ${c.note ? `<small class="enc-src">${esc(c.note)}</small>` : ""}${marks}
    ${ended ? "" : `<button class="btn sm" data-econdrm="${id}|${c.index}" aria-label="Remove ${esc(label)}">Remove</button>`}</li>`;
}
// The armor on one line (Decision 191): the Gear piece, what it stops, its Integrity; or the printed line, marked.
function encArmorHtml(v){
  const a=v.armor; if (!a || a.line===null) return "";
  let main;
  if (!a.piece) main = `${esc(a.line)} · not in the Gear tables`;
  else if (a.scrapped) main = `${esc(a.piece.name)} · Scrap`;
  else main = `${esc(a.piece.name)} · stops ${a.stops.prot + (a.compromised ? 0 : a.stops.res)} · INT ${a.integrity}/${a.integrityMax}${a.compromised ? " · Compromised: RES is gone" : ""}`;
  return `<p class="enc-armor">${main}</p>${a.extra ? `<p class="enc-armor enc-armor-extra">${esc(a.extra)}</p>` : ""}`;
}
function encTraitsHtml(v, running){
  if (!running || !v.active || !v.traits.length) return "";
  return `<p class="enc-traits"><span>Traits:</span> ${v.traits.map(k=>
    `<button type="button" class="tag" data-tip="enctrait" data-term="${esc(v.row.id)}|${k.index}">${esc(k.name.trim() || "Trait")}</button>`).join(" ")}</p>`;
}

// ── Hit: the panel, its preview and the prompts the hit raises ──
const hlWords = n => `${n} Health Level${n===1 ? "" : "s"}`;
const condNames = ids => (ids||[]).map(id=>{ const c=Engine.conditionById(id); return c ? c.name : id; }).join(", ");
const encHitNew = row => ({ row, damage:"", type:D.damageTypes[0].id, cat:"regular", ap:false, loc:D.armorRules.defaultHitLocation, from:"", shock:"", atZero:"", conds:{}, err:"" });
const encHitInput = d => ({ damage:d.damage, gone:d.damage, damageType:d.type, category:d.cat, ap:d.ap, location:d.loc, from:d.from });
function encHitRow(){ const e=encOpenNow(), d=S.encHit; return e && d ? e.rows.find(r=>r.id===d.row) || null : null; }
function encHitTicked(d, res){ return res.prompts.conditions.filter(id=>id in d.conds ? d.conds[id] : res.prompts.always.includes(id)); }
function encHitPreview(res, pc){
  const bits=[];
  if (res.bypassesArmor){
    bits.push(`Massive: ${hlWords(pc ? res.gone : res.levelsLost)} gone`);
    if (!pc && res.scrap) bits.push(`${res.armor.name} scrapped`);
  } else if (pc){
    bits.push(res.after.levels!==null ? `${res.through} through` : `${res.through} taken`);
    if (res.after.levels!==null) bits.push(hlWords(res.lostThisHit));
  } else {
    const a=res.armor;
    if (res.doubled) bits.push(`${copy("hitDoubled")} (${res.doubled.from} → ${res.doubled.to})`);
    if (a && a.piece && res.covered){
      bits.push(`${a.name} stops ${res.absorbed} (PROT ${res.prot}${res.res ? ` + RES ${res.res}` : ""})`);
      if (res.resSkipped) bits.push(`RES doesn't apply: ${res.resSkipped==="ap" ? "AP" : res.resSkipped==="compromised" ? "Compromised" : `not against ${res.type.name}`}`);
    } else if (a && a.piece) bits.push(`Not covered: ${(Engine.locationById(res.location)||{}).name || res.location}`);
    bits.push(`${res.through} through`, hlWords(res.lostThisHit));
  }
  if (res.after.down) bits.push("Down");
  return bits.join(" · ");
}
function encPromptHtml(d, res, pc){
  const out=[], names=condNames;
  const ask = (key, label) => pc ? "" : `<span class="form-toggle" role="group" aria-label="${esc(label)}">
      <button type="button" data-ehit-ans="${key}|pass" class="${d[key]==="pass" ? "on" : ""}" aria-pressed="${d[key]==="pass"}">Passed</button>
      <button type="button" data-ehit-ans="${key}|fail" class="${d[key]==="fail" ? "on" : ""}" aria-pressed="${d[key]==="fail"}">Failed</button></span>`;
  const p=res.prompts, who = pc ? "they make a" : "";
  if (p.shock) out.push(`<div class="enc-prompt"><p>Shock: ${who ? `${who} ` : ""}${esc(p.shock.check)}${pc ? " on their sheet" : ""}. Failed: ${esc(names(p.shock.onFail))}.</p>${ask("shock", "Shock check")}</div>`);
  if (p.atZero) out.push(`<div class="enc-prompt"><p>At zero: ${who ? `${who} ` : ""}${esc(p.atZero.check)}${pc ? " on their sheet" : ""}. Passed: ${esc(names(p.atZero.onPass))}. Failed: ${esc(names(p.atZero.onFail))}.</p>${ask("atZero", "At Zero check")}</div>`);
  if (p.deathMark) out.push(`<div class="enc-prompt"><p>Dying: this hit is a Death Mark.</p></div>`);
  if (p.conditions.length){
    const on=encHitTicked(d, res);
    out.push(`<div class="enc-prompt"><p>This hit can cause:</p><ul class="enc-offered">${p.conditions.map(id=>{
      const c=Engine.conditionById(id), loc=c.location ? Engine.locationById(res.location) : null;
      return `<li><label class="enc-check"><input type="checkbox" data-ehit-cond="${esc(id)}"${on.includes(id) ? " checked" : ""}> ${esc(c.name + (loc ? ` (${loc.name})` : ""))}</label>
        <button type="button" class="tag" data-tip="condition" data-term="${esc(id)}" aria-label="What ${esc(c.name)} does">?</button></li>`; }).join("")}</ul></div>`);
  }
  return out.join("");
}
function encHitLiveHtml(d, r){
  const pc=r.kind==="pc", res=Engine.resolveEncounterHit(S.table, S.encOpen, r.id, encHitInput(d));
  const body = res.ok
    ? `<p class="enc-preview" data-ehit-preview>${esc(encHitPreview(res, pc))}</p>
       ${!pc && res.armor && res.armor.piece ? `<p class="enc-armor enc-armor-extra">${esc(D.armorRules.enemyText)}</p>` : ""}
       ${(res.notes||[]).map(n=>`<p class="enc-armor enc-armor-extra">${esc(n)}</p>`).join("")}${encPromptHtml(d, res, pc)}`
    : `<p class="enc-preview enc-refusal" data-ehit-preview>${esc(res.why)}</p>`;
  return `<div data-ehit-live>${body}${d.err ? `<p class="enc-err" role="alert">${esc(d.err)}</p>` : ""}
    <div class="enc-condbtns"><button class="btn sm primary" data-ehit-apply${res.ok ? "" : " disabled"}>Apply</button><button class="btn sm" data-ehit-cancel>Cancel</button></div></div>`;
}
function encHitHtml(v){
  const d=S.encHit, r=v.row, pc=r.kind==="pc", massive=d.cat==="massive";
  const toggle = (attr, label, items) => `<span class="form-toggle" role="group" aria-label="${esc(label)}">${items.map(([val, label, on])=>
    `<button type="button" ${attr}="${esc(val)}" class="${on ? "on" : ""}" aria-pressed="${on}">${esc(label)}</button>`).join("")}</span>`;
  return `<div class="enc-hit" data-ehitpanel="${esc(r.id)}">
    <label class="field"><span>${pc ? (massive ? "Health Levels gone" : "Got through") : "Damage"}</span><input type="number" min="0" step="1" inputmode="numeric" data-ehit-damage value="${esc(d.damage)}"></label>
    <label class="field"><span>Type</span><select data-ehit-type>${D.damageTypes.map(t=>`<option value="${esc(t.id)}"${t.id===d.type ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
    <div class="field"><span>Kind</span>${toggle("data-ehit-cat", "Kind", D.damageCategories.map(c=>[c.id, c.name, c.id===d.cat]))}</div>
    ${pc ? "" : `<div class="field"><span>Armor-piercing</span>${toggle("data-ehit-ap", "Armor-piercing", [["1", "AP", d.ap]])}</div>`}
    <label class="field"><span>Where</span><select data-ehit-loc>${D.bodyLocations.map(l=>`<option value="${esc(l.id)}"${l.id===d.loc ? " selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>
    <label class="field"><span>From</span><input type="text" data-ehit-from value="${esc(d.from)}" placeholder="Rook's SMG" autocomplete="off"></label>
    ${encHitLiveHtml(d, r)}</div>`;
}
function encCondFormHtml(v){
  const d=S.encCond, def=Engine.conditionById(d.id);
  return `<div class="enc-condform" data-econdform="${esc(v.row.id)}">
    <label class="field"><span>Condition</span><select data-econd-id><option value="">Choose…</option>${D.conditions.map(c=>
      `<option value="${esc(c.id)}"${c.id===d.id?" selected":""}>${esc(c.name)}</option>`).join("")}</select></label>
    ${def && def.location ? `<label class="field"><span>Body part</span><select data-econd-loc><option value="">Body part…</option>${D.bodyLocations.map(l=>
      `<option value="${esc(l.id)}"${l.id===d.loc?" selected":""}>${esc(l.name)}</option>`).join("")}</select></label>` : ""}
    <label class="field"><span>Source</span><input type="text" data-econd-src value="${esc(d.source)}" placeholder="Corner Shot's burst" autocomplete="off"></label>
    <label class="field"><span>Rounds</span><input type="number" min="1" step="1" inputmode="numeric" data-econd-rounds value="${esc(d.rounds)}" placeholder="Until it's dealt with"></label>
    <div class="enc-condbtns"><button class="btn sm primary" data-econd-add>Add</button><button class="btn sm" data-econd-cancel>Cancel</button></div>
    ${d.err ? `<p class="enc-err" role="alert">${esc(d.err)}</p>` : ""}</div>`;
}
function encRowHtml(v, e, sides){
  const r=v.row, id=esc(r.id), ended=e.status==="ended", running=e.status==="running", pc=r.kind==="pc";
  const ref = r.kind==="entry" && v.from && v.from.packId ? (()=>{
    const f=Engine.packEntry(packsMemo, v.from.packId, v.from.id), label=(f && f.entry.ref.trim()) || v.from.name.trim() || "Codex";
    return v.from.here ? `<button type="button" class="tag" data-eopenentry="${esc(entryKey(v.from.packId, v.from.id))}">${esc(label)}</button>` : `<span class="tag plain">${esc(label)}</span>`; })() : "";
  const name = r.kind==="cast" && r.cast && !v.gone ? `<button type="button" class="cast-open enc-name" data-eopencast="${esc(r.cast.id)}">${esc(v.name)}</button>`
    : v.gone ? `<s class="enc-name">${esc(v.name)}</s><span class="vh">, removed</span>` : `<b class="enc-name">${esc(v.name)}</b>`;
  const mark = pc ? `<span class="tag plain">PC</span>` : r.kind==="cast" ? `<span class="tag plain">Cast</span>` : ref;
  const num = (attr, val, label) => ended ? `${esc(label)} ${val===null ? "—" : esc(val)}`
    : `<label class="enc-num"><span>${esc(label)}</span><input type="number" step="1" inputmode="numeric" ${attr}="${id}" value="${numAttr(val)}"></label>`;
  const aware = pc ? num("data-eaware", v.awareness, "Awareness") : v.awareness!==null ? `<span class="enc-num">Awareness ${esc(v.awareness)}</span>` : "";
  const waiting = running && r.delay ? r.delay : null;
  const acts = ended ? "" : `<div class="enc-acts">
      ${running && v.active ? `<button class="btn sm" data-edelay-open="${id}">Delay</button>` : ""}${waiting && !r.out ? `<button class="btn sm" data-eacnow="${id}">Act now</button>` : ""}
      <button class="btn sm" data-edmg="${id}|1">Take</button>${v.canHit ? `<button class="btn sm" data-ehit="${id}">Hit</button>` : ""}<button class="btn sm" data-edmg="${id}|-1">Heal</button>
      <button class="btn sm" data-econdopen="${id}">Add a Condition</button>
      <details class="enc-more" data-emore="${id}"${S.encMore && S.encMore[r.id] ? " open" : ""}><summary>More</summary>
        ${r.kind==="cast" ? "" : `<label class="field"><span>Name</span><input type="text" data-ename="${id}" value="${esc(r.name)}" autocomplete="off"></label>`}
        <div class="form-toggle" role="group" aria-label="${esc(v.name)}">
          <button type="button" data-elast="${id}" class="${r.last?"on":""}" aria-pressed="${r.last}">Goes last</button>
          <button type="button" data-eout="${id}" class="${r.out?"on":""}" aria-pressed="${r.out}">Out</button></div>
        ${sides ? `<label class="field"><span>Side</span><select data-eside="${id}">${sides.map(s=>`<option value="${esc(s.id)}"${s.id===v.side?" selected":""}>${esc(s.title)}</option>`).join("")}</select></label>` : ""}
        <button class="btn sm danger" data-erm="${id}">Remove</button></details></div>
    ${S.encDmg && S.encDmg.row===r.id ? `<form class="enc-dmg" data-edmgform="${id}">
        <input type="number" min="0" step="1" inputmode="numeric" data-edmgn aria-label="${S.encDmg.sign>0?"HP taken":"HP healed"}">
        <button class="btn sm primary" type="submit">OK</button><button class="btn sm" type="button" data-edmgcancel>Cancel</button></form>` : ""}
    ${S.encHit && S.encHit.row===r.id && v.canHit ? encHitHtml(v) : ""}
    ${S.encCond && S.encCond.row===r.id ? encCondFormHtml(v) : ""}
    ${S.encDelay && S.encDelay.row===r.id && v.active ? `<form class="enc-dmg" data-edelayform="${id}">
        <input type="text" data-edelay-until placeholder="the door opens" aria-label="Until…" autocomplete="off">
        <button class="btn sm primary" type="submit">OK</button><button class="btn sm" type="button" data-edelaycancel>Cancel</button></form>` : ""}`;
  // The opening's reminder (253): shown on the rows it applies to, never applied.
  const openTag = !v.opening ? "" : v.opening==="attacker" ? `+${e.opening && e.opening.kind==="ambush" ? 3 : 1} on their first attack roll`
    : v.opening==="ambushed" ? "Ambushed: no turn, can't defend, hit at Difficulty 10" : "Surprised: Fast Actions only";
  const pcFields = pc && !ended ? `<div class="enc-pcnums">${num("data-ehp", r.hp, "HP")}${num("data-elevels", r.levels, "Health Levels")}</div>` : "";
  // The member an entry row was kept as (Decision 193): a tap to their page, struck through once they're removed.
  const kept = v.kept ? `<p class="enc-kept">Kept as ${v.kept.gone ? `<s>${esc(v.kept.name)}</s><span class="vh">, removed</span>`
    : `<button type="button" class="cast-open enc-name" data-eopencast="${esc(r.kept.id)}">${esc(v.kept.name)}</button>`}</p>` : "";
  return `<li class="enc-row${v.active?" active":""}${r.out?" out":""}" data-erow="${id}" tabindex="-1"${v.active ? ` aria-current="step"` : ""}>
    <div class="enc-head"${running && !r.out ? ` data-eturn="${id}"` : ""}>${name} ${mark}${r.out ? ` <span class="tag plain">Out</span>` : ""}${v.acted && !waiting ? ` <span class="tag plain">Done</span>` : ""}${openTag ? ` <span class="tag plain enc-open-tag">${esc(openTag)}</span>` : ""}${r.last ? ` <span class="tag plain">Goes last</span>` : ""}
      ${num("data-eorder", r.order, "Combat Sense")}${v.ties ? `<span class="tag enc-tied">Tied: reroll</span>` : ""}${aware ? ` ${aware}` : ""}</div>
    ${waiting ? `<p class="enc-wait">Waiting${waiting.until.trim() ? `: ${esc(waiting.until)}` : ""}</p>` : ""}${kept}${encHealthHtml(v)}${encArmorHtml(v)}${pcFields}${encTraitsHtml(v, running)}
    ${v.conditions.length ? `<ul class="enc-conds">${v.conditions.map(c=>encCondHtml(v, c, ended)).join("")}</ul>` : ""}
    ${acts}</li>`;
}

// ── Reset: what ticks, what runs out, what asks for a save ──
function encResetNow(){ return S.encReset || (S.encReset={ sources:{}, keep:{} }); }
function encResetInput(){
  const s=encResetNow().sources, out={};
  for (const k of Object.keys(s)){ out[k]={}; for (const i of Object.keys(s[k])) out[k][i]=s[k][i]; }
  return { sources:out };
}
function encResetHtml(e, v){
  const st=encResetNow(), res=Engine.resolveEncounterReset(S.table, e.id, encResetInput());
  const rows=res.rows, quiet=[];
  const body = rows.map(x=>{
    if (!x.ticks.length && !x.expiring.length && !x.recovery.length && !x.dying && x.missed===null){ quiet.push(x.name.trim() || "Unnamed"); return ""; }
    const id=esc(x.rowId), view=v.rows.find(r=>r.row.id===x.rowId);
    const ticks = x.ticks.map(k=> k.source
      ? `<li><label class="enc-num"><span>${esc(k.name)}:</span><input type="number" min="0" step="1" inputmode="numeric" required data-esrc="${id}|${k.index}" value="${esc(((st.sources[x.rowId]||{})[k.index])??"")}"><span>HP</span></label></li>`
      : `<li>${esc(k.name)}: ${k.hp} HP</li>`).join("");
    const out = x.expiring.map(k=>{
      const key=`${x.rowId}|${k.index}`, keep=!!st.keep[key];
      return `<li>${esc(k.name)}${k.source ? ` <small class="enc-src">${esc(k.source)}</small>` : ""}
        <span class="form-toggle" role="group" aria-label="${esc(k.name)}">
          <button type="button" data-ekeep="${esc(key)}|end" class="${keep?"":"on"}" aria-pressed="${!keep}">End</button>
          <button type="button" data-ekeep="${esc(key)}|keep" class="${keep?"on":""}" aria-pressed="${keep}">Keep</button></span></li>`; }).join("");
    const saves = x.recovery.map(k=>`<li><b>${esc(k.name)}:</b> ${esc(k.recovery)}</li>`).join("");
    const dc = x.dyingIndex!==null ? view && view.conditions.find(c=>c.index===x.dyingIndex) : null;
    // Decision 220: the marks first, then the check, which is asked every Reset while Dying.
    const mk = x.dyingMarks ? `${x.dyingMarks} source${x.dyingMarks===1 ? "" : "s"} ticked: ${x.dyingMarks} Death Mark${x.dyingMarks===1 ? "" : "s"}.` : "";
    const dyingWords = [mk, x.dying ? (mk ? "Then " : "") + esc(x.dying) + (mk ? "." : "") : ""].filter(Boolean).join(" ");
    const dying = x.dying || x.dyingMarks ? `<li><b>Dying:</b> ${dyingWords}${dc && dc.counter ? ` <span class="enc-marks">${esc(dc.counter.label)} ${dc.marks}/${dc.counter.max}
        <button class="btn sm" data-emarks="${id}|${dc.index}|-1" aria-label="Fewer ${esc(dc.counter.label)}">−</button><button class="btn sm" data-emarks="${id}|${dc.index}|1" aria-label="More ${esc(dc.counter.label)}">+</button></span>` : ""}</li>` : "";
    const missed = x.missed===null ? "" : `<p class="enc-wait">${x.missed.trim() ? `Waited for “${esc(x.missed)}”. It never came: no action this round.` : "Waited. Nothing came: no action this round."}</p>`;
    return `<section class="enc-reset-row"><h3 class="cast-h">${esc(x.name.trim() || "Unnamed")}</h3>
      ${missed}${ticks || dying ? `<ul class="enc-list">${ticks}${dying}</ul>` : ""}
      ${out ? `<p class="cast-sub">Runs out now</p><ul class="enc-list">${out}</ul>` : ""}
      ${saves ? `<p class="cast-sub">Calls for a check</p><ul class="enc-list">${saves}</ul>` : ""}</section>`;
  }).join("");
  return `<section class="enc-reset" aria-labelledby="enc-reset-h"><h2 class="cast-h" id="enc-reset-h" tabindex="-1">Reset: round ${e.round} ends</h2>
    ${body}${quiet.length ? `<p class="step-note">Nothing on: ${esc(quiet.join(", "))}.</p>` : ""}
    <p><button class="btn primary" data-efinish${res.ok ? "" : " disabled"}>Finish the round</button></p>
    ${res.ok ? "" : `<p class="step-note">${esc(res.why)}</p>`}</section>`;
}

// ── The wrap-up: End on a running encounter (Decision 193) ──
// The draft is S.encWrap = { enc, rows:{ [rowId]:{ keep, name, status, line, text } }, diff, err }; nothing is
// written until End the encounter. A field left alone is absent, so it reads the engine's default.
function encWrapNow(e){ return S.encWrap && S.encWrap.enc===e.id && e.status==="running" ? S.encWrap : null; }
function encWrapDraft(id){ return S.encWrap.rows[id] || (S.encWrap.rows[id]={}); }
function encEndedWords(u){
  const x=u.ended, bits=[];
  if (x.levels!==null) bits.push(x.down ? "Down" : `${Math.max(0, x.levelsLeft)} of ${x.levels} Health Levels`);
  if (x.conditions.length) bits.push(x.conditions.join(", "));
  return bits.join(" · ") || "Nothing recorded";
}
// What the record will say above the figures (Decision 241): the engine's sentence for the line End will write.
function encWrapSentence(u, e, crew){
  const st=S.encWrap.rows[u.row.id]||{}, keep=u.kind!=="cast";
  const status=st.status ?? (keep ? "alive" : u.status);
  const killed = keep ? status==="dead" : status==="dead" && u.status!=="dead";
  const link=!keep && u.row.cast && typeof u.row.cast==="object" ? u.row.cast.id : null;
  if (!keep && typeof link!=="string") return "";
  // A Keep's name as End will write it: what's typed, else the row's (castFromRow).
  const who = keep ? { kind:"cast", id:"", name:String(st.name ?? "").trim() || u.row.name } : { kind:"cast", id:link };
  const x={ kind:killed ? "killed" : "fought", cast:[who], crew, encounter:{ kind:"encounter", id:e.id }, date:localDay(), text:"" };
  return `${sentenceHtml(S.table, x, { plain:true })}:`;
}
function encWrapRowHtml(u, e, crew){
  const st=S.encWrap.rows[u.row.id]||{}, id=esc(u.row.id), name=esc(u.name);
  const statusSel = cur => `<label class="field"><span>Status</span><select data-ew-status="${id}">${Object.keys(CAST_STATUS_LABELS).map(k=>
    `<option value="${esc(k)}"${k===cur?" selected":""}>${esc(CAST_STATUS_LABELS[k])}</option>`).join("")}</select></label>`;
  const lineOn = st.line!==false;
  const lineBox = `<label class="enc-check"><input type="checkbox" data-ew-line="${id}"${lineOn?" checked":""}> Add this fight to their record</label>
    ${lineOn ? `<p class="step-note" data-ew-sent="${id}">${encWrapSentence(u, e, crew)}</p><label class="field"><span>What the record says</span><textarea data-ew-text="${id}" rows="2">${esc(st.text ?? u.line)}</textarea></label>` : ""}`;
  let body;
  if (u.kind==="cast"){
    body = u.gone ? `<p class="step-note">Removed from the cast, so there is no record to add to.</p>`
      : `${statusSel(st.status ?? u.status)}${lineBox}`;
  } else {
    body = `<label class="enc-check"><input type="checkbox" data-ew-keep="${id}"${st.keep?" checked":""}> Keep as a cast member</label>
      ${st.keep ? `<label class="field"><span>Name</span><input type="text" data-ew-name="${id}" value="${esc(st.name ?? u.row.name)}" autocomplete="off"></label>
        ${statusSel(st.status ?? "alive")}${lineBox}` : ""}`;
  }
  return `<li class="enc-row" data-ewrow="${id}"><div class="enc-head"><b class="enc-name">${u.gone ? `<s>${name}</s>` : name}</b>
      <span class="tag plain">${u.kind==="cast" ? "Cast" : "Codex"}</span></div>
    <p class="enc-health">${esc(encEndedWords(u))}</p>${body}</li>`;
}
// What the players are told about armor wear: the die for the fight, and who rolls it.
function encWearHtml(w){
  if (!w.crew.length && !w.hit.length) return "";
  const die = (w.dice.find(d=>d.id===S.encWrap.diff)||{}).die;
  const says = !die ? "" : w.hit.length ? `${w.hit.map(h=>h.name).join(", ")}: roll ${die} for armor wear on your sheet.` : "No player took a hit.";
  return `<section class="enc-wear"><h3 class="cast-h">Armor wear</h3>
    <label class="field"><span>How hard was it</span><select data-ew-diff><option value="">Choose…</option>${w.dice.map(d=>
      `<option value="${esc(d.id)}"${d.id===S.encWrap.diff?" selected":""}>${esc(`${d.name} (${d.die})`)}</option>`).join("")}</select></label>
    <p class="step-note" data-ew-says>${esc(says)}</p></section>`;
}
function encWrapHtml(e, title){
  const w=Engine.encounterWrapUp(S.table, e.id);
  return `<section class="enc-wrap" aria-labelledby="enc-wrap-h"><h2 class="cast-h" id="enc-wrap-h" data-ew-h tabindex="-1">Wrap up ${esc(title)}</h2>
    <p class="step-note">Nothing is saved until you end it.</p>
    ${w.rows.length ? `<ul class="enc-rows">${w.rows.map(u=>encWrapRowHtml(u, e, w.crew)).join("")}</ul>` : ""}
    ${encWearHtml(w)}
    <p class="enc-condbtns"><button class="btn primary" data-ew-end>End the encounter</button><button class="btn" data-ew-cancel>Cancel</button></p>
    ${S.encWrap.err ? `<p class="enc-err" role="alert">${esc(S.encWrap.err)}</p>` : ""}</section>`;
}

// ── The encounter ──
function encPickHtml(e){
  const q=foldName(S.encQ);
  const inIt=new Set(e.rows.filter(r=>r.cast).map(r=>r.cast.id));
  const members=Engine.castFilter(S.table, { q:S.encQ||"", status:"all" });
  return `<div data-encpicklist>${members.length ? `<ul class="roster-list">${members.map(n=>`<li class="roster-card enc-pickrow"><span class="enc-name">${esc(n.name.trim() || "Unnamed")}</span>
      ${inIt.has(n.id) ? `<span class="step-note">Already in</span>` : `<button class="btn sm" data-enc-addcast="${esc(n.id)}" aria-label="Add ${esc(n.name.trim() || "Unnamed")}">Add</button>`}</li>`).join("")}</ul>`
    : `<p class="step-note">${q ? "No one matches." : "No one in the cast yet."}</p>`}</div>`;
}
// From the Codex (Decision 211): the slotted packs' entries and groups, from two characters, 25 at most.
const CODEX_SHOWN = 25;
function encCodexMatches(){
  const q=S.encCodexQ||"";
  if (foldName(q).length<2) return null;
  // Entries in pack order (SQ4), the book's own order within a pack, then groups.
  const at=r=>[packsMemo.indexOf(r.pack), r.pack.entries.indexOf(r.entry)];
  const rows=[...Engine.packFilter(packsMemo, { view:"threat", q }), ...Engine.packFilter(packsMemo, { view:"npc", q })]
    .sort((a, b)=>{ const x=at(a), y=at(b); return x[0]-y[0] || x[1]-y[1]; })
    .map(r=>({ kind:"entry", ...r })).concat(Engine.packGroups(packsMemo, { q }).map(r=>({ kind:"group", ...r })));
  return rows;
}
function encCodexHtml(){
  const rows=encCodexMatches(), multi=packsMemo.length>1;
  if (!rows) return `<div data-enccodexlist><p class="step-note">Type a name, a role or an origin.</p></div>`;
  if (!rows.length) return `<div data-enccodexlist><p class="step-note">Nothing matches.</p></div>`;
  const li=r=>{
    const isG=r.kind==="group", name=(isG ? r.group.name : r.entry.name).trim() || "Unnamed", key=esc(entryKey(r.pack.meta.id, isG ? r.group.id : r.entry.id));
    const meta=isG ? r.members.map(m=>`${m.count}× ${m.entry.name.trim() || "Unnamed"}`).map(esc).join(" · ") : entryMetaText(r.pack, r.entry, multi);
    return `<li class="roster-card enc-pickrow"><span class="enc-name">${esc(name)}${isG ? ` <span class="step-note">Group</span>` : ""}${meta ? `<span class="roster-meta cast-meta">${meta}</span>` : ""}</span>
      <button class="btn sm" data-enc-addcodex="${key}" data-enc-codexkind="${r.kind}" aria-label="Add ${esc(name)}">Add</button></li>`;
  };
  const more=rows.length - CODEX_SHOWN;
  return `<div data-enccodexlist><ul class="roster-list">${rows.slice(0, CODEX_SHOWN).map(li).join("")}</ul>${more>0 ? `<p class="step-note">${more} more. Keep typing.</p>` : ""}</div>`;
}
function encAddHtml(e){
  return `<section class="enc-add"><h2 class="cast-h">Add</h2>
    <p><button class="btn" data-enc-pick aria-expanded="${!!S.encPick}">From the cast</button></p>
    ${S.encPick ? `<label class="field"><span>Search the cast</span><input type="search" data-enc-q value="${esc(S.encQ||"")}" autocomplete="off"></label>${encPickHtml(e)}` : ""}
    <div class="cast-add"><label class="field"><span>PC name</span><input type="text" data-enc-pcname placeholder="Who's at the table?" autocomplete="off"></label>
      <button class="btn" data-enc-addpc>Add a PC</button></div>
    ${packsMemo.length ? `<p><button class="btn" data-enc-codex aria-expanded="${!!S.encCodex}">From the Codex</button></p>
    ${S.encCodex ? `<label class="field"><span>Search the Codex</span><input type="search" data-enc-codexq value="${esc(S.encCodexQ||"")}" autocomplete="off"></label>${encCodexHtml()}` : ""}`
      : `<p class="step-note">From the Codex: slot a pack in on Threats.</p>`}</section>`;
}
// A side under Wave Initiative (Decision 210): its heading, its best and a tie between sides, a More
// for its name and Remove, and its rows. The crew's name and the last other side can't be changed or taken away.
function encSideHtml(s, v, e){
  const ended=e.status==="ended", crew=s.id==="crew", id=esc(s.id), others=v.sides.length - 1;
  const more = ended ? "" : `<details class="enc-more enc-side-more" data-emore="${id}"${S.encMore && S.encMore[s.id] ? " open" : ""}><summary>More</summary>
      ${crew ? "" : `<label class="field"><span>Name</span><input type="text" data-esidename="${id}" value="${esc(((e.sides || []).find(x=>x.id===s.id) || {}).name || "")}" placeholder="${esc(s.title)}" autocomplete="off"></label>`}
      ${crew || others < 2 ? "" : `<button class="btn sm danger" data-esiderm="${id}">Remove side</button>`}</details>`;
  const rows = s.rowIds.map(rid=>v.rows.find(r=>r.row.id===rid)).filter(Boolean);
  return `<section class="enc-side" data-eside-sec="${id}">
    <div class="enc-side-head"><h2 class="enc-side-h">${esc(s.title)}</h2>${s.best!==null ? `<span class="enc-num">Best ${esc(s.best)}</span>` : ""}${s.tied ? `<span class="tag enc-tied">Tied: reroll</span>` : ""}${more}</div>
    ${rows.length ? `<ul class="enc-rows">${rows.map(r=>encRowHtml(r, e, ended ? null : v.sides)).join("")}</ul>` : `<p class="step-note">Nobody on this side.</p>`}</section>`;
}
// The plan (252): the book's Encounter Design worksheet. Labels and printed lists are 2642's words.
const planField = (d, key, label) => `<label class="field"><span>${esc(label)}</span><textarea data-eplan="${key}" rows="3">${esc(d[key])}</textarea></label>`;
const planList = (items, tag) => `<${tag} class="enc-prompts">${items.map(x=>`<li>${esc(x)}</li>`).join("")}</${tag}>`;
const advRemoveLabel = (a, i) => a.who.trim() ? `Remove ${a.who.trim()}` : `Remove adversary ${i+1}`;
function encAdvHtml(e, v){
  const d=v.design, names=v.rows.map(r=>r.name);
  return `<datalist id="eadv-names">${names.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    ${d.adversaries.map((a, i)=>`<div class="enc-adv" role="group" aria-label="Adversary ${i+1}" data-eadvrow="${i}">
      <label class="field"><span>NPC/Enemy</span><input type="text" list="eadv-names" data-eadv="${i}|who" value="${esc(a.who)}" autocomplete="off"></label>
      <label class="field"><span>Goals</span><textarea data-eadv="${i}|goals" rows="2">${esc(a.goals)}</textarea></label>
      <label class="field"><span>Tactics</span><textarea data-eadv="${i}|tactics" rows="2">${esc(a.tactics)}</textarea></label>
      <label class="field"><span>Leverage/Pressure</span><textarea data-eadv="${i}|leverage" rows="2">${esc(a.leverage)}</textarea></label>
      <button type="button" class="btn sm danger" data-eadvrm="${i}" aria-label="${esc(advRemoveLabel(a, i))}">Remove</button></div>`).join("")}`;
}
function encPlanEditHtml(e, v){
  const d=v.design, P=Engine.ENCOUNTER_PROMPTS;
  const open = S.encPlan && e.id in S.encPlan ? S.encPlan[e.id] : e.status==="planned";
  return `<details class="enc-plan" data-eplan-d="${esc(e.id)}"${open ? " open" : ""}><summary><h2 class="cast-h">The plan</h2></summary>
    <h3 class="ref-sub">Encounter Basics</h3>
    ${planField(d, "hook", "Scene Hook / Trigger")}${planField(d, "stakes", "Core Stakes")}${planField(d, "objectives", "Player Objectives")}
    <h3 class="ref-sub">NPCs / Adversaries</h3>
    <div data-eadvs>${encAdvHtml(e, v)}</div>
    <p><button type="button" class="btn sm" data-eadvadd>Add an adversary</button></p>
    <h3 class="ref-sub">Environment &amp; Hazards</h3>
    ${planField(d, "terrain", "Terrain (cover, elevation, visibility)")}${planField(d, "hazards", "Hazards / Pressure Points")}${planField(d, "city", "NYTE City Interactions")}
    <h3 class="ref-sub">Objectives Beyond “Defeat Enemy”</h3>
    <div class="form-toggle enc-objs" role="group" aria-label="Objectives Beyond “Defeat Enemy”">${Engine.ENCOUNTER_OBJECTIVES.map(o=>
      `<button type="button" data-eobj="${o.id}" class="${d.beyond.includes(o.id) ? "on" : ""}" aria-pressed="${d.beyond.includes(o.id)}">${esc(o.name)}</button>`).join("")}</div>
    ${planField(d, "beyondNotes", "Notes")}
    <h3 class="ref-sub">Escalation &amp; Consequences</h3>
    ${planField(d, "escalations", "Possible Escalations")}${planField(d, "failure", "Consequences of Failure")}${planField(d, "success", "Consequences of Success")}
    <h3 class="ref-sub">Finding an Out</h3>
    ${planField(d, "escapes", "Planned Escape Options")}
    <p class="cast-sub">Improvised GM Exit Options</p>${planList(P.exits, "ul")}
    ${planField(d, "failsafe", "Fail-Safe Narrative Outcome")}
    <h3 class="ref-sub">Hooks for Next Scene</h3>
    ${planField(d, "threads", "New threads, clues, NPC attitudes")}${planField(d, "milestones", "Links to character goals / Milestones")}
    <h3 class="ref-sub">GM Notes / Improv Prompts</h3>
    ${planList(P.questions, "ol")}
    ${planField(d, "pivot", "Quick pivot if encounter goes off-script")}
    <h3 class="ref-sub">When Momentum Stalls</h3>
    ${planList(P.stalls, "ul")}
    ${planField(d, "stalls", "Notes")}</details>`;
}
// An ended encounter's plan: only what was written, as text. Absent when nothing was.
function encPlanReadHtml(v){
  const d=v.design, field=(label, text)=> text.trim() ? `<p class="enc-plan-field"><b>${esc(label)}</b> ${esc(text)}</p>` : "";
  const advs=d.adversaries.filter(a=>a.who.trim() || a.goals.trim() || a.tactics.trim() || a.leverage.trim());
  const picked=Engine.ENCOUNTER_OBJECTIVES.filter(o=>d.beyond.includes(o.id));
  const section=(h, body)=> body ? `<h3 class="ref-sub">${h}</h3>${body}` : "";
  const body=[
    section("Encounter Basics", field("Scene Hook / Trigger", d.hook) + field("Core Stakes", d.stakes) + field("Player Objectives", d.objectives)),
    section("NPCs / Adversaries", advs.length ? `<ul class="enc-prompts">${advs.map(a=>`<li><b>${esc(a.who.trim() || "Unnamed")}</b>${a.goals.trim() ? ` · Goals: ${esc(a.goals)}` : ""}${a.tactics.trim() ? ` · Tactics: ${esc(a.tactics)}` : ""}${a.leverage.trim() ? ` · Leverage/Pressure: ${esc(a.leverage)}` : ""}</li>`).join("")}</ul>` : ""),
    section("Environment &amp; Hazards", field("Terrain (cover, elevation, visibility)", d.terrain) + field("Hazards / Pressure Points", d.hazards) + field("NYTE City Interactions", d.city)),
    section("Objectives Beyond “Defeat Enemy”", (picked.length ? `<ul class="enc-prompts">${picked.map(o=>`<li>${esc(o.name)}</li>`).join("")}</ul>` : "") + field("Notes", d.beyondNotes)),
    section("Escalation &amp; Consequences", field("Possible Escalations", d.escalations) + field("Consequences of Failure", d.failure) + field("Consequences of Success", d.success)),
    section("Finding an Out", field("Planned Escape Options", d.escapes) + field("Fail-Safe Narrative Outcome", d.failsafe)),
    section("Hooks for Next Scene", field("New threads, clues, NPC attitudes", d.threads) + field("Links to character goals / Milestones", d.milestones)),
    section("GM Notes / Improv Prompts", field("Quick pivot if encounter goes off-script", d.pivot)),
    section("When Momentum Stalls", field("Notes", d.stalls)) ].join("");
  return body ? `<h2 class="cast-h">The plan</h2>${body}` : "";
}
// The opening (253): set while planned, or in round 1 before anyone has acted; text after.
function encOpeningHtml(v){
  const cur=v.opening ? v.opening.kind : "none";
  const kinds=[["none", "None"], ["surprise", "Surprise"], ["ambush", "Ambush"]];
  return `<div class="enc-opening" data-eopening>
    <div class="tag-choice"><span>Opening</span><div class="form-toggle" role="group" aria-label="Opening">${kinds.map(([k, name])=>
      `<button type="button" data-eopen-kind="${k}" class="${k===cur ? "on" : ""}" aria-pressed="${k===cur}">${name}</button>`).join("")}</div>
      <span class="enc-tips"><button type="button" class="tag" data-tip="surprise" data-term="surprise" aria-label="Surprise ?">Surprise ?</button>
      <button type="button" class="tag" data-tip="ambush" data-term="ambush" aria-label="Ambush ?">Ambush ?</button></span></div>
    ${v.opening ? `<div class="tag-choice"><span>By</span><div class="form-toggle" role="group" aria-label="By">${v.sides.map(s=>
      `<button type="button" data-eopen-side="${esc(s.id)}" class="${s.id===v.opening.side ? "on" : ""}" aria-pressed="${s.id===v.opening.side}">${esc(s.title)}</button>`).join("")}</div></div>` : ""}</div>`;
}
function encPageHtml(e){
  const v=Engine.encounterView(S.table, e.id, packsMemo), title=v.title, ended=e.status==="ended", running=e.status==="running", wrapping=!!encWrapNow(e);
  const canOpen = !ended && !wrapping && (e.status==="planned" || (running && e.round===1 && !(e.acted||[]).length));
  const openingText = v.opening && !canOpen && (ended || (running && e.round===1)) ? ` · ${v.opening.kind==="ambush" ? "Ambush" : "Surprise"} by ${v.opening.title}` : "";
  const status = (running ? `Round ${e.round}` : ended ? (e.round ? `Ended · ${encRounds(e.round)}` : "Ended · not run") : "Planned") + openingText;
  const bar = `<div class="enc-bar"><b class="enc-status">${esc(status)}</b>
    ${e.status==="planned" ? `<button class="btn primary" data-enc-start>Start</button><button class="btn" data-enc-end>End</button>` : ""}
    ${running && !wrapping ? `${v.atReset ? "" : `<button class="btn primary" data-enext>Next</button>`}<button class="btn" data-enc-end>End the encounter</button>` : ""}</div>
    ${!ended && !wrapping ? `<div class="enc-turns"><div class="form-toggle" role="group" aria-label="Turns">
        <button type="button" data-eby="person" class="${v.by==="person"?"on":""}" aria-pressed="${v.by==="person"}">One at a time</button>
        <button type="button" data-eby="wave" class="${v.by==="wave"?"on":""}" aria-pressed="${v.by==="wave"}">Wave Initiative</button></div>
      <button type="button" class="tag" data-tip="wave" data-term="wave" aria-label="What Wave Initiative means">?</button></div>`
      : ended && v.by==="wave" ? `<p class="enc-turns"><span class="enc-mode">Wave Initiative</span></p>` : ""}`;
  const rows = v.by==="wave" ? v.sides.map(s=>encSideHtml(s, v, e)).join("") + (!ended && v.sides.length < 6 ? `<p><button class="btn" data-eaddside>Add a side</button></p>` : "")
    : v.rows.length ? `<ul class="enc-rows">${v.rows.map(r=>encRowHtml(r, e, null)).join("")}</ul>` : `<p class="step-note">Nobody in it yet.</p>`;
  const from=backFromLineTitle();
  const clockOwner={ kind:"encounter", id:e.id };
  const clocks = ended ? (Engine.clocksOn(S.table, clockOwner).length ? `<h2 class="cast-h">Clocks</h2>${clocksHtml(clockOwner, { readOnly:true })}` : "")
    : wrapping ? "" : `<h2 class="cast-h">Clocks</h2>${clocksHtml(clockOwner)}`;
  const plan = ended ? encPlanReadHtml(v) : encPlanEditHtml(e, v);
  return `<p><button class="btn sm" data-enc-back>${from ? `Back to ${esc(from)}` : "Back to encounters"}</button></p>
    ${ended ? `<h1 class="step-title tbl-title cast-title" data-enc-h tabindex="-1">${esc(title)}</h1>`
      : `<label class="field"><span>Name</span><input type="text" data-enc-title value="${esc(e.name)}" placeholder="${esc(title)}" autocomplete="off"></label>`}
    ${bar}
    ${canOpen ? encOpeningHtml(v) : ""}
    ${wrapping ? encWrapHtml(e, title) : v.atReset ? encResetHtml(e, v) : rows}
    ${ended || v.atReset || wrapping ? "" : encAddHtml(e)}
    ${clocks}
    ${plan}
    <p class="cast-delete"><button class="btn danger" data-enc-del>Delete</button></p>`;
}
function encountersTabHtml(t){
  const e=encOpenNow();
  return e ? encPageHtml(e) : encListHtml(t);
}

function bindEncounters(main){
  const focus = sel => { const el=$("main").querySelector(sel); if (el) el.focus(); return !!el; };
  const redraw = () => { renderTable(); };
  const change = fn => { tableChange(fn); };
  // The wrap-up's preview follows a status or a Keep's name as it's set, with no redraw (Decision 241).
  const wrapSentenceNow = rid => {
    const e=encOpenNow(), u=e && Engine.encounterWrapUp(S.table, e.id), row=u && u.rows.find(x=>x.row.id===rid), box=main.querySelector(attrSel("data-ew-sent", rid));
    if (box && row) box.innerHTML=encWrapSentence(row, e, u.crew);
  };
  const open = id => {
    S.backFromLine=null; S.encOpen=id; S.encWrap=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; S.encDelay=null; S.clockEdit=null; S.encPick=false; S.encQ=""; S.encCodex=false; S.encCodexQ="";
    window.scrollTo(0,0); redraw();
    const e=encOpenNow(); if (!e) return;
    if (e.status==="planned") focus("[data-enc-title]");
    else if (e.status==="running") focus("[data-esrc], [data-efinish]:not([disabled]), [data-enext]") || focus("[data-efinish]");
    else focus("[data-enc-h]");
  };
  const eid = () => S.encOpen;
  const edit = (rowId, f) => change(()=>Engine.editParticipant(S.table, eid(), rowId, f));
  const rowEl = id => $("main").querySelector(attrSel("data-erow", id));
  const toActive = () => { const el=$("main").querySelector(".enc-row.active"); if (el && el.scrollIntoView) el.scrollIntoView({ block:"nearest" }); };
  const next = () => { const r=Engine.nextTurn(S.table, eid()); if (!r.ok){ notice(r.why); return; } S.encDelay=null; tableChange(()=>{});
    if (r.reset) focus("[data-esrc]") || focus("[data-efinish]"); else { focus("[data-enext]"); toActive(); } };
  // The plan is written whole (252). A copy of the stored one is changed and sent, so a key this version doesn't know rides along.
  const planWrite = fn => { const e=encOpenNow(); if (!e) return { ok:false, why:"No such encounter." };
    const d=Object.assign({}, e.design); d.adversaries=(Array.isArray(e.design.adversaries) ? e.design.adversaries : []).map(a=>Object.assign({}, a)); d.beyond=[...e.design.beyond];
    fn(d); return Engine.editEncounter(S.table, e.id, { design:d }); };
  const planTyped = (fn, redraw) => { let r; tableChange(()=>{ r=planWrite(fn); }, !!redraw); if (r && !r.ok) notice(r.why); return r; };
  const planKey = el => {
    if ("eplan" in el.dataset) planTyped(d=>{ d[el.dataset.eplan]=el.value; });
    else if ("eadv" in el.dataset){
      const [i, key]=el.dataset.eadv.split("|");
      planTyped(d=>{ if (d.adversaries[+i]) d.adversaries[+i][key]=el.value; });
      if (key==="who"){ const b=main.querySelector(attrSel("data-eadvrm", i)); if (b) b.setAttribute("aria-label", advRemoveLabel({ who:el.value }, +i)); }
    }
  };
  const openingWrite = f => { const r=Engine.setOpening(S.table, eid(), f); if (!r.ok){ notice(r.why); return false; } tableChange(()=>{}); return true; };
  const pickNextAdd = id => { const ids=[...$("main").querySelectorAll("[data-enc-addcast]")].map(b=>b.dataset.encAddcast); const at=ids.indexOf(id); return ids[at+1] || ids[at-1] || null; };
  // The preview and prompts redraw on their own, so a field keeps its value and its caret.
  const hitLive = () => { const box=main.querySelector("[data-ehit-live]"), r=encHitRow(); if (box && r) box.outerHTML=encHitLiveHtml(S.encHit, r); };
  const act = {
    "data-enc-new": () => { const input=main.querySelector("[data-enc-name]"); let id; change(()=>{ id=Engine.addEncounter(S.table, { name:input.value }).id; }); open(id); },
    "data-enc-open": b => open(b.dataset.encOpen),
    "data-enc-back": () => { const r=backFromLineNow();
      if (r){
        S.backFromLine=null; S.encOpen=null; S.encWrap=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; S.intEdit=null;
        Object.assign(S, { tsection:r.tsection, castOpen:r.castOpen, castView:r.castView, castFrom:r.castFrom, backEnc:r.backEnc, backSess:r.backSess, backClose:r.backClose, backCity:r.backCity||null, placeOpen:r.placeOpen||null, placeRoute:r.placeRoute||null, sessOpen:r.sessOpen, castQ:r.castQ });
        if (S.closeOut) S.closeOut.view=r.closeView;
        window.scrollTo(0,0); update();
        const link=$("main").querySelector(attrSel("data-eopenline", r.key)); if (link) link.focus(); else { const h=$("main").querySelector("h1"); if (h) takeFocus(h, true); }
        return;
      }
      const id=S.encOpen; S.encOpen=null; S.encWrap=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; window.scrollTo(0,0); redraw(); focus(attrSel("data-enc-open", id)) || focus("[data-enc-new]"); },
    "data-enc-start": () => { const r=Engine.startEncounter(S.table, eid()); if (!r.ok){ notice(r.why); return; } S.encReset=null; tableChange(()=>{}); focus("[data-enext]"); toActive(); },
    "data-enc-end": () => { const e=encOpenNow(), t=Engine.encounterTitle(e);
      if (e.status==="running"){ S.encWrap={ enc:e.id, rows:{}, diff:"", err:"" }; S.encDmg=null; S.encHit=null; S.encCond=null; redraw(); focus("[data-ew-h]"); return; }
      askFirst({ title:`End ${t}?`, text:"It's kept, read-only, under Past encounters.", yes:"End it", danger:false, then(){
        const id=eid(); S.encOpen=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; change(()=>Engine.endEncounter(S.table, id)); focus("[data-enc-new]"); } }); },
    "data-enc-del": () => { const e=encOpenNow(), t=Engine.encounterTitle(e), n=Engine.clocksOn(S.table, { kind:"encounter", id:e.id }).length;
      askFirst({ title:`Delete ${t}?`, text:n ? `It and its ${n} ${n===1 ? "clock" : "clocks"} aren't kept anywhere else unless you've exported the table.` : "It isn't kept anywhere else unless you've exported the table.", yes:"Delete", then(){
        const id=eid(); S.clockEdit=null; S.encOpen=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; change(()=>Engine.removeEncounter(S.table, id)); focus("[data-enc-new]"); } }); },
    "data-ew-cancel": () => { S.encWrap=null; redraw(); focus("[data-enc-end]"); },
    "data-ew-end": () => { const e=encOpenNow(), w=Engine.encounterWrapUp(S.table, e.id), rows={};
      for (const u of w.rows){
        const st=S.encWrap.rows[u.row.id]||{}, keep=u.kind==="entry" && !!st.keep;
        rows[u.row.id]={ keep, name:st.name, status:st.status, line:(u.kind==="cast" || keep) && st.line!==false, text:st.text };
      }
      const id=e.id, title=Engine.encounterTitle(e), r=Engine.endEncounter(S.table, id, { rows }, packsMemo);
      if (!r.ok){ S.encWrap.err=r.why; redraw(); focus("[data-ew-end]"); return; }
      S.encWrap=null; S.encOpen=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; tableChange(()=>{}, true, `Ended ${title}`); focus("[data-enc-new]"); },
    "data-enext": next,
    "data-eopen-kind": b => { const k=b.dataset.eopenKind, cur=encOpenNow().opening; openingWrite(k==="none" ? null : { kind:k, side:cur ? cur.side : "crew" }); focus(attrSel("data-eopen-kind", k)); },
    "data-eopen-side": b => { const cur=encOpenNow().opening; if (!cur) return; openingWrite({ kind:cur.kind, side:b.dataset.eopenSide }); focus(attrSel("data-eopen-side", b.dataset.eopenSide)); },
    "data-eadvadd": () => { let at; planTyped(d=>{ at=d.adversaries.length; d.adversaries.push({ who:"", goals:"", tactics:"", leverage:"" }); }, true); S.encPlan=Object.assign(S.encPlan||{}, { [eid()]:true }); focus(`[data-eadv="${at}|who"]`); },
    "data-eadvrm": b => { const i=+b.dataset.eadvrm; let left;
      planTyped(d=>{ d.adversaries.splice(i, 1); left=d.adversaries.length; }, true);
      focus(`[data-eadv="${Math.min(i, left-1)}|who"]`) || focus("[data-eadvadd]"); },
    "data-eobj": b => { const id=b.dataset.eobj; let on;
      const r=planTyped(d=>{ on=!d.beyond.includes(id); d.beyond=on ? d.beyond.concat([id]) : d.beyond.filter(x=>x!==id); }, false);
      if (r && r.ok){ b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); } b.focus(); },
    "data-edelay-open": b => { S.encDelay={ row:b.dataset.edelayOpen }; S.encDmg=null; S.encHit=null; S.encCond=null; redraw(); focus("[data-edelay-until]"); },
    "data-edelaycancel": () => { const row=S.encDelay && S.encDelay.row; S.encDelay=null; redraw(); focus(attrSel("data-edelay-open", row)); },
    "data-eacnow": b => { const r=Engine.actNow(S.table, eid(), b.dataset.eacnow); if (!r.ok){ notice(r.why); return; } S.encDelay=null; tableChange(()=>{}); focus(attrSel("data-erow", b.dataset.eacnow)); toActive(); },
    "data-eby": b => { if (b.dataset.eby===encOpenNow().by){ focus(attrSel("data-eby", b.dataset.eby)); return; } const r=Engine.editEncounter(S.table, eid(), { by:b.dataset.eby }); if (!r.ok){ notice(r.why); return; } tableChange(()=>{}); focus(attrSel("data-eby", b.dataset.eby)); },
    "data-eaddside": () => { const r=Engine.addSide(S.table, eid(), {}); if (!r.ok){ notice(r.why); return; }
      S.encMore=Object.assign(S.encMore||{}, { [r.id]:true }); tableChange(()=>{}); focus(attrSel("data-esidename", r.id)); },
    "data-esiderm": b => { const e=encOpenNow(), r=Engine.removeSide(S.table, e.id, b.dataset.esiderm); if (!r.ok){ notice(r.why); return; }
      tableChange(()=>{}); const to=Engine.sideTitle(encOpenNow(), encOpenNow().sides[1].id);
      notice(r.moved ? `Moved ${r.moved} to ${to}.` : "Side removed. Nobody was on it."); focus("[data-eaddside]") || focus("[data-eby]"); },
    "data-enc-pick": () => { S.encPick=!S.encPick; redraw(); if (S.encPick) focus("[data-enc-q]"); else focus("[data-enc-pick]"); },
    "data-enc-codex": () => { S.encCodex=!S.encCodex; redraw(); if (S.encCodex) focus("[data-enc-codexq]"); else focus("[data-enc-codex]"); },
    "data-enc-addcodex": b => { const key=b.dataset.encAddcodex, [pack, id]=key.split("|"), isG=b.dataset.encCodexkind==="group", e=encOpenNow();
      let r, msg;
      if (isG){
        const hit=Engine.packGroups(packsMemo, {}).find(x=>x.pack.meta.id===pack && x.group.id===id);
        r=hit ? Engine.participantsFromGroup(S.table, e.id, hit.pack, id) : { ok:false, why:"No such group." };
        if (r.ok) msg=`${hit.group.name.trim() || "Unnamed"}: ${r.ids.length} added to ${Engine.encounterTitle(e)}.`;
      } else {
        const found=Engine.packEntry(packsMemo, pack, id);
        r=found ? Engine.participantFromEntry(S.table, e.id, found.pack, id) : { ok:false, why:"No such entry." };
        if (r.ok){ const row=encOpenNow().rows.find(x=>x.id===r.id); msg=`${row ? row.name : "They"} is in ${Engine.encounterTitle(e)}.`; }
      }
      if (!r.ok){ notice(r.why); return; }
      tableChange(()=>{}); notice(msg); focus(attrSel("data-enc-addcodex", key)); },
    "data-enc-addcast": b => { const id=b.dataset.encAddcast, after=pickNextAdd(id), r=Engine.addParticipant(S.table, eid(), { kind:"cast", id });
      if (!r.ok){ notice(r.why); return; } tableChange(()=>{}); focus(after ? attrSel("data-enc-addcast", after) : "[data-enc-q]"); },
    "data-enc-addpc": () => addPc(),
    "data-eopencast": b => { const id=b.dataset.eopencast; if (!S.table.cast.some(n=>n.id===id)) return;
      S.tsection="cast"; S.castOpen=id; S.castFrom=null; S.intAdd=null; S.backSess=false; S.backClose=false; S.backEnc=eid(); S.castView="cast"; window.scrollTo(0,0); update(); focus("[data-cback]"); },
    "data-eopenentry": b => openThreat(b.dataset.eopenentry, null, null, eid()),
    "data-edmg": b => { const [row, sign]=b.dataset.edmg.split("|"); S.encDmg={ row, sign:+sign }; S.encHit=null; S.encCond=null; redraw(); focus("[data-edmgn]"); },
    "data-ehit": b => { S.encHit=encHitNew(b.dataset.ehit); S.encDmg=null; S.encCond=null; redraw(); focus("[data-ehit-damage]"); },
    "data-ehit-cancel": () => { const row=S.encHit.row; S.encHit=null; redraw(); focus(attrSel("data-ehit", row)); },
    "data-ehit-cat": b => { const d=S.encHit; d.cat=b.dataset.ehitCat; d.conds={}; d.shock=""; d.atZero=""; d.err=""; redraw(); focus(attrSel("data-ehit-cat", d.cat)); },
    "data-ehit-ap": () => { const d=S.encHit; d.ap=!d.ap; d.err=""; redraw(); focus("[data-ehit-ap]"); },
    "data-ehit-ans": b => { const d=S.encHit, [k, a]=b.dataset.ehitAns.split("|"); d[k]= d[k]===a ? "" : a; d.err=""; hitLive(); focus(attrSel("data-ehit-ans", b.dataset.ehitAns)); },
    "data-ehit-apply": () => { const d=S.encHit, row=d.row, r=encHitRow(); if (!r) return;
      const res=Engine.resolveEncounterHit(S.table, eid(), row, encHitInput(d));
      const choices={ shock:d.shock, atZero:d.atZero, conditions: res.ok ? encHitTicked(d, res) : [] };
      const hitRow=Engine.encounterView(S.table, eid(), packsMemo).rows.find(x=>x.row.id===row), who=hitRow && String(hitRow.name||"").trim() || "a row";
      const a=Engine.applyEncounterHit(S.table, eid(), row, encHitInput(d), choices);
      if (!a.ok){ d.err=a.why; hitLive(); focus("[data-ehit-apply]"); return; }
      S.encHit=null; tableChange(()=>{}, true, `Hit ${who}`); focus(attrSel("data-ehit", row)); },
    "data-edmgcancel": () => { const row=S.encDmg && S.encDmg.row, sign=S.encDmg ? S.encDmg.sign : 1; S.encDmg=null; redraw(); focus(attrSel("data-edmg", `${row}|${sign}`)); },
    "data-econdopen": b => { S.encCond={ row:b.dataset.econdopen, id:"", loc:"", source:"", rounds:"", err:"" }; S.encDmg=null; S.encHit=null; redraw(); focus("[data-econd-id]"); },
    "data-econd-cancel": () => { const row=S.encCond.row; S.encCond=null; redraw(); focus(attrSel("data-econdopen", row)); },
    "data-econd-add": () => { const d=S.encCond, rowId=d.row, rounds=d.rounds.trim();
      const r=Engine.participantAddCondition(S.table, eid(), rowId, { id:d.id, location:d.loc, source:d.source, rounds:rounds==="" ? null : rounds });
      if (!r.ok){ d.err=r.why; redraw(); focus("[data-econd-add]"); return; }
      S.encCond=null; tableChange(()=>{});
      const chips=$("main").querySelectorAll(`${attrSel("data-erow", rowId)} .enc-cond [data-tip]`);
      if (chips.length) chips[chips.length-1].focus(); else focus(attrSel("data-econdopen", rowId)); },
    "data-econdrm": b => { const [row, i]=b.dataset.econdrm.split("|"); change(()=>Engine.participantRemoveCondition(S.table, eid(), row, +i)); focus(attrSel("data-econdopen", row)); },
    "data-emarks": b => { const [row, i, d]=b.dataset.emarks.split("|"), e=encOpenNow(), r=e && e.rows.find(x=>x.id===row), c=r && r.conditions[+i];
      if (c) change(()=>Engine.participantConditionMarks(S.table, eid(), row, +i, (c.marks||0) + (+d))); },
    "data-elast": b => { const id=b.dataset.elast, r=encOpenNow().rows.find(x=>x.id===id); S.encMore=Object.assign(S.encMore||{}, { [id]:true }); edit(id, { last:!r.last }); focus(attrSel("data-elast", id)); },
    "data-eout": b => { const id=b.dataset.eout, r=encOpenNow().rows.find(x=>x.id===id); S.encMore=Object.assign(S.encMore||{}, { [id]:true }); edit(id, { out:!r.out }); focus(attrSel("data-eout", id)); },
    "data-erm": b => { const id=b.dataset.erm, e=encOpenNow(), at=e.rows.findIndex(x=>x.id===id), r=e.rows[at];
      askFirst({ title:`Remove ${r.name.trim() || "this row"}?`, text:"Their damage and Conditions in this encounter go with them.", yes:"Remove", then(){
        const ids=Engine.encounterView(S.table, eid(), packsMemo).rows.map(x=>x.row.id), pos=ids.indexOf(id), after=ids[pos+1] || ids[pos-1];
        change(()=>Engine.removeParticipant(S.table, eid(), id));
        const el=after && rowEl(after); if (el) el.focus(); else focus("[data-enc-pcname]"); } }); },
    "data-ekeep": b => { const [row, i, what]=b.dataset.ekeep.split("|"); encResetNow().keep[`${row}|${i}`]= what==="keep"; redraw(); focus(attrSel("data-ekeep", b.dataset.ekeep)); },
    "data-efinish": () => { const st=encResetNow(), keep=Object.keys(st.keep).filter(k=>st.keep[k]).map(k=>{ const [row, i]=k.split("|"); return [row, +i]; });
      const was=encOpenNow(), words=`Reset ${Engine.encounterTitle(was)}, round ${was.round}`;
      const r=Engine.applyEncounterReset(S.table, eid(), encResetInput(), { keep }); if (!r.ok){ notice(r.why); return; }
      S.encReset=null; tableChange(()=>{}, true, words); focus("[data-enext]"); toActive(); },
    // Last: a tap on a row's name area makes it active, and a tap on anything with its own job does that job.
    "data-eturn": (el, ev) => { if (ev.target.closest("button, input, select, label, a, summary")) return;
      const r=Engine.setTurn(S.table, eid(), el.dataset.eturn); if (!r.ok){ notice(r.why); return; } tableChange(()=>{}); toActive(); },
  };
  function addPc(){
    const input=$("main").querySelector("[data-enc-pcname]"); if (!input || !input.value.trim()) return;
    const r=Engine.addParticipant(S.table, eid(), { kind:"pc", name:input.value });
    if (!r.ok){ notice(r.why); return; }
    tableChange(()=>{}); focus("[data-enc-pcname]");
  }
  if (!encOpenNow()){
    main.onclick = ev => { const b=ev.target.closest("[data-enc-new], [data-enc-open], [data-ecard]"); if (!b) return;
      if (b.matches("[data-enc-new]")) act["data-enc-new"](); else if (b.matches("[data-enc-open]")) act["data-enc-open"](b);
      else if (!ev.target.closest("button")) open(b.dataset.ecard); };
    const input=main.querySelector("[data-enc-name]");
    if (input) input.onkeydown = ev => { if (ev.key==="Enter"){ ev.preventDefault(); act["data-enc-new"](); } };
    return;
  }
  main.onclick = ev => {
    for (const attr of Object.keys(act)){
      const el=ev.target.closest(`[${attr}]`);
      if (el && main.contains(el)){ act[attr](el, ev); return; }
    }
  };
  // Typed fields save on change; a number field that can't be a whole number shows what was stored (the redraw).
  main.onchange = ev => {
    const el=ev.target, d=el.dataset;
    const row = (key, f) => { edit(el.dataset[key], f(el.value)); focus(attrSel(`data-${key.replace(/[A-Z]/g, c=>"-"+c.toLowerCase())}`, el.dataset[key])); };
    if ("eplan" in d || "eadv" in d) planKey(el);
    else if ("eorder" in d) row("eorder", v=>({ order:v })); else if ("ehp" in d) row("ehp", v=>({ hp:v }));
    else if ("elevels" in d) row("elevels", v=>({ levels:v })); else if ("eaware" in d) row("eaware", v=>({ awareness:v }));
    else if ("eside" in d){ const r=Engine.editParticipant(S.table, eid(), d.eside, { side:el.value }); if (!r.ok){ notice(r.why); return; }
      S.encMore=Object.assign(S.encMore||{}, { [d.eside]:true }); tableChange(()=>{}); focus(attrSel("data-eside", d.eside)); }
    else if ("esidename" in d){ const r=Engine.renameSide(S.table, eid(), d.esidename, el.value); if (!r.ok){ notice(r.why); return; }
      tableChange(()=>{}); focus(attrSel("data-esidename", d.esidename)); }
    else if ("ename" in d) { edit(d.ename, { name:el.value }); focus(attrSel("data-ename", d.ename)); }
    else if ("econdId" in d){ S.encCond.id=el.value; S.encCond.loc=""; S.encCond.err=""; redraw(); focus("[data-econd-id]"); }
    else if ("econdLoc" in d) S.encCond.loc=el.value;
    else if ("ehitType" in d){ S.encHit.type=el.value; S.encHit.conds={}; S.encHit.err=""; hitLive(); }
    else if ("ehitLoc" in d){ S.encHit.loc=el.value; S.encHit.err=""; hitLive(); }
    else if ("ehitCond" in d){ S.encHit.conds[d.ehitCond]=el.checked; }
    else if ("ewKeep" in d){ encWrapDraft(d.ewKeep).keep=el.checked; redraw(); focus(attrSel("data-ew-keep", d.ewKeep)); }
    else if ("ewLine" in d){ encWrapDraft(d.ewLine).line=el.checked; redraw(); focus(attrSel("data-ew-line", d.ewLine)); }
    else if ("ewStatus" in d){ encWrapDraft(d.ewStatus).status=el.value; wrapSentenceNow(d.ewStatus); focus(attrSel("data-ew-status", d.ewStatus)); }
    else if ("ewDiff" in d){ S.encWrap.diff=el.value; redraw(); focus("[data-ew-diff]"); }
  };
  main.oninput = ev => {
    const el=ev.target, d=el.dataset;
    if ("encTitle" in d) tableChange(()=>Engine.editEncounter(S.table, eid(), { name:el.value }), false);
    else if ("eplan" in d || "eadv" in d) planKey(el);
    else if ("ewText" in d) encWrapDraft(d.ewText).text=el.value;
    else if ("ewName" in d){ encWrapDraft(d.ewName).name=el.value; wrapSentenceNow(d.ewName); }
    else if ("econdSrc" in d) S.encCond.source=el.value;
    else if ("econdRounds" in d) S.encCond.rounds=el.value;
    else if ("ehitDamage" in d){ S.encHit.damage=el.value; S.encHit.err=""; hitLive(); }
    else if ("ehitFrom" in d){ S.encHit.from=el.value; hitLive(); }
    else if ("encCodexq" in d){ S.encCodexQ=el.value; const box=main.querySelector("[data-enccodexlist]"); if (box) box.outerHTML=encCodexHtml(); }
    else if ("encQ" in d){ S.encQ=el.value; const box=main.querySelector("[data-encpicklist]"); if (box) box.outerHTML=encPickHtml(encOpenNow()); }
    else if ("esrc" in d){
      const [row, i]=d.esrc.split("|"), st=encResetNow(); (st.sources[row]||(st.sources[row]={}))[i]=el.value;
      const fin=main.querySelector("[data-efinish]"), res=Engine.resolveEncounterReset(S.table, eid(), encResetInput());
      if (fin) fin.disabled=!res.ok;
    }
  };
  main.onsubmit = ev => {
    const dl=ev.target.closest("[data-edelayform]");
    if (dl){
      ev.preventDefault();
      const row=dl.dataset.edelayform, r=Engine.delayTurn(S.table, eid(), row, dl.querySelector("[data-edelay-until]").value);
      if (!r.ok){ notice(r.why); return; }
      S.encDelay=null; S.encReset=null; tableChange(()=>{});
      if (r.reset) focus("[data-esrc]") || focus("[data-efinish]"); else { focus("[data-enext]"); toActive(); }
      return;
    }
    const f=ev.target.closest("[data-edmgform]"); if (!f) return;
    ev.preventDefault();
    const row=f.dataset.edmgform, sign=S.encDmg ? S.encDmg.sign : 1, raw=f.querySelector("[data-edmgn]").value.trim();
    if (raw==="") { S.encDmg=null; redraw(); focus(attrSel("data-edmg", `${row}|${sign}`)); return; }
    if (Number(raw) < 0){ notice("Enter a whole number."); return; }
    const r=Engine.participantDamage(S.table, eid(), row, Number(raw) * sign);
    if (!r.ok){ notice(r.why); return; }
    S.encDmg=null; tableChange(()=>{}); focus(attrSel("data-edmg", `${row}|1`));
  };
  main.onkeydown = ev => {
    if (ev.key==="Enter" && ev.target.matches("[data-enc-pcname]")){ ev.preventDefault(); addPc(); }
    else if (ev.key==="Enter" && ev.target.matches("[data-econd-src], [data-econd-rounds]")){ ev.preventDefault(); act["data-econd-add"](); }
    else if (ev.key==="Enter" && ev.target.matches("[data-ehit-damage], [data-ehit-from]")){ ev.preventDefault(); const b=main.querySelector("[data-ehit-apply]"); if (b && !b.disabled) act["data-ehit-apply"](); }
  };
  // The encounter's clocks are S7's, bound where the page draws the Add a clock (an ended encounter's are text, and wrap-up hides them).
  const here=encOpenNow();
  if (here && main.querySelector("[data-clkadd]")) bindClocks(main, { kind:"encounter", id:here.id });
  const planBox=main.querySelector("[data-eplan-d]");
  if (planBox) planBox.ontoggle=()=>{ S.encPlan=Object.assign(S.encPlan||{}, { [planBox.dataset.eplanD]:planBox.open }); };
  // A More that was opened stays open through a redraw.
  main.querySelectorAll("[data-emore]").forEach(d=>d.ontoggle=()=>{ S.encMore=Object.assign(S.encMore||{}, { [d.dataset.emore]:d.open }); });
}
