import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Se lee antes de crear el cliente, porque Supabase limpia la URL al procesar el enlace
const hashInicial = window.location.hash;
export const abiertoDesdeEnlaceRecuperacion = hashInicial.includes('type=recovery');
export const enlaceRecuperacionInvalido = hashInicial.includes('error_code=otp_expired') || hashInicial.includes('error=access_denied');

// Con internet muy lento, una consulta se corta a los 30 segundos y la app avisa del error,
// en vez de quedarse esperando para siempre (y con ella los guardados que vienen detrás)
const LIMITE_MS = 30000;
const fetchConLimite: typeof fetch = (entrada, opciones: RequestInit = {}) => {
  const control = new AbortController();
  const limite = setTimeout(() => control.abort(), LIMITE_MS);
  const original = opciones.signal;
  if (original?.aborted) control.abort();
  original?.addEventListener('abort', () => control.abort());
  return fetch(entrada, { ...opciones, signal: control.signal }).finally(() => clearTimeout(limite));
};

// La sesión se guarda en sessionStorage para que cada pestaña tenga su propia sesión
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true },
      global: { fetch: fetchConLimite }
    })
  : null;

export const isSupabaseEnabled = () => !!supabase;
