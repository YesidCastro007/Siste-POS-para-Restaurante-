-- El dueño cambia roles y activa o desactiva usuarios desde su panel, sin SQL
-- Ejecutar completo en Supabase → SQL Editor, después de 002_auth_profiles.sql. Se puede ejecutar más de una vez.

-- La tabla profiles sigue sin permisos de escritura desde la app. El único camino es esta
-- función, que revisa en la base de datos que quien la llama sea un dueño activo.
-- Por seguridad, desde la app solo se asignan los roles mesero y cajera, y no se puede
-- modificar a otro dueño ni a uno mismo (así nadie queda por fuera del panel por error).
CREATE OR REPLACE FUNCTION public.actualizar_usuario(usuario UUID, nuevo_rol TEXT, activo BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dueño' AND active
  ) THEN
    RAISE EXCEPTION 'Solo el dueño puede cambiar usuarios';
  END IF;

  IF usuario = auth.uid() THEN
    RAISE EXCEPTION 'No puede cambiar su propio usuario';
  END IF;

  IF nuevo_rol NOT IN ('mesero', 'cajera') THEN
    RAISE EXCEPTION 'Rol no permitido';
  END IF;

  UPDATE public.profiles
  SET role = nuevo_rol, active = activo
  WHERE id = usuario AND role <> 'dueño';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado o es un dueño';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_usuario(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actualizar_usuario(UUID, TEXT, BOOLEAN) TO authenticated;

-- Cambios en vivo de la lista de usuarios en el panel del dueño
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
