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
  if (run) run.onclick=()=>openNameModal({ title:"Run a table", yes:"Create", then:name=>{ openTable(Engine.newTable(name)); const b=document.querySelector("[data-cadd-name]"); if (b) b.focus(); } });
  const open = e => e && openTable(Engine.migrateTable(clone(e.table)), e.section);
  main.querySelectorAll("[data-topen]").forEach(b=>b.onclick=()=>open(byId(b.dataset.topen)));
  main.querySelectorAll("[data-texport]").forEach(b=>b.onclick=()=>{ exportTable(byId(b.dataset.texport).table); renderHome(); });
  main.querySelectorAll("[data-tremove]").forEach(b=>b.onclick=()=>askRemoveTable(byId(b.dataset.tremove)));
  // A tap anywhere on a card opens it; its buttons keep their own.
  main.querySelectorAll("[data-tcard]").forEach(li=>li.onclick=ev=>{ if (!ev.target.closest("button")) open(byId(li.dataset.tcard)); });
}

// ── The table screen ───────────────────────────────────────────────────
// The cast is first: a table opens on it (Decision 176).
const TABLE_SECTIONS = [{ id:"cast", label:"Cast", ui:"tab_archetype" }, { id:"threats", label:"Threats", ui:"tab_loadout" }, { id:"encounters", label:"Encounters", ui:"tab_trackers" }, { id:"notes", label:"Notes", ui:"tab_notes" }];
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
  nav.querySelectorAll("[data-tsec]").forEach(b=>b.onclick=()=>{ S.tsection=b.dataset.tsec; if (S.tsection==="cast"){ S.castOpen=null; S.backEnc=null; } if (S.tsection==="threats"){ S.threatOpen=null; S.threatGroup=null; S.threatMember=null; S.threatEnc=null; } window.scrollTo(0,0); update(); });
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
    openNameModal({ title:"Rename table", value:t.meta.name, yes:"Save", then:name=>{ tableChange(()=>{ t.meta.name=name; }); const k=document.querySelector("[data-menu-toggle]"); if (k) k.focus(); } }); };
  act.querySelector("[data-texport-open]").onclick=()=>{ menu.hidden=true; exportTable(S.table); };
  act.querySelector("[data-thome]").onclick=()=>{ lastTableSaved=null; S=homeState(); renderHome(); };
}
function noteCardHtml(n){
  const id=esc(n.id);
  return `<div class="tbl-note" data-note="${id}">
    <label class="field"><span>Title</span><input type="text" data-ntitle="${id}" value="${esc(n.title)}" placeholder="Untitled note" autocomplete="off"></label>
    <label class="field"><span>Note</span><textarea data-ntext="${id}" placeholder="Leads, debts, names to remember.">${esc(n.text)}</textarea></label>
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
  const onPage = (S.tsection==="cast" && castOpenMember()) || threatPage || encPage;
  const head = onPage ? "" :
    `<h1 class="step-title tbl-title">${esc(tableName(t))}</h1>
    <p class="step-note">Table${Number.isFinite(made)?` · created ${esc(new Date(made).toLocaleDateString())}`:""}</p>`;
  const body = S.tsection==="cast" ? (onPage ? castPageHtml(onPage) : castTabHtml(t))
    : S.tsection==="threats" ? (threatPage ? threatPage.html : threatsTabHtml(t)) : S.tsection==="encounters" ? encountersTabHtml(t) : notesTabHtml(t);
  // A redraw a press causes keeps the keyboard's place (Decision 164).
  keepPlace(main, ()=>{ main.innerHTML = failed + head + body; bindTable(); }, ["[data-cadd-name]", "[data-tnew]", "[data-tsearch]", "[data-pslot]", "[data-enc-new]"]);
}
function bindTable(){
  const main=$("main");
  main.onclick=main.onchange=main.oninput=main.onsubmit=main.onkeydown=null;   // the Encounters tab delegates; no other tab does
  if (main.querySelector("[data-tnew]")) bindNotes(main);
  else if (S.tsection==="cast") bindCast(main);
  else if (S.tsection==="threats") bindThreats(main);
  else if (S.tsection==="encounters") bindEncounters(main);
}
function bindNotes(main){
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

// ── The cast (Decisions 174–176) ───────────────────────────────────────
// State is on S, so it goes with the open table and no further: S.castOpen
// (a member's id, or null for the list), S.castQ and S.castStatus (the filters).
const CAST_STATUS_LABELS = { alive:"Alive", dead:"Dead", missing:"Missing", gone:"Out of the picture" };
const CAST_FILTER_STATUSES = ["inplay","alive","all","dead","missing","gone"];
const castStatusLabel = s => s==="all" ? "All" : s==="inplay" ? "In play" : CAST_STATUS_LABELS[s] || "Alive";
// The affiliation filter names what the cast has: one that has since left it filters nothing.
const castAffNow = () => { const w=String(S.castAff||"").toLowerCase(); return w && Engine.castAffiliations(S.table).find(a=>a.toLowerCase()===w) || ""; };
const castFilterNow = () => ({ q:S.castQ||"", status:S.castStatus||"inplay", affiliation:castAffNow() });
// The seven kinds, read from the crew's side (Decision 177), in the order they're pressed.
const INTERACTION_KINDS = [["shared","Told them"], ["learned","Learned from them"], ["helped","Helped them"], ["wronged","Wronged them"],
  ["killed","Killed them"], ["owes","Owes them"], ["owed","They owe"]];
const interactionLabel = k => (INTERACTION_KINDS.find(x=>x[0]===k)||[])[1] || "";
// The GM's local day, YYYY-MM-DD. Not toISOString(): that's UTC, and after 7 pm in New York it says tomorrow.
function localDay(d=new Date()){
  const p = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
const splitList = (v, re) => String(v).split(re).map(s=>s.trim()).filter(Boolean);
// The add row's draft: kept while the page is open, so three lines in a scene are three Enters.
const intAdd = () => S.intAdd || (S.intAdd={ kind:null, crew:"", date:localDay(), what:"" });
const kindToggleHtml = (attr, current, label, prefix="") => `<div class="form-toggle int-kinds" role="group" aria-label="${esc(label)}">${INTERACTION_KINDS.map(([k,name])=>
  `<button type="button" ${attr}="${esc(prefix+k)}" class="${k===current?"on":""}" aria-pressed="${k===current}">${esc(name)}</button>`).join("")}</div>`;
function castOpenMember(){ return S.castOpen ? S.table.cast.find(n=>n.id===S.castOpen) || null : null; }
const numAttr = v => typeof v==="number" && Number.isFinite(v) ? v : "";
const castSigned = n => n===0 ? "0" : signed(n);   // sheet.js's, with a zero
const hasNumber = b => !!b && (Object.values(b.stats||{}).concat(Object.values(b.authored||{}), (b.skills||[]).map(k=>k.total)).some(v=>typeof v==="number"));

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
// A gone member is a struck-through name, not a button (Decision 178).
function linkNameHtml(t, link, where){
  const r=Engine.linkName(t, link);
  return r.gone ? `<s>${esc(r.name)}</s><span class="vh">, removed</span>`
    : `<button class="cast-open int-who" data-copen="${esc(link.id)}" data-cwhere="${esc(where)}">${esc(r.name)}</button>`;
}
// Who knows what (Decision 179): the same records, by crew name.
function crewViewHtml(t){
  const groups=Engine.crewView(t, { q:S.castQ||"" });
  if (!groups.length) return S.castQ && String(S.castQ).trim() ? `<p class="step-note">No one matches.</p>` : `<p class="step-note">Nothing between the crew and anyone yet.</p>`;
  return groups.map(g=>`<section class="crew-group"><h2 class="cast-h crew-name">${esc(g.name || "No one named")}</h2><ul class="int-list">${g.interactions.map(x=>{
    const who=(x.cast||[]).map((l,li)=>linkNameHtml(t, l, `${g.name.trim().toLowerCase()}|${x.id}|${li}`)).join(", ");
    const bits=[ interactionLabel(x.kind) ? `<span class="int-kind">${esc(interactionLabel(x.kind))}</span>` : "", who,
      x.date ? `<span class="int-date">${esc(dayText(x.date))}</span>` : "", x.text ? `<span class="int-text">${esc(x.text)}</span>` : "" ].filter(Boolean);
    return `<li class="int-line">${bits.join(" ")}</li>`; }).join("")}</ul></section>`).join("");
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
// What passed between this member and the crew (Decisions 177–179).
function interactionRowHtml(x){
  const id=esc(x.id);
  return `<li class="int-row" data-int="${id}">
    ${kindToggleHtml("data-ikind", x.kind, "What kind", x.id+"|")}
    <div class="int-fields">
      <input type="text" data-icrew="${id}" list="crew-names" value="${esc(x.crew.join(", "))}" placeholder="Crew" aria-label="Crew" autocomplete="off">
      <input type="date" data-idate="${id}" value="${esc(x.date||"")}" aria-label="When">
      <textarea rows="2" data-itext="${id}" placeholder="What passed between them" aria-label="What">${esc(x.text)}</textarea>
      <button class="btn sm danger" data-idel="${id}">Delete</button></div></li>`;
}
function castInteractionsHtml(n){
  const a=intAdd(), rows=Engine.interactionsFor(S.table, n.id);
  const names=Engine.crewView(S.table, {}).map(g=>g.name);
  return `<h2 class="cast-h">Between them and the crew</h2>
    <datalist id="crew-names">${names.map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
    <div class="int-add">
      ${kindToggleHtml("data-iakind", a.kind, "What kind")}
      <div class="int-fields">
        <label class="field"><span>Crew</span><input type="text" data-iacrew list="crew-names" value="${esc(a.crew)}" placeholder="Who from the crew" autocomplete="off"></label>
        <label class="field"><span>When</span><input type="date" data-iadate value="${esc(a.date||"")}"></label>
        <label class="field"><span>What</span><input type="text" data-iwhat value="${esc(a.what||"")}" placeholder="What passed between them" autocomplete="off"></label>
        <button class="btn primary" data-iadd>Add</button></div></div>
    <ul class="int-list" data-intlist>${rows.map(interactionRowHtml).join("")}</ul>`;
}
// The pack's names for the fields the GM types (Decision 184): a list to pick from, and the roles as toggles.
function castRolesHtml(n){
  const roles=Engine.packChoices(packsMemo).npcRoles;
  return roles.length ? `<div class="form-toggle cast-roles" role="group" aria-label="Roles in the pack">${roles.map(r=>
    `<button type="button" data-crole="${esc(r)}" aria-pressed="false">${esc(r)}</button>`).join("")}</div>` : "";
}
const datalistHtml = (id, names) => names.length ? `<datalist id="${id}">${names.map(x=>`<option value="${esc(x)}"></option>`).join("")}</datalist>` : "";
function castPageHtml(n){
  const c=Engine.packChoices(packsMemo), packs=packsMemo.length, back=encBackTitle();
  return `<p><button class="btn sm" data-cback>${back ? `Back to ${esc(back)}` : "Back to the cast"}</button>${encAddBtnHtml("data-cenc", encTarget())}</p>
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
      <label class="field"><span>Status</span><select data-cf="status">${["alive","dead","missing","gone"].map(s=>`<option value="${s}"${s===n.status?" selected":""}>${esc(castStatusLabel(s))}</option>`).join("")}</select></label>
    </div>
    ${castText(n,"motivation","What they want","",true)}
    ${castText(n,"resources","What they've got","",true)}
    ${castText(n,"line","Their line","Where they stop.",true)}
    ${castText(n,"ifPushed","If pushed","What happens when they are.",true)}
    ${castText(n,"gmNote","GM note","Yours alone.",true)}
    <label class="field"><span>Affiliations</span><input type="text" data-cf="affiliations" value="${esc(n.affiliations.join(" / "))}" placeholder="Who they answer to" autocomplete="off"></label>
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
function bindCastCards(main){
  // A member opened from Who knows what remembers which name it was, so Back lands on it.
  const open = (id, from) => { S.castOpen=id; S.backEnc=null; S.castFrom=from||null; S.intAdd=null; window.scrollTo(0,0); update(); const el=$("main").querySelector("[data-cback]"); if (el) el.focus(); };
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
  whatEl.addEventListener("input", ()=>{ a.what=whatEl.value; });
  const add=()=>{
    const text=whatEl.value;
    if (!a.kind && !text.trim()) return;
    let r; tableChange(()=>{ r=Engine.addInteraction(S.table, { kind:a.kind, cast:[id], crew:splitList(a.crew, /,/), text, date:a.date }); }, false);
    if (!r.ok) return;
    if (a.kind==="killed") a.kind=null;
    a.what="";
    renderTable(); focus("[data-iwhat]");
  };
  main.querySelector("[data-iadd]").onclick=add;
  whatEl.addEventListener("keydown", ev=>{ if (ev.key==="Enter"){ ev.preventDefault(); add(); } });
  // The rows are saved on input, with no redraw, so a GM who types and goes Home keeps the words.
  const edit = (xid, f) => tableChange(()=>Engine.editInteraction(S.table, xid, f), false);
  main.querySelectorAll("[data-ikind]").forEach(b=>b.onclick=()=>{
    const [xid, k]=b.dataset.ikind.split("|"), cur=found(xid); if (!cur) return;
    edit(xid, { kind: cur.kind===k ? null : k });
    renderTable(); focus(`[data-ikind="${xid}|${k}"]`);
  });
  main.querySelectorAll("[data-itext]").forEach(el=>el.oninput=()=>edit(el.dataset.itext, { text:el.value }));
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
        tableChange(()=>Engine.removeInteraction(S.table, xid));
        const next=order[at+1], el=next && $("main").querySelector(`[data-ikind^="${next.id}|"]`) || $("main").querySelector("[data-iwhat]");
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
  const addEnc=main.querySelector("[data-cenc]");
  if (addEnc) addEnc.onclick=()=>{
    const e=encTarget(); if (!e) return;
    const r=Engine.addParticipant(S.table, e.id, { kind:"cast", id }); if (!r.ok){ notice(r.why); return; }
    tableChange(()=>{}, false); notice(`${own().name.trim() || "Unnamed"} is in ${Engine.encounterTitle(e)}.`);
  };
  main.querySelector("[data-cback]").onclick=()=>{
    if (S.backEnc && encList().some(e=>e.id===S.backEnc)){
      S.encOpen=S.backEnc; S.backEnc=null; S.castOpen=null; S.tsection="encounters"; window.scrollTo(0,0); update();
      focus(attrSel("data-eopencast", id)) || focus("[data-enext]"); return;
    }
    S.backEnc=null;
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
    ${bits ? `<div class="roster-meta cast-meta">${bits}</div>` : ""}</li>`;
}
function threatGroupCardHtml({ pack, group, members }, multi){
  const key=esc(entryKey(pack.meta.id, group.id)), o=group.origin && pack.origins.find(x=>x.id===group.origin);
  const bits=[ group.ref, o && o.name, members.map(m=>`${m.count}× ${m.entry.name.trim() || "Unnamed"}`).join(" · "), multi ? packName(pack) : "" ].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card cast-card" data-tcard="${key}">
    <button class="cast-open" data-tgroup="${key}">${esc(group.name.trim() || "Unnamed")}</button>
    <div class="roster-meta cast-meta">${bits}</div></li>`;
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
    <p><button class="btn primary" data-tuse>Add to cast</button>${encAddBtnHtml("data-tenc", encTarget())}</p>
    ${threatText("Description", e.description)}${threatText("What they want", e.motivation)}${threatText("What they've got", e.resources)}
    ${threatText("Their line", e.line)}${threatText("If pushed", e.ifPushed)}
    ${readBlockHtml(e.block)}
    ${threatText("GM note", e.gmNote)}`;
}
function groupPageHtml({ pack, group:g, members }){
  const o=g.origin && pack.origins.find(x=>x.id===g.origin);
  const meta=[ g.ref.trim() && esc(g.ref), o && packChipHtml(pack, "origins", o), packsMemo.length>1 && esc(packName(pack)) ].filter(Boolean).join(" · ");
  return `<p><button class="btn sm" data-tback="group">Back to threats</button>${encAddBtnHtml("data-tgrpenc", encTarget())}</p>
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
  if (encBtn) encBtn.onclick=()=>{
    const e=encTarget(), found=Engine.packEntry(packsMemo, entry.pack, entry.id); if (!e) return; if (!found){ notice("No such entry."); return; }
    const r=Engine.participantFromEntry(S.table, e.id, found.pack, entry.id); if (!r.ok){ notice(r.why); return; }
    tableChange(()=>{}, false);
    const row=Engine.encounterView(S.table, e.id, packsMemo).rows.find(x=>x.row.id===r.id);
    notice(`${row ? row.name : "They"} is in ${Engine.encounterTitle(e)}.`);
  };
  if (grpBtn) grpBtn.onclick=()=>{
    const e=encTarget(), hit=group && Engine.packGroups(packsMemo, {}).find(x=>x.pack.meta.id===group.pack && x.group.id===group.id); if (!e || !hit) return;
    const r=Engine.participantsFromGroup(S.table, e.id, hit.pack, group.id); if (!r.ok){ notice(r.why); return; }
    tableChange(()=>{}, false);
    notice(`${hit.group.name.trim() || "Unnamed"}: ${r.ids.length} added to ${Engine.encounterTitle(e)}.`);
  };
  const use=main.querySelector("[data-tuse]");
  if (use) use.onclick=()=>{
    const found=Engine.packEntry(packsMemo, entry.pack, entry.id); if (!found){ notice("No such entry."); return; }
    const r=Engine.castFromEntry(S.table, found.pack, entry.id); if (!r.ok){ notice(r.why); return; }
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
// moves to Threats or Cast, which name it on their Add buttons), S.encPick and S.encQ (the cast
// picker), S.encDmg (a Take or Heal field open on a row), S.encHit (the Hit panel open on a row, with
// its fields and answers), S.encCond (the Add a Condition draft), S.encMore (rows whose More is open)
// and S.encReset (the numbers and Keeps typed at a Reset). One of Take, Hit and the Condition form is
// open at a time.
// A rule the sheet names is a tap away, through the same tip (139): a Condition's, and a Pain Level's.
TIPS.condition = id => { const d=Engine.conditionById(id); return d && { title:d.name, text:d.effect, more:[d.recovery].filter(Boolean) }; };
// A trait's text on the active row (Decision 192): keyed row id | index in the block.
TIPS.enctrait = key => { const [row, i]=String(key).split("|"), e=encOpenNow(), v=e && Engine.encounterView(S.table, e.id, packsMemo).rows.find(x=>x.row.id===row),
  k=v && v.traits.find(x=>String(x.index)===i); return k && { title:k.name.trim() || "Trait", text:k.text }; };
TIPS.painlevel = lv => { const p=D.resources.healthLevels.painLevels.find(x=>String(x.level)===String(lv)); return p && { title:p.label, text:p.description }; };
const encList = () => Array.isArray(S.table.encounters) ? S.table.encounters : [];
function encOpenNow(){
  const e=S.encOpen && encList().find(x=>x.id===S.encOpen);
  if (!e) S.encOpen=null;
  return e || null;
}
// The encounter an Add to button puts a row in: the one open on the tab, until it ends.
const encTarget = () => { const e=encOpenNow(); return e && e.status!=="ended" ? e : null; };
const encAddBtnHtml = (attr, e) => e ? ` <button class="btn" ${attr}>Add to ${esc(Engine.encounterTitle(e))}</button>` : "";
// Where Back goes from a member's page the encounter sent the GM to.
const encBackTitle = () => { const e=S.backEnc && encList().find(x=>x.id===S.backEnc); return e ? Engine.encounterTitle(e) : ""; };
const encRounds = n => `${n} round${n===1?"":"s"}`;
const encCount = n => n ? `${n} in it` : "Nobody yet";

function encListHtml(t){
  const all=encList(), by=s=>all.filter(e=>e.status===s);
  const day = e => { const d=Date.parse(e.updated || e.created); return Number.isFinite(d) ? new Date(d).toLocaleDateString() : ""; };
  const card = (e, meta) => `<li class="roster-card cast-card" data-ecard="${esc(e.id)}">
    <button class="cast-open" data-enc-open="${esc(e.id)}">${esc(Engine.encounterTitle(e))}</button>
    <div class="roster-meta cast-meta">${esc(meta)}</div></li>`;
  const sect = (h, items) => items.length ? `<h2 class="cast-h">${h}</h2><ul class="roster-list">${items.join("")}</ul>` : "";
  return `<div class="cast-add">
      <label class="field"><span>Name</span><input type="text" data-enc-name placeholder="Warehouse job (optional)" autocomplete="off"></label>
      <button class="btn primary" data-enc-new>New encounter</button></div>
    ${all.length ? "" : `<p class="step-note">Nothing on the books.</p>`}
    ${sect("Running", by("running").map(e=>card(e, `Round ${e.round} · ${encCount(e.rows.length)}`)))}
    ${sect("Planned", by("planned").map(e=>card(e, encCount(e.rows.length))))}
    ${sect("Past encounters", by("ended").map(e=>card(e, [e.round ? encRounds(e.round) : "Not run", day(e)].filter(Boolean).join(" · "))))}`;
}

// ── A row ──
function encHealthHtml(v){
  const h=v.health, bits=[];
  if (h.total!==null) bits.push(h.down ? `<b class="enc-down">Down</b>` : `HP ${h.left} / ${h.total}`);
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
       ${!pc && res.armor && res.armor.piece && res.armor.scrapped && D.armorRules.flagged && D.armorRules.playerNote ? `<p class="enc-armor enc-armor-extra">${esc(D.armorRules.playerNote)}</p>` : ""}
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
function encRowHtml(v, e){
  const r=v.row, id=esc(r.id), ended=e.status==="ended", running=e.status==="running", pc=r.kind==="pc";
  const ref = r.kind==="entry" && v.from && v.from.packId ? (()=>{
    const f=Engine.packEntry(packsMemo, v.from.packId, v.from.id), label=(f && f.entry.ref.trim()) || v.from.name.trim() || "Codex";
    return v.from.here ? `<button type="button" class="tag" data-eopenentry="${esc(entryKey(v.from.packId, v.from.id))}">${esc(label)}</button>` : `<span class="tag plain">${esc(label)}</span>`; })() : "";
  const name = r.kind==="cast" && !v.gone ? `<button type="button" class="cast-open enc-name" data-eopencast="${esc(r.cast.id)}">${esc(v.name)}</button>`
    : v.gone ? `<s class="enc-name">${esc(v.name)}</s><span class="vh">, removed</span>` : `<b class="enc-name">${esc(v.name)}</b>`;
  const mark = pc ? `<span class="tag plain">PC</span>` : r.kind==="cast" ? `<span class="tag plain">Cast</span>` : ref;
  const num = (attr, val, label) => ended ? `${esc(label)} ${val===null ? "—" : esc(val)}`
    : `<label class="enc-num"><span>${esc(label)}</span><input type="number" step="1" inputmode="numeric" ${attr}="${id}" value="${numAttr(val)}"></label>`;
  const aware = pc ? num("data-eaware", v.awareness, "Awareness") : v.awareness!==null ? `<span class="enc-num">Awareness ${esc(v.awareness)}</span>` : "";
  const acts = ended ? "" : `<div class="enc-acts">
      <button class="btn sm" data-edmg="${id}|1">Take</button>${v.canHit ? `<button class="btn sm" data-ehit="${id}">Hit</button>` : ""}<button class="btn sm" data-edmg="${id}|-1">Heal</button>
      <button class="btn sm" data-econdopen="${id}">Add a Condition</button>
      <details class="enc-more" data-emore="${id}"${S.encMore && S.encMore[r.id] ? " open" : ""}><summary>More</summary>
        ${r.kind==="cast" ? "" : `<label class="field"><span>Name</span><input type="text" data-ename="${id}" value="${esc(r.name)}" autocomplete="off"></label>`}
        <div class="form-toggle" role="group" aria-label="${esc(v.name)}">
          <button type="button" data-elast="${id}" class="${r.last?"on":""}" aria-pressed="${r.last}">Goes last</button>
          <button type="button" data-eout="${id}" class="${r.out?"on":""}" aria-pressed="${r.out}">Out</button></div>
        <button class="btn sm danger" data-erm="${id}">Remove</button></details></div>
    ${S.encDmg && S.encDmg.row===r.id ? `<form class="enc-dmg" data-edmgform="${id}">
        <input type="number" min="0" step="1" inputmode="numeric" data-edmgn aria-label="${S.encDmg.sign>0?"HP taken":"HP healed"}">
        <button class="btn sm primary" type="submit">OK</button><button class="btn sm" type="button" data-edmgcancel>Cancel</button></form>` : ""}
    ${S.encHit && S.encHit.row===r.id && v.canHit ? encHitHtml(v) : ""}
    ${S.encCond && S.encCond.row===r.id ? encCondFormHtml(v) : ""}`;
  const pcFields = pc && !ended ? `<div class="enc-pcnums">${num("data-ehp", r.hp, "HP")}${num("data-elevels", r.levels, "Health Levels")}</div>` : "";
  return `<li class="enc-row${v.active?" active":""}${r.out?" out":""}" data-erow="${id}" tabindex="-1"${v.active ? ` aria-current="step"` : ""}>
    <div class="enc-head"${running && !r.out ? ` data-eturn="${id}"` : ""}>${name} ${mark}${r.out ? ` <span class="tag plain">Out</span>` : ""}${v.acted ? ` <span class="tag plain">Done</span>` : ""}${r.last ? ` <span class="tag plain">Goes last</span>` : ""}
      ${num("data-eorder", r.order, "Combat Sense")}${v.ties ? `<span class="tag enc-tied">Tied: reroll</span>` : ""}${aware ? ` ${aware}` : ""}</div>
    ${encHealthHtml(v)}${encArmorHtml(v)}${pcFields}${encTraitsHtml(v, running)}
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
    if (!x.ticks.length && !x.expiring.length && !x.recovery.length && !x.dying){ quiet.push(x.name.trim() || "Unnamed"); return ""; }
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
    const dyingWords = x.dying ? esc(x.dying) : `${esc(x.dyingText)} ${x.dyingMarks} source${x.dyingMarks===1 ? "" : "s"} ticked.`;
    const dying = x.dying || x.dyingMarks ? `<li><b>Dying:</b> ${dyingWords}${dc && dc.counter ? ` <span class="enc-marks">${esc(dc.counter.label)} ${dc.marks}/${dc.counter.max}
        <button class="btn sm" data-emarks="${id}|${dc.index}|-1" aria-label="Fewer ${esc(dc.counter.label)}">−</button><button class="btn sm" data-emarks="${id}|${dc.index}|1" aria-label="More ${esc(dc.counter.label)}">+</button></span>` : ""}</li>` : "";
    return `<section class="enc-reset-row"><h3 class="cast-h">${esc(x.name.trim() || "Unnamed")}</h3>
      ${ticks || dying ? `<ul class="enc-list">${ticks}${dying}</ul>` : ""}
      ${out ? `<p class="cast-sub">Runs out now</p><ul class="enc-list">${out}</ul>` : ""}
      ${saves ? `<p class="cast-sub">Calls for a check</p><ul class="enc-list">${saves}</ul>` : ""}</section>`;
  }).join("");
  return `<section class="enc-reset" aria-labelledby="enc-reset-h"><h2 class="cast-h" id="enc-reset-h" tabindex="-1">Reset: round ${e.round} ends</h2>
    ${body}${quiet.length ? `<p class="step-note">Nothing on: ${esc(quiet.join(", "))}.</p>` : ""}
    <p><button class="btn primary" data-efinish${res.ok ? "" : " disabled"}>Finish the round</button></p>
    ${res.ok ? "" : `<p class="step-note">${esc(res.why)}</p>`}</section>`;
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
function encAddHtml(e){
  return `<section class="enc-add"><h2 class="cast-h">Add</h2>
    <p><button class="btn" data-enc-pick aria-expanded="${!!S.encPick}">From the cast</button></p>
    ${S.encPick ? `<label class="field"><span>Search the cast</span><input type="search" data-enc-q value="${esc(S.encQ||"")}" autocomplete="off"></label>${encPickHtml(e)}` : ""}
    <div class="cast-add"><label class="field"><span>PC name</span><input type="text" data-enc-pcname placeholder="Who's at the table?" autocomplete="off"></label>
      <button class="btn" data-enc-addpc>Add a PC</button></div>
    <p class="step-note">From the Codex: open an entry or a group on Threats.</p></section>`;
}
function encPageHtml(e){
  const v=Engine.encounterView(S.table, e.id, packsMemo), title=v.title, ended=e.status==="ended", running=e.status==="running";
  const status = running ? `Round ${e.round}` : ended ? (e.round ? `Ended · ${encRounds(e.round)}` : "Ended · not run") : "Planned";
  const bar = `<div class="enc-bar"><b class="enc-status">${esc(status)}</b>
    ${e.status==="planned" ? `<button class="btn primary" data-enc-start>Start</button><button class="btn" data-enc-end>End</button>` : ""}
    ${running ? `${v.atReset ? "" : `<button class="btn primary" data-enext>Next</button>`}<button class="btn" data-enc-end>End the encounter</button>` : ""}</div>`;
  const rows = v.rows.length ? `<ul class="enc-rows">${v.rows.map(r=>encRowHtml(r, e)).join("")}</ul>` : `<p class="step-note">Nobody in it yet.</p>`;
  return `<p><button class="btn sm" data-enc-back>Back to encounters</button></p>
    ${ended ? `<h1 class="step-title tbl-title cast-title" data-enc-h tabindex="-1">${esc(title)}</h1>`
      : `<label class="field"><span>Name</span><input type="text" data-enc-title value="${esc(e.name)}" placeholder="${esc(title)}" autocomplete="off"></label>`}
    ${bar}
    ${v.atReset ? encResetHtml(e, v) : rows}
    ${ended || v.atReset ? "" : encAddHtml(e)}
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
  const open = id => {
    S.encOpen=id; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; S.encPick=false; S.encQ="";
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
  const next = () => { const r=Engine.nextTurn(S.table, eid()); if (!r.ok){ notice(r.why); return; } tableChange(()=>{});
    if (r.reset) focus("[data-esrc]") || focus("[data-efinish]"); else { focus("[data-enext]"); toActive(); } };
  const pickNextAdd = id => { const ids=[...$("main").querySelectorAll("[data-enc-addcast]")].map(b=>b.dataset.encAddcast); const at=ids.indexOf(id); return ids[at+1] || ids[at-1] || null; };
  // The preview and prompts redraw on their own, so a field keeps its value and its caret.
  const hitLive = () => { const box=main.querySelector("[data-ehit-live]"), r=encHitRow(); if (box && r) box.outerHTML=encHitLiveHtml(S.encHit, r); };
  const act = {
    "data-enc-new": () => { const input=main.querySelector("[data-enc-name]"); let id; change(()=>{ id=Engine.addEncounter(S.table, { name:input.value }).id; }); open(id); },
    "data-enc-open": b => open(b.dataset.encOpen),
    "data-enc-back": () => { const id=S.encOpen; S.encOpen=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; window.scrollTo(0,0); redraw(); focus(attrSel("data-enc-open", id)) || focus("[data-enc-new]"); },
    "data-enc-start": () => { const r=Engine.startEncounter(S.table, eid()); if (!r.ok){ notice(r.why); return; } S.encReset=null; tableChange(()=>{}); focus("[data-enext]"); toActive(); },
    "data-enc-end": () => { const e=encOpenNow(), t=Engine.encounterTitle(e);
      askFirst({ title:`End ${t}?`, text:"It's kept, read-only, under Past encounters.", yes:"End it", danger:false, then(){
        const id=eid(); S.encOpen=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; change(()=>Engine.endEncounter(S.table, id)); focus("[data-enc-new]"); } }); },
    "data-enc-del": () => { const e=encOpenNow(), t=Engine.encounterTitle(e);
      askFirst({ title:`Delete ${t}?`, text:"It isn't kept anywhere else unless you've exported the table.", yes:"Delete", then(){
        const id=eid(); S.encOpen=null; S.encReset=null; S.encDmg=null; S.encHit=null; S.encCond=null; change(()=>Engine.removeEncounter(S.table, id)); focus("[data-enc-new]"); } }); },
    "data-enext": next,
    "data-enc-pick": () => { S.encPick=!S.encPick; redraw(); if (S.encPick) focus("[data-enc-q]"); else focus("[data-enc-pick]"); },
    "data-enc-addcast": b => { const id=b.dataset.encAddcast, after=pickNextAdd(id), r=Engine.addParticipant(S.table, eid(), { kind:"cast", id });
      if (!r.ok){ notice(r.why); return; } tableChange(()=>{}); focus(after ? attrSel("data-enc-addcast", after) : "[data-enc-q]"); },
    "data-enc-addpc": () => addPc(),
    "data-eopencast": b => { const id=b.dataset.eopencast; if (!S.table.cast.some(n=>n.id===id)) return;
      S.tsection="cast"; S.castOpen=id; S.castFrom=null; S.intAdd=null; S.backEnc=eid(); S.castView="cast"; window.scrollTo(0,0); update(); focus("[data-cback]"); },
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
      const a=Engine.applyEncounterHit(S.table, eid(), row, encHitInput(d), choices);
      if (!a.ok){ d.err=a.why; hitLive(); focus("[data-ehit-apply]"); return; }
      S.encHit=null; tableChange(()=>{}); focus(attrSel("data-ehit", row)); },
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
      const r=Engine.applyEncounterReset(S.table, eid(), encResetInput(), { keep }); if (!r.ok){ notice(r.why); return; }
      S.encReset=null; tableChange(()=>{}); focus("[data-enext]"); toActive(); },
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
    if ("eorder" in d) row("eorder", v=>({ order:v })); else if ("ehp" in d) row("ehp", v=>({ hp:v }));
    else if ("elevels" in d) row("elevels", v=>({ levels:v })); else if ("eaware" in d) row("eaware", v=>({ awareness:v }));
    else if ("ename" in d) { edit(d.ename, { name:el.value }); focus(attrSel("data-ename", d.ename)); }
    else if ("econdId" in d){ S.encCond.id=el.value; S.encCond.loc=""; S.encCond.err=""; redraw(); focus("[data-econd-id]"); }
    else if ("econdLoc" in d) S.encCond.loc=el.value;
    else if ("ehitType" in d){ S.encHit.type=el.value; S.encHit.conds={}; S.encHit.err=""; hitLive(); }
    else if ("ehitLoc" in d){ S.encHit.loc=el.value; S.encHit.err=""; hitLive(); }
    else if ("ehitCond" in d){ S.encHit.conds[d.ehitCond]=el.checked; }
  };
  main.oninput = ev => {
    const el=ev.target, d=el.dataset;
    if ("encTitle" in d) tableChange(()=>Engine.editEncounter(S.table, eid(), { name:el.value }), false);
    else if ("econdSrc" in d) S.encCond.source=el.value;
    else if ("econdRounds" in d) S.encCond.rounds=el.value;
    else if ("ehitDamage" in d){ S.encHit.damage=el.value; S.encHit.err=""; hitLive(); }
    else if ("ehitFrom" in d){ S.encHit.from=el.value; hitLive(); }
    else if ("encQ" in d){ S.encQ=el.value; const box=main.querySelector("[data-encpicklist]"); if (box) box.outerHTML=encPickHtml(encOpenNow()); }
    else if ("esrc" in d){
      const [row, i]=d.esrc.split("|"), st=encResetNow(); (st.sources[row]||(st.sources[row]={}))[i]=el.value;
      const fin=main.querySelector("[data-efinish]"), res=Engine.resolveEncounterReset(S.table, eid(), encResetInput());
      if (fin) fin.disabled=!res.ok;
    }
  };
  main.onsubmit = ev => {
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
  // A More that was opened stays open through a redraw.
  main.querySelectorAll("[data-emore]").forEach(d=>d.ontoggle=()=>{ S.encMore=Object.assign(S.encMore||{}, { [d.dataset.emore]:d.open }); });
}
