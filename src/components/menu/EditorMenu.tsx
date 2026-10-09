import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mantenerActualizado } from '@/lib/datos';
import {
  cargarMenu, crearCategoria, actualizarCategoria, borrarCategoria,
  crearProducto, actualizarProducto, borrarProducto,
  type Categoria, type Producto, type Opcion
} from '@/lib/menu';

// Editor del menú: categorías, productos, precios, disponibilidad y opciones.
// Lo usan el dueño y la cajera; los meseros ven los cambios al instante.

const campo = 'bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-10';
const soloNumeros = (texto: string) => parseInt(texto.replace(/[^0-9]/g, '')) || 0;
const conPuntos = (n: number) => (n ? n.toLocaleString('es-CO') : '');

const avisarError = (error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error('Error guardando el menú:', mensaje);
  alert(`⚠️ No se pudo guardar: ${mensaje}`);
};

// ---------- Opciones de un producto ----------

function EditorOpciones({ opciones, onChange }: { opciones: Opcion[]; onChange: (o: Opcion[]) => void }) {
  const cambiar = (i: number, cambios: Partial<Opcion>) =>
    onChange(opciones.map((o, j) => (j === i ? { ...o, ...cambios } : o)));

  return (
    <div className="space-y-3">
      {opciones.map((opcion, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              value={opcion.nombre}
              onChange={e => cambiar(i, { nombre: e.target.value })}
              placeholder="Nombre, ej: Término"
              aria-label="Nombre de la opción"
              className={campo}
            />
            <Button
              onClick={() => onChange(opciones.filter((_, j) => j !== i))}
              variant="outline"
              size="sm"
              aria-label="Quitar opción"
              className="h-10 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <Input
            // Se guarda el texto tal cual mientras se escribe; se separa por comas
            value={opcion.valores.join(', ')}
            onChange={e => cambiar(i, { valores: e.target.value.split(',').map(v => v.trimStart()) })}
            placeholder="Valores separados por coma, ej: Jugoso, 3/4, Bien cocido"
            aria-label="Valores de la opción"
            className={campo}
          />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={opcion.varias} onChange={e => cambiar(i, { varias: e.target.checked })} />
            El mesero puede elegir varias
          </label>
        </div>
      ))}
      <Button
        onClick={() => onChange([...opciones, { nombre: '', varias: false, valores: [] }])}
        variant="outline"
        size="sm"
        className="bg-transparent border-white/20 text-gray-200 hover:bg-white/10"
      >
        <Plus className="w-4 h-4 mr-1" /> Agregar opción
      </Button>
    </div>
  );
}

// Limpia las opciones antes de guardar: sin grupos vacíos ni valores en blanco
const limpiarOpciones = (opciones: Opcion[]) =>
  opciones
    .map(o => ({ ...o, nombre: o.nombre.trim(), valores: o.valores.map(v => v.trim()).filter(Boolean) }))
    .filter(o => o.nombre && o.valores.length > 0);

// ---------- Fila de un producto ----------

function FilaProducto({ producto, onCambio }: { producto: Producto; onCambio: () => void }) {
  const [borrador, setBorrador] = useState(producto);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const modificado = JSON.stringify(borrador) !== JSON.stringify(producto);

  // Si otro dispositivo cambió el producto y aquí no hay cambios sin guardar, se muestra lo nuevo
  const [anterior, setAnterior] = useState(producto);
  if (anterior !== producto) {
    setAnterior(producto);
    if (JSON.stringify(borrador) === JSON.stringify(anterior)) setBorrador(producto);
  }

  const guardar = async (cambios: Partial<Producto> = borrador) => {
    if (!(cambios.nombre ?? borrador.nombre).trim()) {
      alert('El producto necesita un nombre');
      return;
    }
    setGuardando(true);
    try {
      const { nombre, precio, precio_libre, disponible, opciones } = { ...borrador, ...cambios };
      await actualizarProducto(producto.id, {
        nombre: nombre.trim(), precio, precio_libre, disponible, opciones: limpiarOpciones(opciones)
      });
      onCambio();
    } catch (error) {
      avisarError(error);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarDisponible = () => {
    const disponible = !borrador.disponible;
    setBorrador({ ...borrador, disponible });
    // La disponibilidad se guarda de inmediato (marcar "agotado" debe ser rápido)
    guardar({ ...producto, disponible });
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar "${producto.nombre}" del menú?`)) return;
    try {
      await borrarProducto(producto.id);
      onCambio();
    } catch (error) {
      avisarError(error);
    }
  };

  return (
    <div className={`rounded-lg border p-3 space-y-3 ${borrador.disponible ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/[0.02] opacity-70'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem_auto] gap-2 items-center">
        <Input
          value={borrador.nombre}
          onChange={e => setBorrador({ ...borrador, nombre: e.target.value })}
          aria-label="Nombre del producto"
          className={campo}
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <Input
            value={borrador.precio_libre ? '' : conPuntos(borrador.precio)}
            disabled={borrador.precio_libre}
            onChange={e => setBorrador({ ...borrador, precio: soloNumeros(e.target.value) })}
            placeholder={borrador.precio_libre ? 'Libre' : '0'}
            inputMode="numeric"
            aria-label="Precio"
            className={`${campo} pl-6`}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={cambiarDisponible}
            disabled={guardando}
            size="sm"
            className={`h-10 ${borrador.disponible ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
          >
            {borrador.disponible ? 'Disponible' : 'Agotado'}
          </Button>
          <Button
            onClick={() => setAbierto(!abierto)}
            variant="outline"
            size="sm"
            className="h-10 bg-transparent border-white/20 text-gray-200 hover:bg-white/10"
          >
            Opciones {borrador.opciones.length > 0 ? `(${borrador.opciones.length})` : ''}
            {abierto ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
          <Button
            onClick={eliminar}
            variant="outline"
            size="sm"
            aria-label={`Eliminar ${producto.nombre}`}
            className="h-10 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {abierto && (
        <div className="space-y-3 border-t border-white/10 pt-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={borrador.precio_libre}
              onChange={e => setBorrador({ ...borrador, precio_libre: e.target.checked })}
            />
            Precio libre: el mesero escribe el precio al pedir
          </label>
          <p className="text-xs text-gray-400">
            Las opciones son lo que el mesero elige al pedir, por ejemplo el término de la carne o el sabor del jugo.
          </p>
          <EditorOpciones opciones={borrador.opciones} onChange={opciones => setBorrador({ ...borrador, opciones })} />
        </div>
      )}

      {modificado && (
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => setBorrador(producto)}
            variant="outline"
            size="sm"
            className="bg-transparent border-white/20 text-gray-300 hover:bg-white/10"
          >
            Deshacer
          </Button>
          <Button
            onClick={() => guardar()}
            disabled={guardando}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            <Save className="w-4 h-4 mr-1" /> {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- Editor completo ----------

export default function EditorMenu() {
  const [menu, setMenu] = useState<Categoria[]>([]);
  const [error, setError] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio: 0 });
  const [nombreCategoria, setNombreCategoria] = useState({ id: 0, nombre: '', icono: '' });
  const recargarRef = React.useRef<() => void>(() => {});
  const recargar = () => recargarRef.current();

  useEffect(() => {
    let numeroCarga = 0;
    const cargar = async () => {
      const carga = ++numeroCarga;
      try {
        const datos = await cargarMenu();
        if (carga !== numeroCarga) return;
        setMenu(datos);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    recargarRef.current = cargar;
    return mantenerActualizado(['categorias', 'productos'], cargar, 30000);
  }, []);

  const categoria = menu.find(c => c.id === categoriaId) ?? menu[0];

  // Al cambiar de categoría se cargan su nombre e ícono en el formulario
  if (categoria && nombreCategoria.id !== categoria.id) {
    setNombreCategoria({ id: categoria.id, nombre: categoria.nombre, icono: categoria.icono });
  }

  const agregarCategoria = async () => {
    const nombre = prompt('Nombre de la nueva categoría (ej: Entradas, Postres):')?.trim();
    if (!nombre) return;
    try {
      await crearCategoria(nombre, '🍽️', (menu.at(-1)?.orden ?? 0) + 1);
      await recargarRef.current();
    } catch (e) {
      avisarError(e);
    }
  };

  const guardarCategoria = async () => {
    if (!categoria || !nombreCategoria.nombre.trim()) return;
    try {
      await actualizarCategoria(categoria.id, {
        nombre: nombreCategoria.nombre.trim(),
        icono: nombreCategoria.icono.trim() || '🍽️'
      });
      recargar();
    } catch (e) {
      avisarError(e);
    }
  };

  const eliminarCategoria = async () => {
    if (!categoria) return;
    const n = categoria.productos.length;
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"${n ? ` y sus ${n} productos` : ''}?`)) return;
    try {
      await borrarCategoria(categoria.id);
      setCategoriaId(null);
      recargar();
    } catch (e) {
      avisarError(e);
    }
  };

  const agregarProducto = async () => {
    if (!categoria) return;
    const nombre = nuevoProducto.nombre.trim();
    if (!nombre) {
      alert('Escriba el nombre del producto');
      return;
    }
    try {
      await crearProducto({
        categoria_id: categoria.id,
        nombre,
        precio: nuevoProducto.precio,
        precio_libre: false,
        disponible: true,
        orden: (categoria.productos.at(-1)?.orden ?? 0) + 1,
        opciones: []
      });
      setNuevoProducto({ nombre: '', precio: 0 });
      recargar();
    } catch (e) {
      avisarError(e);
    }
  };

  const categoriaModificada = categoria && (nombreCategoria.nombre !== categoria.nombre || nombreCategoria.icono !== categoria.icono);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-white text-lg">Menú y precios</CardTitle>
        <p className="text-gray-400 text-sm">Los cambios se ven al instante en los celulares de los meseros.</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
        {error && <p className="text-red-300 text-sm">{error}</p>}

        {/* Categorías */}
        <div className="flex flex-wrap gap-2">
          {menu.map(c => (
            <Button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              size="sm"
              className={categoria?.id === c.id ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold' : 'bg-white/10 hover:bg-white/20 text-gray-200'}
            >
              <span className="mr-1">{c.icono}</span>{c.nombre}
              <span className="ml-1 opacity-70">({c.productos.length})</span>
            </Button>
          ))}
          <Button
            onClick={agregarCategoria}
            size="sm"
            variant="outline"
            className="bg-transparent border-dashed border-white/30 text-gray-200 hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-1" /> Nueva categoría
          </Button>
        </div>

        {!categoria && !error && (
          <p className="text-gray-400 text-sm">Todavía no hay categorías. Cree la primera con "Nueva categoría".</p>
        )}

        {categoria && (
          <>
            {/* Datos de la categoría */}
            <div className="grid grid-cols-[4rem_1fr] sm:grid-cols-[4rem_1fr_auto] gap-2 items-center">
              <Input
                value={nombreCategoria.icono}
                onChange={e => setNombreCategoria({ ...nombreCategoria, icono: e.target.value })}
                aria-label="Ícono de la categoría"
                className={`${campo} text-center text-xl`}
              />
              <Input
                value={nombreCategoria.nombre}
                onChange={e => setNombreCategoria({ ...nombreCategoria, nombre: e.target.value })}
                aria-label="Nombre de la categoría"
                className={campo}
              />
              <div className="flex gap-2 col-span-2 sm:col-span-1">
                {categoriaModificada && (
                  <Button onClick={guardarCategoria} size="sm" className="h-10 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                    <Save className="w-4 h-4 mr-1" /> Guardar
                  </Button>
                )}
                <Button
                  onClick={eliminarCategoria}
                  variant="outline"
                  size="sm"
                  className="h-10 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar categoría
                </Button>
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-2">
              {categoria.productos.map(p => (
                <FilaProducto key={p.id} producto={p} onCambio={recargar} />
              ))}
              {categoria.productos.length === 0 && (
                <p className="text-gray-400 text-sm">Esta categoría no tiene productos.</p>
              )}
            </div>

            {/* Nuevo producto */}
            <div className="rounded-lg border border-dashed border-white/20 p-3">
              <p className="text-gray-300 text-sm font-medium mb-2">Agregar producto a {categoria.nombre}</p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem_auto] gap-2">
                <Input
                  value={nuevoProducto.nombre}
                  onChange={e => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && agregarProducto()}
                  placeholder="Nombre, ej: Bandeja paisa"
                  aria-label="Nombre del nuevo producto"
                  className={campo}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    value={conPuntos(nuevoProducto.precio)}
                    onChange={e => setNuevoProducto({ ...nuevoProducto, precio: soloNumeros(e.target.value) })}
                    onKeyDown={e => e.key === 'Enter' && agregarProducto()}
                    placeholder="Precio"
                    inputMode="numeric"
                    aria-label="Precio del nuevo producto"
                    className={`${campo} pl-6`}
                  />
                </div>
                <Button onClick={agregarProducto} className="h-10 bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
