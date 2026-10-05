-- Mesas, ventas y configuración compartidas entre dispositivos
-- Ejecutar completo en Supabase → SQL Editor, después de 002_auth_profiles.sql. Se puede ejecutar más de una vez.

-- 1. Tablas (ya existen si se ejecutó 001_initial_schema.sql)
CREATE TABLE IF NOT EXISTS public.mesas (
  mesa_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ventas (
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

CREATE TABLE IF NOT EXISTS public.config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha DESC);

-- 2. Solo el personal con sesión iniciada puede leer y escribir
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo" ON public.mesas;
DROP POLICY IF EXISTS "Permitir todo" ON public.ventas;
DROP POLICY IF EXISTS "Permitir todo" ON public.config;

DROP POLICY IF EXISTS "Personal autenticado" ON public.mesas;
CREATE POLICY "Personal autenticado" ON public.mesas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Las ventas se registran y se consultan, pero nadie las modifica ni las borra desde la app
DROP POLICY IF EXISTS "Personal autenticado" ON public.ventas;
DROP POLICY IF EXISTS "Personal puede ver ventas" ON public.ventas;
DROP POLICY IF EXISTS "Personal puede registrar ventas" ON public.ventas;
CREATE POLICY "Personal puede ver ventas" ON public.ventas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Personal puede registrar ventas" ON public.ventas
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Personal autenticado" ON public.config;
CREATE POLICY "Personal autenticado" ON public.config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Valores iniciales (no cambia los que ya existan)
INSERT INTO public.config (key, value) VALUES
  ('sabores_sopas', '["Sopa de costilla", "Sancocho"]'::jsonb),
  ('caja_estado', '{"abierta": false, "fechaApertura": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Cambios en vivo: cuando un mesero guarda una mesa, la cajera la ve al instante
DO $$
DECLARE
  tabla TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tabla IN ARRAY ARRAY['mesas', 'ventas', 'config'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tabla
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabla);
      END IF;
    END LOOP;
  END IF;
END $$;
