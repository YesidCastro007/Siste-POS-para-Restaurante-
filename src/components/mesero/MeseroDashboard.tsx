import React, { useState } from 'react';
import { LogOut, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MENU_DATA, PISOS, SABORES_POR_DEFECTO } from '@/data/menu';
import { getMeseroColorConfig } from '@/lib/meseroColors';
import { cargarMesas, guardarCambiosMesas, registrarVenta, leerConfig, escucharCambios } from '@/lib/datos';
import ModalPedido from './ModalPedido';
import ModalCobro from './ModalCobro';

export default function MeseroDashboard({ user, onLogout }) {
  const [pisoActual, setPisoActual] = useState(1);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [mesas, setMesas] = useState({});
  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [saboresSopas, setSaboresSopas] = useState([]);
  const [precioSopas, setPrecioSopas] = useState(MENU_DATA.sopas.price);

  const mesasRef = React.useRef({});

  // Mesas, ventas y sabores se guardan en Supabase y se comparten entre dispositivos
  const cargarDatos = React.useCallback(async () => {
    try {
      const [mesasGuardadas, sabores, precio] = await Promise.all([
        cargarMesas(),
        leerConfig('sabores_sopas', SABORES_POR_DEFECTO),
        leerConfig('precio_sopas', MENU_DATA.sopas.price)
      ]);
      mesasRef.current = mesasGuardadas;
      setMesas(mesasGuardadas);
      setSaboresSopas(sabores);
      setPrecioSopas(Number(precio));
    } catch (error) {
      console.error('Error cargando datos:', error.message);
    }
  }, []);

  const guardarMesas = async (nuevasMesas) => {
    const anteriores = mesasRef.current;
    mesasRef.current = nuevasMesas;
    setMesas(nuevasMesas);
    try {
      await guardarCambiosMesas(anteriores, nuevasMesas);
    } catch (error) {
      console.error('Error guardando mesas:', error.message);
      alert('⚠️ No se pudo guardar la mesa. Revise la conexión a internet.');
      cargarDatos();
    }
  };

  // Cargar datos al entrar y cada vez que otro dispositivo cambie algo
  React.useEffect(() => {
    cargarDatos();
    const dejarDeEscuchar = escucharCambios(['mesas', 'config'], cargarDatos);
    // Respaldo por si se pierde la conexión en vivo
    const interval = setInterval(cargarDatos, 15000);
    return () => {
      dejarDeEscuchar();
      clearInterval(interval);
    };
  }, [cargarDatos]);

  const mesasDelPiso = PISOS.find(p => p.number === pisoActual)?.mesas || 0;

  const abrirMesa = (numeroMesa) => {
    setMesaSeleccionada(numeroMesa);
    setMostrarPedido(true);
  };

  const cerrarPedido = () => {
    setMostrarPedido(false);
    setMesaSeleccionada(null);
  };

  const procesarCobro = async (mesaKey, mesaData) => {
    // Crear registro de venta
    const venta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      mesa: mesaKey,
      mesero: user.name,
      pedidos: mesaData.pedidos,
      total: mesaData.total,
      metodoPago: mesaData.metodoPago || 'efectivo'
    };

    // Guardar la venta
    try {
      await registrarVenta(venta);
    } catch (error) {
      console.error('Error guardando venta:', error.message);
      alert('⚠️ No se pudo registrar la venta. Revise la conexión a internet e intente de nuevo.');
      return;
    }

    // Limpiar la mesa y guardar
    const nuevasMesas = { ...mesas };
    delete nuevasMesas[mesaKey];
    guardarMesas(nuevasMesas);

    // Cerrar modales
    setMostrarCobro(false);
    setMostrarPedido(false);
    setMesaSeleccionada(null);

    alert(`¡Cobro procesado exitosamente! Total: $${mesaData.total.toLocaleString()}`);
  };

  const abrirCobro = () => {
    setMostrarPedido(false);
    setMostrarCobro(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-red-900/20 sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">
                  Santandereano SAS
                </h1>
                <p className="text-xs sm:text-sm text-red-300 hidden sm:block">
                  Panel de Mesero
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Mesero</p>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Selector de Pisos */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {PISOS.map((piso) => (
                <Button
                  key={piso.number}
                  onClick={() => setPisoActual(piso.number)}
                  variant={pisoActual === piso.number ? "default" : "outline"}
                  className={`flex-1 py-4 sm:py-6 px-3 sm:px-6 rounded-xl font-medium transition-all duration-300 ${
                    pisoActual === piso.number
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border-red-900/20'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold">Piso {piso.number}</p>
                    <p className="text-xs sm:text-sm opacity-80">{piso.mesas} mesas</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leyenda de Colores */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600/20 border border-green-600 rounded"></div>
                <span className="text-gray-300">Disponible</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600/30 border border-blue-600 rounded"></div>
                <span className="text-gray-300">Mi Mesa</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-600/10 border border-purple-600/50 rounded"></div>
                <span className="text-gray-300">Otro Mesero</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Mesas */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-white">Mesas - Piso {pisoActual}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
              {Array.from({ length: mesasDelPiso }, (_, i) => {
                const numeroMesa = i + 1;
                const mesaKey = `${pisoActual}-${numeroMesa}`;
                const mesaData = mesas[mesaKey];
                const ocupada = mesaData && mesaData.pedidos?.length > 0;
                const meseroAsignado = mesaData?.mesero;
                const esMiMesa = meseroAsignado === user.name;

                // Definir colores según el estado y mesero
                let clasesMesa = 'aspect-square rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ';
                
                if (ocupada) {
                  const colorConfig = getMeseroColorConfig(meseroAsignado);
                  if (esMiMesa) {
                    // Mi mesa - color del mesero con mayor intensidad
                    clasesMesa += `${colorConfig.bg} border-2 ${colorConfig.border} shadow-lg ${colorConfig.shadow} ${colorConfig.text}`;
                  } else {
                    // Mesa de otro mesero - color tenue
                    clasesMesa += `${colorConfig.bgLight} border-2 ${colorConfig.borderLight} shadow-lg ${colorConfig.shadowLight} ${colorConfig.textLight}`;
                  }
                } else {
                  // Mesa disponible
                  clasesMesa += 'bg-green-600/20 border-2 border-green-600/50 hover:border-green-500 text-green-300';
                }

                return (
                  <Button
                    key={numeroMesa}
                    onClick={() => abrirMesa(numeroMesa)}
                    variant="outline"
                    className={clasesMesa}
                  >
                    <UtensilsCrossed className="w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                    <p className="text-base sm:text-lg font-bold">{numeroMesa}</p>
                    <p className="text-[10px] sm:text-xs leading-tight">
                      {ocupada ? (
                        esMiMesa ? 'Mi Mesa' : `${meseroAsignado.split(' ')[0]}`
                      ) : 'Libre'}
                    </p>
                    {ocupada && mesaData.total && (
                      <p className="text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1">
                        ${mesaData.total.toLocaleString()}
                      </p>
                    )}
                    {ocupada && !esMiMesa && (
                      <p className="text-[9px] sm:text-xs opacity-60 mt-0.5 sm:mt-1">
                        🔒
                      </p>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Pedido */}
      {mostrarPedido && (
        <ModalPedido
          pisoActual={pisoActual}
          mesaSeleccionada={mesaSeleccionada}
          mesas={mesas}
          setMesas={guardarMesas}
          onCerrar={cerrarPedido}
          onAbrirCobro={abrirCobro}
          user={user}
          saboresSopas={saboresSopas}
          precioSopas={precioSopas}
        />
      )}

      {/* Modal de Cobro */}
      {mostrarCobro && mesaSeleccionada && (
        <ModalCobro
          pisoActual={pisoActual}
          mesaSeleccionada={mesaSeleccionada}
          mesaData={mesas[`${pisoActual}-${mesaSeleccionada}`]}
          onCerrar={() => setMostrarCobro(false)}
          onProcesarCobro={(mesaData) => procesarCobro(`${pisoActual}-${mesaSeleccionada}`, mesaData)}
        />
      )}
    </div>
  );
}
