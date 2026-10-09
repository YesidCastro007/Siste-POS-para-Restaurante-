import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cargarMesas, mantenerActualizado } from '@/lib/datos';
import { cargarZonas, guardarZonas, type Zona } from '@/lib/menu';

// Editor de zonas (pisos, terraza, barra...) y cuántas mesas tiene cada una.

const campo = 'bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-10';

export default function EditorZonas() {
  const [guardadas, setGuardadas] = useState<Zona[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [ocupadas, setOcupadas] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const modificado = JSON.stringify(zonas) !== JSON.stringify(guardadas);

  useEffect(() => {
    let numeroCarga = 0;
    const cargar = async () => {
      const carga = ++numeroCarga;
      try {
        const [z, mesas] = await Promise.all([cargarZonas(), cargarMesas()]);
        if (carga !== numeroCarga) return;
        setGuardadas(anteriores => {
          // Si no hay cambios sin guardar, se muestra lo último guardado
          setZonas(actuales => (JSON.stringify(actuales) === JSON.stringify(anteriores) ? z : actuales));
          return z;
        });
        setOcupadas(Object.entries(mesas)
          .filter(([, m]) => ((m as { pedidos?: unknown[] })?.pedidos?.length ?? 0) > 0)
          .map(([key]) => key));
      } catch (e) {
        console.error('Error cargando mesas:', e instanceof Error ? e.message : e);
      }
    };
    return mantenerActualizado(['config', 'mesas'], cargar, 30000);
  }, []);

  const cambiar = (numero: number, cambios: Partial<Zona>) =>
    setZonas(zonas.map(z => (z.numero === numero ? { ...z, ...cambios } : z)));

  const agregar = () => {
    const numero = Math.max(0, ...zonas.map(z => z.numero)) + 1;
    setZonas([...zonas, { numero, nombre: `Zona ${numero}`, mesas: 10 }]);
  };

  // Guarda la lista de zonas. Devuelve true si se guardó.
  const guardar = async (lista: Zona[] = zonas): Promise<boolean> => {
    const limpias = lista.map(z => ({ ...z, nombre: z.nombre.trim() || `Zona ${z.numero}` }));
    if (limpias.length === 0) {
      alert('Debe haber al menos una zona');
      return false;
    }
    // No se puede quitar una mesa que tiene un pedido abierto
    const perdidas = ocupadas.filter(key => {
      const [numero, mesa] = key.split('-').map(Number);
      const zona = limpias.find(z => z.numero === numero);
      return !zona || mesa > zona.mesas;
    });
    if (perdidas.length > 0) {
      const nombres = perdidas.map(key => {
        const [numero, mesa] = key.split('-');
        const zona = guardadas.find(z => z.numero === Number(numero));
        return `Mesa ${mesa} de ${zona?.nombre ?? `zona ${numero}`}`;
      });
      alert(`No se puede guardar: estas mesas tienen pedidos abiertos.\n${nombres.join('\n')}\nCóbrelas o libérelas primero.`);
      return false;
    }
    setGuardando(true);
    try {
      await guardarZonas(limpias);
      setGuardadas(limpias);
      setZonas(limpias);
      return true;
    } catch (e) {
      alert(`⚠️ No se pudo guardar: ${e instanceof Error ? e.message : e}`);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Borrar una zona se guarda de una vez, para que los meseros dejen de verla enseguida.
  // Los demás cambios sin guardar (nombres, número de mesas) se conservan en pantalla.
  const eliminar = async (zona: Zona) => {
    const yaGuardada = guardadas.some(z => z.numero === zona.numero);
    if (!yaGuardada) {
      setZonas(zonas.filter(z => z.numero !== zona.numero));
      return;
    }
    if (!confirm(`¿Eliminar "${zona.nombre}"? Los meseros dejarán de verla.`)) return;
    const pendientes = zonas.filter(z => z.numero !== zona.numero);
    const ok = await guardar(guardadas.filter(z => z.numero !== zona.numero));
    if (ok) setZonas(pendientes);
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-white text-lg">Zonas y mesas</CardTitle>
        <p className="text-gray-400 text-sm">Por ejemplo: Piso 1, Terraza, Barra. Cada zona tiene sus mesas numeradas desde 1.</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
        {zonas.map(z => (
          <div key={z.numero} className="grid grid-cols-[1fr_6rem_auto] gap-2 items-center">
            <Input
              value={z.nombre}
              onChange={e => cambiar(z.numero, { nombre: e.target.value })}
              aria-label="Nombre de la zona"
              className={campo}
            />
            <div className="relative">
              <Input
                value={z.mesas || ''}
                onChange={e => cambiar(z.numero, { mesas: Math.min(200, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0) })}
                inputMode="numeric"
                aria-label={`Mesas de ${z.nombre}`}
                className={`${campo} pr-12`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">mesas</span>
            </div>
            <Button
              onClick={() => eliminar(z)}
              disabled={guardando}
              variant="outline"
              size="sm"
              aria-label={`Eliminar ${z.nombre}`}
              className="h-10 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 justify-between">
          <Button onClick={agregar} variant="outline" size="sm" className="bg-transparent border-dashed border-white/30 text-gray-200 hover:bg-white/10">
            <Plus className="w-4 h-4 mr-1" /> Agregar zona
          </Button>
          {modificado && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-amber-300 text-xs">Cambios sin guardar</span>
              <Button onClick={() => setZonas(guardadas)} variant="outline" size="sm" className="bg-transparent border-white/20 text-gray-300 hover:bg-white/10">
                Deshacer
              </Button>
              <Button onClick={() => guardar()} disabled={guardando} size="sm" className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold">
                <Save className="w-4 h-4 mr-1" /> {guardando ? 'Guardando…' : 'Guardar mesas'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
