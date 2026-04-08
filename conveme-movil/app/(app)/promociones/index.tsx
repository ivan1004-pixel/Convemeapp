import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminPromociones from './admin';
import VendedorPromociones from './vendedor';

export default function PromocionesDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminPromociones /> : <VendedorPromociones />;
}
