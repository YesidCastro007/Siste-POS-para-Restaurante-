-- Menú editable (categorías y productos) y mesas configurables desde la app
-- Ejecutar completo en Supabase → SQL Editor, después de 005_robustez.sql.
-- Se puede ejecutar más de una vez. Si el menú está vacío, carga el menú actual del restaurante.

-- 1. Tablas
CREATE TABLE IF NOT EXISTS public.categorias (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  icono TEXT NOT NULL DEFAULT '🍽️',
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- opciones: grupos que el mesero elige al pedir, por ejemplo
-- [{"nombre": "Término", "varias": false, "valores": ["Jugoso", "3/4", "Bien cocido"]}]
-- precio_libre: el mesero escribe el precio al pedir (por ejemplo, picadas al gusto)
CREATE TABLE IF NOT EXISTS public.productos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  categoria_id BIGINT NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),
  precio_libre BOOLEAN NOT NULL DEFAULT false,
  disponible BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  opciones JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);

-- 2. ¿El usuario de esta sesión puede editar el menú? (dueño o cajera activos)
CREATE OR REPLACE FUNCTION public.puede_editar_menu()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND active AND role IN ('dueño', 'cajera')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.puede_editar_menu() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.puede_editar_menu() TO authenticated;

-- 3. Todo el personal activo ve el menú; solo dueño y cajera lo cambian
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personal activo ve el menú" ON public.categorias;
DROP POLICY IF EXISTS "Dueño y cajera editan el menú" ON public.categorias;
CREATE POLICY "Personal activo ve el menú" ON public.categorias
  FOR SELECT TO authenticated USING (public.es_personal_activo());
CREATE POLICY "Dueño y cajera editan el menú" ON public.categorias
  FOR ALL TO authenticated USING (public.puede_editar_menu()) WITH CHECK (public.puede_editar_menu());

DROP POLICY IF EXISTS "Personal activo ve el menú" ON public.productos;
DROP POLICY IF EXISTS "Dueño y cajera editan el menú" ON public.productos;
CREATE POLICY "Personal activo ve el menú" ON public.productos
  FOR SELECT TO authenticated USING (public.es_personal_activo());
CREATE POLICY "Dueño y cajera editan el menú" ON public.productos
  FOR ALL TO authenticated USING (public.puede_editar_menu()) WITH CHECK (public.puede_editar_menu());

-- 4. Cambios en vivo: cuando el dueño cambia un precio, los meseros lo ven al instante
DO $$
DECLARE
  tabla TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tabla IN ARRAY ARRAY['categorias', 'productos'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tabla
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabla);
      END IF;
    END LOOP;
  END IF;
END $$;

-- 5. Mesas por zona (pisos, terraza, barra...). Se guardan en config y se editan desde la app.
INSERT INTO public.config (key, value) VALUES
  ('zonas', '[{"numero": 1, "nombre": "Piso 1", "mesas": 15}, {"numero": 2, "nombre": "Piso 2", "mesas": 18}, {"numero": 3, "nombre": "Piso 3", "mesas": 10}]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Menú inicial: el que tenía la app escrito en el código. Solo se carga si no hay categorías.
DO $$
DECLARE
  c BIGINT;
  terminos JSONB := '{"nombre": "Término", "varias": false, "valores": ["Jugoso", "3/4", "Bien cocido"]}'::jsonb;
  precio_sopa INTEGER;
  sabor TEXT;
  i INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM public.categorias) THEN
    RETURN;
  END IF;

  INSERT INTO public.categorias (nombre, icono, orden) VALUES ('Picadas', '🥩', 1) RETURNING id INTO c;
  INSERT INTO public.productos (categoria_id, nombre, precio, precio_libre, orden, opciones) VALUES
    (c, 'Picada', 0, true, 1, jsonb_build_array(
      '{"nombre": "Tamaño", "varias": false, "valores": ["Personal", "Para 2", "Para 4", "Familiar"]}'::jsonb,
      '{"nombre": "Carnes", "varias": true, "valores": ["Res", "Cerdo", "Rellena", "Chorizo", "Gallina"]}'::jsonb,
      terminos));

  INSERT INTO public.categorias (nombre, icono, orden) VALUES ('Gallina', '🐔', 2) RETURNING id INTO c;
  INSERT INTO public.productos (categoria_id, nombre, precio, orden) VALUES
    (c, '1/2 Gallina Asada', 40000, 1),
    (c, 'Gallina Entera', 80000, 2),
    (c, 'Pierna Pernil', 18000, 3),
    (c, 'Pechuga', 18000, 4),
    (c, 'Rabadilla', 18000, 5),
    (c, 'Ala', 10000, 6);

  INSERT INTO public.categorias (nombre, icono, orden) VALUES ('Sopas', '🍲', 3) RETURNING id INTO c;
  SELECT COALESCE((SELECT (value #>> '{}')::INTEGER FROM public.config WHERE key = 'precio_sopas'), 10000) INTO precio_sopa;
  FOR sabor IN
    SELECT jsonb_array_elements_text(COALESCE(
      (SELECT value FROM public.config WHERE key = 'sabores_sopas'),
      '["Sopa de costilla", "Sancocho"]'::jsonb))
  LOOP
    i := i + 1;
    INSERT INTO public.productos (categoria_id, nombre, precio, orden) VALUES (c, sabor, precio_sopa, i);
  END LOOP;

  INSERT INTO public.categorias (nombre, icono, orden) VALUES ('Bebidas', '🥤', 4) RETURNING id INTO c;
  INSERT INTO public.productos (categoria_id, nombre, precio, orden) VALUES
    (c, 'Jugo Hit Mango', 3000, 1),
    (c, 'Jugo Hit Lulo', 3000, 2),
    (c, 'Jugo Hit Mora', 3000, 3),
    (c, 'Jugo Hit Tropical', 3000, 4),
    (c, 'Jugo Hit Naranja Piña', 3000, 5),
    (c, 'Botella de Agua', 3000, 6),
    (c, 'Colombiana 350ml', 3000, 7),
    (c, 'Pepsi 350ml', 3000, 8),
    (c, 'Manzana 350ml', 3000, 9),
    (c, 'Cerveza Aguila', 3500, 10),
    (c, 'Cerveza Poker', 3500, 11),
    (c, 'Cola & Pola 330ml', 3500, 12),
    (c, 'Cola y Pola 1.5L', 8000, 13),
    (c, 'Colombiana 1.5L', 6000, 14),
    (c, 'Manzana 1.5L', 6000, 15),
    (c, 'Pepsi 1.5L', 6000, 16);

  INSERT INTO public.categorias (nombre, icono, orden) VALUES ('Adicionales', '🍟', 5) RETURNING id INTO c;
  INSERT INTO public.productos (categoria_id, nombre, precio, orden) VALUES
    (c, 'Porción de yuca', 4000, 1),
    (c, 'Porción de papa', 4000, 2),
    (c, 'Porción de plátano', 4000, 3),
    (c, 'Guacamole', 3000, 4),
    (c, 'Arepa', 2000, 5);
END $$;
