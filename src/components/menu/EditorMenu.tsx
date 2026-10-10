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

// Cambios sin guardar, por producto y por categoría (solo los campos que se tocaron).
// Viven fuera de los componentes para no perderlos al cambiar de categoría o de sección,
// y como son solo los campos tocados, lo que otro dispositivo cambie en los demás se sigue viendo.
type CambiosProducto = Partial<Omit<Producto, 'id'>>;
type CambiosCategoria = Partial<Pick<Categoria, 'nombre' | 'icono'>>;
let pendientesProductos: Record<number, CambiosProducto> = {};
let pendientesCategorias: Record<number, CambiosCategoria> = {};

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Quita los campos que ya son iguales a lo guardado
const soloDistintos = <T extends object>(cambios: Partial<T>, guardado: T): Partial<T> =>
  Object.fromEntries(Object.entries(cambios).filter(([campo, valor]) => !igual(valor, guardado[campo]))) as Partial<T>;

// ---------- Opciones de un producto ----------

// Valores separados por coma. El texto se guarda tal cual mientras se escribe
// (así se puede borrar el espacio después de una coma); se separa en valores al cambiar.
function CampoValores({ valores, onChange }: { valores: string[]; onChange: (v: string[]) => void }) {
  const separar = (texto: string) => texto.split(',').map(v => v.trim());
  const [texto, setTexto] = useState(valores.join(', '));
  if (!igual(separar(texto), valores) && !igual(separar(texto).filter(Boolean), valores)) {
    setTexto(valores.join(', '));
  }
  return (
    <Input
      value={texto}
      onChange={e => {
        setTexto(e.target.value);
        onChange(separar(e.target.value));
      }}
      placeholder="Valores separados por coma, ej: Jugoso, 3/4, Bien cocido"
      aria-label="Valores de la opción"
      className={campo}
    />
  );
}

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
          <CampoValores valores={opcion.valores} onChange={valores => cambiar(i, { valores })} />
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

// Dos grupos con el mismo nombre se mezclarían al pedir
const nombreRepetido = (opciones: Opcion[]) => {
  const vistos = new Set<string>();
  return opciones.find(o => {
    const clave = o.nombre.toLowerCase();
    if (vistos.has(clave)) return true;
    vistos.add(clave);
    return false;
  })?.nombre;
};

// ---------- Fila de un producto ----------

function FilaProducto({ producto, cambios, onEditar, onDescartar, onCambio }: {
  producto: Producto;
  cambios: CambiosProducto;
  onEditar: (cambios: CambiosProducto) => void;
  onDescartar: (campos?: (keyof CambiosProducto)[]) => void;
  onCambio: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // Lo que se ve: lo guardado con los cambios de este dispositivo encima
  const borrador: Producto = { ...producto, ...cambios };
  const pendientes = soloDistintos(cambios, producto);
  const modificado = Object.keys(pendientes).length > 0;

  const guardar = async () => {
    const enviar: CambiosProducto = { ...pendientes };
    if (enviar.nombre !== undefined) {
      enviar.nombre = enviar.nombre.trim();
      if (!enviar.nombre) {
        alert('El producto necesita un nombre');
        return;
      }
    }
    if (enviar.opciones) {
      enviar.opciones = limpiarOpciones(enviar.opciones);
      const repetido = nombreRepetido(enviar.opciones);
      if (repetido) {
        alert(`Hay dos opciones llamadas "${repetido}". Cámbiele el nombre a una.`);
        return;
      }
    }
    setGuardando(true);
    try {
      await actualizarProducto(producto.id, enviar);
      onDescartar();
      onCambio();
    } catch (error) {
      avisarError(error);
    } finally {
      setGuardando(false);
    }
  };

  // La disponibilidad se guarda de inmediato (marcar "agotado" debe ser rápido) y solo ese dato
  const cambiarDisponible = async () => {
    const disponible = !borrador.disponible;
    setGuardando(true);
    try {
      await actualizarProducto(producto.id, { disponible });
      onDescartar(['disponible']);
      onCambio();
    } catch (error) {
      avisarError(error);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar "${producto.nombre}" del menú?`)) return;
    try {
      await borrarProducto(producto.id);
      onDescartar();
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
          onChange={e => onEditar({ nombre: e.target.value })}
          aria-label="Nombre del producto"
          className={campo}
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <Input
            value={borrador.precio_libre ? '' : conPuntos(borrador.precio)}
            disabled={borrador.precio_libre}
            onChange={e => onEditar({ precio: soloNumeros(e.target.value) })}
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
              onChange={e => onEditar({ precio_libre: e.target.checked })}
            />
            Precio libre: el mesero escribe el precio al pedir
          </label>
          <p className="text-xs text-gray-400">
            Las opciones son lo que el mesero elige al pedir, por ejemplo el término de la carne o el sabor del jugo.
          </p>
          <EditorOpciones opciones={borrador.opciones} onChange={opciones => onEditar({ opciones })} />
        </div>
      )}

      {modificado && (
        <div className="flex flex-wrap gap-2 justify-end items-center">
          <span className="text-amber-300 text-xs mr-auto">Cambios sin guardar</span>
          <Button
            onClick={() => onDescartar()}
            variant="outline"
            size="sm"
            className="bg-transparent border-white/20 text-gray-300 hover:bg-white/10"
          >
            Deshacer
          </Button>
          <Button
            onClick={guardar}
            disabled={guardando}
            size="sm"
            className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold"
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
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio: 0 });
  const [agregando, setAgregando] = useState(false);
  const [cambiosProductos, setCambiosProductos] = useState(pendientesProductos);
  const [cambiosCategorias, setCambiosCategorias] = useState(pendientesCategorias);
  const precioNuevoRef = React.useRef<HTMLInputElement>(null);
  const recargarRef = React.useRef<() => Promise<void>>(async () => {});
  const recargar = () => recargarRef.current();

  useEffect(() => {
    let numeroCarga = 0;
    const cargar = async () => {
      const carga = ++numeroCarga;
      try {
        const datos = await cargarMenu();
        if (carga !== numeroCarga) return;
        setMenu(datos);
        setCargado(true);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    recargarRef.current = cargar;
    return mantenerActualizado(['categorias', 'productos'], cargar, 30000);
  }, []);

  const editarProducto = (id: number, cambios: CambiosProducto) => setCambiosProductos(anteriores => {
    pendientesProductos = { ...anteriores, [id]: { ...anteriores[id], ...cambios } };
    return pendientesProductos;
  });

  const descartarProducto = (id: number, campos?: (keyof CambiosProducto)[]) => setCambiosProductos(anteriores => {
    const restantes = { ...anteriores[id] };
    (campos ?? (Object.keys(restantes) as (keyof CambiosProducto)[])).forEach(campo => delete restantes[campo]);
    const nuevos = { ...anteriores };
    if (Object.keys(restantes).length > 0) nuevos[id] = restantes;
    else delete nuevos[id];
    pendientesProductos = nuevos;
    return nuevos;
  });

  const editarCategoria = (id: number, cambios: CambiosCategoria) => setCambiosCategorias(anteriores => {
    pendientesCategorias = { ...anteriores, [id]: { ...anteriores[id], ...cambios } };
    return pendientesCategorias;
  });

  const descartarCategoria = (id: number) => setCambiosCategorias(anteriores => {
    const nuevos = { ...anteriores };
    delete nuevos[id];
    pendientesCategorias = nuevos;
    return nuevos;
  });

  const categoria = menu.find(c => c.id === categoriaId) ?? menu[0];
  // Nombre e ícono de la categoría: lo guardado con lo que se esté editando encima
  const formCategoria = categoria ? { nombre: categoria.nombre, icono: categoria.icono, ...cambiosCategorias[categoria.id] } : null;
  const categoriaModificada = !!categoria && Object.keys(soloDistintos(cambiosCategorias[categoria.id] ?? {}, categoria)).length > 0;

  const agregarCategoria = async () => {
    if (agregando) return;
    const nombre = prompt('Nombre de la nueva categoría (ej: Entradas, Postres):')?.trim();
    if (!nombre) return;
    setAgregando(true);
    try {
      await crearCategoria(nombre, '🍽️', (menu.at(-1)?.orden ?? 0) + 1);
      await recargar();
    } catch (e) {
      avisarError(e);
    } finally {
      setAgregando(false);
    }
  };

  const guardarCategoria = async () => {
    if (!categoria || !formCategoria) return;
    if (!formCategoria.nombre.trim()) {
      alert('La categoría necesita un nombre');
      return;
    }
    try {
      await actualizarCategoria(categoria.id, {
        nombre: formCategoria.nombre.trim(),
        icono: formCategoria.icono.trim() || '🍽️'
      });
      descartarCategoria(categoria.id);
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
      descartarCategoria(categoria.id);
      setCategoriaId(null);
      recargar();
    } catch (e) {
      avisarError(e);
    }
  };

  const agregarProducto = async () => {
    if (!categoria || agregando) return;
    const nombre = nuevoProducto.nombre.trim();
    if (!nombre) {
      alert('Escriba el nombre del producto');
      return;
    }
    if (nuevoProducto.precio === 0 && !confirm(`¿Agregar "${nombre}" con precio $0?\n\nSi el precio cambia en cada pedido, después márquelo como "Precio libre" en Opciones.`)) {
      precioNuevoRef.current?.focus();
      return;
    }
    setAgregando(true);
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
    } finally {
      setAgregando(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-white text-lg">Menú y precios</CardTitle>
        <p className="text-gray-400 text-sm">Los cambios se ven al instante en los celulares de los meseros.</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
        {error && <p className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-red-200 text-sm">{error}</p>}
        {!cargado && !error && <p className="text-gray-400 text-sm">Cargando menú…</p>}

        {/* Categorías */}
        {cargado && (
        <div className="flex flex-wrap gap-2">
          {menu.map(c => (
            <Button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              size="sm"
              className={categoria?.id === c.id ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold' : 'bg-white/10 hover:bg-white/20 text-gray-200'}
            >
              <span className="mr-1">{c.icono}</span>{c.nombre}
              <span className="ml-1 opacity-70">({c.productos.length})</span>
              {c.productos.some(p => Object.keys(soloDistintos(cambiosProductos[p.id] ?? {}, p)).length > 0) && (
                <span className="ml-1 w-2 h-2 rounded-full bg-amber-400" title="Tiene cambios sin guardar" />
              )}
            </Button>
          ))}
          <Button
            onClick={agregarCategoria}
            disabled={agregando}
            size="sm"
            variant="outline"
            className="bg-transparent border-dashed border-white/30 text-gray-200 hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-1" /> Nueva categoría
          </Button>
        </div>
        )}

        {cargado && !categoria && !error && (
          <p className="text-gray-400 text-sm">Todavía no hay categorías. Cree la primera con "Nueva categoría".</p>
        )}

        {categoria && formCategoria && (
          <>
            {/* Datos de la categoría */}
            <div className="grid grid-cols-[4rem_1fr] sm:grid-cols-[4rem_1fr_auto] gap-2 items-center">
              <Input
                value={formCategoria.icono}
                onChange={e => editarCategoria(categoria.id, { icono: e.target.value })}
                aria-label="Ícono de la categoría"
                className={`${campo} text-center text-xl`}
              />
              <Input
                value={formCategoria.nombre}
                onChange={e => editarCategoria(categoria.id, { nombre: e.target.value })}
                aria-label="Nombre de la categoría"
                className={campo}
              />
              <div className="flex gap-2 col-span-2 sm:col-span-1">
                {categoriaModificada && (
                  <Button onClick={guardarCategoria} size="sm" className="h-10 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold">
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
                <FilaProducto
                  key={p.id}
                  producto={p}
                  cambios={cambiosProductos[p.id] ?? {}}
                  onEditar={cambios => editarProducto(p.id, cambios)}
                  onDescartar={campos => descartarProducto(p.id, campos)}
                  onCambio={recargar}
                />
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
                  // Enter en el nombre pasa al precio (antes creaba el producto a $0)
                  onKeyDown={e => e.key === 'Enter' && precioNuevoRef.current?.focus()}
                  placeholder="Nombre, ej: Bandeja paisa"
                  aria-label="Nombre del nuevo producto"
                  className={campo}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    ref={precioNuevoRef}
                    value={conPuntos(nuevoProducto.precio)}
                    onChange={e => setNuevoProducto({ ...nuevoProducto, precio: soloNumeros(e.target.value) })}
                    onKeyDown={e => e.key === 'Enter' && agregarProducto()}
                    placeholder="Precio"
                    inputMode="numeric"
                    aria-label="Precio del nuevo producto"
                    className={`${campo} pl-6`}
                  />
                </div>
                <Button onClick={agregarProducto} disabled={agregando} className="h-10 bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> {agregando ? 'Agregando…' : 'Agregar'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
