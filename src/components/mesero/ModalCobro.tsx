import { useState } from 'react';
import { X, CheckCircle, Calculator, CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { nombreItem, subtotal } from '@/lib/pedidos';

export default function ModalCobro({ zonaNombre, mesaSeleccionada, mesaData, onCerrar, onProcesarCobro }) {
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipoTransferencia, setTipoTransferencia] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [notaAdicional, setNotaAdicional] = useState('');

  const total = mesaData?.total || 0;
  const cambio = montoPagado ? Math.max(0, parseInt(montoPagado.replace(/[^0-9]/g, '')) - total) : 0;

  const metodosPago = [
    { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: 'from-green-500 to-green-600' },
    { id: 'tarjeta', nombre: 'Tarjeta', icono: CreditCard, color: 'from-blue-500 to-blue-600' },
    { id: 'transferencia', nombre: 'Transferencia', icono: Smartphone, color: 'from-purple-500 to-purple-600' }
  ];

  const handleProcesarCobro = () => {
    if (metodoPago === 'efectivo' && !montoPagado) {
      alert('Ingrese el monto pagado');
      return;
    }

    if (metodoPago === 'efectivo' && parseInt(montoPagado.replace(/[^0-9]/g, '')) < total) {
      alert('El monto pagado es insuficiente');
      return;
    }

    if (metodoPago === 'transferencia' && !tipoTransferencia) {
      alert('Seleccione el tipo de transferencia (Nequi o Daviplata)');
      return;
    }

    const datosVenta = {
      ...mesaData,
      metodoPago: metodoPago === 'transferencia' ? `${metodoPago} - ${tipoTransferencia}` : metodoPago,
      montoPagado: metodoPago === 'efectivo' ? parseInt(montoPagado.replace(/[^0-9]/g, '')) : total,
      cambio: metodoPago === 'efectivo' ? cambio : 0,
      notaAdicional,
      total
    };

    onProcesarCobro(datosVenta);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-900/98 via-red-900/98 to-slate-900/98 backdrop-blur-xl border border-red-500/40 shadow-2xl">
        <CardHeader className="border-b border-red-500/30 bg-gradient-to-r from-red-600/20 to-red-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Procesar Cobro</CardTitle>
                <p className="text-red-300 text-sm">Mesa {mesaSeleccionada} • {zonaNombre}</p>
              </div>
            </div>
            <Button onClick={onCerrar} variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-red-500/20">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-red-400" />Resumen del Pedido
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mesaData?.pedidos?.map((pedido, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">
                      {pedido.cantidad}x {nombreItem(pedido)}
                    </span>
                    <span className="text-green-400 font-medium">
                      ${subtotal(pedido).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-3 bg-red-500/20" />
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Subtotal:</span>
                <span className="text-xl font-bold text-white">${total.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-red-300 mb-3">Método de Pago</label>
              <div className="grid grid-cols-3 gap-3">
                {metodosPago.map((metodo) => {
                  const IconoMetodo = metodo.icono;
                  return (
                    <Button key={metodo.id} onClick={() => { setMetodoPago(metodo.id); setTipoTransferencia(''); }}
                      className={`h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-300 transform hover:scale-105 ${
                        metodoPago === metodo.id ? `bg-gradient-to-br ${metodo.color} text-white shadow-lg` : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                      }`}>
                      <IconoMetodo className="w-8 h-8" />
                      <span className="text-sm font-medium">{metodo.nombre}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {metodoPago === 'transferencia' && (
              <div>
                <label className="block text-sm font-medium text-red-300 mb-3">Tipo de Transferencia</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setTipoTransferencia('Nequi')}
                    className={`h-16 text-lg font-semibold transition-all duration-300 ${
                      tipoTransferencia === 'Nequi' ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                    }`}>
                    💜 Nequi
                  </Button>
                  <Button onClick={() => setTipoTransferencia('Daviplata')}
                    className={`h-16 text-lg font-semibold transition-all duration-300 ${
                      tipoTransferencia === 'Daviplata' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                    }`}>
                    ❤️ Daviplata
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/40">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Total a Pagar:</span>
                <span className="text-3xl font-bold text-green-400">${total.toLocaleString()}</span>
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div>
                <label className="block text-sm font-medium text-red-300 mb-2">Monto Recibido</label>
                <Input type="text" value={montoPagado ? parseInt(montoPagado.replace(/[^0-9]/g, '')).toLocaleString() : ''}
                  onChange={(e) => setMontoPagado(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ingrese el monto recibido" className="bg-white/5 border-red-500/30 text-white text-xl h-14 font-semibold" />
                {montoPagado && cambio >= 0 && (
                  <div className="mt-3 p-4 bg-blue-500/20 rounded-lg border border-blue-500/40">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 font-medium">Cambio a devolver:</span>
                      <span className="text-2xl font-bold text-blue-400">${cambio.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-red-300 mb-2">Nota Adicional (Opcional)</label>
              <Textarea value={notaAdicional} onChange={(e) => setNotaAdicional(e.target.value)}
                placeholder="Ej: Cliente solicitó factura, mesa compartida, etc." className="bg-white/5 border-red-500/30 text-white min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button onClick={onCerrar} variant="outline" className="h-14 border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white">Cancelar</Button>
              <Button onClick={handleProcesarCobro} className="h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg shadow-lg shadow-green-500/30">
                <CheckCircle className="w-5 h-5 mr-2" />Confirmar Cobro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
