import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminComprobantes from './admin';
import VendedorComprobantes from './vendedor';

export default function ComprobantesDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminComprobantes /> : <VendedorComprobantes />;
}
