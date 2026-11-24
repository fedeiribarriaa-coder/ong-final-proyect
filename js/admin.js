/* =====================================================================
   ONG Animales Ramallo · Panel del equipo V8
   ===================================================================== */
(() => {
'use strict';
const C = window.ONG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const icon = id => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const fdate = d => d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

let toastT;
const toast = (m, ms = 2800) => {
  const t = $('#toast'), err = /^(No se pudo|Sin conexión|Error)/.test(m);
  t.classList.toggle('err', err); t.setAttribute('role', err ? 'alert' : 'status');
  $('#toastIco').setAttribute('href', err ? '#i-alert' : '#i-check');
  $('#toastText').textContent = m; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), err ? Math.max(ms, 5000) : ms);
};

/* ---------- Supabase + sesión ---------- */
let sb = null;
try { sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }); }
catch (e) { console.error(e); }

const lm = $('#lm');
const setMsg = (t, cls = 'err') => { lm.innerHTML = t ? `${icon(cls === 'err' ? 'alert' : 'check')}<span>${esc(t)}</span>` : ''; lm.className = 'lg-msg ' + (t ? cls + ' show' : ''); };
/* Login: validación por campo, ver contraseña, aviso de mayúsculas */
const fieldErr = (inp, msg) => { const box = inp.closest('.lf'); box.classList.toggle('bad', !!msg); box.classList.remove('shake'); if (msg) { void box.offsetWidth; box.classList.add('shake'); } $('#' + inp.id + 'Err').textContent = msg || ''; inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
const checkEmail = () => { const v = $('#lu').value.trim(); fieldErr($('#lu'), !v ? 'Escribí tu email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Revisá el email: parece incompleto.' : ''); return !$('#lu').closest('.lf').classList.contains('bad'); };
const checkPass = () => { fieldErr($('#lp'), $('#lp').value ? '' : 'Escribí tu contraseña.'); return !!$('#lp').value; };
$('#lu').addEventListener('blur', () => { if ($('#lu').value) checkEmail(); });
['#lu', '#lp'].forEach(id => $(id).addEventListener('input', e => { const box = e.target.closest('.lf'); box.classList.toggle('filled', !!e.target.value); if (box.classList.contains('bad')) (id === '#lu' ? checkEmail : checkPass)(); if (lm.textContent) setMsg('', ''); }));
$('#lpEye').addEventListener('click', () => { const p = $('#lp'), show = p.type === 'password'; p.type = show ? 'text' : 'password'; $('#lpEye').setAttribute('aria-pressed', String(show)); $('#lpEye').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); $('#lpEye use').setAttribute('href', show ? '#i-eye-off' : '#i-eye'); p.focus(); });
['keydown', 'keyup'].forEach(ev => $('#lp').addEventListener(ev, e => { if (e.getModifierState) $('#lpCaps').hidden = !e.getModifierState('CapsLock'); }));
$('#lp').addEventListener('blur', () => { $('#lpCaps').hidden = true; });
function explainAuth(err) {
  const m = String(err?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'El email o la contraseña no son correctos.';
  if (m.includes('not confirmed')) return 'Este email todavía no está confirmado en Supabase.';
  if (m.includes('fetch') || m.includes('network')) return 'Sin conexión. Revisá Internet y probá de nuevo.';
  return 'No se pudo iniciar sesión. Probá de nuevo en un momento.';
}
function showApp(on, user) {
  $('#loginGate').hidden = on; $('#app').hidden = !on;
  if (on) { const em = user?.email || ''; $('#who').textContent = em; $('#who2').textContent = em; $('#meAv').textContent = (em[0] || 'O').toUpperCase(); loadAll(); }
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!sb) return setMsg('No se pudo cargar la conexión. Recargá la página.');
  const email = $('#lu').value.trim(), password = $('#lp').value;
  const okE = checkEmail(), okP = checkPass();
  if (!okE || !okP) { (okE ? $('#lp') : $('#lu')).focus(); return; }
  const b = $('#loginBtn'); b.disabled = true; b.classList.add('loading'); setMsg('', '');
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { $('#loginForm').classList.remove('shake'); void lm.offsetWidth; $('#loginForm').classList.add('shake'); return setMsg(explainAuth(error)); }
    if (!data?.session) return setMsg('No se pudo abrir la sesión. Probá de nuevo.');
    b.classList.remove('loading'); b.classList.add('done'); $('.lg-btn-t', b).textContent = '¡Bienvenido!';
    await new Promise(r => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650));
    $('#lp').value = ''; showApp(true, data.user);
  } catch (err) { setMsg(explainAuth(err)); }
  finally { b.disabled = false; b.classList.remove('loading'); setTimeout(() => { b.classList.remove('done'); $('.lg-btn-t', b).textContent = 'Entrar al panel'; }, 900); }
});
$('#logout').addEventListener('click', async () => { await sb?.auth.signOut(); showApp(false); setMsg('', ''); });
(async () => {
  if (!sb) return setMsg('No se pudo cargar la conexión. Recargá la página.');
  const { data } = await sb.auth.getSession();
  if (data?.session) showApp(true, data.session.user);
})();

/* ---------- Datos ---------- */
const S = { animales: [], solicitudes_adopcion: [], pedidos: [], productos: [], novedades: [], campanias_donacion: [] };
const missing = new Set();
const ORDER = {
  animales: ['orden', true], solicitudes_adopcion: ['creado_en', false], pedidos: ['creado_en', false],
  productos: ['orden', true], novedades: ['creado_en', false], campanias_donacion: ['creado_en', false]
};
async function fetchTable(t) {
  let q = sb.from(t).select('*');
  const [col, asc] = ORDER[t];
  q = q.order(col, { ascending: asc, nullsFirst: false });
  if (t === 'solicitudes_adopcion' || t === 'pedidos') q = q.limit(300);
  let { data, error } = await q;
  if (error && error.code === '42703') ({ data, error } = await sb.from(t).select('*').limit(300)); // falta columna de orden
  if (error) { console.warn(t, error); missing.add(t); return; }
  missing.delete(t); S[t] = data || [];
}
const SKEL = {
  resumen: () => `<div class="sk sk-today"></div><div class="cards">${'<div class="sk sk-stat"></div>'.repeat(4)}</div><div class="dash"><div class="sk sk-panel"></div><div class="dash-side"><div class="sk sk-side"></div><div class="sk sk-side"></div></div></div>`,
  perros: () => `<div class="sk sk-bar"></div><div class="dog-admin">${'<div class="sk sk-dog"></div>'.repeat(8)}</div>`,
  list: () => `<div class="sk sk-bar"></div><div class="panel">${'<div class="sk-row"><span class="sk sk-av"></span><span class="sk sk-line"></span><span class="sk sk-pill"></span></div>'.repeat(5)}</div>`
};
let loading = false;
async function loadAll(quiet = false) {
  if (loading) return; loading = true;
  $$('#refresh, #refreshM').forEach(b => { b.classList.add('spin'); b.disabled = true; });
  if (!quiet || !$('#view').children.length) $('#view').innerHTML = (SKEL[tab] || SKEL.list)();
  await Promise.all(Object.keys(S).map(fetchTable));
  loading = false;
  $$('#refresh, #refreshM').forEach(b => { b.classList.remove('spin'); b.disabled = false; });
  badges(); render();
  if (quiet) toast('Datos actualizados.');
}
function badges() {
  const ns = S.solicitudes_adopcion.filter(r => (r.estado || 'nueva') === 'nueva').length;
  const np = S.pedidos.filter(r => r.estado === 'nuevo').length;
  ['#nSol', '#nSol2'].forEach(id => $(id).textContent = ns || ''); ['#nPed', '#nPed2'].forEach(id => $(id).textContent = np || '');
}
$('#refresh').addEventListener('click', () => loadAll(true));
$('#refreshM').addEventListener('click', () => loadAll(true));
/* Guardando: el control que disparó el cambio muestra que está trabajando */
document.addEventListener('change', e => { if (e.target.matches('.sel[data-sol], .sel[data-ped], .sel[data-dog-state]')) { e.target.classList.add('saving'); e.target.disabled = true; } });
/* Hojas inferiores en el celular: se cierran arrastrando hacia abajo desde la manija o el encabezado */
function dragClose(d, handleSel, scroller) {
  let y0 = null, dy = 0, t0 = 0;
  d.addEventListener('touchstart', e => {
    if (innerWidth > 900 || !e.target.closest(handleSel)) return;
    const sc = scroller ? d.querySelector(scroller) : d; if (sc && sc.scrollTop > 0) return;
    y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); d.style.transition = 'none';
  }, { passive: true });
  d.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); d.style.transform = `translateY(${dy}px)`; }, { passive: true });
  d.addEventListener('touchend', () => {
    if (y0 === null) return; y0 = null;
    d.style.transition = 'transform .28s cubic-bezier(.16,1,.3,1)';
    if (dy > 120 || (dy > 50 && Date.now() - t0 < 250)) { d.style.transform = 'translateY(100%)'; setTimeout(() => { d.close(); d.style.transform = ''; d.style.transition = ''; }, 260); }
    else d.style.transform = '';
  });
}
/* Sin conexión */
const netState = () => { $('#net').hidden = navigator.onLine; if (navigator.onLine && $('#net').dataset.was) { toast('Conexión recuperada.'); loadAll(true); } $('#net').dataset.was = navigator.onLine ? '' : '1'; };
addEventListener('online', netState); addEventListener('offline', netState);
if (!navigator.onLine) netState();
/* Celular: hoja "Más" y panel de detalle */
const more = $('#more'), sheet = $('#sheet');
$('#moreBtn').addEventListener('click', () => more.showModal());
more.addEventListener('click', e => { if (e.target === more) more.close(); });
$('[data-logout]').addEventListener('click', () => { more.close(); $('#logout').click(); });
sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-sheet-close]')) sheet.close(); });
function openSheet(html, bind) {
  $('#sheetBody').innerHTML = `<div class="grip" aria-hidden="true"><span></span></div><button class="icon-btn sheet-x" type="button" data-sheet-close aria-label="Cerrar">${icon('x')}</button>` + html;
  if (!sheet.open) sheet.showModal();
  bind?.($('#sheetBody'));
}

const setupWarn = tables => {
  const miss = tables.filter(t => missing.has(t));
  return miss.length ? `<div class="setup-warn"><b>Falta actualizar la base de datos.</b> Ejecutá el archivo <code>supabase/02-actualizacion-v8.sql</code> en Supabase → SQL Editor y tocá “Actualizar”. (Tablas: ${miss.join(', ')})</div>` : '';
};

/* ---------- Navegación ---------- */
let tab = (location.hash.slice(1) || 'resumen');
const TITLES = {
  resumen: ['Resumen', 'Lo que necesita atención hoy.'],
  perros: ['Perros', 'Los que se muestran en la web para adopción.'],
  solicitudes: ['Solicitudes de adopción', 'Las fotos y el detalle completo también llegan por mail.'],
  pedidos: ['Pedidos de la tienda', 'Cada pedido tiene un código que el comprador te manda por WhatsApp.'],
  tienda: ['Productos', 'El merchandising que se ve en la tienda solidaria de la web.'],
  novedades: ['Novedades', 'Noticias propias y reposteos de Instagram.'],
  campanias: ['Campañas de donación', 'Actualizá lo recaudado para que la barra avance en la web.']
};
document.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; if (more.open) more.close(); go(b.dataset.tab); });
function go(t) { tab = TITLES[t] ? t : 'resumen'; history.replaceState(null, '', '#' + tab); render(); scrollTo({ top: 0 }); }
const filters = { perros: 'disponible', solicitudes: 'nueva', pedidos: 'nuevo' };

function render() {
  if (!TITLES[tab]) tab = 'resumen';
  $$('[data-tab]').forEach(b => b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('#moreBtn').classList.toggle('on', ['tienda', 'novedades', 'campanias'].includes(tab));
  $('#viewTitle').textContent = TITLES[tab][0]; $('#viewSub').textContent = TITLES[tab][1];
  $('#appbarTitle').textContent = TITLES[tab][0];
  $('#viewAction').innerHTML = '';
  const v = $('#view'); v.classList.remove('view'); void v.offsetWidth; v.classList.add('view');
  VIEWS[tab]();
}
const action = (label, fn, id = 'mainAction') => { $('#viewAction').innerHTML = `<button class="btn btn-terra btn-sm" id="${id}" type="button">${icon('plus')}${label}</button>`; $('#' + id).onclick = fn; };
const action2 = (label, fn) => { const b = document.createElement('button'); b.className = 'btn btn-ghost btn-sm'; b.type = 'button'; b.innerHTML = icon('ig') + label; b.onclick = fn; $('#viewAction').prepend(b); };
const filterBar = (key, opts, rows, field, dflt) => `<div class="filters" data-filter="${key}">${opts.map(([v, l]) => {
  const n = v === '*' ? rows.length : rows.filter(r => (r[field] || dflt) === v).length;
  return `<button class="filter" type="button" data-v="${v}" aria-pressed="${filters[key] === v}">${l}<em>${n}</em></button>`; }).join('')}</div>`;
document.addEventListener('click', e => {
  const f = e.target.closest('[data-filter] .filter'); if (!f) return;
  filters[f.parentElement.dataset.filter] = f.dataset.v; render();
});
const AV = [['var(--terracotta-soft)', 'var(--terracotta-deep)'], ['var(--earth-4)', 'var(--earth)'], ['var(--sun-soft)', '#6A4200'], ['var(--sun-mist)', 'var(--earth)']];
const avatar = name => { const t = String(name || '?').trim(); const ini = t.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'; const [bg, fg] = AV[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length]; return `<span class="avatar" style="--av:${bg};--av-ink:${fg}" aria-hidden="true">${esc(ini)}</span>`; };
const emptyBox = (ic, title, text, btn = '') => `<div class="empty">${icon(ic)}<b>${title}</b><span>${text}</span>${btn}</div>`;

/* ---------- Helpers de base ---------- */
async function update(table, id, patch, okMsg) {
  const { error } = await sb.from(table).update(patch).eq('id', id);
  if (error) { console.error(error); toast('No se pudo guardar: ' + humanErr(error)); render(); return false; }
  const row = S[table].find(r => String(r.id) === String(id)); if (row) Object.assign(row, patch);
  if (okMsg) toast(okMsg); badges(); return true;
}
function ask({ title, text = '', ok = 'Confirmar', danger = false }) {
  return new Promise(res => {
    const d = $('#confirm');
    $('#cfTitle').textContent = title; $('#cfText').textContent = text;
    const okb = $('#cfOk'); okb.textContent = ok; okb.className = 'btn btn-sm ' + (danger ? 'btn-danger' : 'btn-terra');
    $('#cfIco').setAttribute('href', danger ? '#i-trash' : '#i-alert');
    d.classList.toggle('danger', danger);
    const done = v => { d.close(); res(v); };
    okb.onclick = () => done(true); $('#cfNo').onclick = () => done(false);
    d.onclick = e => { if (e.target === d) done(false); };
    d.oncancel = e => { e.preventDefault(); done(false); };
    d.showModal(); $('#cfNo').focus();
  });
}
async function remove(table, id, what) {
  if (!await ask({ title: `¿Borrar ${what}?`, text: 'Esta acción no se puede deshacer.', ok: 'Borrar', danger: true })) return;
  const el = document.querySelector(`[data-del="${CSS.escape(String(id))}"]`)?.closest('.row');
  el?.classList.add('removing');
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) { el?.classList.remove('removing'); return toast('No se pudo borrar: ' + humanErr(error)); }
  await new Promise(r => setTimeout(r, 260));
  S[table] = S[table].filter(r => String(r.id) !== String(id)); toast('Borrado.'); render();
}
function humanErr(e) {
  const m = String(e?.message || '');
  if (e?.code === '42P01') return 'falta crear la tabla (ejecutá el SQL de actualización).';
  if (e?.code === '42703') return 'falta una columna (ejecutá el SQL de actualización).';
  if (e?.code === '22P02' || m.includes('enum')) return 'valor no permitido por la base: ' + m;
  if (e?.code === '23502') return 'falta un dato obligatorio en la base: ' + m;
  if (m.toLowerCase().includes('row-level security') || e?.code === '42501') return 'sin permiso (revisá las políticas RLS).';
  return m || 'error desconocido';
}
const waLink = (tel, text = '') => {
  let d = String(tel || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = d.slice(1);
  if (!d.startsWith('54')) d = '549' + d;
  return `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}`;
};

/* ---------- Subida de imágenes (se comprimen antes de subir) ---------- */
async function compress(file, max = 1400, q = .82) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const bmp = await createImageBitmap(file).catch(() => null); if (!bmp) return file;
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return await new Promise(r => cv.toBlob(b => r(b || file), 'image/jpeg', q));
}
async function upload(file, folder) {
  const blob = await compress(file);
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  const { error } = await sb.storage.from('media').upload(name, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error('No se pudo subir la foto: ' + (error.message || '') + ' (¿ejecutaste el SQL de actualización?)');
  return sb.storage.from('media').getPublicUrl(name).data.publicUrl;
}

/* ---------- Editor genérico ---------- */
let edSave = null;
function openEditor({ title, fields, values = {}, onSave, saveLabel = 'Guardar' }) {
  $('#edTitle').textContent = title; $('#edSave').textContent = saveLabel; $('#edMsg').textContent = '';
  $('#edBody').innerHTML = fields.map(f => fieldHTML(f, values)).join('');
  $$('#edBody input[type=file]').forEach(inp => inp.addEventListener('change', () => {
    const f = inp.files[0]; if (!f) return;
    const box = inp.closest('.img-pick').firstElementChild;
    const img = document.createElement('img'); img.src = URL.createObjectURL(f); img.alt = ''; box.replaceWith(img);
  }));
  edSave = { fields, onSave, values };
  $('#editor').showModal();
  $('#edBody').querySelector('input:not([type=hidden]),textarea,select')?.focus();
  $('#edBody').dispatchEvent(new Event('input'));
}
function fieldHTML(f, values) {
  const v = values[f.name];
  const req = f.required ? 'required' : '', val = v ?? f.default ?? '';
  const hint = f.hint ? `<span class="hint">${f.hint}</span>` : '';
  const wrap = inner => `<label class="field"${f.show ? ` data-show="${f.show}"` : ''}>${esc(f.label)}${f.required ? ' *' : ''}${hint}${inner}</label>`;
  switch (f.type) {
    case 'textarea': return wrap(`<textarea name="${f.name}" ${req} rows="${f.rows || 5}" placeholder="${esc(f.placeholder || '')}">${esc(val)}</textarea>`);
    case 'select': return wrap(`<select name="${f.name}" ${req}>${f.options.map(([o, l]) => `<option value="${esc(o)}" ${String(val) === String(o) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`);
    case 'check': return `<label class="check"${f.show ? ` data-show="${f.show}"` : ''}><input type="checkbox" name="${f.name}" ${val === true || (val === '' && f.default) ? 'checked' : ''}>${esc(f.label)}</label>`;
    case 'image': return `<div class="field"${f.show ? ` data-show="${f.show}"` : ''}>${esc(f.label)}${hint}<div class="img-pick">${val ? `<img src="${esc(val)}" alt="">` : '<span class="ph">Sin foto</span>'}<input type="file" name="${f.name}" accept="image/*"></div></div>`;
    case 'row': return `<div class="grid2">${f.fields.map(x => fieldHTML(x, values)).join('')}</div>`;
    case 'html': return f.html;
    default: return wrap(`<input name="${f.name}" type="${f.type || 'text'}" ${req} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.step ? `step="${f.step}"` : ''} placeholder="${esc(f.placeholder || '')}" value="${esc(val)}" ${f.type === 'number' ? 'inputmode="numeric"' : ''}>`);
  }
}
const flat = fields => fields.flatMap(f => f.type === 'row' ? f.fields : [f]);

$('#editor').addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === $('#editor')) $('#editor').close(); });
$('#edForm').addEventListener('input', () => {
  // campos condicionales: data-show="campo=valor"
  $$('#edBody [data-show]').forEach(el => { const [k, v] = el.dataset.show.split('='); const cur = $('#edForm').elements[k]?.value; el.hidden = cur !== v; });
});
$('#edForm').addEventListener('change', () => $('#edForm').dispatchEvent(new Event('input')));
$('#edForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target, msg = $('#edMsg');
  const visibleInvalid = $$(':invalid', form).filter(el => !el.closest('[hidden]'));
  if (visibleInvalid.length) { msg.className = 'form-msg err'; msg.textContent = 'Completá los campos obligatorios.'; visibleInvalid[0].focus(); return; }
  const out = {};
  const btn = $('#edSave'); btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Guardando…';
  try {
    for (const f of flat(edSave.fields)) {
      if (!f.name || f.type === 'html') continue;
      const el = form.elements[f.name]; if (!el) continue;
      if (f.show && el.closest('[hidden]')) continue;
      if (f.type === 'check') out[f.name] = el.checked;
      else if (f.type === 'image') { if (el.files[0]) { msg.textContent = 'Subiendo foto…'; out[f.name] = await upload(el.files[0], f.folder || 'otros'); } }
      else if (f.type === 'number') out[f.name] = el.value === '' ? null : Number(el.value);
      else out[f.name] = el.value.trim() === '' ? null : el.value.trim();
    }
    await edSave.onSave(out);
    $('#editor').close(); render();
  } catch (err) { console.error(err); msg.className = 'form-msg err'; msg.textContent = err.message || 'No se pudo guardar.'; }
  finally { btn.disabled = false; if (msg.textContent === 'Guardando…') msg.textContent = ''; }
});
async function save(table, id, payload) {
  const q = id ? sb.from(table).update(payload).eq('id', id).select().single() : sb.from(table).insert(payload).select().single();
  const { data, error } = await q;
  if (error) throw new Error('No se pudo guardar: ' + humanErr(error));
  if (id) Object.assign(S[table].find(r => String(r.id) === String(id)) || {}, data);
  else S[table].unshift(data);
  toast('Guardado.'); badges();
}

/* =====================================================================
   VISTAS
   ===================================================================== */
const VIEWS = {};

VIEWS.resumen = () => {
  const sol = S.solicitudes_adopcion, ped = S.pedidos, A = S.animales;
  const nSol = sol.filter(r => (r.estado || 'nueva') === 'nueva').length;
  const nPed = ped.filter(r => r.estado === 'nuevo').length;
  const disp = A.filter(a => a.estado === 'disponible').length, proc = A.filter(a => a.estado === 'en_proceso').length, adop = A.filter(a => a.estado === 'adoptado').length;
  const camps = S.campanias_donacion.filter(c => c.activa);
  const h = new Date().getHours(), hi = h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todo = [
    nSol && { ic: 'inbox', t: `${nSol} ${nSol === 1 ? 'solicitud nueva espera' : 'solicitudes nuevas esperan'} respuesta`, go: 'solicitudes', tone: 't-terra' },
    nPed && { ic: 'receipt', t: `${nPed} ${nPed === 1 ? 'pedido' : 'pedidos'} sin confirmar por WhatsApp`, go: 'pedidos', tone: 't-sun' },
    !A.length && !missing.has('animales') && { ic: 'paw', t: 'Importá los perros de la web para poder editarlos', go: 'perros', tone: 't-earth' }
  ].filter(Boolean);
  $('#viewTitle').textContent = hi; $('#viewSub').textContent = today.charAt(0).toUpperCase() + today.slice(1);
  $('#view').innerHTML = setupWarn(['animales', 'pedidos', 'productos', 'novedades']) + `
    <section class="today ${todo.length ? '' : 'clear'}">
      ${todo.length ? `<h2>Para hacer hoy</h2><ul>${todo.map(x => `<li><button type="button" data-go="${x.go}" class="${x.tone}">${icon(x.ic)}<span>${x.t}</span>${icon('arrow')}</button></li>`).join('')}</ul>`
        : `${icon('check')}<div><h2>Todo al día</h2><p>No hay solicitudes ni pedidos esperando respuesta.</p></div>`}
    </section>
    <div class="cards">
      <button class="stat t-terra${nSol ? ' hot' : ''}" data-go="solicitudes" type="button"><span>Solicitudes nuevas</span><b>${nSol}</b>${icon('inbox')}<small>${sol.length} en total</small></button>
      <button class="stat t-sun${nPed ? ' hot' : ''}" data-go="pedidos" type="button"><span>Pedidos sin confirmar</span><b>${nPed}</b>${icon('receipt')}<small>${ped.length} en total</small></button>
      <button class="stat t-earth" data-go="perros" type="button"><span>Perros publicados</span><b>${disp + proc}</b>${icon('paw')}<small>${adop} ${adop === 1 ? 'adoptado' : 'adoptados'}</small></button>
      <button class="stat t-peach" data-go="campanias" type="button"><span>Campañas activas</span><b>${camps.length}</b>${icon('heart')}<small>Visibles en la web</small></button>
    </div>
    <div class="dash">
      <div class="dash-col">
      <section class="panel pad"><div class="panel-head flat"><div><h2>Solicitudes por semana</h2><p class="sub sm">Últimas 8 semanas · ${weekly(sol).reduce((a, w) => a + w.c, 0)} en total</p></div><button class="link-btn" data-go="solicitudes" type="button">Ver solicitudes ${icon('arrow')}</button></div>
        ${sol.length ? colChart(weekly(sol), 'solicitudes') : `<p class="sub">Cuando lleguen solicitudes vas a ver acá cómo evolucionan semana a semana.</p>`}
      </section>
      <section class="panel dash-main"><div class="panel-head"><h2>Últimas solicitudes</h2><button class="link-btn" data-go="solicitudes" type="button">Ver todas ${icon('arrow')}</button></div>
        ${sol.length ? solTable(sol.slice(0, 5)) : emptyBox('inbox', 'Sin solicitudes todavía', 'Cuando alguien complete el formulario de adopción va a aparecer acá.')}
      </section>
      </div>
      <div class="dash-side">
        <section class="panel pad"><div class="panel-head flat"><h2>Perros</h2><button class="link-btn" data-go="perros" type="button">Gestionar ${icon('arrow')}</button></div>
          ${A.length ? barList([['Disponibles', disp], ['En proceso', proc], ['Adoptados', adop]]) : `<p class="sub">Todavía no hay perros en la base.</p>`}
        </section>
        <section class="panel pad"><div class="panel-head flat"><h2>Pedidos por estado</h2><button class="link-btn" data-go="pedidos" type="button">Ver ${icon('arrow')}</button></div>
          ${ped.length ? barList(Object.entries(PED_LABEL).map(([k, l]) => [l, ped.filter(p => p.estado === k).length])) : `<p class="sub">Todavía no hay pedidos.</p>`}
        </section>
        <section class="panel pad"><div class="panel-head flat"><h2>Campañas</h2><button class="link-btn" data-go="campanias" type="button">Ver ${icon('arrow')}</button></div>
          ${camps.length ? camps.slice(0, 3).map(c => { const pct = Math.min(100, Math.round((Number(c.recaudado) || 0) / Math.max(1, Number(c.objetivo) || 1) * 100));
            return `<div class="camp"><div><b>${esc(c.titulo)}</b><span>${pct}%</span></div><div class="meter"><span style="--w:${pct / 100}"></span></div><small>${money(c.recaudado)} de ${money(c.objetivo)}</small></div>`; }).join('')
          : `<p class="sub">No hay campañas activas.</p>`}
        </section>
      </div>
    </div>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Últimos pedidos</h2><button class="link-btn" data-go="pedidos" type="button">Ver todos ${icon('arrow')}</button></div>
      ${ped.length ? pedTable(ped.slice(0, 5)) : emptyBox('receipt', 'Sin pedidos todavía', 'Cargá productos y van a aparecer en la tienda de la web.')}
    </section>`;
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  bindSolTable(); bindPedTable();
};

/* ---------- Perros ---------- */
const DOG_STATES = [['disponible', 'Disponible'], ['en_proceso', 'En proceso'], ['adoptado', 'Adoptado']];
/* La base real usa sexo / edad_aproximada / tamanio / castrado / vacunas_al_dia / foto_principal.
   Los campos de la V8 (foto_url, orden, destacado) se usan solo si existen. */
const dogCols = () => new Set(S.animales[0] ? Object.keys(S.animales[0]) : []);
const hasV8 = () => dogCols().has('foto_url');
const photoCol = () => hasV8() ? 'foto_url' : 'foto_principal';
const dogFicha = a => a.ficha || [a.edad_aproximada, a.tamanio, a.sexo].filter(Boolean).join(' · ');
const dogPhoto = a => a.foto_url || a.foto_principal || 'assets/images/dog.png';
const dogFields = () => {
  const v8 = hasV8();
  return [
    { name: 'nombre', label: 'Nombre', required: true },
    { type: 'row', fields: [
      { name: 'sexo', label: 'Sexo', type: 'select', options: [['', 'Sin dato'], ['Hembra', 'Hembra'], ['Macho', 'Macho']] },
      { name: 'edad_aproximada', label: 'Edad aproximada', placeholder: 'Ej: 3 años o 2 meses' } ] },
    { name: 'tamanio', label: 'Tamaño', type: 'select', options: [['', 'Sin dato'], ['Chico', 'Chico'], ['Mediano', 'Mediano'], ['Grande', 'Grande'], ['XXL', 'XXL']], hint: 'Con edad, tamaño y sexo la gente puede filtrarlo en la web.' },
    { type: 'row', fields: [
      { name: 'castrado', label: 'Está castrado/a', type: 'check' },
      { name: 'vacunas_al_dia', label: 'Vacunas al día', type: 'check' } ] },
    { name: 'historia', label: 'Su historia', type: 'textarea', rows: 7, hint: 'Cómo es, cómo se lleva con otros, cómo fue el rescate.' },
    { name: photoCol(), label: 'Foto principal', type: 'image', folder: 'perros', hint: 'Vertical, con buena luz. Se comprime sola.' },
    v8 ? { type: 'row', fields: [
      { name: 'estado', label: 'Estado', type: 'select', options: DOG_STATES, default: 'disponible' },
      { name: 'orden', label: 'Orden en la web', type: 'number', min: 0, default: 100, hint: 'Menor = aparece antes' } ] }
      : { name: 'estado', label: 'Estado', type: 'select', options: DOG_STATES, default: 'disponible' },
    v8 && { name: 'destacado', label: 'Destacado (aparece primero y en la portada)', type: 'check' }
  ].filter(Boolean);
};
const editDog = d => openEditor({ title: d ? `Editar a ${d.nombre}` : 'Nuevo perro', fields: dogFields(), values: d || {}, onSave: v => {
  const pc = photoCol();
  if (!d && !v[pc]) throw new Error('Subí una foto: es lo primero que ve la gente.');
  if (d && !v[pc]) delete v[pc];
  return save('animales', d?.id, v);
} });
/* Registros repetidos: mismo nombre. Se comparan datos y fechas; nunca se borra solo. */
const normName = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function dupGroups() {
  const g = {}; S.animales.forEach(a => (g[normName(a.nombre)] ||= []).push(a));
  return Object.values(g).filter(l => l.length > 1);
}
const DUP_KEYS = [['sexo', 'Sexo'], ['edad_aproximada', 'Edad'], ['tamanio', 'Tamaño'], ['castrado', 'Castrado'], ['vacunas_al_dia', 'Vacunas'], ['historia', 'Historia'], ['estado', 'Estado']];
function openDups() {
  const groups = dupGroups();
  const card = (a, list) => {
    const newest = list.reduce((m, x) => String(x.actualizado_en || x.creado_en) > String(m.actualizado_en || m.creado_en) ? x : m, list[0]);
    const filled = DUP_KEYS.filter(([k]) => a[k] !== null && a[k] !== undefined && a[k] !== '').length;
    return `<div class="dup-card${a === newest ? ' keep' : ''}">
      <img src="${esc(dogPhoto(a))}" alt="" loading="lazy">
      <div><b>${esc(a.nombre)}</b><small class="code">ID ${esc(String(a.id).slice(0, 8))}</small>
      <small>Creado ${fdate(a.creado_en)}</small><small>Editado ${fdate(a.actualizado_en || a.creado_en)}</small>
      <small>${filled} de ${DUP_KEYS.length} datos completos</small>
      ${a === newest ? `<span class="pill ok">Más reciente</span>` : ''}</div>
      <button class="btn btn-ghost btn-sm danger-btn" type="button" data-dup-del="${esc(a.id)}">${icon('trash')}Borrar este</button></div>`;
  };
  openSheet(`<header class="sheet-head"><span class="avatar" style="--av:var(--sun-mist);--av-ink:var(--earth)">${icon('paw')}</span><div><h2 id="sheetTitle">Perros cargados dos veces</h2><p class="sub">${groups.length} ${groups.length === 1 ? 'caso' : 'casos'} con el mismo nombre</p></div></header>
    <p class="sheet-note">${icon('alert')}Comparamos los datos de cada par. Nada se borra solo: elegí vos cuál quitar. Conviene conservar el más reciente o el que tenga más datos.</p>
    ${groups.map(list => {
      const diff = DUP_KEYS.filter(([k]) => new Set(list.map(a => JSON.stringify(a[k] ?? null))).size > 1).map(([, l]) => l);
      const samePhoto = new Set(list.map(dogPhoto)).size === 1;
      return `<section class="dup"><div class="dup-h"><b>${esc(list[0].nombre)}</b><span class="pill ${diff.length ? 'en_revision' : 'ok'}">${diff.length ? 'Datos distintos: ' + diff.join(', ') : 'Datos idénticos'}</span></div>
        <div class="dup-row">${list.map(a => card(a, list)).join('')}</div>${samePhoto ? '' : ''}</section>`; }).join('')}`,
  root => $$('[data-dup-del]', root).forEach(b => b.onclick = async () => {
    const a = S.animales.find(x => String(x.id) === b.dataset.dupDel);
    if (!await ask({ title: `¿Borrar este registro de ${a.nombre}?`, text: `Se borra el registro con ID ${String(a.id).slice(0, 8)}. El otro registro de ${a.nombre} queda en la web. Esta acción no se puede deshacer.`, ok: 'Borrar registro', danger: true })) return;
    b.classList.add('loading');
    const { error } = await sb.from('animales').delete().eq('id', a.id);
    if (error) { b.classList.remove('loading'); return toast('No se pudo borrar: ' + humanErr(error)); }
    S.animales = S.animales.filter(x => x !== a); toast(`Registro duplicado de ${a.nombre} borrado.`);
    render(); dupGroups().length ? openDups() : sheet.close();
  }));
}

VIEWS.perros = () => {
  action('Nuevo perro', () => editDog());
  const all = S.animales;
  if (!all.length && !missing.has('animales')) {
    $('#view').innerHTML = `<div class="panel">${emptyBox('paw', 'Todavía no hay perros cargados en la base', `La web está mostrando los ${C.PERROS_RESPALDO.length} perros que venían escritos en el código. Importalos para poder editarlos, cambiar fotos y marcarlos como adoptados.`, `<button class="btn btn-primary" id="importDogs" type="button">Importar los ${C.PERROS_RESPALDO.length} perros actuales</button>`)}</div>`;
    $('#importDogs').onclick = importDogs; return;
  }
  const q = (filters.qDog || '').toLowerCase();
  let rows = filters.perros === '*' ? all : all.filter(a => a.estado === filters.perros);
  if (q) rows = rows.filter(a => (a.nombre || '').toLowerCase().includes(q));
  const dups = dupGroups();
  const schemaWarn = all.length && !hasV8() ? `<div class="setup-warn"><div><b>La base de perros tiene la estructura anterior.</b> Podés editar y cambiar el estado sin problema. Para usar "Destacado" y el orden en la web, ejecutá <code>supabase/02-actualizacion-v8.sql</code> en Supabase.</div></div>` : '';
  const dupBanner = dups.length ? `<button class="dup-banner" type="button" id="openDups">${icon('alert')}<span><b>${dups.length} ${dups.length === 1 ? 'perro aparece' : 'perros aparecen'} dos veces</b><small>Revisá cada caso y elegí cuál conservar. No se borra nada solo.</small></span>${icon('arrow')}</button>` : '';
  $('#view').innerHTML = setupWarn(['animales']) + schemaWarn + dupBanner + `<div class="toolbar">${filterBar('perros', [['disponible', 'Disponibles'], ['en_proceso', 'En proceso'], ['adoptado', 'Adoptados'], ['*', 'Todos']], all, 'estado', 'disponible')}
    <label class="search">${icon('search')}<input type="search" id="qDog" placeholder="Buscar por nombre" value="${esc(filters.qDog || '')}" aria-label="Buscar perros"></label></div>` +
    (rows.length ? '<div class="dog-admin">' + rows.map(a => `
      <article class="dcard${a.estado === 'adoptado' ? ' off' : ''}">
        <div class="dcard-photo"><img src="${esc(dogPhoto(a))}" alt="" loading="lazy">
          <span class="pill ${a.estado === 'disponible' ? 'ok' : a.estado === 'en_proceso' ? 'en_revision' : 'off'}">${esc((DOG_STATES.find(x => x[0] === a.estado) || [, a.estado])[1])}</span>
          ${hasV8() ? `<button class="tool" type="button" data-star="${esc(a.id)}" aria-pressed="${!!a.destacado}" title="${a.destacado ? 'Quitar de destacados' : 'Destacar en la portada'}" aria-label="Destacar a ${esc(a.nombre)}">${icon('pin')}</button>` : ''}
          ${dupGroups().some(l => l.includes(a)) ? '<span class="dup-tag">Repetido</span>' : ''}</div>
        <div class="dcard-body">
          <div><b>${esc(a.nombre)}</b><small>${esc(dogFicha(a) || 'Sin edad, tamaño ni sexo')}</small></div>
          <div class="dcard-actions">
            <select class="sel" data-dog-state="${esc(a.id)}" aria-label="Estado de ${esc(a.nombre)}">${DOG_STATES.map(([v, l]) => `<option value="${v}" ${a.estado === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <button class="tool" type="button" data-edit="${esc(a.id)}" title="Editar" aria-label="Editar a ${esc(a.nombre)}">${icon('edit')}</button>
          </div>
        </div></article>`).join('') + '</div>' : `<div class="panel">${emptyBox('paw', 'Nada en esta lista', 'Probá con otro filtro.')}</div>`);
  $$('[data-dog-state]').forEach(s => s.onchange = async () => { if (await update('animales', s.dataset.dogState, { estado: s.value }, s.value === 'adoptado' ? '¡Qué alegría! Ya no se muestra en la web.' : 'Estado actualizado.')) render(); else render(); });
  $$('[data-star]').forEach(b => b.onclick = async () => { const a = S.animales.find(x => String(x.id) === b.dataset.star); if (await update('animales', a.id, { destacado: !a.destacado })) render(); });
  $$('[data-edit]').forEach(b => b.onclick = () => editDog(S.animales.find(x => String(x.id) === b.dataset.edit)));
  $('#openDups')?.addEventListener('click', openDups);
  const inp = $('#qDog'); if (inp) inp.oninput = () => { filters.qDog = inp.value; const pos = inp.selectionStart; VIEWS.perros(); const n = $('#qDog'); n.focus(); n.setSelectionRange(pos, pos); };
};
async function importDogs() {
  const b = $('#importDogs'); b.disabled = true; b.textContent = 'Importando…';
  const base = location.href.replace(/admin(\.html)?.*$/, '');
  const rows = C.PERROS_RESPALDO.map((d, i) => ({ nombre: d.nombre, ficha: d.ficha || null, historia: d.historia || null, foto_url: base + d.foto_url, estado: 'disponible', orden: (i + 1) * 10, destacado: !!d.destacado }));
  const { error } = await sb.from('animales').insert(rows);
  if (error) { b.disabled = false; b.textContent = 'Reintentar'; return toast('No se pudo importar: ' + humanErr(error), 7000); }
  toast('¡Listo! Perros importados.'); loadAll();
}

/* ---------- Solicitudes ---------- */
const SOL_LABEL = { nueva: 'Nueva', en_revision: 'En revisión', apta: 'Apta', entrevista: 'Entrevista', aprobada: 'Aprobada', adoptada: 'Adoptada', no_apta: 'No apta' };
const Q_LABEL = { edad: 'Edad', direccion_exacta: 'Dirección', profesion_ocupacion: 'Ocupación', numero_contacto: 'Teléfono', animal_interes: 'Animal de interés', acepta_otro_animal: '¿Adoptaría otro?', caracteristicas_animal: 'Qué busca', para_quien: '¿Para quién?', funcion_hogar: 'Función en el hogar', vivienda_propiedad: 'Vivienda', seguridad_exterior: 'Patio / balcón / terraza', horas_solo: 'Horas solo', cuidados_vacaciones: 'En vacaciones', dia_y_noche: 'Día y noche', personas_domicilio: 'Convivientes', otras_mascotas: 'Otras mascotas', recursos_economicos: 'Recursos', castracion: 'Castración', adaptacion: 'Adaptación', problemas_comportamiento: 'Problemas de conducta', mudanza: 'Mudanza', acuerdo_devolucion: 'Devolución a la ONG', calle_supervision: 'Calle / supervisión', seguimiento_whatsapp: 'Seguimiento', responsabilidad_vida: 'Responsabilidad', instagram_facebook: 'Instagram / Facebook' };
/* Solicitudes por semana (últimas 8 semanas, lunes a domingo), a partir de creado_en */
function weekly(rows, n = 8) {
  const now = new Date(), d0 = new Date(now); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
  const weeks = Array.from({ length: n }, (_, i) => { const s = new Date(d0); s.setDate(s.getDate() - 7 * (n - 1 - i)); return { s, c: 0 }; });
  rows.forEach(r => { const t = new Date(r.creado_en); weeks.forEach((w, i) => { const e = new Date(w.s); e.setDate(e.getDate() + 7); if (t >= w.s && t < e) w.c++; }); });
  return weeks;
}
function colChart(weeks, noun) {
  const max = Math.max(1, ...weeks.map(w => w.c)), total = weeks.reduce((a, w) => a + w.c, 0);
  const fmt = d => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');
  const peak = weeks.reduce((m, w, i) => w.c > weeks[m].c ? i : m, 0);
  return `<div class="cchart" role="img" aria-label="${total} ${noun} en las últimas ${weeks.length} semanas">
    <div class="cplot">${weeks.map((w, i) => {
      const last = i === weeks.length - 1, lab = (last || (i === peak && w.c)) && w.c ? `<b class="cval">${w.c}</b>` : '';
      return `<div class="ccol${last ? ' now' : ''}" style="--i:${i}" tabindex="0" aria-label="Semana del ${fmt(w.s)}: ${w.c} ${noun}">${lab}<span class="cbar" style="--h:${w.c / max}"></span><span class="ctip">Semana del ${fmt(w.s)}<b>${w.c} ${w.c === 1 ? noun.replace(/es$|s$/, '') : noun}</b></span></div>`; }).join('')}</div>
    <div class="caxis">${weeks.map((w, i) => `<span>${i % 2 === weeks.length % 2 || i === weeks.length - 1 ? (i === weeks.length - 1 ? 'Esta semana' : fmt(w.s)) : ''}</span>`).join('')}</div>
  </div>`;
}
/* Barras horizontales de un solo color con nombre y número: el texto da la identidad */
const barList = (items, go) => { const max = Math.max(1, ...items.map(x => x[1])); return `<ul class="blist">${items.map(([l, n, st]) => `<li${go ? ` data-go="${go}"` : ''}><span class="bl-l">${l}</span><span class="bl-t"><span class="bl-b" style="--w:${n / max}"></span></span><b>${n}</b></li>`).join('')}</ul>`; };

const solTable = rows => `<div class="table" role="table" aria-label="Solicitudes">
  <div class="tr th" role="row"><span role="columnheader">Persona</span><span role="columnheader">Perro</span><span role="columnheader">Fecha</span><span role="columnheader">Estado</span></div>
  ${rows.map(r => `<button class="tr" type="button" role="row" data-sol-open="${esc(r.id)}">
    <span class="td-person">${avatar(r.nombre_completo)}<span><b>${esc(r.nombre_completo || 'Sin nombre')}</b><small>${esc(r.telefono || (r.respuestas || {}).numero_contacto || '')}</small></span></span>
    <span class="td-dog">${esc(r.animal_interes || '—')}</span>
    <span class="td-date">${fdate(r.creado_en)}</span>
    <span><span class="pill ${esc(r.estado || 'nueva')}">${esc(SOL_LABEL[r.estado || 'nueva'] || r.estado)}</span></span>
  </button>`).join('')}</div>`;
const bindSolTable = () => $$('[data-sol-open]').forEach(b => b.onclick = () => openSol(b.dataset.solOpen));
function openSol(id) {
  const r = S.solicitudes_adopcion.find(x => String(x.id) === String(id)); if (!r) return;
  const resp = r.respuestas || {}, tel = r.telefono || resp.numero_contacto;
  const wa = waLink(tel, `Hola ${r.nombre_completo || ''}, te escribimos de ONG Animales Ramallo por tu solicitud de adopción${r.animal_interes ? ' de ' + r.animal_interes : ''}.`);
  const dog = S.animales.find(a => (a.nombre || '').toLowerCase() === String(r.animal_interes || '').trim().toLowerCase());
  openSheet(`
    <header class="sheet-head">${avatar(r.nombre_completo)}<div><h2 id="sheetTitle">${esc(r.nombre_completo || 'Sin nombre')}</h2><p class="sub">${fdate(r.creado_en)}${tel ? ' · ' + esc(tel) : ''}</p></div></header>
    ${r.animal_interes ? `<div class="sheet-dog">${dog ? `<img src="${esc(dogPhoto(dog))}" alt="">` : `<span class="ph">${icon('paw')}</span>`}<div><small>Quiere adoptar a</small><b>${esc(r.animal_interes)}</b></div></div>` : ''}
    <div class="sheet-actions">
      <label class="field">Estado de la solicitud<select class="sel" data-sol="${esc(r.id)}">${Object.entries(SOL_LABEL).map(([v, l]) => `<option value="${v}" ${(r.estado || 'nueva') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${wa ? `<a class="btn btn-terra btn-sm" href="${esc(wa)}" target="_blank" rel="noopener">${icon('chat')}Escribir por WhatsApp</a>` : ''}
    </div>
    <h3 class="sheet-sub">Respuestas del formulario</h3>
    ${Object.keys(resp).length ? `<dl class="qa">${Object.entries(resp).filter(([k]) => k !== 'nombre_completo').map(([k, v]) => `<div><dt>${esc(Q_LABEL[k] || k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '<p class="sub">Esta solicitud es anterior al panel nuevo: el detalle completo está en el mail.</p>'}
    <p class="sheet-note">${icon('inbox')}Las fotos del patio y de las mascotas llegan al mail de la ONG.</p>`,
  root => { $('[data-sol]', root).onchange = async e => { if (await update('solicitudes_adopcion', r.id, { estado: e.target.value }, 'Estado actualizado.')) { render(); openSol(r.id); } }; });
}
VIEWS.solicitudes = () => {
  const all = S.solicitudes_adopcion;
  const q = (filters.qSol || '').toLowerCase();
  let rows = filters.solicitudes === '*' ? all : all.filter(r => (r.estado || 'nueva') === filters.solicitudes);
  if (q) rows = rows.filter(r => `${r.nombre_completo} ${r.animal_interes}`.toLowerCase().includes(q));
  $('#view').innerHTML = `<div class="toolbar">${filterBar('solicitudes', [['nueva', 'Nuevas'], ['en_revision', 'En revisión'], ['entrevista', 'Entrevista'], ['aprobada', 'Aprobadas'], ['adoptada', 'Adoptadas'], ['no_apta', 'No aptas'], ['*', 'Todas']], all, 'estado', 'nueva')}
    <label class="search">${icon('search')}<input type="search" id="qSol" placeholder="Buscar por nombre o perro" value="${esc(filters.qSol || '')}" aria-label="Buscar solicitudes"></label></div>
    <div class="panel">${rows.length ? solTable(rows) : emptyBox('inbox', q ? 'Sin resultados' : 'No hay solicitudes en esta lista', q ? 'Probá con otro nombre.' : 'Las nuevas solicitudes del formulario aparecen acá y en el mail.')}</div>`;
  bindSolTable();
  const inp = $('#qSol'); inp.oninput = () => { filters.qSol = inp.value; const pos = inp.selectionStart; VIEWS.solicitudes(); const n = $('#qSol'); n.focus(); n.setSelectionRange(pos, pos); };
};

/* ---------- Pedidos ---------- */
const PED_LABEL = { nuevo: 'Nuevo', confirmado: 'Confirmado', pagado: 'Pagado', entregado: 'Entregado', cancelado: 'Cancelado' };
const pedTable = rows => `<div class="table t-ped" role="table" aria-label="Pedidos">
  <div class="tr th" role="row"><span role="columnheader">Pedido</span><span role="columnheader">Entrega</span><span role="columnheader">Total</span><span role="columnheader">Estado</span></div>
  ${rows.map(p => `<button class="tr" type="button" role="row" data-ped-open="${esc(p.id)}">
    <span class="td-person">${avatar(p.nombre)}<span><b>${esc(p.nombre)}</b><small class="code">${esc(p.codigo)} · ${fdate(p.creado_en)}</small></span></span>
    <span class="td-dog">${p.entrega === 'envio' ? 'Envío' : 'Retiro'}</span>
    <span class="td-date num">${money(p.total)}</span>
    <span><span class="pill ${esc(p.estado)}">${esc(PED_LABEL[p.estado] || p.estado)}</span></span>
  </button>`).join('')}</div>`;
const bindPedTable = () => $$('[data-ped-open]').forEach(b => b.onclick = () => openPed(b.dataset.pedOpen));
function openPed(id) {
  const p = S.pedidos.find(x => String(x.id) === String(id)); if (!p) return;
  const wa = waLink(p.telefono, `Hola ${p.nombre}, te escribimos de ONG Animales Ramallo por tu pedido ${p.codigo}.`);
  openSheet(`
    <header class="sheet-head">${avatar(p.nombre)}<div><h2 id="sheetTitle">${esc(p.nombre)}</h2><p class="sub"><span class="code">${esc(p.codigo)}</span> · ${fdate(p.creado_en)}</p></div></header>
    <ul class="items">${(p.items || []).map(i => `<li><span>${i.cantidad} × ${esc(i.nombre)}${i.talle ? ` <small>talle ${esc(i.talle)}</small>` : ''}</span><b>${money(i.precio * i.cantidad)}</b></li>`).join('')}<li class="tot"><span>Total</span><b>${money(p.total)}</b></li></ul>
    <div class="sheet-actions">
      <label class="field">Estado del pedido<select class="sel" data-ped="${esc(p.id)}">${Object.entries(PED_LABEL).map(([v, l]) => `<option value="${v}" ${p.estado === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${wa ? `<a class="btn btn-terra btn-sm" href="${esc(wa)}" target="_blank" rel="noopener">${icon('chat')}Escribirle por WhatsApp</a>` : ''}
    </div>
    <dl class="qa"><div><dt>WhatsApp</dt><dd>${esc(p.telefono)}</dd></div><div><dt>Entrega</dt><dd>${p.entrega === 'envio' ? 'Envío a ' + esc(p.direccion || '(sin dirección)') : 'Retiro en Ramallo'}</dd></div>${p.nota ? `<div><dt>Nota</dt><dd>${esc(p.nota)}</dd></div>` : ''}</dl>`,
  root => { $('[data-ped]', root).onchange = async e => { if (await update('pedidos', p.id, { estado: e.target.value }, 'Pedido actualizado.')) { render(); openPed(p.id); } }; });
}
VIEWS.pedidos = () => {
  const all = S.pedidos;
  if (missing.has('pedidos')) { $('#view').innerHTML = setupWarn(['pedidos']); return; }
  const rows = filters.pedidos === '*' ? all : all.filter(r => r.estado === filters.pedidos);
  const pend = all.filter(p => ['confirmado', 'pagado'].includes(p.estado)).reduce((s, p) => s + Number(p.total || 0), 0);
  $('#viewSub').textContent = `Cada pedido tiene un código que el comprador te manda por WhatsApp. Cobrado o por cobrar: ${money(pend)}.`;
  $('#view').innerHTML = `<div class="toolbar">${filterBar('pedidos', [['nuevo', 'Nuevos'], ['confirmado', 'Confirmados'], ['pagado', 'Pagados'], ['entregado', 'Entregados'], ['cancelado', 'Cancelados'], ['*', 'Todos']], all, 'estado', 'nuevo')}</div>
    <div class="panel">${rows.length ? pedTable(rows) : emptyBox('receipt', 'No hay pedidos en esta lista', 'Cuando alguien confirme un pedido en la web aparece acá con su código.')}</div>`;
  bindPedTable();
};

/* ---------- Tienda ---------- */
const prodFields = [
  { name: 'nombre', label: 'Nombre del producto', required: true, placeholder: 'Remera ONG Animales Ramallo' },
  { type: 'row', fields: [
    { name: 'precio', label: 'Precio ($)', type: 'number', required: true, min: 0, step: 1 },
    { name: 'stock', label: 'Stock', type: 'number', min: 0, hint: 'Vacío = sin control' } ] },
  { name: 'talles', label: 'Talles', hint: 'Separados por coma. Vacío si no tiene talle.', placeholder: 'S, M, L, XL' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea', rows: 3, placeholder: 'Algodón peinado, estampa frente y espalda…' },
  { name: 'imagen_url', label: 'Foto', type: 'image', folder: 'tienda', hint: 'Cuadrada, fondo limpio.' },
  { type: 'row', fields: [
    { name: 'orden', label: 'Orden', type: 'number', min: 0, default: 100 },
    { name: 'activo', label: 'Visible en la web', type: 'check', default: true } ] }
];
const editProd = p => openEditor({ title: p ? 'Editar producto' : 'Nuevo producto', fields: prodFields, values: p || { activo: true }, onSave: v => { if (p && !v.imagen_url) delete v.imagen_url; return save('productos', p?.id, v); } });
VIEWS.tienda = () => {
  action('Nuevo producto', () => editProd());
  if (missing.has('productos')) { $('#view').innerHTML = setupWarn(['productos']); return; }
  const all = S.productos;
  $('#view').innerHTML = (C.WHATSAPP ? '' : '<div class="setup-warn"><b>Falta el WhatsApp de la ONG.</b> Cargalo en <code>js/config.js</code> (campo WHATSAPP) para que los pedidos lleguen por WhatsApp. Mientras tanto se derivan al Instagram.</div>') +
    `<div class="panel">${all.length ? '<ul class="rows">' + all.map(p => `
      <li class="row${p.activo ? '' : ' off'}">
        ${p.imagen_url ? `<img class="row-thumb" src="${esc(p.imagen_url)}" alt="" loading="lazy">` : '<span class="row-thumb"></span>'}
        <div class="row-main"><b>${esc(p.nombre)} · ${money(p.precio)}</b><small>${p.talles ? 'Talles: ' + esc(p.talles) + ' · ' : ''}${p.stock === null || p.stock === undefined ? 'Sin control de stock' : 'Stock: ' + p.stock}</small></div>
        <div class="row-actions">
          <span class="pill ${p.activo ? 'ok' : 'off'}">${p.activo ? 'Visible' : 'Oculto'}</span>
          <button class="btn btn-ghost btn-sm" type="button" data-toggle="${esc(p.id)}">${p.activo ? 'Ocultar' : 'Mostrar'}</button>
          <button class="tool" type="button" data-edit="${esc(p.id)}" title="Editar">${icon('edit')}</button>
          <button class="tool danger" type="button" data-del="${esc(p.id)}" title="Borrar">${icon('trash')}</button>
        </div></li>`).join('') + '</ul>' : emptyBox('bag', 'Todavía no hay productos', 'Cargá el primero (remera, taza, buzo…) y aparece en la sección Tienda de la web.', '<button class="btn btn-primary" type="button" id="firstProd">Cargar primer producto</button>')}</div>`;
  $('#firstProd')?.addEventListener('click', () => editProd());
  $$('[data-toggle]').forEach(b => b.onclick = async () => { const p = S.productos.find(x => String(x.id) === b.dataset.toggle); if (await update('productos', p.id, { activo: !p.activo })) render(); });
  $$('[data-edit]').forEach(b => b.onclick = () => editProd(S.productos.find(x => String(x.id) === b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => remove('productos', b.dataset.del, 'este producto'));
};

/* ---------- Novedades ---------- */
const newsFields = [
  { name: 'tipo', label: 'Tipo', type: 'select', options: [['noticia', 'Noticia propia (texto y foto)'], ['instagram', 'Repostear un posteo de Instagram']], default: 'noticia' },
  { name: 'instagram_url', label: 'Link del posteo o reel', show: 'tipo=instagram', hint: 'Abrí el posteo en Instagram → Compartir → Copiar enlace.', placeholder: 'https://www.instagram.com/p/…', type: 'url' },
  { name: 'credito', label: 'Crédito', show: 'tipo=instagram', hint: 'Usuario de quien lo publicó. Ej: @familia_de_coca', placeholder: '@usuario' },
  { name: 'titulo', label: 'Título', placeholder: '¡Coca encontró familia!' },
  { name: 'texto', label: 'Texto', type: 'textarea', rows: 6, show: 'tipo=noticia' },
  { name: 'imagen_url', label: 'Foto', type: 'image', folder: 'novedades', show: 'tipo=noticia' },
  { type: 'row', fields: [
    { name: 'publicada', label: 'Publicada en la web', type: 'check', default: true },
    { name: 'fijada', label: 'Fijar arriba', type: 'check' } ] }
];
const editNews = (n, tipo) => openEditor({ title: n ? 'Editar novedad' : 'Nueva publicación', fields: newsFields, values: n || { tipo: tipo || 'noticia', publicada: true }, saveLabel: n ? 'Guardar' : 'Publicar', onSave: v => {
  if (v.tipo === 'instagram' && !/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\//i.test(v.instagram_url || '')) throw new Error('Pegá el link de un posteo o reel de Instagram (instagram.com/p/… o /reel/…).');
  if (v.tipo === 'noticia' && !v.titulo && !v.texto) throw new Error('Escribí al menos un título o un texto.');
  if (n && !v.imagen_url) delete v.imagen_url;
  return save('novedades', n?.id, v);
} });
VIEWS.novedades = () => {
  action('Nueva noticia', () => editNews(null, 'noticia'));
  action2('Repostear', () => editNews(null, 'instagram'));
  if (missing.has('novedades')) { $('#view').innerHTML = setupWarn(['novedades']); return; }
  const all = S.novedades;
  $('#view').innerHTML = `<div class="panel">${all.length ? '<ul class="rows">' + all.map(n => `
      <li class="row${n.publicada ? '' : ' off'}">
        ${n.tipo === 'instagram' ? `<span class="row-thumb" style="display:grid;place-items:center">${icon('ig')}</span>` : n.imagen_url ? `<img class="row-thumb" src="${esc(n.imagen_url)}" alt="" loading="lazy">` : `<span class="row-thumb" style="display:grid;place-items:center">${icon('news')}</span>`}
        <div class="row-main"><b>${esc(n.titulo || (n.tipo === 'instagram' ? 'Posteo de Instagram' : 'Sin título'))}</b><small>${n.tipo === 'instagram' ? esc(n.credito || n.instagram_url) : esc((n.texto || '').slice(0, 90))} · ${fdate(n.creado_en)}</small></div>
        <div class="row-actions">
          ${n.tipo === 'instagram' ? `<a class="tool" href="${esc(n.instagram_url)}" target="_blank" rel="noopener" title="Abrir en Instagram">${icon('ext')}</a>` : ''}
          <button class="tool" type="button" data-pin="${esc(n.id)}" aria-pressed="${!!n.fijada}" title="Fijar arriba">${icon('pin')}</button>
          <button class="btn btn-ghost btn-sm" type="button" data-pub="${esc(n.id)}">${n.publicada ? 'Ocultar' : 'Publicar'}</button>
          <button class="tool" type="button" data-edit="${esc(n.id)}" title="Editar">${icon('edit')}</button>
          <button class="tool danger" type="button" data-del="${esc(n.id)}" title="Borrar">${icon('trash')}</button>
        </div></li>`).join('') + '</ul>' : emptyBox('news', 'Todavía no hay novedades', 'Publicá una noticia o reposteá un posteo de Instagram (por ejemplo, una familia que adoptó). La sección aparece en la web con la primera publicación.')}</div>`;
  $$('[data-pin]').forEach(b => b.onclick = async () => { const n = S.novedades.find(x => String(x.id) === b.dataset.pin); if (await update('novedades', n.id, { fijada: !n.fijada })) render(); });
  $$('[data-pub]').forEach(b => b.onclick = async () => { const n = S.novedades.find(x => String(x.id) === b.dataset.pub); if (await update('novedades', n.id, { publicada: !n.publicada })) render(); });
  $$('[data-edit]').forEach(b => b.onclick = () => editNews(S.novedades.find(x => String(x.id) === b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = () => remove('novedades', b.dataset.del, 'esta novedad'));
};

/* ---------- Campañas ---------- */
const campFields = () => [
  { name: 'titulo', label: 'Título', required: true, placeholder: 'Pancho necesita una operación' },
  { name: 'descripcion', label: 'Contale a la gente qué pasó', type: 'textarea', rows: 5, placeholder: 'Escribí la historia de forma sencilla…' },
  { type: 'row', fields: [
    { name: 'objetivo', label: '¿Cuánto se necesita? ($)', type: 'number', required: true, min: 1, step: 1 },
    { name: 'recaudado', label: '¿Cuánto llevan? ($)', type: 'number', min: 0, step: 1, default: 0 } ] },
  { name: 'activa', label: 'Visible en la web', type: 'check', default: true }
];
const editCamp = c => openEditor({ title: c ? 'Editar campaña' : 'Nueva campaña', fields: campFields(), values: c || { activa: true, recaudado: 0 }, saveLabel: c ? 'Guardar' : 'Publicar campaña', onSave: v => save('campanias_donacion', c?.id, { ...v, recaudado: v.recaudado ?? 0 }) });
VIEWS.campanias = () => {
  action('Nueva campaña', () => editCamp());
  const all = S.campanias_donacion;
  $('#view').innerHTML = `<div class="panel">${all.length ? '<ul class="rows">' + all.map(c => {
    const pct = Math.min(100, Math.round((Number(c.recaudado) || 0) / Math.max(1, Number(c.objetivo) || 1) * 100));
    return `<li class="row${c.activa ? '' : ' off'}">
      <span class="pill ${c.activa ? 'ok' : 'off'}">${c.activa ? 'Activa' : 'Finalizada'}</span>
      <div class="row-main"><b>${esc(c.titulo)}</b><small>${money(c.recaudado)} de ${money(c.objetivo)} · ${pct}%</small></div>
      <div class="row-actions">
        <button class="btn btn-ghost btn-sm" type="button" data-raise="${esc(c.id)}">Sumar recaudado</button>
        <button class="btn btn-ghost btn-sm" type="button" data-act="${esc(c.id)}">${c.activa ? 'Finalizar' : 'Reactivar'}</button>
        <button class="tool" type="button" data-edit="${esc(c.id)}" title="Editar">${icon('edit')}</button>
      </div></li>`; }).join('') + '</ul>' : emptyBox('heart', 'No hay campañas', 'Creá una cuando un animal necesite una operación, tratamiento o rescate.')}</div>`;
  $$('[data-act]').forEach(b => b.onclick = async () => { const c = S.campanias_donacion.find(x => String(x.id) === b.dataset.act); if (c.activa && !await ask({ title: `¿Finalizar "${c.titulo}"?`, text: 'Deja de verse en la web. La podés reactivar cuando quieras.', ok: 'Finalizar campaña' })) return; if (await update('campanias_donacion', c.id, { activa: !c.activa }, c.activa ? 'Campaña finalizada.' : 'Campaña reactivada.')) render(); });
  $$('[data-edit]').forEach(b => b.onclick = () => editCamp(S.campanias_donacion.find(x => String(x.id) === b.dataset.edit)));
  $$('[data-raise]').forEach(b => b.onclick = () => {
    const c = S.campanias_donacion.find(x => String(x.id) === b.dataset.raise);
    openEditor({ title: `Sumar a "${c.titulo}"`, saveLabel: 'Sumar', fields: [
      { type: 'html', html: `<div class="preview-box">Llevan <b>${money(c.recaudado)}</b> de ${money(c.objetivo)}.</div>` },
      { name: 'monto', label: 'Monto que entró ($)', type: 'number', required: true, min: 1, step: 1 } ],
      onSave: async v => { if (!await update('campanias_donacion', c.id, { recaudado: (Number(c.recaudado) || 0) + v.monto }, 'Recaudado actualizado.')) throw new Error('No se pudo sumar.'); } });
  });
};

addEventListener('keydown', e => { if (e.key === 'Escape' && $('#editor').open) $('#editor').close(); });
dragClose(sheet, '.grip, .sheet-head', '.sheet-in');
dragClose(more, '.more-grip, .more-list');
dragClose($('#editor'), '.ed-head', '.ed-body');

})();
