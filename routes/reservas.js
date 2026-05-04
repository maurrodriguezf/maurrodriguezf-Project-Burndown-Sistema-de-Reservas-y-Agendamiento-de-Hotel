const express = require('express');
const pool = require('../db/pool');
const { dbErrorMessage, dbErrorStatus, isIsoDate } = require('../db/errors');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

async function haySolape(conn, habitacionId, entrada, salida, excluirId = null) {
  const params = [habitacionId, salida, entrada];
  let sql = `SELECT id FROM reservas
              WHERE habitacion_id = ?
                AND estado = 'CONFIRMADA'
                AND fecha_entrada < ?
                AND fecha_salida  > ?`;
  if (excluirId) {
    sql += ' AND id <> ?';
    params.push(excluirId);
  }
  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}

// HU-02: crear reserva
router.post('/', async (req, res) => {
  const {
    habitacion_id,
    cliente_nombre,
    cliente_email,
    cliente_rut,
    fecha_entrada,
    fecha_salida,
  } = req.body || {};

  if (!habitacion_id || !cliente_nombre || !cliente_email || !fecha_entrada || !fecha_salida) {
    return res.status(400).json({
      error: 'habitacion_id, cliente_nombre, cliente_email, fecha_entrada y fecha_salida son requeridos',
    });
  }
  if (!isIsoDate(fecha_entrada) || !isIsoDate(fecha_salida)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD.' });
  }
  if (fecha_entrada >= fecha_salida) {
    return res.status(400).json({ error: 'fecha_salida debe ser posterior a fecha_entrada' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(cliente_email))) {
    return res.status(400).json({ error: 'Email del cliente inválido' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [habRows] = await conn.query(
      'SELECT estado FROM habitaciones WHERE id = ? FOR UPDATE',
      [habitacion_id]
    );
    if (habRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }
    if (habRows[0].estado !== 'DISPONIBLE') {
      await conn.rollback();
      return res.status(409).json({ error: `Habitación no disponible (estado: ${habRows[0].estado})` });
    }

    if (await haySolape(conn, habitacion_id, fecha_entrada, fecha_salida)) {
      await conn.rollback();
      return res.status(409).json({ error: 'La habitación ya está reservada en esas fechas' });
    }

    const [r] = await conn.query(
      `INSERT INTO reservas
         (habitacion_id, cliente_nombre, cliente_email, cliente_rut, fecha_entrada, fecha_salida)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [habitacion_id, cliente_nombre, cliente_email, cliente_rut || null, fecha_entrada, fecha_salida]
    );

    await conn.commit();
    res.status(201).json({
      id: r.insertId,
      habitacion_id,
      cliente_nombre,
      cliente_email,
      cliente_rut: cliente_rut || null,
      fecha_entrada,
      fecha_salida,
      estado: 'CONFIRMADA',
    });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    console.error('[reservas POST /]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  } finally {
    if (conn) conn.release();
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.habitacion_id, h.numero AS habitacion_numero,
              r.cliente_nombre, r.cliente_email, r.cliente_rut,
              r.fecha_entrada, r.fecha_salida, r.estado, r.creada_en
         FROM reservas r
         JOIN habitaciones h ON h.id = r.habitacion_id
        ORDER BY r.fecha_entrada DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[reservas GET /]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, h.numero AS habitacion_numero
         FROM reservas r
         JOIN habitaciones h ON h.id = r.habitacion_id
        WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[reservas GET /:id]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

// HU-03: modificar
router.put('/:id', requireAuth, async (req, res) => {
  const { fecha_entrada, fecha_salida, cliente_nombre, cliente_email, cliente_rut } = req.body || {};

  if (fecha_entrada && !isIsoDate(fecha_entrada)) {
    return res.status(400).json({ error: 'fecha_entrada inválida (YYYY-MM-DD)' });
  }
  if (fecha_salida && !isIsoDate(fecha_salida)) {
    return res.status(400).json({ error: 'fecha_salida inválida (YYYY-MM-DD)' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM reservas WHERE id = ? FOR UPDATE', [req.params.id]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const actual = rows[0];
    if (actual.estado !== 'CONFIRMADA') {
      await conn.rollback();
      return res.status(409).json({ error: 'Solo reservas CONFIRMADAS pueden modificarse' });
    }

    const nuevaEntrada = fecha_entrada || actual.fecha_entrada;
    const nuevaSalida  = fecha_salida  || actual.fecha_salida;
    if (nuevaEntrada >= nuevaSalida) {
      await conn.rollback();
      return res.status(400).json({ error: 'fecha_salida debe ser posterior a fecha_entrada' });
    }

    if (await haySolape(conn, actual.habitacion_id, nuevaEntrada, nuevaSalida, actual.id)) {
      await conn.rollback();
      return res.status(409).json({ error: 'Las nuevas fechas se solapan con otra reserva' });
    }

    await conn.query(
      `UPDATE reservas
          SET fecha_entrada = ?, fecha_salida = ?,
              cliente_nombre = COALESCE(?, cliente_nombre),
              cliente_email  = COALESCE(?, cliente_email),
              cliente_rut    = COALESCE(?, cliente_rut)
        WHERE id = ?`,
      [nuevaEntrada, nuevaSalida, cliente_nombre, cliente_email, cliente_rut, actual.id]
    );

    await conn.commit();
    res.json({ id: actual.id, actualizado: true });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    console.error('[reservas PUT /:id]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  } finally {
    if (conn) conn.release();
  }
});

// HU-03: cancelar (soft delete)
router.delete('/:id', requireAuth, requireRole('ADMIN', 'RECEPCIONISTA'), async (req, res) => {
  try {
    const [r] = await pool.query(
      "UPDATE reservas SET estado = 'CANCELADA' WHERE id = ? AND estado = 'CONFIRMADA'",
      [req.params.id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o no cancelable' });
    }
    res.json({ id: Number(req.params.id), estado: 'CANCELADA' });
  } catch (err) {
    console.error('[reservas DELETE /:id]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

module.exports = router;
