import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminPedidoDetail from './admin_detail';
import VendedorPedidoDetail from './vendedor_detail';

export default function PedidoDetailDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminPedidoDetail /> : <VendedorPedidoDetail />;
}
