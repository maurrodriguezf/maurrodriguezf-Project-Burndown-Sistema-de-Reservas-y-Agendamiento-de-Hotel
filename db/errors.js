// Traduce errores de MySQL/dependencias en mensajes accionables.
function dbErrorMessage(err) {
  if (!err) return 'Error desconocido';
  switch (err.code) {
    case 'ECONNREFUSED':
      return 'Base de datos no disponible: MySQL no responde en el host/puerto configurado. Verifica que el servicio esté iniciado.';
    case 'ER_ACCESS_DENIED_ERROR':
      return 'Credenciales de base de datos incorrectas. Revisa DB_USER / DB_PASSWORD en .env.';
    case 'ER_BAD_DB_ERROR':
      return 'La base de datos no existe. Ejecuta: npm run db:init.';
    case 'ER_NO_SUCH_TABLE':
      return 'Tablas no creadas. Ejecuta: npm run db:init.';
    case 'PROTOCOL_CONNECTION_LOST':
    case 'ETIMEDOUT':
      return 'Conexión con la base de datos interrumpida. Reintenta en unos segundos.';
    case 'ER_DUP_ENTRY':
      return 'Registro duplicado: ya existe un valor único con esos datos.';
    case 'ER_NO_REFERENCED_ROW_2':
      return 'Referencia inválida: la habitación o entidad relacionada no existe.';
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      return 'Datos inválidos: las fechas deben cumplir fecha_salida > fecha_entrada.';
    default:
      return err.message || 'Error de base de datos';
  }
}

// Determina código HTTP apropiado a partir de la causa.
function dbErrorStatus(err) {
  if (!err) return 500;
  if (err.code === 'ER_DUP_ENTRY') return 409;
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return 400;
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return 400;
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') return 503;
  return 500;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isIsoDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

module.exports = { dbErrorMessage, dbErrorStatus, isIsoDate };
