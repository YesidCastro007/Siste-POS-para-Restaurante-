import { clienteSupabase } from '@/lib/supabase';
import { leerConfig, guardarConfig } from '@/lib/datos';

// Menú y mesas de cada negocio, guardados en Supabase y editables desde la app.
// Ver supabase/migrations/006_menu_y_mesas.sql.

// Grupo de opciones que el mesero elige al pedir (por ejemplo "Término": Jugoso, 3/4, Bien cocido).
// varias = true deja escoger más de un valor (por ejemplo las carnes de una picada).
export interface Opcion {
  nombre: string;
  varias: boolean;
  valores: string[];
}

export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  precio: number;
  precio_libre: boolean;
  disponible: boolean;
  orden: number;
  opciones: Opcion[];
}

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  orden: number;
  productos: Producto[];
}

// Zona del restaurante (piso, terraza, barra...) con su cantidad de mesas.
// numero identifica la zona en las mesas guardadas ("1-4" es la mesa 4 de la zona 1).
export interface Zona {
  numero: number;
  nombre: string;
  mesas: number;
}

export const ZONAS_POR_DEFECTO: Zona[] = [{ numero: 1, nombre: 'Salón', mesas: 10 }];

const mensajeError = (error: { message: string }) => {
  if (/categorias|productos/.test(error.message) && /exist|schema cache/.test(error.message)) {
    return 'Falta ejecutar 006_menu_y_mesas.sql en Supabase.';
  }
  return error.message;
};

// Supabase no da error cuando no cambia ninguna fila (sin permiso, o ya la borraron en otro
// dispositivo): se revisa que sí se haya cambiado algo para no decir "guardado" sin guardar
const revisarResultado = ({ data, error }: { data: unknown[] | null; error: { message: string } | null }) => {
  if (error) throw new Error(mensajeError(error));
  if (!data || data.length === 0) {
    throw new Error('No se guardó el cambio: ya no existe (quizás lo borraron en otro dispositivo) o su usuario no tiene permiso.');
  }
};

// ---------- Menú ----------

export const cargarMenu = async (): Promise<Categoria[]> => {
  const client = clienteSupabase();
  const [categorias, productos] = await Promise.all([
    client.from('categorias').select('id, nombre, icono, orden').order('orden').order('id'),
    client.from('productos')
      .select('id, categoria_id, nombre, precio, precio_libre, disponible, orden, opciones')
      .order('orden').order('id')
  ]);
  if (categorias.error) throw new Error(mensajeError(categorias.error));
  if (productos.error) throw new Error(mensajeError(productos.error));
  return (categorias.data ?? []).map(c => ({
    ...c,
    productos: (productos.data ?? [])
      .filter(p => p.categoria_id === c.id)
      .map(p => ({ ...p, opciones: Array.isArray(p.opciones) ? p.opciones : [] }))
  }));
};

export const crearCategoria = async (nombre: string, icono: string, orden: number) => {
  const { error } = await clienteSupabase().from('categorias').insert({ nombre, icono, orden });
  if (error) throw new Error(mensajeError(error));
};

export const actualizarCategoria = async (id: number, cambios: Partial<Pick<Categoria, 'nombre' | 'icono' | 'orden'>>) => {
  revisarResultado(await clienteSupabase().from('categorias').update(cambios).eq('id', id).select('id'));
};

// Borra la categoría y todos sus productos
export const borrarCategoria = async (id: number) => {
  revisarResultado(await clienteSupabase().from('categorias').delete().eq('id', id).select('id'));
};

export type DatosProducto = Omit<Producto, 'id'>;

export const crearProducto = async (producto: DatosProducto) => {
  const { error } = await clienteSupabase().from('productos').insert(producto);
  if (error) throw new Error(mensajeError(error));
};

// Guarda solo los campos que se cambiaron, para no deshacer lo que otro dispositivo cambió en los demás
export const actualizarProducto = async (id: number, cambios: Partial<DatosProducto>) => {
  revisarResultado(await clienteSupabase()
    .from('productos')
    .update({ ...cambios, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id'));
};

export const borrarProducto = async (id: number) => {
  revisarResultado(await clienteSupabase().from('productos').delete().eq('id', id).select('id'));
};

// ---------- Mesas ----------

export const cargarZonas = async (): Promise<Zona[]> => {
  const zonas = await leerConfig<Zona[]>('zonas', ZONAS_POR_DEFECTO);
  return Array.isArray(zonas) && zonas.length > 0 ? zonas : ZONAS_POR_DEFECTO;
};

export const guardarZonas = (zonas: Zona[]) => guardarConfig('zonas', zonas);

// ---------- Datos del negocio ----------

// Nombre del restaurante que aparece en los encabezados y en los reportes
export const cargarNombreNegocio = () => leerConfig<string>('negocio_nombre', '');

export const guardarNombreNegocio = (nombre: string) => guardarConfig('negocio_nombre', nombre.trim());
