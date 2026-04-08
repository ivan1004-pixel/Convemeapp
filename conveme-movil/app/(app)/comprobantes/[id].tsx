import React from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import AdminComprobanteDetail from './admin_detail';
import VendedorComprobanteDetail from './vendedor_detail';

export default function ComprobanteDetailDispatcher() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminComprobanteDetail /> : <VendedorComprobanteDetail />;
}
