import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoginScreen from './login/LoginScreen';
import MeseroDashboard from './mesero/MeseroDashboard';
import CajeraDashboard from './cajera/CajeraDashboard';
import DueñoDashboard from './dueno/DuenoDashboard';
import { getUsersFromStorage, saveUsersToStorage, simpleHash, generateSalt, isValidEmail, createUser, verifyPassword } from '@/lib/auth';

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
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);

  // Cargar usuario desde sessionStorage al iniciar (cada pestaña tiene su propia sesión)
  React.useEffect(() => {
    const savedUser = sessionStorage.getItem('santandereano_current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        const users = getUsersFromStorage();
        const userInDB = users[userData.email];
        
        console.log('=== VALIDACIÓN SESIÓN ===');
        console.log('Email:', userData.email);
        console.log('Usuario en DB:', userInDB ? 'Encontrado' : 'NO encontrado');
        console.log('Rol guardado:', userData.role);
        console.log('Rol en DB:', userInDB?.role);
        
        // Validar que el usuario existe y el rol coincide
        if (userInDB && userInDB.active && userInDB.role === userData.role) {
          console.log('✅ Sesión válida');
          setCurrentUser(userData);
        } else {
          // Si el rol no coincide o el usuario no existe, cerrar sesión
          console.warn('❌ Sesión inválida - cerrando sesión');
          sessionStorage.removeItem('santandereano_current_user');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
        sessionStorage.removeItem('santandereano_current_user');
      }
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
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = getUsersFromStorage();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users[normalizedEmail];
    
    console.log('=== INTENTO DE LOGIN ===');
    console.log('Email ingresado:', normalizedEmail);
    console.log('Usuario encontrado:', user ? 'Sí' : 'No');
    console.log('Usuarios disponibles:', Object.keys(users));
    
    if (user && user.active && verifyPassword(password, user.password, user.salt)) {
      console.log('✅ Login exitoso');
      const userData = { email: normalizedEmail, ...user };
      setCurrentUser(userData);
      sessionStorage.setItem('santandereano_current_user', JSON.stringify(userData));
      
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('block_until');
    } else {
      console.log('❌ Login fallido');
      if (user) {
        console.log('Usuario existe pero contraseña incorrecta');
      } else {
        console.log('Usuario no existe en la base de datos');
      }
      
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
        alert(`Credenciales incorrectas. Intentos restantes: ${3 - newAttempts}`);
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      createUser(email, password, name);
      alert('Usuario creado exitosamente como Mesero');
      setShowRegister(false);
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (resetStep === 1) {
      if (!resetEmail.trim() || !isValidEmail(resetEmail)) {
        alert('Por favor ingrese un email válido');
        return;
      }
      
      const users = getUsersFromStorage();
      if (!users[resetEmail]) {
        alert('No existe una cuenta con este email');
        return;
      }
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('reset_code_' + resetEmail, code);
      localStorage.setItem('reset_code_expiry_' + resetEmail, (Date.now() + 300000).toString());
      
      alert(`Código de recuperación: ${code}\n\n⚠️ En producción, este código se enviaría por email.\nTiene 5 minutos para usarlo.`);
      setResetStep(2);
    } else if (resetStep === 2) {
      if (!resetCode.trim()) {
        alert('Ingrese el código de recuperación');
        return;
      }
      
      const storedCode = localStorage.getItem('reset_code_' + resetEmail);
      const expiry = localStorage.getItem('reset_code_expiry_' + resetEmail);
      
      if (!storedCode || Date.now() > parseInt(expiry)) {
        alert('El código ha expirado. Solicite uno nuevo.');
        setResetStep(1);
        setResetCode('');
        return;
      }
      
      if (resetCode !== storedCode) {
        alert('Código incorrecto');
        return;
      }
      
      setResetStep(3);
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
      
      const users = getUsersFromStorage();
      const salt = generateSalt();
      const hashedPassword = simpleHash(newPassword, salt);
      
      users[resetEmail] = {
        ...users[resetEmail],
        password: hashedPassword,
        salt
      };
      
      saveUsersToStorage(users);
      
      localStorage.removeItem('reset_code_' + resetEmail);
      localStorage.removeItem('reset_code_expiry_' + resetEmail);
      
      alert('✅ Contraseña actualizada exitosamente');
      setShowForgotPassword(false);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetStep(1);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setRole('mesero');
    sessionStorage.removeItem('santandereano_current_user');
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
      resetCode={resetCode}
      setResetCode={setResetCode}
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
