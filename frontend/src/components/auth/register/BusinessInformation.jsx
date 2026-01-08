import { useState, useEffect } from 'react';
import { FiUpload, FiX, FiCheck, FiFile } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { checkBusinessNameAvailability, uploadBusinessLogo, uploadBusinessDocuments } from '../../../redux/slices/registrationSlice';
import useFormValidation from '../../../hooks/useFormValidation';
import useFileUpload from '../../../hooks/useFileUpload';
import styles from './BusinessInformation.module.css';

const businessCategories = [
  'Electronics & Technology',
  'Fashion & Apparel',
  'Home & Garden',
  'Health & Beauty',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Media',
  'Automotive',
  'Food & Beverages',
  'Jewelry & Accessories',
  'Art & Crafts',
  'Pet Supplies',
  'Office Supplies',
  'Baby & Kids',
  'Other',
];

const BusinessInformation = ({ onNext, onPrevious, initialData, addressData, allowSellerUpgrade = false }) => {
  const dispatch = useDispatch();
  const { businessNameAvailable, uploadingLogo, uploadingDocuments, registrationId } = useSelector(
    (state) => state.registration
  );
  const [businessNameCheckTimeout, setBusinessNameCheckTimeout] = useState(null);
  const [sameAsPersonal, setSameAsPersonal] = useState(!initialData?.businessStreet);
  const [charCount, setCharCount] = useState(initialData?.description?.length || 0);

  const logoUpload = useFileUpload({
    maxSize: 5,
    allowedTypes: ['jpg', 'jpeg', 'png'],
    multiple: false,
  });

  const documentsUpload = useFileUpload({
    maxSize: 10,
    allowedTypes: ['pdf'],
    multiple: true,
    maxFiles: 5,
  });

  const validationRules = {
    businessName: {
      required: true,
      minLength: 3,
      requiredMessage: 'Business name is required',
      minLengthMessage: 'Business name must be at least 3 characters',
    },
    businessType: {
      required: true,
      requiredMessage: 'Business type is required',
    },
    registrationNumber: {
      required: true,
      minLength: 3,
      requiredMessage: 'Business registration number is required',
    },
    taxId: {
      required: true,
      minLength: 3,
      requiredMessage: 'Tax ID/VAT number is required',
    },
    businessCategory: {
      required: true,
      requiredMessage: 'Business category is required',
    },
    description: {
      required: true,
      minLength: 50,
      maxLength: 500,
      requiredMessage: 'Business description is required',
      minLengthMessage: 'Description must be at least 50 characters',
      maxLengthMessage: 'Description must not exceed 500 characters',
    },
  };

  const defaultValues = {
    businessName: '',
    businessType: '',
    registrationNumber: '',
    taxId: '',
    businessCategory: '',
    description: '',
    businessStreet: '',
    businessCity: '',
    businessState: '',
    businessCountry: '',
    businessZipCode: '',
  };

  const prefilledInitialAddress = initialData?.businessAddress
    ? {
        businessStreet: initialData.businessAddress.street || '',
        businessCity: initialData.businessAddress.city || '',
        businessState: initialData.businessAddress.state || '',
        businessCountry: initialData.businessAddress.country || '',
        businessZipCode: initialData.businessAddress.zipCode || '',
      }
    : {};

  const formInitialValues = {
    ...defaultValues,
    ...(initialData || {}),
    ...prefilledInitialAddress,
  };

  const { values, errors, touched, handleChange, handleBlur, validateAll, setFieldValue } =
    useFormValidation(formInitialValues, validationRules);

  useEffect(() => {
    if (values.businessName && values.businessName.length >= 3) {
      if (businessNameCheckTimeout) {
        clearTimeout(businessNameCheckTimeout);
      }

      const timeout = setTimeout(() => {
        dispatch(checkBusinessNameAvailability(values.businessName));
      }, 500);

      setBusinessNameCheckTimeout(timeout);
    }

    return () => {
      if (businessNameCheckTimeout) {
        clearTimeout(businessNameCheckTimeout);
      }
    };
  }, [values.businessName]);

  useEffect(() => {
    setCharCount((values.description || '').length);
  }, [values.description]);

  useEffect(() => {
    if (!sameAsPersonal || !addressData) return;
    setFieldValue('businessStreet', addressData.street || '');
    setFieldValue('businessCity', addressData.city || '');
    setFieldValue('businessState', addressData.state || '');
    setFieldValue('businessCountry', addressData.country || '');
    setFieldValue('businessZipCode', addressData.zipCode || '');
  }, [sameAsPersonal, addressData, setFieldValue]);

  const handleLogoUpload = async (e) => {
    logoUpload.handleFileSelect(e);
    if (e.target.files && e.target.files[0]) {
      try {
        await dispatch(uploadBusinessLogo({ registrationId, file: e.target.files[0] })).unwrap();
      } catch (error) {
        console.error('Logo upload failed:', error);
      }
    }
  };

  const handleDocumentsUpload = async (e) => {
    documentsUpload.handleFileSelect(e);
    if (e.target.files && e.target.files.length > 0) {
      try {
        await dispatch(uploadBusinessDocuments({ registrationId, files: Array.from(e.target.files) })).unwrap();
      } catch (error) {
        console.error('Documents upload failed:', error);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      if (businessNameAvailable === false) {
        return;
      }
      if (!allowSellerUpgrade && logoUpload.files.length === 0) {
        alert('Please upload a business logo');
        return;
      }
      if (!allowSellerUpgrade && documentsUpload.files.length === 0) {
        alert('Please upload at least one business document');
        return;
      }

      const formData = {
        ...values,
        sameAsPersonalAddress: sameAsPersonal,
      };
      onNext(formData);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Business Information</h2>
      <p className={styles.subtitle}>Tell us about your business</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="businessName" className={styles.label}>
            Business/Store Name <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={values.businessName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.businessName && errors.businessName ? styles.inputError : ''}`}
              placeholder="Enter your business name"
            />
            {values.businessName && values.businessName.length >= 3 && businessNameAvailable !== null && (
              <span className={styles.availabilityIcon}>
                {businessNameAvailable ? (
                  <FiCheck className={styles.checkIcon} />
                ) : (
                  <FiX className={styles.errorIcon} />
                )}
              </span>
            )}
          </div>
          {touched.businessName && errors.businessName && (
            <span className={styles.errorMessage}>{errors.businessName}</span>
          )}
          {businessNameAvailable === false && (
            <span className={styles.errorMessage}>This business name is already taken</span>
          )}
          {businessNameAvailable === true && (
            <span className={styles.successMessage}>Business name is available</span>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="businessType" className={styles.label}>
              Business Type <span className={styles.required}>*</span>
            </label>
            <select
              id="businessType"
              name="businessType"
              value={values.businessType}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.select} ${touched.businessType && errors.businessType ? styles.inputError : ''}`}
            >
              <option value="">Select business type</option>
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="partnership">Partnership</option>
            </select>
            {touched.businessType && errors.businessType && (
              <span className={styles.errorMessage}>{errors.businessType}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="businessCategory" className={styles.label}>
              Business Category <span className={styles.required}>*</span>
            </label>
            <select
              id="businessCategory"
              name="businessCategory"
              value={values.businessCategory}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.select} ${touched.businessCategory && errors.businessCategory ? styles.inputError : ''}`}
            >
              <option value="">Select category</option>
              {businessCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {touched.businessCategory && errors.businessCategory && (
              <span className={styles.errorMessage}>{errors.businessCategory}</span>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="registrationNumber" className={styles.label}>
              Business Registration Number <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="registrationNumber"
              name="registrationNumber"
              value={values.registrationNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.registrationNumber && errors.registrationNumber ? styles.inputError : ''}`}
              placeholder="Enter registration number"
            />
            {touched.registrationNumber && errors.registrationNumber && (
              <span className={styles.errorMessage}>{errors.registrationNumber}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="taxId" className={styles.label}>
              Tax ID/VAT Number <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="taxId"
              name="taxId"
              value={values.taxId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.taxId && errors.taxId ? styles.inputError : ''}`}
              placeholder="Enter tax ID/VAT number"
            />
            {touched.taxId && errors.taxId && (
              <span className={styles.errorMessage}>{errors.taxId}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Business Description <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${styles.textarea} ${touched.description && errors.description ? styles.inputError : ''}`}
            placeholder="Describe your business (50-500 characters)"
            rows="4"
            maxLength="500"
          />
          <div className={styles.charCounter}>
            <span className={charCount < 50 ? styles.charCountLow : charCount > 500 ? styles.charCountHigh : ''}>
              {charCount}/500 characters
            </span>
          </div>
          {touched.description && errors.description && (
            <span className={styles.errorMessage}>{errors.description}</span>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Business Address</h3>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={sameAsPersonal}
              onChange={(e) => setSameAsPersonal(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Same as personal address</span>
          </label>

          {!sameAsPersonal && (
            <div className={styles.addressFields}>
              <div className={styles.formGroup}>
                <label htmlFor="businessStreet" className={styles.label}>
                  Street Address <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="businessStreet"
                  name="businessStreet"
                  value={values.businessStreet}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Enter business street address"
                  rows="2"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="businessCity" className={styles.label}>
                    City <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="businessCity"
                    name="businessCity"
                    value={values.businessCity}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="City"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="businessState" className={styles.label}>
                    State/Province <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="businessState"
                    name="businessState"
                    value={values.businessState}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="State/Province"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="businessCountry" className={styles.label}>
                    Country <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="businessCountry"
                    name="businessCountry"
                    value={values.businessCountry}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Country"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="businessZipCode" className={styles.label}>
                    Postal/Zip Code <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="businessZipCode"
                    name="businessZipCode"
                    value={values.businessZipCode}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Zip Code"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Business Logo <span className={styles.required}>*</span></h3>
          {allowSellerUpgrade && (
            <p className={styles.sectionHint}>
              Optional for upgrades — we&apos;ll reuse your existing brand logo unless you upload a new one.
            </p>
          )}
          <div
            className={`${styles.uploadArea} ${logoUpload.isDragging ? styles.dragging : ''}`}
            onDragOver={logoUpload.handleDragOver}
            onDragLeave={logoUpload.handleDragLeave}
            onDrop={logoUpload.handleDrop}
          >
            <input
              type="file"
              id="logo"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleLogoUpload}
              className={styles.fileInput}
            />
            <label htmlFor="logo" className={styles.uploadLabel}>
              <FiUpload className={styles.uploadIcon} />
              <p className={styles.uploadText}>
                {logoUpload.previews.length > 0 ? 'Change Logo' : 'Click to upload or drag and drop'}
              </p>
              <p className={styles.uploadHint}>JPG, PNG (max 5MB)</p>
            </label>
          </div>

          {logoUpload.previews.length > 0 && (
            <div className={styles.logoPreview}>
              <img src={logoUpload.previews[0].preview} alt="Logo preview" className={styles.previewImage} />
              <button
                type="button"
                onClick={() => logoUpload.removeFile(0)}
                className={styles.removeButton}
                aria-label="Remove logo"
              >
                <FiX />
              </button>
            </div>
          )}

          {logoUpload.errors.length > 0 && (
            <div className={styles.uploadErrors}>
              {logoUpload.errors.map((error, index) => (
                <span key={index} className={styles.errorMessage}>
                  {error.error || error}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Business Documents <span className={styles.required}>*</span></h3>
          <p className={styles.sectionHint}>Upload business registration, tax documents, etc. (Max 5 files)</p>
          <div
            className={`${styles.uploadArea} ${documentsUpload.isDragging ? styles.dragging : ''}`}
            onDragOver={documentsUpload.handleDragOver}
            onDragLeave={documentsUpload.handleDragLeave}
            onDrop={documentsUpload.handleDrop}
          >
            <input
              type="file"
              id="documents"
              accept="application/pdf"
              multiple
              onChange={handleDocumentsUpload}
              className={styles.fileInput}
            />
            <label htmlFor="documents" className={styles.uploadLabel}>
              <FiUpload className={styles.uploadIcon} />
              <p className={styles.uploadText}>Click to upload or drag and drop</p>
              <p className={styles.uploadHint}>PDF only (max 10MB each, up to 5 files)</p>
            </label>
          </div>

          {documentsUpload.previews.length > 0 && (
            <div className={styles.documentsList}>
              {documentsUpload.previews.map((doc, index) => (
                <div key={index} className={styles.documentItem}>
                  <FiFile className={styles.fileIcon} />
                  <div className={styles.documentInfo}>
                    <span className={styles.documentName}>{doc.name}</span>
                    <span className={styles.documentSize}>
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => documentsUpload.removeFile(index)}
                    className={styles.removeDocButton}
                    aria-label="Remove document"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}

          {documentsUpload.errors.length > 0 && (
            <div className={styles.uploadErrors}>
              {documentsUpload.errors.map((error, index) => (
                <span key={index} className={styles.errorMessage}>
                  {error.error || error}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={onPrevious} className={styles.secondaryButton}>
            Previous
          </button>
          <button type="submit" className={styles.primaryButton} disabled={uploadingLogo || uploadingDocuments}>
            {uploadingLogo || uploadingDocuments ? 'Uploading...' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessInformation;
