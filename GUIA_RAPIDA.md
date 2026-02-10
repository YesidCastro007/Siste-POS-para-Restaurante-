# 🚀 Guía Rápida de Migración

## ✅ Lo que ya está listo

1. ✅ `src/lib/supabase.ts` - Cliente de Supabase
2. ✅ `src/lib/storage.ts` - Capa de abstracción híbrida
3. ✅ `supabase/migrations/001_initial_schema.sql` - Schema de BD
4. ✅ `.env.example` - Template de configuración

## 🎯 Pasos para Activar

### 1. Configurar Supabase (5 minutos)

```bash
# 1. Crear proyecto en https://supabase.com
# 2. Copiar .env.example a .env
cp .env.example .env

# 3. Editar .env con tus credenciales
# VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# VITE_SUPABASE_ANON_KEY=tu-key
```

### 2. Crear Tablas en Supabase

1. Ir a Supabase Dashboard → SQL Editor
2. Copiar contenido de `supabase/migrations/001_initial_schema.sql`
3. Ejecutar

### 3. Integrar en el Código

Reemplazar en `SantandereanoSystem.tsx`:

```typescript
// AGREGAR AL INICIO
import { storage } from '@/lib/storage';

// REEMPLAZAR getUsersFromStorage
const getUsersFromStorage = async () => {
  return await storage.getUsers();
};

// REEMPLAZAR saveUsersToStorage
const saveUsersToStorage = async (users) => {
  await storage.saveUsers(users);
};

// HACER ASYNC handleLogin
const handleLogin = async () => {
  // ...
  const users = await getUsersFromStorage();
  // ...
};

// HACER ASYNC createUser
const createUser = async (email, password, name) => {
  const users = await getUsersFromStorage();
  // ...
  await saveUsersToStorage(users);
  // ...
};
```

### 4. Actualizar MeseroDashboard

```typescript
// cargarDatos
const cargarDatos = async () => {
  const [mesas, ventas, sabores, precio] = await Promise.all([
    storage.getMesas(),
    storage.getVentas(),
    storage.getSaboresSopas(),
    storage.getPrecioSopas()
  ]);
  setMesas(mesas);
  setHistorialVentas(ventas);
  setSaboresSopas(sabores);
  setPrecioSopas(precio);
};

// guardarMesas
const guardarMesas = async (nuevasMesas) => {
  await storage.saveMesas(nuevasMesas);
  setMesas(nuevasMesas);
};

// guardarVentas
const guardarVentas = async (nuevasVentas) => {
  await storage.saveVentas(nuevasVentas);
  setHistorialVentas(nuevasVentas);
};
```

### 5. Actualizar CajeraDashboard

```typescript
const cargarDatos = async () => {
  const [ventas, sabores, precio] = await Promise.all([
    storage.getVentas(),
    storage.getSaboresSopas(),
    storage.getPrecioSopas()
  ]);
  setVentasHoy(ventas);
  setSaboresSopas(sabores);
  setPrecioSopas(precio);
};

const agregarSabor = async () => {
  const nuevosSabores = [...saboresSopas, nuevoSabor.trim()];
  await storage.saveSaboresSopas(nuevosSabores);
  setSaboresSopas(nuevosSabores);
};
```

## 🔄 Migrar Datos Existentes

Después de configurar, ejecuta en consola del navegador (F12):

```javascript
// Copiar y pegar en consola
const migrar = async () => {
  const { storage } = await import('./src/lib/storage');
  
  const users = JSON.parse(localStorage.getItem('santandereano_users') || '{}');
  const mesas = JSON.parse(localStorage.getItem('santandereano_mesas') || '{}');
  const ventas = JSON.parse(localStorage.getItem('santandereano_ventas') || '[]');
  
  await storage.saveUsers(users);
  await storage.saveMesas(mesas);
  await storage.saveVentas(ventas);
  
  console.log('✅ Migración completa');
};
migrar();
```

## 🎉 Resultado

- ✅ Sin configurar: funciona con localStorage
- ✅ Con Supabase: sincroniza automáticamente
- ✅ Datos en tiempo real entre dispositivos
- ✅ Backup local siempre disponible

## 📝 Cambios Mínimos Requeridos

Total de líneas a cambiar: ~20-30
Total de funciones a modificar: ~8-10
Tiempo estimado: 30 minutos

¡El frontend NO se rompe en ningún momento!
