import { useState, useCallback } from 'react';

type ValidationFn = (value: string) => string | null;

export function useForm<T extends Record<string, string>>(
  initialValues: T,
  validationConfig?: Partial<Record<keyof T, ValidationFn | ValidationFn[]>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field] && validationConfig?.[field]) {
      const fns = Array.isArray(validationConfig[field])
        ? validationConfig[field] as ValidationFn[]
        : [validationConfig[field] as ValidationFn];
      let error: string | null = null;
      for (const fn of fns) {
        error = fn(value as string);
        if (error) break;
      }
      setErrors((prev) => ({ ...prev, [field]: error ?? undefined }));
    }
  }, [touched, validationConfig]);

  const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback((): boolean => {
    if (!validationConfig) return true;
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;
    for (const field of Object.keys(validationConfig) as (keyof T)[]) {
      const fns = Array.isArray(validationConfig[field])
        ? validationConfig[field] as ValidationFn[]
        : [validationConfig[field] as ValidationFn];
      for (const fn of fns) {
        const error = fn(values[field] as string);
        if (error) {
          newErrors[field] = error;
          isValid = false;
          break;
        }
      }
    }
    setErrors(newErrors);
    setTouched(Object.keys(validationConfig).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return isValid;
  }, [values, validationConfig]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return { values, errors, touched, setValue, setFieldTouched, validate, reset };
}
