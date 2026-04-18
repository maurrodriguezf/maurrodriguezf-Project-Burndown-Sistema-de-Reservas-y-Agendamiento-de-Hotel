const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db/pool');
const authRoutes = require('./routes/auth');
const habitacionesRoutes = require('./routes/habitaciones');
const reservasRoutes = require('./routes/reservas');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'ok', db: 'down', error: err.message });
  }
});

app.use('/auth', authRoutes);
app.use('/habitaciones', habitacionesRoutes);
app.use('/reservas', reservasRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Servidor Hotel Reservas escuchando en http://localhost:${port}`);
});
