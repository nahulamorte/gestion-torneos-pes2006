const LS_ROSTER = 'pes_roster';
const LS_PARTIDOS = 'pes_partidos';
const LS_POOL_PERSONAS = 'pes_pool_personas';
const LS_POOL_EQUIPOS = 'pes_pool_equipos';
const LS_ADMIN = 'pes_admin_on';
const LS_ACTIVE_USER = 'pes_active_user';
const LS_TORNEO_INICIO = 'pes_torneo_inicio';

let roster = [];    // [{id, nombre, equipo}]
let partidos = [];  // [{id, personaAId, personaBId, golesA, golesB, goleadores:[{jugador,personaId,cantidad}], rojas:[{jugador,personaId}]}]
let editandoPartidoId = null; 

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function loadState(){
  roster = JSON.parse(localStorage.getItem(LS_ROSTER) || 'null');
  partidos = JSON.parse(localStorage.getItem(LS_PARTIDOS) || 'null');
  if(roster === null || partidos === null){
    seedData();
  }
  if(!localStorage.getItem(LS_TORNEO_INICIO)){
    localStorage.setItem(LS_TORNEO_INICIO, new Date().toISOString());
  }
  if(!localStorage.getItem(LS_ACTIVE_USER) && roster.length > 0){
    localStorage.setItem(LS_ACTIVE_USER, roster[0].id);
  }
}
function saveRoster(){ localStorage.setItem(LS_ROSTER, JSON.stringify(roster)); }
function savePartidos(){ localStorage.setItem(LS_PARTIDOS, JSON.stringify(partidos)); }


function seedData(){
  roster = [
    {id:'p1', nombre:'Franco', equipo:'Brasil'},
    {id:'p2', nombre:'Nico',   equipo:'Real Madrid'},
    {id:'p3', nombre:'Male',   equipo:'AC Milan'},
    {id:'p4', nombre:'Tobi',   equipo:'Argentina'},
  ];
  partidos = [
    { id:uid(), personaAId:'p1', personaBId:'p2', golesA:3, golesB:1,
      goleadores:[
        {jugador:'Adriano', personaId:'p1', cantidad:2},
        {jugador:'Ronaldinho', personaId:'p1', cantidad:1},
        {jugador:'Raul', personaId:'p2', cantidad:1},
      ],
      rojas:[{jugador:'Zidane', personaId:'p2'}]
    },
    { id:uid(), personaAId:'p3', personaBId:'p4', golesA:2, golesB:2,
      goleadores:[
        {jugador:'Shevchenko', personaId:'p3', cantidad:2},
        {jugador:'Crespo', personaId:'p4', cantidad:1},
        {jugador:'Saviola', personaId:'p4', cantidad:1},
      ],
      rojas:[]
    },
    { id:uid(), personaAId:'p1', personaBId:'p3', golesA:1, golesB:1,
      goleadores:[
        {jugador:'Adriano', personaId:'p1', cantidad:1},
        {jugador:'Shevchenko', personaId:'p3', cantidad:1},
      ],
      rojas:[{jugador:'Cafu', personaId:'p1'}]
    },
    { id:uid(), personaAId:'p2', personaBId:'p4', golesA:0, golesB:2,
      goleadores:[
        {jugador:'Crespo', personaId:'p4', cantidad:2},
      ],
      rojas:[]
    },
  ];
  saveRoster(); savePartidos();
  localStorage.setItem(LS_POOL_PERSONAS, roster.map(r=>r.nombre).join('\n'));
  localStorage.setItem(LS_POOL_EQUIPOS, roster.map(r=>r.equipo).join('\n'));
  // Fecha de inicio de torneo de ejemplo (unos días atrás, para que se note el avance semanal)
  const demoStart = new Date();
  demoStart.setDate(demoStart.getDate() - 9);
  localStorage.setItem(LS_TORNEO_INICIO, demoStart.toISOString());
  localStorage.setItem(LS_ACTIVE_USER, roster[0].id);
}


function personaById(id){ return roster.find(r=>r.id===id); }
function personaNombre(id){ const p = personaById(id); return p ? p.nombre : '(eliminado)'; }
function personaEquipo(id){ const p = personaById(id); return p ? p.equipo : '—'; }
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2200);
}


function showTab(name){
  if(name==='admin' && !isAdmin()){
    openLoginModal();
    return;
  }
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
  ['posiciones','goleadores','rojas','fechas','sorteo','admin'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('hidden', t!==name);
  });
  if(name==='admin'){ renderAdmin(); }
  if(name==='sorteo'){ cargarPoolsEnTextareas(); }
  if(name==='fechas'){ renderFechas(); }
}


const ADMIN_USER = 'admin';
const ADMIN_PASS = 'pes2006';

function isAdmin(){ return localStorage.getItem(LS_ADMIN) === '1'; }

function openLoginModal(){
  if(isAdmin()) return; // ya logueado, no hace falta
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginForm').reset();
  document.getElementById('loginModal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('loginUser').focus(), 50);
}

function closeLoginModal(){
  document.getElementById('loginModal').classList.add('hidden');
}

function submitLogin(evt){
  evt.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if(user === ADMIN_USER && pass === ADMIN_PASS){
    localStorage.setItem(LS_ADMIN, '1');
    closeLoginModal();
    refreshAdminUI();
    showTab('admin');
    showToast('Sesión de administrador iniciada');
  } else {
    document.getElementById('loginError').textContent = 'Usuario o contraseña incorrectos.';
  }
  return false;
}

function logout(){
  localStorage.setItem(LS_ADMIN, '0');
  refreshAdminUI();
  showTab('posiciones');
  showToast('Sesión cerrada');
}

function refreshAdminUI(){
  const on = isAdmin();
  document.getElementById('btnAdminToggle').classList.toggle('hidden', on);
  document.getElementById('btnLogout').classList.toggle('hidden', !on);
  document.getElementById('adminPill').classList.toggle('hidden', !on);
  document.getElementById('tabAdminBtn').classList.toggle('hidden', !on);
  document.getElementById('adminLocked').classList.toggle('hidden', on);
  document.getElementById('adminContent').classList.toggle('hidden', !on);
  if(!on && document.getElementById('tab-admin').classList.contains('hidden')===false){
    showTab('posiciones');
  }
}


function calcularPosiciones(){
  const stats = {};
  roster.forEach(r=>{
    stats[r.id] = {id:r.id, nombre:r.nombre, equipo:r.equipo, pj:0,pg:0,pe:0,pp:0,gf:0,gc:0};
  });
  partidos.forEach(m=>{
    const a = stats[m.personaAId], b = stats[m.personaBId];
    if(!a || !b) return; // persona eliminada del roster
    a.pj++; b.pj++;
    a.gf += m.golesA; a.gc += m.golesB;
    b.gf += m.golesB; b.gc += m.golesA;
    if(m.golesA > m.golesB){ a.pg++; b.pp++; }
    else if(m.golesA < m.golesB){ b.pg++; a.pp++; }
    else { a.pe++; b.pe++; }
  });
  const arr = Object.values(stats).map(s=>({
    ...s, dg: s.gf - s.gc, pts: s.pg*3 + s.pe*1
  }));
  arr.sort((x,y)=> y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.nombre.localeCompare(y.nombre));
  return arr;
}

function calcularGoleadores(){
  const map = {};
  partidos.forEach(m=>{
    m.goleadores.forEach(g=>{
      const key = g.jugador.trim().toLowerCase()+'|'+g.personaId;
      if(!map[key]) map[key] = {jugador:g.jugador.trim(), personaId:g.personaId, goles:0};
      map[key].goles += (g.cantidad || 0);
    });
  });
  const arr = Object.values(map);
  arr.sort((a,b)=> b.goles - a.goles || a.jugador.localeCompare(b.jugador));
  return arr;
}

function calcularRojas(){
  const map = {};
  partidos.forEach(m=>{
    m.rojas.forEach(r=>{
      const key = r.jugador.trim().toLowerCase()+'|'+r.personaId;
      if(!map[key]) map[key] = {jugador:r.jugador.trim(), personaId:r.personaId, cant:0};
      map[key].cant += 1;
    });
  });
  const arr = Object.values(map);
  arr.sort((a,b)=> b.cant - a.cant || a.jugador.localeCompare(b.jugador));
  return arr;
}


function renderPosiciones(){
  const data = calcularPosiciones();
  const tbody = document.getElementById('posicionesBody');
  document.getElementById('posCount').textContent = data.length + ' participantes';
  if(data.length===0){
    tbody.innerHTML = `<tr><td colspan="11" class="empty-note">Todavía no hay personas cargadas. Andá a la pestaña Sorteo para armar el plantel.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((r,i)=>`
    <tr class="pos-${i+1}">
      <td class="pos-cell"><span class="pos-badge">${i+1}</span></td>
      <td class="left" data-label="Persona">${escapeHtml(r.nombre)}</td>
      <td class="left team-cell" data-label="Equipo">${escapeHtml(r.equipo)}</td>
      <td class="pts-cell" data-label="PTS">${r.pts}</td>
      <td data-label="PJ">${r.pj}</td><td data-label="PG">${r.pg}</td><td data-label="PE">${r.pe}</td><td data-label="PP">${r.pp}</td>
      <td data-label="GF">${r.gf}</td><td data-label="GC">${r.gc}</td><td data-label="DG">${r.dg>0?'+':''}${r.dg}</td>
    </tr>
  `).join('');
}


function renderGoleadores(){
  const data = calcularGoleadores();
  const tbody = document.getElementById('goleadoresBody');
  document.getElementById('golCount').textContent = data.length + ' goleadores';
  if(data.length===0){
    tbody.innerHTML = `<tr><td colspan="5" class="empty-note">Todavía no hay goles cargados.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((g,i)=>`
    <tr>
      <td class="pos-cell"><span class="pos-badge">${i+1}</span></td>
      <td class="left" data-label="Jugador Virtual">${escapeHtml(g.jugador)}</td>
      <td class="left" data-label="Persona">${escapeHtml(personaNombre(g.personaId))}</td>
      <td class="left team-cell" data-label="Equipo">${escapeHtml(personaEquipo(g.personaId))}</td>
      <td class="pts-cell" data-label="Goles">${g.goles}</td>
    </tr>
  `).join('');
}

function renderRojas(){
  const data = calcularRojas();
  const tbody = document.getElementById('rojasBody');
  document.getElementById('rojCount').textContent = data.length + ' jugadores expulsados';
  if(data.length===0){
    tbody.innerHTML = `<tr><td colspan="5" class="empty-note">Todavía no hay tarjetas rojas cargadas.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((g,i)=>`
    <tr>
      <td class="pos-cell"><span class="pos-badge">${i+1}</span></td>
      <td class="left" data-label="Jugador Virtual">${escapeHtml(g.jugador)}</td>
      <td class="left" data-label="Persona">${escapeHtml(personaNombre(g.personaId))}</td>
      <td class="left team-cell" data-label="Equipo">${escapeHtml(personaEquipo(g.personaId))}</td>
      <td class="pts-cell" style="color:#e08484;" data-label="Expulsiones">${g.cant}</td>
    </tr>
  `).join('');
}



function getMonday(d){
  const date = new Date(d);
  date.setHours(0,0,0,0);
  const day = date.getDay(); // 0=domingo ... 6=sábado
  const diff = (day === 0) ? -6 : (1 - day);
  date.setDate(date.getDate() + diff);
  return date;
}

function rivalesOrdenPersona(personaId){
  return roster.filter(r => r.id !== personaId);
}

function semanasDePersona(personaId){
  const rivales = rivalesOrdenPersona(personaId);
  const semanas = [];
  for(let i = 0; i < rivales.length; i += 2){
    semanas.push(rivales.slice(i, i+2));
  }
  return semanas;
}

function semanaActualIndex(){
  const inicioStr = localStorage.getItem(LS_TORNEO_INICIO);
  if(!inicioStr) return 0;
  const inicioMonday = getMonday(new Date(inicioStr));
  const hoyMonday = getMonday(new Date());
  const diffSemanas = Math.round((hoyMonday - inicioMonday) / (7*24*60*60*1000));
  return Math.max(0, diffSemanas);
}

function yaJugaron(idA, idB){
  return partidos.some(m =>
    (m.personaAId === idA && m.personaBId === idB) ||
    (m.personaAId === idB && m.personaBId === idA)
  );
}

function poblarActiveUserSelect(){
  const sel = document.getElementById('activeUserSelect');
  const prevGuardado = localStorage.getItem(LS_ACTIVE_USER);
  const prev = (prevGuardado && roster.some(r=>r.id===prevGuardado)) ? prevGuardado : (roster[0] ? roster[0].id : '');
  if(roster.length === 0){
    sel.innerHTML = `<option value="">— sin participantes —</option>`;
    localStorage.setItem(LS_ACTIVE_USER, '');
    return '';
  }
  sel.innerHTML = roster.map(r => `<option value="${r.id}">${escapeHtml(r.nombre)} (${escapeHtml(r.equipo)})</option>`).join('');
  sel.value = prev;
  localStorage.setItem(LS_ACTIVE_USER, prev);
  return prev;
}

function onActiveUserChange(){
  const sel = document.getElementById('activeUserSelect');
  localStorage.setItem(LS_ACTIVE_USER, sel.value);
  refreshUserBar();
  const tabFechas = document.getElementById('tab-fechas');
  if(tabFechas && !tabFechas.classList.contains('hidden')){ renderFechas(); }
}


function refreshUserBar(){
  const personaId = poblarActiveUserSelect();
  const weekInfo = document.getElementById('weekInfo');
  const banner = document.getElementById('weekBanner');
  const banPropia = document.getElementById('banSancionPropia');
  const banRival = document.getElementById('banSancionRival');

  banPropia.classList.add('hidden'); banPropia.innerHTML = '';
  banRival.classList.add('hidden'); banRival.innerHTML = '';

  if(!personaId){
    weekInfo.innerHTML = '';
    banner.classList.add('hidden');
    return;
  }

  const semanas = semanasDePersona(personaId);
  const totalSemanas = semanas.length;
  const idx = Math.min(semanaActualIndex(), Math.max(0, totalSemanas - 1));
  weekInfo.innerHTML = totalSemanas > 0
    ? `Semana actual: <strong>${idx+1}</strong> de ${totalSemanas}`
    : 'No hay rivales suficientes para armar el fixture';

  if(totalSemanas === 0){
    banner.classList.add('hidden');
    return;
  }

  const rivalesSemana = semanas[idx] || [];
  const pendientesSemana = rivalesSemana.filter(r => !yaJugaron(personaId, r.id));

  if(pendientesSemana.length === 0){
    banner.className = 'week-banner ok';
    banner.innerHTML = `<span class="icon">✅</span><span>¡Ya jugaste tus partidos de la Semana ${idx+1}! Nos vemos la semana que viene.</span>`;
  } else {
    const nombres = pendientesSemana.map(r => `<b>${escapeHtml(r.nombre)}</b>`).join(' y ');
    banner.className = 'week-banner warning';
    banner.innerHTML = `<span class="icon">⚠️</span><span>No jugaste tus fechas, jugás esta semana contra: ${nombres}</span>`;
  }
  banner.classList.remove('hidden');

  const proximo = proximoPendiente(personaId);
  if(!proximo) return;

  const misSancionados = jugadoresSancionadosParaSlot(personaId, {semana:proximo.semana, pos:proximo.pos});
  if(misSancionados.length > 0){
    const plural = misSancionados.length > 1;
    const nombres = misSancionados.map(n => `<b>${escapeHtml(n)}</b>`).join(', ');
    banPropia.className = 'week-banner sancion';
    banPropia.innerHTML = `<span class="icon">🟥</span><span>TU EQUIPO: ${nombres} ${plural ? 'están sancionados' : 'está sancionado'} y NO ${plural ? 'pueden' : 'puede'} jugar contra <b>${escapeHtml(proximo.rival.nombre)}</b>.</span>`;
    banPropia.classList.remove('hidden');
  }

  const ubicRivalParaEsteCruce = ubicacionEnFixture(proximo.rival.id, personaId);
  const rivalSancionados = ubicRivalParaEsteCruce ? jugadoresSancionadosParaSlot(proximo.rival.id, ubicRivalParaEsteCruce) : [];
  if(rivalSancionados.length > 0){
    const nombres = rivalSancionados.map(n => `<b>${escapeHtml(n)}</b>`).join(', ');
    banRival.className = 'week-banner sancion';
    banRival.innerHTML = `<span class="icon">🚫</span><span>RIVAL SANCIONADO: <b>${escapeHtml(proximo.rival.nombre)}</b> no podrá usar a ${nombres} en este partido por tarjeta roja.</span>`;
    banRival.classList.remove('hidden');
  }
}



function ubicacionEnFixture(personaId, rivalId){
  const semanas = semanasDePersona(personaId);
  for(let w = 0; w < semanas.length; w++){
    for(let p = 0; p < semanas[w].length; p++){
      if(semanas[w][p].id === rivalId) return {semana:w, pos:p};
    }
  }
  return null;
}

function proximoPendiente(personaId){
  const semanas = semanasDePersona(personaId);
  for(let w = 0; w < semanas.length; w++){
    for(let p = 0; p < semanas[w].length; p++){
      const rival = semanas[w][p];
      if(!yaJugaron(personaId, rival.id)){
        return {rival, semana:w, pos:p};
      }
    }
  }
  return null;
}


function jugadoresSancionadosParaSlot(personaId, slot){
  if(!slot) return [];
  const semanas = semanasDePersona(personaId);
  const rivalDelSlot = semanas[slot.semana] && semanas[slot.semana][slot.pos];
  if(!rivalDelSlot) return [];
  if(yaJugaron(personaId, rivalDelSlot.id)) return []; // ya se jugó ese partido: sanción cumplida

  const nombres = new Set();
  partidos.forEach(m => {
    (m.rojas || []).forEach(r => {
      if(r.personaId !== personaId) return;
      const rivalDeEsePartido = (m.personaAId === personaId) ? m.personaBId : m.personaAId;
      const ubic = ubicacionEnFixture(personaId, rivalDeEsePartido);
      if(!ubic) return;
      const siguiente = (ubic.pos === 0)
        ? {semana: ubic.semana, pos: 1}
        : {semana: ubic.semana + 1, pos: 0};
      if(siguiente.semana === slot.semana && siguiente.pos === slot.pos){
        nombres.add(r.jugador.trim());
      }
    });
  });
  return [...nombres];
}


function renderFechas(){
  refreshUserBar();
  const cont = document.getElementById('fechasSemanas');
  const label = document.getElementById('fechasViendoLabel');
  const personaId = document.getElementById('activeUserSelect').value;

  if(roster.length === 0 || !personaId){
    label.textContent = '';
    cont.innerHTML = `<p class="empty-note">No hay participantes cargados todavía. Andá a la pestaña Sorteo.</p>`;
    return;
  }

  label.textContent = 'Fixture de ' + personaNombre(personaId);
  const semanas = semanasDePersona(personaId);
  const idxActual = Math.min(semanaActualIndex(), Math.max(0, semanas.length - 1));

  if(semanas.length === 0){
    cont.innerHTML = `<p class="empty-note">Necesitás al menos otra persona en el plantel para armar el fixture.</p>`;
    return;
  }

  cont.innerHTML = semanas.map((rivales, i) => {
    const esActual = i === idxActual;
    const filas = rivales.map((r, p) => {
      const jugado = yaJugaron(personaId, r.id);
      if(!jugado){
        const sancionadosPropios = jugadoresSancionadosParaSlot(personaId, {semana:i, pos:p});
        const ubicRival = ubicacionEnFixture(r.id, personaId);
        const sancionadosRival = ubicRival ? jugadoresSancionadosParaSlot(r.id, ubicRival) : [];
        const tags = [];
        if(sancionadosPropios.length) tags.push(`<span class="resultado-chip" style="background:#ff8c00; color:#07130d;">🟥 ${escapeHtml(sancionadosPropios.join(', '))} no juega</span>`);
        if(sancionadosRival.length) tags.push(`<span class="resultado-chip" style="background:#ff8c00; color:#07130d;">🚫 rival sin ${escapeHtml(sancionadosRival.join(', '))}</span>`);
        return `
          <div class="fixture-row pendiente">
            <div>
              <div class="fixture-main">vs ${escapeHtml(r.nombre)}</div>
              <div class="fixture-sub">${escapeHtml(r.equipo)}</div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
              <span class="resultado-chip" style="background:var(--line); color:var(--text-dim);">Por jugar</span>
              ${tags.join('')}
            </div>
          </div>
        `;
      }
      const m = partidos.find(mm =>
        (mm.personaAId === personaId && mm.personaBId === r.id) ||
        (mm.personaBId === personaId && mm.personaAId === r.id)
      );
      const esA = m.personaAId === personaId;
      const golesPropios = esA ? m.golesA : m.golesB;
      const golesRival = esA ? m.golesB : m.golesA;
      let resultado, chipClass;
      if(golesPropios > golesRival){ resultado='Victoria'; chipClass='chip-v'; }
      else if(golesPropios < golesRival){ resultado='Derrota'; chipClass='chip-d'; }
      else { resultado='Empate'; chipClass='chip-e'; }
      return `
        <div class="fixture-row jugado">
          <div>
            <div class="fixture-main">vs ${escapeHtml(r.nombre)}</div>
            <div class="fixture-sub">${escapeHtml(r.equipo)} &nbsp;·&nbsp; Resultado: ${golesPropios} - ${golesRival}</div>
          </div>
          <span class="resultado-chip ${chipClass}">${resultado}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="semana-block ${esActual ? 'actual' : ''}">
        <div class="semana-header">
          <h4>Semana ${i+1}</h4>
          ${esActual ? '<span class="semana-tag-actual">Semana Actual</span>' : ''}
        </div>
        ${filas}
      </div>
    `;
  }).join('');
}


function cargarPoolsEnTextareas(){
  const personas = localStorage.getItem(LS_POOL_PERSONAS);
  const equipos = localStorage.getItem(LS_POOL_EQUIPOS);
  document.getElementById('sorteoPersonas').value = personas !== null ? personas : roster.map(r=>r.nombre).join('\n');
  document.getElementById('sorteoEquipos').value = equipos !== null ? equipos : roster.map(r=>r.equipo).join('\n');
  renderSorteoResultado(roster);
}

function realizarSorteo(){
  const personasRaw = document.getElementById('sorteoPersonas').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const equiposRaw = document.getElementById('sorteoEquipos').value.split('\n').map(s=>s.trim()).filter(Boolean);

  if(personasRaw.length === 0 || equiposRaw.length === 0){
    showToast('Cargá al menos una persona y un equipo'); return;
  }
  if(equiposRaw.length < personasRaw.length){
    showToast('Necesitás al menos tantos equipos como personas'); return;
  }
  if(partidos.length > 0){
    const ok = confirm('Ya hay partidos cargados en esta liga. Al volver a sortear se arma un plantel nuevo y se REINICIAN todas las estadísticas: Posiciones, Goleadores y Tarjetas Rojas quedarán en 0, y arranca una semana 1 nueva. ¿Continuar?');
    if(!ok) return;
  }

  const equiposShuffled = [...equiposRaw];
  for(let i = equiposShuffled.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [equiposShuffled[i], equiposShuffled[j]] = [equiposShuffled[j], equiposShuffled[i]];
  }

  const nuevoRoster = personasRaw.map((nombre, idx) => ({
    id: uid(),
    nombre,
    equipo: equiposShuffled[idx]
  }));

  roster = nuevoRoster;
  saveRoster();
  localStorage.setItem(LS_POOL_PERSONAS, personasRaw.join('\n'));
  localStorage.setItem(LS_POOL_EQUIPOS, equiposRaw.join('\n'));

  partidos = [];
  savePartidos();

  localStorage.setItem(LS_TORNEO_INICIO, new Date().toISOString());
  localStorage.setItem(LS_ACTIVE_USER, roster[0] ? roster[0].id : '');

  renderSorteoResultado(roster);
  renderAll();
  showToast('¡Sorteo realizado! Estadísticas reiniciadas — arranca la Semana 1.');
}

function renderSorteoResultado(lista){
  const cont = document.getElementById('sorteoResultado');
  if(!lista || lista.length===0){ cont.innerHTML = ''; return; }
  cont.innerHTML = lista.map(r => `
    <div class="sorteo-card">
      <div class="p-name">${escapeHtml(r.nombre)}</div>
      <div class="p-team">→ ${escapeHtml(r.equipo)}</div>
    </div>
  `).join('');
}

function personaOptions(selectedId){
  return roster.map(r => `<option value="${r.id}" ${r.id===selectedId?'selected':''}>${escapeHtml(r.nombre)} (${escapeHtml(r.equipo)})</option>`).join('');
}

function renderMatchForm(){
  const selA = document.getElementById('matchPersonaA');
  const selB = document.getElementById('matchPersonaB');
  selA.innerHTML = personaOptions();
  selB.innerHTML = personaOptions();
  if(roster.length > 1){ selB.selectedIndex = 1; }
  document.getElementById('golesRows').innerHTML = '';
  document.getElementById('rojasRows').innerHTML = '';
}

function agregarFilaGol(jugador='', personaId='', cantidad=1){
  const row = document.createElement('div');
  row.className = 'subrow';
  row.innerHTML = `
    <div class="field" style="margin:0;">
      <label>Jugador Virtual</label>
      <input type="text" class="gol-jugador" placeholder="Ej: Adriano" value="${escapeAttr(jugador)}">
    </div>
    <div class="field" style="margin:0;">
      <label>Persona</label>
      <select class="gol-persona">${personaOptions(personaId)}</select>
    </div>
    <div class="field" style="margin:0;">
      <label>Cant.</label>
      <input type="number" class="gol-cant" min="1" value="${cantidad}">
    </div>
    <button class="mini-x" onclick="this.closest('.subrow').remove()" title="Eliminar">✕</button>
  `;
  document.getElementById('golesRows').appendChild(row);
}

function agregarFilaRoja(jugador='', personaId=''){
  const row = document.createElement('div');
  row.className = 'subrow';
  row.style.gridTemplateColumns = '1fr 1fr 34px';
  row.innerHTML = `
    <div class="field" style="margin:0;">
      <label>Jugador Virtual</label>
      <input type="text" class="roja-jugador" placeholder="Ej: Zidane" value="${escapeAttr(jugador)}">
    </div>
    <div class="field" style="margin:0;">
      <label>Persona</label>
      <select class="roja-persona">${personaOptions(personaId)}</select>
    </div>
    <button class="mini-x" onclick="this.closest('.subrow').remove()" title="Eliminar">✕</button>
  `;
  document.getElementById('rojasRows').appendChild(row);
}

function editarPartido(id){
  const m = partidos.find(p => p.id === id);
  if(!m){ showToast('No se encontró ese partido'); return; }

  editandoPartidoId = id;
  renderMatchForm(); // reconstruye selects según el plantel actual y limpia las filas

  const selA = document.getElementById('matchPersonaA');
  const selB = document.getElementById('matchPersonaB');
  if([...selA.options].some(o => o.value === m.personaAId)) selA.value = m.personaAId;
  if([...selB.options].some(o => o.value === m.personaBId)) selB.value = m.personaBId;
  document.getElementById('matchGolesA').value = m.golesA;
  document.getElementById('matchGolesB').value = m.golesB;

  document.getElementById('golesRows').innerHTML = '';
  document.getElementById('rojasRows').innerHTML = '';
  m.goleadores.forEach(g => agregarFilaGol(g.jugador, g.personaId, g.cantidad));
  m.rojas.forEach(r => agregarFilaRoja(r.jugador, r.personaId));

  document.getElementById('matchFormTitle').textContent = 'Editar Partido';
  document.getElementById('btnGuardarPartido').textContent = '💾 Actualizar Partido';
  document.getElementById('btnCancelarEdicion').classList.remove('hidden');
  document.getElementById('editBannerText').innerHTML =
    `Estás editando <b>${escapeHtml(personaNombre(m.personaAId))} vs ${escapeHtml(personaNombre(m.personaBId))}</b>. Al guardar, se reemplaza el resultado cargado.`;
  document.getElementById('editBanner').classList.remove('hidden');

  document.getElementById('matchFormTitle').scrollIntoView({behavior:'smooth', block:'start'});
}

function cancelarEdicionPartido(){
  editandoPartidoId = null;
  renderMatchForm();
  document.getElementById('matchFormTitle').textContent = 'Cargar Resultado de Partido';
  document.getElementById('btnGuardarPartido').textContent = '💾 Guardar Partido';
  document.getElementById('btnCancelarEdicion').classList.add('hidden');
  document.getElementById('editBanner').classList.add('hidden');
}

function guardarPartido(){
  const personaAId = document.getElementById('matchPersonaA').value;
  const personaBId = document.getElementById('matchPersonaB').value;
  const golesA = parseInt(document.getElementById('matchGolesA').value || '0', 10);
  const golesB = parseInt(document.getElementById('matchGolesB').value || '0', 10);

  if(!personaAId || !personaBId){ showToast('Necesitás al menos 2 personas en el plantel'); return; }
  if(personaAId === personaBId){ showToast('Las dos personas deben ser distintas'); return; }
  if(isNaN(golesA) || isNaN(golesB) || golesA < 0 || golesB < 0){ showToast('Revisá los goles cargados'); return; }

  const goleadores = [...document.querySelectorAll('#golesRows .subrow')].map(row=>({
    jugador: row.querySelector('.gol-jugador').value.trim(),
    personaId: row.querySelector('.gol-persona').value,
    cantidad: parseInt(row.querySelector('.gol-cant').value || '1', 10)
  })).filter(g => g.jugador.length > 0);

  const rojas = [...document.querySelectorAll('#rojasRows .subrow')].map(row=>({
    jugador: row.querySelector('.roja-jugador').value.trim(),
    personaId: row.querySelector('.roja-persona').value
  })).filter(r => r.jugador.length > 0);

  const totalGolA = goleadores.filter(g=>g.personaId===personaAId).reduce((s,g)=>s+g.cantidad,0);
  const totalGolB = goleadores.filter(g=>g.personaId===personaBId).reduce((s,g)=>s+g.cantidad,0);
  if(totalGolA > golesA || totalGolB > golesB){
    const ok = confirm('Los goleadores cargados superan el marcador ingresado. ¿Guardar de todas formas?');
    if(!ok) return;
  }

  if(editandoPartidoId){
    const idx = partidos.findIndex(p => p.id === editandoPartidoId);
    if(idx === -1){
      showToast('El partido que editabas ya no existe');
      cancelarEdicionPartido();
      return;
    }
    partidos[idx] = { ...partidos[idx], personaAId, personaBId, golesA, golesB, goleadores, rojas };
    savePartidos();
    cancelarEdicionPartido();
    renderAll();
    renderHistorial();
    showToast('Partido actualizado y tablas recalculadas');
    return;
  }

  partidos.push({
    id: uid(), personaAId, personaBId, golesA, golesB, goleadores, rojas
  });
  savePartidos();
  renderMatchForm();
  renderAll();
  showToast('Partido guardado y tablas actualizadas');
}

function renderHistorial(){
  const tbody = document.getElementById('historialBody');
  if(partidos.length===0){
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">Sin partidos cargados.</td></tr>`;
    return;
  }
  tbody.innerHTML = [...partidos].reverse().map(m=>{
    const detalle = [
      ...m.goleadores.map(g=>`⚽ ${escapeHtml(g.jugador)} (${escapeHtml(personaNombre(g.personaId))}) x${g.cantidad}`),
      ...m.rojas.map(r=>`🟥 ${escapeHtml(r.jugador)} (${escapeHtml(personaNombre(r.personaId))})`)
    ].join(' &nbsp;·&nbsp; ') || '—';
    return `
      <tr>
        <td class="left" data-label="Partido">${escapeHtml(personaNombre(m.personaAId))} vs ${escapeHtml(personaNombre(m.personaBId))}</td>
        <td class="pts-cell" data-label="Resultado">${m.golesA} - ${m.golesB}</td>
        <td class="left" style="font-size:13px; color:var(--text-dim); font-weight:500;" data-label="Detalle">${detalle}</td>
        <td data-label="Acción">
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" onclick="editarPartido('${m.id}')">Editar</button>
            <button class="btn btn-red btn-sm" onclick="eliminarPartido('${m.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function eliminarPartido(id){
  if(!confirm('¿Eliminar este partido? Se recalcularán todas las tablas.')) return;
  partidos = partidos.filter(m => m.id !== id);
  savePartidos();
  if(editandoPartidoId === id){ cancelarEdicionPartido(); }
  renderAll();
  renderHistorial();
  showToast('Partido eliminado');
}

function renderRosterEdit(){
  const cont = document.getElementById('rosterEditList');
  if(roster.length===0){
    cont.innerHTML = `<p class="empty-note">No hay participantes. Agregá uno o realizá un sorteo.</p>`;
    return;
  }
  cont.innerHTML = roster.map(r=>`
    <div class="roster-edit-row" data-id="${r.id}">
      <input type="text" class="roster-nombre" value="${escapeAttr(r.nombre)}">
      <input type="text" class="roster-equipo" value="${escapeAttr(r.equipo)}">
      <div class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="guardarFilaRoster('${r.id}')">Guardar</button>
        <button class="btn btn-red btn-sm" onclick="eliminarPersonaRoster('${r.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

function guardarFilaRoster(id){
  const row = document.querySelector(`.roster-edit-row[data-id="${id}"]`);
  const nombre = row.querySelector('.roster-nombre').value.trim();
  const equipo = row.querySelector('.roster-equipo').value.trim();
  if(!nombre || !equipo){ showToast('Nombre y equipo no pueden estar vacíos'); return; }
  const p = personaById(id);
  p.nombre = nombre; p.equipo = equipo;
  saveRoster();
  renderAll();
  renderMatchForm();
  showToast('Participante actualizado');
}

function eliminarPersonaRoster(id){
  const p = personaById(id);
  if(!p) return;
  const tienePartidos = partidos.some(m=>m.personaAId===id || m.personaBId===id);
  const msg = tienePartidos
    ? `${p.nombre} tiene partidos cargados en el historial. Si lo eliminás, esos partidos van a mostrar "(eliminado)". ¿Continuar?`
    : `¿Eliminar a ${p.nombre} del plantel?`;
  if(!confirm(msg)) return;
  roster = roster.filter(r => r.id !== id);
  saveRoster();
  renderAll();
  renderRosterEdit();
  renderMatchForm();
  showToast('Participante eliminado');
}

function agregarPersonaRoster(){
  roster.push({id:uid(), nombre:'Nuevo Jugador', equipo:'Equipo'});
  saveRoster();
  renderRosterEdit();
  renderMatchForm();
  renderPosiciones();
}


function renderAdmin(){
  refreshAdminUI();
  if(!isAdmin()) return;
  if(!editandoPartidoId){ renderMatchForm(); }
  renderHistorial();
  renderRosterEdit();
}


function renderAll(){
  renderPosiciones();
  renderGoleadores();
  renderRojas();
  refreshUserBar();
  const tabFechas = document.getElementById('tab-fechas');
  if(tabFechas && !tabFechas.classList.contains('hidden')){ renderFechas(); }
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(str){ return escapeHtml(str); }

loadState();
renderAll();
refreshAdminUI();
refreshUserBar();