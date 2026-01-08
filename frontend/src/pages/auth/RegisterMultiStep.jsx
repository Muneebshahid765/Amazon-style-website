import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import {
  submitStep1,
  submitStep2,
  submitStep3,
  submitStep4,
  saveStepData,
  setRegistrationStep,
  clearRegistrationData,
  completeRegistration,
} from '../../redux/slices/registrationSlice';
import AccountTypeSelection from '../../components/auth/register/AccountTypeSelection';
import PersonalInformation from '../../components/auth/register/PersonalInformation';
import AddressInformation from '../../components/auth/register/AddressInformation';
import BusinessInformation from '../../components/auth/register/BusinessInformation';
import Verification from '../../components/auth/register/Verification';
import styles from './Register.module.css';

const RegisterMultiStep = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allowSellerUpgrade =
    searchParams.get('mode') === 'seller' && searchParams.get('source') === 'profile';
  const { registrationStep, registrationData, registrationId, loading } = useSelector((state) => state.registration);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const upgradeCompletionRef = useRef(false);

  const totalSteps = allowSellerUpgrade
    ? 4
    : registrationData.accountType === 'seller'
    ? 5
    : 4;

  useEffect(() => {
    if (isAuthenticated && !allowSellerUpgrade) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, allowSellerUpgrade, navigate]);

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

  useEffect(() => {
    if (
      allowSellerUpgrade &&
      registrationStep === 1 &&
      registrationData.accountType !== 'seller' &&
      !loading &&
      user
    ) {
      handleAccountTypeSelect('seller').then(() => {
        dispatch(
          saveStepData({
            step: 2,
            data: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              password: '',
              confirmPassword: '',
            },
          })
        );

        const hasAddressPreset = Boolean(
          registrationData.address &&
            Object.values(registrationData.address).some((value) => value && value !== '')
        );
        if (!hasAddressPreset && user.addresses?.length) {
          const defaultAddress =
            user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
          if (defaultAddress) {
            const {
              street = '',
              city = '',
              state = '',
              country = '',
              zipCode = '',
              addressType = 'home',
              phoneNumber = '',
              isDefault = true,
            } = defaultAddress;

            dispatch(
              saveStepData({
                step: 3,
                data: {
                  street,
                  city,
                  state,
                  country,
                  zipCode,
                  addressType: addressType || 'home',
                  phoneNumber: phoneNumber || user.phone || '',
                  isDefault: typeof isDefault === 'boolean' ? isDefault : true,
                },
              })
            );
          }
        }
      });
    }
  }, [
    allowSellerUpgrade,
    registrationStep,
    registrationData.accountType,
    registrationData.address,
    loading,
    user,
    dispatch,
  ]);

  const handlePersonalInfoNext = async (data) => {
    dispatch(saveStepData({ step: 2, data }));
    if (allowSellerUpgrade) {
      dispatch(setRegistrationStep(3));
      return;
    }
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
            lockedFields={allowSellerUpgrade ? ['firstName', 'lastName', 'email', 'phone'] : []}
            hidePasswordFields={allowSellerUpgrade}
            skipEmailCheck={allowSellerUpgrade}
            upgradeMessage={
              allowSellerUpgrade
                ? 'Aap ka buyer account pehle se verified hai, is liye hum wahi password reuse kar rahe hain.'
                : ''
            }
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
        if (allowSellerUpgrade) {
          return (
            <div className={styles.processingState}>
              <h2>Finalizing Your Seller Upgrade</h2>
              <p>We&apos;re using your verified buyer account to finish setup. Please wait...</p>
            </div>
          );
        }
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

  useEffect(() => {
    if (
      !allowSellerUpgrade ||
      !registrationId ||
      registrationStep !== 5 ||
      upgradeCompletionRef.current
    ) {
      return;
    }

    upgradeCompletionRef.current = true;

    dispatch(
      completeRegistration({
        registrationId,
        agreeToTerms: true,
        agreeToPrivacy: true,
      })
    )
      .unwrap()
      .then(handleRegistrationComplete)
      .catch((error) => {
        console.error('Upgrade completion failed:', error);
      });
  }, [
    allowSellerUpgrade,
    registrationStep,
    registrationId,
    dispatch,
    handleRegistrationComplete,
  ]);

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
