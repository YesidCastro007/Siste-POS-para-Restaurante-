import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoginScreen from './login/LoginScreen';
import MeseroDashboard from './mesero/MeseroDashboard';
import CajeraDashboard from './cajera/CajeraDashboard';
import DuenoDashboard from './dueno/DuenoDashboard';
import {
  isValidEmail, iniciarSesion, sesionActual, cerrarSesion, registrarMesero, enviarEnlaceRecuperacion, sesionRecuperacionLista,
  cambiarContrasena, abiertoDesdeEnlaceRecuperacion, enlaceRecuperacionInvalido, perfilDeLaSesion, alCerrarseLaSesion,
  CREDENCIALES_INCORRECTAS, type Usuario
} from '@/lib/auth';
import { iconoShadow } from '@/components/marca/Marca';

const NOMBRE_ROL = { mesero: 'Mesero', cajera: 'Cajera', dueño: 'Dueño' };

// Cada cuánto se revisa que la cuenta siga activa y con el mismo rol
const REVISAR_PERFIL_MS = 60000;

export default function SantandereanoSystem() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  // Mientras se recupera la sesión guardada no se muestra el login (evita verlo un instante al recargar)
  const [restaurando, setRestaurando] = useState(!abiertoDesdeEnlaceRecuperacion && !enlaceRecuperacionInvalido);
  const [errorRestaurando, setErrorRestaurando] = useState('');
  const saliendo = React.useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('mesero');
  const [isHovered, setIsHovered] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);

  // Recuperar la sesión de Supabase guardada en esta pestaña
  React.useEffect(() => {
    if (abiertoDesdeEnlaceRecuperacion) {
      // Llegó desde el enlace del correo: pedir la nueva contraseña en vez de entrar
      sesionRecuperacionLista().then((lista) => {
        if (lista) {
          setShowForgotPassword(true);
          setResetStep(3);
        } else {
          alert('El enlace de recuperación expiró o ya se usó. Solicite uno nuevo.');
        }
      });
    } else if (enlaceRecuperacionInvalido) {
      alert('El enlace de recuperación expiró o ya se usó. Solicite uno nuevo.');
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      restaurarSesion();
    }

    // Verificar bloqueo existente
    const blockUntil = parseInt(localStorage.getItem('block_until') ?? '');
    const attempts = localStorage.getItem('login_attempts');

    if (blockUntil) {
      if (blockUntil > Date.now()) {
        setLoginAttempts(parseInt(attempts) || 0);
        bloquearHasta(blockUntil);
      } else {
        localStorage.removeItem('block_until');
        localStorage.removeItem('login_attempts');
      }
    } else if (attempts) {
      setLoginAttempts(parseInt(attempts));
    }
  }, []);

  const restaurarSesion = async () => {
    setRestaurando(true);
    setErrorRestaurando('');
    try {
      const usuario = await sesionActual();
      if (usuario) setCurrentUser(usuario);
      setRestaurando(false);
    } catch (error) {
      // Sin internet no se cierra la sesión: se ofrece reintentar
      setErrorRestaurando(error.message);
    }
  };

  // Mientras hay alguien dentro: si la sesión se cierra sola, o el dueño desactiva la cuenta
  // o le cambia el rol, la app lo nota sin esperar a que la persona recargue
  const idUsuario = currentUser?.id;
  const usuarioRef = React.useRef(currentUser);
  usuarioRef.current = currentUser;
  React.useEffect(() => {
    if (!idUsuario) return;
    saliendo.current = false;
    const sacar = (mensaje: string) => {
      if (saliendo.current) return;
      saliendo.current = true;
      setCurrentUser(null);
      cerrarSesion();
      alert(mensaje);
    };
    const dejarDeEscuchar = alCerrarseLaSesion(() => sacar('Su sesión se cerró. Inicie sesión de nuevo.'));
    const revisar = async () => {
      if (document.hidden) return;
      let perfil: Usuario | null;
      try {
        perfil = await perfilDeLaSesion();
      } catch {
        return; // sin internet: se revisa en la próxima vuelta
      }
      if (!perfil) sacar('Su sesión se cerró. Inicie sesión de nuevo.');
      else if (!perfil.active) sacar('Su cuenta fue desactivada por el dueño.');
      else {
        const actual = usuarioRef.current;
        if (!actual || (actual.role === perfil.role && actual.name === perfil.name)) return;
        setCurrentUser(perfil);
        if (actual.role !== perfil.role) alert(`El dueño cambió su rol a ${NOMBRE_ROL[perfil.role] ?? perfil.role}.`);
      }
    };
    const intervalo = setInterval(revisar, REVISAR_PERFIL_MS);
    window.addEventListener('focus', revisar);
    return () => {
      dejarDeEscuchar();
      clearInterval(intervalo);
      window.removeEventListener('focus', revisar);
    };
  }, [idUsuario]);

  // Bloqueo del login por intentos fallidos, con cuenta regresiva
  const bloquearHasta = (hasta: number) => {
    setIsBlocked(true);
    setBlockTimeLeft(Math.ceil((hasta - Date.now()) / 1000));
    const countdown = setInterval(() => {
      const timeLeft = Math.ceil((hasta - Date.now()) / 1000);
      if (timeLeft <= 0) {
        setIsBlocked(false);
        setBlockTimeLeft(0);
        setLoginAttempts(0);
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('block_until');
        clearInterval(countdown);
      } else {
        setBlockTimeLeft(timeLeft);
      }
    }, 1000);
  };

  const handleLogin = async () => {
    if (isBlocked) {
      alert(`Cuenta bloqueada. Intente nuevamente en ${blockTimeLeft} segundos.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      alert('Por favor ingrese email y contraseña');
      return;
    }

    if (!isValidEmail(email)) {
      alert('Por favor ingrese un email válido');
      return;
    }

    setIsLoading(true);
    
    let usuario = null;
    let mensajeError = 'Credenciales incorrectas';
    try {
      usuario = await iniciarSesion(email, password);
    } catch (error) {
      mensajeError = error.message;
    }

    if (usuario) {
      setCurrentUser(usuario);
      
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('block_until');
    } else if (mensajeError !== CREDENCIALES_INCORRECTAS) {
      // Sin internet, cuenta inactiva o sin confirmar: no cuenta como intento fallido
      alert(mensajeError);
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());
      
      if (newAttempts >= 3) {
        const blockUntil = Date.now() + 30000;
        localStorage.setItem('block_until', blockUntil.toString());
        bloquearHasta(blockUntil);
        alert('Demasiados intentos fallidos. Cuenta bloqueada por 30 segundos.');
      } else {
        alert(`${mensajeError}. Intentos restantes: ${3 - newAttempts}`);
      }
    }
    
    setIsLoading(false);
  };

  const handleRegister = async () => {
    const { name, email, password, confirmPassword } = registerData;
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Todos los campos son obligatorios');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setIsLoading(true);
      const { requiereConfirmacion } = await registrarMesero(email, password, name);
      alert(requiereConfirmacion
        ? 'Usuario creado como Mesero. Revise su correo para confirmar la cuenta. Después, el dueño debe activarla desde su panel para que pueda entrar.'
        : 'Usuario creado como Mesero. El dueño debe activar la cuenta desde su panel para que pueda entrar.');
      setShowRegister(false);
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsLoading(true);
      if (resetStep === 1) {
        if (!resetEmail.trim() || !isValidEmail(resetEmail)) {
          alert('Por favor ingrese un email válido');
          return;
        }
        
        await enviarEnlaceRecuperacion(resetEmail);
        alert('Si existe una cuenta con este email, le enviamos un enlace para cambiar la contraseña. Ábralo desde este dispositivo (revise también la carpeta de spam).');
        setShowForgotPassword(false);
        setResetEmail('');
      } else if (resetStep === 3) {
        if (!newPassword.trim() || !confirmNewPassword.trim()) {
          alert('Complete todos los campos');
          return;
        }
        
        if (newPassword.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres');
          return;
        }
        
        if (newPassword !== confirmNewPassword) {
          alert('Las contraseñas no coinciden');
          return;
        }
        
        await cambiarContrasena(newPassword);
        
        alert('✅ Contraseña actualizada exitosamente');
        setShowForgotPassword(false);
        setResetEmail('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetStep(1);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    saliendo.current = true;
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setRole('mesero');
    cerrarSesion();
  };

  if (!currentUser && restaurando) {
    return (
      <div className="min-h-screen fondo-shadow flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <img src={iconoShadow} alt="" className="w-16 h-16 mx-auto brillo-cian" />
          {errorRestaurando ? (
            <>
              <p className="text-white">{errorRestaurando}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={restaurarSesion} className="boton-marca">Reintentar</Button>
                <Button
                  onClick={() => { setRestaurando(false); cerrarSesion(); }}
                  variant="outline"
                  className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Ir al inicio de sesión
                </Button>
              </div>
            </>
          ) : (
            <p className="text-slate-300">Cargando…</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen 
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      role={role}
      setRole={setRole}
      handleLogin={handleLogin}
      isHovered={isHovered}
      setIsHovered={setIsHovered}
      isLoading={isLoading}
      loginAttempts={loginAttempts}
      isBlocked={isBlocked}
      blockTimeLeft={blockTimeLeft}
      showRegister={showRegister}
      setShowRegister={setShowRegister}
      registerData={registerData}
      setRegisterData={setRegisterData}
      handleRegister={handleRegister}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showForgotPassword={showForgotPassword}
      setShowForgotPassword={setShowForgotPassword}
      resetEmail={resetEmail}
      setResetEmail={setResetEmail}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      confirmNewPassword={confirmNewPassword}
      setConfirmNewPassword={setConfirmNewPassword}
      resetStep={resetStep}
      setResetStep={setResetStep}
      handleForgotPassword={handleForgotPassword}
    />;
  }

  if (currentUser.role === 'mesero') {
    return <MeseroDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === 'cajera') {
    return <CajeraDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === 'dueño') {
    return <DuenoDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen fondo-shadow">
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/10 backdrop-blur-md border-cyan-400/10">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Panel de {currentUser.role}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-gray-300">
            <p>Próximamente...</p>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="mt-4 border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
