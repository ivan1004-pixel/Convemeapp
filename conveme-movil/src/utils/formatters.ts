/**
 * Utilidades de formateo de datos
 */

/** Formatea un número como moneda en pesos mexicanos */
export const formatCurrency = (amount: number, currency = 'MXN'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/** Formatea una fecha ISO a formato legible en español */
export const formatDate = (isoDate: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
};

/** Formatea una fecha a formato corto dd/MM/yyyy */
export const formatDateShort = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/** Formatea fecha y hora */
export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Capitaliza la primera letra de cada palabra */
export const capitalize = (str: string): string =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

/** Trunca un texto a un número máximo de caracteres */
export const truncate = (str: string, maxLength: number, ellipsis = '...'): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/** Convierte bytes a formato legible (KB, MB, etc.) */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, exp);
  return `${value.toFixed(1)} ${units[exp]}`;
};

/** Formatea un número con separadores de miles */
export const formatNumber = (num: number): string =>
  new Intl.NumberFormat('es-MX').format(num);

/** Obtiene las iniciales de un nombre (máx. 2 letras) */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
