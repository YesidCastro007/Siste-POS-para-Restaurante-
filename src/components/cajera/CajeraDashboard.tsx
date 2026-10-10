import React, { useState } from 'react';
import { LogOut, UtensilsCrossed, Clock, BarChart3, CreditCard, Banknote, Smartphone, Receipt, MessageCircle, BookOpen, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarcaEncabezado } from '@/components/marca/Marca';
import { useNombreNegocio } from '@/hooks/useNombreNegocio';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditorMenu from '@/components/menu/EditorMenu';
import EditorZonas from '@/components/menu/EditorZonas';
import CajeroMesasView from '@/components/CajeroMesasView';
import ModalDetalleVenta from './ModalDetalleVenta';
import ModalWhatsApp from './ModalWhatsApp';
import ModalReporteCierre, { type CierreTerminado } from './ModalReporteCierre';
import { type Venta, cargarVentas, crearCargadorDeVentas, leerConfig, guardarConfig, mantenerActualizado } from '@/lib/datos';
import { type Periodo, inicioDelPeriodo } from '@/lib/estadisticas';
import { generarReporteCierre, totalesPorMetodo } from '@/lib/reporteCierre';
import { generarReportePDF, descargarPDF } from '@/lib/reportePDF';
import { pesos, fechaHora, hora } from '@/lib/formato';

// Estado de la caja compartido en Supabase (config 'caja_estado').
// fechaApertura: desde cuándo cuentan las ventas del turno. fechaCierre: cuándo se cerró el último turno.
interface EstadoCaja {
  abierta: boolean;
  fechaApertura: string | null;
  cajero?: string;
  horaApertura?: string;
  fechaCierre?: string;
}

const CAJA_CERRADA: EstadoCaja = { abierta: false, fechaApertura: null };

const PERIODOS_CAJA: { id: Periodo; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'todo', label: 'Todo' }
];

const sumaTotal = (ventas: Venta[]) => ventas.reduce((suma, venta) => suma + venta.total, 0);

// Los números guardados antes podían incluir el 57 del país
const celularSinPais = (numero: string) => (numero.length === 12 && numero.startsWith('57') ? numero.slice(2) : numero);

// Tarjeta con una cifra del turno o del periodo
function Estadistica({ titulo, valor, Icono, destacado = false }) {
  return (
    <Card className={`backdrop-blur-md ${destacado ? 'bg-transparent bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-400/40' : 'bg-white/5 border-white/10'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-slate-300 text-xs sm:text-sm font-medium">{titulo}</p>
          <Icono className="w-4 h-4 text-cyan-300 shrink-0" />
        </div>
        <p className="text-white text-xl sm:text-2xl font-bold mt-2 truncate">{valor}</p>
      </CardContent>
    </Card>
  );
}

const VISTAS = [
  { id: 'ventas', nombre: 'Ventas y Caja', Icono: Receipt },
  { id: 'mesas', nombre: 'Vista de Mesas', Icono: UtensilsCrossed },
  { id: 'menu', nombre: 'Menú y Mesas', Icono: BookOpen }
] as const;

export default function CajeraDashboard({ user, onLogout }) {
  const negocio = useNombreNegocio();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filtroFecha, setFiltroFecha] = useState<Periodo>('hoy');
  const [busquedaMesa, setBusquedaMesa] = useState('');
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);
  // null mientras no se sabe si la caja está abierta (así no aparece "Abrir Caja" antes de tiempo)
  const [caja, setCaja] = useState<EstadoCaja | null>(null);
  const [procesandoCaja, setProcesandoCaja] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [cierreTerminado, setCierreTerminado] = useState<CierreTerminado | null>(null);
  const [vistaActual, setVistaActual] = useState<(typeof VISTAS)[number]['id']>('ventas');
  const [mostrarConfigWhatsApp, setMostrarConfigWhatsApp] = useState(false);
  const [numeroConfigurado, setNumeroConfigurado] = useState('');
  const [sinConexion, setSinConexion] = useState(false);

  const cajaAbierta = !!caja?.abierta;
  const fechaApertura = caja?.fechaApertura ?? null;

  // Ventas, estado de caja y WhatsApp se guardan en Supabase y se comparten entre dispositivos.
  // Solo se descargan las ventas que se muestran: las del turno si la caja está abierta,
  // o las del periodo elegido si está cerrada (y después, solo las nuevas)
  const filtroFechaRef = React.useRef(filtroFecha);
  filtroFechaRef.current = filtroFecha;
  const cargador = React.useRef(crearCargadorDeVentas());
  const numeroCarga = React.useRef(0);
  const cargarDatos = React.useCallback(async () => {
    const carga = ++numeroCarga.current;
    try {
      const estadoCaja = await leerConfig<EstadoCaja>('caja_estado', CAJA_CERRADA);
      const desde = estadoCaja.abierta && estadoCaja.fechaApertura
        ? new Date(estadoCaja.fechaApertura)
        : inicioDelPeriodo(filtroFechaRef.current);
      const [lista, numero] = await Promise.all([
        cargador.current(desde),
        leerConfig('whatsapp_numero', '')
      ]);
      if (carga !== numeroCarga.current) return;
      setVentas(lista);
      setCaja(estadoCaja);
      setNumeroConfigurado(numero);
      setSinConexion(false);
    } catch (error) {
      console.error('Error cargando datos:', error.message);
      if (carga === numeroCarga.current) setSinConexion(true);
    }
  }, []);

  React.useEffect(() => mantenerActualizado(['ventas', 'config'], cargarDatos), [cargarDatos]);

  // Al cambiar de periodo se piden las ventas de ese periodo
  const primeraCarga = React.useRef(true);
  React.useEffect(() => {
    if (primeraCarga.current) { primeraCarga.current = false; return; }
    cargarDatos();
  }, [filtroFecha, cargarDatos]);

  const ventasDelTurno = (lista = ventas) => {
    if (!fechaApertura) return [];
    const inicio = new Date(fechaApertura);
    return lista.filter(venta => new Date(venta.fecha) >= inicio);
  };

  const abrirCaja = async () => {
    if (procesandoCaja) return;
    setProcesandoCaja(true);
    try {
      // Se revisa en Supabase por si otra cajera ya la abrió (no se reinicia un turno abierto)
      const actual = await leerConfig<EstadoCaja>('caja_estado', CAJA_CERRADA);
      if (actual.abierta) {
        alert(`La caja ya estaba abierta desde ${fechaHora(actual.fechaApertura)}${actual.cajero ? ` (${actual.cajero})` : ''}.`);
        return;
      }
      const ahora = new Date().toISOString();
      let inicio = ahora;
      // Ventas que los meseros cobraron con la caja cerrada, después del último cierre
      if (actual.fechaCierre) {
        const sinCierre = await cargarVentas(new Date(actual.fechaCierre));
        if (sinCierre.length > 0) {
          const incluir = confirm(
            `Hay ${sinCierre.length} ${sinCierre.length === 1 ? 'venta' : 'ventas'} por ${pesos(sumaTotal(sinCierre))} cobradas con la caja cerrada ` +
            `(desde el último cierre, ${fechaHora(actual.fechaCierre)}).\n\n` +
            '¿Sumarlas a este turno? Si elige Cancelar, no entrarán en ningún cierre.'
          );
          if (incluir) inicio = actual.fechaCierre;
        }
      }
      const nuevo: EstadoCaja = { abierta: true, fechaApertura: inicio, horaApertura: ahora, cajero: user.name };
      await guardarConfig('caja_estado', nuevo);
      setCaja(nuevo);
      alert(`✅ Caja abierta exitosamente\nCajero: ${user.name}\nHora: ${fechaHora(ahora)}`);
    } catch (error) {
      console.error('Error abriendo la caja:', error.message);
      alert('⚠️ No se pudo guardar el cambio. Revise la conexión a internet.');
    } finally {
      setProcesandoCaja(false);
      cargarDatos();
    }
  };

  const cerrarCaja = () => {
    if (ventasDelTurno().length === 0 && !confirm('No hay ventas en este turno. ¿Cerrar la caja de todos modos?')) return;
    setCierreTerminado(null);
    setMostrarReporte(true);
    cargarDatos();
  };

  const confirmarCierreCaja = async () => {
    if (cerrando || !fechaApertura) return;
    setCerrando(true);
    const cierre = new Date().toISOString();
    try {
      // Si otra cajera ya cerró este turno, no se cierra dos veces
      const actual = await leerConfig<EstadoCaja>('caja_estado', CAJA_CERRADA);
      if (!actual.abierta || actual.fechaApertura !== fechaApertura) {
        alert('Este turno ya se cerró desde otro dispositivo.');
        setMostrarReporte(false);
        setCerrando(false);
        cargarDatos();
        return;
      }
      await guardarConfig('caja_estado', { abierta: false, fechaApertura: null, fechaCierre: cierre, cajero: user.name });
    } catch (error) {
      console.error('Error cerrando la caja:', error.message);
      alert('⚠️ No se pudo cerrar la caja. Revise la conexión a internet.');
      setCerrando(false);
      return;
    }

    // El reporte final se arma con las ventas guardadas en Supabase hasta el cierre,
    // también las que llegaron mientras se revisaba el reporte
    let ventasCierre = ventasDelTurno().filter(venta => new Date(venta.fecha) < new Date(cierre));
    try {
      ventasCierre = (await cargarVentas(new Date(fechaApertura))).filter(venta => new Date(venta.fecha) < new Date(cierre));
    } catch (error) {
      console.error('No se pudieron volver a cargar las ventas del turno:', error.message);
    }
    const reporte = generarReporteCierre(ventasCierre, { inicio: fechaApertura, fin: cierre, cajero: user.name, negocio });

    try {
      const historial = await leerConfig<unknown[]>('historial_cierres', []);
      await guardarConfig('historial_cierres', [...(Array.isArray(historial) ? historial : []), { ...reporte, id: Date.now() }]);
    } catch (error) {
      console.error('Error guardando historial de cierres:', error.message);
      alert('⚠️ La caja se cerró, pero el reporte no quedó guardado en el historial. Guarde el PDF que se va a descargar.');
    }

    const pdf = generarReportePDF(reporte);
    descargarPDF(pdf);
    setCaja({ abierta: false, fechaApertura: null, fechaCierre: cierre, cajero: user.name });
    setCierreTerminado({ reporte, pdf });
    setCerrando(false);
    cargarDatos();
  };

  const terminarCierre = () => {
    setMostrarReporte(false);
    setCierreTerminado(null);
  };

  const guardarNumeroWhatsApp = async (numero: string) => {
    try {
      await guardarConfig('whatsapp_numero', numero);
    } catch (error) {
      console.error('Error guardando whatsapp_numero:', error.message);
      alert('⚠️ No se pudo guardar el cambio. Revise la conexión a internet.');
      return false;
    }
    setNumeroConfigurado(numero);
    setMostrarConfigWhatsApp(false);
    return true;
  };

  // Con la caja abierta se muestran las ventas del turno; cerrada, las del periodo elegido.
  // Las cifras son del turno o del periodo; el buscador solo filtra la lista.
  const desdePeriodo = inicioDelPeriodo(filtroFecha);
  const ventasDelPeriodo = cajaAbierta
    ? ventasDelTurno()
    : ventas.filter(venta => !desdePeriodo || new Date(venta.fecha) >= desdePeriodo);
  const busqueda = busquedaMesa.trim().toLowerCase();
  const ventasMostradas = busqueda
    ? ventasDelPeriodo.filter(venta => venta.mesa.toLowerCase().includes(busqueda))
    : ventasDelPeriodo;
  const totalVentas = sumaTotal(ventasDelPeriodo);
  const ventasPorMetodo = totalesPorMetodo(ventasDelPeriodo);

  const reportePrevio = mostrarReporte && fechaApertura && !cierreTerminado
    ? generarReporteCierre(ventasDelTurno(), { inicio: fechaApertura, fin: new Date().toISOString(), cajero: user.name, negocio })
    : null;

  return (
    <div className="min-h-screen fondo-shadow">
      {/* Header */}
      <div className="bg-[#070D1C]/85 backdrop-blur-md border-b border-cyan-400/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <MarcaEncabezado panel="Panel de Caja" negocio={negocio} />

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Caja</p>
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

      <div className="container mx-auto px-4 py-6 space-y-6">
        {sinConexion && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            <WifiOff className="w-4 h-4 shrink-0" />
            Sin conexión con el servidor: las ventas pueden no estar al día. Revise el internet.
          </div>
        )}

        {/* Selector de Vista */}
        <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {VISTAS.map(({ id, nombre, Icono }) => (
                <Button
                  key={id}
                  onClick={() => setVistaActual(id)}
                  className={`h-auto min-h-16 py-2 px-1 flex flex-col items-center justify-center whitespace-normal transition-all ${
                    vistaActual === id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-cyan-400/10'
                  }`}
                >
                  <Icono className="w-6 h-6 mb-1 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium leading-tight text-center">{nombre}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {vistaActual === 'mesas' ? (
          <CajeroMesasView />
        ) : vistaActual === 'menu' ? (
          <div className="space-y-6">
            <EditorMenu />
            <EditorZonas />
          </div>
        ) : (
          <>
        {/* Botones de Apertura/Cierre de Caja */}
        <Card className={`border shadow-xl backdrop-blur-md ${
          cajaAbierta 
            ? 'bg-emerald-500/10 border-emerald-400/40' 
            : 'bg-slate-900/60 border-amber-400/30'
        }`}>
          <CardContent className="p-4 sm:p-6">
            {caja === null ? (
              <p className="text-slate-300 text-center py-4">Cargando estado de la caja…</p>
            ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center ${
                  cajaAbierta ? 'bg-emerald-500/20 ring-1 ring-emerald-400/50' : 'bg-amber-400/10 ring-1 ring-amber-400/40'
                }`}>
                  <span className="text-3xl">{cajaAbierta ? '🔓' : '🔒'}</span>
                </div>
                <div>
                  <h3 className="font-marca text-xl font-bold text-white">
                    {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
                  </h3>
                  {cajaAbierta ? (
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>📅 Apertura: {fechaHora(caja.horaApertura ?? fechaApertura)}</p>
                      {caja.horaApertura && caja.horaApertura !== fechaApertura && (
                        <p>🧾 Incluye ventas desde {fechaHora(fechaApertura)}</p>
                      )}
                      <p>💰 Ventas del turno: {ventasDelTurno().length} órdenes</p>
                      <p>💵 Total acumulado: {pesos(sumaTotal(ventasDelTurno()))}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Abra la caja al empezar el turno: el cierre suma las ventas desde la apertura.</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                {!cajaAbierta ? (
                  <Button
                    onClick={abrirCaja}
                    disabled={procesandoCaja}
                    className="boton-marca w-full sm:w-auto h-12 px-8 text-base font-semibold"
                  >
                    {procesandoCaja ? 'Abriendo…' : '🔓 Abrir Caja'}
                  </Button>
                ) : (
                  <Button
                    onClick={cerrarCaja}
                    className="w-full sm:w-auto h-12 bg-transparent border border-red-400/60 text-red-200 hover:bg-red-500/20 px-8 text-base font-semibold"
                  >
                    🔒 Cerrar Caja y Ver Reporte
                  </Button>
                )}
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas Rápidas - Solo ventas del turno actual */}
        {cajaAbierta && (
          <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-3">
            <p className="text-cyan-200 text-sm font-medium text-center">
              📊 Mostrando solo ventas del turno actual (desde {hora(fechaApertura)})
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <Estadistica titulo={cajaAbierta ? 'Total Turno' : 'Total Ventas'} valor={pesos(totalVentas)} Icono={BarChart3} destacado />
          <Estadistica titulo="Órdenes" valor={ventasDelPeriodo.length} Icono={Receipt} />
          <Estadistica titulo="Efectivo" valor={pesos(ventasPorMetodo.efectivo || 0)} Icono={Banknote} />
          <Estadistica titulo="Tarjeta" valor={pesos(ventasPorMetodo.tarjeta || 0)} Icono={CreditCard} />
          <Estadistica titulo="Nequi" valor={pesos(ventasPorMetodo['transferencia - Nequi'] || 0)} Icono={Smartphone} />
          <Estadistica titulo="Daviplata" valor={pesos(ventasPorMetodo['transferencia - Daviplata'] || 0)} Icono={Smartphone} />
        </div>

        {/* Configuración de WhatsApp */}
        <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-400" />
                Configuración de WhatsApp
              </CardTitle>
              <Button
                onClick={() => setMostrarConfigWhatsApp(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Configurar Número
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">Número configurado:</p>
                  <p className="text-gray-300 text-sm mt-1">
                    {numeroConfigurado
                      ? `+57 ${celularSinPais(numeroConfigurado)}`
                      : 'No configurado'}
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-400 text-xs mt-3">
                💡 Al cerrar la caja se descarga el reporte en PDF y puede enviarlo por WhatsApp a este número.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filtros y Búsqueda */}
        <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              {cajaAbierta ? (
                <p className="text-cyan-200 text-sm font-medium">Período: turno actual</p>
              ) : (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-white font-medium">Período:</label>
                <div className="flex flex-wrap gap-2">
                  {PERIODOS_CAJA.map((periodo) => (
                    <Button
                      key={periodo.id}
                      onClick={() => setFiltroFecha(periodo.id)}
                      variant={filtroFecha === periodo.id ? "default" : "outline"}
                      size="sm"
                      className={filtroFecha === periodo.id 
                        ? 'bg-cyan-400 text-slate-900 font-semibold' 
                        : 'bg-white/5 border-cyan-400/20 text-gray-300 hover:bg-white/10'
                      }
                    >
                      {periodo.label}
                    </Button>
                  ))}
                </div>
              </div>
              )}
              
              <div className="flex items-center gap-2 w-full md:flex-1">
                <label className="text-white font-medium">Buscar:</label>
                <Input
                  value={busquedaMesa}
                  onChange={(e) => setBusquedaMesa(e.target.value)}
                  placeholder="Buscar por mesa..."
                  className="bg-white/5 border-cyan-400/20 text-white w-full md:max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ventas */}
        <Card className="bg-white/5 backdrop-blur-md border-cyan-400/10">
          <CardHeader>
            <CardTitle className="text-white flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-green-400" />
                {cajaAbierta ? 'Ventas del Turno Actual' : 'Historial de Ventas'} ({ventasMostradas.length})
              </div>
              <Badge className="bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                🔄 Actualización automática
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ventasMostradas.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No hay ventas para mostrar</p>
                </div>
              ) : (
                ventasMostradas.map((venta) => (
                  <div key={venta.id} className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-3 sm:p-4 border border-cyan-400/15 hover:border-cyan-400/40 transition-all duration-200">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold">Mesa {venta.mesa}</p>
                          <p className="text-gray-400 text-xs sm:text-sm truncate">
                            {fechaHora(venta.fecha)} • {venta.mesero}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-xl sm:text-2xl font-bold text-green-400">{pesos(venta.total)}</p>
                        <div className="flex flex-wrap items-center justify-end gap-2 mt-1">
                          <Badge className={`text-xs ${
                            venta.metodoPago === 'efectivo' ? 'bg-green-500/20 text-green-400' :
                            venta.metodoPago === 'tarjeta' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {venta.metodoPago}
                          </Badge>
                          <Button
                            onClick={() => setVentaDetalle(venta)}
                            variant="outline"
                            size="sm"
                            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                          >
                            Ver Detalle
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {ventaDetalle && <ModalDetalleVenta venta={ventaDetalle} onCerrar={() => setVentaDetalle(null)} />}

      {mostrarConfigWhatsApp && (
        <ModalWhatsApp
          numeroActual={celularSinPais(numeroConfigurado)}
          onGuardar={guardarNumeroWhatsApp}
          onCerrar={() => setMostrarConfigWhatsApp(false)}
        />
      )}

      {mostrarReporte && (reportePrevio || cierreTerminado) && (
        <ModalReporteCierre
          reporte={cierreTerminado?.reporte ?? reportePrevio}
          cerrando={cerrando}
          terminado={cierreTerminado}
          numeroWhatsApp={numeroConfigurado}
          onConfirmar={confirmarCierreCaja}
          onCancelar={() => setMostrarReporte(false)}
          onTerminar={terminarCierre}
        />
      )}
    </div>
  );
}
