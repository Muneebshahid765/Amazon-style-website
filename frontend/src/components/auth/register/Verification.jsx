import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendVerificationCode, verifyCode, resendVerificationCode, completeRegistration } from '../../../redux/slices/registrationSlice';
import useCountdown from '../../../hooks/useCountdown';
import styles from './Verification.module.css';

const Verification = ({ onPrevious, onComplete, allowSellerUpgrade = false }) => {
  const dispatch = useDispatch();
  const { registrationId, maskedEmail, isEmailVerified, verificationSent, loading } = useSelector(
    (state) => state.registration
  );
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const inputRefs = useRef([]);
  const { seconds, isActive, start } = useCountdown(60);

  useEffect(() => {
    if (allowSellerUpgrade) return;
    if (!verificationSent && registrationId) {
      dispatch(sendVerificationCode(registrationId));
      start();
    }
  }, []);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setVerificationError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newCode = pastedData.split('');
    while (newCode.length < 6) {
      newCode.push('');
    }
    setCode(newCode);

    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleVerifyCode = async () => {
    if (allowSellerUpgrade) {
      onComplete();
      return;
    }
    const codeString = code.join('');
    if (codeString.length !== 6) {
      setVerificationError('Please enter the complete 6-digit code');
      return;
    }

    try {
      await dispatch(verifyCode({ registrationId, code: codeString })).unwrap();
      setVerificationError('');
    } catch (error) {
      setVerificationError(error || 'Invalid verification code');
    }
  };

  const handleResendCode = async () => {
    if (isActive) return;

    try {
      await dispatch(resendVerificationCode(registrationId)).unwrap();
      setCode(['', '', '', '', '', '']);
      setVerificationError('');
      start();
    } catch (error) {
      setVerificationError(error || 'Failed to resend code');
    }
  };

  const handleCompleteRegistration = async () => {
    if (!allowSellerUpgrade && !isEmailVerified) {
      setVerificationError('Please verify your email first');
      return;
    }

    if (!allowSellerUpgrade && (!agreeToTerms || !agreeToPrivacy)) {
      setVerificationError('Please agree to Terms & Conditions and Privacy Policy');
      return;
    }

    try {
      const result = await dispatch(
        completeRegistration({ registrationId, agreeToTerms: allowSellerUpgrade || agreeToTerms, agreeToPrivacy: allowSellerUpgrade || agreeToPrivacy })
      ).unwrap();
      onComplete(result);
    } catch (error) {
      setVerificationError(error || 'Failed to complete registration');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Email Verification</h2>
      {!allowSellerUpgrade && (
        <p className={styles.subtitle}>
          We've sent a 6-digit verification code to
          <br />
          <strong>{maskedEmail}</strong>
        </p>
      )}

      {!allowSellerUpgrade && (
        <div className={styles.codeSection}>
          <div className={styles.codeInputs}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`${styles.codeInput} ${isEmailVerified ? styles.verified : ''}`}
                disabled={isEmailVerified}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {!isEmailVerified && (
            <button
              type="button"
              onClick={handleVerifyCode}
              className={styles.verifyButton}
              disabled={loading || code.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          )}

          {isEmailVerified && (
            <div className={styles.verifiedMessage}>
              <svg className={styles.checkmark} viewBox="0 0 52 52">
                <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
              <p className={styles.verifiedText}>Email verified successfully!</p>
            </div>
          )}

          {verificationError && (
            <div className={styles.errorMessage}>{verificationError}</div>
          )}

          <div className={styles.resendSection}>
            <p className={styles.resendText}>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendCode}
              className={styles.resendButton}
              disabled={isActive || loading}
            >
              {isActive ? `Resend in ${seconds}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.termsSection}>
        <h3 className={styles.termsTitle}>Terms & Conditions</h3>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={allowSellerUpgrade || agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className={styles.checkbox}
            disabled={allowSellerUpgrade}
          />
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.link}>
              Terms & Conditions
            </a>
          </span>
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={allowSellerUpgrade || agreeToPrivacy}
            onChange={(e) => setAgreeToPrivacy(e.target.checked)}
            className={styles.checkbox}
            disabled={allowSellerUpgrade}
          />
          <span>
            I agree to the{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.link}>
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      <div className={styles.buttonGroup}>
        <button type="button" onClick={onPrevious} className={styles.secondaryButton} disabled={loading}>
          Previous
        </button>
        <button
          type="button"
          onClick={handleCompleteRegistration}
          className={styles.primaryButton}
          disabled={
            loading ||
            (!allowSellerUpgrade && (!isEmailVerified || !agreeToTerms || !agreeToPrivacy))
          }
        >
          {loading ? 'Completing...' : allowSellerUpgrade ? 'Finalize Upgrade' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );
};

export default Verification;
