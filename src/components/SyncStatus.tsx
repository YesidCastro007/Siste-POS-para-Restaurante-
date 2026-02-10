import React from 'react';
import { Badge } from '@/components/ui/badge';
import { isSupabaseEnabled } from '@/lib/supabase';
import { Cloud, CloudOff } from 'lucide-react';

export function SyncStatus() {
  const enabled = isSupabaseEnabled();

  if (!enabled) {
    return (
      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
        <CloudOff className="w-3 h-3 mr-1" />
        Modo Local
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
      <Cloud className="w-3 h-3 mr-1" />
      Sincronizado
    </Badge>
  );
}
