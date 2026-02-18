import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReporteCierre {
  fecha: string;
  turnoInicio: string;
  turnoFin: string;
  totalVentas: number;
  cantidadOrdenes: number;
  ventasPorMetodo: Record<string, number>;
  cajero: string;
  categorias: Record<string, {
    cantidad: number;
    ingresos: number;
    porcentaje: string;
    productos: Record<string, {
      cantidad: number;
      ingresos: number;
      precioUnitario: number;
    }>;
  }>;
}

export const generarReportePDF = (reporte: ReporteCierre): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SANTANDEREANO SAS', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Reporte de Cierre de Caja', pageWidth / 2, 30, { align: 'center' });
  
  // Información general
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 45;
  
  doc.text(`Cajero: ${reporte.cajero}`, 14, yPos);
  yPos += 6;
  doc.text(`Fecha de cierre: ${reporte.fecha}`, 14, yPos);
  yPos += 6;
  doc.text(`Turno: ${reporte.turnoInicio} - ${reporte.turnoFin}`, 14, yPos);
  yPos += 6;
  doc.text(`Total de órdenes: ${reporte.cantidadOrdenes}`, 14, yPos);
  yPos += 10;
  
  // Total de ventas destacado
  doc.setFillColor(34, 197, 94);
  doc.rect(14, yPos, pageWidth - 28, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL DE VENTAS: $${reporte.totalVentas.toLocaleString()}`, pageWidth / 2, yPos + 8, { align: 'center' });
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
    `$${monto.toLocaleString()}`,
    `${((monto / reporte.totalVentas) * 100).toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Método', 'Monto', 'Porcentaje']],
    body: metodosPagoData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: 14, right: 14 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Ventas por categorías
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ventas por Categorías', 14, yPos);
  yPos += 8;
  
  const categoriasData = Object.entries(reporte.categorias)
    .filter(([_, datos]) => datos.cantidad > 0)
    .map(([categoria, datos]) => [
      categoria,
      datos.cantidad.toString(),
      `$${datos.ingresos.toLocaleString()}`,
      `${datos.porcentaje}%`
    ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Categoría', 'Cantidad', 'Ingresos', '%']],
    body: categoriasData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: 14, right: 14 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
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
      doc.text(categoria, 14, yPos);
      yPos += 6;
      
      const productosData = Object.entries(datos.productos).map(([producto, info]) => [
        producto,
        info.cantidad.toString(),
        `$${info.precioUnitario.toLocaleString()}`,
        `$${info.ingresos.toLocaleString()}`
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
      
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }
  });
  
  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleString()}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const enviarReportePorWhatsApp = (doc: jsPDF, numeroTelefono: string) => {
  // Convertir PDF a blob
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Crear mensaje para WhatsApp
  const mensaje = `Reporte de Cierre de Caja - Santandereano SAS\nFecha: ${new Date().toLocaleDateString()}`;
  
  // Limpiar número de teléfono (remover espacios, guiones, etc.)
  const numeroLimpio = numeroTelefono.replace(/\D/g, '');
  
  // Verificar si el número tiene código de país
  const numeroFinal = numeroLimpio.startsWith('57') ? numeroLimpio : `57${numeroLimpio}`;
  
  // Abrir WhatsApp Web con el mensaje
  const whatsappUrl = `https://wa.me/${numeroFinal}?text=${encodeURIComponent(mensaje)}`;
  
  // Abrir en nueva ventana
  window.open(whatsappUrl, '_blank');
  
  // Descargar el PDF automáticamente
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `Reporte_Cierre_${new Date().toISOString().split('T')[0]}.pdf`;
  link.click();
  
  // Limpiar URL del blob después de un tiempo
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
  
  return { pdfBlob, pdfUrl };
};
