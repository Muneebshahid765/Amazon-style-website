import { useState, useEffect, useMemo } from 'react';
import { FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { checkEmailAvailability } from '../../../redux/slices/registrationSlice';
import { validateEmail, validatePassword } from '../../../utils/validators';
import useFormValidation from '../../../hooks/useFormValidation';
import styles from './PersonalInformation.module.css';

const PersonalInformation = ({
  onNext,
  onPrevious,
  initialData,
  lockedFields = [],
  hidePasswordFields = false,
  skipEmailCheck = false,
  upgradeMessage = '',
}) => {
  const dispatch = useDispatch();
  const { emailAvailable, loading } = useSelector((state) => state.registration);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);

  const validationRules = {
    firstName: {
      required: true,
      minLength: 2,
      requiredMessage: 'First name is required',
      minLengthMessage: 'First name must be at least 2 characters',
    },
    lastName: {
      required: true,
      minLength: 2,
      requiredMessage: 'Last name is required',
      minLengthMessage: 'Last name must be at least 2 characters',
    },
    email: {
      required: true,
      requiredMessage: 'Email is required',
      custom: (value) => {
        if (!validateEmail(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      },
    },
    phone: {
      required: true,
      requiredMessage: 'Phone number is required',
      minLength: 10,
      minLengthMessage: 'Please enter a valid phone number',
    },
    ...(hidePasswordFields
      ? {}
      : {
          password: {
            required: true,
            requiredMessage: 'Password is required',
            custom: (value) => {
              const result = validatePassword(value);
              if (!result.isValid) {
                return 'Password does not meet requirements';
              }
              return '';
            },
          },
          confirmPassword: {
            required: true,
            requiredMessage: 'Please confirm your password',
            custom: (value, allValues) => {
              if (value !== allValues.password) {
                return 'Passwords do not match';
              }
              return '';
            },
          },
        }),
  };

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  const mergedInitialValues = useMemo(() => ({ ...defaultValues, ...(initialData || {}) }), [initialData]);

  const { values, errors, touched, handleChange, handleBlur, validateAll, setFieldValue } =
    useFormValidation(mergedInitialValues, validationRules);

  useEffect(() => {
    if (values.password) {
      const result = validatePassword(values.password);
      setPasswordStrength(result);
    } else {
      setPasswordStrength(null);
    }
  }, [values.password]);

  useEffect(() => {
    if (!initialData) return;
    Object.entries(initialData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        setFieldValue(key, value);
      }
    });
  }, [initialData, setFieldValue]);

  const isLocked = (field) => lockedFields.includes(field);

  useEffect(() => {
    if (isLocked('email') || skipEmailCheck) return;
    if (values.email && validateEmail(values.email)) {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }

      const timeout = setTimeout(() => {
        dispatch(checkEmailAvailability(values.email));
      }, 500);

      setEmailCheckTimeout(timeout);
    }

    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [values.email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      if (!isLocked('email') && emailAvailable === false) {
        return;
      }
      const submission = { ...values };
      if (hidePasswordFields) {
        delete submission.password;
        delete submission.confirmPassword;
      }
      onNext(submission);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return '';
    switch (passwordStrength.strength) {
      case 'weak':
        return styles.weak;
      case 'medium':
        return styles.medium;
      case 'strong':
        return styles.strong;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Personal Information</h2>
      <p className={styles.subtitle}>
        Please provide your personal details{' '}
        {lockedFields.length > 0 && <span className={styles.lockedNote}>Some fields are locked to match your buyer profile.</span>}
      </p>
      {upgradeMessage && <div className={styles.upgradeNotice}>{upgradeMessage}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.label}>
              First Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={values.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.firstName && errors.firstName ? styles.inputError : ''}`}
              placeholder="Enter your first name"
              readOnly={isLocked('firstName')}
            />
            {touched.firstName && errors.firstName && (
              <span className={styles.errorMessage}>{errors.firstName}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.label}>
              Last Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={values.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.lastName && errors.lastName ? styles.inputError : ''}`}
              placeholder="Enter your last name"
            />
            {touched.lastName && errors.lastName && (
              <span className={styles.errorMessage}>{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email Address <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ''}`}
              placeholder="Enter your email address"
              readOnly={isLocked('email')}
              disabled={isLocked('email')}
            />
            {values.email && validateEmail(values.email) && emailAvailable !== null && (
              <span className={styles.availabilityIcon}>
                {emailAvailable ? (
                  <FiCheck className={styles.checkIcon} />
                ) : (
                  <FiX className={styles.errorIcon} />
                )}
              </span>
            )}
          </div>
          {touched.email && errors.email && (
            <span className={styles.errorMessage}>{errors.email}</span>
          )}
          {emailAvailable === false && (
            <span className={styles.errorMessage}>This email is already registered</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone" className={styles.label}>
            Phone Number <span className={styles.required}>*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${styles.input} ${touched.phone && errors.phone ? styles.inputError : ''}`}
            placeholder="Enter your phone number"
            readOnly={isLocked('phone')}
          />
          {touched.phone && errors.phone && (
            <span className={styles.errorMessage}>{errors.phone}</span>
          )}
        </div>

        {!hidePasswordFields && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ''}`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {touched.password && errors.password && (
                <span className={styles.errorMessage}>{errors.password}</span>
              )}
            </div>

            {values.password && (
              <div className={styles.passwordRequirements}>
                <p className={styles.requirementsTitle}>Password must contain:</p>
                <ul className={styles.requirementsList}>
                  <li className={passwordStrength?.criteria.minLength ? styles.met : styles.unmet}>
                    {passwordStrength?.criteria.minLength ? <FiCheck /> : <FiX />}
                    At least 8 characters
                  </li>
                  <li className={passwordStrength?.criteria.hasUppercase ? styles.met : styles.unmet}>
                    {passwordStrength?.criteria.hasUppercase ? <FiCheck /> : <FiX />}
                    One uppercase letter
                  </li>
                  <li className={passwordStrength?.criteria.hasNumber ? styles.met : styles.unmet}>
                    {passwordStrength?.criteria.hasNumber ? <FiCheck /> : <FiX />}
                    One number
                  </li>
                  <li className={passwordStrength?.criteria.hasSpecialChar ? styles.met : styles.unmet}>
                    {passwordStrength?.criteria.hasSpecialChar ? <FiCheck /> : <FiX />}
                    One special character
                  </li>
                </ul>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.input} ${touched.confirmPassword && errors.confirmPassword ? styles.inputError : ''}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <span className={styles.errorMessage}>{errors.confirmPassword}</span>
              )}
            </div>
          </>
        )}

        <div className={styles.buttonGroup}>
          <button type="button" onClick={onPrevious} className={styles.secondaryButton}>
            Previous
          </button>
          <button type="submit" className={styles.primaryButton} disabled={loading}>
            {loading ? 'Processing...' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInformation;
