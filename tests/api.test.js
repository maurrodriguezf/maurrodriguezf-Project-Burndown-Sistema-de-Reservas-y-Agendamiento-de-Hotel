const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@hotel.local';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'admin123';

const stamp = Date.now();
const uniq = (s) => `${s}_${stamp}_${Math.floor(Math.random() * 1e6)}`;

async function req(path, { method = 'GET', token, body, query } = {}) {
  const url = new URL(path, BASE);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

let adminToken;
let turistaCreds;
let turistaToken;
let createdHabitacionId;
let createdHabitacionNumero;
let createdReservaId;

test('healthcheck — server y DB ok', async () => {
  const r = await req('/health');
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'ok');
  assert.equal(r.data.db, 'ok');
  assert.equal(r.data.jwt, 'configured');
});

test('auth: login admin seed devuelve token y user', async () => {
  const r = await req('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASS } });
  assert.equal(r.status, 200);
  assert.ok(r.data.token, 'no llegó token');
  assert.equal(r.data.user.rol, 'ADMIN');
  adminToken = r.data.token;
});

test('auth: login con credenciales incorrectas → 401', async () => {
  const r = await req('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: 'no-es' } });
  assert.equal(r.status, 401);
});

test('auth: register sin password → 400', async () => {
  const r = await req('/auth/register', { method: 'POST', body: { nombre: 'X', email: uniq('x') + '@t.cl' } });
  assert.equal(r.status, 400);
});

test('auth: register turista nuevo → 201', async () => {
  turistaCreds = {
    nombre: 'Turista Test',
    email: uniq('turista') + '@test.cl',
    password: 'secret123',
    rol: 'TURISTA',
  };
  const r = await req('/auth/register', { method: 'POST', body: turistaCreds });
  assert.equal(r.status, 201);
  assert.equal(r.data.email, turistaCreds.email);
  assert.equal(r.data.rol, 'TURISTA');
});

test('auth: register email duplicado → 409', async () => {
  const r = await req('/auth/register', { method: 'POST', body: turistaCreds });
  assert.equal(r.status, 409);
});

test('auth: login turista recién creado', async () => {
  const r = await req('/auth/login', { method: 'POST', body: { email: turistaCreds.email, password: turistaCreds.password } });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.rol, 'TURISTA');
  turistaToken = r.data.token;
});

test('auth: GET /me sin token → 401', async () => {
  const r = await req('/auth/me');
  assert.equal(r.status, 401);
});

test('auth: GET /me con token devuelve usuario actual', async () => {
  const r = await req('/auth/me', { token: turistaToken });
  assert.equal(r.status, 200);
  assert.equal(r.data.email, turistaCreds.email);
  assert.equal(r.data.rol, 'TURISTA');
});

test('auth: PUT /me cambia nombre sin contraseña actual', async () => {
  const r = await req('/auth/me', { method: 'PUT', token: turistaToken, body: { nombre: 'Turista Renombrado' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.nombre, 'Turista Renombrado');
});

test('auth: PUT /me con nueva contraseña sin la actual → 400', async () => {
  const r = await req('/auth/me', { method: 'PUT', token: turistaToken, body: { password_nueva: 'nuevasecret' } });
  assert.equal(r.status, 400);
});

test('auth: PUT /me cambia contraseña con la actual correcta', async () => {
  const nueva = 'cambiada123';
  const r = await req('/auth/me', {
    method: 'PUT', token: turistaToken,
    body: { password_actual: turistaCreds.password, password_nueva: nueva },
  });
  assert.equal(r.status, 200);
  const reLogin = await req('/auth/login', { method: 'POST', body: { email: turistaCreds.email, password: nueva } });
  assert.equal(reLogin.status, 200, 'la nueva contraseña debería autenticar');
  turistaCreds.password = nueva;
  turistaToken = reLogin.data.token;
});

test('habitaciones: GET / lista habitaciones', async () => {
  const r = await req('/habitaciones');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data));
  assert.ok(r.data.length >= 1);
});

test('habitaciones: GET /disponibles sin params → 400', async () => {
  const r = await req('/habitaciones/disponibles');
  assert.equal(r.status, 400);
});

test('habitaciones: GET /disponibles con fecha inválida → 400', async () => {
  const r = await req('/habitaciones/disponibles', { query: { entrada: '2026-13-99', salida: '2026-12-31' } });
  assert.equal(r.status, 400);
});

test('habitaciones: GET /disponibles devuelve lista', async () => {
  const r = await req('/habitaciones/disponibles', { query: { entrada: '2030-01-01', salida: '2030-01-05' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.entrada, '2030-01-01');
  assert.ok(Array.isArray(r.data.habitaciones));
});

test('habitaciones: POST sin token → 401', async () => {
  const r = await req('/habitaciones', { method: 'POST', body: { numero: 'X', tipo: 'DOBLE', capacidad: 2, precio_noche: 1000 } });
  assert.equal(r.status, 401);
});

test('habitaciones: POST con turista (no admin) → 403', async () => {
  const r = await req('/habitaciones', {
    method: 'POST', token: turistaToken,
    body: { numero: uniq('T'), tipo: 'DOBLE', capacidad: 2, precio_noche: 1000 },
  });
  assert.equal(r.status, 403);
});

test('habitaciones: POST como ADMIN crea habitación', async () => {
  createdHabitacionNumero = `T${stamp}`.slice(-8);
  const r = await req('/habitaciones', {
    method: 'POST', token: adminToken,
    body: { numero: createdHabitacionNumero, tipo: 'SUITE', capacidad: 3, precio_noche: 99000 },
  });
  assert.equal(r.status, 201);
  assert.ok(r.data.id);
  assert.equal(r.data.numero, createdHabitacionNumero);
  assert.equal(r.data.estado, 'DISPONIBLE');
  createdHabitacionId = r.data.id;
});

test('habitaciones: POST con tipo inválido → 400', async () => {
  const r = await req('/habitaciones', {
    method: 'POST', token: adminToken,
    body: { numero: uniq('Z'), tipo: 'PALACIO', capacidad: 2, precio_noche: 1000 },
  });
  assert.equal(r.status, 400);
});

test('reservas: POST con datos faltantes → 400', async () => {
  const r = await req('/reservas', { method: 'POST', body: { habitacion_id: createdHabitacionId } });
  assert.equal(r.status, 400);
});

test('reservas: POST con email cliente inválido → 400', async () => {
  const r = await req('/reservas', {
    method: 'POST',
    body: {
      habitacion_id: createdHabitacionId,
      cliente_nombre: 'Juan',
      cliente_email: 'no-es-email',
      fecha_entrada: '2030-02-01',
      fecha_salida: '2030-02-03',
    },
  });
  assert.equal(r.status, 400);
});

test('reservas: POST crea reserva CONFIRMADA', async () => {
  const r = await req('/reservas', {
    method: 'POST',
    body: {
      habitacion_id: createdHabitacionId,
      cliente_nombre: 'Cliente Test',
      cliente_email: 'cliente@test.cl',
      fecha_entrada: '2030-03-01',
      fecha_salida: '2030-03-05',
    },
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.estado, 'CONFIRMADA');
  createdReservaId = r.data.id;
});

test('reservas: POST solapando misma habitación → 409', async () => {
  const r = await req('/reservas', {
    method: 'POST',
    body: {
      habitacion_id: createdHabitacionId,
      cliente_nombre: 'Otro',
      cliente_email: 'otro@test.cl',
      fecha_entrada: '2030-03-03',
      fecha_salida: '2030-03-07',
    },
  });
  assert.equal(r.status, 409);
});

test('reservas: GET / sin token → 401', async () => {
  const r = await req('/reservas');
  assert.equal(r.status, 401);
});

test('reservas: GET / con admin lista la reserva creada', async () => {
  const r = await req('/reservas', { token: adminToken });
  assert.equal(r.status, 200);
  assert.ok(r.data.some((x) => x.id === createdReservaId));
});

test('reservas: PUT /:id mueve fechas sin solape', async () => {
  const r = await req(`/reservas/${createdReservaId}`, {
    method: 'PUT', token: adminToken,
    body: { fecha_entrada: '2030-03-10', fecha_salida: '2030-03-12' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.actualizado, true);
});

test('reservas: DELETE como turista → 403', async () => {
  const r = await req(`/reservas/${createdReservaId}`, { method: 'DELETE', token: turistaToken });
  assert.equal(r.status, 403);
});

test('reservas: DELETE como admin cancela (soft delete)', async () => {
  const r = await req(`/reservas/${createdReservaId}`, { method: 'DELETE', token: adminToken });
  assert.equal(r.status, 200);
  assert.equal(r.data.estado, 'CANCELADA');
});

test('reservas: DELETE de reserva ya cancelada → 404', async () => {
  const r = await req(`/reservas/${createdReservaId}`, { method: 'DELETE', token: adminToken });
  assert.equal(r.status, 404);
});
