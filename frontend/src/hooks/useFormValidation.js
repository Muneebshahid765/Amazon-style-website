import { useState, useCallback } from 'react';

const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback(
    (name, value) => {
      if (!validationRules[name]) return '';

      const rules = validationRules[name];
      
      if (rules.required && (!value || value.toString().trim() === '')) {
        return rules.requiredMessage || 'This field is required';
      }

      if (rules.minLength && value.length < rules.minLength) {
        return rules.minLengthMessage || `Minimum ${rules.minLength} characters required`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.maxLengthMessage || `Maximum ${rules.maxLength} characters allowed`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.patternMessage || 'Invalid format';
      }

      if (rules.custom) {
        return rules.custom(value, values);
      }

      return '';
    },
    [validationRules, values]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const newValue = type === 'checkbox' ? checked : value;

      setValues((prev) => ({ ...prev, [name]: newValue }));

      if (touched[name]) {
        const error = validateField(name, newValue);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return isValid;
  }, [validationRules, values, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
    setFieldValue,
    setFieldError,
    setValues,
  };
};

export default useFormValidation;
