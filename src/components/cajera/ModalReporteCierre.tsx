import type jsPDF from 'jspdf';
import { FileText, Download, MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ReporteCierre, bebidasYAlimentos, porcentajeDe, textoPrecio } from '@/lib/reporteCierre';
import { descargarPDF, enviarPorWhatsApp } from '@/lib/reportePDF';
import { pesos } from '@/lib/formato';

export interface CierreTerminado {
  reporte: ReporteCierre;
  pdf: jsPDF;
}


function ContenidoReporte({ reporte }: { reporte: ReporteCierre }) {
  const categorias = Object.entries(reporte.categorias).filter(([, datos]) => datos.cantidad > 0);
  const grupos = bebidasYAlimentos(reporte.categorias);
  return (
    <>
      {/* Balance General */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold text-blue-800 mb-3">📊 Balance General del Día</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Cajero:</p>
            <p className="font-semibold text-gray-900">{reporte.cajero}</p>
          </div>
          <div>
            <p className="text-gray-600">Apertura:</p>
            <p className="font-semibold text-gray-900">{reporte.turnoInicio}</p>
          </div>
          <div>
            <p className="text-gray-600">Cierre:</p>
            <p className="font-semibold text-gray-900">{reporte.turnoFin}</p>
          </div>
          <div>
            <p className="text-gray-600">Transacciones:</p>
            <p className="font-semibold text-gray-900">{reporte.cantidadOrdenes}</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-lg font-semibold text-green-800">Ingresos Totales:</span>
            <span className="text-3xl font-bold text-green-600">{pesos(reporte.totalVentas)}</span>
          </div>
        </div>
      </div>

      {categorias.length === 0 && (
        <p className="text-center text-gray-500 py-4">No hubo ventas en este turno.</p>
      )}

      {categorias.length > 0 && (
        <>
          {/* Ventas por Categorías */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🏷️ Ventas por Categorías</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorias.map(([categoria, datos]) => (
                <div key={categoria} className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-2">{categoria}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Cantidad:</span>
                      <span className="font-medium">{datos.cantidad}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ingresos:</span>
                      <span className="font-medium text-green-600">{pesos(datos.ingresos)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Participación:</span>
                      <span className="font-medium text-blue-600">{datos.porcentaje}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalle por Productos */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🍽️ Detalle por Productos</h3>
            <div className="space-y-4">
              {categorias.map(([categoria, datos]) => (
                <div key={categoria} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 bg-gray-100 p-2 rounded">{categoria}</h4>
                  <div className="grid gap-2">
                    {Object.entries(datos.productos).map(([producto, info]) => (
                      <div key={producto} className="flex justify-between items-center gap-3 py-2 border-b border-gray-200 last:border-b-0">
                        <div className="min-w-0">
                          <span className="font-medium">{producto}</span>
                          <span className="text-gray-500 text-sm ml-2">({textoPrecio(info)})</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-medium">Cant: {info.cantidad}</div>
                          <div className="text-green-600 font-semibold">{pesos(info.ingresos)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métodos de Pago */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">💳 Métodos de Pago</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(reporte.ventasPorMetodo).map(([metodo, monto]) => (
                <div key={metodo} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="text-center">
                    <p className="text-gray-600 capitalize text-sm">{metodo}</p>
                    <p className="font-bold text-lg text-gray-900">{pesos(monto)}</p>
                    <p className="text-xs text-blue-600">{porcentajeDe(monto, reporte.totalVentas)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de Bebidas vs Alimentos */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🍺 Resumen Bebidas vs Alimentos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">Bebidas</h4>
                <p className="text-2xl font-bold text-blue-600">{grupos.bebidas.cantidad}</p>
                <p className="text-sm text-blue-600">{pesos(grupos.bebidas.ingresos)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800">Alimentos</h4>
                <p className="text-2xl font-bold text-orange-600">{grupos.alimentos.cantidad}</p>
                <p className="text-sm text-orange-600">{pesos(grupos.alimentos.ingresos)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Reporte del turno antes de cerrar la caja (se actualiza si entran ventas mientras se revisa)
// y, ya cerrada, los botones para descargar el PDF y enviarlo por WhatsApp
export default function ModalReporteCierre({ reporte, cerrando, terminado, numeroWhatsApp, onConfirmar, onCancelar, onTerminar }: {
  reporte: ReporteCierre;
  cerrando: boolean;
  terminado: CierreTerminado | null;
  numeroWhatsApp: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  onTerminar: () => void;
}) {
  const mostrado = terminado?.reporte ?? reporte;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden bg-white shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-[#0F172A] to-[#13254A] text-white shrink-0">
          <CardTitle className="text-center text-base sm:text-xl">
            {terminado ? '✅ Caja cerrada' : '📊 Reporte General de Ventas - Cierre de Caja'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6">
            {terminado && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4 space-y-3">
                <p className="text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  La caja quedó cerrada y el reporte se descargó en PDF.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    onClick={() => enviarPorWhatsApp(terminado.pdf, terminado.reporte, numeroWhatsApp)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar por WhatsApp
                  </Button>
                  <Button onClick={() => descargarPDF(terminado.pdf)} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF otra vez
                  </Button>
                  <Button onClick={onTerminar} className="boton-marca">Listo</Button>
                </div>
                {!numeroWhatsApp && (
                  <p className="text-xs text-gray-600">No hay un número de WhatsApp configurado: podrá elegir el contacto en WhatsApp.</p>
                )}
              </div>
            )}

            <ContenidoReporte reporte={mostrado} />

            {!terminado && (
              <div className="flex space-x-3 pt-4 border-t">
                <Button onClick={onCancelar} disabled={cerrando} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={onConfirmar} disabled={cerrando} className="flex-1 boton-marca">
                  <FileText className="w-4 h-4 mr-2" />
                  {cerrando ? 'Cerrando caja…' : 'Confirmar y Generar PDF'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
