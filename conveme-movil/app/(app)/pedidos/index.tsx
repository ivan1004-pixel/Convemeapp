import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminPedidos from './admin';
import VendedorPedidos from './vendedor';

export default function PedidosDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminPedidos /> : <VendedorPedidos />;
}
