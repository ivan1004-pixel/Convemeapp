import React from 'react';
import { Badge } from './Badge';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  EN_PROCESO: { label: 'En proceso', variant: 'info' },
  COMPLETADO: { label: 'Completado', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'danger' },
  ACTIVO: { label: 'Activo', variant: 'success' },
  INACTIVO: { label: 'Inactivo', variant: 'secondary' },
  PAGADO: { label: 'Pagado', variant: 'success' },
  ENVIADO: { label: 'Enviado', variant: 'info' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size }) => {
  const config = statusMap[status] ?? { label: status, variant: 'secondary' as BadgeVariant };
  return <Badge label={config.label} variant={config.variant} size={size} />;
};
