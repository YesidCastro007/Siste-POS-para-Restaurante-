import { supabase } from '@/lib/supabase';
export { abiertoDesdeEnlaceRecuperacion, enlaceRecuperacionInvalido } from '@/lib/supabase';

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

// Cierra la sesión solo en este dispositivo (sin "scope: local" se cerraría en todos los
// dispositivos donde esa cuenta esté abierta)
const salir = () => getClient().auth.signOut({ scope: 'local' });

// Sin internet, Supabase responde "Failed to fetch" o un error de red
const esErrorDeRed = (error: { message?: string; name?: string; status?: number }) =>
  error.name === 'AuthRetryableFetchError' || error.status === 0 ||
  /failed to fetch|network|load failed|fetch|abort/i.test(error.message ?? '');

export const SIN_CONEXION = 'No hay conexión con el servidor. Revise el internet e intente de nuevo.';
export const CREDENCIALES_INCORRECTAS = 'Credenciales incorrectas';

// Mensajes de Supabase en español
const traducirError = (error: { message?: string; name?: string; status?: number }) => {
  const mensaje = (error.message ?? '').toLowerCase();
  if (esErrorDeRed(error)) return SIN_CONEXION;
  if (mensaje.includes('rate limit') || mensaje.includes('only request this after') || error.status === 429) {
    return 'Demasiados intentos seguidos. Espere un momento e intente de nuevo.';
  }
  if (mensaje.includes('should be different from the old password')) return 'La nueva contraseña debe ser distinta de la anterior.';
  if (mensaje.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres';
  if (mensaje.includes('weak') && mensaje.includes('password')) return 'La contraseña es muy débil. Use una más larga, con letras y números.';
  if (mensaje.includes('invalid') && mensaje.includes('email')) return 'Email inválido';
  if (mensaje.includes('signups not allowed') || mensaje.includes('signup is disabled')) return 'El registro de usuarios nuevos está desactivado.';
  if (mensaje.includes('session') && (mensaje.includes('missing') || mensaje.includes('expired'))) {
    return 'El enlace expiró o ya se usó. Solicite uno nuevo.';
  }
  return error.message ?? 'Ocurrió un error. Intente de nuevo.';
};

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

// Solo el dueño: cambia el rol (mesero o cajera) y el estado de otro usuario.
// La base de datos verifica el permiso (ver supabase/migrations/004_dueno_gestiona_usuarios.sql).
export const actualizarUsuario = async (id: string, role: Rol, active: boolean) => {
  const { error } = await getClient().rpc('actualizar_usuario', { usuario: id, nuevo_rol: role, activo: active });
  if (error) {
    if (error.message.includes('actualizar_usuario')) {
      throw new Error('Falta ejecutar 004_dueno_gestiona_usuarios.sql en Supabase.');
    }
    throw new Error(error.message);
  }
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
    await salir();
    throw new Error('Esta cuenta no está activa. Pídale al dueño que la active desde su panel.');
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
    if (esErrorDeRed(error)) throw new Error(SIN_CONEXION);
    if (error.status === 429) throw new Error(traducirError(error));
    throw new Error(CREDENCIALES_INCORRECTAS);
  }
  return perfilActivo(data.user.id);
};

// Perfil actual de quien tiene la sesión abierta en esta pestaña.
// Devuelve null si no hay sesión; si no hay internet lanza un error (la sesión no se toca).
export const perfilDeLaSesion = async (): Promise<Usuario | null> => {
  if (!supabase) return null;
  const { data, error: errorSesion } = await supabase.auth.getSession();
  if (errorSesion) throw new Error(traducirError(errorSesion));
  if (!data.session) return null;
  const { data: perfil, error } = await supabase
    .from('profiles')
    .select(PERFIL_COLUMNAS)
    .eq('id', data.session.user.id)
    .maybeSingle();
  if (error) throw new Error(traducirError(error));
  return (perfil as Usuario | null) ?? null;
};

// Recupera la sesión guardada en esta pestaña, si existe. Si no hay internet lanza un error
// (para ofrecer reintentar) en vez de cerrar la sesión.
export const sesionActual = async (): Promise<Usuario | null> => {
  const perfil = await perfilDeLaSesion();
  if (!perfil || !perfil.active) {
    if (supabase) await salir();
    return null;
  }
  await cargarUsuarios();
  return perfil;
};

export const cerrarSesion = async () => {
  usuariosCache = [];
  if (supabase) await salir();
};

// Avisa cuando la sesión de esta pestaña se cierra sola (por ejemplo, si no se pudo renovar)
export const alCerrarseLaSesion = (avisar: () => void) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(evento => {
    if (evento === 'SIGNED_OUT') avisar();
  });
  return () => data.subscription.unsubscribe();
};

// Registro público: siempre crea meseros inactivos (el rol y el estado los asigna la base de datos);
// el dueño los activa desde su panel
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
    throw new Error(traducirError(error));
  }

  // El registro no deja la sesión abierta: el usuario entra desde el login
  const requiereConfirmacion = !data.session;
  if (data.session) await salir();
  return { requiereConfirmacion };
};

// Recuperación de contraseña: Supabase envía un enlace al correo. Al abrirlo, la app
// recibe una sesión temporal y muestra el formulario de nueva contraseña.
export const enviarEnlaceRecuperacion = async (email: string) => {
  const { error } = await getClient().auth.resetPasswordForEmail(normalizarEmail(email), {
    redirectTo: window.location.origin
  });
  if (error) throw new Error(traducirError(error));
};

// Espera a que Supabase procese el enlace y dice si quedó una sesión de recuperación válida
export const sesionRecuperacionLista = async () => {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

export const cambiarContrasena = async (nuevaContrasena: string) => {
  const client = getClient();
  const { error } = await client.auth.updateUser({ password: nuevaContrasena });
  if (error) throw new Error(traducirError(error));
  // El enlace abre una sesión temporal; se cierra para que el usuario entre con la nueva contraseña
  await salir();
};
