import { API_URL } from '../api/convemeApi';

export const formatImageUri = (path?: string): string | null => {
  if (!path) return null;
  if (path.startsWith('data:image')) return path;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) {
    return `${API_URL.replace('/graphql', '')}${path}`;
  }
  // Si parece base64 pero no tiene el prefijo
  if (path.length > 100 && !path.includes('/') && !path.includes(':')) {
    return `data:image/jpeg;base64,${path}`;
  }
  return path;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const formatPhone = (phone?: string): string => {
  if (!phone) return 'Sin teléfono';
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone;
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};
