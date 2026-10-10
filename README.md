# SHADOW · Sistema POS para restaurantes

Punto de venta para restaurantes: mesas, pedidos, cobros, caja con cierre y reporte en PDF, menú editable y panel del dueño. Todos los dispositivos ven lo mismo al instante porque los datos viven en Supabase.

## Cómo correrlo en tu computador

1. Instala las dependencias: `npm install`
2. Crea el archivo `.env.local` con las claves de Supabase (ver [SUPABASE_AUTH.md](SUPABASE_AUTH.md), paso 4).
3. Inicia la app: `npm run dev` y abre <http://localhost:8080>

La configuración completa de Supabase (tablas, usuarios, correos) está en [SUPABASE_AUTH.md](SUPABASE_AUTH.md).

## Comandos

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Abre la app en modo desarrollo |
| `npm run verificar` | Revisa que el código no tenga errores de tipos (TypeScript) |
| `npm run lint` | Revisa el estilo del código |
| `npm run build` | Arma la versión que se publica (Vercel lo hace solo al subir a `master`) |

## Cómo está organizado

```
src/
  components/
    SistemaPOS.tsx        Inicio de sesión y elige el panel según el rol
    login/                Pantalla de inicio de sesión, registro y contraseña olvidada
    mesero/               Mesas, pedidos y cobro
    cajera/               Caja: apertura, ventas del turno, cierre, PDF y WhatsApp
    dueno/                Resumen de ventas, usuarios y menú
    menu/                 Editores del menú, las zonas de mesas y el nombre del negocio
    CajeroMesasView.tsx   Mesas abiertas vistas desde la caja
    marca/                Logo y encabezados de SHADOW
    ui/                   Componentes base (botones, tarjetas, campos)
  lib/
    supabase.ts           Conexión con Supabase
    auth.ts               Sesión, roles y usuarios
    datos.ts              Mesas, ventas y configuración compartidas
    menu.ts               Menú, zonas y nombre del negocio
    pedidos.ts            Cómo se leen los productos de un pedido
    reporteCierre.ts      Cálculos del cierre de caja
    reportePDF.ts         PDF del cierre y envío por WhatsApp
    estadisticas.ts       Cálculos del panel del dueño
    formato.ts            Formato de pesos y fechas (siempre en español de Colombia)
    meseroColors.ts       Color de cada mesero
supabase/
  migrations/             SQL que se ejecuta en Supabase, en orden (002 a 007)
  templates/              Correo de recuperar contraseña
```
