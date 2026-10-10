import { useEffect, useState } from 'react';
import { mantenerActualizado } from '@/lib/datos';
import { cargarNombreNegocio } from '@/lib/menu';

// Nombre del restaurante, actualizado en vivo cuando el dueño lo cambia
export const useNombreNegocio = () => {
  const [nombre, setNombre] = useState('');
  useEffect(() => mantenerActualizado(['config'], () =>
    cargarNombreNegocio().then(setNombre).catch(() => {}), 60000), []);
  return nombre;
};
