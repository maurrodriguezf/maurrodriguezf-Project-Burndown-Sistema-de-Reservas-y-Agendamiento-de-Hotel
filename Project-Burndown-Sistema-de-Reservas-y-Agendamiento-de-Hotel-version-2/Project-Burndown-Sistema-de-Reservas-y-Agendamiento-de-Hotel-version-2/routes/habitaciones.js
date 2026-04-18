const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, numero, tipo, capacidad, precio_noche, estado FROM habitaciones ORDER BY numero'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar habitaciones' });
  }
});

// HU-01: disponibilidad en tiempo real entre fechas
// GET /habitaciones/disponibles?entrada=YYYY-MM-DD&salida=YYYY-MM-DD
router.get('/disponibles', async (req, res) => {
  const { entrada, salida } = req.query;
  if (!entrada || !salida) {
    return res.status(400).json({ error: 'entrada y salida son requeridas (YYYY-MM-DD)' });
  }
  if (entrada >= salida) {
    return res.status(400).json({ error: 'salida debe ser posterior a entrada' });
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
    console.error(err);
    res.status(500).json({ error: 'Error al consultar disponibilidad' });
  }
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { numero, tipo, capacidad, precio_noche, estado } = req.body || {};
  if (!numero || !tipo || !capacidad || !precio_noche) {
    return res.status(400).json({ error: 'numero, tipo, capacidad y precio_noche son requeridos' });
  }
  try {
    const [r] = await pool.query(
      `INSERT INTO habitaciones (numero, tipo, capacidad, precio_noche, estado)
       VALUES (?, ?, ?, ?, COALESCE(?, 'DISPONIBLE'))`,
      [numero, tipo, capacidad, precio_noche, estado]
    );
    res.status(201).json({ id: r.insertId, numero, tipo, capacidad, precio_noche, estado: estado || 'DISPONIBLE' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una habitación con ese número' });
    console.error(err);
    res.status(500).json({ error: 'Error al crear habitación' });
  }
});

module.exports = router;
