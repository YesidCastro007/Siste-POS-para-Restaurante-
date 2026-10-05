import { supabase } from '@/lib/supabase';

// Datos compartidos del restaurante (mesas, ventas y configuración) guardados en Supabase,
// para que todos los dispositivos vean lo mismo. Ver supabase/migrations/003_datos_compartidos.sql.

export type Mesas = Record<string, unknown>;

export interface Venta {
  id: number;
  fecha: string;
  mesa: string;
  mesero: string;
  pedidos: unknown[];
  total: number;
  metodoPago: string;
}

const getClient = () => {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revise VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

// ---------- Mesas ----------

export const cargarMesas = async (): Promise<Mesas> => {
  const { data, error } = await getClient().from('mesas').select('mesa_key, data');
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map(fila => [fila.mesa_key, fila.data]));
};

// Guarda solo las mesas que cambiaron, para no pisar lo que otro mesero hizo en otra mesa.
// Nunca borra mesas: liberar una mesa se hace explícitamente con liberarMesa.
export const guardarCambiosMesas = async (anteriores: Mesas, nuevas: Mesas) => {
  const cambiadas = Object.entries(nuevas)
    .filter(([key, mesa]) => JSON.stringify(anteriores[key]) !== JSON.stringify(mesa))
    .map(([key, mesa]) => ({ mesa_key: key, data: mesa, updated_at: new Date().toISOString() }));
  if (cambiadas.length === 0) return;
  const { error } = await getClient().from('mesas').upsert(cambiadas);
  if (error) throw new Error(error.message);
};

export const liberarMesa = async (mesaKey: string) => {
  const { error } = await getClient().from('mesas').delete().eq('mesa_key', mesaKey);
  if (error) throw new Error(error.message);
};

// ---------- Ventas ----------

export const cargarVentas = async (): Promise<Venta[]> => {
  const { data, error } = await getClient()
    .from('ventas')
    .select('id, fecha, mesa, mesero, pedidos, total, metodo_pago')
    .order('fecha', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fila => ({
    id: Number(fila.id),
    fecha: fila.fecha,
    mesa: fila.mesa,
    mesero: fila.mesero,
    pedidos: fila.pedidos,
    total: fila.total,
    metodoPago: fila.metodo_pago
  }));
};

export const registrarVenta = async (venta: Venta) => {
  const { error } = await getClient().from('ventas').insert({
    id: venta.id,
    fecha: venta.fecha,
    mesa: venta.mesa,
    mesero: venta.mesero,
    pedidos: venta.pedidos,
    total: venta.total,
    metodo_pago: venta.metodoPago
  });
  if (error) throw new Error(error.message);
};

// ---------- Configuración (sabores de sopa, precio, caja, WhatsApp, cierres) ----------

export const leerConfig = async <T>(key: string, valorPorDefecto: T): Promise<T> => {
  const { data, error } = await getClient().from('config').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data.value as T) : valorPorDefecto;
};

export const guardarConfig = async (key: string, value: unknown) => {
  const { error } = await getClient()
    .from('config')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
};

// ---------- Cambios en vivo ----------

// Avisa cuando otro dispositivo cambia alguna de estas tablas. Devuelve la función para dejar de escuchar.
export const escucharCambios = (tablas: string[], alCambiar: () => void) => {
  if (!supabase) return () => {};
  const client = supabase;
  const canal = client.channel(`cambios-${tablas.join('-')}-${Math.random().toString(36).slice(2)}`);
  tablas.forEach(tabla => {
    canal.on('postgres_changes', { event: '*', schema: 'public', table: tabla }, alCambiar);
  });
  canal.subscribe();
  return () => { client.removeChannel(canal); };
};

// Mantiene los datos al día: carga al entrar, con cada cambio en vivo, cada pocos segundos
// como respaldo, y al volver a la pestaña (los celulares pausan las pestañas en segundo plano).
export const mantenerActualizado = (tablas: string[], cargar: () => void, cadaMs = 5000) => {
  cargar();
  const dejarDeEscuchar = escucharCambios(tablas, cargar);
  const intervalo = setInterval(cargar, cadaMs);
  const alVolver = () => { if (!document.hidden) cargar(); };
  document.addEventListener('visibilitychange', alVolver);
  window.addEventListener('focus', cargar);
  window.addEventListener('online', cargar);
  return () => {
    dejarDeEscuchar();
    clearInterval(intervalo);
    document.removeEventListener('visibilitychange', alVolver);
    window.removeEventListener('focus', cargar);
    window.removeEventListener('online', cargar);
  };
};
