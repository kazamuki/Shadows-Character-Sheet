// GM mode's interface (Decisions 170–173): a GM's table, its storage in the
// browser, its screen and Home's door to it. A classic script sharing the
// global scope with shared.js, wizard.js and sheet.js (Decisions 86, 172); its
// engine is the Tables section of engine.js. Everything here sits behind the
// feature switch (Decision 173): featureOn("gm").
//
// The three places the other UI files call in: update() saves the open table
// (saveTable), renderMain() draws the table screen (renderTable, and
// renderTableChrome for the header), and Home draws its table list and routes
// an imported table (gmTablesHtml, gmDoorHtml, bindGmHome, gmImportTable).

const GM_NOT_A_FILE = "That file isn't a character or a table.";

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
  localStorage.setItem(tableKey(id), JSON.stringify({ table, section:section||"notes", changed, exported:exported||null }));
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

// Every change to the open table goes through here: run it, stamp it, save it.
// `redraw` false keeps the keyboard where it is while a GM types.
function tableChange(fn, redraw=true){
  fn();
  S.table.meta.updated=new Date().toISOString();
  update(redraw);
}
const tableName = (t, none="Untitled table") => String((t && t.meta && t.meta.name) || "").trim() || none;
function homeState(){ return { screen:"home", ch:null, step:0, maxReached:0, section:"main", admin:false }; }
function openTable(t, section){
  lastTableSaved=null; untouched=null;
  S={ screen:"table", ch:null, step:0, maxReached:0, section:"main", admin:false, table:t, tsection:TABLE_SECTIONS.some(s=>s.id===section) ? section : TABLE_SECTIONS[0].id };
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
// Home's one Import hands a table file here, already known to be one.
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
  const run=$("btn-run-table");
  if (run) run.onclick=()=>openNameModal({ title:"Run a table", yes:"Create", then:name=>openTable(Engine.newTable(name)) });
  const open = e => e && openTable(Engine.migrateTable(clone(e.table)), e.section);
  main.querySelectorAll("[data-topen]").forEach(b=>b.onclick=()=>open(byId(b.dataset.topen)));
  main.querySelectorAll("[data-texport]").forEach(b=>b.onclick=()=>{ exportTable(byId(b.dataset.texport).table); renderHome(); });
  main.querySelectorAll("[data-tremove]").forEach(b=>b.onclick=()=>askRemoveTable(byId(b.dataset.tremove)));
  // A tap anywhere on a card opens it; its buttons keep their own.
  main.querySelectorAll("[data-tcard]").forEach(li=>li.onclick=ev=>{ if (!ev.target.closest("button")) open(byId(li.dataset.tcard)); });
}

// ── The table screen ───────────────────────────────────────────────────
const TABLE_SECTIONS = [{ id:"notes", label:"Notes", ui:"tab_notes" }];
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
  nav.querySelectorAll("[data-tsec]").forEach(b=>b.onclick=()=>{ S.tsection=b.dataset.tsec; window.scrollTo(0,0); update(); });
  showActiveTab(nav);
  if (!act) return;
  act.innerHTML = `<button class="kebab" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Table actions">⋮</button>
    <div class="hdr-menu" id="hdrmenu" hidden>
      <button data-trename="1">Rename</button>
      <button data-texport-open="1">Export .shadows-table.json</button>
      <button data-whatsnew="1">What's new</button>
      <button data-thome="1">Home</button>
    </div>`;
  const menu=$("hdrmenu"), kb=act.querySelector("[data-menu-toggle]");
  kb.onclick=e=>{ e.stopPropagation(); const willOpen=menu.hidden; menu.hidden=!willOpen; kb.setAttribute("aria-expanded", willOpen?"true":"false"); };
  act.querySelector("[data-trename]").onclick=()=>{ menu.hidden=true; kb.setAttribute("aria-expanded","false");
    openNameModal({ title:"Rename table", value:t.meta.name, yes:"Save", then:name=>tableChange(()=>{ t.meta.name=name; }) }); };
  act.querySelector("[data-texport-open]").onclick=()=>{ menu.hidden=true; exportTable(S.table); };
  act.querySelector("[data-thome]").onclick=()=>{ lastTableSaved=null; S=homeState(); renderHome(); };
}
function noteCardHtml(n){
  const id=esc(n.id);
  return `<div class="tbl-note" data-note="${id}">
    <label class="field"><span>Title</span><input type="text" data-ntitle="${id}" value="${esc(n.title)}" placeholder="Untitled note" autocomplete="off"></label>
    <label class="field"><span>Note</span><textarea data-ntext="${id}">${esc(n.text)}</textarea></label>
    <button class="btn sm danger" data-ndel="${id}">Delete</button></div>`;
}
function renderTable(){
  // Only reachable with the switch on: with it off, Home draws instead.
  if (!featureOn("gm") || !S.table){ S=homeState(); return renderHome(); }
  closeVitals(); renderDrawer(); closePopover(false);
  const t=S.table, main=$("main");
  const made=Date.parse(t.meta.created);
  const failed = saveFailed ? `<div class="import-issues" role="alert">${issuesHtml([{level:"error", msg:"This browser couldn't save your last change. Export the table now so nothing is lost."}])}</div>` : "";
  main.innerHTML = failed +
    `<h1 class="step-title">${esc(tableName(t))}</h1>
    <p class="step-note">Table${Number.isFinite(made)?` · created ${esc(new Date(made).toLocaleDateString())}`:""}</p>
    <p><button class="btn primary" data-tnew>New note</button></p>
    ${t.notes.length ? t.notes.map(noteCardHtml).join("")
      : `<p class="step-note">Nothing written yet. Notes stay with the table and travel in its file.</p>`}`;
  bindTable();
}
function bindTable(){
  const main=$("main");
  const titleOf = id => main.querySelector(`[data-ntitle="${id}"]`);
  // Saved on `input`, not `change`: a GM who types and goes Home at once
  // would otherwise lose the last words. No redraw while typing.
  main.querySelectorAll("[data-ntitle]").forEach(el=>el.oninput=()=>{
    tableChange(()=>Engine.editTableNote(S.table, el.dataset.ntitle, { title:el.value }), false); });
  main.querySelectorAll("[data-ntext]").forEach(el=>el.oninput=()=>{
    tableChange(()=>Engine.editTableNote(S.table, el.dataset.ntext, { text:el.value }), false); });
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
