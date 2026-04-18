const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

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
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos' });
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el login' });
  }
});

module.exports = router;
