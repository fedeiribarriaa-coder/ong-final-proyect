/* =====================================================================
   ONG Animales Ramallo · sitio público V8
   ===================================================================== */
(() => {
'use strict';
const C = window.ONG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const icon = id => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let sb = null;
try { if (window.supabase) sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, { auth: { persistSession: false } }); }
catch (e) { console.warn('Supabase no disponible', e); }

/* ---------- Toast ---------- */
let toastT;
function toast(msg, ms = 3200) {
  $('#toastText').textContent = msg;
  $('#toast').classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => $('#toast').classList.remove('show'), ms);
}

/* ---------- Header + drawers ---------- */
const header = $('.site-header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

let lastFocus = null;
function openDrawer(id) {
  const d = $('#' + id); lastFocus = document.activeElement;
  d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  if (id === 'menuDrawer') $('#menuBtn').setAttribute('aria-expanded', 'true');
  if (id === 'menuDrawer') { fillMenuFeature(); fitBrand(); }
  setTimeout(() => (d.querySelector('.mm-close, .drawer-head .icon-btn') || d.querySelector('button, a'))?.focus({ preventScroll: true }), 60);
}
function closeDrawer(d) {
  d.classList.remove('open'); d.setAttribute('aria-hidden', 'true');
  if (!$$('.drawer.open').length) document.body.classList.remove('no-scroll');
  if (d.id === 'menuDrawer') $('#menuBtn').setAttribute('aria-expanded', 'false');
  lastFocus?.focus?.();
}
$('#menuBtn').addEventListener('click', () => openDrawer('menuDrawer'));
$('#cartBtn').addEventListener('click', () => { renderCart(); openDrawer('cartDrawer'); });
$$('.drawer').forEach(d => d.addEventListener('click', e => { if (e.target.closest('[data-drawer-close]')) closeDrawer(d); }));
addEventListener('keydown', e => {
  const open = $('.drawer.open'); if (!open) return;
  if (e.key === 'Escape') { closeDrawer(open); return; }
  if (e.key !== 'Tab') return;           // el foco no se escapa del menú abierto
  const f = $$('a[href]:not([hidden]), button:not([disabled]):not([hidden]), input, select, textarea', $('.drawer-panel', open)).filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
/* Menú: se cierra deslizándolo hacia la derecha */
(() => {
  const panel = $('#menuDrawer .drawer-panel'); if (!panel) return;
  let x0 = null, y0 = 0, dx = 0, t0 = 0, lock = null;
  panel.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; t0 = Date.now(); lock = null; }, { passive: true });
  panel.addEventListener('touchmove', e => {
    if (x0 === null) return;
    const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
    if (lock === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (lock !== 'x') return;
    dx = Math.max(0, mx); panel.style.transition = 'none'; panel.style.transform = `translateX(${dx}px)`;
  }, { passive: true });
  panel.addEventListener('touchend', () => {
    if (x0 === null) return; x0 = null; panel.style.transition = '';
    if (lock === 'x' && (dx > 110 || (dx > 40 && Date.now() - t0 < 240))) { panel.style.transform = ''; closeDrawer($('#menuDrawer')); }
    else panel.style.transform = '';
  });
})();
/* El nombre de la ONG siempre en una línea: se ajusta al ancho disponible sin pasar de 17px */
function fitBrand() {
  const n = $('.mm-name'); if (!n) return;
  n.style.fontSize = '';
  let fs = parseFloat(getComputedStyle(n).fontSize);
  while (n.scrollWidth > n.clientWidth + 1 && fs > 17) { fs -= .5; n.style.fontSize = fs + 'px'; }
}
addEventListener('resize', () => { if ($('#menuDrawer').classList.contains('open')) fitBrand(); });
/* Bloque editorial del menú: un perro real de los datos cargados, distinto cada vez */
let mmPick = -1;
function fillMenuFeature() {
  const pool = dogs.filter(d => d.estado === 'disponible' && d.foto && !d.foto.endsWith('dog.png'));
  const box = $('#mmFeature'); if (!box) return; if (!pool.length) { box.hidden = true; return; }
  mmPick = (mmPick + 1 + Math.floor(Math.random() * Math.max(1, pool.length - 1))) % pool.length;
  const d = pool[mmPick];
  $('#mmfImg').src = d.foto; $('#mmfImg').alt = d.nombre;
  $('#mmfName').textContent = `${d.nombre} busca familia`;
  $('#mmfBtn').setAttribute('aria-label', `Ver la historia de ${d.nombre}`);
  $('#mmfBtn').onclick = () => { closeDrawer($('#menuDrawer')); setTimeout(() => openDog(d), 200); };
  box.hidden = false;
}

/* Diálogos nativos */
$$('dialog').forEach(dlg => {
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg.addEventListener('close', () => { if (!$$('dialog[open]').length && !$$('.drawer.open').length) document.body.classList.remove('no-scroll'); });
});
function showDlg(dlg) { dlg.showModal(); document.body.classList.add('no-scroll'); }

/* Revelado al hacer scroll */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' }) : null;
const watchReveal = (root = document) => {
  const els = $$('[data-reveal]:not(.in)', root);
  els.forEach(el => {
    // escalonado entre hermanos que entran juntos
    const sib = [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal'));
    if (sib.length > 1) el.style.setProperty('--d', (sib.indexOf(el) * 0.09).toFixed(2) + 's');
    io ? io.observe(el) : el.classList.add('in');
  });
};
/* Barra de progreso + enlace activo del menú */
const bar = $('#scrollProgress');
const navLinks = $$('.main-nav a[href^="#"]');
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : 0);
    ticking = false;
  });
}, { passive: true });
if ('IntersectionObserver' in window) {
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    $$('.mm-item[data-sec]').forEach(a => a.toggleAttribute('aria-current', a.dataset.sec === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['adopciones', 'como', 'novedades', 'tienda', 'donar'].forEach(id => { const el = $('#' + id); if (el) secObs.observe(el); });
  // La línea del proceso se dibuja al llegar
  const steps = $('#steps');
  if (steps) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { steps.classList.add('drawn'); o.disconnect(); } }, { threshold: .35 }).observe(steps);
}
watchReveal();
$('#year').textContent = new Date().getFullYear();

/* =====================================================================
   PERROS
   ===================================================================== */
let dogs = [];
const cap = v => v ? String(v).trim().replace(/^xxl$/i, 'XXL').replace(/^./, c => c.toUpperCase()) : '';
// La base real usa sexo / edad_aproximada / tamanio / castrado / vacunas_al_dia / foto_principal.
// También se aceptan los campos de la V8 (ficha, foto_url, orden, destacado) cuando existan.
const normDog = r => {
  const edad = r.edad_aproximada || r.edad || '', tam = r.tamanio || r.tamano || '', sexo = r.sexo || '';
  return {
    id: r.id ?? null,
    nombre: (r.nombre || 'Sin nombre').trim(),
    ficha: r.ficha || [edad, tam && cap(tam).toLowerCase().replace('xxl', 'XXL'), sexo && sexo.toLowerCase()].filter(Boolean).join(' · '),
    raw: { edad, tam, sexo },
    castrado: r.castrado ?? null, vacunas: r.vacunas_al_dia ?? null,
    historia: r.historia || r.descripcion || '',
    foto: r.foto_url || r.foto_principal || r.imagen_url || 'assets/images/dog.png',
    estado: r.estado || 'disponible',
    destacado: !!r.destacado,
    orden: r.orden ?? 100,
    creado: r.creado_en || null, actualizado: r.actualizado_en || r.creado_en || null
  };
};
/* Mismo perro cargado dos veces (misma ficha o ficha vacía): se muestra una sola vez, el más reciente.
   No se borra nada de la base; el panel muestra estos casos para que el equipo decida. */
function dedupe(list) {
  const key = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const same = (a, b) => ['edad', 'tam', 'sexo'].every(k => !a.raw[k] || !b.raw[k] || key(a.raw[k]) === key(b.raw[k]));
  const out = [];
  [...list].sort((a, b) => String(b.actualizado || '').localeCompare(String(a.actualizado || ''))).forEach(d => {
    const twin = out.find(o => key(o.nombre) === key(d.nombre) && same(o, d));
    if (twin) { ['edad', 'tam', 'sexo'].forEach(k => { if (!twin.raw[k] && d.raw[k]) twin.raw[k] = d.raw[k]; }); return; }
    out.push(d);
  });
  return out;
}

async function loadDogs() {
  let rows = [];
  if (sb) {
    const { data, error } = await sb.from('animales').select('*').in('estado', ['disponible', 'en_proceso']);
    if (error) console.warn('animales:', error.message); else rows = data || [];
  }
  dogs = dedupe((rows.length ? rows : C.PERROS_RESPALDO).map(normDog));
  sortDogs();
  renderFilters(); renderDogs(); initHero();
}

function countUp(el, n) {
  if (reduced || el.dataset.done) { el.textContent = n; return; }
  el.dataset.done = 1; const t0 = performance.now(), dur = 900;
  const step = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
/* ---------- Características reales a partir de la ficha ("5 años · mediana · hembra") ---------- */
function traits(d) {
  const t = (d.ficha || '').toLowerCase().split('·').map(x => x.trim());
  if (d.raw) { if (d.raw.sexo) t.push(d.raw.sexo.toLowerCase()); if (d.raw.tam) t.push(d.raw.tam.toLowerCase()); if (d.raw.edad) t.push(d.raw.edad.toLowerCase()); }
  const sexo = t.find(x => /^(macho|hembra)$/.test(x)) || '';
  const tam = t.find(x => /(chic|peque|median|grande|xxl|xl)/.test(x)) || '';
  const tamano = /chic|peque/.test(tam) ? 'chico' : /median/.test(tam) ? 'mediano' : tam ? 'grande' : '';
  const edadTxt = t.find(x => /(año|mes)/.test(x)) || '';
  const n = parseFloat(edadTxt.replace(',', '.'));
  const edad = !edadTxt ? '' : /mes/.test(edadTxt) || n < 1 ? 'cachorro' : n >= 8 ? 'senior' : 'adulto';
  return { sexo, tamano, edad };
}
const FILTERS = {
  sexo: [['hembra', 'Hembras'], ['macho', 'Machos']],
  tamano: [['chico', 'Chicos'], ['mediano', 'Medianos'], ['grande', 'Grandes']],
  edad: [['cachorro', 'Cachorros'], ['adulto', 'Adultos'], ['senior', 'Mayores']]
};
const fState = { q: '', sexo: '', tamano: '', edad: '' };
let sortBy = 'destacados';
const ageMonths = d => { const e = String(d.raw?.edad || (d.ficha.match(/[\d.,]+\s*(año|mes)\w*/i) || [''])[0]).toLowerCase(); const n = parseFloat(e.replace(',', '.')); return isNaN(n) ? Infinity : /mes/.test(e) ? n : n * 12; };
function sortDogs() {
  const byName = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
  const S = {
    destacados: (a, b) => (b.destacado - a.destacado) || (a.orden - b.orden) || byName(a, b),
    nombre: byName,
    recientes: (a, b) => String(b.creado || '').localeCompare(String(a.creado || '')) || byName(a, b),
    jovenes: (a, b) => ageMonths(a) - ageMonths(b) || byName(a, b)
  };
  dogs.sort(S[sortBy] || S.destacados);
}
const filtering = () => !!(fState.q || fState.sexo || fState.tamano || fState.edad);
function matches(d) {
  const t = traits(d);
  if (fState.q && !d.nombre.toLowerCase().includes(fState.q.toLowerCase())) return false;
  return ['sexo', 'tamano', 'edad'].every(k => !fState[k] || t[k] === fState[k]);
}
function renderFilters() {
  const box = $('#dogFilters'); if (!box) return;
  // solo se ofrecen las opciones que existen en los datos
  const groups = Object.entries(FILTERS).map(([k, opts]) => {
    const avail = opts.filter(([v]) => dogs.some(d => traits(d)[k] === v));
    if (!avail.length) return '';
    return `<div class="fgroup" role="group" aria-label="${k === 'tamano' ? 'Tamaño' : k === 'sexo' ? 'Sexo' : 'Edad'}">${avail.map(([v, l]) =>
      `<button type="button" class="fchip" data-f="${k}" data-v="${v}" aria-pressed="${fState[k] === v}">${l}<em>${dogs.filter(d => traits(d)[k] === v).length}</em></button>`).join('')}</div>`;
  }).join('');
  $('#fgroups').innerHTML = groups; $('#fgroupsSheet').innerHTML = groups;
  box.hidden = dogs.length < 4;
  // "Más recientes" solo si los datos tienen fecha de carga
  const rec = $('#dogSort option[value=recientes]'); if (rec) rec.hidden = !dogs.some(d => d.creado);
  const jov = $('#dogSort option[value=jovenes]'); if (jov) jov.hidden = !dogs.some(d => ageMonths(d) !== Infinity);
}
/* Celular: filtros en hoja inferior con resultado en vivo */
const fSheet = $('#filterSheet');
$('#openFilters')?.addEventListener('click', () => { fSheet.showModal(); document.body.classList.add('no-scroll'); });
fSheet?.addEventListener('click', e => {
  const c = e.target.closest('.fchip');
  if (c) { fState[c.dataset.f] = fState[c.dataset.f] === c.dataset.v ? '' : c.dataset.v; applyFilters(); return; }
  if (e.target.closest('#fsClear')) { Object.assign(fState, { sexo: '', tamano: '', edad: '' }); applyFilters(); return; }
  if (e.target === fSheet || e.target.closest('#fsDone')) fSheet.close();
});
$('#dogSort')?.addEventListener('change', e => { sortBy = e.target.value; sortDogs(); applyFilters(); });
$('#dogFilters')?.addEventListener('click', e => {
  const c = e.target.closest('.fchip'); if (c) { fState[c.dataset.f] = fState[c.dataset.f] === c.dataset.v ? '' : c.dataset.v; applyFilters(); return; }
  if (e.target.closest('#fClear')) { Object.assign(fState, { q: '', sexo: '', tamano: '', edad: '' }); $('#dogQ').value = ''; applyFilters(); }
});
let qT;
$('#dogQ')?.addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { fState.q = e.target.value.trim(); applyFilters(); }, 140); });
function applyFilters() {
  const grid = $('#dogs');
  $$('.fchip').forEach(c => c.setAttribute('aria-pressed', String(fState[c.dataset.f] === c.dataset.v)));
  $('#fClear').hidden = !filtering();
  const nf = ['sexo', 'tamano', 'edad'].filter(k => fState[k]).length;
  $('#fCount').textContent = nf || ''; $('#openFilters').classList.toggle('on', !!nf);
  const nres = dogs.filter(matches).length;
  $('#fsDone').textContent = nres ? `Ver ${nres} ${nres === 1 ? 'perro' : 'perros'}` : 'Sin resultados';
  if (reduced) { renderDogs(); return; }
  grid.classList.add('leaving');
  setTimeout(() => { grid.classList.remove('leaving'); renderDogs(true); }, 180);
}

const DOGS_FIRST = () => innerWidth < 640 ? 7 : 9;
let showAllDogs = false, shown = [];
function renderDogs(fresh = false) {
  const f = filtering();
  const pool = f ? dogs.filter(matches) : dogs;
  shown = f || showAllDogs ? pool : pool.slice(0, DOGS_FIRST());
  countUp($('#dogCount'), dogs.length);
  const prev = fresh ? 0 : $$('#dogs .dog').length;
  const noData = dogs.filter(d => !d.ficha).length;
  $('#dogResult').innerHTML = f
    ? `<b>${pool.length}</b> ${pool.length === 1 ? 'perro coincide' : 'perros coinciden'}${noData && (fState.sexo || fState.tamano || fState.edad) ? ` · ${noData} todavía no tienen edad, tamaño o sexo cargados` : ''}`
    : `<b>${dogs.length}</b> perros esperan familia`;
  if (!shown.length) {
    $('#dogs').innerHTML = `<div class="dogs-empty">
      <img src="assets/images/dog.png" alt="" width="96" height="96" loading="lazy">
      <h3>No encontramos perros con esos filtros</h3>
      <p>Probá con menos filtros o mirá a todos: muchos perros todavía no tienen sus datos completos y también buscan familia.</p>
      <button class="btn btn-ghost" type="button" data-clear>Ver todos los perros</button></div>`;
    $('#moreRow').hidden = true; return;
  }
  $('#dogs').innerHTML = shown.map((d, i) => {
    const feat = !f && i === 0 && d.destacado;
    return `
    <button class="dog${feat ? ' feature' : ''}${i >= prev ? ' enter' : ''}" type="button" data-dog="${i}" aria-label="Conocer a ${esc(d.nombre)}${d.estado === 'en_proceso' ? ', en proceso de adopción' : ''}" style="--d:${i >= prev ? ((i - prev) % 9 * 0.06).toFixed(2) : 0}s">
      <div class="dog-frame"><div class="dog-photo"><img src="${esc(d.foto)}" alt="" loading="lazy" decoding="async" width="600" height="750" onload="this.classList.add('ok')">
        ${d.estado === 'en_proceso' ? `<span class="dog-state">${icon('heart')}En proceso de adopción</span>` : ''}
        <span class="dog-go" aria-hidden="true">Conocer ${icon('arrow')}</span></div></div>
      <div class="dog-body"><h3>${esc(d.nombre)}</h3><p>${esc(d.ficha || 'Busca familia')}</p>
        ${feat && d.historia ? `<p class="dog-story">${esc(d.historia.split('\n\n').slice(-1)[0])}</p><span class="btn btn-terra dog-cta">Conocer su historia ${icon('arrow')}</span>` : ''}</div>
    </button>`; }).join('');
  // las tarjetas solo animan cuando la grilla entra en pantalla
  const grid = $('#dogs');
  if (io && !grid.dataset.seen) { grid.classList.add('wait'); new IntersectionObserver(([e], o) => { if (e.isIntersecting) { grid.classList.remove('wait'); grid.dataset.seen = 1; o.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' }).observe(grid); }
  $('#moreRow').hidden = f || showAllDogs || pool.length <= DOGS_FIRST();
}
$('#dogs').addEventListener('click', e => {
  if (e.target.closest('[data-clear]')) { $('#fClear').click(); return; }
  const b = e.target.closest('[data-dog]'); if (b) openDog(shown[+b.dataset.dog], { from: $('.dog-photo img', b) });
});
$('#moreDogs').addEventListener('click', () => { showAllDogs = true; renderDogs(); });

/* =====================================================================
   FICHA: hoja inferior en el celular, galería deslizable, navegación entre
   animales con el dedo, cierre arrastrando y transición desde la tarjeta
   ===================================================================== */
const dlg = $('#dogDlg');
let cur = null, fromImg = null;
const fotosCache = new Map();
async function extraFotos(d) {
  if (!sb || !d.id) return [];
  if (fotosCache.has(d.id)) return fotosCache.get(d.id);
  let urls = [];
  try {
    const { data, error } = await sb.from('animal_fotos').select('*').eq('animal_id', d.id);
    if (!error && data) urls = data.sort((x, y) => (x.orden ?? 0) - (y.orden ?? 0)).map(f => f.url || f.foto_url || f.imagen_url || f.ruta).filter(u => u && u !== d.foto);
  } catch {}
  fotosCache.set(d.id, urls); return urls;
}
const navList = () => (filtering() ? dogs.filter(matches) : dogs);
function dogSheetHTML(d, fotos) {
  const list = navList(), i = list.indexOf(d), n = list.length;
  const t = traits(d);
  const facts = [
    d.raw?.edad && ['Edad', d.raw.edad], (d.raw?.tam || t.tamano) && ['Tamaño', cap(d.raw?.tam || t.tamano)],
    (d.raw?.sexo || t.sexo) && ['Sexo', cap(d.raw?.sexo || t.sexo)],
    d.castrado !== null && ['Castración', d.castrado ? 'Castrado/a' : 'Sin castrar'],
    d.vacunas !== null && ['Vacunas', d.vacunas ? 'Al día' : 'Pendientes']
  ].filter(Boolean);
  const story = d.historia || `${d.nombre} está esperando una familia responsable que le dé una segunda oportunidad. Completá la solicitud y el equipo de la ONG se va a comunicar con vos para contarte más.`;
  const long = story.length > 420;
  return `
    <div class="ds-grip" aria-hidden="true"><span></span></div>
    <div class="ds-gallery">
      <div class="ds-track" id="dsTrack">${fotos.map((u, k) => `<figure class="ds-slide"><img src="${esc(u)}" alt="${esc(d.nombre)}${fotos.length > 1 ? `, foto ${k + 1} de ${fotos.length}` : ''}" ${k ? 'loading="lazy"' : ''} decoding="async"></figure>`).join('')}</div>
      ${fotos.length > 1 ? `<div class="ds-dots" aria-hidden="true">${fotos.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      ${d.estado === 'en_proceso' ? `<span class="dog-state">${icon('heart')}En proceso de adopción</span>` : ''}
      ${n > 1 ? `<button type="button" class="ds-nav prev" data-step="-1" aria-label="Perro anterior">${icon('arrow')}</button>
      <button type="button" class="ds-nav next" data-step="1" aria-label="Perro siguiente">${icon('arrow')}</button>` : ''}
    </div>
    <div class="ds-body">
      <header class="ds-head"><h2 id="dogDlgName">${esc(d.nombre)}</h2>${n > 1 ? `<span class="ds-pos">${i + 1} de ${n}</span>` : ''}</header>
      ${facts.length ? `<dl class="ds-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      <section class="ds-story${long ? ' clamp' : ''}"><h3>Su historia</h3><p class="story">${esc(story)}</p>${long ? '<button type="button" class="ds-more" aria-expanded="false">Leer toda la historia</button>' : ''}</section>
      <div class="next-steps"><b>Así sigue:</b> Postulate ${icon('arrow')} Evaluamos ${icon('arrow')} Adoptás</div>
      ${n > 1 ? `<div class="others"><h3>Otros que esperan familia</h3><div class="others-row">${list.filter(x => x !== d && !x.foto.endsWith('dog.png')).sort((a, b) => ((traits(b).tamano === t.tamano && !!t.tamano) - (traits(a).tamano === t.tamano && !!t.tamano))).slice(0, 4).map(o => `<button type="button" class="other" data-other="${list.indexOf(o)}"><img src="${esc(o.foto)}" alt="" loading="lazy" width="80" height="80"><span>${esc(o.nombre)}</span></button>`).join('')}</div></div>` : ''}
    </div>
    <div class="ds-cta"><button class="btn btn-terra btn-lg btn-block" type="button" id="adoptThis">Quiero adoptar a ${esc(d.nombre)} ${icon('heart')}</button></div>`;
}
async function openDog(d, opts = {}) {
  if (!d) return;
  cur = d;
  const box = $('#dogDlgContent');
  const render = fotos => {
    box.innerHTML = dogSheetHTML(d, fotos);
    bindSheet(box, fotos.length);
  };
  render([d.foto]);
  if (!dlg.open) {
    showDlg(dlg);
    flyIn(opts.from);
  } else if (opts.dir && !reduced) {
    box.animate([{ opacity: 0, transform: `translateX(${opts.dir * 36}px)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  dlg.scrollTop = 0; box.scrollTop = 0;
  const more = await extraFotos(d);
  if (more.length && cur === d) render([d.foto, ...more]);
}
/* Transición: la foto de la tarjeta vuela hasta la foto de la ficha */
function flyIn(srcImg) {
  if (!srcImg || reduced) return;
  const target = $('.ds-slide img', dlg); if (!target) return;
  const a = srcImg.getBoundingClientRect(); const b = target.getBoundingClientRect();
  if (!a.width || !b.width) return;
  const ghost = srcImg.cloneNode(); ghost.className = 'fly'; ghost.removeAttribute('loading');
  Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.appendChild(ghost);
  target.style.opacity = 0;
  ghost.animate([{ transform: 'none', borderRadius: getComputedStyle(srcImg.parentElement).borderRadius },
    { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width}, ${b.height / a.height})`, borderRadius: '0px' }],
    { duration: 460, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = () => { target.style.opacity = ''; ghost.remove(); };
}
function stepDog(dir) {
  const list = navList(), i = list.indexOf(cur);
  if (i < 0 || list.length < 2) return;
  openDog(list[(i + dir + list.length) % list.length], { dir });
}
function bindSheet(box, nFotos) {
  $('#adoptThis').onclick = () => { closeSheet(); openAdopt(cur.nombre); };
  $$('[data-step]', box).forEach(b => b.onclick = () => stepDog(+b.dataset.step));
  $$('[data-other]', box).forEach(b => b.onclick = () => openDog(navList()[+b.dataset.other], { dir: 1 }));
  const more = $('.ds-more', box);
  if (more) more.onclick = () => { const st = more.closest('.ds-story'); const open = st.classList.toggle('open'); more.setAttribute('aria-expanded', String(open)); more.textContent = open ? 'Mostrar menos' : 'Leer toda la historia'; };
  // Galería: puntos sincronizados con el desplazamiento
  const track = $('#dsTrack'), dots = $$('.ds-dots i', box);
  if (track && dots.length) track.addEventListener('scroll', () => { const k = Math.round(track.scrollLeft / track.clientWidth); dots.forEach((d, j) => d.classList.toggle('on', j === k)); }, { passive: true });
  // Deslizar sobre la foto: si hay una sola foto, cambia de animal
  const gal = $('.ds-gallery', box);
  let x0 = null, y0 = null;
  gal.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  gal.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (nFotos > 1) { const atStart = track.scrollLeft < 4, atEnd = track.scrollLeft > track.scrollWidth - track.clientWidth - 4; if (!((dx > 60 && atStart) || (dx < -60 && atEnd))) return; }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) stepDog(dx < 0 ? 1 : -1);
  }, { passive: true });
}
/* Cerrar arrastrando hacia abajo (desde la manija o la foto, solo si la hoja está arriba de todo) */
(() => {
  let y0 = null, dy = 0, t0 = 0;
  const can = e => e.target.closest('.ds-grip, .ds-gallery') && dlg.scrollTop <= 0 && innerWidth <= 640;
  dlg.addEventListener('touchstart', e => { if (!can(e)) return; y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); dlg.style.transition = 'none'; }, { passive: true });
  dlg.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); dlg.style.transform = `translateY(${dy}px)`; }, { passive: true });
  dlg.addEventListener('touchend', () => {
    if (y0 === null) return; y0 = null;
    const fast = dy > 60 && Date.now() - t0 < 250;
    dlg.style.transition = 'transform .3s cubic-bezier(.16,1,.3,1)';
    if (dy > 130 || fast) closeSheet(); else dlg.style.transform = '';
  });
})();
function closeSheet() {
  if (!dlg.open) return;
  if (reduced || innerWidth > 640) { dlg.close(); return; }
  dlg.style.transition = 'transform .28s cubic-bezier(.7,0,.84,0)'; dlg.style.transform = 'translateY(100%)';
  setTimeout(() => { dlg.close(); dlg.style.transform = ''; dlg.style.transition = ''; }, 280);
}
dlg.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) { e.stopImmediatePropagation(); closeSheet(); } }, true);
addEventListener('keydown', e => { if (dlg.open && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('input,textarea,select')) stepDog(e.key === 'ArrowRight' ? 1 : -1); });

/* Hero: el sol de fondo y el retrato circular. Cada perro entra con un iris
   (clip-path) desde el centro; el anillo marca el tiempo hasta el próximo. */
const HERO_MS = 3800;
let heroI = 0, heroTimer = null, heroPool = [], heroImgs = [], heroLive = false;
function initHero() {
  heroPool = dogs.filter(d => d.foto && !d.foto.endsWith('dog.png'));
  if (!heroPool.length) return;
  heroI = Math.max(0, heroPool.findIndex(d => d.destacado));
  const frame = $('#heroFrame');
  frame.innerHTML = heroPool.map((d, i) => `<img alt="${esc(d.nombre)}, en adopción" data-src="${esc(d.foto)}" decoding="async"${i === heroI ? ` src="${esc(d.foto)}" class="on" fetchpriority="high"` : ''}>`).join('');
  heroImgs = $$('img', frame);
  const faces = heroPool.map((d, i) => [d, i]).filter(([, i]) => i !== heroI).slice(0, 4);
  $('#heroFaces').innerHTML = faces.map(([d, i]) => `<button type="button" data-face="${i}" aria-label="Ver a ${esc(d.nombre)}"><img src="${esc(d.foto)}" alt="" loading="lazy" width="42" height="42"></button>`).join('');
  $('#heroFaces').onclick = e => { const b = e.target.closest('[data-face]'); if (b) heroGo(+b.dataset.face); };
  setHeroText(heroI, false);
  warm(heroI + 1);
  $('#heroOpen').onclick = () => openDog(heroPool[heroI], { from: $('#heroFrame img.on') });
  const vis = $('#heroVisual');
  vis.classList.toggle('single', heroPool.length < 2);
  if (heroPool.length < 2) return;
  // Deslizar con el dedo
  let x0 = null;
  vis.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  vis.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) heroGo(heroI + (dx < 0 ? 1 : -1)); x0 = null; });
  // Pausa mientras se mira o se usa el teclado
  vis.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') heroPause(); });
  vis.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') heroPlay(); });
  vis.addEventListener('focusin', heroPause);
  vis.addEventListener('focusout', heroPlay);
  if (reduced) return;
  new IntersectionObserver(([e]) => { heroLive = e.isIntersecting; heroLive ? heroPlay() : heroPause(); }, { threshold: .25 }).observe(vis);
  document.addEventListener('visibilitychange', () => document.hidden ? heroPause() : heroLive && heroPlay());
}
const warm = i => { const img = heroImgs[(i + heroImgs.length) % heroImgs.length]; if (img && !img.getAttribute('src')) img.src = img.dataset.src; return img; };
function setHeroText(i, animate = true) {
  const d = heroPool[i], tag = $('#heroVisual');
  const put = () => {
    $('#heroName').textContent = d.nombre;
    $('#heroMeta').textContent = d.ficha || 'Busca familia';
    $('#heroOpen').innerHTML = `Conocer a ${esc(d.nombre)}${icon('arrow')}`;
    $('#heroHello').textContent = `¡Hola! Soy ${d.nombre}`;
  };
  if (!animate || reduced) { put(); return; }
  tag.classList.add('swap');
  setTimeout(() => { put(); tag.classList.remove('swap'); }, 220);
}
async function heroGo(n) {
  const i = (n + heroPool.length) % heroPool.length;
  if (i === heroI) return;
  const img = warm(i), cur = heroImgs[heroI];
  try { await img.decode(); } catch {}
  heroImgs.forEach(x => { if (x !== cur) x.classList.remove('was', 'on'); });
  cur.classList.remove('on'); cur.classList.add('was');
  void img.offsetWidth;            // reinicia el iris
  img.classList.add('on');
  heroI = i;
  setHeroText(i);
  warm(i + 1);
  if (heroTimer) heroPlay();       // reinicia el anillo y el reloj
}
function heroPlay() {
  if (reduced || heroPool.length < 2) return;
  clearTimeout(heroTimer);
  const vis = $('#heroVisual');
  vis.classList.remove('run'); void vis.offsetWidth; vis.classList.add('run');
  heroTimer = setTimeout(() => heroGo(heroI + 1), HERO_MS);
}
function heroPause() { clearTimeout(heroTimer); heroTimer = null; $('#heroVisual').classList.remove('run'); }

/* =====================================================================
   FORMULARIO DE ADOPCIÓN
   ===================================================================== */
const form = $('#adoptForm');
function openAdopt(name = '') {
  $('#adoptTitle').textContent = name ? `Quiero adoptar a ${name}` : 'Formulario de adopción';
  $('#animalInterest').value = name;
  $('#formMsg').textContent = ''; $('#formMsg').className = 'form-msg';
  form.classList.remove('was-validated');
  showDlg($('#adoptDlg'));
  $('#adoptDlg .adopt-wrap').scrollTop = 0;
}
window.openAdopt = openAdopt;
/* Progreso del formulario: cuántas preguntas obligatorias ya respondiste */
const reqFields = $$('[required]', form);
const fp = document.createElement('div'); fp.className = 'form-progress'; fp.setAttribute('aria-live', 'polite');
fp.innerHTML = '<span id="fpText"></span><div class="track"><span></span></div>';
$('.rules', $('#adoptDlg')).after(fp);
function formProgress() {
  const done = reqFields.filter(el => el.type === 'file' ? el.files.length : String(el.value).trim() !== '' && el.checkValidity()).length;
  fp.style.setProperty('--fp', (done / reqFields.length).toFixed(3));
  $('#fpText').textContent = done === reqFields.length ? '¡Listo! Ya podés enviar la solicitud.' : `Respondiste ${done} de ${reqFields.length} preguntas obligatorias`;
}
form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f && e.target.required) f.classList.toggle('done', e.target.type === 'file' ? !!e.target.files.length : String(e.target.value).trim() !== '' && e.target.checkValidity()); formProgress(); });
form.addEventListener('change', formProgress);
formProgress();
$('#startAdopt').addEventListener('click', () => openAdopt());

form.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#formMsg');
  form.classList.add('was-validated');
  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid');
    msg.className = 'form-msg err';
    msg.textContent = 'Faltan completar campos obligatorios. Los marcamos en rojo.';
    bad?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    bad?.focus({ preventScroll: true });
    return;
  }
  const files = $$('input[type=file]', form).flatMap(i => [...i.files]);
  const totalMB = files.reduce((s, f) => s + f.size, 0) / 1048576;
  if (totalMB > 9.5) {
    msg.className = 'form-msg err';
    msg.textContent = `Las fotos pesan ${totalMB.toFixed(1)} MB y el máximo es 10 MB. Probá con menos fotos o capturas de pantalla.`;
    return;
  }
  const btn = $('#adoptSubmit'); btn.disabled = true; btn.classList.add('loading');
  msg.className = 'form-msg'; msg.textContent = 'Enviando solicitud…';

  // 1) Guardamos un resumen en el panel (si falla, igual se envía el mail)
  if (sb) {
    const fd = new FormData(form), respuestas = {};
    fd.forEach((v, k) => { if (!k.startsWith('_') && !(v instanceof File)) respuestas[k] = v; });
    const insert = sb.from('solicitudes_adopcion').insert({
      nombre_completo: respuestas.nombre_completo,
      telefono: respuestas.numero_contacto,
      localidad: respuestas.direccion_exacta,
      animal_interes: respuestas.animal_interes,
      respuestas, estado: 'nueva'
    });
    try {
      const r = await Promise.race([insert, new Promise(res => setTimeout(() => res({ error: { message: 'timeout' } }), 5000))]);
      if (r?.error) console.warn('No se guardó en el panel:', r.error.message);
    } catch (err) { console.warn(err); }
  }
  // 2) Envío por mail con fotos (FormSubmit)
  HTMLFormElement.prototype.submit.call(form);
});

if (new URLSearchParams(location.search).get('enviado') === '1') {
  history.replaceState(null, '', location.pathname + '#adopciones');
  setTimeout(() => toast('¡Recibimos tu solicitud! Si cumplís los requisitos te contactamos esta semana.', 6000), 400);
}

/* =====================================================================
   NOVEDADES
   ===================================================================== */
let news = [], newsShown = 6;
async function loadNews() {
  if (!sb) return;
  const { data, error } = await sb.from('novedades').select('*').eq('publicada', true)
    .order('fijada', { ascending: false }).order('creado_en', { ascending: false }).limit(30);
  if (error) { console.warn('novedades:', error.message); return; }
  news = data || [];
  if (!news.length) return;
  $('#novedades').hidden = false;
  $$('[data-nav="novedades"]').forEach(a => a.hidden = false);
  renderNews();
}
const fmtDate = d => new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const igPermalink = u => { const m = String(u || '').match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i); return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : null; };

function renderNews() {
  const list = news.slice(0, newsShown);
  $('#news').innerHTML = list.map((n, i) => {
    if (n.tipo === 'instagram' && igPermalink(n.instagram_url)) {
      const url = igPermalink(n.instagram_url);
      return `<article class="post post-ig">
        <blockquote class="instagram-media" data-instgrm-permalink="${esc(url)}" data-instgrm-version="14" style="background:#fff;border:0;margin:0;padding:0;width:100%">
          <a href="${esc(url)}" target="_blank" rel="noopener">Ver esta publicación en Instagram</a></blockquote>
        ${n.credito || n.titulo ? `<div class="post-ig-credit">${icon('ig')}<span>${n.titulo ? esc(n.titulo) + ' · ' : ''}${n.credito ? `vía <b>${esc(n.credito)}</b>` : ''}</span></div>` : ''}
      </article>`;
    }
    const featured = i === 0 && n.fijada && n.imagen_url;
    return `<article class="post${featured ? ' featured' : ''}">
      ${n.imagen_url ? `<div class="post-img"><img src="${esc(n.imagen_url)}" alt="" loading="lazy"></div>` : ''}
      <div class="post-body">
        <span class="post-date">${fmtDate(n.creado_en)}</span>
        ${n.titulo ? `<h3>${esc(n.titulo)}</h3>` : ''}
        ${n.texto ? `<p>${esc(n.texto)}</p>` : ''}
        ${n.texto && n.texto.length > 260 ? '<button class="post-more" type="button">Leer más</button>' : ''}
      </div></article>`;
  }).join('');
  $('#moreNewsRow').hidden = news.length <= newsShown;
  if (list.some(n => n.tipo === 'instagram')) loadIgEmbed();
}
$('#news').addEventListener('click', e => {
  const b = e.target.closest('.post-more'); if (!b) return;
  const p = b.closest('.post'); p.classList.toggle('expanded');
  b.textContent = p.classList.contains('expanded') ? 'Mostrar menos' : 'Leer más';
});
$('#moreNews').addEventListener('click', () => { newsShown += 6; renderNews(); });
function loadIgEmbed() {
  if (window.instgrm) { window.instgrm.Embeds.process(); return; }
  if ($('#igjs')) return;
  const s = document.createElement('script'); s.id = 'igjs'; s.async = true; s.src = 'https://www.instagram.com/embed.js';
  document.body.appendChild(s);
}

/* =====================================================================
   TIENDA + CARRITO + PEDIDO
   ===================================================================== */
let products = [];
const CART_KEY = 'ong_cart_v1';
let cart = [];
try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { cart = []; }
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} updateCount(); };
const updateCount = () => { const n = cart.reduce((s, l) => s + l.cantidad, 0); const el = $('#cartCount'); if (+el.dataset.n < n) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } el.textContent = n || ''; el.dataset.n = n; $('#cartBtn').setAttribute('aria-label', n ? `Ver tu pedido (${n} ${n === 1 ? 'producto' : 'productos'})` : 'Ver tu pedido'); $('#cartBtn').hidden = !n; };
const sizesOf = p => String(p.talles || '').split(',').map(s => s.trim()).filter(Boolean);

async function loadShop() {
  if (sb) {
    const { data, error } = await sb.from('productos').select('*').eq('activo', true).order('orden').order('creado_en', { ascending: false });
    if (error) console.warn('productos:', error.message); else products = data || [];
  }
  renderShop();
}
function renderShop() {
  const el = $('#shop');
  if (!products.length) {
    el.style.display = 'block';
    el.innerHTML = `<div class="shop-empty">${icon('bag')}<div><h3>Muy pronto: merch solidario</h3><p>Estamos preparando remeras y más productos para que puedas llevar a la ONG con vos y ayudar a la vez.</p></div></div>`;
    $('#shopNote').hidden = true; return;
  }
  el.style.display = '';
  $('#shopNote').hidden = false;
  el.innerHTML = products.map(p => {
    const sizes = sizesOf(p), out = p.stock !== null && p.stock !== undefined && p.stock <= 0;
    return `<article class="product" data-reveal data-p="${esc(p.id)}">
      <div class="product-img">${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="${esc(p.nombre)}" loading="lazy">` : ''}</div>
      <div class="product-body">
        <div class="product-top"><h3>${esc(p.nombre)}</h3></div><span class="price">${money(p.precio)}</span>
        ${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}
        ${sizes.length ? `<div class="sizes" role="group" aria-label="Talle">${sizes.map(s => `<button type="button" class="size" aria-pressed="false" data-size="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
        ${out ? '<span class="sold-out">Sin stock por ahora</span>' : `<button class="btn btn-primary btn-block" type="button" data-add>${icon('plus')}Agregar al pedido</button>`}
      </div></article>`;
  }).join('');
  watchReveal(el);
}
$('#shop').addEventListener('click', e => {
  const card = e.target.closest('[data-p]'); if (!card) return;
  const p = products.find(x => String(x.id) === card.dataset.p);
  const sz = e.target.closest('.size');
  if (sz) { $$('.size', card).forEach(b => b.setAttribute('aria-pressed', String(b === sz))); return; }
  if (!e.target.closest('[data-add]')) return;
  const sizes = sizesOf(p), chosen = $('.size[aria-pressed="true"]', card)?.dataset.size || '';
  if (sizes.length && !chosen) { toast('Elegí un talle antes de agregar.'); $('.size', card)?.focus(); return; }
  const line = cart.find(l => l.id === p.id && l.talle === chosen);
  if (line) line.cantidad++;
  else cart.push({ id: p.id, nombre: p.nombre, talle: chosen, precio: Number(p.precio), cantidad: 1, img: p.imagen_url || '' });
  saveCart(); toast(`Agregaste ${p.nombre}${chosen ? ' (' + chosen + ')' : ''} al pedido.`);
});

const cartTotal = () => cart.reduce((s, l) => s + l.precio * l.cantidad, 0);
function renderCart() {
  const body = $('#cartBody'), foot = $('#cartFoot');
  $('#cartTitle').textContent = 'Tu pedido';
  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty">${icon('bag')}<p>Todavía no agregaste productos.</p><a href="#tienda" class="btn btn-ghost btn-sm" data-drawer-close style="margin-top:14px">Ver la tienda</a></div>`;
    foot.innerHTML = ''; return;
  }
  body.innerHTML = cart.map((l, i) => `
    <div class="cart-line">
      ${l.img ? `<img src="${esc(l.img)}" alt="">` : '<span></span>'}
      <div><b>${esc(l.nombre)}</b>${l.talle ? `<small>Talle ${esc(l.talle)}</small>` : ''}
        <div class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="Restar uno">${icon('minus')}</button><span>${l.cantidad}</span><button type="button" data-q="${i}" data-d="1" aria-label="Sumar uno">${icon('plus')}</button></div></div>
      <div class="line-price">${money(l.precio * l.cantidad)}<button type="button" class="line-remove" data-rm="${i}">Quitar</button></div>
    </div>`).join('') + checkoutForm();
  foot.innerHTML = `<div class="cart-total"><span>Total</span><b>${money(cartTotal())}</b></div>
    <button class="btn btn-dark btn-block" type="submit" form="checkout" id="checkoutBtn">${icon('chat')}Confirmar pedido</button>`;
  bindCheckout();
}
function checkoutForm() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('ong_buyer') || '{}'); } catch { return {}; } })();
  return `<form class="checkout" id="checkout" novalidate>
    <h3 style="margin-top:10px">Tus datos</h3>
    <label class="field">Nombre y apellido *<input required name="nombre" autocomplete="name" value="${esc(saved.nombre || '')}"></label>
    <label class="field">WhatsApp *<input required name="telefono" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ej: 3407 123456" pattern="[0-9 +()-]{6,30}" value="${esc(saved.telefono || '')}"></label>
    <div class="field">¿Cómo lo recibís? *
      <div class="seg"><label><input type="radio" name="entrega" value="retiro" checked>Retiro en Ramallo</label><label><input type="radio" name="entrega" value="envio">Envío</label></div></div>
    <label class="field" id="dirField" hidden>Dirección de envío *<input name="direccion" autocomplete="street-address" value="${esc(saved.direccion || '')}"></label>
    <label class="field">Nota (opcional)<textarea name="nota" rows="2" style="min-height:64px" placeholder="Ej: lo paso a buscar el sábado"></textarea></label>
    <div class="form-msg" id="checkoutMsg" role="alert"></div>
  </form>`;
}
function bindCheckout() {
  const f = $('#checkout');
  f.addEventListener('change', () => { const env = f.entrega.value === 'envio'; $('#dirField').hidden = !env; f.direccion.required = env; });
  f.addEventListener('submit', submitOrder);
}
$('#cartBody').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
  if (q) { const l = cart[+q.dataset.q]; l.cantidad = Math.max(0, l.cantidad + +q.dataset.d); if (!l.cantidad) cart.splice(+q.dataset.q, 1); }
  else if (rm) cart.splice(+rm.dataset.rm, 1);
  else return;
  const keep = $('#checkout') && Object.fromEntries(new FormData($('#checkout')));
  saveCart(); renderCart();
  if (keep && $('#checkout')) Object.entries(keep).forEach(([k, v]) => { const el = $('#checkout').elements[k]; if (el && el.type !== 'radio' && !(el instanceof RadioNodeList)) el.value = v; });
});

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => 'ONG-' + Array.from(crypto.getRandomValues(new Uint8Array(4)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');

async function submitOrder(e) {
  e.preventDefault();
  const f = e.target, msg = $('#checkoutMsg');
  if (!f.checkValidity()) { f.classList.add('was-validated'); msg.className = 'form-msg err'; msg.textContent = 'Completá tu nombre y un WhatsApp válido' + (f.entrega.value === 'envio' ? ', y la dirección.' : '.'); f.querySelector(':invalid')?.focus(); return; }
  const d = Object.fromEntries(new FormData(f));
  try { localStorage.setItem('ong_buyer', JSON.stringify({ nombre: d.nombre, telefono: d.telefono, direccion: d.direccion || '' })); } catch {}
  const btn = $('#checkoutBtn'); btn.disabled = true; btn.textContent = 'Registrando pedido…';
  const items = cart.map(({ id, nombre, talle, cantidad, precio }) => ({ id, nombre, talle, cantidad, precio }));
  const total = cartTotal();
  let code = newCode(), saved = false;
  if (sb) {
    for (let t = 0; t < 3 && !saved; t++) {
      const { error } = await sb.from('pedidos').insert({ codigo: code, nombre: d.nombre.trim(), telefono: d.telefono.trim(), entrega: d.entrega, direccion: d.direccion || null, nota: d.nota || null, items, total, estado: 'nuevo' });
      if (!error) saved = true;
      else if (error.code === '23505') code = newCode();
      else { console.warn('pedido:', error.message); break; }
    }
  }
  const lines = items.map(l => `• ${l.cantidad} × ${l.nombre}${l.talle ? ` (talle ${l.talle})` : ''}: ${money(l.precio * l.cantidad)}`).join('\n');
  const text = `¡Hola! Quiero hacer un pedido en la tienda solidaria de la ONG.\n\nPedido: ${code}\n${lines}\nTotal: ${money(total)}\n\nNombre: ${d.nombre}\nEntrega: ${d.entrega === 'envio' ? 'Envío a ' + d.direccion : 'Retiro en Ramallo'}${d.nota ? `\nNota: ${d.nota}` : ''}\n\n¿Cómo sigo con el pago?`;
  const wa = C.WHATSAPP ? `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(text)}` : `https://ig.me/m/${C.INSTAGRAM}`;
  cart = []; saveCart();
  $('#cartTitle').textContent = 'Pedido registrado';
  $('#cartBody').innerHTML = `<div class="order-done">
      <p>Tu código de pedido es</p><div class="order-code">${code}</div>
      <p class="lead" style="margin-inline:auto">Último paso: ${C.WHATSAPP ? 'mandanos el mensaje por WhatsApp' : 'copiá el mensaje y mandánoslo por Instagram'} para coordinar el pago y la entrega.</p>
      ${saved ? '' : '<p style="color:var(--muted);font-size:.9rem">No pudimos guardar el pedido en el sistema, pero con el mensaje alcanza.</p>'}
    </div>`;
  $('#cartFoot').innerHTML = `<a class="btn btn-primary btn-block" href="${esc(wa)}" target="_blank" rel="noopener" id="waBtn">${icon(C.WHATSAPP ? 'chat' : 'ig')}${C.WHATSAPP ? 'Enviar por WhatsApp' : 'Abrir Instagram'}</a>
    <button class="btn btn-ghost btn-block" type="button" id="copyOrder" style="margin-top:8px">${icon('copy')}Copiar mensaje</button>`;
  $('#copyOrder').onclick = async () => { await copyText(text); toast('Mensaje copiado.'); };
  if (!C.WHATSAPP) copyText(text);
}

/* =====================================================================
   DONACIONES
   ===================================================================== */
async function loadCampaigns() {
  const el = $('#campaigns');
  if (!sb) return;
  const { data, error } = await sb.from('campanias_donacion').select('*').eq('activa', true).order('creado_en', { ascending: false });
  if (error) { console.warn('campañas:', error.message); return; }
  if (!data?.length) { el.hidden = true; return; }
  el.innerHTML = data.map(c => {
    const goal = Math.max(1, Number(c.objetivo) || 1), got = Number(c.recaudado) || 0;
    const pct = Math.min(100, Math.round(got / goal * 100));
    return `<article class="campaign" data-reveal>
      <div class="campaign-top"><h3>${esc(c.titulo)}</h3><span class="campaign-pct">${pct}%</span></div>
      ${c.descripcion ? `<p>${esc(c.descripcion)}</p>` : ''}
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Avance de la campaña"><span style="width:${pct}%"></span></div>
      <div class="campaign-total"><b>${money(got)}</b> recaudados de ${money(goal)}</div>
    </article>`;
  }).join('');
  watchReveal(el);
}
function renderAmounts() {
  const vals = [500, 1000, 2000, 5000, 10000, 50000];
  $('#amounts').innerHTML = vals.map(v => `<a class="amount" href="${esc(C.MP[v])}" target="_blank" rel="noopener">${money(v)}</a>`).join('')
    + `<a class="amount" href="${esc(C.MP[100000])}" target="_blank" rel="noopener">${money(100000)}</a>`
    + `<a class="amount" href="${esc(C.MP.otro)}" target="_blank" rel="noopener">Otro monto</a>`
    + `<a class="amount amount-month" href="${esc(C.MP.mensual)}" target="_blank" rel="noopener" style="grid-column:1/-1">${icon('repeat')}Donar todos los meses</a>`;
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch { const i = document.createElement('textarea'); i.value = t; i.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); } catch {} i.remove(); return true; }
}
$('#aliasBtn').addEventListener('click', async () => {
  await copyText(C.ALIAS);
  const l = $('#aliasLabel'); l.innerHTML = `${icon('check')}Copiado`; $('#aliasBtn').classList.add('copied');
  toast('Alias copiado: ' + C.ALIAS);
  setTimeout(() => { l.innerHTML = `${icon('copy')}Copiar`; $('#aliasBtn').classList.remove('copied'); }, 2200);
});

/* Accesos rápidos en el celular: aparecen después del hero y se esconden
   en el footer, en la sección de donar y con menús o diálogos abiertos. */
(() => {
  const dock = $('#dock'); if (!dock || !('IntersectionObserver' in window)) return;
  const seen = new Map();
  const update = () => {
    const pastHero = seen.get('hero') === false;
    const hide = seen.get('donar') || seen.get('footer');
    dock.classList.toggle('show', pastHero && !hide);
  };
  const ob = new IntersectionObserver(es => { es.forEach(e => seen.set(e.target.dataset.dockKey, e.isIntersecting)); update(); });
  [['hero', '.hero'], ['donar', '#donar'], ['footer', '.site-footer']].forEach(([k, sel]) => { const el = $(sel); if (el) { el.dataset.dockKey = k; ob.observe(el); } });
})();

/* Hero: la composición sigue al mouse (solo con mouse y sin "reducir movimiento") */
(() => {
  const vis = $('#heroVisual'), hero = $('.hero');
  if (!vis || reduced || !matchMedia('(pointer:fine)').matches) return;
  let raf = 0;
  hero.addEventListener('pointermove', e => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const r = vis.getBoundingClientRect();
      const mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)));
      const my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
      vis.style.setProperty('--mx', mx.toFixed(3)); vis.style.setProperty('--my', my.toFixed(3));
      raf = 0;
    });
  });
  hero.addEventListener('pointerleave', () => { vis.style.setProperty('--mx', 0); vis.style.setProperty('--my', 0); });
})();

/* Sin conexión: aviso arriba mientras no haya Internet */
const net = $('#net');
const netState = () => { net.hidden = navigator.onLine; if (navigator.onLine && net.dataset.was) toast('Conexión recuperada.'); net.dataset.was = navigator.onLine ? '' : '1'; };
addEventListener('online', netState); addEventListener('offline', netState);
if (!navigator.onLine) netState();

/* La app instalable se retiró: si algún navegador quedó con el service worker anterior, se limpia */
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
if ('caches' in window) caches.keys().then(ks => ks.filter(k => k.startsWith('ong-')).forEach(k => caches.delete(k))).catch(() => {});

/* ---------- Arranque ---------- */
updateCount();
renderAmounts();
loadDogs();
loadNews();
loadShop();
loadCampaigns();
})();
