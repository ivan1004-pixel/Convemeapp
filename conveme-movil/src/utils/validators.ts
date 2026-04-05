export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const isEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isPhone = (phone: string): boolean => {
  return /^\d{10}$/.test(phone.replace(/\D/g, ''));
};

export const isMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const isNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== '';
};

export const isPositiveNumber = (value: string): boolean => {
  return isNumber(value) && Number(value) > 0;
};

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  email?: boolean;
  phone?: boolean;
  number?: boolean;
  positiveNumber?: boolean;
  custom?: (value: string) => string | undefined;
}

export const validate = (value: string, rules: ValidationRule): string | undefined => {
  if (rules.required && !isRequired(value)) return 'Este campo es requerido';
  if (value && rules.minLength && !isMinLength(value, rules.minLength))
    return `Mínimo ${rules.minLength} caracteres`;
  if (value && rules.email && !isEmail(value)) return 'Email inválido';
  if (value && rules.phone && !isPhone(value)) return 'Teléfono inválido (10 dígitos)';
  if (value && rules.number && !isNumber(value)) return 'Debe ser un número';
  if (value && rules.positiveNumber && !isPositiveNumber(value))
    return 'Debe ser un número positivo';
  if (rules.custom) return rules.custom(value);
  return undefined;
};
