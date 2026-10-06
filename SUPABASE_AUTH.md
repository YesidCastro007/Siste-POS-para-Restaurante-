# Configurar el login con Supabase Auth

El login, el registro y la recuperación de contraseña usan Supabase Auth. Las contraseñas ya no están en el código: las guarda Supabase, y el rol de cada persona (mesero, cajera, dueño) está en la tabla `profiles`.

Sin estos pasos la app no deja iniciar sesión, porque no hay usuarios por defecto.

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto (el plan gratuito sirve).
2. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **publishable key** (empieza con `sb_publishable_`; en cuentas antiguas aparece como **anon public**). Nunca uses la **secret** ni la **service_role**.

## 2. Crear las tablas

1. Ve a **SQL Editor → New query**.
2. Si nunca ejecutaste `supabase/migrations/001_initial_schema.sql`, pega su contenido y pulsa **Run**.
3. Pega el contenido de `supabase/migrations/002_auth_profiles.sql` y pulsa **Run**.
4. Pega el contenido de `supabase/migrations/003_datos_compartidos.sql` y pulsa **Run**. Esto crea las tablas de mesas, ventas y configuración que comparten todos los dispositivos.

## 3. Configurar las direcciones de la app

Cuando alguien olvida su contraseña, Supabase le envía un correo con un enlace **Reset password**. Ese enlace debe volver a tu app:

1. Ve a **Authentication → URL Configuration**.
2. En **Site URL** pon la dirección de producción de tu app en Vercel (por ejemplo `https://sistema-restaurante-santandereano.vercel.app`).
3. En **Redirect URLs** pulsa **Add URL** y agrega:
   - `https://*-yesid-castros-projects-96036457.vercel.app/**` (las vistas previas de Vercel)
   - `http://localhost:8080/**` (cuando pruebas en tu computador)
4. Guarda.

**Importante sobre los correos:** sin un servidor de correo propio (SMTP), Supabase solo envía correos a los miembros de tu organización en Supabase (por ejemplo, tu propio correo) y muy pocos por hora. Sirve para probar. Para que los meseros reciban sus correos de recuperación y confirmación, configura un SMTP en **Authentication → Emails → SMTP Settings** (por ejemplo con [Resend](https://resend.com), que tiene plan gratuito).

Opcional: en **Authentication → Sign In / Providers → Email** puedes desactivar **Confirm email** para que los meseros nuevos entren sin confirmar su correo.

## 4. Poner las claves en la app

**En tu computador:** crea un archivo `.env.local` en la carpeta del proyecto (junto a `package.json`) con:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Este archivo no se sube a GitHub (está en `.gitignore`).

**En Vercel:** ve a tu proyecto → **Settings → Environment Variables**, agrega las mismas dos variables y vuelve a desplegar (**Deployments → ⋯ → Redeploy**).

## 5. Crear los usuarios

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Escribe el correo y una contraseña nueva (no reutilices las que estaban en el código), y marca **Auto Confirm User**.
3. Repite para cada persona del equipo. Todos quedan como **mesero**.

Para dar otro rol, ve a **SQL Editor** y ejecuta, cambiando el correo:

```sql
UPDATE public.profiles SET role = 'dueño' WHERE email = 'admin@santandereano.com';
UPDATE public.profiles SET role = 'cajera' WHERE email = 'administrivocaja@santandereano.com';
```

Para desactivar a alguien sin borrarlo:

```sql
UPDATE public.profiles SET active = false WHERE email = 'correo@ejemplo.com';
```

Para ver todos los usuarios con su rol: **Table Editor → profiles**.

## Notas

- Cualquier persona puede registrarse desde la pantalla de login, siempre como mesero. Si quieres que solo el dueño cree cuentas, desactiva **Allow new users to sign up** en **Authentication → Sign In / Providers**.
- Cada pestaña del navegador tiene su propia sesión, igual que antes.
- Las mesas, ventas, sabores de sopa, estado de la caja y número de WhatsApp se guardan en Supabase, así que todos los dispositivos ven lo mismo y se actualiza al instante.
