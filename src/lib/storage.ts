import { supabase, isSupabaseEnabled } from './supabase';

// Capa de abstracción para storage híbrido (localStorage + Supabase)
export const storage = {
  // Usuarios
  async getUsers() {
    if (isSupabaseEnabled()) {
      const { data } = await supabase!.from('users').select('*');
      if (data) {
        return data.reduce((acc, user) => ({ ...acc, [user.email]: user }), {});
      }
    }
    const users = localStorage.getItem('santandereano_users');
    return users ? JSON.parse(users) : {};
  },

  async saveUsers(users: any) {
    localStorage.setItem('santandereano_users', JSON.stringify(users));
    if (isSupabaseEnabled()) {
      const userArray = Object.values(users);
      await supabase!.from('users').upsert(userArray as any);
    }
  },

  // Mesas
  async getMesas() {
    if (isSupabaseEnabled()) {
      const { data } = await supabase!.from('mesas').select('*');
      if (data) {
        return data.reduce((acc, mesa) => ({ ...acc, [mesa.mesa_key]: mesa.data }), {});
      }
    }
    const mesas = localStorage.getItem('santandereano_mesas');
    return mesas ? JSON.parse(mesas) : {};
  },

  async saveMesas(mesas: any) {
    localStorage.setItem('santandereano_mesas', JSON.stringify(mesas));
    if (isSupabaseEnabled()) {
      const mesasArray = Object.entries(mesas).map(([mesa_key, data]) => ({
        mesa_key,
        data,
        updated_at: new Date().toISOString()
      }));
      await supabase!.from('mesas').upsert(mesasArray);
    }
  },

  // Ventas
  async getVentas() {
    if (isSupabaseEnabled()) {
      const { data } = await supabase!.from('ventas').select('*').order('fecha', { ascending: false });
      return data || [];
    }
    const ventas = localStorage.getItem('santandereano_ventas');
    return ventas ? JSON.parse(ventas) : [];
  },

  async saveVentas(ventas: any[]) {
    localStorage.setItem('santandereano_ventas', JSON.stringify(ventas));
    if (isSupabaseEnabled()) {
      await supabase!.from('ventas').upsert(ventas);
    }
  },

  // Sabores de sopas
  async getSaboresSopas() {
    if (isSupabaseEnabled()) {
      const { data } = await supabase!.from('config').select('value').eq('key', 'sabores_sopas').single();
      if (data) return data.value;
    }
    const sabores = localStorage.getItem('santandereano_sabores_sopas');
    return sabores ? JSON.parse(sabores) : ['Sopa de costilla', 'Sancocho'];
  },

  async saveSaboresSopas(sabores: string[]) {
    localStorage.setItem('santandereano_sabores_sopas', JSON.stringify(sabores));
    if (isSupabaseEnabled()) {
      await supabase!.from('config').upsert({ key: 'sabores_sopas', value: sabores });
    }
  },

  // Precio de sopas
  async getPrecioSopas() {
    if (isSupabaseEnabled()) {
      const { data } = await supabase!.from('config').select('value').eq('key', 'precio_sopas').single();
      if (data) return data.value;
    }
    const precio = localStorage.getItem('santandereano_precio_sopas');
    return precio ? parseInt(precio) : 10000;
  },

  async savePrecioSopas(precio: number) {
    localStorage.setItem('santandereano_precio_sopas', precio.toString());
    if (isSupabaseEnabled()) {
      await supabase!.from('config').upsert({ key: 'precio_sopas', value: precio });
    }
  },

  // Estado de caja
  async getEstadoCaja() {
    if (isSupabaseEnabled()) {
      const { data } = await supabase!.from('config').select('value').eq('key', 'caja_estado').single();
      if (data) return data.value;
    }
    const estado = localStorage.getItem('santandereano_caja_estado');
    return estado ? JSON.parse(estado) : null;
  },

  async saveEstadoCaja(estado: any) {
    localStorage.setItem('santandereano_caja_estado', JSON.stringify(estado));
    if (isSupabaseEnabled()) {
      await supabase!.from('config').upsert({ key: 'caja_estado', value: estado });
    }
  }
};
