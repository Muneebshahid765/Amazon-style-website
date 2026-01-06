import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../../redux/slices/authSlice';
import styles from '../../styles/Auth.module.css';

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setVerificationStatus('error');
        return;
      }

      const result = await dispatch(verifyEmail({ token, email }));
      if (verifyEmail.fulfilled.match(result)) {
        setVerificationStatus('success');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setVerificationStatus('error');
      }
    };

    verify();
  }, [token, email, dispatch, navigate]);

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {verificationStatus === 'verifying' && (
          <>
            <div className={styles.spinner}></div>
            <h1 className={styles.authTitle}>Verifying Email...</h1>
            <p className={styles.authSubtitle}>Please wait while we verify your email address.</p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.authTitle}>Email Verified!</h1>
            <p className={styles.authSubtitle}>
              Your email has been successfully verified. You will be redirected to the homepage shortly.
            </p>
            <Link to="/" className={styles.submitBtn}>
              Go to Homepage
            </Link>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <h1 className={styles.authTitle}>Verification Failed</h1>
            <p className={styles.authSubtitle}>
              The verification link is invalid or has expired. Please try registering again or contact support.
            </p>
            <Link to="/register" className={styles.submitBtn}>
              Back to Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
