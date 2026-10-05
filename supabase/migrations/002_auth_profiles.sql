-- Login con Supabase Auth: perfiles y roles
-- Ejecutar completo en Supabase → SQL Editor. Se puede ejecutar más de una vez.

-- 1. Perfil de cada usuario (las contraseñas las guarda Supabase Auth, no esta tabla)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mesero' CHECK (role IN ('mesero', 'cajera', 'dueño')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- El personal con sesión iniciada puede ver los perfiles (nombre, rol, estado).
-- No hay políticas de INSERT/UPDATE/DELETE: nadie puede cambiar su propio rol desde la app.
-- Los roles se cambian desde el panel de Supabase o con SQL (ver SUPABASE_AUTH.md).
DROP POLICY IF EXISTS "Personal autenticado puede ver perfiles" ON public.profiles;
CREATE POLICY "Personal autenticado puede ver perfiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- 2. Crear el perfil automáticamente cuando alguien se registra.
--    Todo usuario nuevo empieza como mesero, sin importar lo que envíe la app.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    lower(NEW.email),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Perfiles para usuarios que ya existían en Authentication antes de esta migración
INSERT INTO public.profiles (id, email, name)
SELECT id, lower(email), COALESCE(NULLIF(trim(raw_user_meta_data->>'name'), ''), split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Cerrar las tablas de 001_initial_schema.sql, que tenían la política "Permitir todo"
--    (cualquiera con la clave pública podía leer y escribir).
DO $$
BEGIN
  -- La tabla vieja de usuarios guardaba hashes de contraseñas: queda bloqueada por completo
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Permitir todo" ON public.users';
  END IF;

  -- Mesas, ventas y configuración: solo personal con sesión iniciada
  IF to_regclass('public.mesas') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Permitir todo" ON public.mesas';
    EXECUTE 'DROP POLICY IF EXISTS "Personal autenticado" ON public.mesas';
    EXECUTE 'CREATE POLICY "Personal autenticado" ON public.mesas FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF to_regclass('public.ventas') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Permitir todo" ON public.ventas';
    EXECUTE 'DROP POLICY IF EXISTS "Personal autenticado" ON public.ventas';
    EXECUTE 'CREATE POLICY "Personal autenticado" ON public.ventas FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF to_regclass('public.config') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Permitir todo" ON public.config';
    EXECUTE 'DROP POLICY IF EXISTS "Personal autenticado" ON public.config';
    EXECUTE 'CREATE POLICY "Personal autenticado" ON public.config FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;
