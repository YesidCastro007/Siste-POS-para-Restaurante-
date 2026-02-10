import { storage } from '../lib/storage';

async function migrarDatosASupabase() {
  console.log('🚀 Iniciando migración...');
  
  try {
    const users = localStorage.getItem('santandereano_users');
    if (users) await storage.saveUsers(JSON.parse(users));

    const mesas = localStorage.getItem('santandereano_mesas');
    if (mesas) await storage.saveMesas(JSON.parse(mesas));

    const ventas = localStorage.getItem('santandereano_ventas');
    if (ventas) await storage.saveVentas(JSON.parse(ventas));

    const sabores = localStorage.getItem('santandereano_sabores_sopas');
    if (sabores) await storage.saveSaboresSopas(JSON.parse(sabores));

    const precio = localStorage.getItem('santandereano_precio_sopas');
    if (precio) await storage.savePrecioSopas(parseInt(precio));

    const estadoCaja = localStorage.getItem('santandereano_caja_estado');
    if (estadoCaja) await storage.saveEstadoCaja(JSON.parse(estadoCaja));

    console.log('🎉 Migración completada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

migrarDatosASupabase();
