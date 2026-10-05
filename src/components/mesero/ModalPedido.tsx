import { useState } from 'react';
import { UtensilsCrossed, X, Trash2, Plus, Minus, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MENU_DATA } from '@/data/menu';

export default function ModalPedido({ pisoActual, mesaSeleccionada, mesas, setMesas, onCerrar, onAbrirCobro, user, saboresSopas, precioSopas }) {
  const mesaKey = `${pisoActual}-${mesaSeleccionada}`;
  const mesaData = mesas[mesaKey] || { pedidos: [], total: 0, mesero: user.name };
  const [pedidos, setPedidos] = useState(mesaData.pedidos || []);
  const [categoriaActual, setCategoriaActual] = useState('picadas');
  
  // Estados para picadas
  const [picadaConfig, setPicadaConfig] = useState({
    size: '',
    carnes: [],
    termino: '',
    precio: ''
  });
  
  // Estados para otros productos
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [terminoSeleccionado, setTerminoSeleccionado] = useState('');
  const [saborSeleccionado, setSaborSeleccionado] = useState('');
  const [categoriaBebidasActual, setCategoriaBebidasActual] = useState('');
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState('');
  const [adicionalSeleccionado, setAdicionalSeleccionado] = useState('');

  const calcularTotal = (listaPedidos) => {
    return listaPedidos.reduce((total, pedido) => {
      const precio = pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem;
      return total + (precio * pedido.cantidad);
    }, 0);
  };

  const agregarPedido = (nuevoPedido) => {
    // Crear una clave única para identificar productos iguales
    const claveProducto = nuevoPedido.tipo === 'picada' 
      ? `${nuevoPedido.tipo}-${nuevoPedido.size}-${nuevoPedido.carnes?.sort().join(',')}-${nuevoPedido.termino}`
      : `${nuevoPedido.tipo}-${nuevoPedido.nombre}`;
    
    // Buscar si ya existe el mismo producto
    const productoExistente = pedidos.find(p => {
      const claveExistente = p.tipo === 'picada'
        ? `${p.tipo}-${p.size}-${p.carnes?.sort().join(',')}-${p.termino}`
        : `${p.tipo}-${p.nombre}`;
      return claveExistente === claveProducto;
    });
    
    if (productoExistente) {
      // Si existe, incrementar la cantidad
      const nuevosPedidos = pedidos.map(p => 
        p.id === productoExistente.id 
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      );
      setPedidos(nuevosPedidos);
    } else {
      // Si no existe, agregar como nuevo
      const pedidoConId = { ...nuevoPedido, id: Date.now(), cantidad: 1 };
      const nuevosPedidos = [...pedidos, pedidoConId];
      setPedidos(nuevosPedidos);
    }
    
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setPicadaConfig({ size: '', carnes: [], termino: '', precio: '' });
    setProductoSeleccionado(null);
    setTerminoSeleccionado('');
    setSaborSeleccionado('');
    // NO limpiar categoriaBebidasActual y bebidaSeleccionada para mantener la categoría abierta
    setAdicionalSeleccionado('');
  };

  const eliminarPedido = (id) => {
    setPedidos(pedidos.filter(p => p.id !== id));
  };

  const cambiarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setPedidos(pedidos.map(p => p.id === id ? { ...p, cantidad: nuevaCantidad } : p));
  };

  const guardarPedido = () => {
    const total = calcularTotal(pedidos);
    const nuevasMesas = {
      ...mesas,
      [mesaKey]: {
        pedidos,
        total,
        mesero: user.name,
        fechaCreacion: mesaData.fechaCreacion || new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      }
    };
    setMesas(nuevasMesas);
    onCerrar();
  };

  const manejarPicada = () => {
    if (!picadaConfig.size || picadaConfig.carnes.length === 0 || !picadaConfig.termino || !picadaConfig.precio) {
      alert('Complete todos los campos de la picada');
      return;
    }
    agregarPedido({
      tipo: 'picada',
      size: picadaConfig.size,
      carnes: picadaConfig.carnes,
      termino: picadaConfig.termino,
      precio: picadaConfig.precio
    });
  };

  const manejarGallina = () => {
    if (!productoSeleccionado || !terminoSeleccionado) {
      alert('Seleccione producto y término');
      return;
    }
    agregarPedido({
      tipo: 'gallina',
      nombre: productoSeleccionado.name,
      termino: terminoSeleccionado,
      precioItem: productoSeleccionado.price
    });
  };

  const manejarSopa = () => {
    if (!saborSeleccionado) {
      alert('Seleccione un sabor');
      return;
    }
    agregarPedido({
      tipo: 'sopa',
      nombre: saborSeleccionado,
      precioItem: precioSopas
    });
  };

  const manejarBebida = () => {
    if (!bebidaSeleccionada) {
      alert('Seleccione una bebida');
      return;
    }
    const bebida = MENU_DATA.bebidas[categoriaBebidasActual].find(b => b.name === bebidaSeleccionada);
    agregarPedido({
      tipo: 'bebida',
      nombre: bebidaSeleccionada,
      categoria: categoriaBebidasActual,
      precioItem: bebida.price
    });
  };

  const manejarAdicional = () => {
    if (!adicionalSeleccionado) {
      alert('Seleccione un adicional');
      return;
    }
    const adicional = MENU_DATA.adicionales.find(a => a.name === adicionalSeleccionado);
    agregarPedido({
      tipo: 'adicional',
      nombre: adicionalSeleccionado,
      precioItem: adicional.price
    });
  };

  const toggleCarne = (carne) => {
    const nuevasCarnes = picadaConfig.carnes.includes(carne)
      ? picadaConfig.carnes.filter(c => c !== carne)
      : [...picadaConfig.carnes, carne];
    setPicadaConfig({ ...picadaConfig, carnes: nuevasCarnes });
  };

  const categorias = [
    { id: 'picadas', nombre: 'Picadas', icono: '🥩', color: 'from-red-500 to-red-600' },
    { id: 'gallina', nombre: 'Gallina', icono: '🐔', color: 'from-yellow-500 to-orange-500' },
    { id: 'sopas', nombre: 'Sopas', icono: '🍲', color: 'from-green-500 to-green-600' },
    { id: 'bebidas', nombre: 'Bebidas', icono: '🥤', color: 'from-blue-500 to-blue-600' },
    { id: 'adicionales', nombre: 'Adicionales', icono: '🍟', color: 'from-purple-500 to-purple-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start sm:items-center justify-center p-0 sm:p-4">
        <Card className="w-full sm:max-w-7xl min-h-screen sm:min-h-0 sm:max-h-[95vh] bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-xl border-0 sm:border border-red-500/30 shadow-2xl sm:rounded-lg rounded-none">
        {/* Header */}
        <CardHeader className="border-b border-red-500/30 bg-gradient-to-r from-red-600/20 to-red-800/20 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base sm:text-xl">Mesa {mesaSeleccionada}</CardTitle>
                <p className="text-red-300 text-xs sm:text-sm">Piso {pisoActual} • {user.name}</p>
              </div>
            </div>
            <Button
              onClick={onCerrar}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex flex-col lg:grid lg:grid-cols-3 min-h-[calc(100vh-60px)] sm:min-h-0 sm:h-[calc(95vh-120px)]">
            {/* Panel de Categorías */}
            <div className="lg:col-span-2 p-3 sm:p-6 overflow-y-auto flex-1 lg:border-r border-red-500/20">
              {/* Selector de Categorías */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
                {categorias.map((categoria) => (
                  <Button
                    key={categoria.id}
                    onClick={() => setCategoriaActual(categoria.id)}
                    className={`h-14 sm:h-20 flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 transition-all duration-300 transform hover:scale-105 ${
                      categoriaActual === categoria.id
                        ? `bg-gradient-to-br ${categoria.color} text-white shadow-lg`
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{categoria.icono}</span>
                    <span className="text-[10px] sm:text-xs font-medium">{categoria.nombre}</span>
                  </Button>
                ))}
              </div>

              {/* Contenido por Categoría */}
              <div className="space-y-3 sm:space-y-6">
                {categoriaActual === 'picadas' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🥩</span> Configurar Picada
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2 sm:mb-3">Tamaño</label>
                        <div className="grid grid-cols-2 gap-2">
                          {MENU_DATA.picadas.sizes.map((size) => (
                            <Button
                              key={size}
                              onClick={() => setPicadaConfig({...picadaConfig, size})}
                              variant={picadaConfig.size === size ? "default" : "outline"}
                              className={`h-10 sm:h-12 text-xs sm:text-sm ${
                                picadaConfig.size === size 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                  : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {size}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2 sm:mb-3">Término</label>
                        <div className="grid grid-cols-3 gap-2">
                          {MENU_DATA.picadas.terminos.map((termino) => (
                            <Button
                              key={termino}
                              onClick={() => setPicadaConfig({...picadaConfig, termino})}
                              variant={picadaConfig.termino === termino ? "default" : "outline"}
                              className={`h-10 sm:h-12 text-[10px] sm:text-xs ${
                                picadaConfig.termino === termino 
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                                  : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {termino}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2 sm:mb-3">Carnes (Seleccione múltiples)</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {MENU_DATA.picadas.carnes.map((carne) => (
                          <Button
                            key={carne}
                            onClick={() => toggleCarne(carne)}
                            className={`h-10 sm:h-12 text-xs sm:text-sm transition-all duration-200 ${
                              picadaConfig.carnes.includes(carne)
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {carne}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2">Precio</label>
                        <Input
                          type="text"
                          value={picadaConfig.precio ? parseInt(picadaConfig.precio).toLocaleString() : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setPicadaConfig({...picadaConfig, precio: value});
                          }}
                          placeholder="Ej: 25.000"
                          className="bg-white/5 border-red-500/30 text-white h-10 sm:h-12 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={manejarPicada}
                          className="w-full h-10 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {categoriaActual === 'gallina' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🐔</span> Productos de Gallina
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      {MENU_DATA.gallina.productos.map((producto) => (
                        <Button
                          key={producto.name}
                          onClick={() => {
                            agregarPedido({
                              tipo: 'gallina',
                              nombre: producto.name,
                              termino: 'Jugoso',
                              precioItem: producto.price
                            });
                          }}
                          className="h-12 sm:h-16 flex justify-between items-center p-3 sm:p-4 text-left bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                        >
                          <span className="font-medium">{producto.name}</span>
                          <span className="text-green-400 font-bold">${producto.price.toLocaleString()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {categoriaActual === 'sopas' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🍲</span> Sopas - ${precioSopas.toLocaleString()}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {saboresSopas.map((sabor) => (
                        <Button
                          key={sabor}
                          onClick={() => {
                            agregarPedido({
                              tipo: 'sopa',
                              nombre: sabor,
                              precioItem: precioSopas
                            });
                          }}
                          className="h-12 sm:h-14 text-left p-3 sm:p-4 bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                        >
                          {sabor}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {categoriaActual === 'bebidas' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🥤</span> Bebidas
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {Object.keys(MENU_DATA.bebidas).map((categoria) => (
                        <div key={categoria}>
                          <Button
                            onClick={() => {
                              setCategoriaBebidasActual(categoria === categoriaBebidasActual ? '' : categoria);
                              setBebidaSeleccionada('');
                            }}
                            className={`w-full h-10 sm:h-12 mb-2 sm:mb-3 text-left text-xs sm:text-sm ${
                              categoriaBebidasActual === categoria
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {categoria}
                          </Button>
                          
                          {categoriaBebidasActual === categoria && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2 sm:ml-4">
                              {MENU_DATA.bebidas[categoria].map((bebida) => (
                                <Button
                                  key={bebida.name}
                                  onClick={() => {
                                    agregarPedido({
                                      tipo: 'bebida',
                                      nombre: bebida.name,
                                      categoria: categoria,
                                      precioItem: bebida.price
                                    });
                                  }}
                                  className="h-10 sm:h-12 flex justify-between items-center p-2 sm:p-3 text-xs sm:text-sm bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-500 hover:text-white transition-all duration-200"
                                >
                                  <span>{bebida.name}</span>
                                  <span className="text-green-400 font-bold">${bebida.price.toLocaleString()}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {categoriaActual === 'adicionales' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🍟</span> Adicionales
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {MENU_DATA.adicionales.map((adicional) => (
                        <Button
                          key={adicional.name}
                          onClick={() => {
                            agregarPedido({
                              tipo: 'adicional',
                              nombre: adicional.name,
                              precioItem: adicional.price
                            });
                          }}
                          className="h-12 sm:h-14 flex justify-between items-center p-3 sm:p-4 bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-600 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                        >
                          <span>{adicional.name}</span>
                          <span className="text-green-400 font-bold">${adicional.price.toLocaleString()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de Pedido */}
            <div className="p-3 sm:p-6 bg-gradient-to-b from-slate-800/50 to-slate-900/50 flex-shrink-0 border-t lg:border-t-0 border-red-500/20">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Pedido Actual</h3>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                    {pedidos.length} items
                  </Badge>
                </div>

                <div className="space-y-2 sm:space-y-3 max-h-[30vh] sm:max-h-96 overflow-y-auto">
                  {pedidos.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <UtensilsCrossed className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2 sm:mb-3" />
                      <p className="text-gray-400 text-sm">No hay items</p>
                    </div>
                  ) : (
                    pedidos.map((pedido) => (
                      <div key={pedido.id} className="bg-white/5 rounded-lg p-2 sm:p-3 border border-red-500/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">
                              {pedido.tipo === 'picada' 
                                ? `Picada ${pedido.size}` 
                                : pedido.nombre
                              }
                            </p>
                            {pedido.tipo === 'picada' && (
                              <p className="text-gray-400 text-xs">
                                {pedido.carnes?.join(', ')} • {pedido.termino}
                              </p>
                            )}
                            {pedido.termino && pedido.tipo !== 'picada' && (
                              <p className="text-gray-400 text-xs">Término: {pedido.termino}</p>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => eliminarPedido(pedido.id)}
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => cambiarCantidad(pedido.id, pedido.cantidad - 1)}
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 border-red-500/50 text-red-400"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            
                            <span className="text-white font-medium w-8 text-center">
                              {pedido.cantidad}
                            </span>
                            
                            <Button
                              onClick={() => cambiarCantidad(pedido.id, pedido.cantidad + 1)}
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 border-green-500/50 text-green-400"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <p className="text-green-400 font-bold text-sm">
                            ${((pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem) * pedido.cantidad).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="bg-red-500/20" />

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30">
                    <span className="text-base sm:text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-400">
                      ${calcularTotal(pedidos).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <Button
                      onClick={guardarPedido}
                      className="h-10 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Guardar Pedido
                    </Button>
                    
                    {pedidos.length > 0 && (
                      <Button
                        onClick={() => {
                          const total = calcularTotal(pedidos);
                          const nuevasMesas = {
                            ...mesas,
                            [mesaKey]: {
                              pedidos,
                              total,
                              mesero: user.name,
                              fechaCreacion: mesaData.fechaCreacion || new Date().toISOString(),
                              fechaActualizacion: new Date().toISOString()
                            }
                          };
                          setMesas(nuevasMesas);
                          onAbrirCobro();
                        }}
                        className="h-10 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium text-sm sm:text-base"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Guardar y Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
