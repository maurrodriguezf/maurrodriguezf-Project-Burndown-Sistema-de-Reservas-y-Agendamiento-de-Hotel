CREATE DATABASE IF NOT EXISTS hotel_reservas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hotel_reservas;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('ADMIN','RECEPCIONISTA','TURISTA') NOT NULL DEFAULT 'RECEPCIONISTA',
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS habitaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  numero      VARCHAR(10) NOT NULL UNIQUE,
  tipo        ENUM('INDIVIDUAL','DOBLE','SUITE') NOT NULL,
  capacidad   TINYINT UNSIGNED NOT NULL,
  precio_noche DECIMAL(10,2) NOT NULL,
  estado      ENUM('DISPONIBLE','MANTENIMIENTO','FUERA_SERVICIO') NOT NULL DEFAULT 'DISPONIBLE'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  habitacion_id   INT NOT NULL,
  cliente_nombre  VARCHAR(150) NOT NULL,
  cliente_email   VARCHAR(150) NOT NULL,
  cliente_rut     VARCHAR(20),
  fecha_entrada   DATE NOT NULL,
  fecha_salida    DATE NOT NULL,
  estado          ENUM('CONFIRMADA','CANCELADA','FINALIZADA') NOT NULL DEFAULT 'CONFIRMADA',
  creada_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reserva_habitacion
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
  CONSTRAINT chk_fechas CHECK (fecha_salida > fecha_entrada),
  INDEX idx_reserva_fechas (habitacion_id, fecha_entrada, fecha_salida)
) ENGINE=InnoDB;

INSERT IGNORE INTO habitaciones (numero, tipo, capacidad, precio_noche, estado) VALUES
  ('101','INDIVIDUAL',1,35000,'DISPONIBLE'),
  ('102','DOBLE',2,55000,'DISPONIBLE'),
  ('201','DOBLE',2,60000,'DISPONIBLE'),
  ('202','SUITE',4,120000,'DISPONIBLE'),
  ('301','SUITE',4,150000,'MANTENIMIENTO');
