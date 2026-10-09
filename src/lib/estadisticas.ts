import type { Venta } from '@/lib/datos';
import { type ItemPedido, nombreItem, precioUnitario } from '@/lib/pedidos';

// Cálculos del panel del dueño a partir de las ventas guardadas en Supabase.

export type Periodo = 'hoy' | 'semana' | 'mes' | 'todo';

export const PERIODOS: { id: Periodo; nombre: string }[] = [
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'semana', nombre: 'Últimos 7 días' },
  { id: 'mes', nombre: 'Este mes' },
  { id: 'todo', nombre: 'Todo' }
];

const inicioDelDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

export const inicioDelPeriodo = (periodo: Periodo, ahora = new Date()): Date | null => {
  const hoy = inicioDelDia(ahora);
  if (periodo === 'hoy') return hoy;
  if (periodo === 'semana') return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6);
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return null;
};

export const filtrarPorPeriodo = (ventas: Venta[], periodo: Periodo, ahora = new Date()) => {
  const desde = inicioDelPeriodo(periodo, ahora);
  return desde ? ventas.filter(v => new Date(v.fecha) >= desde) : ventas;
};

export const resumen = (ventas: Venta[]) => {
  const total = ventas.reduce((suma, v) => suma + (v.total || 0), 0);
  return {
    total,
    ordenes: ventas.length,
    promedio: ventas.length > 0 ? Math.round(total / ventas.length) : 0
  };
};

export interface Fila {
  nombre: string;
  total: number;
  cantidad: number;
}

// Ordena de mayor a menor total
const ordenar = (mapa: Map<string, Fila>) => [...mapa.values()].sort((a, b) => b.total - a.total);

const sumar = (mapa: Map<string, Fila>, nombre: string, total: number, cantidad: number) => {
  const fila = mapa.get(nombre) ?? { nombre, total: 0, cantidad: 0 };
  fila.total += total;
  fila.cantidad += cantidad;
  mapa.set(nombre, fila);
};

export const porMesero = (ventas: Venta[]) => {
  const mapa = new Map<string, Fila>();
  ventas.forEach(v => sumar(mapa, v.mesero || 'Sin mesero', v.total || 0, 1));
  return ordenar(mapa);
};

// "transferencia - Nequi" se muestra como "Nequi"; "efectivo" como "Efectivo"
export const nombreMetodo = (metodo: string) => {
  const texto = (metodo || 'efectivo').split(' - ').pop()!.trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const porMetodo = (ventas: Venta[]) => {
  const mapa = new Map<string, Fila>();
  ventas.forEach(v => sumar(mapa, nombreMetodo(v.metodoPago), v.total || 0, 1));
  return ordenar(mapa);
};

export const productosMasVendidos = (ventas: Venta[], limite = 8) => {
  const mapa = new Map<string, Fila>();
  ventas.forEach(v => (v.pedidos as ItemPedido[] | undefined)?.forEach(p => {
    const cantidad = p.cantidad || 1;
    sumar(mapa, nombreItem(p), precioUnitario(p) * cantidad, cantidad);
  }));
  return ordenar(mapa).slice(0, limite);
};

// Total por día para los últimos `dias` días (incluye días sin ventas, en cero)
export const ventasPorDia = (ventas: Venta[], dias: number, ahora = new Date()) => {
  const hoy = inicioDelDia(ahora);
  const filas = Array.from({ length: dias }, (_, i) => {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (dias - 1 - i));
    return {
      clave: dia.toDateString(),
      etiqueta: dia.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      total: 0,
      ordenes: 0
    };
  });
  const indice = new Map(filas.map(f => [f.clave, f]));
  ventas.forEach(v => {
    const fila = indice.get(new Date(v.fecha).toDateString());
    if (fila) {
      fila.total += v.total || 0;
      fila.ordenes += 1;
    }
  });
  return filas;
};

export const formatoPesos = (valor: number) => `$${Math.round(valor).toLocaleString('es-CO')}`;
