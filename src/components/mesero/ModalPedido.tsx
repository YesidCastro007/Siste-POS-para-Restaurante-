import { useEffect, useState } from 'react';
import { UtensilsCrossed, X, Trash2, Plus, Minus, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Categoria, Producto } from '@/lib/menu';
import { type ItemPedido, type Mesa, nombreItem, detalleItem, subtotal, totalPedidos } from '@/lib/pedidos';
import { pesos, miles } from '@/lib/formato';

// Colores de las categorías, en orden
const COLORES = [
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-orange-500',
  'from-green-500 to-green-600',
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-teal-500 to-teal-600',
  'from-cyan-500 to-blue-600'
];

type Elegidas = Record<string, string | string[]>;

// Producto que necesita que el mesero escoja algo antes de agregarlo
const necesitaConfigurar = (p: Producto) => p.precio_libre || p.opciones.length > 0;

export default function ModalPedido({ zona, mesaSeleccionada, mesas, guardarMesa, onCerrar, onAbrirCobro, user, menu }: {
  zona: { numero: number; nombre: string };
  mesaSeleccionada: number;
  mesas: Record<string, Mesa>;
  guardarMesa: (mesaKey: string, mesa: Mesa) => Promise<boolean>;
  onCerrar: () => void;
  onAbrirCobro: () => void;
  user: { id?: string; name: string };
  menu: Categoria[];
}) {
  const mesaKey = `${zona.numero}-${mesaSeleccionada}`;
  // Pedido de la mesa tal como está guardado (se actualiza cuando otro dispositivo lo cambia)
  const pedidosGuardados = JSON.stringify(mesas[mesaKey]?.pedidos || []);
  const [pedidos, setPedidos] = useState<ItemPedido[]>(() => JSON.parse(pedidosGuardados));
  // Pedido guardado en el momento en que se empezó a editar
  const [base, setBase] = useState(pedidosGuardados);
  const hayCambios = JSON.stringify(pedidos) !== base;
  const [guardando, setGuardando] = useState(false);

  // Mientras el mesero no haya cambiado nada, se muestra lo último que hay guardado en la mesa
  useEffect(() => {
    if (hayCambios || pedidosGuardados === base) return;
    setPedidos(JSON.parse(pedidosGuardados));
    setBase(pedidosGuardados);
  }, [hayCambios, pedidosGuardados, base]);

  // Se muestran todas las categorías, también las nuevas que aún no tienen productos
  const categorias = menu;
  const [categoriaId, setCategoriaId] = useState<number | null>(categorias[0]?.id ?? null);
  const categoriaActual = categorias.find(c => c.id === categoriaId) ?? categorias[0];

  // Producto que se está configurando (opciones y precio)
  const [configurando, setConfigurando] = useState<Producto | null>(null);
  const [elegidas, setElegidas] = useState<Elegidas>({});
  const [precioLibre, setPrecioLibre] = useState('');

  const agregarPedido = (nuevo: Omit<ItemPedido, 'id' | 'cantidad'>) => {
    // Productos iguales (mismo producto, opciones y precio) se suman en la misma línea
    const clave = (p: Omit<ItemPedido, 'id' | 'cantidad'>) =>
      JSON.stringify([p.productoId ?? p.tipo, p.nombre ?? p.size, p.opciones ?? null, p.precioItem ?? p.precio]);
    const existente = pedidos.find(p => clave(p) === clave(nuevo));
    if (existente) {
      setPedidos(pedidos.map(p => (p.id === existente.id ? { ...p, cantidad: p.cantidad + 1 } : p)));
    } else {
      setPedidos([...pedidos, { ...nuevo, id: Date.now(), cantidad: 1 }]);
    }
  };

  const elegirProducto = (producto: Producto, categoria: Categoria) => {
    if (!producto.disponible) return;
    if (!necesitaConfigurar(producto)) {
      agregarPedido({ productoId: producto.id, nombre: producto.nombre, categoria: categoria.nombre, precioItem: producto.precio });
      return;
    }
    setConfigurando(producto);
    setElegidas({});
    setPrecioLibre('');
  };

  const elegirValor = (opcion: { nombre: string; varias: boolean }, valor: string) => {
    if (!opcion.varias) {
      setElegidas({ ...elegidas, [opcion.nombre]: valor });
      return;
    }
    const actuales = (elegidas[opcion.nombre] as string[]) || [];
    setElegidas({
      ...elegidas,
      [opcion.nombre]: actuales.includes(valor) ? actuales.filter(v => v !== valor) : [...actuales, valor]
    });
  };

  const agregarConfigurado = () => {
    if (!configurando || !categoriaActual) return;
    const falta = configurando.opciones.find(o => {
      const v = elegidas[o.nombre];
      return o.valores.length > 0 && (!v || (Array.isArray(v) && v.length === 0));
    });
    if (falta) {
      alert(`Seleccione ${falta.nombre.toLowerCase()}`);
      return;
    }
    const precio = configurando.precio_libre ? parseInt(precioLibre) || 0 : configurando.precio;
    if (configurando.precio_libre && precio <= 0) {
      alert('Escriba el precio');
      return;
    }
    // Las opciones se guardan en el mismo orden en que están en el menú
    const opciones: Elegidas = {};
    configurando.opciones.forEach(o => {
      const v = elegidas[o.nombre];
      if (v) opciones[o.nombre] = Array.isArray(v) ? o.valores.filter(x => v.includes(x)) : v;
    });
    agregarPedido({
      productoId: configurando.id,
      nombre: configurando.nombre,
      categoria: categoriaActual.nombre,
      precioItem: precio,
      opciones
    });
    setConfigurando(null);
  };

  const eliminarPedido = (id: number) => {
    setPedidos(pedidos.filter(p => p.id !== id));
  };

  const cambiarCantidad = (id: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    setPedidos(pedidos.map(p => p.id === id ? { ...p, cantidad: nuevaCantidad } : p));
  };

  // Guarda el pedido en la mesa. Devuelve true si quedó guardado (o si no había nada que guardar).
  const guardarEnMesa = async () => {
    if (guardando) return false;
    const actual = mesas[mesaKey];
    if (!hayCambios || (pedidos.length === 0 && !actual)) return true;

    // Otro dispositivo cambió la mesa mientras este pedido estaba abierto
    if (JSON.stringify(actual?.pedidos || []) !== base) {
      const reemplazar = confirm(actual
        ? 'Mientras usted editaba, otro dispositivo cambió el pedido de esta mesa.\n\nAceptar: guardar su versión (reemplaza la otra).\nCancelar: ver el pedido actualizado.'
        : 'Mientras usted editaba, esta mesa se cobró o se liberó en otro dispositivo.\n\nAceptar: guardar este pedido como un pedido nuevo.\nCancelar: descartarlo.');
      if (!reemplazar) {
        setPedidos(actual?.pedidos || []);
        setBase(JSON.stringify(actual?.pedidos || []));
        return false;
      }
    }

    if (pedidos.length === 0 && !confirm('¿Dejar esta mesa sin productos? Quedará libre.')) return false;

    setGuardando(true);
    const guardado = await guardarMesa(mesaKey, {
      pedidos,
      total: totalPedidos(pedidos),
      // La mesa sigue siendo del mesero que la abrió, aunque otro le agregue productos
      mesero: actual?.mesero || user.name,
      meseroId: actual ? actual.meseroId : user.id,
      fechaCreacion: actual?.fechaCreacion || new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });
    setGuardando(false);
    if (guardado) setBase(JSON.stringify(pedidos));
    return guardado;
  };

  const guardarPedido = async () => {
    if (await guardarEnMesa()) onCerrar();
  };

  const guardarYCobrar = async () => {
    if (await guardarEnMesa()) onAbrirCobro();
  };

  const cerrar = () => {
    if (hayCambios && !confirm('Hay cambios sin guardar en este pedido. ¿Salir sin guardarlos?')) return;
    onCerrar();
  };

  const indiceColor = (categoria: Categoria) => categorias.findIndex(c => c.id === categoria.id) % COLORES.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start sm:items-center justify-center p-0 sm:p-4">
        <Card className="bg-transparent w-full sm:max-w-7xl min-h-screen sm:min-h-0 sm:max-h-[95vh] bg-gradient-to-br from-slate-900/95 via-[#0B1630]/95 to-slate-950/95 backdrop-blur-xl border-0 sm:border border-cyan-400/20 shadow-2xl sm:rounded-lg rounded-none">
        {/* Header */}
        <CardHeader className="border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-blue-700/10 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base sm:text-xl">Mesa {mesaSeleccionada}</CardTitle>
                <p className="text-cyan-300 text-xs sm:text-sm">{zona.nombre} • {user.name}</p>
              </div>
            </div>
            <Button aria-label="Cerrar"
              onClick={cerrar}
              disabled={guardando}
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
            <div className="lg:col-span-2 p-3 sm:p-6 overflow-y-auto flex-1 lg:border-r border-cyan-400/15">
              {categorias.length === 0 ? (
                <div className="text-center py-12">
                  <UtensilsCrossed className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300">El menú está vacío.</p>
                  <p className="text-gray-400 text-sm">El dueño o la cajera pueden agregar categorías y productos desde su panel, en Menú y mesas.</p>
                </div>
              ) : (
              <>
              {/* Selector de Categorías */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
                {categorias.map((categoria) => (
                  <Button
                    key={categoria.id}
                    onClick={() => { setCategoriaId(categoria.id); setConfigurando(null); }}
                    className={`h-14 sm:h-20 flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 transition-all duration-300 transform hover:scale-105 ${
                      categoriaActual?.id === categoria.id
                        ? `bg-gradient-to-br ${COLORES[indiceColor(categoria)]} text-white shadow-lg`
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-cyan-400/15'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{categoria.icono}</span>
                    <span className="text-[10px] sm:text-xs font-medium truncate max-w-full">{categoria.nombre}</span>
                  </Button>
                ))}
              </div>

              {/* Productos de la categoría */}
              {categoriaActual && !configurando && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                    <span className="text-xl sm:text-2xl mr-2">{categoriaActual.icono}</span> {categoriaActual.nombre}
                  </h3>
                  {categoriaActual.productos.length === 0 && (
                    <p className="text-gray-400 text-sm py-6 text-center">
                      Esta categoría todavía no tiene productos. El dueño o la cajera pueden agregarlos en Menú y mesas.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {categoriaActual.productos.map((producto) => (
                      <Button
                        key={producto.id}
                        disabled={!producto.disponible}
                        onClick={() => elegirProducto(producto, categoriaActual)}
                        className={`h-12 sm:h-14 flex justify-between items-center p-3 sm:p-4 text-left bg-white/5 border border-cyan-400/20 text-gray-300 hover:bg-white/15 hover:text-white transition-all duration-200 text-xs sm:text-sm disabled:opacity-40`}
                      >
                        <span className="font-medium truncate">{producto.nombre}</span>
                        <span className="text-green-400 font-bold ml-2 shrink-0">
                          {!producto.disponible ? 'Agotado' : producto.precio_libre ? 'Precio libre' : pesos(producto.precio)}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Configurar producto con opciones */}
              {configurando && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">{categoriaActual?.icono}</span> {configurando.nombre}
                    </h3>
                    <Button
                      onClick={() => setConfigurando(null)}
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      Volver
                    </Button>
                  </div>

                  {configurando.opciones.map((opcion) => (
                    <div key={opcion.nombre}>
                      <label className="block text-xs sm:text-sm font-medium text-cyan-300 mb-2 sm:mb-3">
                        {opcion.nombre}{opcion.varias ? ' (puede elegir varias)' : ''}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {opcion.valores.map((valor) => {
                          const v = elegidas[opcion.nombre];
                          const activo = Array.isArray(v) ? v.includes(valor) : v === valor;
                          return (
                            <Button
                              key={valor}
                              onClick={() => elegirValor(opcion, valor)}
                              className={`h-10 sm:h-12 text-xs sm:text-sm ${
                                activo
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                                  : 'bg-white/5 border border-cyan-400/20 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {valor}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {configurando.precio_libre ? (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-cyan-300 mb-2">Precio</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={precioLibre ? miles(parseInt(precioLibre)) : ''}
                          onChange={(e) => setPrecioLibre(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Ej: 25.000"
                          className="bg-white/5 border-cyan-400/20 text-white h-10 sm:h-12 text-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-end">
                        <p className="text-green-400 font-bold text-lg">{pesos(configurando.precio)}</p>
                      </div>
                    )}
                    <div className="flex items-end">
                      <Button
                        onClick={agregarConfigurado}
                        className="w-full h-10 sm:h-12 boton-marca text-white font-medium text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              </>
              )}
            </div>

            {/* Panel de Pedido */}
            <div className="p-3 sm:p-6 bg-gradient-to-b from-slate-800/50 to-slate-900/50 flex-shrink-0 border-t lg:border-t-0 border-cyan-400/15">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Pedido Actual</h3>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                    {pedidos.length} {pedidos.length === 1 ? 'producto' : 'productos'}
                  </Badge>
                </div>

                <div className="space-y-2 sm:space-y-3 max-h-[30vh] sm:max-h-96 overflow-y-auto">
                  {pedidos.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <UtensilsCrossed className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2 sm:mb-3" />
                      <p className="text-gray-400 text-sm">Todavía no hay productos</p>
                    </div>
                  ) : (
                    pedidos.map((pedido) => (
                      <div key={pedido.id} className="bg-white/5 rounded-lg p-2 sm:p-3 border border-cyan-400/15">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{nombreItem(pedido)}</p>
                            {detalleItem(pedido) && (
                              <p className="text-gray-400 text-xs">{detalleItem(pedido)}</p>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => eliminarPedido(pedido.id)}
                            variant="outline"
                            size="sm"
                            aria-label={`Quitar ${nombreItem(pedido)}`}
                            className="w-9 h-9 sm:w-8 sm:h-8 p-0 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => cambiarCantidad(pedido.id, pedido.cantidad - 1)}
                              variant="outline"
                              size="sm"
                              aria-label={`Uno menos de ${nombreItem(pedido)}`}
                              className="w-9 h-9 sm:w-8 sm:h-8 p-0 border-red-500/50 text-red-400"
                            >
                              <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
                            </Button>
                            
                            <span className="text-white font-medium w-8 text-center">
                              {pedido.cantidad}
                            </span>
                            
                            <Button
                              onClick={() => cambiarCantidad(pedido.id, pedido.cantidad + 1)}
                              variant="outline"
                              size="sm"
                              aria-label={`Uno más de ${nombreItem(pedido)}`}
                              className="w-9 h-9 sm:w-8 sm:h-8 p-0 border-green-500/50 text-green-400"
                            >
                              <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
                            </Button>
                          </div>
                          
                          <p className="text-green-400 font-bold text-sm">
                            {pesos(subtotal(pedido))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="bg-cyan-400/15" />

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30">
                    <span className="text-base sm:text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-400">
                      {pesos(totalPedidos(pedidos))}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <Button
                      onClick={guardarPedido}
                      disabled={guardando}
                      className="h-10 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {guardando ? 'Guardando…' : 'Guardar Pedido'}
                    </Button>
                    
                    {pedidos.length > 0 && (
                      <Button
                        onClick={guardarYCobrar}
                        disabled={guardando}
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
