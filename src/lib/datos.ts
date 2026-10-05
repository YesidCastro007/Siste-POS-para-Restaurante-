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

// Guarda solo las mesas que cambiaron, para no pisar lo que otro mesero hizo en otra mesa
export const guardarCambiosMesas = async (anteriores: Mesas, nuevas: Mesas) => {
  const client = getClient();
  const cambiadas = Object.entries(nuevas)
    .filter(([key, mesa]) => JSON.stringify(anteriores[key]) !== JSON.stringify(mesa))
    .map(([key, mesa]) => ({ mesa_key: key, data: mesa, updated_at: new Date().toISOString() }));
  const borradas = Object.keys(anteriores).filter(key => !(key in nuevas));

  if (cambiadas.length > 0) {
    const { error } = await client.from('mesas').upsert(cambiadas);
    if (error) throw new Error(error.message);
  }
  if (borradas.length > 0) {
    const { error } = await client.from('mesas').delete().in('mesa_key', borradas);
    if (error) throw new Error(error.message);
  }
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
