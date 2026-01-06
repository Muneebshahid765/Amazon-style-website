import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { resetPassword } from '../../redux/slices/authSlice';
import styles from '../../styles/Auth.module.css';

const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status } = useSelector((state) => state.auth);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      navigate('/login');
    }
  }, [token, email, navigate]);

  const handleSubmit = async (values) => {
    const result = await dispatch(
      resetPassword({
        token,
        email,
        password: values.password,
      })
    );
    if (resetPassword.fulfilled.match(result)) {
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Reset Password</h1>
        <p className={styles.authSubtitle}>Enter your new password below</p>

        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={resetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="password">New Password</label>
                <Field
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className={styles.formInput}
                />
                <ErrorMessage name="password" component="div" className={styles.errorText} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <Field
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="••••••••"
                  className={styles.formInput}
                />
                <ErrorMessage name="confirmPassword" component="div" className={styles.errorText} />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || status === 'loading'}
                className={styles.submitBtn}
              >
                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
              </button>
            </Form>
          )}
        </Formik>

        <p className={styles.authFooter}>
          <Link to="/login" className={styles.authLink}>
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
