import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoginScreen from './login/LoginScreen';
import MeseroDashboard from './mesero/MeseroDashboard';
import CajeraDashboard from './cajera/CajeraDashboard';
import DueñoDashboard from './dueno/DuenoDashboard';
import { isValidEmail, iniciarSesion, sesionActual, cerrarSesion, registrarMesero, enviarEnlaceRecuperacion, sesionRecuperacionLista, cambiarContrasena, abiertoDesdeEnlaceRecuperacion, enlaceRecuperacionInvalido } from '@/lib/auth';

export default function SantandereanoSystem() {
  const [currentUser, setCurrentUser] = useState(null);
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
      sesionActual().then((usuario) => {
        if (usuario) setCurrentUser(usuario);
      });
    }

    // Verificar bloqueo existente
    const blockUntil = localStorage.getItem('block_until');
    const attempts = localStorage.getItem('login_attempts');
    
    if (blockUntil) {
      const timeLeft = Math.ceil((parseInt(blockUntil) - Date.now()) / 1000);
      if (timeLeft > 0) {
        setIsBlocked(true);
        setBlockTimeLeft(timeLeft);
        setLoginAttempts(parseInt(attempts) || 0);
        
        const countdown = setInterval(() => {
          const newTimeLeft = Math.ceil((parseInt(blockUntil) - Date.now()) / 1000);
          if (newTimeLeft <= 0) {
            setIsBlocked(false);
            setBlockTimeLeft(0);
            setLoginAttempts(0);
            localStorage.removeItem('login_attempts');
            localStorage.removeItem('block_until');
            clearInterval(countdown);
          } else {
            setBlockTimeLeft(newTimeLeft);
          }
        }, 1000);
      } else {
        localStorage.removeItem('block_until');
        localStorage.removeItem('login_attempts');
      }
    } else if (attempts) {
      setLoginAttempts(parseInt(attempts));
    }
  }, []);

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
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());
      
      if (newAttempts >= 3) {
        const blockUntil = Date.now() + 30000;
        setIsBlocked(true);
        setBlockTimeLeft(30);
        localStorage.setItem('block_until', blockUntil.toString());
        
        const countdown = setInterval(() => {
          const timeLeft = Math.ceil((blockUntil - Date.now()) / 1000);
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
        
        alert('Demasiados intentos fallidos. Cuenta bloqueada por 30 segundos.');
      } else {
        alert(`${mensajeError.replace(/\.$/, '')}. Intentos restantes: ${3 - newAttempts}`);
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
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setRole('mesero');
    cerrarSesion();
  };

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
    return <DueñoDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/10 backdrop-blur-md border-red-900/20">
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
              className="mt-4 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
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
