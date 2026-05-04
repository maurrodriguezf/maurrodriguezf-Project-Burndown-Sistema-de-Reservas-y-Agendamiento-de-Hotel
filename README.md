# Hotel Alberto — Sistema de Reservas (PRY3211)

Servidor + cliente web del Sistema de Reservas y Agendamiento de Hotel Alberto. Implementa las HU del Product Backlog: disponibilidad (HU-01), reserva (HU-02), edición/cancelación (HU-03) y autenticación (HU-04). Diseño visual basado en el Figma Design System del proyecto (paleta Ink/Gold/Rust/Sage/Sand/Ivory + tipografía Times Roman / Helvetica).

## Stack

- Node.js + Express
- MySQL 8 (driver `mysql2`)
- JWT + bcryptjs para autenticación
- Frontend vanilla (HTML/CSS/JS) servido como estático

## Requisitos

- Node.js 18+
- MySQL 8 corriendo en `localhost:3306` (XAMPP / MySQL Workbench / Docker sirven)

## Setup

```bash
cd Src
npm install
cp .env.example .env     # edita DB_PASSWORD y JWT_SECRET si corresponde
npm run db:init          # crea BD, tablas, datos semilla y usuario admin
npm start                # servidor en http://localhost:3000
```

Si MySQL no está iniciado verás un aviso al arrancar y un banner rojo en el cliente. El healthcheck en `GET /health` devuelve el motivo concreto (`ECONNREFUSED`, `ER_BAD_DB_ERROR`, `JWT_SECRET missing`, etc.).

Usuario seed: `admin@hotel.local` / `admin123` (rol ADMIN).

## Endpoints principales

| Método | Ruta | Auth | HU |
|--------|------|------|----|
| POST | `/auth/register` | — | HU-04 |
| POST | `/auth/login` | — | HU-04 |
| GET | `/habitaciones` | — | HU-01 |
| GET | `/habitaciones/disponibles?entrada=YYYY-MM-DD&salida=YYYY-MM-DD` | — | HU-01 |
| POST | `/habitaciones` | ADMIN | — |
| POST | `/reservas` | — | HU-02 |
| GET | `/reservas` | Bearer | HU-03 |
| GET | `/reservas/:id` | Bearer | HU-03 |
| PUT | `/reservas/:id` | Bearer | HU-03 |
| DELETE | `/reservas/:id` | Bearer | HU-03 |
| GET | `/health` | — | — |

## Ejemplos rápidos

Login:
```bash
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@hotel.local\",\"password\":\"admin123\"}"
```

Disponibilidad:
```bash
curl "http://localhost:3000/habitaciones/disponibles?entrada=2026-05-01&salida=2026-05-05"
```

Crear reserva:
```bash
curl -X POST http://localhost:3000/reservas ^
  -H "Content-Type: application/json" ^
  -d "{\"habitacion_id\":1,\"cliente_nombre\":\"Juan Perez\",\"cliente_email\":\"juan@test.cl\",\"fecha_entrada\":\"2026-05-01\",\"fecha_salida\":\"2026-05-05\"}"
```

## Estructura

```
Src/
├─ server.js                   arranque, /health, error handler global
├─ db/
│  ├─ pool.js                  pool mysql2 (lee .env)
│  ├─ schema.sql               BD, tablas, seed de habitaciones
│  └─ errors.js                mapa código MySQL → mensaje + status HTTP
├─ routes/
│  ├─ auth.js                  HU-04: login, register, JWT HS256
│  ├─ habitaciones.js          HU-01: disponibilidad + CRUD admin
│  └─ reservas.js              HU-02 / HU-03: crear, listar, modificar, cancelar
├─ middleware/auth.js          requireAuth + requireRole(roles[])
├─ public/                     cliente web
│  ├─ index.html               vistas y formularios
│  ├─ style.css                paleta y tipografía Hotel Alberto
│  └─ app.js                   lógica, healthcheck, auto-logout en 401
└─ scripts/init-db.js          ejecuta schema.sql + crea admin seed
```

## Cumplimiento de la Definition of Done

| HU | Endpoint / UI | Estado |
|----|---------------|--------|
| HU-00 | Estructura repo, schema, seed admin, README | ✅ |
| HU-01 | `GET /habitaciones/disponibles` con validación ISO + exclusión de solapes CONFIRMADAS | ✅ |
| HU-02 | `POST /reservas` con `SELECT … FOR UPDATE`, `haySolape()`, total estimado en UI | ✅ |
| HU-03 | `PUT/DELETE /reservas/:id` (soft-delete), panel de stats (confirmadas + ocupación) | ✅ |
| HU-04 | JWT HS256, bcrypt salt 10, `requireAuth` 401 / `requireRole` 403 | ✅ |

## Solución de problemas

| Síntoma | Causa probable | Acción |
|---------|---------------|--------|
| Banner rojo "Base de datos no disponible" | MySQL no corre | `net start MySQL80` (Windows) o iniciar XAMPP |
| `ER_ACCESS_DENIED_ERROR` | password en `.env` no coincide | corregir `DB_PASSWORD` en `.env` |
| `ER_BAD_DB_ERROR` | BD no creada | `npm run db:init` |
| Banner amarillo "JWT_SECRET no configurado" | falta variable en `.env` | definir `JWT_SECRET=<cadena_larga>` |
| Toast "Sesión expirada" al recargar | token caducado | volver a iniciar sesión (auto-logout ya limpia el storage) |
