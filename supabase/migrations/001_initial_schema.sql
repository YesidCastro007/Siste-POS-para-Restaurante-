-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mesero', 'cajera', 'dueño')),
  salt TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mesas
CREATE TABLE IF NOT EXISTS mesas (
  mesa_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id BIGINT PRIMARY KEY,
  fecha TIMESTAMPTZ NOT NULL,
  mesa TEXT NOT NULL,
  mesero TEXT NOT NULL,
  pedidos JSONB NOT NULL,
  total INTEGER NOT NULL,
  metodo_pago TEXT,
  monto_pagado INTEGER,
  cambio INTEGER,
  nota_adicional TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_mesero ON ventas(mesero);
CREATE INDEX IF NOT EXISTS idx_mesas_updated ON mesas(updated_at DESC);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir todo" ON users FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON mesas FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON ventas FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON config FOR ALL USING (true);
