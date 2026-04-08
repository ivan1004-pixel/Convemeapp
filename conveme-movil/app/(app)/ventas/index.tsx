import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminVentas from './admin';
import VendedorVentas from './vendedor';

export default function VentasDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminVentas /> : <VendedorVentas />;
}
