# Hotel Reservas — Servidor Local (PRY3211)

Servidor local del Sistema de Reservas y Agendamiento de Hotel. Implementa las HU del Product Backlog: disponibilidad (HU-01), reserva (HU-02), edición/cancelación (HU-03) y autenticación (HU-04).

## Stack

- Node.js + Express
- MySQL 8 (driver `mysql2`)
- JWT + bcryptjs para autenticación

## Requisitos

- Node.js 18+
- MySQL 8 corriendo en `localhost:3306` (XAMPP / MySQL Workbench / Docker sirven)

## Setup

```bash
cd Src
npm install
cp .env.example .env     # edita DB_PASSWORD si corresponde
npm run db:init          # crea BD, tablas, datos semilla y usuario admin
npm start                # servidor en http://localhost:3000
```

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
├─ server.js
├─ db/
│  ├─ pool.js
│  └─ schema.sql
├─ routes/
│  ├─ auth.js
│  ├─ habitaciones.js
│  └─ reservas.js
├─ middleware/auth.js
└─ scripts/init-db.js
```
