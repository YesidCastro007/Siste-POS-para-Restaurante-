import type { Venta } from '@/lib/datos';
import { type ItemPedido, nombreItem, subtotal, precioUnitario, categoriaItem } from '@/lib/pedidos';
import { pesos as formatoPesos, fechaHora } from '@/lib/formato';

// Reporte del cierre de caja: totales del turno por método de pago, categoría y producto.

export interface ProductoDelCierre {
  cantidad: number;
  ingresos: number;
  precioUnitario: number;
  // Un mismo producto puede venderse a precios distintos (por ejemplo, las de precio libre)
  precioMinimo?: number;
  precioMaximo?: number;
}

export interface CategoriaDelCierre {
  cantidad: number;
  ingresos: number;
  porcentaje: string;
  productos: Record<string, ProductoDelCierre>;
}

export interface ReporteCierre {
  fecha: string;
  turnoInicio: string;
  turnoFin: string;
  totalVentas: number;
  cantidadOrdenes: number;
  ventasPorMetodo: Record<string, number>;
  cajero: string;
  negocio?: string;
  categorias: Record<string, CategoriaDelCierre>;
}

// Total por método de pago ("efectivo", "tarjeta", "transferencia - Nequi"...)
export const totalesPorMetodo = (ventas: Venta[]) =>
  ventas.reduce<Record<string, number>>((acc, venta) => {
    const metodo = venta.metodoPago || 'efectivo';
    acc[metodo] = (acc[metodo] || 0) + venta.total;
    return acc;
  }, {});

export const generarReporteCierre = (
  ventas: Venta[],
  { inicio, fin, cajero, negocio }: { inicio: string; fin: string; cajero: string; negocio?: string }
): ReporteCierre => {
  const total = ventas.reduce((suma, venta) => suma + venta.total, 0);

  // Las categorías son las del menú de cada negocio
  const categorias: Record<string, CategoriaDelCierre> = {};
  ventas.forEach(venta => {
    (venta.pedidos as ItemPedido[] | undefined)?.forEach(pedido => {
      const cantidad = pedido.cantidad;
      const precio = precioUnitario(pedido);
      const ingresos = subtotal(pedido);
      const categoria = (categorias[categoriaItem(pedido)] ??= { cantidad: 0, ingresos: 0, porcentaje: '0', productos: {} });
      categoria.cantidad += cantidad;
      categoria.ingresos += ingresos;
      const producto = (categoria.productos[nombreItem(pedido)] ??= {
        cantidad: 0, ingresos: 0, precioUnitario: precio, precioMinimo: precio, precioMaximo: precio
      });
      producto.cantidad += cantidad;
      producto.ingresos += ingresos;
      producto.precioMinimo = Math.min(producto.precioMinimo ?? precio, precio);
      producto.precioMaximo = Math.max(producto.precioMaximo ?? precio, precio);
    });
  });

  Object.values(categorias).forEach(categoria => {
    categoria.porcentaje = total > 0 ? ((categoria.ingresos / total) * 100).toFixed(1) : '0';
  });

  return {
    fecha: fechaHora(fin),
    turnoInicio: fechaHora(inicio),
    turnoFin: fechaHora(fin),
    totalVentas: total,
    cantidadOrdenes: ventas.length,
    ventasPorMetodo: totalesPorMetodo(ventas),
    cajero,
    negocio,
    categorias
  };
};

// "$18.000 c/u", o "$40.000 a $50.000" si se vendió a precios distintos
export const textoPrecio = (producto: ProductoDelCierre) =>
  producto.precioMinimo !== undefined && producto.precioMaximo !== undefined && producto.precioMinimo !== producto.precioMaximo
    ? `${formatoPesos(producto.precioMinimo)} a ${formatoPesos(producto.precioMaximo)}`
    : `${formatoPesos(producto.precioUnitario)} c/u`;

export const porcentajeDe = (parte: number, total: number) => (total > 0 ? ((parte / total) * 100).toFixed(1) : '0');

// Categorías de bebidas según su nombre; el resto cuenta como alimentos
const ES_BEBIDA = /bebida|jugo|gaseosa|refresco|cerveza|licor|trago|cocte|cócte|vino|caf[eé]|agua|limonada|soda|drink/i;

export const bebidasYAlimentos = (categorias: Record<string, { cantidad: number; ingresos: number }>) => {
  const suma = { bebidas: { cantidad: 0, ingresos: 0 }, alimentos: { cantidad: 0, ingresos: 0 } };
  Object.entries(categorias).forEach(([nombre, datos]) => {
    const grupo = ES_BEBIDA.test(nombre) ? suma.bebidas : suma.alimentos;
    grupo.cantidad += datos.cantidad;
    grupo.ingresos += datos.ingresos;
  });
  return suma;
};

// Fecha local (no UTC) para el nombre del archivo: un cierre de noche no queda con la fecha de mañana
export const fechaParaArchivo = (fecha = new Date()) => {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
};

export const nombreArchivoCierre = () => `Reporte_Cierre_${fechaParaArchivo()}.pdf`;

// Resumen corto del cierre para mandarlo por WhatsApp
export const resumenParaWhatsApp = (reporte: ReporteCierre) => {
  const metodos = Object.entries(reporte.ventasPorMetodo)
    .map(([metodo, monto]) => `• ${metodo.split(' - ').pop()!.replace(/^./, c => c.toUpperCase())}: ${formatoPesos(monto)}`);
  return [
    `*Cierre de caja${reporte.negocio ? ` - ${reporte.negocio}` : ''}*`,
    `Turno: ${reporte.turnoInicio} a ${reporte.turnoFin}`,
    `Cajero: ${reporte.cajero}`,
    `Órdenes: ${reporte.cantidadOrdenes}`,
    `*Total: ${formatoPesos(reporte.totalVentas)}*`,
    ...(metodos.length ? ['', ...metodos] : [])
  ].join('\n');
};
