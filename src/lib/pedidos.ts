// Cómo leer un ítem de pedido. Los pedidos nuevos guardan nombre, categoría, precio y opciones elegidas;
// los anteriores al menú editable guardaban un "tipo" (picada, gallina, sopa, bebida, adicional).

export interface ItemPedido {
  id: number;
  cantidad: number;
  productoId?: number;
  nombre?: string;
  categoria?: string;
  precioItem?: number;
  opciones?: Record<string, string | string[]>;
  // Formato anterior
  tipo?: string;
  size?: string;
  carnes?: string[];
  termino?: string;
  precio?: string | number;
}

const CATEGORIA_POR_TIPO: Record<string, string> = {
  picada: 'Picadas',
  gallina: 'Gallina',
  sopa: 'Sopas',
  bebida: 'Bebidas',
  adicional: 'Adicionales'
};

export const precioUnitario = (p: ItemPedido) =>
  p.tipo === 'picada' ? parseInt(String(p.precio)) || 0 : Number(p.precioItem) || 0;

export const subtotal = (p: ItemPedido) => precioUnitario(p) * (p.cantidad || 0);

export const totalPedidos = (pedidos: ItemPedido[] = []) => pedidos.reduce((suma, p) => suma + subtotal(p), 0);

export const nombreItem = (p: ItemPedido) =>
  p.tipo === 'picada' ? `Picada ${p.size ?? ''}`.trim() : p.nombre || 'Producto';

// En los pedidos anteriores manda el tipo (algunas bebidas guardaban en "categoria" el tipo de bebida)
export const categoriaItem = (p: ItemPedido) =>
  (p.tipo && CATEGORIA_POR_TIPO[p.tipo]) || p.categoria || 'Otros';

// Texto corto con lo que se eligió, por ejemplo "Res, Cerdo • Jugoso"
export const detalleItem = (p: ItemPedido) => {
  if (p.opciones) {
    return Object.values(p.opciones)
      .map(v => (Array.isArray(v) ? v.join(', ') : v))
      .filter(Boolean)
      .join(' • ');
  }
  if (p.tipo === 'picada') return [p.carnes?.join(', '), p.termino].filter(Boolean).join(' • ');
  return p.termino ? `Término: ${p.termino}` : '';
};
