import { supabase } from '@/lib/supabase';

// Autenticación con Supabase Auth. Las contraseñas las guarda y verifica Supabase;
// el rol de cada usuario vive en la tabla `profiles` (ver supabase/migrations/002_auth_profiles.sql).

export type Rol = 'mesero' | 'cajera' | 'dueño';

export interface Usuario {
  id: string;
  email: string;
  name: string;
  role: Rol;
  active: boolean;
}

const PERFIL_COLUMNAS = 'id, email, name, role, active';

const getClient = () => {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revise VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

const normalizarEmail = (email: string) => email.toLowerCase().trim();

// Validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Lista de usuarios (para los colores de meseros). Se carga después de iniciar sesión.
let usuariosCache: Usuario[] = [];

export const getUsuariosCache = () => usuariosCache;

export const cargarUsuarios = async () => {
  const { data, error } = await getClient()
    .from('profiles')
    .select(PERFIL_COLUMNAS)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error cargando usuarios:', error.message);
    return usuariosCache;
  }
  usuariosCache = (data ?? []) as Usuario[];
  return usuariosCache;
};

const obtenerPerfil = async (userId: string): Promise<Usuario> => {
  const { data, error } = await getClient()
    .from('profiles')
    .select(PERFIL_COLUMNAS)
    .eq('id', userId)
    .single();
  if (error || !data) {
    throw new Error('No se encontró el perfil del usuario. Contacte al administrador.');
  }
  return data as Usuario;
};

// Devuelve el perfil si el usuario está activo; si no, cierra la sesión
const perfilActivo = async (userId: string): Promise<Usuario> => {
  const perfil = await obtenerPerfil(userId);
  if (!perfil.active) {
    await getClient().auth.signOut();
    throw new Error('Este usuario está inactivo. Contacte al administrador.');
  }
  await cargarUsuarios();
  return perfil;
};

export const iniciarSesion = async (email: string, password: string): Promise<Usuario> => {
  const { data, error } = await getClient().auth.signInWithPassword({
    email: normalizarEmail(email),
    password
  });
  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      throw new Error('Debe confirmar su correo antes de iniciar sesión. Revise su bandeja de entrada.');
    }
    throw new Error('Credenciales incorrectas');
  }
  return perfilActivo(data.user.id);
};

// Recupera la sesión guardada en esta pestaña, si existe
export const sesionActual = async (): Promise<Usuario | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  try {
    return await perfilActivo(data.session.user.id);
  } catch (error) {
    console.error('Sesión inválida:', error.message);
    await supabase.auth.signOut();
    return null;
  }
};

export const cerrarSesion = async () => {
  usuariosCache = [];
  if (supabase) await supabase.auth.signOut();
};

// Registro público: siempre crea meseros (el rol lo asigna la base de datos)
export const registrarMesero = async (email: string, password: string, name: string) => {
  const normalizedEmail = normalizarEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Email inválido');
  }

  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  const { data, error } = await getClient().auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { name: name.trim() } }
  });
  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new Error('El email ya está registrado');
    }
    throw new Error(error.message);
  }

  // El registro no deja la sesión abierta: el usuario entra desde el login
  const requiereConfirmacion = !data.session;
  if (data.session) await getClient().auth.signOut();
  return { requiereConfirmacion };
};

// Recuperación de contraseña en 3 pasos: código por correo, verificar código, nueva contraseña
export const enviarCodigoRecuperacion = async (email: string) => {
  const { error } = await getClient().auth.resetPasswordForEmail(normalizarEmail(email));
  if (error) throw new Error(error.message);
};

export const verificarCodigoRecuperacion = async (email: string, codigo: string) => {
  const { error } = await getClient().auth.verifyOtp({
    email: normalizarEmail(email),
    token: codigo.trim(),
    type: 'recovery'
  });
  if (error) throw new Error('Código incorrecto o expirado');
};

export const cambiarContrasena = async (nuevaContrasena: string) => {
  const client = getClient();
  const { error } = await client.auth.updateUser({ password: nuevaContrasena });
  if (error) throw new Error(error.message);
  // Verificar el código abre una sesión; se cierra para que el usuario entre con la nueva contraseña
  await client.auth.signOut();
};
