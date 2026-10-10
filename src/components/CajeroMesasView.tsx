import React, { useState, useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cargarMesas, mantenerActualizado } from '@/lib/datos';
import { cargarZonas, ZONAS_POR_DEFECTO, type Zona } from '@/lib/menu';
import { nombreItem, subtotal } from '@/lib/pedidos';
import { pesos } from '@/lib/formato';

// Colores sólidos con texto blanco, para que se lean bien sobre el fondo claro
const MESERO_COLORS = {
  blue: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-white' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-700', text: 'text-white' },
  pink: { bg: 'bg-pink-600', border: 'border-pink-700', text: 'text-white' },
  yellow: { bg: 'bg-yellow-700', border: 'border-yellow-800', text: 'text-white' },
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-700', text: 'text-white' },
  teal: { bg: 'bg-teal-600', border: 'border-teal-700', text: 'text-white' },
  cyan: { bg: 'bg-cyan-600', border: 'border-cyan-700', text: 'text-white' },
  rose: { bg: 'bg-rose-600', border: 'border-rose-700', text: 'text-white' },
  amber: { bg: 'bg-amber-700', border: 'border-amber-800', text: 'text-white' }
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
  const [zonas, setZonas] = useState<Zona[]>(ZONAS_POR_DEFECTO);
  const [zonaElegida, setZonaElegida] = useState(1);

  useEffect(() => {
    let numeroCarga = 0;
    const actualizarMesas = async () => {
      const carga = ++numeroCarga;
      try {
        const [mesasGuardadas, zonasGuardadas] = await Promise.all([cargarMesas(), cargarZonas()]);
        if (carga !== numeroCarga) return;
        setMesas(mesasGuardadas);
        setZonas(zonasGuardadas);
      } catch (error) {
        console.error('Error cargando mesas:', error.message);
      }
    };
    return mantenerActualizado(['mesas', 'config'], actualizarMesas);
  }, []);

  // Si la zona elegida ya no existe, se muestra la primera
  const zona = zonas.find(z => z.numero === zonaElegida) ?? zonas[0];
  const pisoSeleccionado = zona.numero;
  const mesasActivas = Object.entries(mesas).filter(([key, mesa]: [string, any]) => mesa.pedidos?.length > 0);
  const totalMesasActivas = mesasActivas.reduce((sum, [key, mesa]: [string, any]) => sum + (mesa.total || 0), 0);

  return (
    <>
      <Card className="bg-transparent bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border border-cyan-400/30 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center">
              <p className="text-slate-300 text-xs sm:text-sm font-medium">Mesas Activas</p>
              <p className="text-3xl sm:text-4xl font-bold text-white">{mesasActivas.length}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-300 text-xs sm:text-sm font-medium">Total Pendiente</p>
              <p className="text-3xl sm:text-4xl font-bold text-white">{pesos(totalMesasActivas)}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-300 text-xs sm:text-sm font-medium">Promedio por Mesa</p>
              <p className="text-3xl sm:text-4xl font-bold text-white">
                {pesos(mesasActivas.length > 0 ? totalMesasActivas / mesasActivas.length : 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {zonas.map((z) => {
              const mesasDelPiso = mesasActivas.filter(([key]) => key.startsWith(`${z.numero}-`));
              const totalPiso = mesasDelPiso.reduce((sum, [key, mesa]: [string, any]) => sum + (mesa.total || 0), 0);
              return (
                <Button
                  key={z.numero}
                  onClick={() => setZonaElegida(z.numero)}
                  className={`h-auto min-h-16 sm:min-h-20 py-2 flex flex-col items-center justify-center gap-0.5 text-xs sm:text-base ${
                    pisoSeleccionado === z.numero
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span className="block text-base sm:text-lg font-bold leading-tight truncate max-w-full">{z.nombre}</span>
                  <span className="text-xs sm:text-sm">{mesasDelPiso.length} activas</span>
                  <span className="text-[10px] sm:text-xs font-semibold">{pesos(totalPiso)}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-white text-base sm:text-xl">Mesas - {zona.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
            {Array.from({ length: zona.mesas }, (_, i) => {
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
                      : 'bg-emerald-500/10 border-emerald-400/40'
                  }`}
                >
                  <UtensilsCrossed className={`w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2 ${ocupada ? colorConfig.text : 'text-emerald-300'}`} />
                  <p className={`text-sm sm:text-lg font-bold ${ocupada ? colorConfig.text : 'text-emerald-200'}`}>{numeroMesa}</p>
                  {ocupada ? (
                    <>
                      <p className={`text-[10px] sm:text-xs font-medium ${colorConfig.text} truncate w-full text-center`}>{mesaData.mesero}</p>
                      <p className={`text-xs sm:text-sm font-bold mt-0.5 sm:mt-1 ${colorConfig.text}`}>
                        {pesos(mesaData.total)}
                      </p>
                      <p className={`text-[9px] sm:text-xs ${colorConfig.text} mt-0.5 sm:mt-1`}>
                        {mesaData.pedidos?.length} items
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-emerald-300">Disponible</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-white text-base sm:text-xl">Detalle de Mesas Activas</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
            {mesasActivas.filter(([key]) => key.startsWith(`${pisoSeleccionado}-`)).length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No hay mesas activas en esta zona</p>
              </div>
            ) : (
              mesasActivas
                .filter(([key]) => key.startsWith(`${pisoSeleccionado}-`))
                .map(([mesaKey, mesaData]: [string, any]) => {
                  const numero = mesaKey.split('-')[1];
                  const colorConfig = getMeseroColorConfig(mesaData.mesero);
                  return (
                    <div key={mesaKey} className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${colorConfig.bg} border-2 ${colorConfig.border}`}>
                            <UtensilsCrossed className={`w-4 h-4 sm:w-6 sm:h-6 ${colorConfig.text}`} />
                          </div>
                          <div>
                            <p className="text-base sm:text-lg font-bold text-white">Mesa {numero}</p>
                            <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">{mesaData.mesero}</p>
                          </div>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-300">{pesos(mesaData.total)}</p>
                      </div>
                      <div className="bg-black/20 rounded p-2 sm:p-3 space-y-1">
                        {mesaData.pedidos?.map((pedido, idx) => (
                          <div key={idx} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-300 truncate flex-1 mr-2">
                              {pedido.cantidad}x {nombreItem(pedido)}
                            </span>
                            <span className="text-white font-medium whitespace-nowrap">
                              {pesos(subtotal(pedido))}
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
