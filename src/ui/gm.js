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
const TABLE_SECTIONS = [{ id:"cast", label:"Cast", ui:"tab_archetype" }, { id:"notes", label:"Notes", ui:"tab_notes" }];
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
  nav.querySelectorAll("[data-tsec]").forEach(b=>b.onclick=()=>{ S.tsection=b.dataset.tsec; if (S.tsection==="cast") S.castOpen=null; window.scrollTo(0,0); update(); });
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
  const onPage = S.tsection==="cast" && castOpenMember();
  const head = onPage ? "" :
    `<h1 class="step-title tbl-title">${esc(tableName(t))}</h1>
    <p class="step-note">Table${Number.isFinite(made)?` · created ${esc(new Date(made).toLocaleDateString())}`:""}</p>`;
  const body = S.tsection==="cast" ? (onPage ? castPageHtml(onPage) : castTabHtml(t)) : notesTabHtml(t);
  // A redraw a press causes keeps the keyboard's place (Decision 164).
  keepPlace(main, ()=>{ main.innerHTML = failed + head + body; bindTable(); }, ["[data-cadd-name]", "[data-tnew]"]);
}
function bindTable(){
  const main=$("main");
  if (main.querySelector("[data-tnew]")) bindNotes(main);
  else if (S.tsection==="cast") bindCast(main);
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
const intAdd = () => S.intAdd || (S.intAdd={ kind:null, crew:"", date:localDay() });
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
  return r.gone ? `<s aria-label="${esc(r.name)}, removed">${esc(r.name)}</s>`
    : `<button class="cast-open int-who" data-copen="${esc(link.id)}" data-cwhere="${esc(where)}">${esc(r.name)}</button>`;
}
// Who knows what (Decision 179): the same records, by crew name.
function crewViewHtml(t){
  const groups=Engine.crewView(t, { q:S.castQ||"" });
  if (!groups.length) return S.castQ && String(S.castQ).trim() ? `<p class="step-note">No one matches.</p>` : `<p class="step-note">Nothing between the crew and anyone yet.</p>`;
  return groups.map((g,gi)=>`<section class="crew-group"><h2 class="cast-h crew-name">${esc(g.name)}</h2><ul class="int-list">${g.interactions.map(x=>{
    const who=(x.cast||[]).map((l,li)=>linkNameHtml(t, l, `${gi}|${x.id}|${li}`)).join(", ");
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
const castText = (n, key, label, ph, area) => `<label class="field"><span>${esc(label)}</span>${area
  ? `<textarea data-cf="${key}" placeholder="${esc(ph||"")}">${esc(n[key])}</textarea>`
  : `<input type="text" data-cf="${key}" value="${esc(n[key])}" placeholder="${esc(ph||"")}" autocomplete="off">`}</label>`;
function castStatBlockHtml(n){
  const b=n.block || {}, st=b.stats||{}, au=b.authored||{};
  const num = (attr, v, label) => `<input type="number" step="1" inputmode="numeric" ${attr} value="${numAttr(v)}" aria-label="${esc(label)}">`;
  const stats = D.stats.map(s=>`<div class="cast-stat"><span class="cast-stat-id">${esc(s.id)}</span>${num(`data-cstat="${esc(s.id)}"`, st[s.id], s.name||s.id)}<span class="cast-fig" data-cbonus="${esc(s.id)}"></span></div>`).join("");
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
    <div class="cast-stats">${stats}${authored}</div>
    <div class="cast-lines"><span class="cast-sub">Skills</span>${skills}<button class="btn sm" data-cskadd>Add a skill</button></div>
    ${lines("armor","Armor")}${lines("gear","Gear")}
    <div class="cast-lines"><span class="cast-sub">Traits</span>${traits}<button class="btn sm" data-ctadd>Add a trait</button></div>`;
}
// What passed between this member and the crew (Decisions 177–179).
function interactionRowHtml(x){
  const id=esc(x.id);
  return `<li class="int-row" data-int="${id}">
    ${kindToggleHtml("data-ikind", x.kind, "What kind", x.id+"|")}
    <div class="int-fields">
      <input type="text" data-icrew="${id}" list="crew-names" value="${esc(x.crew.join(", "))}" placeholder="Crew" aria-label="Crew" autocomplete="off">
      <input type="date" data-idate="${id}" value="${esc(x.date||"")}" aria-label="When">
      <input type="text" data-itext="${id}" value="${esc(x.text)}" placeholder="What passed between them" aria-label="What" autocomplete="off">
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
        <label class="field"><span>What</span><input type="text" data-iwhat placeholder="What passed between them" autocomplete="off"></label>
        <button class="btn primary" data-iadd>Add</button></div></div>
    <ul class="int-list" data-intlist>${rows.map(interactionRowHtml).join("")}</ul>`;
}
function castPageHtml(n){
  return `<p><button class="btn sm" data-cback>Back to the cast</button></p>
    <h1 class="step-title tbl-title cast-title" data-ctitle>${esc(n.name.trim() || "Unnamed")}</h1>
    ${castText(n,"name","Name","Who did they meet?")}
    ${castText(n,"flavor","Who they are","One line: who they are")}
    ${castText(n,"description","Description","What you'd see.",true)}
    <div class="cast-codex">
      ${castText(n,"origin","Origin")}
      <label class="field"><span>NPC roles</span><input type="text" data-cf="npcRoles" value="${esc(n.npcRoles.join(" / "))}" placeholder="Separate with / or ," autocomplete="off"></label>
      ${castText(n,"enemyRole","Enemy role")}
      <label class="field"><span>Tier</span><input type="number" step="1" min="1" inputmode="numeric" data-cf="tier" value="${numAttr(n.tier)}"></label>
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
  const open = (id, from) => { S.castOpen=id; S.castFrom=from||null; S.intAdd=null; window.scrollTo(0,0); update(); const el=$("main").querySelector("[data-cback]"); if (el) el.focus(); };
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
  const add=()=>{
    const text=whatEl.value;
    if (!a.kind && !text.trim()) return;
    let r; tableChange(()=>{ r=Engine.addInteraction(S.table, { kind:a.kind, cast:[id], crew:splitList(a.crew, /,/), text, date:a.date }); }, false);
    if (!r.ok) return;
    if (a.kind==="killed") a.kind=null;
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
      if (key==="name"){ const h=main.querySelector("[data-ctitle]"); if (h) h.textContent=el.value.trim() || "Unnamed"; }
    };
    el.addEventListener("input", fn); el.addEventListener("change", fn);
    // On blur a list shows what was stored: trimmed, empties dropped.
    if (key==="affiliations") el.addEventListener("change", ()=>{ el.value=own().affiliations.join(" / "); });
  });
  bindInteractions(main, n);
  // A change to the block: `redraw` for a row added or removed, else the
  // fields keep their place and only the figures beside them are rewritten.
  const block = (fn, redraw) => tableChange(()=>{
    const cur=own(), b=cur.block ? JSON.parse(JSON.stringify(cur.block)) : { stats:{}, authored:{}, skills:[], armor:[], gear:[], traits:[] };
    fn(b); Engine.setCastBlock(S.table, id, b);
  }, redraw);
  const typed = (sel, fn) => main.querySelectorAll(sel).forEach(el=>el.oninput=()=>{ block(b=>fn(b, el), false); castFigures(main, own()); });
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
  main.querySelector("[data-cback]").onclick=()=>{
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
