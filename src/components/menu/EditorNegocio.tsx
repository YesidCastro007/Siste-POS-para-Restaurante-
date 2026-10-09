import { useEffect, useState } from 'react';
import { Save, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cargarNombreNegocio, guardarNombreNegocio } from '@/lib/menu';

// Nombre del restaurante: aparece junto a SHADOW en los encabezados y en los reportes de caja
export default function EditorNegocio() {
  const [guardado, setGuardado] = useState('');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarNombreNegocio()
      .then(n => { setGuardado(n); setNombre(n); })
      .catch(e => console.error('Error cargando el nombre del negocio:', e.message));
  }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarNombreNegocio(nombre);
      setGuardado(nombre.trim());
      setNombre(nombre.trim());
    } catch (e) {
      alert(`⚠️ No se pudo guardar: ${e instanceof Error ? e.message : e}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4 sm:p-6 space-y-2">
        <label htmlFor="nombre-negocio" className="flex items-center gap-2 text-white font-semibold">
          <Store className="w-5 h-5 text-cyan-300" /> Nombre del negocio
        </label>
        <p className="text-gray-400 text-sm">Aparece en los encabezados de la app y en el reporte de cierre de caja.</p>
        <div className="flex gap-2">
          <Input
            id="nombre-negocio"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
            placeholder="Ej: Restaurante El Fogón"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-10"
          />
          {nombre.trim() !== guardado && (
            <Button onClick={guardar} disabled={guardando} className="h-10 boton-marca">
              <Save className="w-4 h-4 mr-1" /> {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
