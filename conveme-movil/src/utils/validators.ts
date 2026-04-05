export const validators = {
  required: (value: string) => !value?.trim() ? 'Este campo es requerido' : null,
  email: (value: string) => {
    if (!value) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email no válido';
  },
  phone: (value: string) => {
    if (!value) return null;
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(value.replace(/\D/g, '')) ? null : 'Teléfono debe tener 10 dígitos';
  },
  minLength: (min: number) => (value: string) =>
    value?.length >= min ? null : `Mínimo ${min} caracteres`,
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max ? null : `Máximo ${max} caracteres`,
  positiveNumber: (value: string | number) => {
    const num = Number(value);
    return num > 0 ? null : 'Debe ser un número positivo';
  },
  username: (value: string) => {
    if (!value) return 'El usuario es requerido';
    if (value.length < 3) return 'Mínimo 3 caracteres';
    return /^[a-zA-Z0-9_]+$/.test(value) ? null : 'Solo letras, números y guiones bajos';
  },
  password: (value: string) => {
    if (!value) return 'La contraseña es requerida';
    return value.length >= 6 ? null : 'Mínimo 6 caracteres';
  },
};
