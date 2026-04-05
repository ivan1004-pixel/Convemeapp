import { useState, useCallback } from 'react';
import { validate, ValidationRule } from '../utils/validators';

type FormValues = Record<string, string>;
type FormRules = Record<string, ValidationRule>;
type FormErrors = Record<string, string | undefined>;

interface UseFormOptions {
  initialValues: FormValues;
  rules?: FormRules;
  onSubmit?: (values: FormValues) => void | Promise<void>;
}

export const useForm = ({ initialValues, rules = {}, onSubmit }: UseFormOptions) => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched[field] && rules[field]) {
      const err = validate(value, rules[field]);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  }, [touched, rules]);

  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (rules[field]) {
      const err = validate(values[field] || '', rules[field]);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  }, [values, rules]);

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let valid = true;
    Object.keys(rules).forEach(field => {
      const err = validate(values[field] || '', rules[field]);
      if (err) { newErrors[field] = err; valid = false; }
    });
    setErrors(newErrors);
    setTouched(Object.keys(rules).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return valid;
  }, [values, rules]);

  const handleSubmit = useCallback(async () => {
    if (!validateAll()) return;
    if (!onSubmit) return;
    setIsSubmitting(true);
    try { await onSubmit(values); } finally { setIsSubmitting(false); }
  }, [validateAll, onSubmit, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return { values, errors, touched, isSubmitting, setValue, setFieldTouched, handleSubmit, validateAll, reset };
};
