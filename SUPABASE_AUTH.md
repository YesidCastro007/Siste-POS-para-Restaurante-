# Configurar el login con Supabase Auth

El login, el registro y la recuperación de contraseña usan Supabase Auth. Las contraseñas ya no están en el código: las guarda Supabase, y el rol de cada persona (mesero, cajera, dueño) está en la tabla `profiles`.

Sin estos pasos la app no deja iniciar sesión, porque no hay usuarios por defecto.

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto (el plan gratuito sirve).
2. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**

## 2. Crear las tablas

1. Ve a **SQL Editor → New query**.
2. Si nunca ejecutaste `supabase/migrations/001_initial_schema.sql`, pega su contenido y pulsa **Run**.
3. Pega el contenido de `supabase/migrations/002_auth_profiles.sql` y pulsa **Run**.

## 3. Configurar el correo de recuperación

La app pide un código de 6 dígitos para recuperar la contraseña, así que el correo debe incluir ese código:

1. Ve a **Authentication → Emails → Templates → Reset Password** (en algunas versiones del panel: **Authentication → Email Templates**).
2. Reemplaza el contenido por algo como:

   ```html
   <h2>Recuperar contraseña</h2>
   <p>Su código de recuperación es: <strong>{{ .Token }}</strong></p>
   ```
3. Guarda.

Opcional: en **Authentication → Sign In / Providers → Email** puedes desactivar **Confirm email** si no quieres que los meseros nuevos confirmen su correo antes de entrar.

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
- Las mesas y ventas siguen guardándose en cada dispositivo (localStorage). Compartirlas entre dispositivos es el siguiente paso.
