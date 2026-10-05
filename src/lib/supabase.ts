import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Se lee antes de crear el cliente, porque Supabase limpia la URL al procesar el enlace
const hashInicial = window.location.hash;
export const abiertoDesdeEnlaceRecuperacion = hashInicial.includes('type=recovery');
export const enlaceRecuperacionInvalido = hashInicial.includes('error_code=otp_expired') || hashInicial.includes('error=access_denied');

// La sesión se guarda en sessionStorage para que cada pestaña tenga su propia sesión
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true }
    })
  : null;

export const isSupabaseEnabled = () => !!supabase;
