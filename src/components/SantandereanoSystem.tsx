import React, { useState } from 'react';
import { User, Lock, ChefHat, LogOut, UtensilsCrossed, X, Trash2, Plus, Minus, Send, CheckCircle, Clock, Calculator, BarChart3, CreditCard, Banknote, Smartphone, Receipt, Eye, EyeOff, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CajeroMesasView from './CajeroMesasView';
import { generarReportePDF, enviarReportePorWhatsApp } from '@/lib/reportePDF';

// Sistema de usuarios con localStorage
const getUsersFromStorage = () => {
  try {
    const users = localStorage.getItem('santandereano_users');
    const defaultUsers = getDefaultUsersOnly();
    
    if (users) {
      const parsedUsers = JSON.parse(users);
      const mergedUsers = { ...defaultUsers, ...parsedUsers };
      localStorage.setItem('santandereano_users', JSON.stringify(mergedUsers));
      return mergedUsers;
    }
    
    localStorage.setItem('santandereano_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    return getDefaultUsers();
  }
};

const saveUsersToStorage = (users) => {
  try {
    localStorage.setItem('santandereano_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error guardando usuarios:', error);
  }
};

const getDefaultUsersOnly = () => {
  const salt1 = 'admin_salt';
  const salt2 = 'cajero_salt';
  const salt3 = 'mesero1_salt';
  const salt4 = 'mesero2_salt';
  return {
    'admin@santandereano.com': {
      email: 'admin@santandereano.com',
      password: simpleHash('hello', salt1),
      role: 'dueño',
      name: 'Administrador',
      salt: salt1,
      active: true,
      createdAt: new Date().toISOString()
    },
    'administrivocaja@santandereano.com': {
      email: 'administrivocaja@santandereano.com',
      password: simpleHash('1010230caja', salt2),
      role: 'cajera',
      name: 'Cajero Principal',
      salt: salt2,
      active: true,
      createdAt: new Date().toISOString()
    },
    'yesidcastro703@gmail.com': {
      email: 'yesidcastro703@gmail.com',
      password: simpleHash('1007918051', salt3),
      role: 'mesero',
      name: 'Yesid Castro',
      salt: salt3,
      active: true,
      createdAt: new Date().toISOString()
    },
    'jonathancastro@santandereano.com': {
      email: 'jonathancastro@santandereano.com',
      password: simpleHash('jonatican', salt4),
      role: 'mesero',
      name: 'Jonathan Castro',
      salt: salt4,
      active: true,
      createdAt: new Date().toISOString()
    }
  };
};

const getDefaultUsers = () => {
  const defaultUsers = getDefaultUsersOnly();
  localStorage.setItem('santandereano_users', JSON.stringify(defaultUsers));
  return defaultUsers;
};

// Función simple de hash (SHA-256 simulado)
const simpleHash = (password, salt) => {
  const combined = password + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substring(0, 64);
};

// Generar salt aleatorio
const generateSalt = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Crear nuevo usuario (solo meseros por defecto)
const createUser = (email, password, name) => {
  const users = getUsersFromStorage();
  const normalizedEmail = email.toLowerCase().trim();
  
  if (users[normalizedEmail]) {
    throw new Error('El email ya está registrado');
  }
  
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Email inválido');
  }
  
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  const salt = generateSalt();
  const hashedPassword = simpleHash(password, salt);
  
  users[normalizedEmail] = {
    email: normalizedEmail,
    password: hashedPassword,
    name,
    role: 'mesero',
    salt,
    active: true,
    createdAt: new Date().toISOString()
  };
  
  saveUsersToStorage(users);
  return users[normalizedEmail];
};

// Función para verificar contraseña
const verifyPassword = (inputPassword, storedHash, salt) => {
  const inputHash = simpleHash(inputPassword, salt);
  return inputHash === storedHash;
};

const MENU_DATA = {
  picadas: {
    sizes: ['Personal', 'Para 2', 'Para 4', 'Familiar'],
    carnes: ['Res', 'Cerdo', 'Rellena', 'Chorizo','Gallina'],
    terminos: ['Jugoso', '3/4', 'Bien cocido']
  },
  gallina: {
    productos: [
      { name: '1/2 Gallina Asada', price: 40000 },
      { name: 'Gallina Entera', price: 80000 },
      { name: 'Pierna Pernil', price: 18000 },
      { name: 'Pechuga', price: 18000 },
      { name: 'Rabadilla', price: 18000 },
      { name: 'Ala', price: 10000 }
    ],
    terminos: ['Jugoso', '3/4', 'Bien cocido']
  },
  sopas: {
    price: 10000, // Precio fijo
    sabores: [] // Se cargará dinámicamente desde localStorage
  },
  bebidas: {
    'Jugos Hit y Gaseosas 350ml': [
      { name: 'Jugo Hit Mango', price: 3000 },
      { name: 'Jugo Hit Lulo', price: 3000 },
      { name: 'Jugo Hit Mora', price: 3000 },
      { name: 'Jugo Hit Tropical', price: 3000 },
      { name: 'Jugo Hit Naranja Piña', price: 3000 },
      { name: 'Botella de Agua', price: 3000 },
      { name: 'Colombiana 350ml', price: 3000 },
      { name: 'Pepsi 350ml', price: 3000 },
      { name: 'Manzana 350ml', price: 3000 }
    ],
    'Cervezas y Cola & Pola 350ml': [
      { name: 'Cerveza Aguila', price: 3500 },
      { name: 'Cerveza Poker', price: 3500 },
      { name: 'Cola & Pola 330ml', price: 3500 }
    ],
    'Gaseosas & Cola y Pola 1.5L': [
      { name: 'Cola y Pola 1.5L', price: 8000 },
      { name: 'Colombiana 1.5L', price: 6000 },
      { name: 'Manzana 1.5L', price: 6000 },
      { name: 'Pepsi 1.5L', price: 6000 }
    ],
  },
  adicionales: [
    { name: 'Porción de yuca', price: 4000, fixed: true },
    { name: 'Porción de papa', price: 4000, fixed: true },
    { name: 'Porción de plátano', price: 4000, fixed: true },
    { name: 'Guacamole', price: 3000, fixed: true },
    { name: 'Arepa', price: 2000, fixed: true }
  ]
};

const PISOS = [
  { number: 1, mesas: 15 },
  { number: 2, mesas: 18 },
  { number: 3, mesas: 10 }
];

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

function LoginScreen({ email, setEmail, password, setPassword, role, setRole, handleLogin, isHovered, setIsHovered, isLoading, loginAttempts, isBlocked, blockTimeLeft, showRegister, setShowRegister, registerData, setRegisterData, handleRegister, showPassword, setShowPassword, showForgotPassword, setShowForgotPassword, resetEmail, setResetEmail, resetCode, setResetCode, newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword, resetStep, setResetStep, handleForgotPassword }) {
  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border-red-900/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-center">Crear Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre Completo</label>
              <Input
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                className="bg-white/5 border-red-900/30 text-white"
                placeholder="Ingrese nombre completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <Input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="bg-white/5 border-red-900/30 text-white"
                placeholder="usuario@gmail.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
              <Input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                className="bg-white/5 border-red-900/30 text-white"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Contraseña</label>
              <Input
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                className="bg-white/5 border-red-900/30 text-white"
                placeholder="Repita la contraseña"
              />
            </div>
            
            <div className="text-center p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
              <p className="text-blue-300 text-sm font-medium">ℹ️ Información</p>
              <p className="text-blue-200 text-xs mt-1">
                Todos los nuevos usuarios se registran como <strong>Mesero</strong>.
                Para roles administrativos, contacte al administrador.
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowRegister(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Logo y branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/50">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UtensilsCrossed className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-yellow-900" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white">
              Santandereano
            </h1>
            <p className="text-2xl text-red-300 font-light tracking-wider">
              SAS
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-yellow-500 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Formulario de login */}
        <Card className="bg-white/5 backdrop-blur-xl border-red-900/20 shadow-2xl">
          <CardHeader className="space-y-6">
            <div className="lg:hidden text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Santandereano</h1>
              <p className="text-red-300">SAS</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-6">Bienvenido</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-white/5 border-red-900/30 pl-12 py-3 text-white placeholder-gray-500 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                    placeholder="usuario@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-white/5 border-red-900/30 pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={isLoading || isBlocked}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-full font-medium py-4 transition-all duration-300 shadow-lg hover:shadow-red-600/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isBlocked 
                    ? 'bg-red-800 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-red-600/30'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {isBlocked ? (
                    <>
                      🔒 Bloqueado ({blockTimeLeft}s)
                    </>
                  ) : isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión
                      <span className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}>
                        →
                      </span>
                    </>
                  )}
                </span>
              </Button>

              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors text-center w-full"
              >
                ¿Olvidaste tu contraseña?
              </button>

              {loginAttempts > 0 && !isBlocked && (
                <div className="text-center">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Intentos fallidos: {loginAttempts}/3
                  </p>
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Usuario por defecto:
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p className="text-red-400 text-xs mt-2">
                    🛡️ Máximo 3 intentos. Bloqueo: 30s
                  </p>
                </div>
                
                <Button
                  onClick={() => setShowRegister(true)}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                >
                  Crear Nuevo Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-500 text-sm">
        Panel Administrativo • Santandereano ID © 2025
      </div>

      {/* Modal Recuperar Contraseña */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border-red-900/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {resetStep === 1 && '🔐 Recuperar Contraseña'}
                {resetStep === 2 && '🔢 Verificar Código'}
                {resetStep === 3 && '🔑 Nueva Contraseña'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <Input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-white/5 border-red-900/30 text-white"
                      placeholder="usuario@gmail.com"
                    />
                  </div>
                  <div className="text-center p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                    <p className="text-blue-200 text-xs">
                      Se generará un código de recuperación que deberá ingresar en el siguiente paso.
                    </p>
                  </div>
                </>
              )}

              {resetStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Código de Recuperación</label>
                    <Input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="bg-white/5 border-red-900/30 text-white text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <div className="text-center p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                    <p className="text-yellow-200 text-xs">
                      ⏱️ El código expira en 5 minutos
                    </p>
                  </div>
                </>
              )}

              {resetStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nueva Contraseña</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white/5 border-red-900/30 text-white"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Contraseña</label>
                    <Input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="bg-white/5 border-red-900/30 text-white"
                      placeholder="Repita la contraseña"
                    />
                  </div>
                </>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStep(1);
                    setResetEmail('');
                    setResetCode('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {resetStep === 1 && 'Enviar Código'}
                  {resetStep === 2 && 'Verificar'}
                  {resetStep === 3 && 'Cambiar Contraseña'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Paleta de colores predefinidos para meseros (sin verde para evitar confusión con mesas disponibles)
const MESERO_COLORS = {
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

// Generar color único para cada mesero basado en su email
const generateMeseroColor = (email: string) => {
  const colorKeys = Object.keys(MESERO_COLORS);
  const users = getUsersFromStorage();
  const meseros = Object.values(users).filter((u: any) => u.role === 'mesero');
  const meseroIndex = meseros.findIndex((m: any) => (m as any).email === email);
  
  if (meseroIndex !== -1) {
    return colorKeys[meseroIndex % colorKeys.length];
  }
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorKeys[Math.abs(hash) % colorKeys.length];
};

// Obtener configuración de color del mesero
const getMeseroColorConfig = (meseroName: string) => {
  const users = getUsersFromStorage();
  const mesero = Object.values(users).find((user: any) => user.name === meseroName);
  const colorKey = mesero ? generateMeseroColor((mesero as any).email) : 'blue';
  return MESERO_COLORS[colorKey as keyof typeof MESERO_COLORS] || MESERO_COLORS.blue;
};

function MeseroDashboard({ user, onLogout }) {
  const [pisoActual, setPisoActual] = useState(1);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [mesas, setMesas] = useState({});
  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [saboresSopas, setSaboresSopas] = useState([]);
  const [precioSopas, setPrecioSopas] = useState(MENU_DATA.sopas.price);

  // Funciones de persistencia
  const cargarDatos = () => {
    try {
      const mesasGuardadas = localStorage.getItem('santandereano_mesas');
      const ventasGuardadas = localStorage.getItem('santandereano_ventas');
      const saboresGuardados = localStorage.getItem('santandereano_sabores_sopas');
      
      if (mesasGuardadas) {
        setMesas(JSON.parse(mesasGuardadas));
      }
      if (ventasGuardadas) {
        setHistorialVentas(JSON.parse(ventasGuardadas));
      }
      if (saboresGuardados) {
        setSaboresSopas(JSON.parse(saboresGuardados));
      } else {
        // Sabores por defecto si no hay guardados
        const saboresDefault = ['Sopa de costilla', 'Sancocho'];
        setSaboresSopas(saboresDefault);
        localStorage.setItem('santandereano_sabores_sopas', JSON.stringify(saboresDefault));
      }
      
      // Cargar precio de sopas desde localStorage
      const precioGuardado = localStorage.getItem('santandereano_precio_sopas');
      if (precioGuardado) {
        setPrecioSopas(parseInt(precioGuardado));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const guardarMesas = (nuevasMesas) => {
    try {
      localStorage.setItem('santandereano_mesas', JSON.stringify(nuevasMesas));
      setMesas(nuevasMesas);
      // Disparar evento para sincronizar con otros meseros
      window.dispatchEvent(new CustomEvent('mesasActualizadas', { detail: nuevasMesas }));
    } catch (error) {
      console.error('Error guardando mesas:', error);
    }
  };

  const guardarVentas = (nuevasVentas) => {
    try {
      localStorage.setItem('santandereano_ventas', JSON.stringify(nuevasVentas));
      setHistorialVentas(nuevasVentas);
    } catch (error) {
      console.error('Error guardando ventas:', error);
    }
  };

  // Cargar datos al montar el componente
  React.useEffect(() => {
    cargarDatos();
    
    // Escuchar cambios de otros meseros
    const handleMesasActualizadas = (event) => {
      setMesas(event.detail);
    };
    
    window.addEventListener('mesasActualizadas', handleMesasActualizadas);
    
    // Sincronizar cada 5 segundos
    const interval = setInterval(() => {
      cargarDatos();
    }, 5000);
    
    return () => {
      window.removeEventListener('mesasActualizadas', handleMesasActualizadas);
      clearInterval(interval);
    };
  }, []);

  const mesasDelPiso = PISOS.find(p => p.number === pisoActual)?.mesas || 0;

  const abrirMesa = (numeroMesa) => {
    setMesaSeleccionada(numeroMesa);
    setMostrarPedido(true);
  };

  const cerrarPedido = () => {
    setMostrarPedido(false);
    setMesaSeleccionada(null);
  };

  const procesarCobro = (mesaKey, mesaData) => {
    // Crear registro de venta
    const venta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      mesa: mesaKey,
      mesero: user.name,
      pedidos: mesaData.pedidos,
      total: mesaData.total,
      metodoPago: mesaData.metodoPago || 'efectivo'
    };

    // Agregar al historial y guardar
    const nuevasVentas = [...historialVentas, venta];
    guardarVentas(nuevasVentas);

    // Limpiar la mesa y guardar
    const nuevasMesas = { ...mesas };
    delete nuevasMesas[mesaKey];
    guardarMesas(nuevasMesas);

    // Cerrar modales
    setMostrarCobro(false);
    setMostrarPedido(false);
    setMesaSeleccionada(null);

    alert(`¡Cobro procesado exitosamente! Total: $${mesaData.total.toLocaleString()}`);
  };

  const abrirCobro = () => {
    setMostrarPedido(false);
    setMostrarCobro(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-red-900/20 sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">
                  Santandereano SAS
                </h1>
                <p className="text-xs sm:text-sm text-red-300 hidden sm:block">
                  Panel de Mesero
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Mesero</p>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Selector de Pisos */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {PISOS.map((piso) => (
                <Button
                  key={piso.number}
                  onClick={() => setPisoActual(piso.number)}
                  variant={pisoActual === piso.number ? "default" : "outline"}
                  className={`flex-1 py-4 sm:py-6 px-3 sm:px-6 rounded-xl font-medium transition-all duration-300 ${
                    pisoActual === piso.number
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border-red-900/20'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold">Piso {piso.number}</p>
                    <p className="text-xs sm:text-sm opacity-80">{piso.mesas} mesas</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leyenda de Colores */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600/20 border border-green-600 rounded"></div>
                <span className="text-gray-300">Disponible</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600/30 border border-blue-600 rounded"></div>
                <span className="text-gray-300">Mi Mesa</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-600/10 border border-purple-600/50 rounded"></div>
                <span className="text-gray-300">Otro Mesero</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Mesas */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-white">Mesas - Piso {pisoActual}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
              {Array.from({ length: mesasDelPiso }, (_, i) => {
                const numeroMesa = i + 1;
                const mesaKey = `${pisoActual}-${numeroMesa}`;
                const mesaData = mesas[mesaKey];
                const ocupada = mesaData && mesaData.pedidos?.length > 0;
                const meseroAsignado = mesaData?.mesero;
                const esMiMesa = meseroAsignado === user.name;

                // Definir colores según el estado y mesero
                let clasesMesa = 'aspect-square rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ';
                
                if (ocupada) {
                  const colorConfig = getMeseroColorConfig(meseroAsignado);
                  if (esMiMesa) {
                    // Mi mesa - color del mesero con mayor intensidad
                    clasesMesa += `${colorConfig.bg} border-2 ${colorConfig.border} shadow-lg ${colorConfig.shadow} ${colorConfig.text}`;
                  } else {
                    // Mesa de otro mesero - color tenue
                    clasesMesa += `${colorConfig.bgLight} border-2 ${colorConfig.borderLight} shadow-lg ${colorConfig.shadowLight} ${colorConfig.textLight}`;
                  }
                } else {
                  // Mesa disponible
                  clasesMesa += 'bg-green-600/20 border-2 border-green-600/50 hover:border-green-500 text-green-300';
                }

                return (
                  <Button
                    key={numeroMesa}
                    onClick={() => abrirMesa(numeroMesa)}
                    variant="outline"
                    className={clasesMesa}
                  >
                    <UtensilsCrossed className="w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                    <p className="text-base sm:text-lg font-bold">{numeroMesa}</p>
                    <p className="text-[10px] sm:text-xs leading-tight">
                      {ocupada ? (
                        esMiMesa ? 'Mi Mesa' : `${meseroAsignado.split(' ')[0]}`
                      ) : 'Libre'}
                    </p>
                    {ocupada && mesaData.total && (
                      <p className="text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1">
                        ${mesaData.total.toLocaleString()}
                      </p>
                    )}
                    {ocupada && !esMiMesa && (
                      <p className="text-[9px] sm:text-xs opacity-60 mt-0.5 sm:mt-1">
                        🔒
                      </p>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Pedido */}
      {mostrarPedido && (
        <ModalPedido
          pisoActual={pisoActual}
          mesaSeleccionada={mesaSeleccionada}
          mesas={mesas}
          setMesas={guardarMesas}
          onCerrar={cerrarPedido}
          onAbrirCobro={abrirCobro}
          user={user}
          saboresSopas={saboresSopas}
          precioSopas={precioSopas}
        />
      )}

      {/* Modal de Cobro */}
      {mostrarCobro && mesaSeleccionada && (
        <ModalCobro
          pisoActual={pisoActual}
          mesaSeleccionada={mesaSeleccionada}
          mesaData={mesas[`${pisoActual}-${mesaSeleccionada}`]}
          onCerrar={() => setMostrarCobro(false)}
          onProcesarCobro={(mesaData) => procesarCobro(`${pisoActual}-${mesaSeleccionada}`, mesaData)}
        />
      )}
    </div>
  );
}

function CajeraDashboard({ user, onLogout }) {
  const [ventasHoy, setVentasHoy] = useState([]);
  const [saboresSopas, setSaboresSopas] = useState([]);
  const [precioSopas, setPrecioSopas] = useState(MENU_DATA.sopas.price);
  const [nuevoSabor, setNuevoSabor] = useState('');
  const [mostrarAgregarSabor, setMostrarAgregarSabor] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [busquedaMesa, setBusquedaMesa] = useState('');
  const [mostrarDetalleVenta, setMostrarDetalleVenta] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [fechaApertura, setFechaApertura] = useState(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [reporteCierre, setReporteCierre] = useState(null);
  const [vistaActual, setVistaActual] = useState('ventas'); // 'ventas' o 'mesas'
  const [numeroWhatsApp, setNumeroWhatsApp] = useState('');
  const [mostrarConfigWhatsApp, setMostrarConfigWhatsApp] = useState(false);

  const cargarDatos = React.useCallback(() => {
    try {
      const ventasGuardadas = localStorage.getItem('santandereano_ventas');
      const saboresGuardados = localStorage.getItem('santandereano_sabores_sopas');
      
      if (ventasGuardadas) {
        setVentasHoy(JSON.parse(ventasGuardadas));
      }
      
      if (saboresGuardados) {
        setSaboresSopas(JSON.parse(saboresGuardados));
      } else {
        const saboresDefault = ['Sopa de costilla', 'Sancocho'];
        setSaboresSopas(saboresDefault);
        localStorage.setItem('santandereano_sabores_sopas', JSON.stringify(saboresDefault));
      }
      
      const precioGuardado = localStorage.getItem('santandereano_precio_sopas');
      if (precioGuardado) {
        setPrecioSopas(parseInt(precioGuardado));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
    const estadoCaja = localStorage.getItem('santandereano_caja_estado');
    if (estadoCaja) {
      const estado = JSON.parse(estadoCaja);
      setCajaAbierta(estado.abierta);
      setFechaApertura(estado.fechaApertura);
    }
    
    const handleStorageChange = () => cargarDatos();
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        cargarDatos();
        const estadoCaja = localStorage.getItem('santandereano_caja_estado');
        if (estadoCaja) {
          const estado = JSON.parse(estadoCaja);
          setCajaAbierta(estado.abierta);
          setFechaApertura(estado.fechaApertura);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', cargarDatos);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(() => {
      cargarDatos();
      const estadoCaja = localStorage.getItem('santandereano_caja_estado');
      if (estadoCaja) {
        const estado = JSON.parse(estadoCaja);
        setCajaAbierta(estado.abierta);
        setFechaApertura(estado.fechaApertura);
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', cargarDatos);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [cargarDatos]);

  const abrirCaja = () => {
    const ahora = new Date().toISOString();
    setCajaAbierta(true);
    setFechaApertura(ahora);
    localStorage.setItem('santandereano_caja_estado', JSON.stringify({
      abierta: true,
      fechaApertura: ahora,
      cajero: user.name
    }));
    alert(`✅ Caja abierta exitosamente\nCajero: ${user.name}\nHora: ${new Date(ahora).toLocaleString()}`);
  };

  const cerrarCaja = () => {
    const ventasDelDia = filtrarVentasDelDia();
    const reporte = generarReporte(ventasDelDia);
    setReporteCierre(reporte);
    setMostrarReporte(true);
  };

  const confirmarCierreCaja = () => {
    // Guardar reporte en historial
    const historialReportes = JSON.parse(localStorage.getItem('santandereano_historial_cierres') || '[]');
    historialReportes.push({
      ...reporteCierre,
      id: Date.now()
    });
    localStorage.setItem('santandereano_historial_cierres', JSON.stringify(historialReportes));
    
    // Generar PDF
    const pdf = generarReportePDF(reporteCierre);
    
    // Si hay número de WhatsApp configurado, enviar
    const numeroGuardado = localStorage.getItem('santandereano_whatsapp_numero');
    if (numeroGuardado) {
      enviarReportePorWhatsApp(pdf, numeroGuardado);
    } else {
      // Solo descargar el PDF
      pdf.save(`Reporte_Cierre_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    
    setCajaAbierta(false);
    setFechaApertura(null);
    setMostrarReporte(false);
    setReporteCierre(null);
    localStorage.setItem('santandereano_caja_estado', JSON.stringify({
      abierta: false,
      fechaApertura: null
    }));
    
    alert('✅ Caja cerrada exitosamente. El reporte ha sido generado en PDF.');
  };

  const guardarNumeroWhatsApp = () => {
    if (!numeroWhatsApp.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }
    
    const numeroLimpio = numeroWhatsApp.replace(/\D/g, '');
    if (numeroLimpio.length < 10) {
      alert('Número de teléfono inválido');
      return;
    }
    
    localStorage.setItem('santandereano_whatsapp_numero', numeroLimpio);
    setMostrarConfigWhatsApp(false);
    alert('✅ Número de WhatsApp guardado exitosamente');
  };

  const filtrarVentasDelDia = () => {
    if (!fechaApertura) return [];
    const inicioTurno = new Date(fechaApertura);
    return ventasHoy.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= inicioTurno;
    });
  };

  const generarReporte = (ventas) => {
    const total = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const porMetodo = ventas.reduce((acc, venta) => {
      const metodo = venta.metodoPago || 'efectivo';
      acc[metodo] = (acc[metodo] || 0) + venta.total;
      return acc;
    }, {});
    
    // Análisis por categorías y productos
    const categorias = {
      'Picadas': { cantidad: 0, ingresos: 0, productos: {} },
      'Gallina': { cantidad: 0, ingresos: 0, productos: {} },
      'Sopas': { cantidad: 0, ingresos: 0, productos: {} },
      'Bebidas': { cantidad: 0, ingresos: 0, productos: {} },
      'Adicionales': { cantidad: 0, ingresos: 0, productos: {} }
    };
    
    ventas.forEach(venta => {
      venta.pedidos?.forEach(pedido => {
        const cantidad = pedido.cantidad;
        const precio = pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem;
        const subtotal = cantidad * precio;
        
        let categoria = '';
        let nombreProducto = '';
        
        if (pedido.tipo === 'picada') {
          categoria = 'Picadas';
          nombreProducto = `Picada ${pedido.size}`;
        } else if (pedido.tipo === 'gallina') {
          categoria = 'Gallina';
          nombreProducto = pedido.nombre;
        } else if (pedido.tipo === 'sopa') {
          categoria = 'Sopas';
          nombreProducto = pedido.nombre;
        } else if (pedido.tipo === 'bebida') {
          categoria = 'Bebidas';
          nombreProducto = pedido.nombre;
        } else if (pedido.tipo === 'adicional') {
          categoria = 'Adicionales';
          nombreProducto = pedido.nombre;
        }
        
        if (categoria && categorias[categoria]) {
          categorias[categoria].cantidad += cantidad;
          categorias[categoria].ingresos += subtotal;
          
          if (!categorias[categoria].productos[nombreProducto]) {
            categorias[categoria].productos[nombreProducto] = {
              cantidad: 0,
              ingresos: 0,
              precioUnitario: precio
            };
          }
          categorias[categoria].productos[nombreProducto].cantidad += cantidad;
          categorias[categoria].productos[nombreProducto].ingresos += subtotal;
        }
      });
    });
    
    // Calcular porcentajes
    Object.keys(categorias).forEach(cat => {
      categorias[cat].porcentaje = total > 0 ? ((categorias[cat].ingresos / total) * 100).toFixed(1) : 0;
    });
    
    return {
      fecha: new Date().toLocaleString(),
      turnoInicio: new Date(fechaApertura).toLocaleString(),
      turnoFin: new Date().toLocaleString(),
      totalVentas: total,
      cantidadOrdenes: ventas.length,
      ventasPorMetodo: porMetodo,
      cajero: user.name,
      categorias: categorias
    };
  };

  const agregarSabor = () => {
    if (!nuevoSabor.trim()) {
      alert('Ingrese un nombre para el sabor');
      return;
    }
    
    if (saboresSopas.includes(nuevoSabor.trim())) {
      alert('Este sabor ya existe');
      return;
    }
    
    const nuevosSabores = [...saboresSopas, nuevoSabor.trim()];
    setSaboresSopas(nuevosSabores);
    localStorage.setItem('santandereano_sabores_sopas', JSON.stringify(nuevosSabores));
    setNuevoSabor('');
    setMostrarAgregarSabor(false);
  };

  const eliminarSabor = (sabor) => {
    if (confirm(`¿Está seguro de eliminar "${sabor}"?`)) {
      const nuevosSabores = saboresSopas.filter(s => s !== sabor);
      setSaboresSopas(nuevosSabores);
      localStorage.setItem('santandereano_sabores_sopas', JSON.stringify(nuevosSabores));
    }
  };

  const filtrarVentas = () => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    return ventasHoy.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      const coincideMesa = busquedaMesa === '' || venta.mesa.toLowerCase().includes(busquedaMesa.toLowerCase());
      
      switch (filtroFecha) {
        case 'hoy':
          return fechaVenta >= inicioHoy && coincideMesa;
        case 'semana':
          const inicioSemana = new Date(inicioHoy);
          inicioSemana.setDate(inicioSemana.getDate() - 7);
          return fechaVenta >= inicioSemana && coincideMesa;
        case 'mes':
          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          return fechaVenta >= inicioMes && coincideMesa;
        default:
          return coincideMesa;
      }
    });
  };

  // Mostrar solo ventas del turno actual si la caja está abierta
  const ventasFiltradas = cajaAbierta ? filtrarVentasDelDia() : filtrarVentas();
  const totalVentas = ventasFiltradas.reduce((sum, venta) => sum + venta.total, 0);
  const ventasPorMetodo = ventasFiltradas.reduce((acc, venta) => {
    const metodo = venta.metodoPago || 'efectivo';
    acc[metodo] = (acc[metodo] || 0) + venta.total;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-red-900/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Santandereano SAS
                </h1>
                <p className="text-sm text-green-300">
                  Panel de Caja
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Caja</p>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Selector de Vista */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setVistaActual('ventas')}
                className={`h-16 flex flex-col items-center justify-center transition-all ${
                  vistaActual === 'ventas'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-900/20'
                }`}
              >
                <Receipt className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Ventas y Caja</span>
              </Button>
              <Button
                onClick={() => setVistaActual('mesas')}
                className={`h-16 flex flex-col items-center justify-center transition-all ${
                  vistaActual === 'mesas'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-900/20'
                }`}
              >
                <UtensilsCrossed className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Vista de Mesas</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {vistaActual === 'mesas' ? (
          <CajeroMesasView />
        ) : (
          <>
        {/* Botones de Apertura/Cierre de Caja */}
        <Card className={`border-2 shadow-xl ${
          cajaAbierta 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  cajaAbierta ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {cajaAbierta ? (
                    <span className="text-3xl">🔓</span>
                  ) : (
                    <span className="text-3xl">🔒</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
                  </h3>
                  {cajaAbierta ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>📅 Apertura: {new Date(fechaApertura).toLocaleString()}</p>
                      <p>💰 Ventas del turno: {filtrarVentasDelDia().length} órdenes</p>
                      <p>💵 Total acumulado: ${filtrarVentasDelDia().reduce((sum, v) => sum + v.total, 0).toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Debe abrir la caja para comenzar a registrar ventas</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                {!cajaAbierta ? (
                  <Button
                    onClick={abrirCaja}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                  >
                    🔓 Abrir Caja
                  </Button>
                ) : (
                  <Button
                    onClick={cerrarCaja}
                    disabled={filtrarVentasDelDia().length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🔒 Cerrar Caja y Ver Reporte
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas Rápidas - Solo ventas del turno actual */}
        {cajaAbierta && (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-4">
            <p className="text-blue-800 font-semibold text-center">
              📊 Mostrando solo ventas del turno actual (desde {new Date(fechaApertura).toLocaleTimeString()})
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-white/90 border-green-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">{cajaAbierta ? 'Total Turno' : 'Total Ventas'}</p>
                  <p className="text-3xl font-bold text-gray-900">${totalVentas.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-blue-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Órdenes</p>
                  <p className="text-3xl font-bold text-gray-900">{ventasFiltradas.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-purple-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-medium">Efectivo</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo.efectivo || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-orange-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm font-medium">Tarjeta</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo.tarjeta || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-pink-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-700 text-sm font-medium">Nequi</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo['transferencia - Nequi'] || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-red-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium">Daviplata</p>
                  <p className="text-3xl font-bold text-gray-900">${(ventasPorMetodo['transferencia - Daviplata'] || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuración de WhatsApp */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-400" />
                Configuración de WhatsApp
              </CardTitle>
              <Button
                onClick={() => {
                  const numeroGuardado = localStorage.getItem('santandereano_whatsapp_numero');
                  setNumeroWhatsApp(numeroGuardado || '');
                  setMostrarConfigWhatsApp(true);
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Configurar Número
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">Número configurado:</p>
                  <p className="text-gray-300 text-sm mt-1">
                    {localStorage.getItem('santandereano_whatsapp_numero') 
                      ? `+57 ${localStorage.getItem('santandereano_whatsapp_numero')}` 
                      : 'No configurado'}
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-400 text-xs mt-3">
                💡 Al cerrar la caja, el reporte se generará en PDF y se enviará automáticamente al número configurado por WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Sabores de Sopas */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-2">🍲</span>
                Gestión de Sopas
              </CardTitle>
              <Button
                onClick={() => setMostrarAgregarSabor(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Sabor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Precio actual de sopas:</span>
                <span className="text-2xl font-bold text-blue-400">${precioSopas.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {saboresSopas.map((sabor, index) => (
                <div key={index} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-white font-medium">{sabor}</span>
                  <Button
                    onClick={() => eliminarSabor(sabor)}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros y Búsqueda */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-white font-medium">Período:</label>
                <div className="flex space-x-2">
                  {[
                    { id: 'hoy', label: 'Hoy' },
                    { id: 'semana', label: 'Semana' },
                    { id: 'mes', label: 'Mes' },
                    { id: 'todo', label: 'Todo' }
                  ].map((periodo) => (
                    <Button
                      key={periodo.id}
                      onClick={() => setFiltroFecha(periodo.id)}
                      variant={filtroFecha === periodo.id ? "default" : "outline"}
                      size="sm"
                      className={filtroFecha === periodo.id 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                        : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                      }
                    >
                      {periodo.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-1">
                <label className="text-white font-medium">Buscar:</label>
                <Input
                  value={busquedaMesa}
                  onChange={(e) => setBusquedaMesa(e.target.value)}
                  placeholder="Buscar por mesa..."
                  className="bg-white/5 border-red-500/30 text-white max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ventas */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-green-400" />
                {cajaAbierta ? 'Ventas del Turno Actual' : 'Historial de Ventas'} ({ventasFiltradas.length})
              </div>
              <Badge className="bg-blue-500 text-white">
                🔄 Actualización automática
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ventasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No hay ventas para mostrar</p>
                </div>
              ) : (
                ventasFiltradas.map((venta) => (
                  <div key={venta.id} className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-red-500/20 hover:border-red-500/40 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">Mesa {venta.mesa}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(venta.fecha).toLocaleString()} • {venta.mesero}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">${venta.total.toLocaleString()}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`text-xs ${
                            venta.metodoPago === 'efectivo' ? 'bg-green-500/20 text-green-400' :
                            venta.metodoPago === 'tarjeta' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {venta.metodoPago}
                          </Badge>
                          <Button
                            onClick={() => setMostrarDetalleVenta(venta)}
                            variant="outline"
                            size="sm"
                            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                          >
                            Ver Detalle
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Modal Agregar Sabor */}
      {mostrarAgregarSabor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-xl border border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">Agregar Nuevo Sabor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-300 mb-2">Nombre del Sabor</label>
                <Input
                  value={nuevoSabor}
                  onChange={(e) => setNuevoSabor(e.target.value)}
                  placeholder="Ej: Sopa de mondongo"
                  className="bg-white/5 border-red-500/30 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && agregarSabor()}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setMostrarAgregarSabor(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={agregarSabor}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detalle de Venta */}
      {mostrarDetalleVenta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-xl border border-red-500/30">
            <CardHeader className="border-b border-red-500/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Detalle de Venta - Mesa {mostrarDetalleVenta.mesa}</CardTitle>
                <Button
                  onClick={() => setMostrarDetalleVenta(null)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Fecha:</p>
                    <p className="text-white font-medium">{new Date(mostrarDetalleVenta.fecha).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mesero:</p>
                    <p className="text-white font-medium">{mostrarDetalleVenta.mesero}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Método de Pago:</p>
                    <p className="text-white font-medium">{mostrarDetalleVenta.metodoPago}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total:</p>
                    <p className="text-green-400 font-bold text-lg">${mostrarDetalleVenta.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <Separator className="bg-red-500/20" />
                
                <div>
                  <h4 className="text-white font-semibold mb-3">Productos:</h4>
                  <div className="space-y-2">
                    {mostrarDetalleVenta.pedidos?.map((pedido, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <div>
                          <p className="text-white font-medium">
                            {pedido.cantidad}x {pedido.tipo === 'picada' ? `Picada ${pedido.size}` : pedido.nombre}
                          </p>
                          {pedido.tipo === 'picada' && (
                            <p className="text-gray-400 text-sm">
                              {pedido.carnes?.join(', ')} • {pedido.termino}
                            </p>
                          )}
                        </div>
                        <p className="text-green-400 font-bold">
                          ${((pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem) * pedido.cantidad).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {mostrarDetalleVenta.notaAdicional && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Nota Adicional:</h4>
                    <p className="text-gray-300 bg-white/5 rounded-lg p-3">{mostrarDetalleVenta.notaAdicional}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Configuración WhatsApp */}
      {mostrarConfigWhatsApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gradient-to-br from-slate-900/95 via-green-900/95 to-slate-900/95 backdrop-blur-xl border border-green-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-green-400" />
                  Configurar WhatsApp
                </CardTitle>
                <Button
                  onClick={() => setMostrarConfigWhatsApp(false)}
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
                  value={numeroWhatsApp}
                  onChange={(e) => setNumeroWhatsApp(e.target.value)}
                  placeholder="Ej: 3001234567"
                  className="bg-white/5 border-green-500/30 text-white"
                />
                <p className="text-gray-400 text-xs mt-2">
                  💡 Ingrese el número sin espacios ni guiones. El código de país (+57) se agregará automáticamente.
                </p>
              </div>
              
              <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <p className="text-blue-200 text-sm">
                  ℹ️ Al cerrar la caja, el reporte se generará en PDF y se abrirá WhatsApp Web automáticamente para enviarlo al número configurado.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => setMostrarConfigWhatsApp(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={guardarNumeroWhatsApp}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Reporte de Cierre */}
      {mostrarReporte && reporteCierre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden bg-white shadow-2xl">
            <CardHeader className="bg-red-600 text-white">
              <CardTitle className="text-center">📊 Reporte General de Ventas - Cierre de Caja</CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
              <div className="space-y-6">
                {/* Balance General */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">📊 Balance General del Día</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Cajero:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.cajero}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Apertura:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.turnoInicio}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cierre:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.turnoFin}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Transacciones:</p>
                      <p className="font-semibold text-gray-900">{reporteCierre.cantidadOrdenes}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-800">Ingresos Totales:</span>
                      <span className="text-3xl font-bold text-green-600">${reporteCierre.totalVentas.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Ventas por Categorías */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">🏷️ Ventas por Categorías</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(reporteCierre.categorias).map(([categoria, datos]: [string, any]) => (
                      datos.cantidad > 0 && (
                        <div key={categoria} className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-2">{categoria}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Cantidad:</span>
                              <span className="font-medium">{datos.cantidad}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ingresos:</span>
                              <span className="font-medium text-green-600">${datos.ingresos.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Participación:</span>
                              <span className="font-medium text-blue-600">{datos.porcentaje}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Detalle por Productos */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">🍽️ Detalle por Productos</h3>
                  <div className="space-y-4">
                    {Object.entries(reporteCierre.categorias).map(([categoria, datos]: [string, any]) => (
                      datos.cantidad > 0 && (
                        <div key={categoria} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3 bg-gray-100 p-2 rounded">{categoria}</h4>
                          <div className="grid gap-2">
                            {Object.entries(datos.productos).map(([producto, info]: [string, any]) => (
                              <div key={producto} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                <div>
                                  <span className="font-medium">{producto}</span>
                                  <span className="text-gray-500 text-sm ml-2">(${info.precioUnitario.toLocaleString()} c/u)</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">Cant: {info.cantidad}</div>
                                  <div className="text-green-600 font-semibold">${info.ingresos.toLocaleString()}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">💳 Métodos de Pago</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(reporteCierre.ventasPorMetodo).map(([metodo, monto]: [string, any]) => (
                      <div key={metodo} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-center">
                          <p className="text-gray-600 capitalize text-sm">{metodo}</p>
                          <p className="font-bold text-lg text-gray-900">${(monto as number).toLocaleString()}</p>
                          <p className="text-xs text-blue-600">
                            {(((monto as number) / reporteCierre.totalVentas) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen de Bebidas vs Alimentos */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">🍺 Resumen Bebidas vs Alimentos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800">Bebidas</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {reporteCierre.categorias.Bebidas?.cantidad || 0}
                      </p>
                      <p className="text-sm text-blue-600">
                        ${(reporteCierre.categorias.Bebidas?.ingresos || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-800">Alimentos</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {(reporteCierre.categorias.Picadas?.cantidad || 0) + 
                         (reporteCierre.categorias.Gallina?.cantidad || 0) + 
                         (reporteCierre.categorias.Sopas?.cantidad || 0) + 
                         (reporteCierre.categorias.Adicionales?.cantidad || 0)}
                      </p>
                      <p className="text-sm text-orange-600">
                        ${((reporteCierre.categorias.Picadas?.ingresos || 0) + 
                           (reporteCierre.categorias.Gallina?.ingresos || 0) + 
                           (reporteCierre.categorias.Sopas?.ingresos || 0) + 
                           (reporteCierre.categorias.Adicionales?.ingresos || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => setMostrarReporte(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmarCierreCaja}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Confirmar y Generar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function DueñoDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/10 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Panel de Administración - {user.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-gray-300">
            <p>Próximamente...</p>
            <Button 
              onClick={onLogout}
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

function ModalPedido({ pisoActual, mesaSeleccionada, mesas, setMesas, onCerrar, onAbrirCobro, user, saboresSopas, precioSopas }) {
  const mesaKey = `${pisoActual}-${mesaSeleccionada}`;
  const mesaData = mesas[mesaKey] || { pedidos: [], total: 0, mesero: user.name };
  const [pedidos, setPedidos] = useState(mesaData.pedidos || []);
  const [categoriaActual, setCategoriaActual] = useState('picadas');
  
  // Estados para picadas
  const [picadaConfig, setPicadaConfig] = useState({
    size: '',
    carnes: [],
    termino: '',
    precio: ''
  });
  
  // Estados para otros productos
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [terminoSeleccionado, setTerminoSeleccionado] = useState('');
  const [saborSeleccionado, setSaborSeleccionado] = useState('');
  const [categoriaBebidasActual, setCategoriaBebidasActual] = useState('');
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState('');
  const [adicionalSeleccionado, setAdicionalSeleccionado] = useState('');

  const calcularTotal = (listaPedidos) => {
    return listaPedidos.reduce((total, pedido) => {
      const precio = pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem;
      return total + (precio * pedido.cantidad);
    }, 0);
  };

  const agregarPedido = (nuevoPedido) => {
    // Crear una clave única para identificar productos iguales
    const claveProducto = nuevoPedido.tipo === 'picada' 
      ? `${nuevoPedido.tipo}-${nuevoPedido.size}-${nuevoPedido.carnes?.sort().join(',')}-${nuevoPedido.termino}`
      : `${nuevoPedido.tipo}-${nuevoPedido.nombre}`;
    
    // Buscar si ya existe el mismo producto
    const productoExistente = pedidos.find(p => {
      const claveExistente = p.tipo === 'picada'
        ? `${p.tipo}-${p.size}-${p.carnes?.sort().join(',')}-${p.termino}`
        : `${p.tipo}-${p.nombre}`;
      return claveExistente === claveProducto;
    });
    
    if (productoExistente) {
      // Si existe, incrementar la cantidad
      const nuevosPedidos = pedidos.map(p => 
        p.id === productoExistente.id 
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      );
      setPedidos(nuevosPedidos);
    } else {
      // Si no existe, agregar como nuevo
      const pedidoConId = { ...nuevoPedido, id: Date.now(), cantidad: 1 };
      const nuevosPedidos = [...pedidos, pedidoConId];
      setPedidos(nuevosPedidos);
    }
    
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setPicadaConfig({ size: '', carnes: [], termino: '', precio: '' });
    setProductoSeleccionado(null);
    setTerminoSeleccionado('');
    setSaborSeleccionado('');
    // NO limpiar categoriaBebidasActual y bebidaSeleccionada para mantener la categoría abierta
    setAdicionalSeleccionado('');
  };

  const eliminarPedido = (id) => {
    setPedidos(pedidos.filter(p => p.id !== id));
  };

  const cambiarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setPedidos(pedidos.map(p => p.id === id ? { ...p, cantidad: nuevaCantidad } : p));
  };

  const guardarPedido = () => {
    const total = calcularTotal(pedidos);
    const nuevasMesas = {
      ...mesas,
      [mesaKey]: {
        pedidos,
        total,
        mesero: user.name,
        fechaCreacion: mesaData.fechaCreacion || new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      }
    };
    setMesas(nuevasMesas);
    onCerrar();
  };

  const manejarPicada = () => {
    if (!picadaConfig.size || picadaConfig.carnes.length === 0 || !picadaConfig.termino || !picadaConfig.precio) {
      alert('Complete todos los campos de la picada');
      return;
    }
    agregarPedido({
      tipo: 'picada',
      size: picadaConfig.size,
      carnes: picadaConfig.carnes,
      termino: picadaConfig.termino,
      precio: picadaConfig.precio
    });
  };

  const manejarGallina = () => {
    if (!productoSeleccionado || !terminoSeleccionado) {
      alert('Seleccione producto y término');
      return;
    }
    agregarPedido({
      tipo: 'gallina',
      nombre: productoSeleccionado.name,
      termino: terminoSeleccionado,
      precioItem: productoSeleccionado.price
    });
  };

  const manejarSopa = () => {
    if (!saborSeleccionado) {
      alert('Seleccione un sabor');
      return;
    }
    agregarPedido({
      tipo: 'sopa',
      nombre: saborSeleccionado,
      precioItem: precioSopas
    });
  };

  const manejarBebida = () => {
    if (!bebidaSeleccionada) {
      alert('Seleccione una bebida');
      return;
    }
    const bebida = MENU_DATA.bebidas[categoriaBebidasActual].find(b => b.name === bebidaSeleccionada);
    agregarPedido({
      tipo: 'bebida',
      nombre: bebidaSeleccionada,
      categoria: categoriaBebidasActual,
      precioItem: bebida.price
    });
  };

  const manejarAdicional = () => {
    if (!adicionalSeleccionado) {
      alert('Seleccione un adicional');
      return;
    }
    const adicional = MENU_DATA.adicionales.find(a => a.name === adicionalSeleccionado);
    agregarPedido({
      tipo: 'adicional',
      nombre: adicionalSeleccionado,
      precioItem: adicional.price
    });
  };

  const toggleCarne = (carne) => {
    const nuevasCarnes = picadaConfig.carnes.includes(carne)
      ? picadaConfig.carnes.filter(c => c !== carne)
      : [...picadaConfig.carnes, carne];
    setPicadaConfig({ ...picadaConfig, carnes: nuevasCarnes });
  };

  const categorias = [
    { id: 'picadas', nombre: 'Picadas', icono: '🥩', color: 'from-red-500 to-red-600' },
    { id: 'gallina', nombre: 'Gallina', icono: '🐔', color: 'from-yellow-500 to-orange-500' },
    { id: 'sopas', nombre: 'Sopas', icono: '🍲', color: 'from-green-500 to-green-600' },
    { id: 'bebidas', nombre: 'Bebidas', icono: '🥤', color: 'from-blue-500 to-blue-600' },
    { id: 'adicionales', nombre: 'Adicionales', icono: '🍟', color: 'from-purple-500 to-purple-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start sm:items-center justify-center p-0 sm:p-4">
        <Card className="w-full sm:max-w-7xl min-h-screen sm:min-h-0 sm:max-h-[95vh] bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-xl border-0 sm:border border-red-500/30 shadow-2xl sm:rounded-lg rounded-none">
        {/* Header */}
        <CardHeader className="border-b border-red-500/30 bg-gradient-to-r from-red-600/20 to-red-800/20 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base sm:text-xl">Mesa {mesaSeleccionada}</CardTitle>
                <p className="text-red-300 text-xs sm:text-sm">Piso {pisoActual} • {user.name}</p>
              </div>
            </div>
            <Button
              onClick={onCerrar}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex flex-col lg:grid lg:grid-cols-3 min-h-[calc(100vh-60px)] sm:min-h-0 sm:h-[calc(95vh-120px)]">
            {/* Panel de Categorías */}
            <div className="lg:col-span-2 p-3 sm:p-6 overflow-y-auto flex-1 lg:border-r border-red-500/20">
              {/* Selector de Categorías */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
                {categorias.map((categoria) => (
                  <Button
                    key={categoria.id}
                    onClick={() => setCategoriaActual(categoria.id)}
                    className={`h-14 sm:h-20 flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 transition-all duration-300 transform hover:scale-105 ${
                      categoriaActual === categoria.id
                        ? `bg-gradient-to-br ${categoria.color} text-white shadow-lg`
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{categoria.icono}</span>
                    <span className="text-[10px] sm:text-xs font-medium">{categoria.nombre}</span>
                  </Button>
                ))}
              </div>

              {/* Contenido por Categoría */}
              <div className="space-y-3 sm:space-y-6">
                {categoriaActual === 'picadas' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🥩</span> Configurar Picada
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2 sm:mb-3">Tamaño</label>
                        <div className="grid grid-cols-2 gap-2">
                          {MENU_DATA.picadas.sizes.map((size) => (
                            <Button
                              key={size}
                              onClick={() => setPicadaConfig({...picadaConfig, size})}
                              variant={picadaConfig.size === size ? "default" : "outline"}
                              className={`h-10 sm:h-12 text-xs sm:text-sm ${
                                picadaConfig.size === size 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                  : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {size}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2 sm:mb-3">Término</label>
                        <div className="grid grid-cols-3 gap-2">
                          {MENU_DATA.picadas.terminos.map((termino) => (
                            <Button
                              key={termino}
                              onClick={() => setPicadaConfig({...picadaConfig, termino})}
                              variant={picadaConfig.termino === termino ? "default" : "outline"}
                              className={`h-10 sm:h-12 text-[10px] sm:text-xs ${
                                picadaConfig.termino === termino 
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                                  : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {termino}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2 sm:mb-3">Carnes (Seleccione múltiples)</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {MENU_DATA.picadas.carnes.map((carne) => (
                          <Button
                            key={carne}
                            onClick={() => toggleCarne(carne)}
                            className={`h-10 sm:h-12 text-xs sm:text-sm transition-all duration-200 ${
                              picadaConfig.carnes.includes(carne)
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {carne}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2">Precio</label>
                        <Input
                          type="text"
                          value={picadaConfig.precio ? parseInt(picadaConfig.precio).toLocaleString() : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setPicadaConfig({...picadaConfig, precio: value});
                          }}
                          placeholder="Ej: 25.000"
                          className="bg-white/5 border-red-500/30 text-white h-10 sm:h-12 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={manejarPicada}
                          className="w-full h-10 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {categoriaActual === 'gallina' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🐔</span> Productos de Gallina
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      {MENU_DATA.gallina.productos.map((producto) => (
                        <Button
                          key={producto.name}
                          onClick={() => {
                            agregarPedido({
                              tipo: 'gallina',
                              nombre: producto.name,
                              termino: 'Jugoso',
                              precioItem: producto.price
                            });
                          }}
                          className="h-12 sm:h-16 flex justify-between items-center p-3 sm:p-4 text-left bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                        >
                          <span className="font-medium">{producto.name}</span>
                          <span className="text-green-400 font-bold">${producto.price.toLocaleString()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {categoriaActual === 'sopas' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🍲</span> Sopas - ${precioSopas.toLocaleString()}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {saboresSopas.map((sabor) => (
                        <Button
                          key={sabor}
                          onClick={() => {
                            agregarPedido({
                              tipo: 'sopa',
                              nombre: sabor,
                              precioItem: precioSopas
                            });
                          }}
                          className="h-12 sm:h-14 text-left p-3 sm:p-4 bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                        >
                          {sabor}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {categoriaActual === 'bebidas' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🥤</span> Bebidas
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {Object.keys(MENU_DATA.bebidas).map((categoria) => (
                        <div key={categoria}>
                          <Button
                            onClick={() => {
                              setCategoriaBebidasActual(categoria === categoriaBebidasActual ? '' : categoria);
                              setBebidaSeleccionada('');
                            }}
                            className={`w-full h-10 sm:h-12 mb-2 sm:mb-3 text-left text-xs sm:text-sm ${
                              categoriaBebidasActual === categoria
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-white/5 border-red-500/30 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {categoria}
                          </Button>
                          
                          {categoriaBebidasActual === categoria && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2 sm:ml-4">
                              {MENU_DATA.bebidas[categoria].map((bebida) => (
                                <Button
                                  key={bebida.name}
                                  onClick={() => {
                                    agregarPedido({
                                      tipo: 'bebida',
                                      nombre: bebida.name,
                                      categoria: categoria,
                                      precioItem: bebida.price
                                    });
                                  }}
                                  className="h-10 sm:h-12 flex justify-between items-center p-2 sm:p-3 text-xs sm:text-sm bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-500 hover:text-white transition-all duration-200"
                                >
                                  <span>{bebida.name}</span>
                                  <span className="text-green-400 font-bold">${bebida.price.toLocaleString()}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {categoriaActual === 'adicionales' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <span className="text-xl sm:text-2xl mr-2">🍟</span> Adicionales
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {MENU_DATA.adicionales.map((adicional) => (
                        <Button
                          key={adicional.name}
                          onClick={() => {
                            agregarPedido({
                              tipo: 'adicional',
                              nombre: adicional.name,
                              precioItem: adicional.price
                            });
                          }}
                          className="h-12 sm:h-14 flex justify-between items-center p-3 sm:p-4 bg-white/5 border-red-500/30 text-gray-300 hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-600 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                        >
                          <span>{adicional.name}</span>
                          <span className="text-green-400 font-bold">${adicional.price.toLocaleString()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de Pedido */}
            <div className="p-3 sm:p-6 bg-gradient-to-b from-slate-800/50 to-slate-900/50 flex-shrink-0 border-t lg:border-t-0 border-red-500/20">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Pedido Actual</h3>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                    {pedidos.length} items
                  </Badge>
                </div>

                <div className="space-y-2 sm:space-y-3 max-h-[30vh] sm:max-h-96 overflow-y-auto">
                  {pedidos.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <UtensilsCrossed className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2 sm:mb-3" />
                      <p className="text-gray-400 text-sm">No hay items</p>
                    </div>
                  ) : (
                    pedidos.map((pedido) => (
                      <div key={pedido.id} className="bg-white/5 rounded-lg p-2 sm:p-3 border border-red-500/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">
                              {pedido.tipo === 'picada' 
                                ? `Picada ${pedido.size}` 
                                : pedido.nombre
                              }
                            </p>
                            {pedido.tipo === 'picada' && (
                              <p className="text-gray-400 text-xs">
                                {pedido.carnes?.join(', ')} • {pedido.termino}
                              </p>
                            )}
                            {pedido.termino && pedido.tipo !== 'picada' && (
                              <p className="text-gray-400 text-xs">Término: {pedido.termino}</p>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => eliminarPedido(pedido.id)}
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => cambiarCantidad(pedido.id, pedido.cantidad - 1)}
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 border-red-500/50 text-red-400"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            
                            <span className="text-white font-medium w-8 text-center">
                              {pedido.cantidad}
                            </span>
                            
                            <Button
                              onClick={() => cambiarCantidad(pedido.id, pedido.cantidad + 1)}
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 border-green-500/50 text-green-400"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <p className="text-green-400 font-bold text-sm">
                            ${((pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem) * pedido.cantidad).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="bg-red-500/20" />

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30">
                    <span className="text-base sm:text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-400">
                      ${calcularTotal(pedidos).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <Button
                      onClick={guardarPedido}
                      className="h-10 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Guardar Pedido
                    </Button>
                    
                    {pedidos.length > 0 && (
                      <Button
                        onClick={() => {
                          const total = calcularTotal(pedidos);
                          const nuevasMesas = {
                            ...mesas,
                            [mesaKey]: {
                              pedidos,
                              total,
                              mesero: user.name,
                              fechaCreacion: mesaData.fechaCreacion || new Date().toISOString(),
                              fechaActualizacion: new Date().toISOString()
                            }
                          };
                          setMesas(nuevasMesas);
                          onAbrirCobro();
                        }}
                        className="h-10 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium text-sm sm:text-base"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Guardar y Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function ModalCobro({ pisoActual, mesaSeleccionada, mesaData, onCerrar, onProcesarCobro }) {
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipoTransferencia, setTipoTransferencia] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [notaAdicional, setNotaAdicional] = useState('');

  const total = mesaData?.total || 0;
  const cambio = montoPagado ? Math.max(0, parseInt(montoPagado.replace(/[^0-9]/g, '')) - total) : 0;

  const metodosPago = [
    { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: 'from-green-500 to-green-600' },
    { id: 'tarjeta', nombre: 'Tarjeta', icono: CreditCard, color: 'from-blue-500 to-blue-600' },
    { id: 'transferencia', nombre: 'Transferencia', icono: Smartphone, color: 'from-purple-500 to-purple-600' }
  ];

  const handleProcesarCobro = () => {
    if (metodoPago === 'efectivo' && !montoPagado) {
      alert('Ingrese el monto pagado');
      return;
    }

    if (metodoPago === 'efectivo' && parseInt(montoPagado.replace(/[^0-9]/g, '')) < total) {
      alert('El monto pagado es insuficiente');
      return;
    }

    if (metodoPago === 'transferencia' && !tipoTransferencia) {
      alert('Seleccione el tipo de transferencia (Nequi o Daviplata)');
      return;
    }

    const datosVenta = {
      ...mesaData,
      metodoPago: metodoPago === 'transferencia' ? `${metodoPago} - ${tipoTransferencia}` : metodoPago,
      montoPagado: metodoPago === 'efectivo' ? parseInt(montoPagado.replace(/[^0-9]/g, '')) : total,
      cambio: metodoPago === 'efectivo' ? cambio : 0,
      notaAdicional,
      total
    };

    onProcesarCobro(datosVenta);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-900/98 via-red-900/98 to-slate-900/98 backdrop-blur-xl border border-red-500/40 shadow-2xl">
        <CardHeader className="border-b border-red-500/30 bg-gradient-to-r from-red-600/20 to-red-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Procesar Cobro</CardTitle>
                <p className="text-red-300 text-sm">Mesa {mesaSeleccionada} • Piso {pisoActual}</p>
              </div>
            </div>
            <Button onClick={onCerrar} variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-red-500/20">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-red-400" />Resumen del Pedido
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mesaData?.pedidos?.map((pedido, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">
                      {pedido.cantidad}x {pedido.tipo === 'picada' ? `Picada ${pedido.size}` : pedido.nombre}
                    </span>
                    <span className="text-green-400 font-medium">
                      ${((pedido.tipo === 'picada' ? parseInt(pedido.precio) : pedido.precioItem) * pedido.cantidad).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-3 bg-red-500/20" />
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Subtotal:</span>
                <span className="text-xl font-bold text-white">${total.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-red-300 mb-3">Método de Pago</label>
              <div className="grid grid-cols-3 gap-3">
                {metodosPago.map((metodo) => {
                  const IconoMetodo = metodo.icono;
                  return (
                    <Button key={metodo.id} onClick={() => { setMetodoPago(metodo.id); setTipoTransferencia(''); }}
                      className={`h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-300 transform hover:scale-105 ${
                        metodoPago === metodo.id ? `bg-gradient-to-br ${metodo.color} text-white shadow-lg` : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                      }`}>
                      <IconoMetodo className="w-8 h-8" />
                      <span className="text-sm font-medium">{metodo.nombre}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {metodoPago === 'transferencia' && (
              <div>
                <label className="block text-sm font-medium text-red-300 mb-3">Tipo de Transferencia</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setTipoTransferencia('Nequi')}
                    className={`h-16 text-lg font-semibold transition-all duration-300 ${
                      tipoTransferencia === 'Nequi' ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                    }`}>
                    💜 Nequi
                  </Button>
                  <Button onClick={() => setTipoTransferencia('Daviplata')}
                    className={`h-16 text-lg font-semibold transition-all duration-300 ${
                      tipoTransferencia === 'Daviplata' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-red-500/20'
                    }`}>
                    ❤️ Daviplata
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/40">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Total a Pagar:</span>
                <span className="text-3xl font-bold text-green-400">${total.toLocaleString()}</span>
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div>
                <label className="block text-sm font-medium text-red-300 mb-2">Monto Recibido</label>
                <Input type="text" value={montoPagado ? parseInt(montoPagado.replace(/[^0-9]/g, '')).toLocaleString() : ''}
                  onChange={(e) => setMontoPagado(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ingrese el monto recibido" className="bg-white/5 border-red-500/30 text-white text-xl h-14 font-semibold" />
                {montoPagado && cambio >= 0 && (
                  <div className="mt-3 p-4 bg-blue-500/20 rounded-lg border border-blue-500/40">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 font-medium">Cambio a devolver:</span>
                      <span className="text-2xl font-bold text-blue-400">${cambio.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-red-300 mb-2">Nota Adicional (Opcional)</label>
              <Textarea value={notaAdicional} onChange={(e) => setNotaAdicional(e.target.value)}
                placeholder="Ej: Cliente solicitó factura, mesa compartida, etc." className="bg-white/5 border-red-500/30 text-white min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button onClick={onCerrar} variant="outline" className="h-14 border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white">Cancelar</Button>
              <Button onClick={handleProcesarCobro} className="h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg shadow-lg shadow-green-500/30">
                <CheckCircle className="w-5 h-5 mr-2" />Confirmar Cobro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}