import React, { useMemo, useState } from 'react';
import { LogOut, Crown, TrendingUp, Receipt, Calculator, UtensilsCrossed, Users, BarChart3, BookOpen } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cargarMesas, cargarVentas, mantenerActualizado, type Mesas, type Venta } from '@/lib/datos';
import EditorMenu from '@/components/menu/EditorMenu';
import EditorZonas from '@/components/menu/EditorZonas';
import { actualizarUsuario, cargarUsuarios, type Rol, type Usuario } from '@/lib/auth';
import {
  PERIODOS, inicioDelPeriodo, type Periodo, type Fila, filtrarPorPeriodo, resumen, porMesero, porMetodo,
  productosMasVendidos, ventasPorDia, formatoPesos
} from '@/lib/estadisticas';

const NOMBRE_ROL = { mesero: 'Mesero', cajera: 'Cajera', dueño: 'Dueño' };

const ordenes = (n: number) => `${n} ${n === 1 ? 'orden' : 'órdenes'}`;
const unidades = (n: number) => `${n} unid.`;

const diasDelGrafico = (periodo: Periodo) => {
  if (periodo === 'mes') return new Date().getDate();
  if (periodo === 'todo') return 30;
  return 7;
};

// Primer día que hace falta: el inicio del periodo o el primer día de la gráfica, el que sea antes
const desdeParaCargar = (periodo: Periodo): Date | null => {
  const inicio = inicioDelPeriodo(periodo);
  if (!inicio) return null;
  const hoy = new Date();
  const inicioGrafico = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (diasDelGrafico(periodo) - 1));
  return inicio < inicioGrafico ? inicio : inicioGrafico;
};

function Indicador({ titulo, valor, detalle, Icono }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-gray-300 text-xs sm:text-sm">{titulo}</p>
          <Icono className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </div>
        <p className="text-white text-2xl sm:text-3xl font-bold mt-2">{valor}</p>
        {detalle && <p className="text-gray-400 text-xs mt-1">{detalle}</p>}
      </CardContent>
    </Card>
  );
}

// Lista ordenada con una barra proporcional al total (un solo color: el dato es la magnitud)
function Ranking({ titulo, filas, contar, vacio }: { titulo: string; filas: Fila[]; contar: (n: number) => string; vacio: string }) {
  const maximo = Math.max(1, ...filas.map(f => f.total));
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="p-4 sm:p-5 pb-2">
        <CardTitle className="text-white text-base sm:text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-2">
        {filas.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">{vacio}</p>
        ) : (
          <ul className="space-y-3">
            {filas.map(fila => (
              <li key={fila.nombre} title={`${fila.nombre}: ${formatoPesos(fila.total)} · ${contar(fila.cantidad)}`}>
                <div className="flex justify-between text-sm mb-1 gap-2">
                  <span className="text-gray-200 truncate">{fila.nombre}</span>
                  <span className="text-white font-semibold whitespace-nowrap">{formatoPesos(fila.total)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(fila.total / maximo) * 100}%` }} />
                  </div>
                  <span className="text-gray-400 text-xs w-16 text-right">{contar(fila.cantidad)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Una persona del equipo. A meseros y cajeras el dueño les cambia el rol o los desactiva;
// los dueños (incluido uno mismo) solo se muestran.
function FilaUsuario({ usuario, editable, alCambiar }: { usuario: Usuario; editable: boolean; alCambiar: () => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (role: Rol, active: boolean) => {
    setGuardando(true);
    setError('');
    try {
      await actualizarUsuario(usuario.id, role, active);
      alCambiar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${usuario.active ? 'text-white' : 'text-gray-500 line-through'}`}>{usuario.name}</p>
          <p className="text-gray-400 text-xs truncate">{usuario.email}</p>
        </div>
        {editable ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex rounded-md bg-white/10 p-0.5">
              {(['mesero', 'cajera'] as Rol[]).map(rol => (
                <button
                  key={rol}
                  disabled={guardando || usuario.role === rol}
                  onClick={() => guardar(rol, usuario.active)}
                  className={`px-3 py-1 text-xs rounded ${usuario.role === rol ? 'bg-amber-500 text-slate-900 font-semibold' : 'text-gray-200 hover:bg-white/10'}`}
                >
                  {NOMBRE_ROL[rol]}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              disabled={guardando}
              onClick={() => guardar(usuario.role, !usuario.active)}
              className={usuario.active ? 'h-7 text-xs bg-transparent border border-red-500 text-red-300 hover:bg-red-600 hover:text-white' : 'h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white'}
            >
              {usuario.active ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-100">{NOMBRE_ROL[usuario.role] ?? usuario.role}</span>
            {!usuario.active && <span className="text-xs px-2 py-1 rounded-full bg-red-600/30 text-red-100">Inactivo</span>}
          </div>
        )}
      </div>
      {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
    </div>
  );
}

function TooltipDia({ active, payload }: { active?: boolean; payload?: { payload: { etiqueta: string; total: number; ordenes: number } }[] }) {
  if (!active || !payload?.length) return null;
  const dia = payload[0].payload;
  return (
    <div className="rounded-md bg-slate-900 border border-white/20 px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-300">{dia.etiqueta}</p>
      <p className="text-white font-semibold">{formatoPesos(dia.total)}</p>
      <p className="text-gray-400 text-xs">{ordenes(dia.ordenes)}</p>
    </div>
  );
}

export default function DueñoDashboard({ user, onLogout }) {
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [seccion, setSeccion] = useState<'resumen' | 'menu' | 'usuarios'>('resumen');
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [mesas, setMesas] = useState<Mesas>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState('');
  const recargarRef = React.useRef<() => void>(() => {});
  const recargar = () => recargarRef.current();

  // Solo se descargan las ventas del periodo elegido y de los días de la gráfica
  const periodoRef = React.useRef(periodo);
  periodoRef.current = periodo;

  React.useEffect(() => {
    let numeroCarga = 0;
    const cargar = async () => {
      const carga = ++numeroCarga;
      try {
        const [ventasGuardadas, mesasGuardadas, perfiles] = await Promise.all([
          cargarVentas(desdeParaCargar(periodoRef.current)), cargarMesas(), cargarUsuarios()
        ]);
        if (carga !== numeroCarga) return;
        setVentas(ventasGuardadas);
        setMesas(mesasGuardadas);
        setUsuarios(perfiles);
        setError('');
      } catch (e) {
        console.error('Error cargando el panel:', e.message);
        setError('No se pudieron cargar los datos. Revise la conexión a internet.');
      }
    };
    recargarRef.current = cargar;
    return mantenerActualizado(['ventas', 'mesas', 'profiles'], cargar, 15000);
  }, []);

  const primeraCarga = React.useRef(true);
  React.useEffect(() => {
    if (primeraCarga.current) { primeraCarga.current = false; return; }
    recargar();
  }, [periodo]);

  const ventasDelPeriodo = useMemo(() => filtrarPorPeriodo(ventas, periodo), [ventas, periodo]);
  const totales = resumen(ventasDelPeriodo);
  const dias = useMemo(() => ventasPorDia(ventas, diasDelGrafico(periodo)), [ventas, periodo]);

  const mesasActivas = Object.values(mesas).filter((m: { pedidos?: unknown[] }) => (m?.pedidos?.length ?? 0) > 0) as { total?: number }[];
  const pendiente = mesasActivas.reduce((suma, m) => suma + (m.total || 0), 0);
  const nombrePeriodo = PERIODOS.find(p => p.id === periodo)?.nombre.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-red-900/40 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Santandereano SAS</h1>
              <p className="text-amber-400 text-xs sm:text-sm">Panel del Dueño</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-gray-400 text-xs">Dueño</p>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm" className="border-red-600 text-red-400 bg-transparent hover:bg-red-600 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {error && <p className="rounded-lg bg-red-600/20 border border-red-500 text-red-100 px-4 py-3 text-sm">{error}</p>}

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {([
            { id: 'resumen', nombre: 'Resumen', Icono: BarChart3 },
            { id: 'menu', nombre: 'Menú y mesas', Icono: BookOpen },
            { id: 'usuarios', nombre: 'Usuarios', Icono: Users }
          ] as const).map(s => (
            <Button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`h-14 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                seccion === s.id ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
              }`}
            >
              <s.Icono className="w-5 h-5" />
              <span className="text-xs sm:text-sm">{s.nombre}</span>
            </Button>
          ))}
        </div>

        {seccion === 'menu' && (
          <>
            <EditorMenu />
            <EditorZonas />
          </>
        )}

        {seccion === 'resumen' && (
        <>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map(p => (
            <Button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={periodo === p.id ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold' : 'bg-white/10 hover:bg-white/20 text-gray-200'}
            >
              {p.nombre}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Indicador titulo="Total vendido" valor={formatoPesos(totales.total)} detalle={nombrePeriodo} Icono={TrendingUp} />
          <Indicador titulo="Órdenes" valor={totales.ordenes} detalle={nombrePeriodo} Icono={Receipt} />
          <Indicador titulo="Promedio por orden" valor={formatoPesos(totales.promedio)} detalle={nombrePeriodo} Icono={Calculator} />
          <Indicador titulo="Mesas activas ahora" valor={mesasActivas.length} detalle={`${formatoPesos(pendiente)} por cobrar`} Icono={UtensilsCrossed} />
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="p-4 sm:p-5 pb-0">
            <CardTitle className="text-white text-base sm:text-lg">Ventas por día</CardTitle>
            <p className="text-gray-400 text-xs">Últimos {dias.length} días</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dias} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="etiqueta" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={56}
                    tickFormatter={v => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)} />
                  <Tooltip content={<TooltipDia />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Ranking titulo="Ventas por mesero" filas={porMesero(ventasDelPeriodo)} contar={ordenes} vacio="Sin ventas en este periodo" />
          <Ranking titulo="Ventas por método de pago" filas={porMetodo(ventasDelPeriodo)} contar={ordenes} vacio="Sin ventas en este periodo" />
          <Ranking titulo="Productos más vendidos" filas={productosMasVendidos(ventasDelPeriodo)} contar={unidades} vacio="Sin ventas en este periodo" />
        </div>
        </>
        )}

        {seccion === 'usuarios' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-white text-base sm:text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-300" />
              Usuarios ({usuarios.length})
            </CardTitle>
            <p className="text-gray-400 text-xs">Elige el rol de cada persona. Quien esté desactivado no puede iniciar sesión.</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2">
            <div className="divide-y divide-white/10">
              {usuarios.map(u => (
                <FilaUsuario key={u.id} usuario={u} editable={u.role !== 'dueño' && u.id !== user.id} alCambiar={recargar} />
              ))}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
