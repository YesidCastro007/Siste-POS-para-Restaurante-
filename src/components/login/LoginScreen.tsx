import { User, Lock, Eye, EyeOff } from 'lucide-react';
import logoVertical from '@/assets/marca/shadow-stacked-blanco.svg';
import logoHorizontal from '@/assets/marca/shadow-horizontal-blanco.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cerrarSesion } from '@/lib/auth';

export default function LoginScreen({ email, setEmail, password, setPassword, role, setRole, handleLogin, isHovered, setIsHovered, isLoading, loginAttempts, isBlocked, blockTimeLeft, showRegister, setShowRegister, registerData, setRegisterData, handleRegister, showPassword, setShowPassword, showForgotPassword, setShowForgotPassword, resetEmail, setResetEmail, newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword, resetStep, setResetStep, handleForgotPassword }) {
  if (showRegister) {
    return (
      <div className="min-h-screen fondo-shadow flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-cyan-400/15 shadow-2xl rounded-2xl">
          <CardHeader className="space-y-4">
            <img src={logoHorizontal} alt="SHADOW" className="h-10 mx-auto brillo-cian" />
            <CardTitle className="font-marca text-white text-center">Crear Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre Completo</label>
              <Input
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                className="bg-white/5 border-cyan-400/15 text-white"
                placeholder="Ingrese nombre completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <Input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="bg-white/5 border-cyan-400/15 text-white"
                placeholder="usuario@gmail.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
              <Input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                className="bg-white/5 border-cyan-400/15 text-white"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Contraseña</label>
              <Input
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                className="bg-white/5 border-cyan-400/15 text-white"
                placeholder="Repita la contraseña"
              />
            </div>
            
            <div className="text-center p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
              <p className="text-cyan-300 text-sm font-medium">ℹ️ Información</p>
              <p className="text-cyan-100 text-xs mt-1">
                Las cuentas nuevas se crean como <strong>Mesero</strong> y el dueño las activa desde su panel.
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowRegister(false)}
                variant="outline"
                className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="flex-1 boton-marca"
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
    <div className="min-h-screen fondo-shadow flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">

        {/* Marca */}
        <div className="hidden lg:flex flex-col items-center text-center space-y-8">
          <img src={logoVertical} alt="SHADOW" className="w-64 brillo-cian" />
          <div className="space-y-3">
            <p className="font-marca text-2xl font-semibold text-white">Tu restaurante, bajo control.</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Mesas, pedidos, caja y menú en tiempo real, desde cualquier celular.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['Mesas en vivo', 'Caja y reportes', 'Menú editable'].map(texto => (
              <span key={texto} className="px-3 py-1 rounded-full text-xs font-medium text-cyan-200 bg-cyan-400/10 border border-cyan-400/20">
                {texto}
              </span>
            ))}
          </div>
        </div>

        {/* Formulario de login */}
        <Card className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/15 shadow-2xl shadow-black/40 rounded-2xl w-full max-w-md mx-auto">
          <CardHeader className="space-y-6 p-6 sm:p-8">
            <div className="lg:hidden flex justify-center">
              <img src={logoHorizontal} alt="SHADOW" className="h-12 brillo-cian" />
            </div>

            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-marca text-2xl font-bold text-white">Bienvenido</h2>
                <p className="text-slate-400 text-sm mt-1">Ingresa con tu cuenta</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full h-12 bg-white/5 border-white/10 pl-12 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
                    placeholder="usuario@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full h-12 bg-white/5 border-white/10 pl-12 pr-12 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
                className={`w-full h-12 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isBlocked ? 'bg-slate-700 text-white cursor-not-allowed' : 'boton-marca'
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
                className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors text-center w-full"
              >
                ¿Olvidaste tu contraseña?
              </button>

              {loginAttempts > 0 && !isBlocked && (
                <p className="text-amber-300 text-sm text-center">
                  ⚠️ Intentos fallidos: {loginAttempts}/3
                </p>
              )}

              <div className="pt-4 border-t border-white/10 text-center space-y-3">
                <p className="text-sm text-slate-400">¿Eres nuevo en el equipo?</p>
                <Button
                  onClick={() => setShowRegister(true)}
                  variant="outline"
                  className="w-full h-11 bg-transparent border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/10 hover:text-white"
                >
                  Crear Nuevo Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <p className="mt-8 lg:absolute lg:bottom-4 text-center text-slate-500 text-xs">
        SHADOW © {new Date().getFullYear()} · Sistema POS para restaurantes
      </p>

      {/* Modal Recuperar Contraseña */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-cyan-400/15 shadow-2xl rounded-2xl">
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
                      className="bg-white/5 border-cyan-400/15 text-white"
                      placeholder="usuario@gmail.com"
                    />
                  </div>
                  <div className="text-center p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
                    <p className="text-cyan-100 text-xs">
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
                      className="bg-white/5 border-cyan-400/15 text-white"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Contraseña</label>
                    <Input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="bg-white/5 border-cyan-400/15 text-white"
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
                  className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="flex-1 boton-marca"
                >
                  {isLoading ? 'Enviando…' : resetStep === 3 ? 'Cambiar Contraseña' : 'Enviar Enlace'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
