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
5. Pega el contenido de `supabase/migrations/004_dueno_gestiona_usuarios.sql` y pulsa **Run**. Esto deja que el dueño cambie roles y desactive usuarios desde su panel.
6. Pega el contenido de `supabase/migrations/005_robustez.sql` y pulsa **Run**. Esto hace que solo el personal **activo** pueda ver y cambiar datos, y que las cuentas nuevas queden inactivas hasta que el dueño las active.

## 3. Configurar las direcciones de la app

Cuando alguien olvida su contraseña, Supabase le envía un correo con un enlace **Reset password**. Ese enlace debe volver a tu app:

1. Ve a **Authentication → URL Configuration**.
2. En **Site URL** pon la dirección de producción de tu app en Vercel (por ejemplo `https://sistema-restaurante-santandereano.vercel.app`).
3. En **Redirect URLs** pulsa **Add URL** y agrega:
   - `https://*-yesid-castros-projects-96036457.vercel.app/**` (las vistas previas de Vercel)
   - `http://localhost:8080/**` (cuando pruebas en tu computador)
4. Guarda.

**Importante sobre los correos:** sin un servidor de correo propio (SMTP), Supabase solo envía correos a los miembros de tu organización en Supabase (por ejemplo, tu propio correo) y muy pocos por hora. Para que los meseros y la cajera reciban el correo de recuperación, sigue la sección **6. Enviar los correos con Gmail**.

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
3. Repite para cada persona del equipo. Todos quedan como **mesero inactivo**, igual que quien se registra desde la app.

Para **activar** una cuenta nueva, hacer a alguien **cajera** o desactivarlo sin borrarlo, entra como dueño y usa la sección **Usuarios** del panel.

Desde el panel no se puede nombrar a otro **dueño** (por seguridad). Para eso ve a **SQL Editor** y ejecuta, cambiando el correo:

```sql
UPDATE public.profiles SET role = 'dueño', active = true WHERE email = 'correo@ejemplo.com';
```

El primer dueño de una instalación nueva se crea así: se registra o se crea en **Authentication → Users** y luego se ejecuta ese mismo comando.

Para ver todos los usuarios con su rol: **Table Editor → profiles**.

## 6. Enviar los correos con Gmail

Supabase puede enviar los correos de recuperación desde tu cuenta de Gmail. Gmail permite hasta 500 correos al día, más que suficiente para el restaurante.

### 6.1 Crear una contraseña de aplicación en Google

Google no deja usar tu contraseña normal; hay que crear una especial solo para Supabase.

1. Entra a <https://myaccount.google.com/security> con el Gmail que enviará los correos.
2. Activa la **Verificación en 2 pasos** si no la tienes (Google lo exige).
3. Entra a <https://myaccount.google.com/apppasswords>.
4. En el nombre escribe `Supabase` y pulsa **Crear**.
5. Google muestra una clave de 16 letras (por ejemplo `abcd efgh ijkl mnop`). Cópiala sin los espacios. No la compartas con nadie ni la guardes en el código.

### 6.2 Configurar el SMTP en Supabase

1. En Supabase ve a **Authentication → Emails → SMTP Settings**.
2. Activa **Enable custom SMTP** y llena:
   - **Sender email:** tu Gmail (el mismo del paso 6.1)
   - **Sender name:** `Santandereano SAS`
   - **Host:** `smtp.gmail.com`
   - **Port number:** `465`
   - **Username:** tu Gmail
   - **Password:** la clave de 16 letras, sin espacios
3. Pulsa **Save changes**.

### 6.3 Poner el correo en español

1. Ve a **Authentication → Emails → Templates** y elige **Reset Password**.
2. En **Subject** escribe: `Recupera tu contraseña - Santandereano SAS`
3. En el cuerpo (**Message body**) borra lo que hay y pega todo el contenido de `supabase/templates/recuperar-contrasena.html`. Es un correo con el nombre y los colores del restaurante, un botón para crear la contraseña nueva y el enlace de respaldo.
4. Pulsa **Save changes**.

### 6.4 Probar

1. Abre la app, pulsa **¿Olvidaste tu contraseña?** y escribe el correo de un usuario del equipo.
2. Revisa su bandeja de entrada (y la carpeta de spam). Debe llegar el correo en español.
3. Al pulsar **Crear una contraseña nueva**, la app abre el formulario para cambiarla.

Si el correo no llega, revisa en Supabase **Logs → Auth** el error que aparece. Si el enlace del correo abre una página equivocada, revisa la sección **3. Configurar las direcciones de la app**.

## Notas

- Cualquier persona puede registrarse desde la pantalla de login, siempre como mesero. Si quieres que solo el dueño cree cuentas, desactiva **Allow new users to sign up** en **Authentication → Sign In / Providers**.
- Cada pestaña del navegador tiene su propia sesión, igual que antes.
- Las mesas, ventas, sabores de sopa, estado de la caja y número de WhatsApp se guardan en Supabase, así que todos los dispositivos ven lo mismo y se actualiza al instante.
