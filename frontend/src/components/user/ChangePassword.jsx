import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { changePassword } from '../../redux/slices/userSlice';
import styles from '../../styles/ChangePassword.module.css';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[a-z]/.test(password)) strength += 10;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getStrengthLabel = (strength) => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (strength) => {
    if (strength < 30) return '#e53e3e';
    if (strength < 60) return '#dd6b20';
    if (strength < 80) return '#d69e2e';
    return '#38a169';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(
      changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      })
    );

    if (changePassword.fulfilled.match(result)) {
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordStrength(0);
    }
    setIsSubmitting(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  return (
    <div className={styles.changePasswordContainer}>
      <div className={styles.card}>
        <div className={styles.header}>
          <FiLock size={24} />
          <h2>Change Password</h2>
          <p>Update your password to keep your account secure</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="oldPassword">Current Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPasswords.old ? 'text' : 'password'}
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleInputChange}
                required
                placeholder="Enter current password"
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => togglePasswordVisibility('old')}
              >
                {showPasswords.old ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newPassword">New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                placeholder="Enter new password"
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {formData.newPassword && (
              <div className={styles.strengthMeter}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: getStrengthColor(passwordStrength),
                    }}
                  ></div>
                </div>
                <span
                  className={styles.strengthLabel}
                  style={{ color: getStrengthColor(passwordStrength) }}
                >
                  {getStrengthLabel(passwordStrength)}
                </span>
              </div>
            )}
            <ul className={styles.requirements}>
              <li className={formData.newPassword.length >= 8 ? styles.met : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? styles.met : ''}>
                One uppercase letter
              </li>
              <li className={/\d/.test(formData.newPassword) ? styles.met : ''}>One number</li>
              <li
                className={
                  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.newPassword) ? styles.met : ''
                }
              >
                One special character
              </li>
            </ul>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className={styles.errorText}>Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={
              isSubmitting ||
              !formData.oldPassword ||
              !formData.newPassword ||
              !formData.confirmPassword ||
              formData.newPassword !== formData.confirmPassword ||
              passwordStrength < 60
            }
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
