import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DueñoDashboard({ user, onLogout }) {
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
