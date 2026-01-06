import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { forgotPassword } from '../../redux/slices/authSlice';
import styles from '../../styles/Auth.module.css';

const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.auth);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (values) => {
    const result = await dispatch(forgotPassword(values));
    if (forgotPassword.fulfilled.match(result)) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.authTitle}>Check Your Email</h1>
          <p className={styles.authSubtitle}>
            We&apos;ve sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
          </p>
          <Link to="/login" className={styles.submitBtn}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Forgot Password?</h1>
        <p className={styles.authSubtitle}>
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>

        <Formik
          initialValues={{ email: '' }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  placeholder="you@example.com"
                  className={styles.formInput}
                />
                <ErrorMessage name="email" component="div" className={styles.errorText} />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || status === 'loading'}
                className={styles.submitBtn}
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </Form>
          )}
        </Formik>

        <p className={styles.authFooter}>
          Remember your password?{' '}
          <Link to="/login" className={styles.authLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
