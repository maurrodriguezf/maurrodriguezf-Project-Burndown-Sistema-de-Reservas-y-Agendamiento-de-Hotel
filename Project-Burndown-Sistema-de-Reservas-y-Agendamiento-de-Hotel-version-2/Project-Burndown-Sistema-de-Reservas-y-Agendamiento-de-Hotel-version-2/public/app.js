const API = '';
const TOKEN_KEY = 'hotel_token';
const USER_KEY = 'hotel_user';

const state = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
};

// ===== Helpers =====
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function headers(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  if (state.token) h['Authorization'] = `Bearer ${state.token}`;
  return h;
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function fmtCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-CL');
}

// ===== Navegación =====
function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.add('active');
  document.querySelectorAll('.dd-panel').forEach(p => p.classList.remove('open'));

  if (view === 'reservar') loadHabitacionesSelect();
  if (view === 'habitaciones') loadHabitaciones();
  if (view === 'gestion') loadReservas();
  if (view === 'admin') refreshAdmin();
}

document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(el.dataset.nav);
  });
});

// ===== Dropdowns =====
document.querySelectorAll('.dd-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const targetId = btn.dataset.dd;
    document.querySelectorAll('.dd-panel').forEach(p => {
      if (p.id !== targetId) p.classList.remove('open');
    });
    document.getElementById(targetId).classList.toggle('open');
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.dd-panel').forEach(p => p.classList.remove('open'));
});

// ===== Auth =====
function refreshAuthUI() {
  const btn = document.getElementById('cuenta-btn');
  const logoutLink = document.getElementById('link-logout');
  const loginLink = document.getElementById('link-login');

  if (state.user) {
    btn.textContent = `${state.user.nombre} ▾`;
    logoutLink.style.display = 'block';
    loginLink.style.display = 'none';
  } else {
    btn.textContent = 'Cuenta ▾';
    logoutLink.style.display = 'none';
    loginLink.style.display = 'block';
  }

  document.getElementById('gestion-locked').style.display = state.user ? 'none' : 'block';
  document.getElementById('gestion-content').style.display = state.user ? 'block' : 'none';
  refreshAdmin();
}

function refreshAdmin() {
  const isAdmin = state.user && state.user.rol === 'ADMIN';
  document.getElementById('admin-locked').style.display = isAdmin ? 'none' : 'block';
  document.getElementById('form-habitacion').style.display = isAdmin ? 'grid' : 'none';
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(fd) });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    refreshAuthUI();
    toast(`Bienvenido ${data.user.nombre}`, 'success');
    navigate('disponibilidad');
  } catch (err) {
    toast(err.message, 'error');
  }
});

document.getElementById('form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    await api('/auth/register', { method: 'POST', body: JSON.stringify(fd) });
    toast('Usuario creado. Ya puedes iniciar sesión', 'success');
    navigate('login');
  } catch (err) {
    toast(err.message, 'error');
  }
});

document.getElementById('link-logout').addEventListener('click', (e) => {
  e.preventDefault();
  state.token = null;
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  refreshAuthUI();
  toast('Sesión cerrada');
  navigate('disponibilidad');
});

// ===== HU-01 Disponibilidad =====
document.getElementById('form-disponibilidad').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  const cont = document.getElementById('disponibilidad-resultados');
  cont.innerHTML = '<p class="subtitle">Buscando...</p>';
  try {
    const data = await api(`/habitaciones/disponibles?entrada=${fd.entrada}&salida=${fd.salida}`);
    if (data.habitaciones.length === 0) {
      cont.innerHTML = '<p class="subtitle">😔 No hay habitaciones disponibles para esas fechas.</p>';
      return;
    }
    cont.innerHTML = data.habitaciones.map(h => `
      <div class="room-card">
        <h3>Habitación ${h.numero}</h3>
        <div class="meta">
          <span class="badge info">${h.tipo}</span>
          <span class="badge">${h.capacidad} personas</span>
          <span class="badge ok">Disponible</span>
        </div>
        <div class="price">${fmtCLP(h.precio_noche)} <small>/ noche</small></div>
        <button class="btn primary small" style="margin-top:0.8rem; width:100%"
                onclick="reservarDesde(${h.id}, '${fd.entrada}', '${fd.salida}')">
          Reservar
        </button>
      </div>
    `).join('');
  } catch (err) {
    cont.innerHTML = `<p class="subtitle" style="color:var(--danger)">${err.message}</p>`;
  }
});

window.reservarDesde = (id, entrada, salida) => {
  navigate('reservar');
  setTimeout(() => {
    const form = document.getElementById('form-reserva');
    form.habitacion_id.value = id;
    form.fecha_entrada.value = entrada;
    form.fecha_salida.value = salida;
  }, 100);
};

// ===== Habitaciones =====
async function loadHabitaciones() {
  const cont = document.getElementById('habitaciones-lista');
  cont.innerHTML = '<p class="subtitle">Cargando...</p>';
  try {
    const data = await api('/habitaciones');
    cont.innerHTML = data.map(h => {
      const estadoBadge = h.estado === 'DISPONIBLE' ? 'ok'
        : h.estado === 'MANTENIMIENTO' ? 'warn' : 'bad';
      return `
        <div class="room-card">
          <h3>Habitación ${h.numero}</h3>
          <div class="meta">
            <span class="badge info">${h.tipo}</span>
            <span class="badge">${h.capacidad} personas</span>
            <span class="badge ${estadoBadge}">${h.estado}</span>
          </div>
          <div class="price">${fmtCLP(h.precio_noche)} <small>/ noche</small></div>
        </div>`;
    }).join('');
  } catch (err) {
    cont.innerHTML = `<p class="subtitle" style="color:var(--danger)">${err.message}</p>`;
  }
}

async function loadHabitacionesSelect() {
  const sel = document.getElementById('select-habitacion');
  sel.innerHTML = '<option value="">Cargando...</option>';
  try {
    const data = await api('/habitaciones');
    sel.innerHTML = '<option value="">-- Selecciona --</option>' +
      data.filter(h => h.estado === 'DISPONIBLE').map(h =>
        `<option value="${h.id}">Hab ${h.numero} · ${h.tipo} · ${fmtCLP(h.precio_noche)}/noche</option>`
      ).join('');
  } catch (err) {
    sel.innerHTML = '<option value="">Error al cargar</option>';
    toast(err.message, 'error');
  }
}

// ===== HU-02 Crear reserva =====
document.getElementById('form-reserva').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  fd.habitacion_id = Number(fd.habitacion_id);
  try {
    const r = await api('/reservas', { method: 'POST', body: JSON.stringify(fd) });
    toast(`Reserva #${r.id} confirmada`, 'success');
    e.target.reset();
  } catch (err) {
    toast(err.message, 'error');
  }
});

// ===== HU-03 Gestión de reservas =====
async function loadReservas() {
  if (!state.user) return;
  const tbody = document.getElementById('tbl-reservas');
  tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
  try {
    const data = await api('/reservas');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">Sin reservas registradas</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => {
      const badge = r.estado === 'CONFIRMADA' ? 'ok'
        : r.estado === 'CANCELADA' ? 'bad' : 'warn';
      const acciones = r.estado === 'CONFIRMADA' ? `
        <button class="btn small" onclick="abrirEditar(${r.id}, '${r.fecha_entrada}', '${r.fecha_salida}', '${r.cliente_nombre.replace(/'/g,"\\'")}', '${r.cliente_email}')">Editar</button>
        <button class="btn small danger" onclick="cancelarReserva(${r.id})">Cancelar</button>
      ` : '<span class="badge">sin acciones</span>';
      return `
        <tr>
          <td>#${r.id}</td>
          <td>${r.habitacion_numero}</td>
          <td>${r.cliente_nombre}<br><small style="color:var(--text-muted)">${r.cliente_email}</small></td>
          <td>${fmtDate(r.fecha_entrada)}</td>
          <td>${fmtDate(r.fecha_salida)}</td>
          <td><span class="badge ${badge}">${r.estado}</span></td>
          <td>${acciones}</td>
        </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger)">${err.message}</td></tr>`;
  }
}

document.getElementById('btn-reload-reservas').addEventListener('click', loadReservas);

window.cancelarReserva = async (id) => {
  if (!confirm(`¿Cancelar reserva #${id}?`)) return;
  try {
    await api(`/reservas/${id}`, { method: 'DELETE' });
    toast(`Reserva #${id} cancelada`, 'success');
    loadReservas();
  } catch (err) {
    toast(err.message, 'error');
  }
};

window.abrirEditar = (id, entrada, salida, nombre, email) => {
  const modal = document.getElementById('modal-editar');
  modal.dataset.id = id;
  document.getElementById('edit-id').textContent = `#${id}`;
  const form = document.getElementById('form-editar');
  form.fecha_entrada.value = entrada;
  form.fecha_salida.value = salida;
  form.cliente_nombre.value = nombre;
  form.cliente_email.value = email;
  modal.classList.add('open');
};

document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
  document.getElementById('modal-editar').classList.remove('open');
});

document.getElementById('form-editar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('modal-editar').dataset.id;
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    await api(`/reservas/${id}`, { method: 'PUT', body: JSON.stringify(fd) });
    toast(`Reserva #${id} actualizada`, 'success');
    document.getElementById('modal-editar').classList.remove('open');
    loadReservas();
  } catch (err) {
    toast(err.message, 'error');
  }
});

// ===== Admin: crear habitación =====
document.getElementById('form-habitacion').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  fd.capacidad = Number(fd.capacidad);
  fd.precio_noche = Number(fd.precio_noche);
  try {
    const h = await api('/habitaciones', { method: 'POST', body: JSON.stringify(fd) });
    toast(`Habitación ${h.numero} creada`, 'success');
    e.target.reset();
  } catch (err) {
    toast(err.message, 'error');
  }
});

// ===== Init =====
(function init() {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach((inp, i) => {
    if (!inp.value) inp.value = i % 2 === 0 ? fmt(today) : fmt(tomorrow);
  });

  refreshAuthUI();
  navigate('disponibilidad');
})();
