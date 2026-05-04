const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  const schema = fs.readFileSync(
    path.join(__dirname, '..', 'db', 'schema.sql'),
    'utf8'
  );

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Ejecutando schema.sql...');
  await conn.query(schema);

  await conn.changeUser({ database: process.env.DB_NAME || 'hotel_reservas' });

  const adminEmail = 'admin@hotel.local';
  const [rows] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [adminEmail]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await conn.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      ['Administrador', adminEmail, hash, 'ADMIN']
    );
    console.log('Usuario admin creado -> admin@hotel.local / admin123');
  } else {
    console.log('Usuario admin ya existe, se omite seed.');
  }

  await conn.end();
  console.log('Base de datos inicializada correctamente.');
}

main().catch((err) => {
  console.error('Error inicializando BD:');
  console.error(`  code:    ${err.code}`);
  console.error(`  message: ${err.message}`);
  console.error(`  host:    ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  console.error(`  user:    ${process.env.DB_USER || 'root'}`);
  if (err.code === 'ECONNREFUSED') {
    console.error('\n  -> MySQL no está escuchando en ese host/puerto.');
    console.error('     Verifica que el servicio MySQL esté iniciado.');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('\n  -> Usuario o contraseña incorrectos. Revisa tu .env');
  }
  process.exit(1);
});
