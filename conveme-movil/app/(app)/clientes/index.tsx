import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminClientes from './admin';
import VendedorClientes from './vendedor';

export default function ClientesDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminClientes /> : <VendedorClientes />;
}
