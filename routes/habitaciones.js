const express = require('express');
const pool = require('../db/pool');
const { dbErrorMessage, dbErrorStatus, isIsoDate } = require('../db/errors');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, numero, tipo, capacidad, precio_noche, estado FROM habitaciones ORDER BY numero'
    );
    res.json(rows);
  } catch (err) {
    console.error('[habitaciones GET /]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

// HU-01: disponibilidad en tiempo real entre fechas
// GET /habitaciones/disponibles?entrada=YYYY-MM-DD&salida=YYYY-MM-DD
router.get('/disponibles', async (req, res) => {
  const { entrada, salida } = req.query;
  if (!entrada || !salida) {
    return res.status(400).json({ error: 'Parámetros entrada y salida son requeridos (YYYY-MM-DD).' });
  }
  if (!isIsoDate(entrada) || !isIsoDate(salida)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD (ej: 2026-05-10).' });
  }
  if (entrada >= salida) {
    return res.status(400).json({ error: 'fecha_salida debe ser posterior a fecha_entrada.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT h.id, h.numero, h.tipo, h.capacidad, h.precio_noche
         FROM habitaciones h
        WHERE h.estado = 'DISPONIBLE'
          AND h.id NOT IN (
            SELECT r.habitacion_id
              FROM reservas r
             WHERE r.estado = 'CONFIRMADA'
               AND r.fecha_entrada < ?
               AND r.fecha_salida  > ?
          )
        ORDER BY h.numero`,
      [salida, entrada]
    );
    res.json({ entrada, salida, habitaciones: rows });
  } catch (err) {
    console.error('[habitaciones GET /disponibles]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { numero, tipo, capacidad, precio_noche, estado } = req.body || {};
  if (!numero || !tipo || !capacidad || !precio_noche) {
    return res.status(400).json({ error: 'numero, tipo, capacidad y precio_noche son requeridos' });
  }
  const tiposValidos = ['INDIVIDUAL', 'DOBLE', 'SUITE'];
  const estadosValidos = ['DISPONIBLE', 'MANTENIMIENTO', 'FUERA_SERVICIO'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `tipo inválido. Valores aceptados: ${tiposValidos.join(', ')}` });
  }
  if (estado && !estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Valores aceptados: ${estadosValidos.join(', ')}` });
  }
  if (Number(capacidad) < 1 || Number(precio_noche) <= 0) {
    return res.status(400).json({ error: 'capacidad debe ser >= 1 y precio_noche > 0' });
  }

  try {
    const [r] = await pool.query(
      `INSERT INTO habitaciones (numero, tipo, capacidad, precio_noche, estado)
       VALUES (?, ?, ?, ?, COALESCE(?, 'DISPONIBLE'))`,
      [numero, tipo, capacidad, precio_noche, estado]
    );
    res.status(201).json({ id: r.insertId, numero, tipo, capacidad, precio_noche, estado: estado || 'DISPONIBLE' });
  } catch (err) {
    console.error('[habitaciones POST /]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

module.exports = router;
