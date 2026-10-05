import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// La sesión se guarda en sessionStorage para que cada pestaña tenga su propia sesión
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true }
    })
  : null;

export const isSupabaseEnabled = () => !!supabase;
