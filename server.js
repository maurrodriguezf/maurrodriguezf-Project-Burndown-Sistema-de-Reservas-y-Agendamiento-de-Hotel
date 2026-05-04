const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db/pool');
const { dbErrorMessage, dbErrorStatus } = require('./db/errors');
const authRoutes = require('./routes/auth');
const habitacionesRoutes = require('./routes/habitaciones');
const reservasRoutes = require('./routes/reservas');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      db: r[0].ok === 1 ? 'ok' : 'unknown',
      jwt: process.env.JWT_SECRET ? 'configured' : 'missing',
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      db: 'down',
      error: dbErrorMessage(err),
      code: err.code || null,
    });
  }
});

app.use('/auth', authRoutes);
app.use('/habitaciones', habitacionesRoutes);
app.use('/reservas', reservasRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler global: captura cualquier error que se haya escapado.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[unhandled]', err.code, err.message);
  res.status(dbErrorStatus(err)).json({ error: dbErrorMessage(err) });
});

const port = Number(process.env.PORT || 3000);

(async function start() {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET no está definido en .env — el login fallará.');
  }
  try {
    await pool.query('SELECT 1');
    console.log('Conexión MySQL verificada.');
  } catch (err) {
    console.warn('No se pudo conectar a MySQL al iniciar:');
    console.warn('  ' + dbErrorMessage(err));
    console.warn('  El servidor arrancará igual; endpoints retornarán 503 hasta que la BD esté disponible.');
  }
  app.listen(port, () => {
    console.log(`Servidor Hotel Reservas escuchando en http://localhost:${port}`);
  });
})();
