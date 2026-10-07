-- Seguridad: solo el personal ACTIVO puede ver y cambiar datos del restaurante
-- Ejecutar completo en Supabase → SQL Editor, después de 004_dueno_gestiona_usuarios.sql.
-- Se puede ejecutar más de una vez. Las cuentas que ya existen no cambian.

-- 1. Las cuentas nuevas quedan inactivas hasta que el dueño las active desde su panel.
--    Así, alguien que encuentre la página y se registre no puede ver nada.
ALTER TABLE public.profiles ALTER COLUMN active SET DEFAULT false;

-- 2. ¿El usuario de esta sesión es personal activo?
--    SECURITY DEFINER para poder leer profiles sin depender de sus propias políticas.
CREATE OR REPLACE FUNCTION public.es_personal_activo()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND active
  );
$$;

REVOKE EXECUTE ON FUNCTION public.es_personal_activo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_personal_activo() TO authenticated;

-- 3. Perfiles: cada quien ve el suyo (para saber si está activo al entrar);
--    el personal activo ve los de todos.
DROP POLICY IF EXISTS "Personal autenticado puede ver perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Ver perfil propio o personal activo" ON public.profiles;
CREATE POLICY "Ver perfil propio o personal activo" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.es_personal_activo());

-- 4. Mesas y configuración: leer y escribir solo personal activo
DROP POLICY IF EXISTS "Personal autenticado" ON public.mesas;
DROP POLICY IF EXISTS "Personal activo" ON public.mesas;
CREATE POLICY "Personal activo" ON public.mesas
  FOR ALL TO authenticated USING (public.es_personal_activo()) WITH CHECK (public.es_personal_activo());

DROP POLICY IF EXISTS "Personal autenticado" ON public.config;
DROP POLICY IF EXISTS "Personal activo" ON public.config;
CREATE POLICY "Personal activo" ON public.config
  FOR ALL TO authenticated USING (public.es_personal_activo()) WITH CHECK (public.es_personal_activo());

-- 5. Ventas: el personal activo las registra y las consulta; nadie las modifica ni las borra
DROP POLICY IF EXISTS "Personal puede ver ventas" ON public.ventas;
DROP POLICY IF EXISTS "Personal puede registrar ventas" ON public.ventas;
CREATE POLICY "Personal puede ver ventas" ON public.ventas
  FOR SELECT TO authenticated USING (public.es_personal_activo());
CREATE POLICY "Personal puede registrar ventas" ON public.ventas
  FOR INSERT TO authenticated WITH CHECK (public.es_personal_activo());
