# 🔄 Migración localStorage → Supabase

## ✅ Estado Actual
El sistema funciona **100% con localStorage**. No se rompe nada.

## 🎯 Cómo Activar Supabase

### Paso 1: Crear Proyecto en Supabase
1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Espera 2 minutos a que se configure

### Paso 2: Ejecutar SQL
1. En Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `supabase/migrations/001_initial_schema.sql`
3. Ejecuta (Run)

### Paso 3: Configurar Variables
1. Copia `.env.example` → `.env`
2. En Supabase Dashboard → Settings → API
3. Copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### Paso 4: Reiniciar
```bash
npm run dev
```

## 🚀 Cómo Funciona

### Sin Configurar (Default)
- ✅ Todo funciona con localStorage
- ✅ Sin cambios en el código
- ✅ Sin dependencias externas

### Con Supabase Configurado
- ✅ Guarda en localStorage (backup local)
- ✅ Sincroniza con Supabase (nube)
- ✅ Datos accesibles desde cualquier dispositivo
- ✅ Si Supabase falla, sigue funcionando con localStorage

## 📊 Datos Migrados

- ✅ Usuarios (meseros, cajeros, admin)
- ✅ Mesas y pedidos activos
- ✅ Historial de ventas
- ✅ Sabores de sopas
- ✅ Configuración de precios
- ✅ Estado de caja

## 🔧 Migración Manual de Datos Existentes

Si ya tienes datos en localStorage y quieres migrarlos a Supabase:

```javascript
// Ejecuta esto en la consola del navegador (F12)
// Solo UNA VEZ después de configurar Supabase

import { storage } from './src/lib/storage';

// Forzar sincronización
const users = JSON.parse(localStorage.getItem('santandereano_users') || '{}');
const mesas = JSON.parse(localStorage.getItem('santandereano_mesas') || '{}');
const ventas = JSON.parse(localStorage.getItem('santandereano_ventas') || '[]');

await storage.saveUsers(users);
await storage.saveMesas(mesas);
await storage.saveVentas(ventas);

console.log('✅ Datos migrados a Supabase');
```

## 🛡️ Seguridad

Las políticas RLS están configuradas como "permitir todo" para desarrollo.
Para producción, configura políticas específicas por rol.

## 📝 Notas

- El sistema es **híbrido**: localStorage + Supabase
- Si Supabase no está configurado, funciona 100% offline
- Si Supabase está configurado, sincroniza automáticamente
- localStorage siempre es el backup local
