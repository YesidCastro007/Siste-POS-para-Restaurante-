import React, { useState } from 'react';
import { LogOut, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarcaEncabezado } from '@/components/marca/Marca';
import { useNombreNegocio } from '@/hooks/useNombreNegocio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cargarMenu, cargarZonas, ZONAS_POR_DEFECTO, type Categoria, type Zona } from '@/lib/menu';
import { getMeseroColorConfig } from '@/lib/meseroColors';
import { cargarMesas, guardarCambiosMesas, liberarMesa, registrarVenta, mantenerActualizado } from '@/lib/datos';
import ModalPedido from './ModalPedido';
import ModalCobro from './ModalCobro';

export default function MeseroDashboard({ user, onLogout }) {
  const negocio = useNombreNegocio();
  const [zonaActual, setZonaActual] = useState(1);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [mesas, setMesas] = useState({});
  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [menu, setMenu] = useState<Categoria[]>([]);
  const [zonas, setZonas] = useState<Zona[]>(ZONAS_POR_DEFECTO);

  const mesasRef = React.useRef({});
  const escriturasPendientes = React.useRef(0);
  const colaEscrituras = React.useRef(Promise.resolve());
  const numeroCarga = React.useRef(0);

  // Mesas, menú y zonas se guardan en Supabase y se comparten entre dispositivos
  const cargarDatos = React.useCallback(async () => {
    const carga = ++numeroCarga.current;
    try {
      const [mesasGuardadas, menuGuardado, zonasGuardadas] = await Promise.all([
        cargarMesas(),
        cargarMenu(),
        cargarZonas()
      ]);
      // Se descarta si llegó una carga más nueva o si hay un guardado en curso
      if (carga !== numeroCarga.current || escriturasPendientes.current > 0) return;
      mesasRef.current = mesasGuardadas;
      setMesas(mesasGuardadas);
      setMenu(menuGuardado);
      setZonas(zonasGuardadas);
    } catch (error) {
      console.error('Error cargando datos:', error.message);
    }
  }, []);

  // Cambia las mesas en pantalla de inmediato y luego guarda en Supabase.
  // Los guardados van en fila, para que por ejemplo "liberar mesa" no llegue antes que el último pedido.
  const guardarEnSupabase = (nuevasMesas, guardar) => {
    escriturasPendientes.current++;
    numeroCarga.current++;
    mesasRef.current = nuevasMesas;
    setMesas(nuevasMesas);
    colaEscrituras.current = colaEscrituras.current.then(async () => {
      try {
        await guardar();
      } catch (error) {
        console.error('Error guardando mesas:', error.message);
        alert('⚠️ No se pudo guardar la mesa. Revise la conexión a internet.');
      } finally {
        escriturasPendientes.current--;
        if (escriturasPendientes.current === 0) cargarDatos();
      }
    });
    return colaEscrituras.current;
  };

  const guardarMesas = (nuevasMesas) => {
    const anteriores = mesasRef.current;
    return guardarEnSupabase(nuevasMesas, () => guardarCambiosMesas(anteriores, nuevasMesas));
  };

  React.useEffect(() => mantenerActualizado(['mesas', 'config', 'categorias', 'productos'], cargarDatos), [cargarDatos]);

  // Si la zona elegida ya no existe (el dueño la borró), se muestra la primera
  const zona = zonas.find(z => z.numero === zonaActual) ?? zonas[0];
  const zonaExiste = zonas.some(z => z.numero === zonaActual);

  // Si el dueño borra la zona (o quita la mesa) mientras el mesero está en ella, se cierra el pedido
  // para que no se guarde en una mesa que ya no existe
  React.useEffect(() => {
    if (zonaExiste) return;
    setZonaActual(zonas[0].numero);
    if (mesaSeleccionada !== null) {
      setMostrarPedido(false);
      setMostrarCobro(false);
      setMesaSeleccionada(null);
      alert('Esta zona fue eliminada por el dueño. Elija una mesa de otra zona.');
    }
  }, [zonaExiste, zonas, mesaSeleccionada]);

  React.useEffect(() => {
    if (zonaExiste && mesaSeleccionada !== null && mesaSeleccionada > zona.mesas) {
      setMostrarPedido(false);
      setMostrarCobro(false);
      setMesaSeleccionada(null);
      alert('Esta mesa ya no existe en la zona. Elija otra mesa.');
    }
  }, [zonaExiste, zona.mesas, mesaSeleccionada]);

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

    // Liberar la mesa
    const nuevasMesas = { ...mesasRef.current };
    delete nuevasMesas[mesaKey];
    guardarEnSupabase(nuevasMesas, () => liberarMesa(mesaKey));

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
    <div className="min-h-screen fondo-shadow">
      {/* Header */}
      <div className="bg-[#070D1C]/85 backdrop-blur-md border-b border-cyan-400/10 sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <MarcaEncabezado panel="Panel de Mesero" negocio={negocio} />

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Mesero</p>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Selector de Pisos */}
        <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {zonas.map((z) => (
                <Button
                  key={z.numero}
                  onClick={() => setZonaActual(z.numero)}
                  variant={zona.numero === z.numero ? "default" : "outline"}
                  className={`flex-1 h-auto py-4 sm:py-6 px-3 sm:px-6 rounded-xl font-medium transition-all duration-300 ${
                    zona.numero === z.numero
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border-cyan-400/10'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold truncate">{z.nombre}</p>
                    <p className="text-xs sm:text-sm opacity-80">{z.mesas} mesas</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leyenda de Colores */}
        <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500/10 border border-emerald-400 rounded"></div>
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
        <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-white">Mesas - {zona.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
              {Array.from({ length: zona.mesas }, (_, i) => {
                const numeroMesa = i + 1;
                const mesaKey = `${zona.numero}-${numeroMesa}`;
                const mesaData = mesas[mesaKey];
                const ocupada = mesaData && mesaData.pedidos?.length > 0;
                const meseroAsignado = mesaData?.mesero;
                const esMiMesa = meseroAsignado === user.name;

                // Definir colores según el estado y mesero
                let clasesMesa = 'w-full h-auto aspect-square rounded-xl p-2 sm:p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ';
                
                if (ocupada) {
                  const colorConfig = getMeseroColorConfig(meseroAsignado);
                  if (esMiMesa) {
                    // Mi mesa - color del mesero con mayor intensidad
                    clasesMesa += `hover:bg-white/10 hover:text-white ${colorConfig.bg} border-2 ${colorConfig.border} shadow-lg ${colorConfig.shadow} ${colorConfig.text}`;
                  } else {
                    // Mesa de otro mesero - color tenue
                    clasesMesa += `hover:bg-white/10 hover:text-white ${colorConfig.bgLight} border-2 ${colorConfig.borderLight} shadow-lg ${colorConfig.shadowLight} ${colorConfig.textLight}`;
                  }
                } else {
                  // Mesa disponible
                  clasesMesa += 'bg-emerald-500/10 border-2 border-emerald-400/40 hover:border-emerald-300 hover:bg-emerald-500/15 text-emerald-300';
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
          zona={zona}
          mesaSeleccionada={mesaSeleccionada}
          mesas={mesas}
          setMesas={guardarMesas}
          onCerrar={cerrarPedido}
          onAbrirCobro={abrirCobro}
          user={user}
          menu={menu}
        />
      )}

      {/* Modal de Cobro */}
      {mostrarCobro && mesaSeleccionada && (
        <ModalCobro
          zonaNombre={zona.nombre}
          mesaSeleccionada={mesaSeleccionada}
          mesaData={mesas[`${zona.numero}-${mesaSeleccionada}`]}
          onCerrar={() => setMostrarCobro(false)}
          onProcesarCobro={(mesaData) => procesarCobro(`${zona.numero}-${mesaSeleccionada}`, mesaData)}
        />
      )}
    </div>
  );
}
