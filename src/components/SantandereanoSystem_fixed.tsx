import React, { useState } from 'react';
import { User, Lock, ChefHat, LogOut, UtensilsCrossed, X, Trash2, Plus, Minus, Send, CheckCircle, Clock, Calculator, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Sistema de usuarios con localStorage
const getUsersFromStorage = () => {
  try {
    const users = localStorage.getItem('santandereano_users');
    return users ? JSON.parse(users) : getDefaultUsers();
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

const getDefaultUsers = () => {
  const defaultUsers = {
    admin: {
      email: 'admin@santandereano.com',
      password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      role: 'dueño',
      name: 'Administrador',
      salt: 'admin_salt',
      active: true,
      createdAt: new Date().toISOString()
    }
  };
  saveUsersToStorage(defaultUsers);
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
  
  if (users[email]) {
    throw new Error('El email ya está registrado');
  }
  
  if (!email.endsWith('@santandereano.com')) {
    throw new Error('El email debe terminar en @santandereano.com');
  }
  
  if (!isValidEmail(email)) {
    throw new Error('Email inválido');
  }
  
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  const salt = generateSalt();
  const hashedPassword = simpleHash(password, salt);
  
  users[email] = {
    email,
    password: hashedPassword,
    name,
    role: 'mesero', // Rol fijo asignado por el sistema
    salt,
    active: true,
    createdAt: new Date().toISOString()
  };
  
  saveUsersToStorage(users);
  return users[email];
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
      { name: '1/2 Gallina Asada', price: 45000 },
      { name: 'Gallina Entera', price: 90000 },
      { name: 'Pierna Pernil', price: 18000 },
      { name: 'Pechuga', price: 18000 },
      { name: 'Rabadilla', price: 18000 },
      { name: 'Ala', price: 10000 }
    ],
    terminos: ['Jugoso', '3/4', 'Bien cocido']
  },
  sopas: {
    price: 9000, // Precio fijo
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

  // Cargar usuario desde localStorage al iniciar
  React.useEffect(() => {
    const savedUser = localStorage.getItem('santandereano_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error cargando usuario:', error);
        localStorage.removeItem('santandereano_current_user');
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
    const user = users[email];
    
    if (user && user.active && verifyPassword(password, user.password, user.salt)) {
      const userData = { email, ...user };
      setCurrentUser(userData);
      localStorage.setItem('santandereano_current_user', JSON.stringify(userData));
      
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

  const handleLogout = () => {
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setRole('mesero');
    localStorage.removeItem('santandereano_current_user');
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

function LoginScreen({ email, setEmail, password, setPassword, role, setRole, handleLogin, isHovered, setIsHovered, isLoading, loginAttempts, isBlocked, blockTimeLeft, showRegister, setShowRegister, registerData, setRegisterData, handleRegister }) {
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
                placeholder="usuario@santandereano.com"
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
                    placeholder="usuario@santandereano.com"
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-white/5 border-red-900/30 pl-12 py-3 text-white placeholder-gray-500 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                    placeholder="••••••••"
                  />
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
        Panel Administrativo • Santandereano SAS © 2025
      </div>
    </div>
  );
}

// Paleta de colores predefinidos para meseros
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
  green: {
    bg: 'bg-green-600/30',
    border: 'border-green-600',
    shadow: 'shadow-green-600/20',
    text: 'text-green-300',
    bgLight: 'bg-green-600/10',
    borderLight: 'border-green-600/50',
    shadowLight: 'shadow-green-600/10',
    textLight: 'text-green-400'
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
  red: {
    bg: 'bg-red-600/30',
    border: 'border-red-600',
    shadow: 'shadow-red-600/20',
    text: 'text-red-300',
    bgLight: 'bg-red-600/10',
    borderLight: 'border-red-600/50',
    shadowLight: 'shadow-red-600/10',
    textLight: 'text-red-400'
  }
};

// Generar color único para cada mesero basado en su email
const generateMeseroColor = (email) => {
  const colorKeys = Object.keys(MESERO_COLORS);
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorKeys[Math.abs(hash) % colorKeys.length];
};

// Obtener configuración de color del mesero
const getMeseroColorConfig = (meseroName) => {
  const users = getUsersFromStorage();
  const mesero = Object.values(users).find(user => user.name === meseroName);
  const colorKey = mesero ? generateMeseroColor(mesero.email) : 'green';
  return MESERO_COLORS[colorKey] || MESERO_COLORS.green;
};

function MeseroDashboard({ user, onLogout }) {
  const [pisoActual, setPisoActual] = useState(1);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [mesas, setMesas] = useState({});
  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [saboresSopas, setSaboresSopas] = useState([]);

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
    setMostrarCobro(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-red-900/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Santandereano SAS
                </h1>
                <p className="text-sm text-red-300">
                  Panel de Mesero
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
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

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Selector de Pisos */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {PISOS.map((piso) => (
                <Button
                  key={piso.number}
                  onClick={() => setPisoActual(piso.number)}
                  variant={pisoActual === piso.number ? "default" : "outline"}
                  className={`flex-1 py-6 px-6 rounded-xl font-medium transition-all duration-300 ${
                    pisoActual === piso.number
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border-red-900/20'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold">Piso {piso.number}</p>
                    <p className="text-sm opacity-80">{piso.mesas} mesas</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leyenda de Colores */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600/20 border border-green-600 rounded"></div>
                <span className="text-gray-300">Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600/30 border border-blue-600 rounded"></div>
                <span className="text-gray-300">Mi Mesa</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-600/10 border border-purple-600/50 rounded"></div>
                <span className="text-gray-300">Otro Mesero</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Mesas */}
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white">Mesas - Piso {pisoActual}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                    <UtensilsCrossed className="w-6 h-6 mb-2" />
                    <p className="text-lg font-bold">{numeroMesa}</p>
                    <p className="text-xs">
                      {ocupada ? (
                        esMiMesa ? 'Mi Mesa' : `${meseroAsignado}`
                      ) : 'Disponible'}
                    </p>
                    {ocupada && mesaData.total && (
                      <p className="text-xs font-medium mt-1">
                        ${mesaData.total.toLocaleString()}
                      </p>
                    )}
                    {ocupada && !esMiMesa && (
                      <p className="text-xs opacity-60 mt-1">
                        🔒 Otro mesero
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/10 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Panel de Cajera - {user.name}
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

function ModalPedido({ pisoActual, mesaSeleccionada, mesas, setMesas, onCerrar, onAbrirCobro, user, saboresSopas }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-md border-red-900/20">
        <CardHeader className="border-b border-red-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Mesa {mesaSeleccionada}</CardTitle>
            <Button
              onClick={onCerrar}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <p className="text-white text-center">Modal de pedido - Próximamente...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ModalCobro({ pisoActual, mesaSeleccionada, mesaData, onCerrar, onProcesarCobro }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-md border-red-900/20">
        <CardHeader className="border-b border-red-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Procesar Cobro</CardTitle>
            <Button
              onClick={onCerrar}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <p className="text-white text-center">Modal de cobro - Próximamente...</p>
        </CardContent>
      </Card>
    </div>
  );
}