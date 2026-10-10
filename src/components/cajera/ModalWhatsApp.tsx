import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Deja solo los 10 dígitos del celular (sin espacios, guiones ni el +57 si lo escribieron).
// Devuelve null si no es un celular de 10 dígitos.
const limpiarCelular = (numero: string) => {
  let digitos = numero.replace(/\D/g, '');
  if (digitos.length === 12 && digitos.startsWith('57')) digitos = digitos.slice(2);
  return digitos.length === 10 ? digitos : null;
};

// Número al que se envía el reporte del cierre de caja
export default function ModalWhatsApp({ numeroActual, onGuardar, onCerrar }: {
  numeroActual: string;
  onGuardar: (numero: string) => Promise<boolean>;
  onCerrar: () => void;
}) {
  const [numero, setNumero] = useState(numeroActual);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!numero.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }
    const limpio = limpiarCelular(numero);
    if (!limpio) {
      alert('Número de teléfono inválido. Escriba los 10 dígitos del celular, por ejemplo 3001234567.');
      return;
    }
    setGuardando(true);
    const guardado = await onGuardar(limpio);
    setGuardando(false);
    if (guardado) alert('✅ Número de WhatsApp guardado exitosamente');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-transparent w-full max-w-md bg-gradient-to-br from-slate-900/95 via-green-900/95 to-slate-900/95 backdrop-blur-xl border border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-green-400" />
              Configurar WhatsApp
            </CardTitle>
            <Button aria-label="Cerrar"
              onClick={onCerrar}
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
              inputMode="numeric"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej: 3001234567"
              className="bg-white/5 border-green-500/30 text-white"
            />
            <p className="text-gray-400 text-xs mt-2">
              💡 Ingrese el celular de 10 dígitos, sin espacios ni guiones. El código de país (+57) se agrega solo.
            </p>
          </div>

          <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <p className="text-blue-200 text-sm">
              ℹ️ Al cerrar la caja se descarga el reporte en PDF y aparece el botón para enviarlo por WhatsApp a este número.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={onCerrar}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={guardar}
              disabled={guardando}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
