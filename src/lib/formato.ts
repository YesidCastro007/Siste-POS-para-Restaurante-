// Formatos de Colombia, para que todos los celulares muestren igual el dinero y las fechas
// (sin esto, un celular en inglés muestra $36,000 y otro en español $36.000).

export const miles = (valor: number) => Math.round(valor || 0).toLocaleString('es-CO');

export const pesos = (valor: number) => `$${miles(valor)}`;

export const fechaHora = (fecha: string | number | Date) => new Date(fecha).toLocaleString('es-CO');

export const hora = (fecha: string | number | Date) => new Date(fecha).toLocaleTimeString('es-CO');
