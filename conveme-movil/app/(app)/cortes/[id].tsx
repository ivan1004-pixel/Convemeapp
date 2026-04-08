import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminCorteDetail from './admin_detail';
import VendedorCorteDetail from './vendedor_detail';

export default function CorteDetailDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminCorteDetail /> : <VendedorCorteDetail />;
}
