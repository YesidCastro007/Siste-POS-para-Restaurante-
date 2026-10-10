-- Permisos por rol en la configuración y ventas con total válido
-- Ejecutar completo en Supabase → SQL Editor, después de 006_menu_y_mesas.sql.
-- Se puede ejecutar más de una vez. No borra ni cambia datos.

-- 1. Configuración (estado de la caja, cierres, WhatsApp, zonas, nombre del negocio):
--    todo el personal activo la lee; solo dueño y cajera la cambian.
--    Antes cualquier mesero activo podía, por ejemplo, abrir o cerrar la caja desde fuera de la app.
DROP POLICY IF EXISTS "Personal activo" ON public.config;
DROP POLICY IF EXISTS "Personal activo lee la configuración" ON public.config;
DROP POLICY IF EXISTS "Dueño y cajera crean configuración" ON public.config;
DROP POLICY IF EXISTS "Dueño y cajera cambian configuración" ON public.config;
DROP POLICY IF EXISTS "Dueño y cajera borran configuración" ON public.config;

CREATE POLICY "Personal activo lee la configuración" ON public.config
  FOR SELECT TO authenticated USING ((SELECT public.es_personal_activo()));
CREATE POLICY "Dueño y cajera crean configuración" ON public.config
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.puede_editar_menu()));
CREATE POLICY "Dueño y cajera cambian configuración" ON public.config
  FOR UPDATE TO authenticated USING ((SELECT public.puede_editar_menu())) WITH CHECK ((SELECT public.puede_editar_menu()));
CREATE POLICY "Dueño y cajera borran configuración" ON public.config
  FOR DELETE TO authenticated USING ((SELECT public.puede_editar_menu()));

-- 2. Mesas y ventas: mismos permisos que en 005, escritos con (SELECT ...) para que
--    la base de datos revise el permiso una vez por consulta y no una vez por fila
DROP POLICY IF EXISTS "Personal activo" ON public.mesas;
CREATE POLICY "Personal activo" ON public.mesas
  FOR ALL TO authenticated USING ((SELECT public.es_personal_activo())) WITH CHECK ((SELECT public.es_personal_activo()));

DROP POLICY IF EXISTS "Personal puede ver ventas" ON public.ventas;
DROP POLICY IF EXISTS "Personal puede registrar ventas" ON public.ventas;
CREATE POLICY "Personal puede ver ventas" ON public.ventas
  FOR SELECT TO authenticated USING ((SELECT public.es_personal_activo()));
CREATE POLICY "Personal puede registrar ventas" ON public.ventas
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.es_personal_activo()));

-- 3. Una venta no puede tener total negativo (las ventas que ya existen no se revisan)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_total_no_negativo') THEN
    ALTER TABLE public.ventas ADD CONSTRAINT ventas_total_no_negativo CHECK (total >= 0) NOT VALID;
  END IF;
END $$;

-- 4. Revisión: debe mostrar 4 políticas en config, 1 en mesas y 2 en ventas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('config', 'mesas', 'ventas')
ORDER BY tablename, cmd;
