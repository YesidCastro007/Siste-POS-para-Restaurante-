import React, { useState, useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHybridStorage } from '@/hooks/useHybridStorage';

const PISOS = [
  { number: 1, mesas: 15 },
  { number: 2, mesas: 18 },
  { number: 3, mesas: 10 }
];

const MESERO_COLORS = {
  blue: { bg: 'bg-blue-600/30', border: 'border-blue-600', text: 'text-blue-300' },
  purple: { bg: 'bg-purple-600/30', border: 'border-purple-600', text: 'text-purple-300' },
  orange: { bg: 'bg-orange-600/30', border: 'border-orange-600', text: 'text-orange-300' },
  pink: { bg: 'bg-pink-600/30', border: 'border-pink-600', text: 'text-pink-300' },
  yellow: { bg: 'bg-yellow-600/30', border: 'border-yellow-600', text: 'text-yellow-300' },
  indigo: { bg: 'bg-indigo-600/30', border: 'border-indigo-600', text: 'text-indigo-300' },
  teal: { bg: 'bg-teal-600/30', border: 'border-teal-600', text: 'text-teal-300' },
  cyan: { bg: 'bg-cyan-600/30', border: 'border-cyan-600', text: 'text-cyan-300' },
  rose: { bg: 'bg-rose-600/30', border: 'border-rose-600', text: 'text-rose-300' },
  amber: { bg: 'bg-amber-600/30', border: 'border-amber-600', text: 'text-amber-300' }
};

const getMeseroColorConfig = (meseroName: string) => {
  const colorKeys = Object.keys(MESERO_COLORS);
  let hash = 0;
  for (let i = 0; i < meseroName.length; i++) {
    hash = meseroName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorKey = colorKeys[Math.abs(hash) % colorKeys.length];
  return MESERO_COLORS[colorKey] || MESERO_COLORS.blue;
};

export default function CajeroMesasView() {
  const [mesas, setMesas] = useState({});
  const [pisoSeleccionado, setPisoSeleccionado] = useState(1);
  const { getMesas } = useHybridStorage();

  useEffect(() => {
    const cargarMesas = async () => {
      const mesasData = await getMesas();
      setMesas(mesasData);
    };

    cargarMesas();
    
    const handleStorageChange = () => cargarMesas();
    const handleMesasActualizadas = (event: any) => setMesas(event.detail);
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mesasActualizadas', handleMesasActualizadas);
    const interval = setInterval(cargarMesas, 2000); // Cambiado a 2 segundos para mejor rendimiento en móvil
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mesasActualizadas', handleMesasActualizadas);
      clearInterval(interval);
    };
  }, [getMesas]);

  const mesasActivas = Object.entries(mesas).filter(([key, mesa]: [string, any]) => mesa.pedidos?.length > 0);
  const totalMesasActivas = mesasActivas.reduce((sum, [key, mesa]: [string, any]) => sum + (mesa.total || 0), 0);

  return (
    <>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500 shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center">
              <p className="text-blue-700 text-xs sm:text-sm font-medium">Mesas Activas</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-900">{mesasActivas.length}</p>
            </div>
            <div className="text-center">
              <p className="text-purple-700 text-xs sm:text-sm font-medium">Total Pendiente</p>
              <p className="text-3xl sm:text-4xl font-bold text-purple-900">${totalMesasActivas.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-green-700 text-xs sm:text-sm font-medium">Promedio por Mesa</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-900">
                ${mesasActivas.length > 0 ? Math.round(totalMesasActivas / mesasActivas.length).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 border-gray-300 shadow-xl">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {PISOS.map((piso) => {
              const mesasDelPiso = mesasActivas.filter(([key]) => key.startsWith(`${piso.number}-`));
              const totalPiso = mesasDelPiso.reduce((sum, [key, mesa]: [string, any]) => sum + (mesa.total || 0), 0);
              return (
                <Button
                  key={piso.number}
                  onClick={() => setPisoSeleccionado(piso.number)}
                  className={`h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-base ${
                    pisoSeleccionado === piso.number
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span className="text-base sm:text-lg font-bold">Piso {piso.number}</span>
                  <span className="text-xs sm:text-sm">{mesasDelPiso.length} activas</span>
                  <span className="text-[10px] sm:text-xs font-semibold">${totalPiso.toLocaleString()}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 border-gray-300 shadow-xl">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-gray-900 text-base sm:text-xl">Mesas - Piso {pisoSeleccionado}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
            {Array.from({ length: PISOS.find(p => p.number === pisoSeleccionado)?.mesas || 0 }, (_, i) => {
              const numeroMesa = i + 1;
              const mesaKey = `${pisoSeleccionado}-${numeroMesa}`;
              const mesaData = mesas[mesaKey];
              const ocupada = mesaData && mesaData.pedidos?.length > 0;
              const colorConfig = ocupada ? getMeseroColorConfig(mesaData.mesero) : null;

              return (
                <div
                  key={numeroMesa}
                  className={`aspect-square rounded-xl p-2 sm:p-4 flex flex-col items-center justify-center border-2 ${
                    ocupada
                      ? `${colorConfig.bg} ${colorConfig.border} shadow-lg`
                      : 'bg-green-100 border-green-400 opacity-50'
                  }`}
                >
                  <UtensilsCrossed className={`w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2 ${ocupada ? colorConfig.text : 'text-green-600'}`} />
                  <p className={`text-sm sm:text-lg font-bold ${ocupada ? colorConfig.text : 'text-green-600'}`}>{numeroMesa}</p>
                  {ocupada ? (
                    <>
                      <p className={`text-[10px] sm:text-xs ${colorConfig.text} truncate w-full text-center`}>{mesaData.mesero}</p>
                      <p className={`text-xs sm:text-sm font-bold mt-0.5 sm:mt-1 ${colorConfig.text}`}>
                        ${mesaData.total.toLocaleString()}
                      </p>
                      <p className={`text-[9px] sm:text-xs ${colorConfig.text} mt-0.5 sm:mt-1`}>
                        {mesaData.pedidos?.length} items
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-green-600">Disponible</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 border-gray-300 shadow-xl">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-gray-900 text-base sm:text-xl">Detalle de Mesas Activas</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
            {mesasActivas.filter(([key]) => key.startsWith(`${pisoSeleccionado}-`)).length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay mesas activas en este piso</p>
              </div>
            ) : (
              mesasActivas
                .filter(([key]) => key.startsWith(`${pisoSeleccionado}-`))
                .map(([mesaKey, mesaData]: [string, any]) => {
                  const [piso, numero] = mesaKey.split('-');
                  const colorConfig = getMeseroColorConfig(mesaData.mesero);
                  return (
                    <div key={mesaKey} className="bg-gray-50 rounded-lg p-3 sm:p-4 border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${colorConfig.bg} border-2 ${colorConfig.border}`}>
                            <UtensilsCrossed className={`w-4 h-4 sm:w-6 sm:h-6 ${colorConfig.text}`} />
                          </div>
                          <div>
                            <p className="text-base sm:text-lg font-bold text-gray-900">Mesa {numero}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none">{mesaData.mesero}</p>
                          </div>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">${mesaData.total.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded p-2 sm:p-3 space-y-1">
                        {mesaData.pedidos?.map((pedido, idx) => (
                          <div key={idx} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-700 truncate flex-1 mr-2">
                              {pedido.cantidad}x {pedido.tipo === 'picada' ? `Picada ${pedido.size}` : pedido.nombre}
                            </span>
                            <span className="text-gray-900 font-medium whitespace-nowrap">
                              ${((pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem) * pedido.cantidad).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
