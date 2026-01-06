import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import { submitStep1, submitStep2, submitStep3, submitStep4, saveStepData, setRegistrationStep, clearRegistrationData } from '../../redux/slices/registrationSlice';
import AccountTypeSelection from '../../components/auth/register/AccountTypeSelection';
import PersonalInformation from '../../components/auth/register/PersonalInformation';
import AddressInformation from '../../components/auth/register/AddressInformation';
import BusinessInformation from '../../components/auth/register/BusinessInformation';
import Verification from '../../components/auth/register/Verification';
import styles from './Register.module.css';

const RegisterMultiStep = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registrationStep, registrationData, registrationId, loading, isAuthenticated } = useSelector(
    (state) => state.registration
  );

  const totalSteps = registrationData.accountType === 'seller' ? 5 : 4;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearRegistrationData());
    };
  }, []);

  const handleAccountTypeSelect = async (accountType) => {
    try {
      await dispatch(submitStep1({ accountType })).unwrap();
    } catch (error) {
      console.error('Step 1 failed:', error);
    }
  };

  const handlePersonalInfoNext = async (data) => {
    dispatch(saveStepData({ step: 2, data }));
    try {
      await dispatch(submitStep2({ registrationId, ...data })).unwrap();
    } catch (error) {
      console.error('Step 2 failed:', error);
    }
  };

  const handleAddressNext = async (data) => {
    dispatch(saveStepData({ step: 3, data }));
    try {
      await dispatch(submitStep3({ registrationId, ...data })).unwrap();
    } catch (error) {
      console.error('Step 3 failed:', error);
    }
  };

  const handleBusinessInfoNext = async (data) => {
    dispatch(saveStepData({ step: 4, data }));
    try {
      await dispatch(submitStep4({ registrationId, ...data })).unwrap();
    } catch (error) {
      console.error('Step 4 failed:', error);
    }
  };

  const handleRegistrationComplete = (result) => {
    const accountType = registrationData.accountType;
    if (accountType === 'seller') {
      navigate('/seller');
    } else {
      navigate('/');
    }
  };

  const handlePrevious = () => {
    if (registrationStep > 1) {
      dispatch(setRegistrationStep(registrationStep - 1));
    }
  };

  const getStepLabel = (step) => {
    const labels = {
      1: 'Account Type',
      2: 'Personal Info',
      3: 'Address',
      4: registrationData.accountType === 'seller' ? 'Business Info' : 'Verification',
      5: 'Verification',
    };
    return labels[step];
  };

  const renderStep = () => {
    switch (registrationStep) {
      case 1:
        return <AccountTypeSelection onSelect={handleAccountTypeSelect} loading={loading} />;
      case 2:
        return (
          <PersonalInformation
            onNext={handlePersonalInfoNext}
            onPrevious={handlePrevious}
            initialData={registrationData.personalInfo}
          />
        );
      case 3:
        return (
          <AddressInformation
            onNext={handleAddressNext}
            onPrevious={handlePrevious}
            initialData={registrationData.address}
          />
        );
      case 4:
        if (registrationData.accountType === 'seller') {
          return (
            <BusinessInformation
              onNext={handleBusinessInfoNext}
              onPrevious={handlePrevious}
              initialData={registrationData.businessInfo}
              addressData={registrationData.address}
            />
          );
        }
        return (
          <Verification
            onPrevious={handlePrevious}
            onComplete={handleRegistrationComplete}
          />
        );
      case 5:
        return (
          <Verification
            onPrevious={handlePrevious}
            onComplete={handleRegistrationComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.formContainer}>
            {registrationStep > 1 && (
              <div className={styles.progressBar}>
                <div className={styles.progressSteps}>
                  {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                    <div key={step} className={styles.progressStep}>
                      <div
                        className={`${styles.stepCircle} ${
                          step < registrationStep
                            ? styles.completed
                            : step === registrationStep
                            ? styles.active
                            : styles.inactive
                        }`}
                      >
                        {step < registrationStep ? (
                          <FiCheck className={styles.checkIcon} />
                        ) : (
                          <span>{step}</span>
                        )}
                      </div>
                      {step < totalSteps && (
                        <div
                          className={`${styles.stepLine} ${
                            step < registrationStep ? styles.completedLine : styles.inactiveLine
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.stepLabels}>
                  {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                    <div key={step} className={styles.stepLabel}>
                      <span
                        className={`${styles.labelText} ${
                          step === registrationStep ? styles.activeLabel : ''
                        }`}
                      >
                        {getStepLabel(step)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.stepContent}>{renderStep()}</div>

            {registrationStep === 1 && (
              <div className={styles.authFooter}>
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className={styles.authLink}>
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.brandSection}>
            <h1 className={styles.brandLogo}>NovaMart</h1>
            <div className={styles.illustration}>
              <div className={styles.illustrationCircle}></div>
              <div className={styles.illustrationBox}></div>
            </div>
            <h2 className={styles.benefitsTitle}>Why Choose NovaMart?</h2>
            <ul className={styles.benefitsList}>
              <li className={styles.benefitItem}>
                <FiCheck className={styles.benefitIcon} />
                <span>Secure and encrypted transactions</span>
              </li>
              <li className={styles.benefitItem}>
                <FiCheck className={styles.benefitIcon} />
                <span>24/7 customer support</span>
              </li>
              <li className={styles.benefitItem}>
                <FiCheck className={styles.benefitIcon} />
                <span>Fast and reliable shipping</span>
              </li>
              <li className={styles.benefitItem}>
                <FiCheck className={styles.benefitIcon} />
                <span>Easy returns and refunds</span>
              </li>
              <li className={styles.benefitItem}>
                <FiCheck className={styles.benefitIcon} />
                <span>Trusted by millions worldwide</span>
              </li>
            </ul>
            <div className={styles.securityBadges}>
              <div className={styles.badge}>
                <span>🔒 SSL Secured</span>
              </div>
              <div className={styles.badge}>
                <span>✓ Verified Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterMultiStep;
