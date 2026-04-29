const CAT_URL = '../flutter_app_restored/assets/traducciones/sword_translations.json';
const ROOTS = ['../flutter_app_restored/assets/traducciones_sword', '../flutter_app_restored/assets/traducciones'];
const DEMO = [
  { folder: 'demo-rvr60', abbr: 'RVR60', name: 'Reina Valera 1960', family: 'Reina Valera', root: '__demo__' },
  { folder: 'demo-nvi', abbr: 'NVI', name: 'Nueva Version Internacional', family: 'Otras', root: '__demo__' },
];
const DEMO_TEXT = {
  'demo-rvr60': 'Mateo 1:1 (demo)\nLibro de la genealogia de Jesucristo, hijo de David, hijo de Abraham.',
  'demo-nvi': 'Mateo 1:1 (demo)\nEsta es la genealogia de Jesus el Mesias, hijo de David, hijo de Abraham.'
};
const el = (id) => document.getElementById(id);
const state = { versions: [], notes: JSON.parse(localStorage.getItem('bva_notes') || '[]') };
function familyOf(s){s=(s||'').toLowerCase();if(s.includes('reina valera')||s.includes('rv')) return 'Reina Valera';if(s.includes('textual')||s.includes('btx')) return 'Textual';if(s.includes('latinoamericana')) return 'Latinoamericana';if(s.includes('dios habla hoy')||s.includes('dhh')) return 'Dios Habla Hoy';return 'Otras';}
async function exists(url){try{const r=await fetch(url,{method:'HEAD'});return r.ok;}catch{return false;}}
async function resolveVersion(v){for(const root of ROOTS){const probe=`${root}/${v.folder}/40/1.txt`;if(await exists(probe)) return {...v,root};}return null;}
async function loadVerse(v,b,c,n){if(v.root==='__demo__') return DEMO_TEXT[v.folder]||'Sin demo';const paths=[`${v.root}/${v.folder}/${b}/${c}.txt`,`${v.root}/${v.folder}/${b}/${n}.txt`];for(const p of paths){try{const r=await fetch(p);if(!r.ok) continue;return (await r.text()).trim();}catch{}}throw new Error('No se encontro texto para esa referencia.');}
function fillSelect(id,arr){const s=el(id);s.innerHTML='';arr.forEach(v=>{const o=document.createElement('option');o.value=v.folder;o.textContent=`${v.family} · ${v.abbr} - ${v.name}`;s.appendChild(o);});}
function renderNotes(){const box=el('notes');box.innerHTML='';state.notes.slice().reverse().forEach((n)=>{const d=document.createElement('div');d.style.borderBottom='1px solid #eee';d.style.padding='6px 0';d.innerHTML=`<div>${n.text}</div><div class='muted'>${n.when}</div>`;box.appendChild(d);});}
async function init(){const status=el('status');try{const cat=await fetch(CAT_URL).then(r=>{if(!r.ok) throw new Error('catalogo no disponible');return r.json();});const raw=(cat.translations||[]).map(v=>({...v,family:familyOf(v.name||'')}));const resolved=[];for(const v of raw){const ok=await resolveVersion(v);if(ok) resolved.push(ok);}state.versions=resolved.sort((a,b)=>a.family.localeCompare(b.family)||a.name.localeCompare(b.name));if(!state.versions.length) throw new Error('sin versiones locales visibles');status.textContent=`Listo: ${state.versions.length} versiones cargables.`;}catch{state.versions=DEMO;status.textContent='Modo demo activo. Para datos completos, ejecuta junto a flutter_app_restored/assets.';}fillSelect('readerVersion',state.versions);fillSelect('cmpA',state.versions);fillSelect('cmpB',state.versions);renderNotes();}
el('loadReader').onclick=async()=>{const f=el('readerVersion').value;const v=state.versions.find(x=>x.folder===f);const b=el('book').value,c=el('chapter').value,n=el('verse').value;try{const t=await loadVerse(v,b,c,n);el('readerOut').textContent=t;el('readerMeta').textContent=`${v.abbr} · ${b}:${c}:${n}`;}catch(e){el('readerOut').textContent=e.message;}};
el('loadCompare').onclick=async()=>{const a=state.versions.find(x=>x.folder===el('cmpA').value);const b=state.versions.find(x=>x.folder===el('cmpB').value);const bk=el('book').value,cp=el('chapter').value,vs=el('verse').value;try{el('cmpAOut').textContent=await loadVerse(a,bk,cp,vs);}catch(e){el('cmpAOut').textContent=e.message;}try{el('cmpBOut').textContent=await loadVerse(b,bk,cp,vs);}catch(e){el('cmpBOut').textContent=e.message;}};
el('addNote').onclick=()=>{const txt=el('noteText').value.trim();if(!txt) return;state.notes.push({text:txt,when:new Date().toISOString()});localStorage.setItem('bva_notes',JSON.stringify(state.notes));el('noteText').value='';renderNotes();};
el('exportNotes').onclick=()=>{const blob=new Blob([JSON.stringify(state.notes,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='biblia-va-cambios.json';a.click();};
init().catch(e=>{el('status').textContent='Error inicializando: '+e.message;});
