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
  montoPagado?: number | null;
  cambio?: number | null;
  notaAdicional?: string | null;
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

// Libera una mesa ya cobrada solo si sigue siendo el mismo pedido (misma fecha de creación).
// Se usa al reintentar: si mientras tanto alguien abrió un pedido nuevo en esa mesa, no se borra.
export const liberarMesaCobrada = async (mesaKey: string, fechaCreacion?: string) => {
  const { data, error } = await getClient().from('mesas').select('data').eq('mesa_key', mesaKey).maybeSingle();
  if (error) throw new Error(error.message);
  const mesa = data?.data as { fechaCreacion?: string } | undefined;
  if (!mesa || mesa.fechaCreacion !== fechaCreacion) return;
  await liberarMesa(mesaKey);
};

// ---------- Ventas ----------

// Supabase entrega como máximo 1.000 filas por consulta, así que las ventas se piden por páginas.
const VENTAS_POR_PAGINA = 1000;

// Carga las ventas desde una fecha (o todas si desde es null), de la más nueva a la más vieja.
// Pedir solo el periodo que se muestra evita descargar toda la historia en cada actualización.
export const cargarVentas = async (desde: Date | null = null): Promise<Venta[]> => {
  const filas = [];
  const vistas = new Set<number>();
  for (let pagina = 0; ; pagina++) {
    let consulta = getClient()
      .from('ventas')
      .select('*')
      .order('fecha', { ascending: false })
      .order('id', { ascending: false })
      .range(pagina * VENTAS_POR_PAGINA, (pagina + 1) * VENTAS_POR_PAGINA - 1);
    if (desde) consulta = consulta.gte('fecha', desde.toISOString());
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    // Si entra una venta nueva mientras se descargan las páginas, la última de una página
    // se repite al inicio de la siguiente: se cuenta una sola vez
    (data ?? []).forEach(fila => {
      if (vistas.has(Number(fila.id))) return;
      vistas.add(Number(fila.id));
      filas.push(fila);
    });
    if (!data || data.length < VENTAS_POR_PAGINA) break;
  }
  return filas.map(fila => ({
    id: Number(fila.id),
    fecha: fila.fecha,
    mesa: fila.mesa,
    mesero: fila.mesero,
    pedidos: fila.pedidos,
    total: fila.total,
    metodoPago: fila.metodo_pago,
    montoPagado: fila.monto_pagado ?? null,
    cambio: fila.cambio ?? null,
    notaAdicional: fila.nota_adicional ?? null
  }));
};

// Guarda la venta. Si el cobro se envía dos veces (doble toque, o se reintenta porque la
// respuesta no llegó), la venta ya guardada con ese mismo número no se repite.
export const registrarVenta = async (venta: Venta) => {
  const fila = {
    id: venta.id,
    fecha: venta.fecha,
    mesa: venta.mesa,
    mesero: venta.mesero,
    pedidos: venta.pedidos,
    total: venta.total,
    metodo_pago: venta.metodoPago
  };
  const extras = {
    monto_pagado: venta.montoPagado ?? null,
    cambio: venta.cambio ?? null,
    nota_adicional: venta.notaAdicional?.trim() || null
  };
  let { error } = await getClient().from('ventas').insert({ ...fila, ...extras });
  // Bases creadas sin las columnas del pago: se guarda la venta sin ellas
  if (error?.code === 'PGRST204') ({ error } = await getClient().from('ventas').insert(fila));
  if (!error) return;
  if (error.code !== '23505') throw new Error(error.message);
  const { data, error: errorLectura } = await getClient()
    .from('ventas').select('mesa, total').eq('id', venta.id).maybeSingle();
  if (errorLectura || !data) throw new Error(errorLectura?.message ?? error.message);
  if (data.mesa === venta.mesa && data.total === venta.total) return;
  // Otro cobro tomó el mismo número en el mismo milisegundo: se guarda con el siguiente
  return registrarVenta({ ...venta, id: venta.id + 1 });
};

// ---------- Configuración (zonas, nombre del negocio, caja, WhatsApp, cierres) ----------

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

// Si se pide cargar mientras otra carga sigue en curso, se hace una sola carga más al terminar.
// Así, con internet lento, las cargas no se amontonan ni se cancelan entre sí.
const sinAmontonar = (cargar: () => unknown) => {
  let enCurso = false;
  let otraVez = false;
  const ejecutar = async () => {
    if (enCurso) {
      otraVez = true;
      return;
    }
    enCurso = true;
    try {
      await cargar();
    } finally {
      enCurso = false;
      if (otraVez) {
        otraVez = false;
        ejecutar();
      }
    }
  };
  return ejecutar;
};

// Mantiene los datos al día: carga al entrar, con cada cambio en vivo, cada pocos segundos
// como respaldo (solo con la pantalla visible), y al volver a la pestaña
// (los celulares pausan las pestañas en segundo plano).
export const mantenerActualizado = (tablas: string[], cargarDatos: () => unknown, cadaMs = 5000) => {
  const cargar = sinAmontonar(cargarDatos);
  cargar();
  const dejarDeEscuchar = escucharCambios(tablas, cargar);
  const intervalo = setInterval(() => { if (!document.hidden) cargar(); }, cadaMs);
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
