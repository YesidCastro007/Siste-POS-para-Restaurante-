import { getUsuariosCache } from '@/lib/auth';

// Paleta de colores predefinidos para meseros (sin verde para evitar confusión con mesas disponibles)
export const MESERO_COLORS = {
  blue: {
    bg: 'bg-blue-600/30',
    border: 'border-blue-600',
    shadow: 'shadow-blue-600/20',
    text: 'text-blue-300',
    bgLight: 'bg-blue-600/10',
    borderLight: 'border-blue-600/50',
    shadowLight: 'shadow-blue-600/10',
    textLight: 'text-blue-400'
  },
  purple: {
    bg: 'bg-purple-600/30',
    border: 'border-purple-600',
    shadow: 'shadow-purple-600/20',
    text: 'text-purple-300',
    bgLight: 'bg-purple-600/10',
    borderLight: 'border-purple-600/50',
    shadowLight: 'shadow-purple-600/10',
    textLight: 'text-purple-400'
  },
  orange: {
    bg: 'bg-orange-600/30',
    border: 'border-orange-600',
    shadow: 'shadow-orange-600/20',
    text: 'text-orange-300',
    bgLight: 'bg-orange-600/10',
    borderLight: 'border-orange-600/50',
    shadowLight: 'shadow-orange-600/10',
    textLight: 'text-orange-400'
  },
  pink: {
    bg: 'bg-pink-600/30',
    border: 'border-pink-600',
    shadow: 'shadow-pink-600/20',
    text: 'text-pink-300',
    bgLight: 'bg-pink-600/10',
    borderLight: 'border-pink-600/50',
    shadowLight: 'shadow-pink-600/10',
    textLight: 'text-pink-400'
  },
  yellow: {
    bg: 'bg-yellow-600/30',
    border: 'border-yellow-600',
    shadow: 'shadow-yellow-600/20',
    text: 'text-yellow-300',
    bgLight: 'bg-yellow-600/10',
    borderLight: 'border-yellow-600/50',
    shadowLight: 'shadow-yellow-600/10',
    textLight: 'text-yellow-400'
  },
  indigo: {
    bg: 'bg-indigo-600/30',
    border: 'border-indigo-600',
    shadow: 'shadow-indigo-600/20',
    text: 'text-indigo-300',
    bgLight: 'bg-indigo-600/10',
    borderLight: 'border-indigo-600/50',
    shadowLight: 'shadow-indigo-600/10',
    textLight: 'text-indigo-400'
  },
  teal: {
    bg: 'bg-teal-600/30',
    border: 'border-teal-600',
    shadow: 'shadow-teal-600/20',
    text: 'text-teal-300',
    bgLight: 'bg-teal-600/10',
    borderLight: 'border-teal-600/50',
    shadowLight: 'shadow-teal-600/10',
    textLight: 'text-teal-400'
  },
  cyan: {
    bg: 'bg-cyan-600/30',
    border: 'border-cyan-600',
    shadow: 'shadow-cyan-600/20',
    text: 'text-cyan-300',
    bgLight: 'bg-cyan-600/10',
    borderLight: 'border-cyan-600/50',
    shadowLight: 'shadow-cyan-600/10',
    textLight: 'text-cyan-400'
  },
  rose: {
    bg: 'bg-rose-600/30',
    border: 'border-rose-600',
    shadow: 'shadow-rose-600/20',
    text: 'text-rose-300',
    bgLight: 'bg-rose-600/10',
    borderLight: 'border-rose-600/50',
    shadowLight: 'shadow-rose-600/10',
    textLight: 'text-rose-400'
  },
  amber: {
    bg: 'bg-amber-600/30',
    border: 'border-amber-600',
    shadow: 'shadow-amber-600/20',
    text: 'text-amber-300',
    bgLight: 'bg-amber-600/10',
    borderLight: 'border-amber-600/50',
    shadowLight: 'shadow-amber-600/10',
    textLight: 'text-amber-400'
  }
};

export type ClaveColor = keyof typeof MESERO_COLORS;
const CLAVES = Object.keys(MESERO_COLORS) as ClaveColor[];

// Cada mesero tiene siempre el mismo color, en el panel del mesero y en las mesas de la caja:
// el de su posición en la lista de meseros, o uno sacado de su nombre si no está en la lista
export const claveColorDelMesero = (nombre: string): ClaveColor => {
  const meseros = getUsuariosCache().filter(u => u.role === 'mesero');
  const indice = meseros.findIndex(m => m.name === nombre);
  if (indice !== -1) return CLAVES[indice % CLAVES.length];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CLAVES[Math.abs(hash) % CLAVES.length];
};

export const getMeseroColorConfig = (nombre: string) => MESERO_COLORS[claveColorDelMesero(nombre ?? '')];
