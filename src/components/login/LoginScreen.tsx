import { User, Lock, ChefHat, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cerrarSesion } from '@/lib/auth';

export default function LoginScreen({ email, setEmail, password, setPassword, role, setRole, handleLogin, isHovered, setIsHovered, isLoading, loginAttempts, isBlocked, blockTimeLeft, showRegister, setShowRegister, registerData, setRegisterData, handleRegister, showPassword, setShowPassword, showForgotPassword, setShowForgotPassword, resetEmail, setResetEmail, newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword, resetStep, setResetStep, handleForgotPassword }) {
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
                      Le enviaremos un enlace a su correo para crear una nueva contraseña.
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
                    // Si venía del enlace del correo, cerrar la sesión temporal de recuperación
                    if (resetStep === 3) cerrarSesion();
                    setShowForgotPassword(false);
                    setResetStep(1);
                    setResetEmail('');
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
                  {resetStep === 1 && 'Enviar Enlace'}
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
