import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

export function useHybridStorage() {
  // Usuarios
  const getUsersFromStorage = async () => {
    return await storage.getUsers();
  };

  const saveUsersToStorage = async (users: any) => {
    await storage.saveUsers(users);
  };

  // Mesas
  const getMesas = async () => {
    return await storage.getMesas();
  };

  const saveMesas = async (mesas: any) => {
    await storage.saveMesas(mesas);
  };

  // Ventas
  const getVentas = async () => {
    return await storage.getVentas();
  };

  const saveVentas = async (ventas: any) => {
    await storage.saveVentas(ventas);
  };

  // Sabores de sopas
  const getSaboresSopas = async () => {
    return await storage.getSaboresSopas();
  };

  const saveSaboresSopas = async (sabores: string[]) => {
    await storage.saveSaboresSopas(sabores);
  };

  // Precio de sopas
  const getPrecioSopas = async () => {
    return await storage.getPrecioSopas();
  };

  const savePrecioSopas = async (precio: number) => {
    await storage.savePrecioSopas(precio);
  };

  // Estado de caja
  const getEstadoCaja = async () => {
    return await storage.getEstadoCaja();
  };

  const saveEstadoCaja = async (estado: any) => {
    await storage.saveEstadoCaja(estado);
  };

  return {
    getUsersFromStorage,
    saveUsersToStorage,
    getMesas,
    saveMesas,
    getVentas,
    saveVentas,
    getSaboresSopas,
    saveSaboresSopas,
    getPrecioSopas,
    savePrecioSopas,
    getEstadoCaja,
    saveEstadoCaja
  };
}
