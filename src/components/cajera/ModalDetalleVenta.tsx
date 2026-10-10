import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Venta } from '@/lib/datos';
import { type ItemPedido, nombreItem, detalleItem, subtotal } from '@/lib/pedidos';
import { pesos, fechaHora } from '@/lib/formato';


// Detalle de una venta: productos, pago y nota del mesero
export default function ModalDetalleVenta({ venta, onCerrar }: { venta: Venta; onCerrar: () => void }) {
  const efectivo = venta.metodoPago === 'efectivo';
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-transparent w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-gradient-to-br from-slate-900/95 via-[#0B1630]/95 to-slate-950/95 backdrop-blur-xl border border-cyan-400/20">
        <CardHeader className="border-b border-cyan-400/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-white text-base sm:text-xl">Detalle de Venta - Mesa {venta.mesa}</CardTitle>
            <Button aria-label="Cerrar"
              onClick={onCerrar}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Fecha:</p>
                <p className="text-white font-medium">{fechaHora(venta.fecha)}</p>
              </div>
              <div>
                <p className="text-gray-400">Mesero:</p>
                <p className="text-white font-medium">{venta.mesero}</p>
              </div>
              <div>
                <p className="text-gray-400">Método de Pago:</p>
                <p className="text-white font-medium">{venta.metodoPago}</p>
              </div>
              <div>
                <p className="text-gray-400">Total:</p>
                <p className="text-green-400 font-bold text-lg">{pesos(venta.total)}</p>
              </div>
              {efectivo && venta.montoPagado != null && (
                <>
                  <div>
                    <p className="text-gray-400">Recibido:</p>
                    <p className="text-white font-medium">{pesos(venta.montoPagado)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cambio:</p>
                    <p className="text-white font-medium">{pesos(venta.cambio ?? 0)}</p>
                  </div>
                </>
              )}
            </div>

            <Separator className="bg-cyan-400/15" />

            <div>
              <h4 className="text-white font-semibold mb-3">Productos:</h4>
              <div className="space-y-2">
                {(venta.pedidos as ItemPedido[] | undefined)?.map((pedido, index) => (
                  <div key={index} className="flex justify-between items-center gap-3 bg-white/5 rounded-lg p-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium">
                        {pedido.cantidad}x {nombreItem(pedido)}
                      </p>
                      {detalleItem(pedido) && (
                        <p className="text-gray-400 text-sm">{detalleItem(pedido)}</p>
                      )}
                    </div>
                    <p className="text-green-400 font-bold whitespace-nowrap">{pesos(subtotal(pedido))}</p>
                  </div>
                ))}
              </div>
            </div>

            {venta.notaAdicional && (
              <div>
                <h4 className="text-white font-semibold mb-2">Nota Adicional:</h4>
                <p className="text-gray-300 bg-white/5 rounded-lg p-3 whitespace-pre-line">{venta.notaAdicional}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
