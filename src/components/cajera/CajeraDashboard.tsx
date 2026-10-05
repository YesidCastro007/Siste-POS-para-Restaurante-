import React, { useState } from 'react';
import { LogOut, UtensilsCrossed, X, Plus, Clock, Calculator, BarChart3, CreditCard, Banknote, Smartphone, Receipt, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MENU_DATA, SABORES_POR_DEFECTO } from '@/data/menu';
import { cargarVentas, leerConfig, guardarConfig, mantenerActualizado } from '@/lib/datos';
import CajeroMesasView from '@/components/CajeroMesasView';
import { generarReportePDF, enviarReportePorWhatsApp } from '@/lib/reportePDF';

export default function CajeraDashboard({ user, onLogout }) {
  const [ventasHoy, setVentasHoy] = useState([]);
  const [saboresSopas, setSaboresSopas] = useState([]);
  const [precioSopas, setPrecioSopas] = useState(MENU_DATA.sopas.price);
  const [nuevoSabor, setNuevoSabor] = useState('');
  const [mostrarAgregarSabor, setMostrarAgregarSabor] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [busquedaMesa, setBusquedaMesa] = useState('');
  const [mostrarDetalleVenta, setMostrarDetalleVenta] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [fechaApertura, setFechaApertura] = useState(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [reporteCierre, setReporteCierre] = useState(null);
  const [vistaActual, setVistaActual] = useState('ventas'); // 'ventas' o 'mesas'
  const [numeroWhatsApp, setNumeroWhatsApp] = useState('');
  const [mostrarConfigWhatsApp, setMostrarConfigWhatsApp] = useState(false);

  const [numeroConfigurado, setNumeroConfigurado] = useState('');

  // Ventas, sabores, estado de caja y WhatsApp se guardan en Supabase y se comparten entre dispositivos
  const numeroCarga = React.useRef(0);
  const cargarDatos = React.useCallback(async () => {
    const carga = ++numeroCarga.current;
    try {
      const [ventas, sabores, precio, estadoCaja, numero] = await Promise.all([
        cargarVentas(),
        leerConfig('sabores_sopas', SABORES_POR_DEFECTO),
        leerConfig('precio_sopas', MENU_DATA.sopas.price),
        leerConfig('caja_estado', { abierta: false, fechaApertura: null }),
        leerConfig('whatsapp_numero', '')
      ]);
      if (carga !== numeroCarga.current) return;
      setVentasHoy(ventas);
      setSaboresSopas(sabores);
      setPrecioSopas(Number(precio));
      setCajaAbierta(!!estadoCaja.abierta);
      setFechaApertura(estadoCaja.fechaApertura);
      setNumeroConfigurado(numero);
    } catch (error) {
      console.error('Error cargando datos:', error.message);
    }
  }, []);

  React.useEffect(() => mantenerActualizado(['ventas', 'config'], cargarDatos), [cargarDatos]);

  // Guarda un ajuste compartido; si falla, avisa y vuelve a cargar lo que hay en Supabase
  const guardarAjuste = async (key, value) => {
    try {
      await guardarConfig(key, value);
      return true;
    } catch (error) {
      console.error(`Error guardando ${key}:`, error.message);
      alert('⚠️ No se pudo guardar el cambio. Revise la conexión a internet.');
      cargarDatos();
      return false;
    }
  };

  const abrirCaja = async () => {
    const ahora = new Date().toISOString();
    const guardado = await guardarAjuste('caja_estado', {
      abierta: true,
      fechaApertura: ahora,
      cajero: user.name
    });
    if (!guardado) return;
    setCajaAbierta(true);
    setFechaApertura(ahora);
    alert(`✅ Caja abierta exitosamente\nCajero: ${user.name}\nHora: ${new Date(ahora).toLocaleString()}`);
  };

  const cerrarCaja = () => {
    const ventasDelDia = filtrarVentasDelDia();
    const reporte = generarReporte(ventasDelDia);
    setReporteCierre(reporte);
    setMostrarReporte(true);
  };

  const confirmarCierreCaja = async () => {
    const guardado = await guardarAjuste('caja_estado', {
      abierta: false,
      fechaApertura: null
    });
    if (!guardado) return;

    // Guardar reporte en historial
    try {
      const historialReportes = await leerConfig('historial_cierres', []);
      await guardarConfig('historial_cierres', [...historialReportes, { ...reporteCierre, id: Date.now() }]);
    } catch (error) {
      console.error('Error guardando historial de cierres:', error.message);
    }
    
    // Generar PDF
    const pdf = generarReportePDF(reporteCierre);
    
    // Si hay número de WhatsApp configurado, enviar
    if (numeroConfigurado) {
      enviarReportePorWhatsApp(pdf, numeroConfigurado);
    } else {
      // Solo descargar el PDF
      pdf.save(`Reporte_Cierre_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    
    setCajaAbierta(false);
    setFechaApertura(null);
    setMostrarReporte(false);
    setReporteCierre(null);
    
    alert('✅ Caja cerrada exitosamente. El reporte ha sido generado en PDF.');
  };

  const guardarNumeroWhatsApp = async () => {
    if (!numeroWhatsApp.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }
    
    const numeroLimpio = numeroWhatsApp.replace(/\D/g, '');
    if (numeroLimpio.length < 10) {
      alert('Número de teléfono inválido');
      return;
    }
    
    if (!(await guardarAjuste('whatsapp_numero', numeroLimpio))) return;
    setNumeroConfigurado(numeroLimpio);
    setMostrarConfigWhatsApp(false);
    alert('✅ Número de WhatsApp guardado exitosamente');
  };

  const filtrarVentasDelDia = () => {
    if (!fechaApertura) return [];
    const inicioTurno = new Date(fechaApertura);
    return ventasHoy.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= inicioTurno;
    });
  };

  const generarReporte = (ventas) => {
    const total = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const porMetodo = ventas.reduce((acc, venta) => {
      const metodo = venta.metodoPago || 'efectivo';
      acc[metodo] = (acc[metodo] || 0) + venta.total;
      return acc;
    }, {});
    
    // Análisis por categorías y productos
    const categorias = {
      'Picadas': { cantidad: 0, ingresos: 0, productos: {} },
      'Gallina': { cantidad: 0, ingresos: 0, productos: {} },
      'Sopas': { cantidad: 0, ingresos: 0, productos: {} },
      'Bebidas': { cantidad: 0, ingresos: 0, productos: {} },
      'Adicionales': { cantidad: 0, ingresos: 0, productos: {} }
    };
    
    ventas.forEach(venta => {
      venta.pedidos?.forEach(pedido => {
        const cantidad = pedido.cantidad;
        const precio = pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem;
        const subtotal = cantidad * precio;
        
        let categoria = '';
        let nombreProducto = '';
        
        if (pedido.tipo === 'picada') {
          categoria = 'Picadas';
          nombreProducto = `Picada ${pedido.size}`;
        } else if (pedido.tipo === 'gallina') {
          categoria = 'Gallina';
          nombreProducto = pedido.nombre;
        } else if (pedido.tipo === 'sopa') {
          categoria = 'Sopas';
          nombreProducto = pedido.nombre;
        } else if (pedido.tipo === 'bebida') {
          categoria = 'Bebidas';
          nombreProducto = pedido.nombre;
        } else if (pedido.tipo === 'adicional') {
          categoria = 'Adicionales';
          nombreProducto = pedido.nombre;
        }
        
        if (categoria && categorias[categoria]) {
          categorias[categoria].cantidad += cantidad;
          categorias[categoria].ingresos += subtotal;
          
          if (!categorias[categoria].productos[nombreProducto]) {
            categorias[categoria].productos[nombreProducto] = {
              cantidad: 0,
              ingresos: 0,
              precioUnitario: precio
            };
          }
          categorias[categoria].productos[nombreProducto].cantidad += cantidad;
          categorias[categoria].productos[nombreProducto].ingresos += subtotal;
        }
      });
    });
    
    // Calcular porcentajes
    Object.keys(categorias).forEach(cat => {
      categorias[cat].porcentaje = total > 0 ? ((categorias[cat].ingresos / total) * 100).toFixed(1) : 0;
    });
    
    return {
      fecha: new Date().toLocaleString(),
      turnoInicio: new Date(fechaApertura).toLocaleString(),
      turnoFin: new Date().toLocaleString(),
      totalVentas: total,
      cantidadOrdenes: ventas.length,
      ventasPorMetodo: porMetodo,
      cajero: user.name,
      categorias: categorias
    };
  };

  const agregarSabor = () => {
    if (!nuevoSabor.trim()) {
      alert('Ingrese un nombre para el sabor');
      return;
    }
    
    if (saboresSopas.includes(nuevoSabor.trim())) {
      alert('Este sabor ya existe');
      return;
    }
    
    const nuevosSabores = [...saboresSopas, nuevoSabor.trim()];
    setSaboresSopas(nuevosSabores);
    guardarAjuste('sabores_sopas', nuevosSabores);
    setNuevoSabor('');
    setMostrarAgregarSabor(false);
  };

  const eliminarSabor = (sabor) => {
    if (confirm(`¿Está seguro de eliminar "${sabor}"?`)) {
      const nuevosSabores = saboresSopas.filter(s => s !== sabor);
      setSaboresSopas(nuevosSabores);
      guardarAjuste('sabores_sopas', nuevosSabores);
    }
  };

  const filtrarVentas = () => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    return ventasHoy.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      const coincideMesa = busquedaMesa === '' || venta.mesa.toLowerCase().includes(busquedaMesa.toLowerCase());
      
      switch (filtroFecha) {
        case 'hoy':
          return fechaVenta >= inicioHoy && coincideMesa;
        case 'semana':
          const inicioSemana = new Date(inicioHoy);
          inicioSemana.setDate(inicioSemana.getDate() - 7);
          return fechaVenta >= inicioSemana && coincideMesa;
        case 'mes':
          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          return fechaVenta >= inicioMes && coincideMesa;
        default:
          return coincideMesa;
      }
    });
  };

  // Mostrar solo ventas del turno actual si la caja está abierta
  const ventasFiltradas = cajaAbierta ? filtrarVentasDelDia() : filtrarVentas();
  const totalVentas = ventasFiltradas.reduce((sum, venta) => sum + venta.total, 0);
  const ventasPorMetodo = ventasFiltradas.reduce((acc, venta) => {
    const metodo = venta.metodoPago || 'efectivo';
    acc[metodo] = (acc[metodo] || 0) + venta.total;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-red-900/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Santandereano SAS
                </h1>
                <p className="text-sm text-green-300">
                  Panel de Caja
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Caja</p>
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

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Selector de Vista */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setVistaActual('ventas')}
                className={`h-16 flex flex-col items-center justify-center transition-all ${
                  vistaActual === 'ventas'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-900/20'
                }`}
              >
                <Receipt className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Ventas y Caja</span>
              </Button>
              <Button
                onClick={() => setVistaActual('mesas')}
                className={`h-16 flex flex-col items-center justify-center transition-all ${
                  vistaActual === 'mesas'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-900/20'
                }`}
              >
                <UtensilsCrossed className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Vista de Mesas</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {vistaActual === 'mesas' ? (
          <CajeroMesasView />
        ) : (
          <>
        {/* Botones de Apertura/Cierre de Caja */}
        <Card className={`border-2 shadow-xl ${
          cajaAbierta 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  cajaAbierta ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {cajaAbierta ? (
                    <span className="text-3xl">🔓</span>
                  ) : (
                    <span className="text-3xl">🔒</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
                  </h3>
                  {cajaAbierta ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>📅 Apertura: {new Date(fechaApertura).toLocaleString()}</p>
                      <p>💰 Ventas del turno: {filtrarVentasDelDia().length} órdenes</p>
                      <p>💵 Total acumulado: ${filtrarVentasDelDia().reduce((sum, v) => sum + v.total, 0).toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Debe abrir la caja para comenzar a registrar ventas</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                {!cajaAbierta ? (
                  <Button
                    onClick={abrirCaja}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                  >
                    🔓 Abrir Caja
                  </Button>
                ) : (
                  <Button
                    onClick={cerrarCaja}
                    disabled={filtrarVentasDelDia().length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🔒 Cerrar Caja y Ver Reporte
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas Rápidas - Solo ventas del turno actual */}
        {cajaAbierta && (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-4">
            <p className="text-blue-800 font-semibold text-center">
              📊 Mostrando solo ventas del turno actual (desde {new Date(fechaApertura).toLocaleTimeString()})
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-white/90 border-green-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">{cajaAbierta ? 'Total Turno' : 'Total Ventas'}</p>
                  <p className="text-3xl font-bold text-gray-900">${totalVentas.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-blue-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Órdenes</p>
                  <p className="text-3xl font-bold text-gray-900">{ventasFiltradas.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-purple-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-medium">Efectivo</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo.efectivo || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-orange-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm font-medium">Tarjeta</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo.tarjeta || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-pink-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-700 text-sm font-medium">Nequi</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo['transferencia - Nequi'] || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-red-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium">Daviplata</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo['transferencia - Daviplata'] || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuración de WhatsApp */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-400" />
                Configuración de WhatsApp
              </CardTitle>
              <Button
                onClick={() => {
                  setNumeroWhatsApp(numeroConfigurado);
                  setMostrarConfigWhatsApp(true);
                }}
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
                      ? `+57 ${numeroConfigurado}`
                      : 'No configurado'}
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-400 text-xs mt-3">
                💡 Al cerrar la caja, el reporte se generará en PDF y se enviará automáticamente al número configurado por WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Sabores de Sopas */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-2">🍲</span>
                Gestión de Sopas
              </CardTitle>
              <Button
                onClick={() => setMostrarAgregarSabor(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Sabor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Precio actual de sopas:</span>
                <span className="text-2xl font-bold text-blue-400">${precioSopas.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {saboresSopas.map((sabor, index) => (
                <div key={index} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-white font-medium">{sabor}</span>
                  <Button
                    onClick={() => eliminarSabor(sabor)}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros y Búsqueda */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-white font-medium">Período:</label>
                <div className="flex space-x-2">
                  {[
                    { id: 'hoy', label: 'Hoy' },
                    { id: 'semana', label: 'Semana' },
                    { id: 'mes', label: 'Mes' },
                    { id: 'todo', label: 'Todo' }
                  ].map((periodo) => (
                    <Button
                      key={periodo.id}
                      onClick={() => setFiltroFecha(periodo.id)}
                      variant={filtroFecha === periodo.id ? "default" : "outline"}
                      size="sm"
                      className={filtroFecha === periodo.id 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                        : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                      }
                    >
                      {periodo.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-1">
                <label className="text-white font-medium">Buscar:</label>
                <Input
                  value={busquedaMesa}
                  onChange={(e) => setBusquedaMesa(e.target.value)}
                  placeholder="Buscar por mesa..."
                  className="bg-white/5 border-red-500/30 text-white max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ventas */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-green-400" />
                {cajaAbierta ? 'Ventas del Turno Actual' : 'Historial de Ventas'} ({ventasFiltradas.length})
              </div>
              <Badge className="bg-blue-500 text-white">
                🔄 Actualización automática
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ventasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No hay ventas para mostrar</p>
                </div>
              ) : (
                ventasFiltradas.map((venta) => (
                  <div key={venta.id} className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-red-500/20 hover:border-red-500/40 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">Mesa {venta.mesa}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(venta.fecha).toLocaleString()} • {venta.mesero}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">${venta.total.toLocaleString()}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`text-xs ${
                            venta.metodoPago === 'efectivo' ? 'bg-green-500/20 text-green-400' :
                            venta.metodoPago === 'tarjeta' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {venta.metodoPago}
                          </Badge>
                          <Button
                            onClick={() => setMostrarDetalleVenta(venta)}
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

      {/* Modal Agregar Sabor */}
      {mostrarAgregarSabor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-xl border border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">Agregar Nuevo Sabor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-300 mb-2">Nombre del Sabor</label>
                <Input
                  value={nuevoSabor}
                  onChange={(e) => setNuevoSabor(e.target.value)}
                  placeholder="Ej: Sopa de mondongo"
                  className="bg-white/5 border-red-500/30 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && agregarSabor()}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setMostrarAgregarSabor(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={agregarSabor}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detalle de Venta */}
      {mostrarDetalleVenta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-xl border border-red-500/30">
            <CardHeader className="border-b border-red-500/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Detalle de Venta - Mesa {mostrarDetalleVenta.mesa}</CardTitle>
                <Button
                  onClick={() => setMostrarDetalleVenta(null)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Fecha:</p>
                    <p className="text-white font-medium">{new Date(mostrarDetalleVenta.fecha).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mesero:</p>
                    <p className="text-white font-medium">{mostrarDetalleVenta.mesero}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Método de Pago:</p>
                    <p className="text-white font-medium">{mostrarDetalleVenta.metodoPago}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total:</p>
                    <p className="text-green-400 font-bold text-lg">${mostrarDetalleVenta.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <Separator className="bg-red-500/20" />
                
                <div>
                  <h4 className="text-white font-semibold mb-3">Productos:</h4>
                  <div className="space-y-2">
                    {mostrarDetalleVenta.pedidos?.map((pedido, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <div>
                          <p className="text-white font-medium">
                            {pedido.cantidad}x {pedido.tipo === 'picada' ? `Picada ${pedido.size}` : pedido.nombre}
                          </p>
                          {pedido.tipo === 'picada' && (
                            <p className="text-gray-400 text-sm">
                              {pedido.carnes?.join(', ')} • {pedido.termino}
                            </p>
                          )}
                        </div>
                        <p className="text-green-400 font-bold">
                          ${((pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem) * pedido.cantidad).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {mostrarDetalleVenta.notaAdicional && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Nota Adicional:</h4>
                    <p className="text-gray-300 bg-white/5 rounded-lg p-3">{mostrarDetalleVenta.notaAdicional}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Configuración WhatsApp */}
      {mostrarConfigWhatsApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gradient-to-br from-slate-900/95 via-green-900/95 to-slate-900/95 backdrop-blur-xl border border-green-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-green-400" />
                  Configurar WhatsApp
                </CardTitle>
                <Button
                  onClick={() => setMostrarConfigWhatsApp(false)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">
                  Número de Teléfono (WhatsApp)
                </label>
                <Input
                  type="tel"
                  value={numeroWhatsApp}
                  onChange={(e) => setNumeroWhatsApp(e.target.value)}
                  placeholder="Ej: 3001234567"
                  className="bg-white/5 border-green-500/30 text-white"
                />
                <p className="text-gray-400 text-xs mt-2">
                  💡 Ingrese el número sin espacios ni guiones. El código de país (+57) se agregará automáticamente.
                </p>
              </div>
              
              <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <p className="text-blue-200 text-sm">
                  ℹ️ Al cerrar la caja, el reporte se generará en PDF y se abrirá WhatsApp Web automáticamente para enviarlo al número configurado.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => setMostrarConfigWhatsApp(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={guardarNumeroWhatsApp}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Reporte de Cierre */}
      {mostrarReporte && reporteCierre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden bg-white shadow-2xl">
            <CardHeader className="bg-red-600 text-white">
              <CardTitle className="text-center">📊 Reporte General de Ventas - Cierre de Caja</CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
              <div className="space-y-6">
                {/* Balance General */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">📊 Balance General del Día</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Cajero:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.cajero}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Apertura:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.turnoInicio}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cierre:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.turnoFin}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Transacciones:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.cantidadOrdenes}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-800">Ingresos Totales:</span>
                      <span className="text-3xl font-bold text-green-600">${reporteCierre.totalVentas.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Ventas por Categorías */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">🏷️ Ventas por Categorías</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(reporteCierre.categorias).map(([categoria, datos]: [string, any]) => (
                      datos.cantidad > 0 && (
                        <div key={categoria} className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-2">{categoria}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Cantidad:</span>
                              <span className="font-medium">{datos.cantidad}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ingresos:</span>
                              <span className="font-medium text-green-600">${datos.ingresos.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Participación:</span>
                              <span className="font-medium text-blue-600">{datos.porcentaje}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Detalle por Productos */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">🍽️ Detalle por Productos</h3>
                  <div className="space-y-4">
                    {Object.entries(reporteCierre.categorias).map(([categoria, datos]: [string, any]) => (
                      datos.cantidad > 0 && (
                        <div key={categoria} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3 bg-gray-100 p-2 rounded">{categoria}</h4>
                          <div className="grid gap-2">
                            {Object.entries(datos.productos).map(([producto, info]: [string, any]) => (
                              <div key={producto} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                <div>
                                  <span className="font-medium">{producto}</span>
                                  <span className="text-gray-500 text-sm ml-2">(${info.precioUnitario.toLocaleString()} c/u)</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">Cant: {info.cantidad}</div>
                                  <div className="text-green-600 font-semibold">${info.ingresos.toLocaleString()}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">💳 Métodos de Pago</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(reporteCierre.ventasPorMetodo).map(([metodo, monto]: [string, any]) => (
                      <div key={metodo} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-center">
                          <p className="text-gray-600 capitalize text-sm">{metodo}</p>
                          <p className="font-bold text-lg text-gray-900">${(monto as number).toLocaleString()}</p>
                          <p className="text-xs text-blue-600">
                            {(((monto as number) / reporteCierre.totalVentas) * 100).toFixed(1)}%
                          </p>
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
                      <p className="text-2xl font-bold text-blue-600">
                        {reporteCierre.categorias.Bebidas?.cantidad || 0}
                      </p>
                      <p className="text-sm text-blue-600">
                        ${(reporteCierre.categorias.Bebidas?.ingresos || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-800">Alimentos</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {(reporteCierre.categorias.Picadas?.cantidad || 0) + 
                         (reporteCierre.categorias.Gallina?.cantidad || 0) + 
                         (reporteCierre.categorias.Sopas?.cantidad || 0) + 
                         (reporteCierre.categorias.Adicionales?.cantidad || 0)}
                      </p>
                      <p className="text-sm text-orange-600">
                        ${((reporteCierre.categorias.Picadas?.ingresos || 0) + 
                           (reporteCierre.categorias.Gallina?.ingresos || 0) + 
                           (reporteCierre.categorias.Sopas?.ingresos || 0) + 
                           (reporteCierre.categorias.Adicionales?.ingresos || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => setMostrarReporte(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmarCierreCaja}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Confirmar y Generar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
