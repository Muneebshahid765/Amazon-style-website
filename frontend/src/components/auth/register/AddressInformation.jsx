import useFormValidation from '../../../hooks/useFormValidation';
import styles from './AddressInformation.module.css';

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 
  'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Poland', 'Czech Republic',
  'India', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand',
  'Indonesia', 'Philippines', 'Vietnam', 'Pakistan', 'Bangladesh', 'Sri Lanka',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela',
  'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Morocco', 'Algeria', 'Tunisia',
  'New Zealand', 'Russia', 'Turkey', 'Israel', 'Greece', 'Romania', 'Hungary'
];

const AddressInformation = ({ onNext, onPrevious, initialData }) => {
  const validationRules = {
    street: {
      required: true,
      minLength: 5,
      requiredMessage: 'Street address is required',
      minLengthMessage: 'Street address must be at least 5 characters',
    },
    city: {
      required: true,
      minLength: 2,
      requiredMessage: 'City is required',
      minLengthMessage: 'City must be at least 2 characters',
    },
    state: {
      required: true,
      minLength: 2,
      requiredMessage: 'State/Province is required',
      minLengthMessage: 'State/Province must be at least 2 characters',
    },
    country: {
      required: true,
      requiredMessage: 'Country is required',
    },
    zipCode: {
      required: true,
      minLength: 3,
      requiredMessage: 'Postal/Zip code is required',
      minLengthMessage: 'Postal/Zip code must be at least 3 characters',
    },
  };

  const defaultValues = {
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    addressType: 'home',
    phoneNumber: '',
    isDefault: true,
  };

  const mergedInitialValues = { ...defaultValues, ...(initialData || {}) };

  const { values, errors, touched, handleChange, handleBlur, validateAll } = useFormValidation(
    mergedInitialValues,
    validationRules
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      onNext(values);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Address Information</h2>
      <p className={styles.subtitle}>Please provide your address details</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="street" className={styles.label}>
            Street Address <span className={styles.required}>*</span>
          </label>
          <textarea
            id="street"
            name="street"
            value={values.street}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${styles.textarea} ${touched.street && errors.street ? styles.inputError : ''}`}
            placeholder="Enter your full street address"
            rows="3"
          />
          {touched.street && errors.street && (
            <span className={styles.errorMessage}>{errors.street}</span>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="city" className={styles.label}>
              City <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={values.city}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.city && errors.city ? styles.inputError : ''}`}
              placeholder="Enter your city"
            />
            {touched.city && errors.city && (
              <span className={styles.errorMessage}>{errors.city}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="state" className={styles.label}>
              State/Province <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={values.state}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.state && errors.state ? styles.inputError : ''}`}
              placeholder="Enter your state/province"
            />
            {touched.state && errors.state && (
              <span className={styles.errorMessage}>{errors.state}</span>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="country" className={styles.label}>
              Country <span className={styles.required}>*</span>
            </label>
            <select
              id="country"
              name="country"
              value={values.country}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.select} ${touched.country && errors.country ? styles.inputError : ''}`}
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {touched.country && errors.country && (
              <span className={styles.errorMessage}>{errors.country}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="zipCode" className={styles.label}>
              Postal/Zip Code <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={values.zipCode}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.zipCode && errors.zipCode ? styles.inputError : ''}`}
              placeholder="Enter postal/zip code"
            />
            {touched.zipCode && errors.zipCode && (
              <span className={styles.errorMessage}>{errors.zipCode}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Address Type <span className={styles.required}>*</span></label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="addressType"
                value="home"
                checked={values.addressType === 'home'}
                onChange={handleChange}
                className={styles.radio}
              />
              <span>Home</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="addressType"
                value="office"
                checked={values.addressType === 'office'}
                onChange={handleChange}
                className={styles.radio}
              />
              <span>Office</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="addressType"
                value="other"
                checked={values.addressType === 'other'}
                onChange={handleChange}
                className={styles.radio}
              />
              <span>Other</span>
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phoneNumber" className={styles.label}>
            Phone Number (for delivery)
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={values.phoneNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
            placeholder="+1 234 567 8900"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="isDefault"
              checked={values.isDefault}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>Set as default address</span>
          </label>
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={onPrevious} className={styles.secondaryButton}>
            Previous
          </button>
          <button type="submit" className={styles.primaryButton}>
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressInformation;
