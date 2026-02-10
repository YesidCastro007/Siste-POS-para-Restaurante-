import React, { useState, useEffect } from 'react';
import { User, Clock, Shield, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const getUsersFromStorage = () => {
  try {
    const users = localStorage.getItem('santandereano_users');
    return users ? JSON.parse(users) : {};
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    return {};
  }
};

export default function UsuariosActivos() {
  const [usuarios, setUsuarios] = useState({});

  useEffect(() => {
    const cargarUsuarios = () => {
      const usuariosData = getUsersFromStorage();
      setUsuarios(usuariosData);
    };

    cargarUsuarios();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(cargarUsuarios, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const usuariosArray = Object.entries(usuarios).map(([email, userData]) => ({
    email,
    ...userData
  }));

  const usuariosActivos = usuariosArray.filter(user => user.active);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'dueño':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'cajera':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'mesero':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'dueño':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cajera':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'mesero':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-white/5 backdrop-blur-md border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center">
              <UserCheck className="w-6 h-6 mr-2 text-green-400" />
              Usuarios Activos del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usuariosActivos.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No hay usuarios activos</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-gray-300">
                      Total de usuarios activos: <span className="text-green-400 font-bold">{usuariosActivos.length}</span>
                    </p>
                  </div>
                  
                  <div className="grid gap-4">
                    {usuariosActivos.map((usuario, index) => (
                      <Card key={usuario.email} className="bg-white/10 border-red-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                {getRoleIcon(usuario.role)}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold">{usuario.name}</h3>
                                <p className="text-gray-400 text-sm">{usuario.email}</p>
                                {usuario.createdAt && (
                                  <div className="flex items-center text-gray-500 text-xs mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Creado: {new Date(usuario.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <Badge className={`${getRoleBadgeColor(usuario.role)} border`}>
                                {usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1)}
                              </Badge>
                              <div className="flex items-center justify-end mt-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-green-400 text-xs">Activo</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}