import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminVentaDetail from './admin_detail';
import VendedorVentaDetail from './vendedor_detail';

export default function VentaDetailDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminVentaDetail /> : <VendedorVentaDetail />;
}
