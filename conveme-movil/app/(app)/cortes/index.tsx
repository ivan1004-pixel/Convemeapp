import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminCortes from './admin';
import VendedorCortes from './vendedor';

export default function CortesDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminCortes /> : <VendedorCortes />;
}
