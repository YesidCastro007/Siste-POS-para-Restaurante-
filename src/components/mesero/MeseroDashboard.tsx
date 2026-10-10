import React, { useState } from 'react';
import { LogOut, UtensilsCrossed, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarcaEncabezado } from '@/components/marca/Marca';
import { useNombreNegocio } from '@/hooks/useNombreNegocio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cargarMenu, cargarZonas, ZONAS_POR_DEFECTO, type Categoria, type Zona } from '@/lib/menu';
import { getMeseroColorConfig } from '@/lib/meseroColors';
import { cargarMesas, guardarCambiosMesas, liberarMesa, liberarMesaCobrada, registrarVenta, leerConfig, mantenerActualizado } from '@/lib/datos';
import ModalPedido from './ModalPedido';
import ModalCobro from './ModalCobro';
import { pesos } from '@/lib/formato';
import type { Mesa } from '@/lib/pedidos';

export default function MeseroDashboard({ user, onLogout }) {
  const negocio = useNombreNegocio();
  const [zonaActual, setZonaActual] = useState(1);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [mesas, setMesas] = useState<Record<string, Mesa>>({});
  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [menu, setMenu] = useState<Categoria[]>([]);
  const [zonas, setZonas] = useState<Zona[]>(ZONAS_POR_DEFECTO);
  // Hasta que lleguen las mesas de Supabase no se puede abrir ninguna,
  // para no guardar encima de un pedido que todavía no se ve
  const [estadoCarga, setEstadoCarga] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [errorCarga, setErrorCarga] = useState('');
  const [sinConexion, setSinConexion] = useState(false);

  const mesasRef = React.useRef<Record<string, Mesa>>({});
  const escriturasPendientes = React.useRef(0);
  const colaEscrituras = React.useRef<Promise<unknown>>(Promise.resolve());
  const numeroCarga = React.useRef(0);
  // Mesas ya cobradas que no se pudieron liberar (por ejemplo, sin internet): se reintenta en cada carga.
  // Guarda la fecha de creación del pedido cobrado, para no borrar un pedido nuevo de esa mesa.
  const porLiberar = React.useRef(new Map<string, string | undefined>());

  const liberarPendientes = async () => {
    for (const [mesaKey, fechaCreacion] of [...porLiberar.current]) {
      await liberarMesaCobrada(mesaKey, fechaCreacion);
      porLiberar.current.delete(mesaKey);
    }
  };

  // Mesas, menú y zonas se guardan en Supabase y se comparten entre dispositivos
  const cargarDatos = React.useCallback(async () => {
    const carga = ++numeroCarga.current;
    try {
      if (porLiberar.current.size > 0) await liberarPendientes().catch(() => {});
      const [mesasGuardadas, menuGuardado, zonasGuardadas] = await Promise.all([
        cargarMesas() as Promise<Record<string, Mesa>>,
        cargarMenu(),
        cargarZonas()
      ]);
      // Se descarta si llegó una carga más nueva o si hay un guardado en curso
      if (carga !== numeroCarga.current || escriturasPendientes.current > 0) return;
      // Una mesa ya cobrada que falta liberar no se muestra como ocupada
      porLiberar.current.forEach((fechaCreacion, mesaKey) => {
        if (mesasGuardadas[mesaKey]?.fechaCreacion === fechaCreacion) delete mesasGuardadas[mesaKey];
      });
      mesasRef.current = mesasGuardadas;
      setMesas(mesasGuardadas);
      setMenu(menuGuardado);
      setZonas(zonasGuardadas);
      setEstadoCarga('listo');
      setSinConexion(false);
    } catch (error) {
      console.error('Error cargando datos:', error.message);
      if (carga !== numeroCarga.current) return;
      setErrorCarga(error.message);
      setEstadoCarga(estado => (estado === 'listo' ? 'listo' : 'error'));
      setSinConexion(true);
    }
  }, []);

  // Cambia las mesas en pantalla de inmediato y luego guarda en Supabase. Devuelve si se guardó.
  // Los guardados van en fila, para que por ejemplo "liberar mesa" no llegue antes que el último pedido.
  const guardarEnSupabase = (nuevasMesas: Record<string, Mesa>, guardar: () => Promise<unknown>) => {
    escriturasPendientes.current++;
    numeroCarga.current++;
    mesasRef.current = nuevasMesas;
    setMesas(nuevasMesas);
    const resultado = colaEscrituras.current.then(async () => {
      try {
        await guardar();
        return true;
      } catch (error) {
        console.error('Error guardando mesas:', error.message);
        return false;
      } finally {
        escriturasPendientes.current--;
        if (escriturasPendientes.current === 0) cargarDatos();
      }
    });
    colaEscrituras.current = resultado;
    return resultado;
  };

  // Guarda el pedido de una sola mesa. Si no se pudo, la pantalla vuelve a lo que había
  // y el pedido sigue abierto para intentarlo de nuevo.
  const guardarMesa = async (mesaKey: string, mesa: Mesa) => {
    const anteriores = mesasRef.current;
    const nuevas = { ...anteriores, [mesaKey]: mesa };
    const guardado = await guardarEnSupabase(nuevas, () => guardarCambiosMesas(anteriores, nuevas));
    if (!guardado) {
      if (mesasRef.current[mesaKey] === mesa) {
        const revertidas = { ...mesasRef.current };
        if (anteriores[mesaKey]) revertidas[mesaKey] = anteriores[mesaKey];
        else delete revertidas[mesaKey];
        mesasRef.current = revertidas;
        setMesas(revertidas);
      }
      alert('⚠️ No se pudo guardar el pedido. Revise la conexión a internet e intente de nuevo.');
    }
    return guardado;
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
    if (estadoCarga !== 'listo') return;
    if (zonaExiste && mesaSeleccionada !== null && mesaSeleccionada > zona.mesas) {
      setMostrarPedido(false);
      setMostrarCobro(false);
      setMesaSeleccionada(null);
      alert('Esta mesa ya no existe en la zona. Elija otra mesa.');
    }
  }, [estadoCarga, zonaExiste, zona.mesas, mesaSeleccionada]);

  // Mesa atendida por este mesero (las mesas guardadas antes no tienen meseroId: se compara el nombre)
  const esDeEsteMesero = (mesa?: Mesa) =>
    !!mesa && (mesa.meseroId ? mesa.meseroId === user.id : mesa.mesero === user.name);
  const miColor = getMeseroColorConfig(user.name);

  const abrirMesa = (numeroMesa) => {
    setMesaSeleccionada(numeroMesa);
    setMostrarPedido(true);
  };

  const cerrarModales = () => {
    setMostrarCobro(false);
    setMostrarPedido(false);
    setMesaSeleccionada(null);
  };

  const procesarCobro = async (mesaKey: string, datosCobro) => {
    // Antes de cobrar se espera a que terminen los guardados y se revisa la mesa en Supabase,
    // por si otro dispositivo ya la cobró o cambió el pedido
    await colaEscrituras.current;
    let mesaActual: Mesa | undefined;
    let estadoCaja: { abierta?: boolean } | null;
    try {
      const [mesasGuardadas, caja] = await Promise.all([
        cargarMesas() as Promise<Record<string, Mesa>>,
        leerConfig<{ abierta?: boolean } | null>('caja_estado', null)
      ]);
      mesaActual = mesasGuardadas[mesaKey];
      estadoCaja = caja;
    } catch (error) {
      console.error('Error revisando la mesa antes de cobrar:', error.message);
      alert('⚠️ No se pudo registrar la venta. Revise la conexión a internet e intente de nuevo.');
      return;
    }
    if (!mesaActual?.pedidos?.length) {
      cerrarModales();
      cargarDatos();
      alert('Esta mesa ya fue cobrada o liberada desde otro dispositivo.');
      return;
    }
    if (JSON.stringify(mesaActual.pedidos) !== JSON.stringify(datosCobro.pedidos)) {
      cerrarModales();
      cargarDatos();
      alert('El pedido de esta mesa cambió en otro dispositivo. Ábrala de nuevo y revise el pedido antes de cobrar.');
      return;
    }

    const venta = {
      id: datosCobro.idVenta ?? Date.now(),
      fecha: new Date().toISOString(),
      mesa: mesaKey,
      // La venta es del mesero que atendió la mesa
      mesero: mesaActual.mesero || user.name,
      pedidos: mesaActual.pedidos,
      total: mesaActual.total,
      metodoPago: datosCobro.metodoPago || 'efectivo',
      montoPagado: datosCobro.montoPagado,
      cambio: datosCobro.cambio,
      notaAdicional: datosCobro.notaAdicional
    };

    try {
      await registrarVenta(venta);
    } catch (error) {
      console.error('Error guardando venta:', error.message);
      alert('⚠️ No se pudo registrar la venta. Revise la conexión a internet e intente de nuevo.');
      return;
    }

    // Liberar la mesa. Si falla, se reintenta en las siguientes cargas y la mesa no se muestra ocupada.
    porLiberar.current.set(mesaKey, mesaActual.fechaCreacion);
    const nuevasMesas = { ...mesasRef.current };
    delete nuevasMesas[mesaKey];
    await guardarEnSupabase(nuevasMesas, async () => {
      await liberarMesa(mesaKey);
      porLiberar.current.delete(mesaKey);
    });

    cerrarModales();
    const avisoCaja = estadoCaja && !estadoCaja.abierta
      ? '\n\nOjo: la caja está cerrada. Avise a la cajera para que esta venta quede en el próximo turno.'
      : '';
    alert(`¡Cobro procesado exitosamente! Total: ${pesos(venta.total)}${avisoCaja}`);
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
        {sinConexion && estadoCarga === 'listo' && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm text-amber-200">
            <WifiOff className="w-4 h-4 shrink-0" />
            Sin conexión con el servidor: las mesas pueden no estar al día. Revise el internet.
          </div>
        )}

        {estadoCarga !== 'listo' ? (
          <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
            <CardContent className="p-8 text-center space-y-3">
              {estadoCarga === 'cargando' ? (
                <p className="text-gray-300">Cargando mesas…</p>
              ) : (
                <>
                  <WifiOff className="w-10 h-10 text-amber-300 mx-auto" />
                  <p className="text-white font-medium">No se pudieron cargar las mesas</p>
                  <p className="text-gray-400 text-sm">{errorCarga || 'Revise la conexión a internet.'}</p>
                  <Button onClick={() => cargarDatos()} className="boton-marca text-white">Reintentar</Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
        <>
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
                <div className={`w-3 h-3 sm:w-4 sm:h-4 border rounded ${miColor.bg} ${miColor.border}`}></div>
                <span className="text-gray-300">Mi Mesa</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-400/10 border border-slate-400/50 rounded"></div>
                <span className="text-gray-300">Otro mesero</span>
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
                const meseroAsignado = mesaData?.mesero ?? '';
                const esMiMesa = esDeEsteMesero(mesaData);

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
                    {ocupada && mesaData.total > 0 && (
                      <p className="text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1">
                        {pesos(mesaData.total)}
                      </p>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>

      {/* Modal de Pedido */}
      {mostrarPedido && (
        <ModalPedido
          zona={zona}
          mesaSeleccionada={mesaSeleccionada}
          mesas={mesas}
          guardarMesa={guardarMesa}
          onCerrar={cerrarModales}
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
          onCerrar={cerrarModales}
          onProcesarCobro={(datosCobro) => procesarCobro(`${zona.numero}-${mesaSeleccionada}`, datosCobro)}
        />
      )}
    </div>
  );
}
