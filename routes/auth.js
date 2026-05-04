const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { dbErrorMessage, dbErrorStatus } = require('../db/errors');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'nombre, email y password son requeridos' });
  }
  const rolesValidos = ['ADMIN', 'RECEPCIONISTA', 'TURISTA'];
  const rolFinal = rolesValidos.includes(rol) ? rol : 'RECEPCIONISTA';

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rolFinal]
    );
    res.status(201).json({ id: result.insertId, nombre, email, rol: rolFinal });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error('[auth POST /register]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos' });
  }
  if (!process.env.JWT_SECRET) {
    console.error('[auth] JWT_SECRET no configurado en .env');
    return res.status(500).json({ error: 'Servidor mal configurado: falta JWT_SECRET en .env' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h', algorithm: 'HS256' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error('[auth POST /login]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[auth GET /me]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  const { nombre, email, password_actual, password_nueva } = req.body || {};

  if (!nombre && !email && !password_nueva) {
    return res.status(400).json({ error: 'Nada que actualizar' });
  }
  if (password_nueva && password_nueva.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = rows[0];

    const cambiaSensible = (email && email !== user.email) || password_nueva;
    if (cambiaSensible) {
      if (!password_actual) {
        return res.status(400).json({ error: 'Para cambiar email o contraseña debes ingresar la contraseña actual' });
      }
      const ok = await bcrypt.compare(password_actual, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const fields = [];
    const values = [];
    if (nombre && nombre !== user.nombre) { fields.push('nombre = ?'); values.push(nombre); }
    if (email && email !== user.email) { fields.push('email = ?'); values.push(email); }
    if (password_nueva) {
      const hash = await bcrypt.hash(password_nueva, 10);
      fields.push('password_hash = ?');
      values.push(hash);
    }
    if (fields.length === 0) {
      return res.json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
    }
    values.push(user.id);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE id = ?',
      [user.id]
    );
    res.json(updated[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado por otro usuario' });
    }
    console.error('[auth PUT /me]', err.code, err.message);
    res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
  }
});

module.exports = router;
