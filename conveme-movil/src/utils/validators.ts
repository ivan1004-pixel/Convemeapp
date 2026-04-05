/**
 * Validaciones comunes para formularios
 */

/** Verifica que un string no sea vacío */
export const isRequired = (value: string): boolean => value.trim().length > 0;

/** Verifica longitud mínima */
export const minLength = (value: string, min: number): boolean => value.trim().length >= min;

/** Verifica longitud máxima */
export const maxLength = (value: string, max: number): boolean => value.trim().length <= max;

/** Valida formato de email */
export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Valida que el string contenga solo letras y números */
export const isAlphanumeric = (value: string): boolean => /^[a-zA-Z0-9]+$/.test(value);

/** Valida que sea un número positivo */
export const isPositiveNumber = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/** Valida que sea un número entero no negativo */
export const isNonNegativeInteger = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num >= 0;
};

/** Valida contraseña segura (mínimo 6 caracteres) */
export const isValidPassword = (value: string): boolean => value.length >= 6;

/** Valida nombre de usuario (letras, números, guiones, 3-30 chars) */
export const isValidUsername = (value: string): boolean =>
  /^[a-zA-Z0-9_-]{3,30}$/.test(value);

/** Valida una fecha en formato ISO */
export const isValidDate = (value: string): boolean =>
  !isNaN(Date.parse(value));

/** Valida que una fecha de fin sea posterior a la de inicio */
export const isEndAfterStart = (start: string, end: string): boolean => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return endDate > startDate;
};

/** Genera mensajes de error de validación */
export const validationMessages = {
  required: 'Este campo es obligatorio',
  minLength: (min: number) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max: number) => `No puede superar ${max} caracteres`,
  email: 'Ingresa un correo electrónico válido',
  password: 'La contraseña debe tener al menos 6 caracteres',
  username: 'Solo letras, números, guiones y _ (3-30 caracteres)',
  positiveNumber: 'Debe ser un número mayor a 0',
  invalidDate: 'Fecha inválida',
  endBeforeStart: 'La fecha de fin debe ser posterior a la de inicio',
} as const;
