import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type ReporteCierre, textoPrecio, porcentajeDe, nombreArchivoCierre, resumenParaWhatsApp } from '@/lib/reporteCierre';
import { pesos, fechaHora } from '@/lib/formato';

export type { ReporteCierre };

// La letra del PDF no tiene emojis: se quitan para que no salgan símbolos raros
// (se conservan tildes, ñ y demás letras del español)
const texto = (valor: string) => valor
  .replace(/[\u00A0\u2007\u202F]/g, ' ')
  .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// Encabezado de las tablas con el azul de la marca SHADOW (#0F172A)
const AZUL_MARCA: [number, number, number] = [15, 23, 42];

// Dónde terminó la última tabla dibujada, para seguir escribiendo debajo
const finDeLaTabla = (doc: jsPDF) => (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

export const generarReportePDF = (reporte: ReporteCierre): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(texto(reporte.negocio || 'SHADOW').toUpperCase(), pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Reporte de Cierre de Caja', pageWidth / 2, 30, { align: 'center' });
  
  // Información general
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 45;
  
  doc.text(`Cajero: ${texto(reporte.cajero)}`, 14, yPos);
  yPos += 6;
  doc.text(texto(`Fecha de cierre: ${reporte.fecha}`), 14, yPos);
  yPos += 6;
  doc.text(texto(`Turno: ${reporte.turnoInicio} - ${reporte.turnoFin}`), 14, yPos);
  yPos += 6;
  doc.text(`Total de órdenes: ${reporte.cantidadOrdenes}`, 14, yPos);
  yPos += 10;
  
  // Total de ventas destacado
  doc.setFillColor(34, 197, 94);
  doc.rect(14, yPos, pageWidth - 28, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL DE VENTAS: ${pesos(reporte.totalVentas)}`, pageWidth / 2, yPos + 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  yPos += 20;
  
  // Métodos de pago
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Métodos de Pago', 14, yPos);
  yPos += 8;
  
  const metodosPagoData = Object.entries(reporte.ventasPorMetodo).map(([metodo, monto]) => [
    metodo.charAt(0).toUpperCase() + metodo.slice(1),
    pesos(monto),
    `${porcentajeDe(monto, reporte.totalVentas)}%`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Método', 'Monto', 'Porcentaje']],
    body: metodosPagoData,
    theme: 'grid',
    headStyles: { fillColor: AZUL_MARCA },
    margin: { left: 14, right: 14 }
  });
  
  yPos = finDeLaTabla(doc) + 10;
  
  // Ventas por categorías
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ventas por Categorías', 14, yPos);
  yPos += 8;
  
  const categoriasData = Object.entries(reporte.categorias)
    .filter(([_, datos]) => datos.cantidad > 0)
    .map(([categoria, datos]) => [
      texto(categoria),
      datos.cantidad.toString(),
      pesos(datos.ingresos),
      `${datos.porcentaje}%`
    ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Categoría', 'Cantidad', 'Ingresos', '%']],
    body: categoriasData,
    theme: 'grid',
    headStyles: { fillColor: AZUL_MARCA },
    margin: { left: 14, right: 14 }
  });
  
  yPos = finDeLaTabla(doc) + 10;
  
  // Detalle por productos (nueva página si es necesario)
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle por Productos', 14, yPos);
  yPos += 8;
  
  Object.entries(reporte.categorias).forEach(([categoria, datos]) => {
    if (datos.cantidad > 0) {
      // Verificar si necesitamos nueva página
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(texto(categoria), 14, yPos);
      yPos += 6;
      
      const productosData = Object.entries(datos.productos).map(([producto, info]) => [
        texto(producto),
        info.cantidad.toString(),
        textoPrecio(info).replace(' c/u', ''),
        pesos(info.ingresos)
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Producto', 'Cant.', 'Precio Unit.', 'Total']],
        body: productosData,
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 100], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 20, right: 14 }
      });
      
      yPos = finDeLaTabla(doc) + 8;
    }
  });
  
  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      texto(`Página ${i} de ${totalPages} - Generado con SHADOW el ${fechaHora(new Date())}`),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const descargarPDF = (doc: jsPDF) => doc.save(nombreArchivoCierre());

// Número de celular con el código de Colombia (57)
const numeroInternacional = (numero: string) => {
  const limpio = numero.replace(/\D/g, '');
  return limpio.length === 10 ? `57${limpio}` : limpio;
};

// Envía el cierre por WhatsApp. Se llama al tocar un botón (los celulares bloquean ventanas que
// se abren solas). En celulares que permiten compartir archivos se comparte el PDF con el resumen;
// si no, se abre WhatsApp con el resumen escrito para el número configurado.
export const enviarPorWhatsApp = async (doc: jsPDF, reporte: ReporteCierre, numero: string) => {
  const resumen = resumenParaWhatsApp(reporte);
  const esCelular = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (esCelular && typeof File !== 'undefined') {
    const archivo = new File([doc.output('blob')], nombreArchivoCierre(), { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], text: resumen });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
  }
  const destino = numero ? numeroInternacional(numero) : '';
  window.open(`https://wa.me/${destino}?text=${encodeURIComponent(resumen)}`, '_blank');
};
